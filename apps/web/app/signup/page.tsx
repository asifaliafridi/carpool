"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiRequest } from "../../lib/api";

type SignupResponse = {
  developmentOtp?: string;
  verification?: { expiresInSeconds: number };
};

export default function SignupPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState<"DRIVER" | "RIDER" | "BOTH">("RIDER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!name || !phone || !password) {
      setError("Name, mobile number and password are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const result = await apiRequest<SignupResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, phone, email: email || undefined, password, userType }),
      });

      const params = new URLSearchParams({ phone });
      if (result.developmentOtp) {
        params.set("devOtp", result.developmentOtp);
      }
      window.location.href = `/verify?${params.toString()}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authPage">
      <div className="authCard">
        <Link href="/" className="brand">CARPOOL</Link>
        <span className="sectionLabel">GET STARTED</span>
        <h1>Create account</h1>
        <p className="authIntro">Choose how you want to use Carpool. You can change this later.</p>

        <form onSubmit={submit} className="authForm">
          <label>How will you use Carpool? *<select value={userType} onChange={(e) => setUserType(e.target.value as "DRIVER" | "RIDER" | "BOTH")}><option value="RIDER">I want to find rides</option><option value="DRIVER">I want to offer rides</option><option value="BOTH">Both — offer and find rides</option></select></label>\n          <label>Full name *<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" /></label>
          <label>Mobile number *<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567" autoComplete="tel" /></label>
          <label>Email <span>(optional)</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
          <label>Password *<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" /></label>
          <label>Confirm password *<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your password" autoComplete="new-password" /></label>
          {error && <p className="formError">{error}</p>}
          <button disabled={loading}>{loading ? "Creating account..." : "Create account"} <span>→</span></button>
        </form>

        <p className="authFooter">Already have an account? <Link href="/login">Sign in</Link></p>
      </div>
    </main>
  );
}
