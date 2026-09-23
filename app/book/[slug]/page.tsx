import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BookingAvailabilityClient from "./booking-availability-client";

export const dynamic = "force-dynamic";

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, category, timezone")
    .eq("slug", slug)
    .maybeSingle();

  if (!business) notFound();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, price")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  return (
    <BookingAvailabilityClient
      business={business}
      services={services ?? []}
    />
  );
}
