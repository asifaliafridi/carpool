import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, type AuthenticatedRequest } from "../auth/jwt-auth.guard.js";
import { CreateRideDto } from "./dto/create-ride.dto.js";
import { SearchRidesDto } from "./dto/search-rides.dto.js";
import { RidesService } from "./rides.service.js";

class CreateVehicleDto {
  make!: string;
  model!: string;
  year?: number;
  color?: string;
  licensePlate!: string;
  seats!: number;
}

@Controller("rides")
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Get("search")
  search(@Query() query: SearchRidesDto) {
    return this.ridesService.searchRides(query);
  }

  @Get("me/list")
  @UseGuards(JwtAuthGuard)
  myRides(@Req() request: AuthenticatedRequest) {
    return this.ridesService.getMyRides(request.user.sub);
  }

  @Get("vehicles/me")
  @UseGuards(JwtAuthGuard)
  myVehicles(@Req() request: AuthenticatedRequest) {
    return this.ridesService.getMyVehicles(request.user.sub);
  }

  @Post("vehicles")
  @UseGuards(JwtAuthGuard)
  createVehicle(@Req() request: AuthenticatedRequest, @Body() dto: CreateVehicleDto) {
    return this.ridesService.createVehicle(request.user.sub, dto);
  }

  @Get(":id")
  getRide(@Param("id") id: string) {
    return this.ridesService.getRide(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateRideDto) {
    return this.ridesService.createRide(request.user.sub, dto);
  }

  @Post(":id/status")
  @UseGuards(JwtAuthGuard)
  updateStatus(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() body: { status: "CANCELLED" }) {
    return this.ridesService.cancelRide(request.user.sub, id);
  }
}
