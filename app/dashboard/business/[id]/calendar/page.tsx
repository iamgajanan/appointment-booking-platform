import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CalendarClient from "./calendar-client";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase.from("businesses").select("id, name, timezone").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!business) notFound();

  const [{ data: appointments }, { data: services }] = await Promise.all([
    supabase.from("appointments").select("id, service_id, customer_name, customer_phone, customer_email, start_at, end_at, status").eq("business_id", id).order("start_at", { ascending: true }),
    supabase.from("services").select("id, name").eq("business_id", id),
  ]);

  const serviceMap = new Map((services ?? []).map((service) => [service.id, service.name]));
  const initialAppointments = (appointments ?? []).map((appointment) => ({
    ...appointment,
    service_name: appointment.service_id ? serviceMap.get(appointment.service_id) ?? "Service" : "General appointment",
  }));

  return <CalendarClient business={business} initialAppointments={initialAppointments} />;
}
