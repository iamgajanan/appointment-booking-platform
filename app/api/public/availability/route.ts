import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const date = url.searchParams.get("date");
  const serviceId = url.searchParams.get("serviceId");

  if (!slug || !date) return NextResponse.json({ error: "slug and date are required" }, { status: 400 });

  const supabase = await createClient();
  const { data: business } = await supabase.from("businesses").select("id, name, timezone").eq("slug", slug).maybeSingle();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const [{ data: settings }, { data: service }, { data: hours }, { data: appointments }] = await Promise.all([
    supabase.from("business_booking_settings").select("appointment_duration_minutes, slot_interval_minutes, buffer_minutes").eq("business_id", business.id).maybeSingle(),
    serviceId ? supabase.from("services").select("id, duration_minutes").eq("id", serviceId).eq("business_id", business.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("business_hours").select("day_of_week, start_time, end_time, is_closed").eq("business_id", business.id),
    supabase.from("appointments").select("start_at, end_at, status").eq("business_id", business.id).gte("start_at", `${date}T00:00:00`).lt("start_at", `${date}T23:59:59`).neq("status", "cancelled"),
  ]);

  const selectedDate = new Date(`${date}T12:00:00`);
  const dayOfWeek = selectedDate.getDay();
  const dayHours = (hours ?? []).filter((item) => Number(item.day_of_week) === dayOfWeek && !item.is_closed);
  const duration = service?.duration_minutes ?? settings?.appointment_duration_minutes ?? 30;
  const interval = settings?.slot_interval_minutes ?? 30;
  const buffer = settings?.buffer_minutes ?? 0;
  const booked = (appointments ?? []).map((item) => ({ start: new Date(item.start_at).getTime(), end: new Date(item.end_at).getTime() }));
  const slots: { value: string; label: string }[] = [];

  for (const period of dayHours) {
    const start = toMinutes(String(period.start_time).slice(0, 5));
    const end = toMinutes(String(period.end_time).slice(0, 5));
    for (let cursor = start; cursor + duration <= end; cursor += interval) {
      const startIso = new Date(`${date}T${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}:00`).getTime();
      const endIso = new Date(`${date}T${String(Math.floor((cursor + duration + buffer) / 60)).padStart(2, "0")}:${String((cursor + duration + buffer) % 60).padStart(2, "0")}:00`).getTime();
      const overlaps = booked.some((item) => startIso < item.end && endIso > item.start);
      if (!overlaps) slots.push({ value: `${date}T${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}:00`, label: formatTime(cursor) });
    }
  }

  return NextResponse.json({ business, date, slots });
}
