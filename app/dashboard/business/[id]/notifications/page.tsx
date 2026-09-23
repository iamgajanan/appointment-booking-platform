import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NotificationsClient from "./notifications-client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) notFound();
  return <NotificationsClient business={business} />;
}
