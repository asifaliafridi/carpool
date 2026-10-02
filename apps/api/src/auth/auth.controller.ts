import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { IsEmail, IsOptional, IsString, Length, Matches, MinLength } from "class-validator";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard, type AuthenticatedRequest } from "./jwt-auth.guard.js";

class SignupDto {
  @IsString() @Length(2, 80) name!: string;
  @IsString() @Matches(/^\+?[0-9]{10,15}$/) phone!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsEmail() email?: string;
}
class LoginDto {
  @IsString() @Matches(/^\+?[0-9]{10,15}$/) phone!: string;
  @IsString() @MinLength(8) password!: string;
}
class VerifyOtpDto {
  @IsString() @Matches(/^\+?[0-9]{10,15}$/) phone!: string;
  @IsString() @Matches(/^\d{6}$/) otp!: string;
}
class RefreshDto { @IsString() @MinLength(20) refreshToken!: string; }

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post("signup") signup(@Body() dto: SignupDto) { return this.authService.signup(dto); }
  @Post("login") login(@Body() dto: LoginDto) { return this.authService.login(dto); }
  @Post("verify-otp") verifyOtp(@Body() dto: VerifyOtpDto) { return this.authService.verifyOtp(dto); }
  @Post("refresh") refresh(@Body() dto: RefreshDto) { return this.authService.refresh(dto.refreshToken); }
  @Post("logout") @UseGuards(JwtAuthGuard) logout(@Body() dto: RefreshDto) { return this.authService.logout(dto.refreshToken); }
  @Get("me") @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return { userId: request.user.sub, phone: request.user.phone, role: request.user.role };
  }
}