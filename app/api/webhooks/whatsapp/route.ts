import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) return new NextResponse(challenge || "", { status: 200 });
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const statuses = body?.entry?.flatMap((e: any) => e.changes || []).flatMap((c: any) => c.value?.statuses || []) || [];
  for (const status of statuses) {
    if (!status.id) continue;
    await prisma.reminderLog.updateMany({ where: { providerId: status.id }, data: { status: status.status === "delivered" ? "DELIVERED" : status.status === "failed" ? "FAILED" : "SENT", deliveredAt: status.status === "delivered" ? new Date() : undefined } });
  }
  return NextResponse.json({ ok: true });
}
