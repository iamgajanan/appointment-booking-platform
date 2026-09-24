import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getOwnedBusiness(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, business: null };
  const { data: business } = await supabase.from("businesses").select("id").eq("id", id).eq("owner_id", user.id).maybeSingle();
  return { supabase, user, business };
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, business } = await getOwnedBusiness(id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const values = {
    business_id: id,
    appointment_duration_minutes: Number(body.appointmentDurationMinutes),
    slot_interval_minutes: Number(body.slotIntervalMinutes),
    buffer_minutes: Number(body.bufferMinutes),
    advance_booking_days: Number(body.advanceBookingDays),
    cancellation_notice_hours: Number(body.cancellationNoticeHours),
    updated_at: new Date().toISOString(),
  };

  if (![values.appointment_duration_minutes, values.slot_interval_minutes].every((value) => Number.isInteger(value) && value >= 5 && value <= 480)) return NextResponse.json({ error: "Duration and interval must be whole minutes between 5 and 480." }, { status: 400 });
  if (![values.buffer_minutes, values.cancellation_notice_hours].every((value) => Number.isInteger(value) && value >= 0)) return NextResponse.json({ error: "Buffer and cancellation notice must be valid non-negative numbers." }, { status: 400 });
  if (!Number.isInteger(values.advance_booking_days) || values.advance_booking_days < 1 || values.advance_booking_days > 365) return NextResponse.json({ error: "Advance booking days must be between 1 and 365." }, { status: 400 });

  const { data, error } = await supabase.from("business_booking_settings").upsert(values, { onConflict: "business_id" }).select().single();
  if (error) return NextResponse.json({ error: "Unable to save booking settings" }, { status: 500 });
  return NextResponse.json({ settings: data });
}
