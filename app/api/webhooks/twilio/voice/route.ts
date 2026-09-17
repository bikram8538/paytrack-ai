import { NextRequest, NextResponse } from "next/server";
import { escapeHtml } from "@/lib/integrations";
export async function POST(request: NextRequest) { return handle(request); }
export async function GET(request: NextRequest) { return handle(request); }
function handle(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const customerName = escapeHtml(p.get("customerName") || "customer");
  const invoiceNumber = escapeHtml(p.get("invoiceNumber") || "your invoice");
  const amount = escapeHtml(p.get("amount") || "the outstanding amount");
  const paymentLink = escapeHtml(p.get("paymentLink") || "the payment link");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="en-IN" voice="alice">Hello ${customerName}. This is a payment reminder from PayTrack AI. Your invoice ${invoiceNumber} has an outstanding balance of rupees ${amount}. Please complete the payment using the link previously sent to you. Thank you.</Say></Response>`;
  return new NextResponse(xml, { headers: { "Content-Type": "text/xml" } });
}
