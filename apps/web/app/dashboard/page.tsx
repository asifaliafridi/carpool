"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { apiRequest } from "../../lib/api";

type Me = { userId: string; name?: string; email?: string | null; phone: string; role: string; userType: "DRIVER" | "RIDER" | "BOTH" };

const actions = [
  { href: "/find", title: "Find a ride", text: "Search available rides by route, date and seats.", icon: "→" },
  { href: "/", title: "Publish a ride", text: "Share your route and offer seats to other riders.", icon: "+" },
  { href: "/vehicles", title: "My vehicles", text: "Add and manage the vehicles you use for rides.", icon: "▣" },
  { href: "/profile", title: "Profile & mode", text: "Update your account and switch between Rider and Driver.", icon: "○" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("carpool_access_token");
    if (!token) { router.replace("/login"); return; }
    apiRequest<Me>("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(setMe)
      .catch(() => { localStorage.removeItem("carpool_access_token"); router.replace("/login"); });
  }, [router]);

  if (!me) return <main className="page"><p className="message">{error || "Loading dashboard..."}</p></main>;

  return (
    <>
      <Navbar />
      <main className="page dashboardPage">
        <section className="dashboardHero">
          <span className="eyebrow">YOUR CARPOOL</span>
          <h1>Welcome{me.name ? `, ${me.name.split(" ")[0]}` : ""}.</h1>
          <p>Manage your rides, find new journeys and keep your travel profile up to date.</p>
          <span className="modeBadge">{me.userType === "BOTH" ? "Driver + Rider" : me.userType === "DRIVER" ? "Driver" : "Rider"}</span>
        </section>

        <section className="dashboardGrid">
          {actions.map((action) => (
            <Link href={action.href} key={action.href} className="actionCard">
              <span className="actionIcon">{action.icon}</span>
              <h2>{action.title}</h2>
              <p>{action.text}</p>
              <span className="actionArrow">Open →</span>
            </Link>
          ))}
        </section>

        <section className="dashboardStrip">
          <div><span className="sectionLabel">NEXT</span><h2>Bookings and ride history</h2><p>Booking management will be connected after the ride-booking flow is added.</p></div>
          <span className="comingSoon">Coming next</span>
        </section>
      </main>
    </>
  );
}
