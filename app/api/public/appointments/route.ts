import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAppointmentEmail } from "@/lib/notifications/email";

const MAX_NAME_LENGTH = 120;
const MAX_PHONE_LENGTH = 32;
const MAX_EMAIL_LENGTH = 254;

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      slug,
      serviceId,
      customerName,
      customerPhone,
      customerEmail,
      startAt,
      endAt,
    } = body ?? {};

    const normalizedName = typeof customerName === "string" ? customerName.trim() : "";
    const normalizedPhone = typeof customerPhone === "string" ? customerPhone.trim() : "";
    const normalizedEmail = typeof customerEmail === "string" ? customerEmail.trim().toLowerCase() : "";

    if (
      typeof slug !== "string" ||
      !slug.trim() ||
      !normalizedName ||
      normalizedName.length > MAX_NAME_LENGTH ||
      !isValidDate(startAt) ||
      !isValidDate(endAt)
    ) {
      return NextResponse.json({ error: "Invalid booking details" }, { status: 400 });
    }

    if (normalizedPhone.length > MAX_PHONE_LENGTH) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    if (normalizedEmail.length > MAX_EMAIL_LENGTH || (normalizedEmail && !isValidEmail(normalizedEmail))) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const start = new Date(startAt);
    const end = new Date(endAt);
    if (end <= start) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("slug", slug.trim())
      .maybeSingle();

    if (businessError || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const { data: conflict, error: conflictError } = await supabase
      .from("appointments")
      .select("id")
      .eq("business_id", business.id)
      .neq("status", "cancelled")
      .lt("start_at", end.toISOString())
      .gt("end_at", start.toISOString())
      .limit(1)
      .maybeSingle();

    if (conflictError) {
      return NextResponse.json({ error: "Unable to verify availability" }, { status: 503 });
    }

    if (conflict) {
      return NextResponse.json({ error: "This time slot is no longer available" }, { status: 409 });
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        business_id: business.id,
        service_id: typeof serviceId === "string" && serviceId ? serviceId : null,
        customer_name: normalizedName,
        customer_phone: normalizedPhone || null,
        customer_email: normalizedEmail || null,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        status: "confirmed",
      })
      .select("id, start_at, end_at, status")
      .single();

    if (error) {
      if (error.code === "23P01" || /overlap|outside business hours|duration|future|booking window/i.test(error.message)) {
        return NextResponse.json({ error: "This appointment is not available for the selected time" }, { status: 409 });
      }

      if (/service is not available|business is not accepting/i.test(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ error: "Unable to create appointment" }, { status: 400 });
    }

    let serviceName: string | null = null;
    if (typeof serviceId === "string" && serviceId) {
      const { data: service } = await supabase
        .from("services")
        .select("name")
        .eq("id", serviceId)
        .eq("business_id", business.id)
        .maybeSingle();
      serviceName = service?.name ?? null;
    }

    const { data: notificationSettings } = await supabase
      .from("business_notification_settings")
      .select("email_booking_confirmation")
      .eq("business_id", business.id)
      .maybeSingle();

    const shouldSendBookingConfirmation = notificationSettings?.email_booking_confirmation ?? true;

    if (shouldSendBookingConfirmation && normalizedEmail) {
      await sendAppointmentEmail({
        customerName: normalizedName,
        customerEmail: normalizedEmail,
        businessName: business.name,
        serviceName,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        status: "confirmed",
      });
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid booking request" }, { status: 400 });
  }
}
