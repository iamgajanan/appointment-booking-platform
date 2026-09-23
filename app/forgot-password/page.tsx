"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import "../auth.css";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false);
    if (resetError) { setError(resetError.message); return; }
    setMessage("If an account exists for this email, a password reset link has been sent.");
  }

  return (
    <main className="auth-shell"><div className="auth-card">
      <Link href="/" className="brand"><span className="brand-mark">✳</span> appointly</Link>
      <div className="auth-heading"><h1>Reset your password</h1><p>Enter your email and we’ll help you get back in.</p></div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-success" role="status">{message}</p>}
        <button className="button button-dark" type="submit" disabled={loading}>{loading ? "Sending…" : "Send reset link ↗"}</button>
      </form>
      <p className="auth-bottom">Remember your password? <Link href="/login">Log in</Link></p><Link href="/" className="back-link">← Back to website</Link>
    </div></main>
  );
}
