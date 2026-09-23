"use client";

import Link from "next/link";
import { useState } from "react";

type Business = { id: string; name: string };

export default function NotificationsClient({ business }: { business: Business }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sendTestEmail() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/businesses/${business.id}/notifications/test-email`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? "Unable to send test email.");
      else setMessage(result.message ?? "Test email sent successfully.");
    } catch {
      setError("Unable to send test email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#18221d]">
      <header className="border-b border-[#e5e9e2] bg-white/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href={`/dashboard/business/${business.id}/settings`} className="text-sm font-semibold text-[#617662]">← Back to settings</Link>
          <span className="text-sm font-bold tracking-[-0.5px]">appointly notifications</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#719075]">Notification center</p>
        <h1 className="text-4xl font-semibold tracking-[-1.5px]">Email notifications</h1>
        <p className="mt-2 max-w-xl text-sm text-[#7d8b80]">Test your Resend configuration before sending real appointment notifications to customers.</p>
        <section className="mt-8 max-w-xl rounded-3xl border border-[#e2e9df] bg-white p-6 shadow-[0_20px_70px_rgba(50,75,55,0.05)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f1e4] text-xl">✉</div>
            <div><h2 className="text-xl font-semibold">Send test email</h2><p className="mt-1 text-sm text-[#8a978d]">A sample confirmed appointment email will be sent to your authenticated account email.</p></div>
          </div>
          {message && <div className="mt-5 rounded-2xl border border-[#cfe3c9] bg-[#eef8ea] px-4 py-3 text-sm text-[#4f7d54]">{message}</div>}
          {error && <div className="mt-5 rounded-2xl border border-[#f1c8c8] bg-[#fff0f0] px-4 py-3 text-sm text-[#a53d3d]">{error}</div>}
          <button onClick={sendTestEmail} disabled={loading} className="mt-6 w-full rounded-full bg-[#17221d] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Sending..." : "Send test email ↗"}</button>
        </section>
      </section>
    </main>
  );
}
