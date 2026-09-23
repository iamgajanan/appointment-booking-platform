"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Business = { id: string; name: string; slug: string; category: string | null; timezone: string; phone: string | null; whatsapp_number: string | null };
type Props = { user: { id: string; email: string; fullName: string }; businesses: Business[]; setupError: string | null };

export default function DashboardClient({ user, businesses: initialBusinesses, setupError }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", category: "", timezone: "Asia/Kolkata", phone: "", whatsappNumber: "" });

  async function createBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/businesses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) { setError(result.error ?? "Unable to create business"); return; }
      setBusinesses((current) => [result.business as Business, ...current]);
      setForm({ name: "", category: "", timezone: "Asia/Kolkata", phone: "", whatsappNumber: "" }); setShowForm(false); router.refresh();
    } catch { setError("Something went wrong. Please try again."); } finally { setSaving(false); }
  }

  async function signOut() { await supabase.auth.signOut(); router.replace("/login"); router.refresh(); }
  const displayName = user.fullName || user.email.split("@")[0];

  return <main className="min-h-screen bg-[#f7f8f5] text-[#18221d]">
    <header className="border-b border-[#e5e9e2] bg-white/85 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10"><Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-[-0.7px]"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#d6edcf] text-[#456c4b]">✳</span> appointly</Link><div className="flex items-center gap-4 text-sm"><span className="hidden text-[#829087] sm:inline">{user.email}</span><button onClick={signOut} className="rounded-full border border-[#dfe6dc] px-4 py-2 font-semibold hover:bg-[#f0f5ed]">Sign out ↗</button></div></div></header>
    <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#719075]">Workspace overview</p><h1 className="text-4xl font-semibold tracking-[-1.8px] md:text-5xl">Good to see you, {displayName}.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#7d8b80]">Manage your businesses, connect your booking channels, and keep every appointment organized from one place.</p></div><button onClick={() => setShowForm((value) => !value)} className="rounded-full bg-[#17221d] px-5 py-3 text-sm font-semibold text-white">{showForm ? "Close form" : "+ Add business"}</button></div>
      {setupError && <div className="mb-6 rounded-2xl border border-[#f1d9a6] bg-[#fff8e8] px-5 py-4 text-sm text-[#8a6524]">{setupError}</div>}{error && <div className="mb-6 rounded-2xl border border-[#f1c8c8] bg-[#fff0f0] px-5 py-4 text-sm text-[#a53d3d]">{error}</div>}
      {showForm && <form onSubmit={createBusiness} className="mb-8 grid gap-5 rounded-3xl border border-[#e2e9df] bg-white p-6 md:grid-cols-2"><div className="md:col-span-2"><h2 className="text-xl font-semibold">Create a business</h2><p className="mt-1 text-sm text-[#8a978d]">Start with your basic business information.</p></div>{([['name','Business name','Pashan Dental Studio'],['category','Category','Dental clinic'],['phone','Phone','+91 98765 43210'],['whatsappNumber','WhatsApp number','+91 98765 43210']] as const).map(([field,label,placeholder]) => <label key={field} className="grid gap-2 text-xs font-bold text-[#536358]">{label}<input required={field === 'name'} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={placeholder} className="rounded-xl border border-[#dfe7db] bg-[#fbfcfa] px-4 py-3 text-sm font-normal outline-none focus:border-[#91b18f]" /></label>)}<label className="grid gap-2 text-xs font-bold text-[#536358]">Timezone<select value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} className="rounded-xl border border-[#dfe7db] bg-[#fbfcfa] px-4 py-3 text-sm font-normal"><option>Asia/Kolkata</option><option>Asia/Dubai</option><option>Europe/London</option><option>America/New_York</option></select></label><div className="flex items-end justify-end md:col-span-2"><button disabled={saving} className="rounded-full bg-[#17221d] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Creating..." : "Create business ↗"}</button></div></form>}
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Your businesses</h2><span className="rounded-full bg-[#e8f1e4] px-3 py-1 text-xs font-bold text-[#5c8060]">{businesses.length} total</span></div>
      {businesses.length === 0 ? <div className="rounded-3xl border border-dashed border-[#ccd9c8] bg-white px-6 py-16 text-center"><h3 className="text-xl font-semibold">Your workspace is ready</h3><p className="mx-auto mt-2 max-w-md text-sm text-[#8a978d]">Create your first business to start configuring working hours and booking channels.</p><button onClick={() => setShowForm(true)} className="mt-6 rounded-full bg-[#17221d] px-5 py-3 text-sm font-semibold text-white">Add your first business ↗</button></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{businesses.map((business) => <article key={business.id} className="rounded-3xl border border-[#e2e9df] bg-white p-6"><div className="mb-8 flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e7f2e2] text-[#638765]">✳</div><span className="rounded-full bg-[#edf6e9] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#658366]">Active</span></div><h3 className="text-xl font-semibold">{business.name}</h3><p className="mt-1 text-sm text-[#8a978d]">{business.category || "Service business"}</p><div className="mt-6 space-y-3 border-t border-[#edf0eb] pt-5 text-xs text-[#718076]"><p>🌐 {business.slug}</p><p>◷ {business.timezone}</p><p>◉ {business.whatsapp_number || business.phone || "No contact number yet"}</p></div><div className="mt-6 grid gap-2"><Link href={`/dashboard/business/${business.id}/settings`} className="block w-full rounded-full border border-[#dce5d8] px-4 py-3 text-center text-sm font-semibold hover:bg-[#f4f8f1]">Business settings ↗</Link><Link href={`/dashboard/business/${business.id}/booking`} className="block w-full rounded-full border border-[#dce5d8] px-4 py-3 text-center text-sm font-semibold hover:bg-[#f4f8f1]">Booking setup ↗</Link><Link href={`/dashboard/business/${business.id}/appointments`} className="block w-full rounded-full border border-[#dce5d8] px-4 py-3 text-center text-sm font-semibold hover:bg-[#f4f8f1]">Appointments ↗</Link><Link href={`/book/${business.slug}`} target="_blank" rel="noreferrer" className="block w-full rounded-full bg-[#17221d] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#2c3b32]">Preview booking page ↗</Link></div></article>)}</div>}
    </section>
  </main>;
}
