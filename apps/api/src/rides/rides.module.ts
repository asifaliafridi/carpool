import { Module } from "@nestjs/common";
import { RidesController } from "./rides.controller.js";
import { RidesService } from "./rides.service.js";
import { PrismaService } from "../prisma.service.js";
import { AuthModule } from "../auth/auth.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [RidesController],
  providers: [RidesService, PrismaService],
})
export class RidesModule {}
