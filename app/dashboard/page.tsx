import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./dashboard-client";

export const dynamic = "force-dynamic";

type Business = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  timezone: string;
  phone: string | null;
  whatsapp_number: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: businesses, error: businessesError }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("businesses").select("id, name, slug, category, timezone, phone, whatsapp_number").order("created_at", { ascending: false }),
  ]);

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? "", fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "" }}
      businesses={(businesses ?? []) as Business[]}
      setupError={businessesError?.code === "42P01" ? "Run the Supabase migration in supabase/migrations before creating your first business." : null}
    />
  );
}
