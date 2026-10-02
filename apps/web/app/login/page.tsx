"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiRequest, saveAuthTokens } from "../../lib/api";

type LoginResponse = {
  message: string;
  accessToken?: string;
  refreshToken?: string;
  requiresVerification?: boolean;
};

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!phone || !password) {
      setError("Please enter your mobile number and password.");
      return;
    }

    try {
      setLoading(true);
      const result = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      });

      if (result.requiresVerification) {
        window.location.href = `/verify?phone=${encodeURIComponent(phone)}`;
        return;
      }

      if (result.accessToken && result.refreshToken) {
        saveAuthTokens(result.accessToken, result.refreshToken);
        window.location.href = "/";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authPage">
      <div className="authCard">
        <Link href="/" className="brand">CARPOOL</Link>
        <span className="sectionLabel">WELCOME BACK</span>
        <h1>Sign in</h1>
        <p className="authIntro">Find your next ride or manage the rides you share.</p>

        <form onSubmit={submit} className="authForm">
          <label>Mobile number<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567" autoComplete="tel" /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" /></label>
          {error && <p className="formError">{error}</p>}
          <button disabled={loading}>{loading ? "Signing in..." : "Sign in"} <span>→</span></button>
        </form>

        <p className="authFooter">Don&apos;t have an account? <Link href="/signup">Create one</Link></p>
      </div>
    </main>
  );
}
