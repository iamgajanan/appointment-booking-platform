import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const searchParams = new URL(request.url).searchParams;
  const email = searchParams.get("email")?.trim().toLowerCase();
  const phone = searchParams.get("phone")?.trim();
  const name = searchParams.get("name")?.trim();

  if (!email && !phone && !name) {
    return NextResponse.json({ error: "Provide email, phone, or name to load customer history" }, { status: 400 });
  }
  if ([email, phone, name].some((value) => value && value.length > 254)) {
    return NextResponse.json({ error: "Customer search value is too long" }, { status: 400 });
  }

  let query = supabase
    .from("appointments")
    .select("id, customer_name, customer_phone, customer_email, start_at, end_at, status, service_id, created_at")
    .eq("business_id", id)
    .order("start_at", { ascending: false })
    .limit(100);

  if (email) query = query.eq("customer_email", email);
  if (phone) query = query.eq("customer_phone", phone);
  if (name) query = query.ilike("customer_name", name);

  const { data: appointments, error } = await query;
  if (error) return NextResponse.json({ error: "Unable to load customer history" }, { status: 500 });

  return NextResponse.json({ appointments: appointments ?? [] });
}
