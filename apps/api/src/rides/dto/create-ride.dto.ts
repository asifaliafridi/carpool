export class CreateRideDto {
  vehicleId!: string;

  originCity!: string;
  originArea!: string;
  origin!: string;
  originLat?: number;
  originLng?: number;

  destinationCity!: string;
  destinationArea!: string;
  destination!: string;
  destinationLat?: number;
  destinationLng?: number;

  departureTime!: string;
  availableSeats!: number;
  pricePerSeat!: number;
  notes?: string;
}
