import { NextRequest, NextResponse } from "next/server";
import { getSession, canManage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailReminder, sendVoiceReminder, sendWhatsAppReminder } from "@/lib/integrations";
import { audit } from "@/lib/audit";

const senders = { WHATSAPP: sendWhatsAppReminder, EMAIL: sendEmailReminder, VOICE: sendVoiceReminder } as const;

export async function POST(request: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const session = await getSession(request); if (!session?.companyId || !canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { invoiceId } = await params;
  const body = await request.json().catch(() => ({}));
  const channel: keyof typeof senders =
  body.channel === "EMAIL"
    ? "EMAIL"
    : body.channel === "VOICE"
      ? "VOICE"
      : "WHATSAPP";
  const invoice = await prisma.invoice.findFirst({
  where: { id: invoiceId, companyId: session.companyId },
  include: {
    customer: true,
    paymentLinks: {
      orderBy: { createdAt: "desc" },
      take: 1,
    },
  },
});
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (Number(invoice.dueAmount) <= 0) return NextResponse.json({ error: "Invoice is already paid." }, { status: 400 });
  const link = invoice.paymentLinks[0]?.shortUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoice.id}`;
  try {
    const sender = senders[channel];
    const result = await sender({ to: invoice.customer.mobile, email: invoice.customer.email, customerName: invoice.customer.customerName, invoiceNumber: invoice.invoiceNumber, amount: Number(invoice.dueAmount), paymentLink: link });
    const log = await prisma.reminderLog.create({ data: { invoiceId, channel, status: "SENT", sentAt: new Date(), providerId: result.providerId, recipient: channel === "EMAIL" ? invoice.customer.email || invoice.customer.mobile : invoice.customer.mobile } });
    await audit({ companyId: session.companyId, userId: session.userId, action: "SEND_REMINDER", entity: "Invoice", entityId: invoiceId, metadata: { channel, providerId: result.providerId } });
    return NextResponse.json({ data: log });
  } catch (error) {
    const log = await prisma.reminderLog.create({ data: { invoiceId, channel, status: "FAILED", error: error instanceof Error ? error.message : "Unknown error" } });
    return NextResponse.json({ error: "Reminder failed", data: log }, { status: 502 });
  }
}
