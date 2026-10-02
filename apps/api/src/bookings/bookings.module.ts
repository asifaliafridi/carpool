import { Module } from "@nestjs/common";
import { BookingsController } from "./bookings.controller.js";
import { BookingsService } from "./bookings.service.js";
import { PrismaService } from "../prisma.service.js";
import { AuthModule } from "../auth/auth.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [BookingsController],
  providers: [BookingsService, PrismaService],
})
export class BookingsModule {}
