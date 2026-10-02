"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

const cities = ["Peshawar", "Islamabad", "Rawalpindi", "Lahore", "Karachi"];
type Vehicle = { id: string; make: string; model: string; licensePlate: string; seats: number };

export default function HomePage() {
  const [fromCity, setFromCity] = useState("Peshawar");
  const [fromArea, setFromArea] = useState("");
  const [toCity, setToCity] = useState("Islamabad");
  const [toArea, setToArea] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("1");
  const [price, setPrice] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) { setLoadingVehicles(false); return; }
    apiRequest<Vehicle[]>("/rides/vehicles/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((items) => { setVehicles(items); if (items[0]) setVehicleId(items[0].id); })
      .catch(() => {})
      .finally(() => setLoadingVehicles(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fromCity || !fromArea || !toCity || !toArea || !date || !time || !seats || !price || !vehicleId) {
      setMessage("Please complete all required fields.");
      return;
    }
    const token = localStorage.getItem("carpool_access_token");
    if (!token) { setMessage("Please sign in before publishing a ride."); return; }
    try {
      const result = await apiRequest<{ id: string }>("/rides", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          vehicleId,
          originCity: fromCity,
          originArea: fromArea,
          destinationCity: toCity,
          destinationArea: toArea,
          departureTime: `${date}T${time}`,
          availableSeats: Number(seats),
          pricePerSeat: Number(price),
          notes: notes || undefined,
        }),
      });
      setMessage(`Ride published successfully. Ride ID: ${result.id}`);
    } catch (err) { setMessage(err instanceof Error ? err.message : "Unable to publish ride."); }
  }

  return (
    <>
      <main className="page">
        <section className="hero">
          <span className="eyebrow">CARPOOL</span>
          <h1>Share the ride.<br />Split the cost.</h1>
          <p>Connect with people traveling your route and make every journey simpler.</p>
          <p><Link href="/dashboard" className="textLink">Open dashboard →</Link></p>
        </section>

        <section className="card">
          <div className="cardHeader">
            <div><span className="sectionLabel">DRIVER</span><h2>Publish a ride</h2></div>
            <span className="required">* Required fields</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="routeGrid">
              <fieldset>
                <legend>From</legend>
                <label>City *<select value={fromCity} onChange={(e) => setFromCity(e.target.value)}>{cities.map((city) => <option key={city}>{city}</option>)}</select></label>
                <label>Area *<input value={fromArea} onChange={(e) => setFromArea(e.target.value)} placeholder="e.g. Hayatabad" /></label>
                <label>Pickup point <span>(optional)</span><input placeholder="e.g. Phase 3 Chowk" /></label>
              </fieldset>
              <div className="arrow">→</div>
              <fieldset>
                <legend>To</legend>
                <label>City *<select value={toCity} onChange={(e) => setToCity(e.target.value)}>{cities.map((city) => <option key={city}>{city}</option>)}</select></label>
                <label>Area / Sector *<input value={toArea} onChange={(e) => setToArea(e.target.value)} placeholder="e.g. F-10" /></label>
                <label>Drop-off point <span>(optional)</span><input placeholder="e.g. F-10 Markaz" /></label>
              </fieldset>
            </div>

            <div className="fields">
              <label>Departure date *<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <label>Departure time *<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
              <label>Available seats *<input type="number" min="1" max="20" value={seats} onChange={(e) => setSeats(e.target.value)} /></label>
              <label>Price per seat (PKR) *<input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1500" /></label>
            </div>

            <div className="fields">
              <label className="wide">Vehicle *<select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={loadingVehicles || vehicles.length === 0}><option value="">{loadingVehicles ? "Loading vehicles..." : "Select your vehicle"}</option>{vehicles.map((item) => <option key={item.id} value={item.id}>{item.make} {item.model} — {item.licensePlate} ({item.seats} seats)</option>)}</select>{!loadingVehicles && vehicles.length === 0 && <Link href="/vehicles" className="vehicleLink">Add a vehicle first →</Link>}</label>
              <label className="wide">Notes <span>(optional)</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Motorway se jaunga" rows={3} /></label>
            </div>

            <button type="submit">Publish ride <span>→</span></button>
            {message && <p className="message">{message}</p>}
          </form>
        </section>
      </main>
    </>
  );
}
