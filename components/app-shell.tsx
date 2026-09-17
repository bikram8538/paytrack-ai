"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, ChevronDown, CircleHelp, FileText, LayoutDashboard, LogOut, Menu, Plus, ReceiptText, Settings, Sparkles, Users, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/collections", label: "Collections", icon: WalletCards },
  { href: "/automation", label: "Automation", icon: Sparkles },
  { href: "/reports", label: "Reports", icon: ReceiptText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<any>(null);
  useEffect(() => { fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(data => setMe(data?.data)); }, []);
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }
  return <div className="min-h-screen lg:flex">
    <aside className={cn("fixed inset-y-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white p-5 transition-transform lg:static lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex items-center justify-between px-2"><Link href="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}><div className="grid size-10 place-items-center rounded-xl bg-brand text-xl text-white"><WalletCards size={21}/></div><span className="text-lg font-bold tracking-tight">PayTrack <i className="not-italic text-brand">AI</i></span></Link><button onClick={() => setOpen(false)} className="lg:hidden"><X size={20}/></button></div>
      <nav className="mt-9 space-y-1">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium", pathname === href ? "bg-indigo-50 text-brand" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}><Icon size={19}/>{label}</Link>)}</nav>
      <div className="mt-auto space-y-1 border-t pt-4"><Link href="/settings" className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium", pathname === "/settings" ? "bg-indigo-50 text-brand" : "text-slate-500 hover:bg-slate-50")}><Settings size={19}/>Settings</Link><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500"><CircleHelp size={19}/>Help center</button><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50"><LogOut size={19}/>Sign out</button></div>
    </aside>
    {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-20 bg-slate-950/20 lg:hidden"/>}
    <main className="min-w-0 flex-1"><header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b bg-white/95 px-5 backdrop-blur md:px-8"><div className="flex items-center gap-4"><button className="lg:hidden" onClick={() => setOpen(true)}><Menu/></button><div><p className="hidden text-sm font-semibold text-slate-900 sm:block">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p><p className="text-xs text-slate-400 sm:hidden">PayTrack AI</p></div></div><div className="flex items-center gap-3"><Link href="/invoices?create=1"><Button className="hidden sm:inline-flex"><Plus size={17}/>Create invoice</Button></Link><button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"><Bell size={19}/><span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white"/></button><div className="flex items-center gap-2 rounded-xl p-1.5 pl-2"><div className="grid size-8 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-brand">{(me?.name || "PA").split(" ").map((x:string) => x[0]).slice(0,2).join("").toUpperCase()}</div><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{me?.name || "Workspace"}</p><p className="text-[11px] text-slate-400">{me?.company?.companyName || ""}</p></div><ChevronDown size={16} className="text-slate-400"/></div></div></header>{children}</main>
  </div>
}
