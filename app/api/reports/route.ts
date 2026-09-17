import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(request: NextRequest) {
  const session = await getSession(request); if (!session?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [invoices, customers, reminders, payments] = await Promise.all([
    prisma.invoice.findMany({ where: { companyId: session.companyId }, select: { invoiceAmount: true, amountPaid: true, dueAmount: true, status: true, dueDate: true } }),
    prisma.customer.count({ where: { companyId: session.companyId } }),
    prisma.reminderLog.findMany({ where: { invoice: { companyId: session.companyId } }, select: { channel: true, status: true } }),
    prisma.paymentHistory.findMany({ where: { invoice: { companyId: session.companyId } }, select: { amount: true, paymentMethod: true } }),
  ]);
  const summary = {
    customers,
    invoices: invoices.length,
    billed: invoices.reduce((s, i) => s + Number(i.invoiceAmount), 0),
    collected: invoices.reduce((s, i) => s + Number(i.amountPaid), 0),
    outstanding: invoices.reduce((s, i) => s + Number(i.dueAmount), 0),
    overdue: invoices.filter(i => i.status === "OVERDUE").reduce((s, i) => s + Number(i.dueAmount), 0),
    remindersSent: reminders.filter(r => r.status === "SENT" || r.status === "DELIVERED").length,
    remindersFailed: reminders.filter(r => r.status === "FAILED").length,
    byChannel: Object.fromEntries(["WHATSAPP", "EMAIL", "VOICE"].map(channel => [channel, reminders.filter(r => r.channel === channel).length])),
    byPaymentMethod: Object.fromEntries(["UPI", "RAZORPAY", "BANK_TRANSFER", "CASH", "OTHER"].map(method => [method, payments.filter(p => p.paymentMethod === method).reduce((s, p) => s + Number(p.amount), 0)])),
  };
  return NextResponse.json({ data: summary });
}
