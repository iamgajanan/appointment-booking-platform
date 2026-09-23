import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatDate(value: string) { return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export default async function CustomerHistoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ email?: string; phone?: string; name?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id, name").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!business) notFound();

  let request = supabase.from("appointments").select("id, customer_name, customer_email, customer_phone, start_at, end_at, status, service_id").eq("business_id", id).order("start_at", { ascending: false });
  if (query.email) request = request.eq("customer_email", query.email);
  else if (query.phone) request = request.eq("customer_phone", query.phone);
  else if (query.name) request = request.eq("customer_name", query.name);
  const { data: appointments } = await request;
  const serviceIds = [...new Set((appointments ?? []).map((item) => item.service_id).filter(Boolean))];
  const { data: services } = serviceIds.length ? await supabase.from("services").select("id, name").in("id", serviceIds) : { data: [] };
  const serviceMap = new Map((services ?? []).map((service) => [service.id, service.name]));
  const customerName = query.name ?? appointments?.[0]?.customer_name ?? "Customer";

  return <main className="min-h-screen bg-[#f7f8f5] text-[#18221d]"><header className="border-b border-[#e5e9e2] bg-white/90"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10"><Link href={`/dashboard/business/${id}/customers`} className="text-sm font-semibold text-[#617662]">← Back to customers</Link><span className="text-sm font-bold tracking-[-0.5px] text-[#17221d]">appointly history</span></div></header><section className="mx-auto max-w-5xl px-6 py-10 lg:px-10"><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#719075]">Customer history</p><h1 className="text-4xl font-semibold tracking-[-1.5px]">{customerName}</h1><p className="mt-2 text-sm text-[#7d8b80]">{business.name} · {appointments?.length ?? 0} bookings</p><div className="mt-8 space-y-4">{!appointments?.length ? <div className="rounded-3xl border border-dashed border-[#ccd9c8] bg-white px-6 py-16 text-center"><h2 className="text-xl font-semibold">No bookings found</h2></div> : appointments.map((appointment) => <article key={appointment.id} className="rounded-3xl border border-[#e2e9df] bg-white p-5"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-sm font-semibold text-[#536358]">{appointment.service_id ? serviceMap.get(appointment.service_id) ?? "Service" : "General appointment"}</p><p className="mt-1 text-sm text-[#718076]">{formatDate(appointment.start_at)} – {new Intl.DateTimeFormat("en-IN", { timeStyle: "short" }).format(new Date(appointment.end_at))}</p><p className="mt-2 text-xs text-[#8a978d]">{appointment.customer_email || appointment.customer_phone || "No contact details"}</p></div><span className="w-fit rounded-full bg-[#edf6e9] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#658366]">{appointment.status}</span></div></article>)}</div></section></main>;
}
