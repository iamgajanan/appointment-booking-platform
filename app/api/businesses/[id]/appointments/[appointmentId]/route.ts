import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAppointmentEmail } from "@/lib/notifications/email";

const allowedStatuses = new Set(["pending", "confirmed", "cancelled", "completed"]);
const reschedulableStatuses = new Set(["pending", "confirmed"]);

function isValidDate(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

function getDatabaseErrorMessage(message: string) {
  if (message.includes("Appointments must be scheduled in the future")) {
    return "Appointments must be scheduled in the future";
  }
  if (message.includes("outside business hours")) {
    return "The selected time is outside business hours";
  }
  if (message.includes("duration does not match")) {
    return "The selected time must match the service duration";
  }
  if (message.includes("booking window")) {
    return "The selected time is outside the allowed booking window";
  }
  if (message.includes("appointments_no_overlapping_active") || message.includes("conflicting key value")) {
    return "This time overlaps another appointment";
  }
  return message;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; appointmentId: string }> },
) {
  const { id, appointmentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { data: existingAppointment } = await supabase
    .from("appointments")
    .select("id, status, start_at, end_at")
    .eq("id", appointmentId)
    .eq("business_id", id)
    .maybeSingle();

  if (!existingAppointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const status = body.status === undefined ? undefined : String(body.status);
  const startAt = body.start_at === undefined ? undefined : String(body.start_at);
  const endAt = body.end_at === undefined ? undefined : String(body.end_at);
  const isRescheduling = startAt !== undefined || endAt !== undefined;

  if (status !== undefined && !allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Invalid appointment status" }, { status: 400 });
  }

  if ((startAt && !endAt) || (!startAt && endAt)) {
    return NextResponse.json({ error: "Both start_at and end_at are required" }, { status: 400 });
  }

  if (isRescheduling && !reschedulableStatuses.has(existingAppointment.status)) {
    return NextResponse.json(
      { error: "Only pending or confirmed appointments can be rescheduled" },
      { status: 409 },
    );
  }

  if (startAt && endAt) {
    if (!isValidDate(startAt) || !isValidDate(endAt)) {
      return NextResponse.json({ error: "Start and end times must be valid dates" }, { status: 400 });
    }

    const startTimestamp = new Date(startAt).getTime();
    const endTimestamp = new Date(endAt).getTime();

    if (startTimestamp >= endTimestamp) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    if (startTimestamp <= Date.now()) {
      return NextResponse.json({ error: "Appointments must be scheduled in the future" }, { status: 400 });
    }

    const { data: conflict } = await supabase
      .from("appointments")
      .select("id")
      .eq("business_id", id)
      .neq("id", appointmentId)
      .neq("status", "cancelled")
      .lt("start_at", new Date(endTimestamp).toISOString())
      .gt("end_at", new Date(startTimestamp).toISOString())
      .limit(1)
      .maybeSingle();

    if (conflict) {
      return NextResponse.json({ error: "This time overlaps another appointment" }, { status: 409 });
    }
  }

  const updates: Record<string, string> = {};
  if (status !== undefined) updates.status = status;
  if (startAt && endAt) {
    updates.start_at = new Date(startAt).toISOString();
    updates.end_at = new Date(endAt).toISOString();
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update(updates)
    .eq("id", appointmentId)
    .eq("business_id", id)
    .select("id, customer_name, customer_email, start_at, end_at, service_id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: getDatabaseErrorMessage(error.message) }, { status: 400 });
  }

  let serviceName: string | null = null;
  if (appointment.service_id) {
    const { data: service } = await supabase
      .from("services")
      .select("name")
      .eq("id", appointment.service_id)
      .maybeSingle();
    serviceName = service?.name ?? null;
  }

  if (status !== undefined || isRescheduling) {
    const { data: notificationSettings } = await supabase
      .from("business_notification_settings")
      .select("email_status_updates")
      .eq("business_id", id)
      .maybeSingle();

    if (notificationSettings?.email_status_updates ?? true) {
      await sendAppointmentEmail({
        customerName: appointment.customer_name,
        customerEmail: appointment.customer_email,
        businessName: business.name,
        serviceName,
        startAt: appointment.start_at,
        endAt: appointment.end_at,
        status: appointment.status,
      });
    }
  }

  return NextResponse.json({ appointment });
}
