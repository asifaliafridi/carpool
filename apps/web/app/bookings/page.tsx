"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
      setBookings(await apiRequest<Booking[]>("/bookings/me", {
        headers: { Authorization: \`Bearer \${token}\` },
      }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load bookings.");
    }
  }

  useEffect(() => { void load(); }, []);

  async function cancel(id: string) {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) return;
    try {
      await apiRequest(\`/bookings/\${id}/status\`, {
        method: "POST",
        headers: { Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to cancel booking.");
    }
  }

  const upcoming = bookings.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED");
  const past = bookings.filter((b) => b.status === "COMPLETED" || b.status === "CANCELLED");

  function BookingCard({ booking }: { booking: Booking }) {
    return (
      <article className="rideCard">
        <div>
          <span className={\`statusPill status-\${booking.status.toLowerCase()}\`}>{booking.status}</span>
          <h2>{booking.ride.originCity}, {booking.ride.originArea} → {booking.ride.destinationCity}, {booking.ride.destinationArea}</h2>
          <p>{new Date(booking.ride.departureTime).toLocaleString()} · {booking.seats} seat{booking.seats > 1 ? "s" : ""} · {booking.ride.driver?.name ?? "Driver"}</p>
        </div>
        <div className="rideMeta">
          <strong>PKR {booking.ride.pricePerSeat}</strong>
          <span>per seat</span>
          {booking.ride.vehicle && <span>{booking.ride.vehicle.make} {booking.ride.vehicle.model}</span>}
        </div>
        {booking.status === "PENDING" || booking.status === "CONFIRMED" ? (
          <button className="secondaryButton" onClick={() => cancel(booking.id)}>Cancel</button>
        ) : (
          <Link href={\`/rides/\${booking.ride.id}\`} className="actionButton">View ride →</Link>
        )}
      </article>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="hero">
          <span className="eyebrow">RIDER AREA</span>
          <h1>My bookings.</h1>
          <p>Track requested, confirmed, completed and cancelled rides in one place.</p>
        </section>
        {message && <p className="message">{message}</p>}

        <section className="historySection">
          <div className="sectionHeading"><div><span className="sectionLabel">UPCOMING</span><h2>Next rides</h2></div><span>{upcoming.length} booking{upcoming.length === 1 ? "" : "s"}</span></div>
          <div className="rideResults">
            {upcoming.length === 0 ? <section className="card"><p className="message">No upcoming bookings.</p></section> : upcoming.map((b) => <BookingCard key={b.id} booking={b} />)}
          </div>
        </section>

        <section className="historySection">
          <div className="sectionHeading"><div><span className="sectionLabel">HISTORY</span><h2>Past bookings</h2></div><span>{past.length} booking{past.length === 1 ? "" : "s"}</span></div>
          <div className="rideResults">
            {past.length === 0 ? <section className="card"><p className="message">No past bookings yet.</p></section> : past.map((b) => <BookingCard key={b.id} booking={b} />)}
          </div>
        </section>
      </main>
    </>
  );
}
