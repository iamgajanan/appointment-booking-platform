import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BusinessSettingsClient from "./business-settings-client";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: business }, { data: hours }] = await Promise.all([
    supabase.from("businesses").select("id, name, slug, category, timezone, phone, whatsapp_number, address, description").eq("id", id).eq("owner_id", user.id).maybeSingle(),
    supabase.from("business_hours").select("id, day_of_week, start_time, end_time").eq("business_id", id).order("day_of_week").order("start_time"),
  ]);

  if (!business) notFound();

  return <BusinessSettingsClient business={business} initialHours={hours ?? []} />;
}
