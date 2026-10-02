"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { apiRequest } from "../../lib/api";

type Ride = {
  id: string;
  originCity: string;
  originArea: string;
  destinationCity: string;
  destinationArea: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  status: "ACTIVE" | "FULL" | "COMPLETED" | "CANCELLED";
  vehicle?: { make: string; model: string };
};

const statusLabel: Record<Ride["status"], string> = {
  ACTIVE: "Active", FULL: "Full", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

export default function MyRidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [message, setMessage] = useState("Loading your rides...");
  const [busyId, setBusyId] = useState("");

  async function load() {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) { window.location.href = "/login?redirect=/rides"; return; }
    try {
      const data = await apiRequest<Ride[]>("/rides/me/list", {
        headers: { Authorization: \`Bearer \${token}\` },
      });
      setRides(data);
      setMessage(data.length ? "" : "You have not published any rides yet.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load your rides.");
    }
  }

  useEffect(() => { void load(); }, []);

  async function cancelRide(id: string) {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) return;
    if (!window.confirm("Cancel this ride? Pending and confirmed bookings will also be cancelled.")) return;
    setBusyId(id);
    setMessage("");
    try {
      await apiRequest(\`/rides/\${id}/status\`, {
        method: "POST",
        headers: { Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to cancel ride.");
    } finally {
      setBusyId("");
    }
  }

  const upcoming = rides.filter((r) => r.status === "ACTIVE" || r.status === "FULL");
  const past = rides.filter((r) => r.status === "COMPLETED" || r.status === "CANCELLED");

  function RideCard({ ride }: { ride: Ride }) {
    return (
      <article className="rideCard">
        <div>
          <span className={\`statusPill status-\${ride.status.toLowerCase()}\`}>{statusLabel[ride.status]}</span>
          <h2>{ride.originCity} → {ride.destinationCity}</h2>
          <p>{ride.originArea} to {ride.destinationArea}</p>
          <p>{new Date(ride.departureTime).toLocaleString()} · {ride.vehicle ? \`\${ride.vehicle.make} \${ride.vehicle.model}\` : "Vehicle"}</p>
        </div>
        <div className="rideMeta">
          <strong>{ride.availableSeats}</strong><span>seats left</span>
          <strong>PKR {ride.pricePerSeat}</strong><span>per seat</span>
        </div>
        <div className="rideActions">
          <Link href={\`/rides/\${ride.id}/bookings\`} className="actionButton">Booking requests →</Link>
          {(ride.status === "ACTIVE" || ride.status === "FULL") && (
            <button className="secondaryButton" disabled={busyId === ride.id} onClick={() => cancelRide(ride.id)}>
              {busyId === ride.id ? "Cancelling..." : "Cancel ride"}
            </button>
          )}
        </div>
      </article>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="hero">
          <span className="eyebrow">DRIVER AREA</span>
          <h1>My rides.</h1>
          <p>Manage upcoming journeys, booking requests and your ride history.</p>
        </section>
        {message && <section className="card"><p className="message">{message}</p></section>}

        <section className="historySection">
          <div className="sectionHeading"><div><span className="sectionLabel">UPCOMING</span><h2>Next rides</h2></div><span>{upcoming.length} ride{upcoming.length === 1 ? "" : "s"}</span></div>
          <div className="rideResults">
            {upcoming.length === 0 ? <section className="card"><p className="message">No upcoming rides.</p></section> : upcoming.map((r) => <RideCard key={r.id} ride={r} />)}
          </div>
        </section>

        <section className="historySection">
          <div className="sectionHeading"><div><span className="sectionLabel">HISTORY</span><h2>Past rides</h2></div><span>{past.length} ride{past.length === 1 ? "" : "s"}</span></div>
          <div className="rideResults">
            {past.length === 0 ? <section className="card"><p className="message">No past rides yet.</p></section> : past.map((r) => <RideCard key={r.id} ride={r} />)}
          </div>
        </section>
      </main>
    </>
  );
}
