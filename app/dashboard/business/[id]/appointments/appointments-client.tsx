"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Appointment = {
  id: string;
  service_name: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  start_at: string;
  end_at: string;
  status: string;
  created_at: string;
};

type Props = { business: { id: string; name: string }; initialAppointments: Appointment[] };
const filters = ["all", "upcoming", "completed", "cancelled"] as const;
type Filter = (typeof filters)[number];

function formatDate(value: string) { return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function toLocalInput(value: string) { const date = new Date(value); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16); }

export default function AppointmentsClient({ business, initialAppointments }: Props) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [rescheduleId, setRescheduleId] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const visibleAppointments = useMemo(() => {
    // This timestamp is intentionally evaluated when filtering so the upcoming view stays current.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const term = search.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const matchesSearch = !term || [appointment.customer_name, appointment.customer_email ?? "", appointment.customer_phone ?? "", appointment.service_name].join(" ").toLowerCase().includes(term);
      if (!matchesSearch) return false;
      if (filter === "completed") return appointment.status === "completed";
      if (filter === "cancelled") return appointment.status === "cancelled";
      if (filter === "upcoming") return appointment.status !== "cancelled" && appointment.status !== "completed" && new Date(appointment.start_at).getTime() >= now;
      return true;
    });
  }, [appointments, filter, search]);

  async function updateAppointment(appointmentId: string, payload: Record<string, string>) {
    setSavingId(appointmentId); setError("");
    try {
      const response = await fetch(`/api/businesses/${business.id}/appointments/${appointmentId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) { setError(result.error ?? "Unable to update appointment"); return; }
      setAppointments((current) => current.map((appointment) => appointment.id === appointmentId ? { ...appointment, ...result.appointment } : appointment));
      setRescheduleId("");
    } catch { setError("Unable to update appointment"); }
    finally { setSavingId(""); }
  }

  function openReschedule(appointment: Appointment) {
    setRescheduleId(appointment.id); setNewStart(toLocalInput(appointment.start_at)); setNewEnd(toLocalInput(appointment.end_at)); setError("");
  }

  return <main className="min-h-screen bg-[#f7f8f5] text-[#18221d]"><header className="border-b border-[#e5e9e2] bg-white/90"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10"><Link href="/dashboard" className="text-sm font-semibold text-[#617662]">← Back to dashboard</Link><span className="text-sm font-bold tracking-[-0.5px]">appointly appointments</span></div></header><section className="mx-auto max-w-7xl px-6 py-10 lg:px-10"><div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#719075]">Appointment management</p><h1 className="text-4xl font-semibold tracking-[-1.5px]">{business.name}</h1><p className="mt-2 text-sm text-[#7d8b80]">View, search, reschedule, and manage your customer bookings.</p></div><div className="mb-5 rounded-3xl border border-[#e0e8dc] bg-white p-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, email, phone or service..." className="w-full rounded-2xl border border-[#dfe7db] bg-[#fbfcfa] px-4 py-3 text-sm text-[#17221d] outline-none placeholder:text-[#8a978d] focus:border-[#91b18f]" /></div><div className="mb-6 flex flex-wrap items-center gap-2">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${filter === item ? "bg-[#17221d] text-white" : "border border-[#dce5d8] bg-white text-[#617662]"}`}>{item}</button>)}<span className="ml-auto text-xs font-semibold text-[#7d8b80]">{visibleAppointments.length} appointments</span></div>{error && <div className="mb-6 rounded-2xl border border-[#f1c8c8] bg-[#fff0f0] px-5 py-4 text-sm text-[#a53d3d]">{error}</div>}{visibleAppointments.length === 0 ? <div className="rounded-3xl border border-dashed border-[#ccd9c8] bg-white px-6 py-16 text-center"><h2 className="text-xl font-semibold">No appointments found</h2><p className="mt-2 text-sm text-[#8a978d]">Bookings matching this search and filter will appear here.</p></div> : <div className="space-y-4">{visibleAppointments.map((appointment) => <article key={appointment.id} className="rounded-3xl border border-[#e2e9df] bg-white p-5 shadow-[0_15px_50px_rgba(50,75,55,0.04)]"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{appointment.customer_name}</h2><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${appointment.status === "cancelled" ? "bg-[#fff0f0] text-[#a35b5b]" : appointment.status === "completed" ? "bg-[#e8f1e4] text-[#5c8060]" : "bg-[#fff6df] text-[#9a742f]"}`}>{appointment.status}</span></div><p className="mt-2 text-sm font-semibold text-[#536358]">{appointment.service_name}</p><p className="mt-1 text-sm text-[#718076]">{formatDate(appointment.start_at)} – {new Intl.DateTimeFormat("en-IN", { timeStyle: "short" }).format(new Date(appointment.end_at))}</p><div className="mt-3 space-y-1 text-sm text-[#8a978d]"><p>{appointment.customer_phone || "No phone number"}</p><p>{appointment.customer_email || "No email"}</p></div></div><div className="flex flex-wrap gap-2">{appointment.status !== "cancelled" && appointment.status !== "completed" && <><button disabled={savingId === appointment.id} onClick={() => updateAppointment(appointment.id, { status: "completed" })} className="rounded-full bg-[#17221d] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Mark completed</button><button disabled={savingId === appointment.id} onClick={() => updateAppointment(appointment.id, { status: "cancelled" })} className="rounded-full border border-[#efcaca] px-4 py-2 text-xs font-semibold text-[#a35b5b] disabled:opacity-50">Cancel</button><button disabled={savingId === appointment.id} onClick={() => openReschedule(appointment)} className="rounded-full border border-[#dce5d8] px-4 py-2 text-xs font-semibold text-[#617662] disabled:opacity-50">Reschedule</button></>}{appointment.status === "cancelled" && <button disabled={savingId === appointment.id} onClick={() => updateAppointment(appointment.id, { status: "confirmed" })} className="rounded-full border border-[#dce5d8] px-4 py-2 text-xs font-semibold text-[#617662] disabled:opacity-50">Restore</button>}</div></div>{rescheduleId === appointment.id && <div className="mt-5 rounded-2xl border border-[#dfe7db] bg-[#f8fbf6] p-4"><div className="grid gap-3 md:grid-cols-2"><label className="text-xs font-semibold text-[#617662]">New start<input type="datetime-local" value={newStart} onChange={(event) => setNewStart(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dfe7db] bg-white px-3 py-2 text-sm text-[#17221d]" /></label><label className="text-xs font-semibold text-[#617662]">New end<input type="datetime-local" value={newEnd} onChange={(event) => setNewEnd(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dfe7db] bg-white px-3 py-2 text-sm text-[#17221d]" /></label></div><div className="mt-3 flex gap-2"><button disabled={!newStart || !newEnd || savingId === appointment.id} onClick={() => updateAppointment(appointment.id, { start_at: new Date(newStart).toISOString(), end_at: new Date(newEnd).toISOString() })} className="rounded-full bg-[#17221d] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Save time</button><button onClick={() => setRescheduleId("")} className="rounded-full border border-[#dce5d8] px-4 py-2 text-xs font-semibold text-[#617662]">Close</button></div></div>}</article>)}</div>}</section></main>;
}
