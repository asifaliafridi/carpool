import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service.js";

class SignupDto {
  name!: string;
  phone!: string;
  password!: string;
  email?: string;
}

class LoginDto {
  phone!: string;
  password!: string;
}

class VerifyOtpDto {
  phone!: string;
  otp!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("verify-otp")
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }
}