import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const defaults = {
  email_booking_confirmation: true,
  email_status_updates: true,
  email_reminders: true,
  reminder_hours: 24,
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase.from("businesses").select("id").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { data, error } = await supabase.from("business_notification_settings").select("email_booking_confirmation, email_status_updates, email_reminders, reminder_hours").eq("business_id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: data ?? defaults });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase.from("businesses").select("id").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const settings = {
    business_id: id,
    email_booking_confirmation: Boolean(body.email_booking_confirmation),
    email_status_updates: Boolean(body.email_status_updates),
    email_reminders: Boolean(body.email_reminders),
    reminder_hours: Math.min(72, Math.max(1, Number(body.reminder_hours) || 24)),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("business_notification_settings").upsert(settings, { onConflict: "business_id" }).select("email_booking_confirmation, email_status_updates, email_reminders, reminder_hours").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: data });
}
