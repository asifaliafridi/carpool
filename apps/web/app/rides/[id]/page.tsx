"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import { apiRequest } from "../../../lib/api";

type Ride = {
  id: string;
  originCity: string;
  originArea: string;
  destinationCity: string;
  destinationArea: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  notes?: string | null;
  driver?: { name: string; phone: string };
  vehicle?: { make: string; model: string; color?: string | null; licensePlate: string; seats: number };
};

export default function RideDetailsPage() {
  const params = useParams<{ id: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    apiRequest<Ride>(`/rides/${params.id}`).then(setRide).catch(err => setError(err instanceof Error ? err.message : "Ride not found."));
  }, [params.id]);

  return (
    <>
      <Navbar />
      <main className="page">
        <p><Link href="/find" className="textLink">← Back to rides</Link></p>
        {error && <section className="card"><p className="message">{error}</p></section>}
        {!ride && !error && <p className="message">Loading ride...</p>}
        {ride && (
          <>
            <section className="hero">
              <span className="eyebrow">RIDE DETAILS</span>
              <h1>{ride.originCity} → {ride.destinationCity}</h1>
              <p>{ride.originArea} to {ride.destinationArea} · {new Date(ride.departureTime).toLocaleString()}</p>
            </section>
            <section className="card">
              <div className="profileRow"><span>Available seats</span><strong>{ride.availableSeats}</strong></div>
              <div className="profileRow"><span>Price per seat</span><strong>PKR {ride.pricePerSeat}</strong></div>
              <div className="profileRow"><span>Driver</span><strong>{ride.driver?.name ?? "—"}</strong></div>
              <div className="profileRow"><span>Vehicle</span><strong>{ride.vehicle ? `${ride.vehicle.make} ${ride.vehicle.model}` : "—"}</strong></div>
              {ride.notes && <div className="profileRow"><span>Notes</span><strong>{ride.notes}</strong></div>}
              <p className="message">Booking will be available once the booking flow is connected.</p>
            </section>
          </>
        )}
      </main>
    </>
  );
}
