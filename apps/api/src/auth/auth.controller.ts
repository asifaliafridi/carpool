import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard, type AuthenticatedRequest } from "./jwt-auth.guard.js";

class SignupDto { name!: string; phone!: string; password!: string; email?: string; }
class LoginDto { phone!: string; password!: string; }
class VerifyOtpDto { phone!: string; otp!: string; }

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup") signup(@Body() dto: SignupDto) { return this.authService.signup(dto); }
  @Post("login") login(@Body() dto: LoginDto) { return this.authService.login(dto); }
  @Post("verify-otp") verifyOtp(@Body() dto: VerifyOtpDto) { return this.authService.verifyOtp(dto); }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return { userId: request.user.sub, phone: request.user.phone, role: request.user.role };
  }
}