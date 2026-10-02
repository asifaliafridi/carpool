import { Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, type AuthenticatedRequest } from "../auth/jwt-auth.guard.js";
import { NotificationsService } from "./notifications.service.js";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.notificationsService.list(request.user.sub);
  }

  @Patch(":id/read")
  markRead(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.notificationsService.markRead(request.user.sub, id);
  }
}
