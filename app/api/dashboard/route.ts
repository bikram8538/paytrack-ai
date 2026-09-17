import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = session.companyId;
  const [invoices, recent, reminders, company] = await Promise.all([
    prisma.invoice.findMany({ where: { companyId }, select: { invoiceAmount: true, amountPaid: true, dueAmount: true, status: true, dueDate: true, issueDate: true } }),
    prisma.invoice.findMany({ where: { companyId }, include: { customer: { select: { customerName: true } } }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.reminderLog.findMany({ where: { invoice: { companyId } }, include: { invoice: { select: { invoiceNumber: true, customer: { select: { customerName: true } } } } }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.company.findUnique({ where: { id: companyId }, select: { companyName: true, subscriptionPlan: true, timezone: true } }),
  ]);
  const pending = invoices.reduce((sum, i) => sum + Number(i.dueAmount), 0);
  const overdue = invoices.filter(i => i.status === "OVERDUE").reduce((sum, i) => sum + Number(i.dueAmount), 0);
  const paidThisMonth = invoices.filter(i => i.status === "PAID" && i.issueDate.getMonth() === new Date().getMonth() && i.issueDate.getFullYear() === new Date().getFullYear()).reduce((sum, i) => sum + Number(i.amountPaid), 0);
  const totalCollected = invoices.reduce((sum, i) => sum + Number(i.amountPaid), 0);
  const totalBilled = invoices.reduce((sum, i) => sum + Number(i.invoiceAmount), 0);
  const monthLabels = Array.from({ length: 6 }, (_, index) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - index));
    return { month: d.toLocaleString("en-IN", { month: "short" }), collected: 0, due: 0, monthIndex: d.getMonth(), year: d.getFullYear() };
  });
  for (const invoice of invoices) {
    const d = invoice.issueDate;
    const bucket = monthLabels.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
    if (bucket) { bucket.collected += Number(invoice.amountPaid); bucket.due += Number(invoice.dueAmount); }
  }
  const trend = monthLabels.map(({ month, collected, due }) => ({ month, collected: Math.round(collected / 1000), due: Math.round(due / 1000) }));
  return NextResponse.json({ data: { company, kpis: { totalBilled, totalCollected, pending, overdue, paidThisMonth, collectionRate: totalBilled ? (totalCollected / totalBilled) * 100 : 0 }, trend, recentInvoices: recent, reminders } });
}
