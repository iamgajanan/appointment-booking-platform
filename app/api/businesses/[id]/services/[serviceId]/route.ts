import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; serviceId: string }> }) {
  const { id, serviceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase.from("businesses").select("id").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { error } = await supabase.from("services").delete().eq("id", serviceId).eq("business_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
