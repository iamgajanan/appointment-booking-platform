import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BookingConfigurationClient from "./booking-configuration-client";

export const dynamic = "force-dynamic";

export default async function BookingConfigurationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: business }, { data: settings }, { data: services }] = await Promise.all([
    supabase.from("businesses").select("id, name").eq("id", id).eq("owner_id", user.id).maybeSingle(),
    supabase.from("business_booking_settings").select("appointment_duration_minutes, slot_interval_minutes, buffer_minutes, advance_booking_days, cancellation_notice_hours").eq("business_id", id).maybeSingle(),
    supabase.from("services").select("id, name, description, duration_minutes, price, is_active").eq("business_id", id).order("created_at", { ascending: false }),
  ]);

  if (!business) notFound();

  return <BookingConfigurationClient business={business} initialSettings={settings} initialServices={services ?? []} />;
}
