import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = new Set(["pending", "confirmed", "cancelled", "completed"]);
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const searchParams = new URL(request.url).searchParams;
  const customer = searchParams.get("customer")?.trim();
  const email = searchParams.get("email")?.trim();
  const phone = searchParams.get("phone")?.trim();
  const serviceId = searchParams.get("serviceId")?.trim();
  const status = searchParams.get("status")?.trim();
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();
  const parsedLimit = Number(searchParams.get("limit") ?? 50);
  const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? Math.trunc(parsedLimit) : 50, 1), 100);

  if (status && !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid appointment status" }, { status: 400 });
  }

  for (const dateValue of [from, to]) {
    if (dateValue && (!ISO_DATE_PATTERN.test(dateValue) || Number.isNaN(Date.parse(dateValue)))) {
      return NextResponse.json({ error: "Invalid date filter" }, { status: 400 });
    }
  }

  if (from && to && new Date(from).getTime() > new Date(to).getTime()) {
    return NextResponse.json({ error: "The from date must be before the to date" }, { status: 400 });
  }

  let query = supabase
    .from("appointments")
    .select("id, customer_name, customer_phone, customer_email, start_at, end_at, status, service_id, created_at")
    .eq("business_id", id)
    .order("start_at", { ascending: false })
    .limit(limit);

  if (customer) query = query.ilike("customer_name", `%${customer}%`);
  if (email) query = query.ilike("customer_email", `%${email}%`);
  if (phone) query = query.ilike("customer_phone", `%${phone}%`);
  if (serviceId) query = query.eq("service_id", serviceId);
  if (status) query = query.eq("status", status);
  if (from) query = query.gte("start_at", from);
  if (to) query = query.lte("start_at", to);

  const { data: appointments, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Unable to load appointments" }, { status: 500 });
  }

  return NextResponse.json({ appointments: appointments ?? [] });
}
