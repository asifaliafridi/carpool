"use client";

import { FormEvent, useState } from "react";

const cities = ["Peshawar", "Islamabad", "Rawalpindi", "Lahore", "Karachi"];

export default function HomePage() {
  const [fromCity, setFromCity] = useState("Peshawar");
  const [fromArea, setFromArea] = useState("");
  const [toCity, setToCity] = useState("Islamabad");
  const [toArea, setToArea] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("1");
  const [price, setPrice] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fromCity || !fromArea || !toCity || !toArea || !date || !time || !seats || !price || !vehicle) {
      setMessage("Please complete all required fields.");
      return;
    }

    setMessage(
      `Ride ready: ${fromArea}, ${fromCity} → ${toArea}, ${toCity} on ${date} at ${time}.`,
    );
  }

  return (
    <main className="page">
      <section className="hero">
        <span className="eyebrow">CARPOOL</span>
        <h1>Share the ride.<br />Split the cost.</h1>
        <p>Connect with people traveling your route and make every journey simpler.</p>
      </section>

      <section className="card">
        <div className="cardHeader">
          <div>
            <span className="sectionLabel">DRIVER</span>
            <h2>Publish a ride</h2>
          </div>
          <span className="required">* Required fields</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="routeGrid">
            <fieldset>
              <legend>From</legend>
              <label>
                City *
                <select value={fromCity} onChange={(e) => setFromCity(e.target.value)}>
                  {cities.map((city) => <option key={city}>{city}</option>)}
                </select>
              </label>
              <label>
                Area *
                <input value={fromArea} onChange={(e) => setFromArea(e.target.value)} placeholder="e.g. Hayatabad" />
              </label>
              <label>
                Pickup point <span>(optional)</span>
                <input placeholder="e.g. Phase 3 Chowk" />
              </label>
            </fieldset>

            <div className="arrow">→</div>

            <fieldset>
              <legend>To</legend>
              <label>
                City *
                <select value={toCity} onChange={(e) => setToCity(e.target.value)}>
                  {cities.map((city) => <option key={city}>{city}</option>)}
                </select>
              </label>
              <label>
                Area / Sector *
                <input value={toArea} onChange={(e) => setToArea(e.target.value)} placeholder="e.g. F-10" />
              </label>
              <label>
                Drop-off point <span>(optional)</span>
                <input placeholder="e.g. F-10 Markaz" />
              </label>
            </fieldset>
          </div>

          <div className="fields">
            <label>Departure date *<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label>Departure time *<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
            <label>Available seats *<input type="number" min="1" max="20" value={seats} onChange={(e) => setSeats(e.target.value)} /></label>
            <label>Price per seat (PKR) *<input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1500" /></label>
          </div>

          <div className="fields">
            <label className="wide">Vehicle *<input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Toyota Corolla — ABC-123" /></label>
            <label className="wide">Notes <span>(optional)</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Motorway se jaunga" rows={3} /></label>
          </div>

          <button type="submit">Publish ride <span>→</span></button>
          {message && <p className="message">{message}</p>}
        </form>
      </section>
    </main>
  );
}
