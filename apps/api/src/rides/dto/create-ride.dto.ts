import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateRideDto {
  @IsUUID() vehicleId!: string;

  @IsString() originCity!: string;
  @IsString() originArea!: string;
  @IsOptional() @IsString() origin?: string;
  @IsOptional() @IsNumber() originLat?: number;
  @IsOptional() @IsNumber() originLng?: number;

  @IsString() destinationCity!: string;
  @IsString() destinationArea!: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsNumber() destinationLat?: number;
  @IsOptional() @IsNumber() destinationLng?: number;

  @IsString() departureTime!: string;
  @IsInt() @Min(1) availableSeats!: number;
  @IsNumber() @Min(0) pricePerSeat!: number;
  @IsOptional() @IsString() notes?: string;
}
