"use client";

import { useEffect, useState } from "react";

type Service = { id: string; name: string; description: string | null; duration_minutes: number; price: number };
type Props = { business: { id: string; name: string; slug: string; category: string | null; timezone: string }; services: Service[] };
type Slot = { value: string; label: string };

export default function BookingAvailabilityClient({ business, services }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSlots() {
      setLoading(true); setError("");
      try {
        const response = await fetch(`/api/public/availability?slug=${encodeURIComponent(business.slug)}&date=${date}${serviceId ? `&serviceId=${serviceId}` : ""}`);
        const result = await response.json();
        if (!response.ok) { setError(result.error ?? "Unable to load availability"); setSlots([]); return; }
        setSlots(result.slots ?? []);
      } catch { setError("Unable to load available slots."); setSlots([]); } finally { setLoading(false); }
    }
    loadSlots();
  }, [business.slug, date, serviceId]);

  return <main className="min-h-screen bg-[#f7f8f5] px-6 py-12 text-[#18221d]"><div className="mx-auto max-w-3xl"><div className="mb-8 rounded-3xl bg-[#17221d] p-8 text-white"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b9d5b4]">Book an appointment</p><h1 className="mt-3 text-4xl font-semibold tracking-[-1.5px]">{business.name}</h1><p className="mt-2 text-sm text-[#c2d0c4]">{business.category || "Service business"} · {business.timezone}</p></div><section className="rounded-3xl border border-[#e2e9df] bg-white p-6"><div className="grid gap-5 md:grid-cols-2"><label className="grid gap-2 text-xs font-bold text-[#536358]">Choose service<select value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="rounded-xl border border-[#dfe7db] bg-[#fbfcfa] px-4 py-3 text-sm">{services.length === 0 ? <option value="">Default appointment</option> : services.map((service) => <option key={service.id} value={service.id}>{service.name} · ₹{Number(service.price).toLocaleString("en-IN")}</option>)}</select></label><label className="grid gap-2 text-xs font-bold text-[#536358]">Choose date<input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} className="rounded-xl border border-[#dfe7db] bg-[#fbfcfa] px-4 py-3 text-sm" /></label></div><div className="mt-8 border-t border-[#edf0eb] pt-6"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Available times</h2>{loading && <span className="text-xs text-[#8a978d]">Loading...</span>}</div>{error && <p className="mt-4 rounded-xl bg-[#fff0f0] px-4 py-3 text-sm text-[#a53d3d]">{error}</p>}{!loading && !error && slots.length === 0 && <p className="mt-6 rounded-2xl border border-dashed border-[#ccd9c8] px-5 py-10 text-center text-sm text-[#8a978d]">No available slots for this date. Try another day.</p>}{slots.length > 0 && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{slots.map((slot) => <button key={slot.value} className="rounded-xl border border-[#dce5d8] px-4 py-3 text-sm font-semibold text-[#36543d] hover:border-[#7ca47b] hover:bg-[#edf6e9]">{slot.label}</button>)}</div>}</div></section></div></main>;
}
