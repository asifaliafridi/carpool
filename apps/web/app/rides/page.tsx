"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { apiRequest } from "../../lib/api";

type Ride = { id: string; originCity: string; originArea: string; destinationCity: string; destinationArea: string; departureTime: string; availableSeats: number; pricePerSeat: number; status: "ACTIVE" | "FULL" | "COMPLETED" | "CANCELLED"; vehicle?: { make: string; model: string } };
const statusLabel: Record<Ride["status"], string> = { ACTIVE: "Active", FULL: "Full", COMPLETED: "Completed", CANCELLED: "Cancelled" };

export default function MyRidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [message, setMessage] = useState("Loading your rides...");
  useEffect(() => {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) { window.location.href = "/login?redirect=/rides"; return; }
    apiRequest<Ride[]>("/rides/me/list", { headers: { Authorization: `Bearer ${token}` } }).then(data => { setRides(data); setMessage(data.length ? "" : "You have not published any rides yet."); }).catch(err => setMessage(err instanceof Error ? err.message : "Unable to load your rides."));
  }, []);
  return <><Navbar /><main className="page"><section className="hero"><span className="eyebrow">DRIVER AREA</span><h1>My rides.</h1><p>Manage your published journeys and review booking requests from riders.</p></section>{message && <section className="card"><p className="message">{message}</p></section>}{rides.length > 0 && <section className="rideResults">{rides.map(ride => <article key={ride.id} className="rideCard"><div><span className="eyebrow">{statusLabel[ride.status]}</span><h2>{ride.originCity} → {ride.destinationCity}</h2><p>{ride.originArea} to {ride.destinationArea}</p><p>{new Date(ride.departureTime).toLocaleString()} · {ride.vehicle ? `${ride.vehicle.make} ${ride.vehicle.model}` : "Vehicle"}</p></div><div className="rideMeta"><strong>{ride.availableSeats}</strong><span>seats left</span><strong>PKR {ride.pricePerSeat}</strong><span>per seat</span></div><Link href={`/rides/${ride.id}/bookings`} className="actionButton">Booking requests →</Link></article>)}</section>}</main></>;
}
