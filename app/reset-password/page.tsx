"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "../auth.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="auth-shell"><div className="auth-card">
      <Link href="/" className="brand"><span className="brand-mark">✳</span> appointly</Link>
      <div className="auth-heading"><h1>Choose a new password</h1><p>Use a strong password you have not used elsewhere.</p></div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>New password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label>
        <label>Confirm password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} required /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="button button-dark" type="submit" disabled={loading}>{loading ? "Updating…" : "Update password ↗"}</button>
      </form>
      <p className="auth-bottom"><Link href="/login">Return to login</Link></p>
    </div></main>
  );
}
