import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { IsInt, IsIn, IsUUID, Min } from "class-validator";
import { JwtAuthGuard, type AuthenticatedRequest } from "../auth/jwt-auth.guard.js";
import { BookingsService } from "./bookings.service.js";

class CreateBookingDto {
  @IsUUID() rideId!: string;
  @IsInt() @Min(1) seats!: number;
}

class UpdateBookingDto {
  @IsIn(["CONFIRMED", "CANCELLED"]) status!: "CONFIRMED" | "CANCELLED";
}

@Controller("bookings")
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get("me")
  myBookings(@Req() request: AuthenticatedRequest) {
    return this.bookingsService.getMyBookings(request.user.sub);
  }

  @Get("ride/:rideId")
  rideBookings(@Req() request: AuthenticatedRequest, @Param("rideId") rideId: string) {
    return this.bookingsService.getRideBookings(request.user.sub, rideId);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(request.user.sub, dto.rideId, dto.seats);
  }

  @Post(":id/status")
  update(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: UpdateBookingDto) {
    return this.bookingsService.updateBooking(request.user.sub, id, dto.status);
  }
}
