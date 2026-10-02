import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service.js";
import { createHash, randomInt, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

type SignupInput = { name: string; phone: string; password: string; email?: string; userType: "DRIVER" | "RIDER" | "BOTH" };
type LoginInput = { phone: string; password: string };
type OtpInput = { phone: string; otp: string };

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  async signup(input: SignupInput) {
    const phone = input.phone.trim();
    if (!phone || !input.name.trim() || input.password.length < 8) throw new BadRequestException("Invalid signup data");
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) throw new BadRequestException("Mobile number is already registered");

    const passwordHash = this.hashPassword(input.password);
    const user = await this.prisma.user.create({
      data: { name: input.name.trim(), phone, email: input.email?.trim() || undefined, passwordHash, userType: input.userType },
      select: { id: true, name: true, phone: true, email: true, role: true, userType: true, isVerified: true },
    });

    const otp = String(randomInt(100000, 1000000));
    const codeHash = this.hashOtp(otp);
    await this.prisma.otpCode.create({ data: { phone, codeHash, expiresAt: new Date(Date.now() + 5 * 60_000) } });

    return {
      message: "Account created. OTP verification is required.",
      user,
      verification: { requestId: randomUUID(), expiresInSeconds: 300 },
      ...(process.env.NODE_ENV !== "production" ? { developmentOtp: otp } : {}),
    };
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({ where: { phone: input.phone.trim() } });
    if (!user || !this.verifyPassword(input.password, user.passwordHash)) throw new UnauthorizedException("Invalid mobile number or password");
    if (!user.isVerified) return { message: "Mobile number is not verified", requiresVerification: true };
    return this.issueTokens(user.id, user.phone, user.role, user.userType);
  }

  async verifyOtp(input: OtpInput) {
    const phone = input.phone.trim();
    const record = await this.prisma.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
    if (!record || record.expiresAt < new Date()) throw new UnauthorizedException("OTP expired or not found");
    if (record.attempts >= 5) throw new UnauthorizedException("Too many OTP attempts");
    if (this.hashOtp(input.otp) !== record.codeHash) {
      await this.prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      throw new UnauthorizedException("Invalid OTP");
    }
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new UnauthorizedException("User not found");
    const updated = await this.prisma.user.update({
      where: { id: user.id }, data: { isVerified: true },
      select: { id: true, name: true, phone: true, email: true, role: true, isVerified: true },
    });
    await this.prisma.otpCode.delete({ where: { id: record.id } });
    return { message: "Mobile number verified", user: updated, ...(await this.issueTokens(updated.id, updated.phone, updated.role, updated.userType)) };
  }

  async refresh(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; phone: string; role: string; jti?: string }>(token);
      const tokenHash = this.hashToken(token);
      const stored = await this.prisma.refreshToken.findFirst({ where: { tokenHash, userId: payload.sub, revokedAt: null } });
      if (!stored || stored.expiresAt < new Date()) throw new UnauthorizedException("Refresh token expired or revoked");
      await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
      return this.issueTokens(payload.sub, payload.phone, payload.role);
    } catch { throw new UnauthorizedException("Invalid refresh token"); }
  }

  async logout(token: string) {
    await this.prisma.refreshToken.updateMany({ where: { tokenHash: this.hashToken(token), revokedAt: null }, data: { revokedAt: new Date() } });
    return { message: "Logged out successfully" };
  }

  async updateUserType(userId: string, userType: "DRIVER" | "RIDER" | "BOTH") {
    return this.prisma.user.update({ where: { id: userId }, data: { userType }, select: { id: true, userType: true } });
  }

  private async issueTokens(userId: string, phone: string, role: string, userType: string) {
    const payload = { sub: userId, phone, role, userType };
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: "15m" });
    const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: "30d" });
    await this.prisma.refreshToken.create({ data: { userId, tokenHash: this.hashToken(refreshToken), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000) } });
    return { message: "Authentication successful", accessToken, refreshToken, tokenType: "Bearer", expiresIn: 900 };
  }

  private hashOtp(otp: string) { return createHash("sha256").update(otp).digest("hex"); }
  private hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
  private hashPassword(password: string) { const salt = randomUUID(); const hash = scryptSync(password, salt, 64).toString("hex"); return salt + ":" + hash; }
  private verifyPassword(password: string, stored: string) {
    const [salt, storedHash] = stored.split(":"); if (!salt || !storedHash) return false;
    const hash = scryptSync(password, salt, 64); const expected = Buffer.from(storedHash, "hex");
    return hash.length === expected.length && timingSafeEqual(hash, expected);
  }
}