"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { apiRequest } from "../../lib/api";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [message, setMessage] = useState("Loading notifications...");

  async function load() {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) { window.location.href = "/login?redirect=/notifications"; return; }
    try {
      const data = await apiRequest<Notification[]>("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(data);
      setMessage(data.length ? "" : "You have no notifications yet.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load notifications.");
    }
  }

  useEffect(() => { void load(); }, []);

  async function markRead(id: string) {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) return;
    try {
      await apiRequest(`/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update notification.");
    }
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="hero">
          <span className="eyebrow">UPDATES</span>
          <h1>Notifications.</h1>
          <p>Stay updated about booking requests, confirmations and ride changes.</p>
        </section>
        {message && <section className="card"><p className="message">{message}</p></section>}
        <section className="notificationList">
          {items.map((item) => (
            <article key={item.id} className={`notificationCard ${item.isRead ? "read" : "unread"}`}>
              <div>
                <span className="sectionLabel">{item.type.replaceAll("_", " ")}</span>
                <h2>{item.title}</h2>
                <p>{item.message}</p>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </div>
              {!item.isRead && <button className="secondaryButton" onClick={() => markRead(item.id)}>Mark as read</button>}
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
