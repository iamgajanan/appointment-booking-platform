"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Business = { id: string; name: string };

type NotificationSettings = {
  email_booking_confirmation: boolean;
  email_status_updates: boolean;
  email_reminders: boolean;
  reminder_hours: number;
};

const defaultSettings: NotificationSettings = {
  email_booking_confirmation: true,
  email_status_updates: true,
  email_reminders: true,
  reminder_hours: 24,
};

export default function NotificationsClient({ business }: { business: Business }) {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingTestEmail, setLoadingTestEmail] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch(`/api/businesses/${business.id}/notification-settings`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to load notification settings.");
        setSettings(result.settings ?? defaultSettings);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load notification settings.");
      } finally {
        setLoadingSettings(false);
      }
    }

    loadSettings();
  }, [business.id]);

  function updateSetting<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage("");
    setError("");
  }

  async function saveSettings() {
    setSavingSettings(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/businesses/${business.id}/notification-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save notification settings.");
      setSettings(result.settings ?? settings);
      setMessage("Notification preferences saved successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save notification settings.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function sendTestEmail() {
    setLoadingTestEmail(true);
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
      setLoadingTestEmail(false);
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
        <p className="mt-2 max-w-xl text-sm text-[#7d8b80]">Control which appointment emails are sent to your customers and test your Resend configuration.</p>

        <section className="mt-8 max-w-2xl rounded-3xl border border-[#e2e9df] bg-white p-6 shadow-[0_20px_70px_rgba(50,75,55,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Notification preferences</h2>
              <p className="mt-1 text-sm text-[#8a978d]">Choose which email events are enabled for this business.</p>
            </div>
            <span className="rounded-full bg-[#e8f1e4] px-3 py-1 text-xs font-semibold text-[#4f7d54]">Email</span>
          </div>

          {loadingSettings ? (
            <p className="mt-6 text-sm text-[#8a978d]">Loading preferences...</p>
          ) : (
            <div className="mt-6 space-y-5">
              {[
                { key: "email_booking_confirmation" as const, title: "Booking confirmations", description: "Send an email when a customer successfully books an appointment." },
                { key: "email_status_updates" as const, title: "Appointment status updates", description: "Send emails when an appointment is confirmed, cancelled, or rescheduled." },
                { key: "email_reminders" as const, title: "Appointment reminders", description: "Send reminder emails before an upcoming appointment." },
              ].map((item) => (
                <label key={item.key} className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-[#edf1ea] p-4">
                  <span>
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#8a978d]">{item.description}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings[item.key]}
                    onChange={(event) => updateSetting(item.key, event.target.checked)}
                    className="mt-1 h-5 w-5 accent-[#527b55]"
                  />
                </label>
              ))}

              <label className="block rounded-2xl border border-[#edf1ea] p-4">
                <span className="block text-sm font-semibold">Reminder timing</span>
                <span className="mt-1 block text-xs leading-5 text-[#8a978d]">How many hours before the appointment should the reminder be sent?</span>
                <select
                  value={settings.reminder_hours}
                  onChange={(event) => updateSetting("reminder_hours", Number(event.target.value))}
                  className="mt-3 w-full rounded-xl border border-[#dfe8dc] bg-white px-3 py-2 text-sm outline-none focus:border-[#719075]"
                  disabled={!settings.email_reminders}
                >
                  {[1, 2, 6, 12, 24, 48, 72].map((hours) => <option key={hours} value={hours}>{hours} hours before</option>)}
                </select>
              </label>

              <button onClick={saveSettings} disabled={savingSettings} className="w-full rounded-full bg-[#17221d] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {savingSettings ? "Saving..." : "Save notification preferences"}
              </button>
            </div>
          )}
        </section>

        <section className="mt-6 max-w-2xl rounded-3xl border border-[#e2e9df] bg-white p-6 shadow-[0_20px_70px_rgba(50,75,55,0.05)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f1e4] text-xl">✉</div>
            <div><h2 className="text-xl font-semibold">Send test email</h2><p className="mt-1 text-sm text-[#8a978d]">A sample confirmed appointment email will be sent to your authenticated account email.</p></div>
          </div>
          <button onClick={sendTestEmail} disabled={loadingTestEmail} className="mt-6 w-full rounded-full bg-[#17221d] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{loadingTestEmail ? "Sending..." : "Send test email ↗"}</button>
        </section>

        {message && <div className="mt-6 max-w-2xl rounded-2xl border border-[#cfe3c9] bg-[#eef8ea] px-4 py-3 text-sm text-[#4f7d54]">{message}</div>}
        {error && <div className="mt-6 max-w-2xl rounded-2xl border border-[#f1c8c8] bg-[#fff0f0] px-4 py-3 text-sm text-[#a53d3d]">{error}</div>}
      </section>
    </main>
  );
}
