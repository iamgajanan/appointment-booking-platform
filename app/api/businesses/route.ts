import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "").trim() || null;
  const timezone = String(body.timezone ?? "Asia/Kolkata");
  const phone = String(body.phone ?? "").trim() || null;
  const whatsappNumber = String(body.whatsappNumber ?? "").trim() || null;

  if (!name) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }

  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "business";
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 5)}`;

  const { data, error } = await supabase
    .from("businesses")
    .insert({
      owner_id: user.id,
      name,
      slug,
      category,
      timezone,
      phone,
      whatsapp_number: whatsappNumber,
      business_id: slug,
      business_name: name,
      calendar_id: "not-configured",
    })
    .select("id, name, slug, category, timezone, phone, whatsapp_number")
    .single();

  if (error) {
    console.error("Create business error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ business: data }, { status: 201 });
}
