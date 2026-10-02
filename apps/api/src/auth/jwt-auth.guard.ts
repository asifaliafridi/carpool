import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

export type AuthenticatedRequest = {
  headers: { authorization?: string };
  user: { sub: string; phone: string; role: string; userType: string };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Bearer token is required");
    }

    try {
      request.user = await this.jwtService.verifyAsync(authorization.substring(7));
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }
}