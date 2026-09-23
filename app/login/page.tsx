"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "../auth.css";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) { setError(signInError.message); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="auth-shell"><div className="auth-card">
      <Link href="/" className="brand"><span className="brand-mark">✳</span> appointly</Link>
      <div className="auth-heading"><h1>Welcome back</h1><p>Sign in to manage your appointments and businesses.</p></div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required /></label>
        <div className="auth-row"><label className="check"><input type="checkbox" /> Remember me</label><Link href="/forgot-password">Forgot password?</Link></div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="button button-dark" type="submit" disabled={loading}>{loading ? "Signing in…" : "Log in ↗"}</button>
      </form>
      <p className="auth-bottom">New to appointly? <Link href="/signup">Create an account</Link></p>
      <Link href="/" className="back-link">← Back to website</Link>
    </div></main>
  );
}
