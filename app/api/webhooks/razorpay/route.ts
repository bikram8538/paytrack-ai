import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveInvoiceStatus } from "@/lib/invoice";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const eventId = request.headers.get("x-razorpay-event-id") || request.headers.get("x-razorpay-event-idempotency-key") || crypto.createHash("sha256").update(body).digest("hex");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return NextResponse.json({ error: "Webhook secret/signature is not configured." }, { status: 401 });
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const received = Buffer.from(signature); const expectedBuf = Buffer.from(expected);
  if (received.length !== expectedBuf.length || !crypto.timingSafeEqual(received, expectedBuf)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  const event = JSON.parse(body);
  if (await prisma.webhookEvent.findUnique({ where: { eventId } })) return NextResponse.json({ ok: true, duplicate: true });
  await prisma.webhookEvent.create({ data: { provider: "RAZORPAY", eventId, eventType: event.event || "unknown", payload: event } });
  if (event.event === "payment_link.paid") {
    const entity = event.payload?.payment_link?.entity;
    const referenceId = entity?.reference_id;
    const providerPaymentId = entity?.payments?.[0]?.payment_id || entity?.payment_id;
    const paymentLink = referenceId ? await prisma.paymentLink.findUnique({ where: { referenceId }, include: { invoice: true } }) : null;
    if (paymentLink) {
      const amount = Number(entity?.amount_paid || entity?.amount || 0) / 100;
      const invoice = paymentLink.invoice;
      await prisma.$transaction(async tx => {
        if (providerPaymentId && await tx.paymentHistory.findUnique({ where: { providerPaymentId } })) return;
        const newPaid = Math.min(Number(invoice.invoiceAmount), Number(invoice.amountPaid) + amount);
        await tx.paymentHistory.create({ data: { invoiceId: invoice.id, amount, paymentMethod: "RAZORPAY", reference: referenceId, providerPaymentId } });
        await tx.invoice.update({ where: { id: invoice.id }, data: { amountPaid: newPaid, dueAmount: Math.max(0, Number(invoice.invoiceAmount) - newPaid), status: deriveInvoiceStatus({ amountPaid: newPaid, invoiceAmount: Number(invoice.invoiceAmount), dueDate: invoice.dueDate, currentStatus: invoice.status }) } });
        await tx.paymentLink.update({ where: { id: paymentLink.id }, data: { status: entity?.status || "paid" } });
      });
    }
  }
  return NextResponse.json({ ok: true });
}
