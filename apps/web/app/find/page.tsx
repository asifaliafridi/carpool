"use client";

import { useState } from "react";
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
  driver?: { name: string };
  vehicle?: { make: string; model: string };
};

export default function FindRidePage() {
  const [fromCity, setFromCity] = useState("");
  const [fromArea, setFromArea] = useState("");
  const [toCity, setToCity] = useState("");
  const [toArea, setToArea] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState("1");
  const [rides, setRides] = useState<Ride[]>([]);
  const [message, setMessage] = useState("");

  async function search() {
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (fromCity) params.set("originCity", fromCity);
      if (fromArea) params.set("originArea", fromArea);
      if (toCity) params.set("destinationCity", toCity);
      if (toArea) params.set("destinationArea", toArea);
      if (date) params.set("date", date);
      if (seats) params.set("seats", seats);
      const result = await apiRequest<Ride[]>(`/rides/search?${params.toString()}`);
      setRides(result);
      if (!result.length) setMessage("No rides found for these filters.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to search rides.");
    }
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="hero"><span className="eyebrow">RIDER</span><h1>Find a ride.</h1><p>Search routes shared by drivers and choose a journey that fits your plans.</p></section>
        <section className="card">
          <div className="fields">
            <label>From city<input value={fromCity} onChange={e => setFromCity(e.target.value)} placeholder="Peshawar" /></label>
            <label>From area<input value={fromArea} onChange={e => setFromArea(e.target.value)} placeholder="Hayatabad" /></label>
            <label>To city<input value={toCity} onChange={e => setToCity(e.target.value)} placeholder="Islamabad" /></label>
            <label>To area<input value={toArea} onChange={e => setToArea(e.target.value)} placeholder="F-10" /></label>
            <label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
            <label>Seats<input type="number" min="1" max="20" value={seats} onChange={e => setSeats(e.target.value)} /></label>
          </div>
          <button onClick={search}>Search rides <span>→</span></button>
          {message && <p className="message">{message}</p>}
        </section>

        <section className="rideResults">
          {rides.map(ride => (
            <article className="rideCard" key={ride.id}>
              <div><span className="sectionLabel">ROUTE</span><h2>{ride.originCity}, {ride.originArea} → {ride.destinationCity}, {ride.destinationArea}</h2><p>{new Date(ride.departureTime).toLocaleString()} · {ride.availableSeats} seats left</p></div>
              <div className="rideMeta"><strong>PKR {ride.pricePerSeat}</strong><span>{ride.driver?.name ?? "Driver"}</span>{ride.vehicle && <span>{ride.vehicle.make} {ride.vehicle.model}</span>}</div>
              <Link href={`/rides/${ride.id}`} className="textLink">View ride →</Link>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
