"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.replace("/login");
        return;
      }
      setEmail(data.user.email ?? "");
    });
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="brand"><span className="brand-mark">✳</span> appointly</div>
        <div className="auth-heading"><h1>Welcome to your workspace</h1><p>You are signed in as {email || "your account"}.</p></div>
        <p className="auth-success" role="status">Authentication is connected successfully.</p>
        <button className="button button-dark" type="button" onClick={handleLogout}>Sign out ↗</button>
      </div>
    </main>
  );
}
