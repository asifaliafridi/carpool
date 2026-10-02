"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest, saveAuthTokens } from "../../lib/api";

type VerifyResponse = {
  accessToken: string;
  refreshToken: string;
};

export default function VerifyPage() {
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const devOtp = params.get("devOtp") ?? "";
  const [otp, setOtp] = useState(devOtp);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const result = await apiRequest<VerifyResponse>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, otp }),
      });

      saveAuthTokens(result.accessToken, result.refreshToken);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify your number.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authPage">
      <div className="authCard">
        <Link href="/" className="brand">CARPOOL</Link>
        <span className="sectionLabel">VERIFICATION</span>
        <h1>Verify your number</h1>
        <p className="authIntro">Enter the 6-digit code sent to {phone || "your mobile number"}.</p>

        {devOtp && (
          <div className="devOtp">
            Development OTP: <strong>{devOtp}</strong>
          </div>
        )}

        <form onSubmit={submit} className="authForm">
          <label>OTP<input inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" autoComplete="one-time-code" /></label>
          {error && <p className="formError">{error}</p>}
          <button disabled={loading}>{loading ? "Verifying..." : "Verify number"} <span>→</span></button>
        </form>

        <p className="authFooter"><Link href="/login">Back to sign in</Link></p>
      </div>
    </main>
  );
}
