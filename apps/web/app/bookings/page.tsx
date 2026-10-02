"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { apiRequest } from "../../lib/api";

type Booking = {
  id: string;
  seats: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  ride: {
    id: string;
    originCity: string;
    originArea: string;
    destinationCity: string;
    destinationArea: string;
    departureTime: string;
    pricePerSeat: number;
    driver?: { name: string };
    vehicle?: { make: string; model: string };
  };
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) { window.location.href = "/login"; return; }
    try {
      setBookings(await apiRequest<Booking[]>("/bookings/me", { headers: { Authorization: `Bearer ${token}` } }));
    } catch (err) { setMessage(err instanceof Error ? err.message : "Unable to load bookings."); }
  }

  useEffect(() => { void load(); }, []);

  async function cancel(id: string) {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) return;
    try {
      await apiRequest(`/bookings/${id}/status`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: "CANCELLED" }) });
      await load();
    } catch (err) { setMessage(err instanceof Error ? err.message : "Unable to cancel booking."); }
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="hero"><span className="eyebrow">RIDER</span><h1>My bookings.</h1><p>Track requested, confirmed and completed rides in one place.</p></section>
        {message && <p className="message">{message}</p>}
        <section className="rideResults">
          {bookings.length === 0 && !message && <section className="card"><p className="message">You have no bookings yet.</p></section>}
          {bookings.map(booking => (
            <article className="rideCard" key={booking.id}>
              <div>
                <span className="sectionLabel">{booking.status}</span>
                <h2>{booking.ride.originCity}, {booking.ride.originArea} → {booking.ride.destinationCity}, {booking.ride.destinationArea}</h2>
                <p>{new Date(booking.ride.departureTime).toLocaleString()} · {booking.seats} seat{booking.seats > 1 ? "s" : ""}</p>
              </div>
              <div className="rideMeta"><strong>PKR {booking.ride.pricePerSeat}</strong><span>{booking.ride.driver?.name ?? "Driver"}</span></div>
              {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && <button onClick={() => cancel(booking.id)}>Cancel</button>}
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
