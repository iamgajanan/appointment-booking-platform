import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAppointmentEmail } from "@/lib/notifications/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, serviceId, customerName, customerPhone, customerEmail, startAt, endAt } = body;

    if (!slug || !customerName || !startAt || !endAt) {
      return NextResponse.json({ error: "Missing required booking details" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("slug", slug)
      .maybeSingle();

    if (businessError || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const { data: conflict } = await supabase
      .from("appointments")
      .select("id")
      .eq("business_id", business.id)
      .neq("status", "cancelled")
      .lt("start_at", endAt)
      .gt("end_at", startAt)
      .limit(1)
      .maybeSingle();

    if (conflict) {
      return NextResponse.json({ error: "This time slot is no longer available" }, { status: 409 });
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        business_id: business.id,
        service_id: serviceId || null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone?.trim() || null,
        customer_email: customerEmail?.trim() || null,
        start_at: startAt,
        end_at: endAt,
        status: "confirmed",
      })
      .select("id, start_at, end_at, status")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    let serviceName: string | null = null;
    if (serviceId) {
      const { data: service } = await supabase.from("services").select("name").eq("id", serviceId).maybeSingle();
      serviceName = service?.name ?? null;
    }

    const { data: notificationSettings } = await supabase
      .from("business_notification_settings")
      .select("email_booking_confirmation")
      .eq("business_id", business.id)
      .maybeSingle();

    const shouldSendBookingConfirmation = notificationSettings?.email_booking_confirmation ?? true;

    if (shouldSendBookingConfirmation) {
      await sendAppointmentEmail({
        customerName: customerName.trim(),
        customerEmail: customerEmail?.trim(),
        businessName: business.name,
        serviceName,
        startAt,
        endAt,
        status: "confirmed",
      });
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid booking request" }, { status: 400 });
  }
}
