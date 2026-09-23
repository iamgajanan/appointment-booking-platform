"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "../auth.css";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setMessage("Account created. Check your email to confirm your account before signing in.");
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="brand"><span className="brand-mark">✳</span> appointly</Link>
        <div className="auth-heading"><h1>Create your account</h1><p>Start managing bookings for your business.</p></div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required /></label>
          <label>Work email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a password" minLength={6} required /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-success" role="status">{message}</p>}
          <button className="button button-dark" type="submit" disabled={loading}>{loading ? "Creating account…" : "Create account ↗"}</button>
        </form>
        <p className="auth-bottom">Already have an account? <Link href="/login">Log in</Link></p>
        <Link href="/" className="back-link">← Back to website</Link>
      </div>
    </main>
  );
}
