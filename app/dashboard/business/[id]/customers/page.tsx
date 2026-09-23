import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomersClient from "./customers-client";

export const dynamic = "force-dynamic";

type ServiceRow = { id: string; name: string };
type AppointmentRow = {
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  start_at: string;
  status: string;
  service_id: string | null;
};

export default async function CustomersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase.from("businesses").select("id, name").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!business) notFound();

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, customer_name, customer_phone, customer_email, start_at, status, service_id")
    .eq("business_id", id)
    .order("start_at", { ascending: false });
  const { data: services } = await supabase.from("services").select("id, name").eq("business_id", id);
  const serviceMap = new Map<string, string>((services as ServiceRow[] | null ?? []).map((service) => [service.id, service.name]));

  const grouped = new Map<string, { name: string; phone: string | null; email: string | null; total: number; completed: number; cancelled: number; lastVisit: string; services: string[] }>();
  for (const appointment of (appointments as AppointmentRow[] | null) ?? []) {
    const key = appointment.customer_email?.toLowerCase() || appointment.customer_phone || appointment.customer_name.toLowerCase();
    const current = grouped.get(key);
    const item = current ?? { name: appointment.customer_name, phone: appointment.customer_phone, email: appointment.customer_email, total: 0, completed: 0, cancelled: 0, lastVisit: appointment.start_at, services: [] };
    item.total += 1;
    if (appointment.status === "completed") item.completed += 1;
    if (appointment.status === "cancelled") item.cancelled += 1;
    const serviceName = serviceMap.get(appointment.service_id ?? "") ?? "General appointment";
    if (!item.services.includes(serviceName)) item.services.push(serviceName);
    if (new Date(appointment.start_at).getTime() > new Date(item.lastVisit).getTime()) item.lastVisit = appointment.start_at;
    grouped.set(key, item);
  }

  return <CustomersClient business={business} customers={Array.from(grouped.values())} />;
}
