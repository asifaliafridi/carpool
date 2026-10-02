"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year?: number | null;
  color?: string | null;
  licensePlate: string;
  seats: number;
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [seats, setSeats] = useState("4");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadVehicles() {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) { setLoading(false); setMessage("Please sign in to manage your vehicles."); return; }
    try {
      const result = await apiRequest<Vehicle[]>("/rides/vehicles/me", { headers: { Authorization: `Bearer ${token}` } });
      setVehicles(result);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load vehicles.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadVehicles(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const token = localStorage.getItem("carpool_access_token");
    if (!token) { setMessage("Please sign in first."); return; }

    try {
      const vehicle = await apiRequest<Vehicle>("/rides/vehicles", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          make, model, year: year ? Number(year) : undefined,
          color: color || undefined, licensePlate, seats: Number(seats),
        }),
      });
      setVehicles((current) => [vehicle, ...current]);
      setMake(""); setModel(""); setYear(""); setColor(""); setLicensePlate(""); setSeats("4");
      setMessage("Vehicle added successfully.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to add vehicle.");
    }
  }

  return (
    <main className="authPage">
      <section className="authCard vehicleCard">
        <Link href="/" className="brand">CARPOOL</Link>
        <span className="sectionLabel">MY VEHICLES</span>
        <h1>Add a vehicle</h1>
        <p className="authIntro">Add your vehicle once. You can select it whenever you publish a ride.</p>

        <form onSubmit={submit} className="authForm">
          <div className="vehicleFields">
            <label>Make *<input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Toyota" required /></label>
            <label>Model *<input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Corolla" required /></label>
            <label>Year<input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2022" /></label>
            <label>Color<input value={color} onChange={(e) => setColor(e.target.value)} placeholder="White" /></label>
            <label>License plate *<input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder="ABC-123" required /></label>
            <label>Seats *<input type="number" min="1" max="20" value={seats} onChange={(e) => setSeats(e.target.value)} required /></label>
          </div>
          <button disabled={loading}>{loading ? "Loading..." : "Add vehicle"} <span>→</span></button>
          {message && <p className="message">{message}</p>}
        </form>

        <div className="vehicleList">
          <h2>Your vehicles</h2>
          {vehicles.length === 0 && !loading ? <p className="authIntro">No vehicles added yet.</p> : vehicles.map((vehicle) => (
            <article className="vehicleItem" key={vehicle.id}>
              <strong>{vehicle.make} {vehicle.model}</strong>
              <span>{vehicle.licensePlate} · {vehicle.seats} seats{vehicle.color ? ` · ${vehicle.color}` : ""}</span>
            </article>
          ))}
        </div>

        <p className="authFooter"><Link href="/">← Back to publish ride</Link></p>
      </section>
    </main>
  );
}
