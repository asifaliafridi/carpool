"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/find", label: "Find a ride" },
  { href: "/", label: "Publish a ride" },
  { href: "/bookings", label: "My bookings" },
  { href: "/vehicles", label: "My vehicles" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function logout() {
    localStorage.removeItem("carpool_access_token");
    localStorage.removeItem("carpool_refresh_token");
    router.push("/login");
  }

  return (
    <header className="nav">
      <Link href="/" className="navBrand">CARPOOL</Link>
      <button className="navToggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">☰</button>
      <nav className={"navLinks " + (open ? "navOpen" : "")}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={pathname === link.href ? "active" : ""} onClick={() => setOpen(false)}>{link.label}</Link>
        ))}
        <Link href="/profile" className={pathname === "/profile" ? "active" : ""} onClick={() => setOpen(false)}>Profile</Link>
        <button className="navLogout" onClick={logout}>Log out</button>
      </nav>
    </header>
  );
}
