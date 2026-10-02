import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { CreateRideDto } from "./dto/create-ride.dto.js";
import { SearchRidesDto } from "./dto/search-rides.dto.js";
import { NotificationsService } from "../notifications/notifications.service.js";

@Injectable()
export class RidesService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  private async completePastRides() {
    const rides = await this.prisma.ride.findMany({
      where: {
        departureTime: { lte: new Date() },
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

  async createRide(userId: string, dto: CreateRideDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isVerified: true },
    });

    if (!user) throw new NotFoundException("User not found");
    if (!user.isVerified) {
      throw new ForbiddenException("Verify your mobile number before creating a ride");
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, ownerId: userId },
    });

    if (!vehicle) throw new ForbiddenException("You can only use your own vehicle");

    const departureTime = new Date(dto.departureTime);
    if (Number.isNaN(departureTime.getTime()) || departureTime <= new Date()) {
      throw new BadRequestException("Departure time must be a valid future date and time");
    }

    const availableSeats = Number(dto.availableSeats);
    const pricePerSeat = Number(dto.pricePerSeat);

    if (!Number.isInteger(availableSeats) || availableSeats < 1 || availableSeats > vehicle.seats) {
      throw new BadRequestException(`Available seats must be between 1 and ${vehicle.seats}`);
    }
    if (!Number.isFinite(pricePerSeat) || pricePerSeat < 0) {
      throw new BadRequestException("Price per seat must be a valid non-negative amount");
    }
    if (!dto.originCity?.trim() || !dto.originArea?.trim()) {
      throw new BadRequestException("Origin city and area are required");
    }
    if (!dto.destinationCity?.trim() || !dto.destinationArea?.trim()) {
      throw new BadRequestException("Destination city and area are required");
    }

    return this.prisma.ride.create({
      data: {
        driverId: userId,
        vehicleId: vehicle.id,
        originCity: dto.originCity.trim(),
        originArea: dto.originArea.trim(),
        origin: dto.origin?.trim() || undefined,
        originLat: dto.originLat,
        originLng: dto.originLng,
        destinationCity: dto.destinationCity.trim(),
        destinationArea: dto.destinationArea.trim(),
        destination: dto.destination?.trim() || undefined,
        destinationLat: dto.destinationLat,
        destinationLng: dto.destinationLng,
        departureTime,
        availableSeats,
        pricePerSeat,
        notes: dto.notes?.trim() || undefined,
      },
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true, phone: true, avatarUrl: true } },
      },
    });
  }

  async searchRides(dto: SearchRidesDto) {
    const where: Record<string, unknown> = {
      status: { in: ["ACTIVE", "FULL"] },
      departureTime: { gte: new Date() },
    };

    if (dto.originCity?.trim()) where.originCity = { contains: dto.originCity.trim(), mode: "insensitive" };
    if (dto.originArea?.trim()) where.originArea = { contains: dto.originArea.trim(), mode: "insensitive" };
    if (dto.destinationCity?.trim()) where.destinationCity = { contains: dto.destinationCity.trim(), mode: "insensitive" };
    if (dto.destinationArea?.trim()) where.destinationArea = { contains: dto.destinationArea.trim(), mode: "insensitive" };

    if (dto.seats !== undefined) {
      const seats = Number(dto.seats);
      if (!Number.isInteger(seats) || seats < 1) {
        throw new BadRequestException("Seats must be a positive integer");
      }
      where.availableSeats = { gte: seats };
    }

    if (dto.date) {
      const start = new Date(`${dto.date}T00:00:00`);
      const end = new Date(`${dto.date}T23:59:59.999`);
      if (Number.isNaN(start.getTime())) throw new BadRequestException("Invalid date");
      where.departureTime = { gte: start, lte: end };
    }

    return this.prisma.ride.findMany({
      where: where as never,
      orderBy: { departureTime: "asc" },
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async getMyRides(userId: string) {
    await this.completePastRides();
    return this.prisma.ride.findMany({
      where: { driverId: userId },
      orderBy: { departureTime: "desc" },
      include: { vehicle: true },
    });
  }

  async getRide(id: string) {
    await this.completePastRides();
    const ride = await this.prisma.ride.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        bookings: { select: { id: true, passengerId: true, seats: true, status: true } },
      },
    });
    if (!ride) throw new NotFoundException("Ride not found");
    return ride;
  }

  async cancelRide(userId: string, rideId: string) {
    await this.completePastRides();
    const result = await this.prisma.$transaction(async (tx) => {
      const ride = await tx.ride.findUnique({
        where: { id: rideId },
        include: { bookings: { select: { id: true, status: true } } },
      });
      if (!ride) throw new NotFoundException("Ride not found");
      if (ride.driverId !== userId) throw new ForbiddenException("Only the driver can cancel this ride");
      if (ride.departureTime <= new Date()) throw new BadRequestException("A ride cannot be cancelled after departure");
      if (ride.status === "CANCELLED") return ride;
      if (ride.status === "COMPLETED") throw new BadRequestException("Completed rides cannot be cancelled");

      await tx.booking.updateMany({
        where: { rideId, status: { in: ["PENDING", "CONFIRMED"] } },
        data: { status: "CANCELLED" },
      });

      return tx.ride.update({
        where: { id: rideId },
        data: { status: "CANCELLED" },
        include: { vehicle: true },
      });
    });

    const passengerIds = (await this.prisma.booking.findMany({
      where: { rideId, status: "CANCELLED" },
      select: { passengerId: true },
    })).map((booking) => booking.passengerId);

    await Promise.all([...new Set(passengerIds)].map((passengerId) =>
      this.notifications.create(
        passengerId,
        "RIDE_CANCELLED",
        "Ride cancelled",
        "The driver cancelled this ride. Your booking has also been cancelled.",
      ),
    ));

    return result;
  }

  async createVehicle(
    userId: string,
    input: { make: string; model: string; year?: number; color?: string; licensePlate: string; seats: number },
  ) {
    const seats = Number(input.seats);
    if (!input.make?.trim() || !input.model?.trim() || !input.licensePlate?.trim()) {
      throw new BadRequestException("Make, model and license plate are required");
    }
    if (!Number.isInteger(seats) || seats < 1 || seats > 20) {
      throw new BadRequestException("Vehicle seats must be between 1 and 20");
    }

    return this.prisma.vehicle.create({
      data: {
        ownerId: userId,
        make: input.make.trim(),
        model: input.model.trim(),
        year: input.year,
        color: input.color?.trim() || undefined,
        licensePlate: input.licensePlate.trim().toUpperCase(),
        seats,
      },
    });
  }

  async getMyVehicles(userId: string) {
    return this.prisma.vehicle.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "desc" } });
  }
}
