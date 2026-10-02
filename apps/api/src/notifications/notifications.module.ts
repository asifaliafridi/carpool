import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller.js";
import { NotificationsService } from "./notifications.service.js";
import { PrismaService } from "../prisma.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, PrismaService, JwtAuthGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
