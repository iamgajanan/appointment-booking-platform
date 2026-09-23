"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Business = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  timezone: string;
  phone: string | null;
  whatsapp_number: string | null;
  address: string | null;
  description: string | null;
};

type DbHour = { id: string; day_of_week: number; start_time: string; end_time: string };
type Period = { startTime: string; endTime: string };
type Day = { dayOfWeek: number; name: string; periods: Period[] };

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const createDays = (hours: DbHour[]): Day[] => dayNames.map((name, dayOfWeek) => ({
  dayOfWeek,
  name,
  periods: hours.filter((hour) => hour.day_of_week === dayOfWeek).map((hour) => ({ startTime: hour.start_time.slice(0, 5), endTime: hour.end_time.slice(0, 5) })),
}));

export default function BusinessSettingsClient({ business, initialHours }: { business: Business; initialHours: DbHour[] }) {
  const [details, setDetails] = useState({ name: business.name, category: business.category ?? "", phone: business.phone ?? "", whatsappNumber: business.whatsapp_number ?? "", timezone: business.timezone, address: business.address ?? "", description: business.description ?? "" });
  const [days, setDays] = useState<Day[]>(() => createDays(initialHours));
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeDays = useMemo(() => days.filter((day) => day.periods.length > 0).length, [days]);

  function updateDay(dayOfWeek: number, updater: (day: Day) => Day) {
    setDays((current) => current.map((day) => day.dayOfWeek === dayOfWeek ? updater(day) : day));
  }

  function addPeriod(dayOfWeek: number) {
    updateDay(dayOfWeek, (day) => ({ ...day, periods: [...day.periods, { startTime: "10:00", endTime: "18:00" }] }));
  }

  function removePeriod(dayOfWeek: number, index: number) {
    updateDay(dayOfWeek, (day) => ({ ...day, periods: day.periods.filter((_, periodIndex) => periodIndex !== index) }));
  }

  function updatePeriod(dayOfWeek: number, index: number, field: keyof Period, value: string) {
    updateDay(dayOfWeek, (day) => ({ ...day, periods: day.periods.map((period, periodIndex) => periodIndex === index ? { ...period, [field]: value } : period) }));
  }

  async function saveDetails() {
    setSavingDetails(true); setMessage(""); setError("");
    try {
      const response = await fetch(`/api/businesses/${business.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(details) });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? "Unable to save business details");
      else setMessage("Business details saved successfully.");
    } catch { setError("Unable to save business details."); }
    finally { setSavingDetails(false); }
  }

  async function saveHours() {
    setSavingHours(true); setMessage(""); setError("");
    const hours = days.flatMap((day) => day.periods.map((period) => ({ dayOfWeek: day.dayOfWeek, ...period })));
    try {
      const response = await fetch(`/api/businesses/${business.id}/hours`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hours }) });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? "Unable to save working hours");
      else setMessage("Working hours saved successfully.");
    } catch { setError("Unable to save working hours."); }
    finally { setSavingHours(false); }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#18221d]">
      <header className="border-b border-[#e5e9e2] bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/dashboard" className="text-sm font-semibold text-[#617662]">← Back to dashboard</Link>
          <span className="text-sm font-bold tracking-[-0.5px]">appointly settings</span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#719075]">Business configuration</p><h1 className="text-4xl font-semibold tracking-[-1.5px]">{business.name}</h1><p className="mt-2 text-sm text-[#7d8b80]">Manage your business profile and when customers can book appointments.</p></div>
        {message && <div className="mb-6 rounded-2xl border border-[#cfe3c9] bg-[#eef8ea] px-5 py-4 text-sm text-[#4f7d54]">{message}</div>}
        {error && <div className="mb-6 rounded-2xl border border-[#f1c8c8] bg-[#fff0f0] px-5 py-4 text-sm text-[#a53d3d]">{error}</div>}

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-[#e2e9df] bg-white p-6 shadow-[0_20px_70px_rgba(50,75,55,0.05)]">
            <div className="mb-6"><h2 className="text-xl font-semibold">Business details</h2><p className="mt-1 text-sm text-[#8a978d]">Keep your public business information up to date.</p></div>
            <div className="grid gap-4">
              {([['name','Business name','Pashan Dental Studio'],['category','Category','Dental clinic'],['phone','Phone','+91 98765 43210'],['whatsappNumber','WhatsApp number','+91 98765 43210'],['address','Address','Pashan, Pune']] as const).map(([field, label, placeholder]) => <label key={field} className="grid gap-2 text-xs font-bold text-[#536358]">{label}<input value={details[field]} onChange={(event) => setDetails({ ...details, [field]: event.target.value })} placeholder={placeholder} className="rounded-xl border border-[#dfe7db] bg-[#fbfcfa] px-4 py-3 text-sm font-normal outline-none focus:border-[#91b18f]" /></label>)}
              <label className="grid gap-2 text-xs font-bold text-[#536358]">Timezone<select value={details.timezone} onChange={(event) => setDetails({ ...details, timezone: event.target.value })} className="rounded-xl border border-[#dfe7db] bg-[#fbfcfa] px-4 py-3 text-sm font-normal outline-none focus:border-[#91b18f]"><option>Asia/Kolkata</option><option>Asia/Dubai</option><option>Europe/London</option><option>America/New_York</option></select></label>
              <label className="grid gap-2 text-xs font-bold text-[#536358]">Description<textarea value={details.description} onChange={(event) => setDetails({ ...details, description: event.target.value })} rows={4} placeholder="Tell customers about your business" className="resize-none rounded-xl border border-[#dfe7db] bg-[#fbfcfa] px-4 py-3 text-sm font-normal outline-none focus:border-[#91b18f]" /></label>
              <button onClick={saveDetails} disabled={savingDetails} className="rounded-full bg-[#17221d] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{savingDetails ? "Saving..." : "Save details ↗"}</button>
            </div>
          </section>

          <section className="rounded-3xl border border-[#e2e9df] bg-white p-6 shadow-[0_20px_70px_rgba(50,75,55,0.05)]">
            <div className="mb-6 flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Flexible working hours</h2><p className="mt-1 text-sm text-[#8a978d]">{activeDays} of 7 days configured. Add multiple periods for breaks.</p></div><span className="rounded-full bg-[#e8f1e4] px-3 py-1 text-xs font-bold text-[#5c8060]">Weekly</span></div>
            <div className="space-y-3">
              {days.map((day) => <div key={day.dayOfWeek} className="rounded-2xl border border-[#e7ede3] bg-[#fbfcfa] p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">{day.name}</h3><p className="mt-1 text-xs text-[#8a978d]">{day.periods.length ? `${day.periods.length} time period${day.periods.length > 1 ? 's' : ''}` : "Closed"}</p></div><button onClick={() => addPeriod(day.dayOfWeek)} className="rounded-full border border-[#d8e4d3] px-3 py-2 text-xs font-bold text-[#5d7c5f]">+ Add period</button></div>{day.periods.length > 0 && <div className="mt-3 space-y-2">{day.periods.map((period, index) => <div key={`${day.dayOfWeek}-${index}`} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2"><input type="time" value={period.startTime} onChange={(event) => updatePeriod(day.dayOfWeek, index, "startTime", event.target.value)} className="min-w-0 rounded-lg border border-[#dfe7db] bg-white px-2 py-2 text-sm" /><input type="time" value={period.endTime} onChange={(event) => updatePeriod(day.dayOfWeek, index, "endTime", event.target.value)} className="min-w-0 rounded-lg border border-[#dfe7db] bg-white px-2 py-2 text-sm" /><button onClick={() => removePeriod(day.dayOfWeek, index)} aria-label={`Remove ${day.name} period`} className="rounded-lg px-2 py-2 text-sm text-[#a35b5b] hover:bg-[#fff0f0]">×</button></div>)}</div>}</div>)}
            </div>
            <button onClick={saveHours} disabled={savingHours} className="mt-6 w-full rounded-full bg-[#17221d] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{savingHours ? "Saving hours..." : "Save working hours ↗"}</button>
          </section>
        </div>
      </section>
    </main>
  );
}
