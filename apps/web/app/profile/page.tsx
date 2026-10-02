"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { apiRequest } from "../../lib/api";

type Me = { userId: string; name?: string; email?: string | null; phone: string; role: string; userType: "DRIVER" | "RIDER" | "BOTH" };

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [userType, setUserType] = useState<Me["userType"]>("RIDER");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) { window.location.href = "/login"; return; }
    apiRequest<Me>("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(data => { setMe(data); setUserType(data.userType); })
      .catch(() => { window.location.href = "/login"; });
  }, []);

  async function saveMode() {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) return;
    try {
      const result = await apiRequest<{ id: string; userType: Me["userType"] }>("/auth/user-type", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userType }),
      });
      setMe(prev => prev ? { ...prev, userType: result.userType } : prev);
      setMessage("Your Carpool mode has been updated.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update your mode.");
    }
  }

  if (!me) return <main className="page"><p className="message">Loading profile...</p></main>;

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="hero"><span className="eyebrow">ACCOUNT</span><h1>Your profile.</h1><p>Manage how you use Carpool. Your mode is flexible and can be changed at any time.</p></section>
        <section className="card profileCard">
          <div className="profileRow"><span>Name</span><strong>{me.name ?? "—"}</strong></div>
          <div className="profileRow"><span>Mobile</span><strong>{me.phone}</strong></div>
          <div className="profileRow"><span>Email</span><strong>{me.email ?? "Not added"}</strong></div>
          <div className="profileMode">
            <div><span className="sectionLabel">CARPOOL MODE</span><h2>How do you want to use Carpool?</h2><p>You can switch between Rider, Driver, or Both whenever your needs change.</p></div>
            <select value={userType} onChange={e => setUserType(e.target.value as Me["userType"])}>
              <option value="RIDER">Rider — find rides</option>
              <option value="DRIVER">Driver — offer rides</option>
              <option value="BOTH">Both — offer and find rides</option>
            </select>
            <button onClick={saveMode}>Save mode <span>→</span></button>
          </div>
          {message && <p className="message">{message}</p>}
        </section>
      </main>
    </>
  );
}
