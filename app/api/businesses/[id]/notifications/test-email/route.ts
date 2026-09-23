import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAppointmentEmail } from "@/lib/notifications/email";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) return NextResponse.json({ error: "Authenticated email not found" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const startAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const endAt = new Date(Date.now() + 90 * 60 * 1000).toISOString();
  const result = await sendAppointmentEmail({
    customerName: user.user_metadata?.full_name || user.email.split("@")[0],
    customerEmail: user.email,
    businessName: business.name,
    serviceName: "Test appointment",
    startAt,
    endAt,
    status: "confirmed",
  });

  if (!result.sent) {
    return NextResponse.json({ error: result.skipped ? "Email is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL." : "Unable to send test email." }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: `Test email sent to ${user.email}.` });
}
