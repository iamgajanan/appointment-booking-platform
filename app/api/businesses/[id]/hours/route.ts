import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type HourInput = { dayOfWeek: number; startTime: string; endTime: string };

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

  const body = await request.json();
  const hours = (Array.isArray(body.hours) ? body.hours : []) as HourInput[];
  const validHours = hours.filter(
    (hour) => Number.isInteger(hour.dayOfWeek) && hour.dayOfWeek >= 0 && hour.dayOfWeek <= 6 &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(hour.startTime) &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(hour.endTime) && hour.startTime < hour.endTime,
  );

  const { error: deleteError } = await supabase.from("business_hours").delete().eq("business_id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

  if (validHours.length > 0) {
    const { error: insertError } = await supabase.from("business_hours").insert(
      validHours.map((hour) => ({ business_id: id, day_of_week: hour.dayOfWeek, start_time: hour.startTime, end_time: hour.endTime })),
    );
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
