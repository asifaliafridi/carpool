import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { randomInt, randomUUID } from "node:crypto";
import { createHash, scryptSync, timingSafeEqual } from "node:crypto";

type SignupInput = {
  name: string;
  phone: string;
  password: string;
  email?: string;
};

type LoginInput = {
  phone: string;
  password: string;
};

type OtpInput = {
  phone: string;
  otp: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async signup(input: SignupInput) {
    const phone = input.phone.trim();
    const existing = await this.prisma.user.findUnique({ where: { phone } });

    if (existing) {
      throw new UnauthorizedException("Mobile number is already registered");
    }

    const passwordHash = this.hashPassword(input.password);

    const user = await this.prisma.user.create({
      data: {
        name: input.name.trim(),
        phone,
        email: input.email?.trim() || undefined,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isVerified: true,
      },
    });

    const otp = String(randomInt(100000, 1000000));

    return {
      message: "Account created. OTP verification is required.",
      user,
      verification: {
        requestId: randomUUID(),
        otp,
        expiresInSeconds: 300,
      },
    };
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { phone: input.phone.trim() },
    });

    if (!user || !this.verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid mobile number or password");
    }

    if (!user.isVerified) {
      return {
        message: "Mobile number is not verified",
        requiresVerification: true,
      };
    }

    return {
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    };
  }

  async verifyOtp(input: OtpInput) {
    // Temporary development implementation.
    // Production OTP delivery/storage will be added with an SMS provider.
    if (!/^\d{6}$/.test(input.otp)) {
      throw new UnauthorizedException("Invalid OTP");
    }

    const user = await this.prisma.user.findUnique({
      where: { phone: input.phone.trim() },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isVerified: true,
      },
    });

    return {
      message: "Mobile number verified",
      user: updated,
    };
  }

  private hashPassword(password: string) {
    const salt = randomUUID();
    const hash = scryptSync(password, salt, 64).toString("hex");
    return salt + ":" + hash;
  }

  private verifyPassword(password: string, stored: string) {
    const [salt, storedHash] = stored.split(":");

    if (!salt || !storedHash) {
      return false;
    }

    const hash = scryptSync(password, salt, 64);
    const expected = Buffer.from(storedHash, "hex");

    return hash.length === expected.length && timingSafeEqual(hash, expected);
  }
}