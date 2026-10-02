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
  const [seats, setSeats] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    apiRequest<Ride>(`/rides/${params.id}`).then(setRide).catch(err => setMessage(err instanceof Error ? err.message : "Ride not found."));
  }, [params.id]);

  async function requestBooking() {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) { window.location.href = `/login?redirect=/rides/${params.id}`; return; }
    setLoading(true);
    setMessage("");
    try {
      await apiRequest("/bookings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rideId: params.id, seats }),
      });
      setMessage("Booking request sent. The driver will confirm your seats.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to request this ride.");
    } finally { setLoading(false); }
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <p><Link href="/find" className="textLink">← Back to rides</Link></p>
        {message && !ride && <section className="card"><p className="message">{message}</p></section>}
        {!ride && !message && <p className="message">Loading ride...</p>}
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
              <div className="bookingBox">
                <span className="sectionLabel">BOOK THIS RIDE</span>
                <label>Seats<input type="number" min="1" max={ride.availableSeats} value={seats} onChange={e => setSeats(Number(e.target.value))} /></label>
                <button disabled={loading || ride.availableSeats < 1} onClick={requestBooking}>{loading ? "Sending request..." : "Request booking"} <span>→</span></button>
                {message && <p className="message">{message}</p>}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
