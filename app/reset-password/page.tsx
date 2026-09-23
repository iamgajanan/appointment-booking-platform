"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "../auth.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage("Your password has been updated. You can now sign in.");
    setTimeout(() => router.push("/login"), 1200);
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="brand"><span className="brand-mark">✳</span> appointly</Link>
        <div className="auth-heading"><h1>Choose a new password</h1><p>Use a strong password you have not used elsewhere.</p></div>
        {ready ? <form className="auth-form" onSubmit={handleSubmit}><label>New password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label>{error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-success" role="status">{message}</p>}<button className="button button-dark" type="submit">Update password ↗</button></form> : <p className="auth-error">This reset link is invalid or expired.</p>}
        <Link href="/login" className="back-link">← Back to login</Link>
      </div>
    </main>
  );
}
