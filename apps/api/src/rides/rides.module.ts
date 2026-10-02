import { Module } from "@nestjs/common";
import { RidesController } from "./rides.controller.js";
import { RidesService } from "./rides.service.js";
import { PrismaService } from "../prisma.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";

@Module({
  controllers: [RidesController],
  providers: [RidesService, PrismaService, JwtAuthGuard],
})
export class RidesModule {}
