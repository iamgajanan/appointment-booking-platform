import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updates = {
    name: String(body.name ?? "").trim(),
    category: String(body.category ?? "").trim() || null,
    phone: String(body.phone ?? "").trim() || null,
    whatsapp_number: String(body.whatsappNumber ?? "").trim() || null,
    timezone: String(body.timezone ?? "Asia/Kolkata"),
    address: String(body.address ?? "").trim() || null,
    description: String(body.description ?? "").trim() || null,
  };

  if (!updates.name) return NextResponse.json({ error: "Business name is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id, name, slug, category, timezone, phone, whatsapp_number, address, description")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ business: data });
}
