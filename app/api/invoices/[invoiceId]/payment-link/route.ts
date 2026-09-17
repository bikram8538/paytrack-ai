import { NextRequest, NextResponse } from "next/server";
import { getSession, canManage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRazorpayPaymentLink } from "@/lib/integrations";
import { audit } from "@/lib/audit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const session = await getSession(request);
  if (!session?.companyId || !canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { invoiceId } = await params;
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, companyId: session.companyId }, include: { customer: true } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (Number(invoice.dueAmount) <= 0) return NextResponse.json({ error: "Invoice is already paid." }, { status: 400 });
  const referenceId = invoice.id;
  const link = await createRazorpayPaymentLink(Number(invoice.dueAmount), referenceId, { name: invoice.customer.customerName, email: invoice.customer.email, contact: invoice.customer.mobile });
  const record = await prisma.paymentLink.upsert({
    where: { referenceId },
    update: { providerLinkId: link.id, shortUrl: link.short_url, amount: Number(invoice.dueAmount), status: link.status || "CREATED" },
    create: { invoiceId, referenceId, provider: "RAZORPAY", providerLinkId: link.id, shortUrl: link.short_url, amount: Number(invoice.dueAmount), status: link.status || "CREATED" },
  });
  await audit({ companyId: session.companyId, userId: session.userId, action: "CREATE_PAYMENT_LINK", entity: "Invoice", entityId: invoiceId, metadata: { provider: "RAZORPAY", linkId: link.id } });
  return NextResponse.json({ data: record });
}
