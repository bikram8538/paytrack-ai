"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [d, setD] = useState<any>();
  const [form, setForm] = useState({ companyName: "", phone: "", address: "", timezone: "Asia/Kolkata" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(r => {
      setD(r.data);
      setForm({ companyName: r.data?.companyName || "", phone: r.data?.phone || "", address: r.data?.address || "", timezone: r.data?.timezone || "Asia/Kolkata" });
    });
  }, []);

  async function save() {
    const r = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const x = await r.json();
    setMessage(r.ok ? "Saved successfully" : (x.error || "Could not save"));
    if (r.ok) setD((prev: any) => ({ ...prev, companyName: form.companyName, phone: form.phone, address: form.address, timezone: form.timezone }));
  }

  if (!d) return <AppShell><div className="p-8">Loading settings…</div></AppShell>;

  return <AppShell>
    <div className="mx-auto max-w-[1000px] p-5 md:p-8">
      <PageHeader title="Settings" description="Workspace details and integration readiness." />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <h2 className="font-bold">Company profile</h2>
          <div className="mt-5 space-y-4">
            <label className="block"><span className="mb-2 block text-sm font-semibold">Company name</span><input className="field" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Phone</span><input className="field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Address</span><textarea className="field min-h-24" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Timezone</span><select className="field" value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })}><option>Asia/Kolkata</option><option>UTC</option></select></label>
            <div className="flex items-center gap-3"><Button onClick={save}>Save changes</Button>{message && <span className="text-sm text-slate-500">{message}</span>}</div>
          </div>
        </div>
        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="font-bold">Plan</h2><p className="mt-2 text-sm text-slate-500">Current workspace plan</p>
            <div className="mt-4 rounded-xl bg-indigo-50 p-4"><p className="font-bold text-brand">{d.subscriptionPlan}</p><p className="mt-1 text-xs text-indigo-700">SaaS billing connector ready for integration.</p></div>
          </div>
          <div className="card p-6">
            <h2 className="font-bold">Integrations</h2>
            <div className="mt-4 space-y-3">{["RAZORPAY", "WHATSAPP", "EMAIL", "VOICE"].map((p) => {
              const c = d.integrations?.find((x: any) => x.provider === p);
              return <div key={p} className="flex items-center justify-between rounded-xl border p-3"><span className="text-sm font-semibold">{p}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${c?.status === "CONNECTED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{c?.status || "ENV / DEMO"}</span></div>;
            })}</div>
            <p className="mt-4 text-xs leading-5 text-slate-400">Production connector credentials should be stored through your deployment secret manager or OAuth flow, not hard-coded in the frontend.</p>
          </div>
        </div>
      </div>
    </div>
  </AppShell>;
}
