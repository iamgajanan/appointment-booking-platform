"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Settings = { appointment_duration_minutes: number; slot_interval_minutes: number; buffer_minutes: number; advance_booking_days: number; cancellation_notice_hours: number };
type Service = { id: string; name: string; description: string | null; duration_minutes: number; price: number; is_active: boolean };
type Props = { business: { id: string; name: string }; initialSettings: Settings | null; initialServices: Service[] };

const inputClass = "rounded-xl border border-[#dfe7db] bg-[#fbfcfa] px-4 py-3 text-sm font-normal outline-none focus:border-[#91b18f]";

export default function BookingConfigurationClient({ business, initialSettings, initialServices }: Props) {
  const [settings, setSettings] = useState({ appointmentDurationMinutes: initialSettings?.appointment_duration_minutes ?? 30, slotIntervalMinutes: initialSettings?.slot_interval_minutes ?? 30, bufferMinutes: initialSettings?.buffer_minutes ?? 0, advanceBookingDays: initialSettings?.advance_booking_days ?? 30, cancellationNoticeHours: initialSettings?.cancellation_notice_hours ?? 2 });
  const [services, setServices] = useState(initialServices);
  const [service, setService] = useState({ name: "", description: "", durationMinutes: 30, price: "0" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveSettings() {
    setSavingSettings(true); setMessage(""); setError("");
    try {
      const response = await fetch(`/api/businesses/${business.id}/booking-settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? "Unable to save appointment settings"); else setMessage("Appointment settings saved successfully.");
    } catch { setError("Unable to save appointment settings."); } finally { setSavingSettings(false); }
  }

  async function addService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSavingService(true); setMessage(""); setError("");
    try {
      const response = await fetch(`/api/businesses/${business.id}/services`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(service) });
      const result = await response.json();
      if (!response.ok) { setError(result.error ?? "Unable to add service"); return; }
      setServices((current) => [result.service as Service, ...current]);
      setService({ name: "", description: "", durationMinutes: 30, price: "0" });
      setMessage("Service added successfully.");
    } catch { setError("Unable to add service."); } finally { setSavingService(false); }
  }

  async function removeService(serviceId: string) {
    setMessage(""); setError("");
    const response = await fetch(`/api/businesses/${business.id}/services/${serviceId}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "Unable to remove service"); return; }
    setServices((current) => current.filter((item) => item.id !== serviceId));
    setMessage("Service removed.");
  }

  return <main className="min-h-screen bg-[#f7f8f5] text-[#18221d]">
    <header className="border-b border-[#e5e9e2] bg-white/90"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><Link href={`/dashboard/business/${business.id}/settings`} className="text-sm font-semibold text-[#617662]">← Business settings</Link><span className="text-sm font-bold tracking-[-0.5px]">appointly booking</span></div></header>
    <section className="mx-auto max-w-6xl px-6 py-10"><div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#719075]">Booking configuration</p><h1 className="text-4xl font-semibold tracking-[-1.5px]">{business.name}</h1><p className="mt-2 text-sm text-[#7d8b80]">Configure appointment rules and the services your customers can book.</p></div>
      {message && <div className="mb-6 rounded-2xl border border-[#cfe3c9] bg-[#eef8ea] px-5 py-4 text-sm text-[#4f7d54]">{message}</div>}
      {error && <div className="mb-6 rounded-2xl border border-[#f1c8c8] bg-[#fff0f0] px-5 py-4 text-sm text-[#a53d3d]">{error}</div>}
      <section className="mb-8 rounded-3xl border border-[#e2e9df] bg-white p-6 shadow-[0_20px_70px_rgba(50,75,55,0.05)]"><div className="mb-6"><h2 className="text-xl font-semibold">Appointment settings</h2><p className="mt-1 text-sm text-[#8a978d]">These rules will be used later to generate available booking slots.</p></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-2 text-xs font-bold text-[#536358]">Appointment duration<select value={settings.appointmentDurationMinutes} onChange={(event) => setSettings({ ...settings, appointmentDurationMinutes: Number(event.target.value) })} className={inputClass}>{[15,30,45,60,90,120].map((value) => <option key={value} value={value}>{value} minutes</option>)}</select></label>
        <label className="grid gap-2 text-xs font-bold text-[#536358]">Slot interval<select value={settings.slotIntervalMinutes} onChange={(event) => setSettings({ ...settings, slotIntervalMinutes: Number(event.target.value) })} className={inputClass}>{[5,10,15,20,30,45,60].map((value) => <option key={value} value={value}>{value} minutes</option>)}</select></label>
        <label className="grid gap-2 text-xs font-bold text-[#536358]">Buffer between appointments<select value={settings.bufferMinutes} onChange={(event) => setSettings({ ...settings, bufferMinutes: Number(event.target.value) })} className={inputClass}>{[0,5,10,15,20,30,45,60].map((value) => <option key={value} value={value}>{value} minutes</option>)}</select></label>
        <label className="grid gap-2 text-xs font-bold text-[#536358]">Advance booking window<select value={settings.advanceBookingDays} onChange={(event) => setSettings({ ...settings, advanceBookingDays: Number(event.target.value) })} className={inputClass}>{[7,14,30,60,90,180,365].map((value) => <option key={value} value={value}>{value} days</option>)}</select></label>
        <label className="grid gap-2 text-xs font-bold text-[#536358]">Cancellation notice<select value={settings.cancellationNoticeHours} onChange={(event) => setSettings({ ...settings, cancellationNoticeHours: Number(event.target.value) })} className={inputClass}>{[0,1,2,4,6,12,24,48,72].map((value) => <option key={value} value={value}>{value} hours</option>)}</select></label>
      </div><button onClick={saveSettings} disabled={savingSettings} className="mt-6 rounded-full bg-[#17221d] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{savingSettings ? "Saving..." : "Save appointment settings ↗"}</button></section>

      <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]"><form onSubmit={addService} className="rounded-3xl border border-[#e2e9df] bg-white p-6 shadow-[0_20px_70px_rgba(50,75,55,0.05)]"><div className="mb-6"><h2 className="text-xl font-semibold">Add a service</h2><p className="mt-1 text-sm text-[#8a978d]">Create a bookable service with its duration and price.</p></div><div className="grid gap-4"><label className="grid gap-2 text-xs font-bold text-[#536358]">Service name<input required value={service.name} onChange={(event) => setService({ ...service, name: event.target.value })} placeholder="Dental consultation" className={inputClass}/></label><label className="grid gap-2 text-xs font-bold text-[#536358]">Description<textarea value={service.description} onChange={(event) => setService({ ...service, description: event.target.value })} placeholder="Initial consultation and examination" rows={3} className={`${inputClass} resize-none`}/></label><label className="grid gap-2 text-xs font-bold text-[#536358]">Duration<select value={service.durationMinutes} onChange={(event) => setService({ ...service, durationMinutes: Number(event.target.value) })} className={inputClass}>{[15,30,45,60,90,120].map((value) => <option key={value} value={value}>{value} minutes</option>)}</select></label><label className="grid gap-2 text-xs font-bold text-[#536358]">Price (₹)<input required type="number" min="0" step="0.01" value={service.price} onChange={(event) => setService({ ...service, price: event.target.value })} className={inputClass}/></label><button disabled={savingService} className="rounded-full bg-[#17221d] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{savingService ? "Adding..." : "Add service ↗"}</button></div></form>

      <div className="rounded-3xl border border-[#e2e9df] bg-white p-6 shadow-[0_20px_70px_rgba(50,75,55,0.05)]"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Your services</h2><p className="mt-1 text-sm text-[#8a978d]">{services.length} services configured</p></div><span className="rounded-full bg-[#e8f1e4] px-3 py-1 text-xs font-bold text-[#5c8060]">Services</span></div>{services.length === 0 ? <div className="rounded-2xl border border-dashed border-[#ccd9c8] px-5 py-12 text-center text-sm text-[#8a978d]">No services yet. Add your first service.</div> : <div className="space-y-3">{services.map((item) => <article key={item.id} className="rounded-2xl border border-[#e7ede3] bg-[#fbfcfa] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{item.name}</h3><p className="mt-1 text-sm text-[#8a978d]">{item.description || "No description"}</p></div><button onClick={() => removeService(item.id)} className="text-xs font-semibold text-[#a35b5b]">Remove</button></div><div className="mt-4 flex items-center justify-between border-t border-[#e7ede3] pt-3 text-xs text-[#718076]"><span>{item.duration_minutes} minutes</span><strong className="text-sm text-[#304b36]">₹{Number(item.price).toLocaleString("en-IN")}</strong></div></article>)}</div>}</div></section>
    </section></main>;
}
