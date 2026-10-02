"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../../components/Navbar";
import { apiRequest } from "../../../../lib/api";

type Booking = { id: string; seats: number; status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"; createdAt: string; passenger: { id: string; name: string; phone: string } };
const statusLabel: Record<Booking["status"], string> = { PENDING: "Awaiting confirmation", CONFIRMED: "Confirmed", CANCELLED: "Cancelled", COMPLETED: "Completed" };

export default function RideBookingsPage() {
  const params = useParams<{ id: string }>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState("Loading booking requests...");
  const [busyId, setBusyId] = useState("");
  async function loadBookings() {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) { window.location.href = `/login?redirect=/rides/${params.id}/bookings`; return; }
    try { const data = await apiRequest<Booking[]>(`/bookings/ride/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }); setBookings(data); setMessage(data.length ? "" : "No booking requests for this ride yet."); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Unable to load booking requests."); }
  }
  useEffect(() => { if (params.id) loadBookings(); }, [params.id]);
  async function updateBooking(bookingId: string, status: "CONFIRMED" | "CANCELLED") {
    const token = localStorage.getItem("carpool_access_token"); if (!token) return; setBusyId(bookingId); setMessage("");
    try { await apiRequest(`/bookings/${bookingId}/status`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) }); await loadBookings(); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Unable to update booking."); }
    finally { setBusyId(""); }
  }
  return <><Navbar /><main className="page"><p><Link href="/rides" className="textLink">← Back to my rides</Link></p><section className="hero"><span className="eyebrow">BOOKING REQUESTS</span><h1>Manage riders.</h1><p>Review requests for this ride and confirm the seats you want to accept.</p></section>{message && <section className="card"><p className="message">{message}</p></section>}{bookings.length > 0 && <section className="bookingRequests">{bookings.map(booking => <article key={booking.id} className="bookingRequest"><div className="bookingPassenger"><div className="passengerAvatar">{booking.passenger.name.charAt(0).toUpperCase()}</div><div><h2>{booking.passenger.name}</h2><p>{booking.passenger.phone}</p><span>{booking.seats} {booking.seats === 1 ? "seat" : "seats"} · Requested {new Date(booking.createdAt).toLocaleString()}</span></div></div><div className="bookingActions"><span className={`statusPill status-${booking.status.toLowerCase()}`}>{statusLabel[booking.status]}</span>{booking.status === "PENDING" && <><button disabled={busyId === booking.id} onClick={() => updateBooking(booking.id, "CONFIRMED")}>{busyId === booking.id ? "Updating..." : "Confirm"}</button><button className="secondaryButton" disabled={busyId === booking.id} onClick={() => updateBooking(booking.id, "CANCELLED")}>Reject</button></>}{booking.status === "CONFIRMED" && <button className="secondaryButton" disabled={busyId === booking.id} onClick={() => updateBooking(booking.id, "CANCELLED")}>Cancel booking</button>}</div></article>)}</section>}</main></>;
}
