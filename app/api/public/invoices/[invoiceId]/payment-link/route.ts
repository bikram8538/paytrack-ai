import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRazorpayPaymentLink } from "@/lib/integrations";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  const i = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { customer: true } });
  if (!i) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (Number(i.dueAmount) <= 0) return NextResponse.json({ error: "Invoice is already paid." }, { status: 400 });
  const link = await createRazorpayPaymentLink(Number(i.dueAmount), invoiceId, { name: i.customer.customerName, email: i.customer.email, contact: i.customer.mobile });
  const record = await prisma.paymentLink.upsert({ where: { referenceId: invoiceId }, update: { providerLinkId: link.id, shortUrl: link.short_url, amount: Number(i.dueAmount), status: link.status || "CREATED" }, create: { invoiceId, referenceId: invoiceId, provider: "RAZORPAY", providerLinkId: link.id, shortUrl: link.short_url, amount: Number(i.dueAmount), status: link.status || "CREATED" } });
  return NextResponse.json({ data: record });
}
