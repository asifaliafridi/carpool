import { Module } from "@nestjs/common";
import { BookingsController } from "./bookings.controller.js";
import { BookingsService } from "./bookings.service.js";
import { PrismaService } from "../prisma.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { NotificationsModule } from "../notifications/notifications.module.js";

@Module({
  imports: [NotificationsModule],
  controllers: [BookingsController],
  providers: [BookingsService, PrismaService, JwtAuthGuard],
})
export class BookingsModule {}