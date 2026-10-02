import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBooking(userId: string, rideId: string, seats: number) {
    if (!Number.isInteger(seats) || seats < 1) throw new BadRequestException("Seats must be a positive integer");

    return this.prisma.$transaction(async (tx) => {
      const ride = await tx.ride.findUnique({ where: { id: rideId } });
      if (!ride) throw new NotFoundException("Ride not found");
      if (ride.driverId === userId) throw new BadRequestException("You cannot book your own ride");
      if (ride.status !== "ACTIVE" && ride.status !== "FULL") throw new BadRequestException("This ride is no longer available");
      if (ride.departureTime <= new Date()) throw new BadRequestException("This ride has already departed");
      if (seats > ride.availableSeats) throw new BadRequestException("Not enough seats available");

      const existing = await tx.booking.findUnique({ where: { rideId_passengerId: { rideId, passengerId: userId } } });
      if (existing && existing.status !== "CANCELLED") throw new BadRequestException("You already have a booking for this ride");

      const booking = existing
        ? await tx.booking.update({ where: { id: existing.id }, data: { seats, status: "PENDING" } })
        : await tx.booking.create({ data: { rideId, passengerId: userId, seats, status: "PENDING" } });

      return tx.booking.findUnique({
        where: { id: booking.id },
        include: { ride: { include: { vehicle: true, driver: { select: { id: true, name: true } } } } },
      });
    });
  }

  async getMyBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { passengerId: userId },
      orderBy: { createdAt: "desc" },
      include: { ride: { include: { vehicle: true, driver: { select: { id: true, name: true } } } } },
    });
  }

  async getRideBookings(userId: string, rideId: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId }, select: { driverId: true } });
    if (!ride) throw new NotFoundException("Ride not found");
    if (ride.driverId !== userId) throw new ForbiddenException("Only the driver can manage ride bookings");

    return this.prisma.booking.findMany({
      where: { rideId },
      orderBy: { createdAt: "asc" },
      include: { passenger: { select: { id: true, name: true, phone: true } } },
    });
  }

  async updateBooking(userId: string, bookingId: string, status: "CONFIRMED" | "CANCELLED") {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { ride: true },
      });
      if (!booking) throw new NotFoundException("Booking not found");

      if (status === "CONFIRMED") {
        if (booking.ride.driverId !== userId) throw new ForbiddenException("Only the driver can confirm a booking");
        if (booking.status !== "PENDING") throw new BadRequestException("Only pending bookings can be confirmed");
        if (booking.ride.departureTime <= new Date()) throw new BadRequestException("This ride has already departed");
        if (booking.seats > booking.ride.availableSeats) throw new BadRequestException("Not enough seats remain");

        const remaining = booking.ride.availableSeats - booking.seats;
        await tx.ride.update({
          where: { id: booking.rideId },
          data: { availableSeats: remaining, status: remaining === 0 ? "FULL" : "ACTIVE" },
        });
        return tx.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED" } });
      }

      if (booking.status === "CANCELLED") return booking;

      if (booking.status === "CONFIRMED") {
        const canCancel = booking.passengerId === userId || booking.ride.driverId === userId;
        if (!canCancel) throw new ForbiddenException("You cannot cancel this booking");
        await tx.ride.update({
          where: { id: booking.rideId },
          data: { availableSeats: { increment: booking.seats }, status: "ACTIVE" },
        });
      } else if (booking.passengerId !== userId && booking.ride.driverId !== userId) {
        throw new ForbiddenException("You cannot cancel this booking");
      }

      return tx.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
    });
  }
}
