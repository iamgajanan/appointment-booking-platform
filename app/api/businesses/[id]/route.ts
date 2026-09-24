import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const updates = {
    name: String(body.name ?? "").trim(),
    category: String(body.category ?? "").trim() || null,
    phone: String(body.phone ?? "").trim() || null,
    whatsapp_number: String(body.whatsappNumber ?? "").trim() || null,
    timezone: String(body.timezone ?? "Asia/Kolkata").trim(),
    address: String(body.address ?? "").trim() || null,
    description: String(body.description ?? "").trim() || null,
  };

  if (!updates.name || updates.name.length > 120) return NextResponse.json({ error: "Business name is required and must be at most 120 characters" }, { status: 400 });
  if (updates.phone && updates.phone.length > 32) return NextResponse.json({ error: "Phone number is too long" }, { status: 400 });
  if (updates.whatsapp_number && updates.whatsapp_number.length > 32) return NextResponse.json({ error: "WhatsApp number is too long" }, { status: 400 });
  if (updates.description && updates.description.length > 2000) return NextResponse.json({ error: "Description is too long" }, { status: 400 });

  const { data, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id, name, slug, category, timezone, phone, whatsapp_number, address, description")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Unable to update business" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  return NextResponse.json({ business: data });
}
