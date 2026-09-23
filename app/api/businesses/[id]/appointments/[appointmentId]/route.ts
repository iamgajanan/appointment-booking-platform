import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAppointmentEmail } from "@/lib/notifications/email";

const allowedStatuses = new Set(["pending", "confirmed", "cancelled", "completed"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; appointmentId: string }> }) {
  const { id, appointmentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase.from("businesses").select("id, name").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const status = String(body.status ?? "");
  if (!allowedStatuses.has(status)) return NextResponse.json({ error: "Invalid appointment status" }, { status: 400 });

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .eq("business_id", id)
    .select("id, customer_name, customer_email, start_at, end_at, service_id, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let serviceName: string | null = null;
  if (appointment.service_id) {
    const { data: service } = await supabase.from("services").select("name").eq("id", appointment.service_id).maybeSingle();
    serviceName = service?.name ?? null;
  }

  const { data: notificationSettings } = await supabase
    .from("business_notification_settings")
    .select("email_status_updates")
    .eq("business_id", id)
    .maybeSingle();

  const shouldSendStatusUpdate = notificationSettings?.email_status_updates ?? true;

  if (shouldSendStatusUpdate) {
    await sendAppointmentEmail({
      customerName: appointment.customer_name,
      customerEmail: appointment.customer_email,
      businessName: business.name,
      serviceName,
      startAt: appointment.start_at,
      endAt: appointment.end_at,
      status,
    });
  }

  return NextResponse.json({ appointment });
}
