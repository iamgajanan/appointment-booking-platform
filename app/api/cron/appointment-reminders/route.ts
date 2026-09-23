import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAppointmentEmail } from "@/lib/notifications/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase server configuration is missing" }, { status: 500 });
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const now = new Date();
  const maximumReminderHours = 72;
  const until = new Date(now.getTime() + maximumReminderHours * 60 * 60 * 1000);
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("id, business_id, service_id, customer_name, customer_email, start_at, end_at, status")
    .in("status", ["pending", "confirmed"])
    .not("customer_email", "is", null)
    .gte("start_at", now.toISOString())
    .lte("start_at", until.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  let skipped = 0;
  let disabled = 0;

  for (const appointment of appointments ?? []) {
    const { data: settings } = await supabase
      .from("business_notification_settings")
      .select("email_reminders, reminder_hours")
      .eq("business_id", appointment.business_id)
      .maybeSingle();

    const remindersEnabled = settings?.email_reminders ?? true;
    const reminderHours = settings?.reminder_hours ?? 24;

    if (!remindersEnabled) {
      disabled += 1;
      continue;
    }

    const reminderDueAt = new Date(new Date(appointment.start_at).getTime() - reminderHours * 60 * 60 * 1000);
    const reminderWindowStart = new Date(now.getTime() - 60 * 60 * 1000);

    if (reminderDueAt > now || reminderDueAt < reminderWindowStart) {
      skipped += 1;
      continue;
    }

    const notificationType = `${reminderHours}_hour_reminder`;
    const { data: existing } = await supabase
      .from("notification_logs")
      .select("id")
      .eq("appointment_id", appointment.id)
      .eq("notification_type", notificationType)
      .maybeSingle();

    if (existing) {
      skipped += 1;
      continue;
    }

    const [{ data: business }, { data: service }] = await Promise.all([
      supabase.from("businesses").select("name").eq("id", appointment.business_id).maybeSingle(),
      supabase.from("services").select("name").eq("id", appointment.service_id).maybeSingle(),
    ]);

    if (!business) continue;

    const result = await sendAppointmentEmail({
      customerName: appointment.customer_name,
      customerEmail: appointment.customer_email,
      businessName: business.name,
      serviceName: service?.name,
      startAt: appointment.start_at,
      endAt: appointment.end_at,
      status: "reminder",
    });

    if (result.sent) {
      await supabase.from("notification_logs").insert({ appointment_id: appointment.id, notification_type: notificationType });
      sent += 1;
    }
  }

  return NextResponse.json({ success: true, sent, skipped, disabled, checked: appointments?.length ?? 0 });
}
