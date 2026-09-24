import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getOwnedBusiness(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, business: null };
  const { data: business } = await supabase.from("businesses").select("id").eq("id", id).eq("owner_id", user.id).maybeSingle();
  return { supabase, user, business };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, business } = await getOwnedBusiness(id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim() || null;
  const durationMinutes = Number(body.durationMinutes);
  const price = Number(body.price);
  if (!name || name.length > 120) return NextResponse.json({ error: "Service name is required and must be at most 120 characters." }, { status: 400 });
  if (description && description.length > 1000) return NextResponse.json({ error: "Service description is too long." }, { status: 400 });
  if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 480) return NextResponse.json({ error: "Duration must be between 5 and 480 minutes." }, { status: 400 });
  if (!Number.isFinite(price) || price < 0 || price > 100000000) return NextResponse.json({ error: "Price must be a valid non-negative amount." }, { status: 400 });

  const { data, error } = await supabase.from("services").insert({ business_id: id, name, description, duration_minutes: durationMinutes, price }).select().single();
  if (error) return NextResponse.json({ error: "Unable to create service" }, { status: 500 });
  return NextResponse.json({ service: data }, { status: 201 });
}
