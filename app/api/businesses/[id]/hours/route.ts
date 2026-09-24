import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type HourInput = { dayOfWeek: number; startTime: string; endTime: string };

const isValidHour = (hour: HourInput) =>
  Number.isInteger(hour.dayOfWeek) &&
  hour.dayOfWeek >= 0 &&
  hour.dayOfWeek <= 6 &&
  /^([01]\d|2[0-3]):[0-5]\d$/.test(hour.startTime) &&
  /^([01]\d|2[0-3]):[0-5]\d$/.test(hour.endTime) &&
  hour.startTime < hour.endTime;

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  let body: { hours?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.hours) || body.hours.length > 7) {
    return NextResponse.json({ error: "hours must be an array containing at most seven entries" }, { status: 400 });
  }

  const hours = body.hours as HourInput[];
  const uniqueDays = new Set(hours.map((hour) => hour.dayOfWeek));
  if (uniqueDays.size !== hours.length || !hours.every(isValidHour)) {
    return NextResponse.json({ error: "Each day must be unique and contain a valid time range" }, { status: 400 });
  }

  const { error: deleteError } = await supabase.from("business_hours").delete().eq("business_id", id);
  if (deleteError) return NextResponse.json({ error: "Unable to update business hours" }, { status: 500 });

  if (hours.length > 0) {
    const { error: insertError } = await supabase.from("business_hours").insert(
      hours.map((hour) => ({ business_id: id, day_of_week: hour.dayOfWeek, start_time: hour.startTime, end_time: hour.endTime })),
    );
    if (insertError) return NextResponse.json({ error: "Unable to update business hours" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
