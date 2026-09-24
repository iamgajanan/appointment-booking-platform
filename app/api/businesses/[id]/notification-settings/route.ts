import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const defaults = {
  email_booking_confirmation: true,
  email_status_updates: true,
  email_reminders: true,
  reminder_hours: 24,
};

async function getOwnedBusiness(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, business: null };
  const { data: business } = await supabase.from("businesses").select("id").eq("id", id).eq("owner_id", user.id).maybeSingle();
  return { supabase, user, business };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, business } = await getOwnedBusiness(id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { data, error } = await supabase.from("business_notification_settings").select("email_booking_confirmation, email_status_updates, email_reminders, reminder_hours").eq("business_id", id).maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to load notification settings" }, { status: 500 });
  return NextResponse.json({ settings: data ?? defaults });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, business } = await getOwnedBusiness(id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const reminderHours = Number((body as Record<string, unknown>).reminder_hours);
  if (!Number.isInteger(reminderHours) || reminderHours < 1 || reminderHours > 72) return NextResponse.json({ error: "reminder_hours must be an integer between 1 and 72" }, { status: 400 });

  const settings = {
    business_id: id,
    email_booking_confirmation: Boolean((body as Record<string, unknown>).email_booking_confirmation),
    email_status_updates: Boolean((body as Record<string, unknown>).email_status_updates),
    email_reminders: Boolean((body as Record<string, unknown>).email_reminders),
    reminder_hours: reminderHours,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("business_notification_settings").upsert(settings, { onConflict: "business_id" }).select("email_booking_confirmation, email_status_updates, email_reminders, reminder_hours").single();
  if (error) return NextResponse.json({ error: "Unable to save notification settings" }, { status: 500 });
  return NextResponse.json({ settings: data });
}
