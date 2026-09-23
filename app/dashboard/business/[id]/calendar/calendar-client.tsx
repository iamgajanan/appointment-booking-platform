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
};

type Props = { business: { id: string; name: string; timezone: string }; initialAppointments: Appointment[] };

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthFormatter = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });

function keyForDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarDays(month: Date) {
  const first = startOfMonth(month);
  const mondayIndex = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - mondayIndex);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function statusClass(status: string) {
  if (status === "cancelled") return "border-[#f2d0d0] bg-[#fff1f1] text-[#a35b5b]";
  if (status === "completed") return "border-[#d7e8d0] bg-[#eef8e9] text-[#5d805f]";
  return "border-[#d8e5f3] bg-[#edf5ff] text-[#53779b]";
}

export default function CalendarClient({ business, initialAppointments }: Props) {
  const today = new Date();
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(() => keyForDate(today));
  const [view, setView] = useState<"month" | "agenda">("month");

  const days = useMemo(() => buildCalendarDays(month), [month]);
  const appointmentsByDate = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();
    initialAppointments.forEach((appointment) => {
      const date = new Date(appointment.start_at);
      const key = keyForDate(date);
      grouped.set(key, [...(grouped.get(key) ?? []), appointment]);
    });
    return grouped;
  }, [initialAppointments]);
  const selectedAppointments = appointmentsByDate.get(selectedDate) ?? [];
  const monthAppointments = initialAppointments.filter((appointment) => {
    const date = new Date(appointment.start_at);
    return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
  });

  function moveMonth(amount: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  function selectDate(date: Date) {
    setSelectedDate(keyForDate(date));
    if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear()) setMonth(startOfMonth(date));
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#18221d]">
      <header className="border-b border-[#e5e9e2] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <Link href="/dashboard" className="text-sm font-semibold text-[#617662]">← Back to dashboard</Link>
          <span className="text-sm font-bold tracking-[-0.5px]">appointly calendar</span>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10 lg:px-10">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#719075]">Schedule overview</p>
            <h1 className="text-3xl font-semibold tracking-[-1.5px] sm:text-4xl">Your calendar<span className="text-[#9bb89a]">.</span></h1>
            <p className="mt-2 text-sm text-[#7d8b80]">{business.name} · {business.timezone}</p>
          </div>
          <div className="flex w-full items-center gap-2 rounded-full border border-[#dfe8da] bg-white p-1 sm:w-fit">
            <button onClick={() => setView("month")} className={`flex-1 rounded-full px-4 py-2 text-xs font-bold sm:flex-none ${view === "month" ? "bg-[#17221d] text-white" : "text-[#718076]"}`}>Month</button>
            <button onClick={() => setView("agenda")} className={`flex-1 rounded-full px-4 py-2 text-xs font-bold sm:flex-none ${view === "agenda" ? "bg-[#17221d] text-white" : "text-[#718076]"}`}>Agenda</button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="overflow-hidden rounded-[28px] border border-[#e0e8dc] bg-white shadow-[0_20px_70px_rgba(50,75,55,0.05)]">
            <div className="flex flex-col justify-between gap-4 border-b border-[#edf1e9] px-5 py-5 sm:flex-row sm:items-center sm:px-7">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#93a294]">{month.getFullYear()}</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.8px]">{monthFormatter.format(month)}</h2></div>
              <div className="flex items-center justify-between gap-2 sm:justify-end"><button onClick={() => { setMonth(startOfMonth(today)); setSelectedDate(keyForDate(today)); }} className="rounded-full border border-[#dce5d8] px-3 py-2 text-xs font-bold text-[#617662]">Today</button><button onClick={() => moveMonth(-1)} aria-label="Previous month" className="grid h-9 w-9 place-items-center rounded-full border border-[#dce5d8] text-[#617662]">←</button><button onClick={() => moveMonth(1)} aria-label="Next month" className="grid h-9 w-9 place-items-center rounded-full border border-[#dce5d8] text-[#617662]">→</button></div>
            </div>

            {view === "month" ? <div className="p-3 sm:p-5"><div className="grid grid-cols-7 border-b border-[#edf1e9] pb-3">{weekdays.map((day) => <div key={day} className="text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa79b] sm:text-xs">{day}</div>)}</div><div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">{days.map((date) => { const key = keyForDate(date); const isCurrentMonth = date.getMonth() === month.getMonth(); const isSelected = key === selectedDate; const isToday = key === keyForDate(today); const dayAppointments = appointmentsByDate.get(key) ?? []; return <button key={key} onClick={() => selectDate(date)} className={`relative min-h-[68px] rounded-xl border p-1.5 text-left transition sm:min-h-[92px] sm:rounded-2xl sm:p-2.5 ${isSelected ? "border-[#8cac88] bg-[#edf6e9] shadow-[inset_0_0_0_1px_#8cac88]" : "border-transparent hover:border-[#dce8d7] hover:bg-[#fafcf8]"} ${!isCurrentMonth ? "opacity-35" : ""}`}><span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 ${isToday ? "bg-[#17221d] text-white" : isSelected ? "text-[#4f7851]" : "text-[#536358]"}`}>{date.getDate()}</span>{dayAppointments.length > 0 && <div className="mt-2 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#80a77a]"/><span className="hidden text-[10px] font-bold text-[#719075] sm:inline">{dayAppointments.length} {dayAppointments.length === 1 ? "booking" : "bookings"}</span><span className="text-[10px] font-bold text-[#719075] sm:hidden">{dayAppointments.length}</span></div>}</button>; })}</div></div> : <div className="space-y-3 p-5 sm:p-7">{monthAppointments.length === 0 ? <p className="py-10 text-center text-sm text-[#8a978d]">No appointments this month.</p> : monthAppointments.map((appointment) => <button key={appointment.id} onClick={() => selectDate(new Date(appointment.start_at))} className="flex w-full items-center justify-between rounded-2xl border border-[#e5ece1] p-4 text-left hover:bg-[#f8fbf6]"><div><p className="text-sm font-semibold">{appointment.customer_name}</p><p className="mt-1 text-xs text-[#8a978d]">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(appointment.start_at))}</p></div><span className="text-xs font-semibold text-[#617662]">{timeFormatter.format(new Date(appointment.start_at))}</span></button>)}</div>}
          </section>

          <aside className="rounded-[28px] border border-[#e0e8dc] bg-[#17221d] p-5 text-white shadow-[0_20px_70px_rgba(23,34,29,0.12)] sm:p-7">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a4c59c]">Selected day</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.8px]">{new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(new Date(`${selectedDate}T12:00:00`))}</h2><p className="mt-1 text-sm text-[#aebbb0]">{new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date(`${selectedDate}T12:00:00`))}</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-[#c5d9bf]">{selectedAppointments.length} total</span></div>
            <div className="my-6 h-px bg-white/10"/>
            {selectedAppointments.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center"><p className="text-sm font-semibold text-[#d5e2d1]">A quiet day</p><p className="mt-2 text-xs leading-5 text-[#91a296]">No bookings scheduled. Enjoy the breathing room.</p></div> : <div className="space-y-3">{selectedAppointments.map((appointment) => <div key={appointment.id} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{appointment.customer_name}</p><p className="mt-1 text-xs text-[#aebbb0]">{appointment.service_name}</p></div><span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-[#c5d9bf]">{timeFormatter.format(new Date(appointment.start_at))}</span></div><p className="mt-3 text-xs text-[#91a296]">Until {timeFormatter.format(new Date(appointment.end_at))}</p><span className={`mt-3 inline-flex rounded-full border px-2 py-1 text-[10px] font-bold capitalize ${statusClass(appointment.status)}`}>{appointment.status}</span></div>)}</div>}
            <Link href={`/dashboard/business/${business.id}/appointments`} className="mt-6 block rounded-full bg-white px-4 py-3 text-center text-xs font-bold text-[#17221d] hover:bg-[#edf6e9]">Manage all appointments ↗</Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
