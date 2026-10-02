import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "./auth/auth.module.js";
import { RidesModule } from "./rides/rides.module.js";
import { PrismaService } from "./prisma.service.js";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "development-only-secret",
      signOptions: { expiresIn: "15m" },
    }),
    AuthModule,
    RidesModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}