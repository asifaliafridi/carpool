import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  private async completePastRides() {
    const now = new Date();
    const rides = await this.prisma.ride.findMany({
      where: {
        departureTime: { lte: now },
        status: { in: ["ACTIVE", "FULL"] },
      },
      select: { id: true },
    });

    for (const ride of rides) {
      await this.prisma.$transaction([
        this.prisma.ride.update({
          where: { id: ride.id },
          data: { status: "COMPLETED" },
        }),
        this.prisma.booking.updateMany({
          where: { rideId: ride.id, status: "CONFIRMED" },
          data: { status: "COMPLETED" },
        }),
        this.prisma.booking.updateMany({
          where: { rideId: ride.id, status: "PENDING" },
          data: { status: "CANCELLED" },
        }),
      ]);
    }
  }

  async createBooking(userId: string, rideId: string, seats: number) {
    if (!Number.isInteger(seats) || seats < 1) {
      throw new BadRequestException("Seats must be a positive integer");
    }

    await this.completePastRides();

    const bookingResult = await this.prisma.$transaction(async (tx) => {
      const ride = await tx.ride.findUnique({ where: { id: rideId } });
      if (!ride) throw new NotFoundException("Ride not found");
      if (ride.driverId === userId) throw new BadRequestException("You cannot book your own ride");
      if (ride.status !== "ACTIVE") throw new BadRequestException("This ride is no longer available");
      if (ride.departureTime <= new Date()) throw new BadRequestException("This ride has already departed");
      if (seats > ride.availableSeats) throw new BadRequestException("Not enough seats available");

      const existing = await tx.booking.findUnique({
        where: { rideId_passengerId: { rideId, passengerId: userId } },
      });
      if (existing && existing.status !== "CANCELLED") {
        throw new BadRequestException("You already have a booking for this ride");
      }

      const booking = existing
        ? await tx.booking.update({
            where: { id: existing.id },
            data: { seats, status: "PENDING" },
          })
        : await tx.booking.create({
            data: { rideId, passengerId: userId, seats, status: "PENDING" },
          });

      return tx.booking.findUnique({
        where: { id: booking.id },
        include: {
          ride: {
            include: {
              vehicle: true,
              driver: { select: { id: true, name: true } },
            },
          },
        },
      });
    });

    if (bookingResult) {
      await this.notifications.create(
        bookingResult.ride.driver.id,
        "BOOKING_REQUEST",
        "New booking request",
        `${bookingResult.ride.driver.name} has received a new booking request from a rider.`,
      );
    }

    return bookingResult;
  }

  async getMyBookings(userId: string) {
    await this.completePastRides();
    return this.prisma.booking.findMany({
      where: { passengerId: userId },
      orderBy: { ride: { departureTime: "desc" } },
      include: {
        ride: {
          include: {
            vehicle: true,
            driver: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async getRideBookings(userId: string, rideId: string) {
    await this.completePastRides();

    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      select: { driverId: true },
    });
    if (!ride) throw new NotFoundException("Ride not found");
    if (ride.driverId !== userId) {
      throw new ForbiddenException("Only the driver can manage ride bookings");
    }

    return this.prisma.booking.findMany({
      where: { rideId },
      orderBy: { createdAt: "asc" },
      include: {
        passenger: { select: { id: true, name: true, phone: true } },
      },
    });
  }

  async updateBooking(userId: string, bookingId: string, status: "CONFIRMED" | "CANCELLED") {
    await this.completePastRides();

    const result = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { ride: true },
      });
      if (!booking) throw new NotFoundException("Booking not found");

      if (booking.ride.departureTime <= new Date()) {
        throw new BadRequestException("Bookings cannot be changed after departure");
      }

      if (status === "CONFIRMED") {
        if (booking.ride.driverId !== userId) {
          throw new ForbiddenException("Only the driver can confirm a booking");
        }
        if (booking.status !== "PENDING") {
          throw new BadRequestException("Only pending bookings can be confirmed");
        }

        const updated = await tx.ride.updateMany({
          where: {
            id: booking.rideId,
            status: "ACTIVE",
            departureTime: { gt: new Date() },
            availableSeats: { gte: booking.seats },
          },
          data: { availableSeats: { decrement: booking.seats } },
        });

        if (updated.count !== 1) {
          throw new BadRequestException("Not enough seats remain for this booking");
        }

        const rideAfter = await tx.ride.findUnique({
          where: { id: booking.rideId },
          select: { availableSeats: true },
        });

        if (rideAfter?.availableSeats === 0) {
          await tx.ride.update({
            where: { id: booking.rideId },
            data: { status: "FULL" },
          });
        }

        return tx.booking.update({
          where: { id: bookingId },
          data: { status: "CONFIRMED" },
        });
      }

      if (booking.status === "CANCELLED") return booking;

      const canCancel =
        booking.passengerId === userId || booking.ride.driverId === userId;
      if (!canCancel) {
        throw new ForbiddenException("You cannot cancel this booking");
      }

      if (booking.status === "CONFIRMED") {
        await tx.ride.update({
          where: { id: booking.rideId },
          data: {
            availableSeats: { increment: booking.seats },
            status: "ACTIVE",
          },
        });
      }

      return tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      });
    });

    if (status === "CONFIRMED") {
      await this.notifications.create(
        (await this.prisma.booking.findUnique({ where: { id: bookingId }, select: { passengerId: true } }))!.passengerId,
        "BOOKING_CONFIRMED",
        "Booking confirmed",
        "Your booking has been confirmed by the driver.",
      );
    } else if (result.status === "CANCELLED" && result.passengerId !== userId) {
      await this.notifications.create(
        result.passengerId,
        "BOOKING_CANCELLED",
        "Booking cancelled",
        "Your booking was cancelled by the driver.",
      );
    } else if (result.status === "CANCELLED" && result.passengerId === userId) {
      const ride = await this.prisma.ride.findUnique({ where: { id: result.rideId }, select: { driverId: true } });
      if (ride) {
        await this.notifications.create(
          ride.driverId,
          "BOOKING_CANCELLED",
          "Booking cancelled",
          "A rider cancelled their booking.",
        );
      }
    }

    return result;
  }
}
