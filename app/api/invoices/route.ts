import { NextRequest, NextResponse } from "next/server";
import { getSession, canManage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deriveInvoiceStatus } from "@/lib/invoice";
import { invoiceSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await getSession(request); if (!session?.companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = request.nextUrl.searchParams.get("status") as any;
  const q = request.nextUrl.searchParams.get("q") || "";
  const invoices = await prisma.invoice.findMany({ where: { companyId: session.companyId, ...(status ? { status } : {}), ...(q ? { OR: [{ invoiceNumber: { contains: q, mode: "insensitive" } }, { customer: { customerName: { contains: q, mode: "insensitive" } } }] } : {}) }, include: { customer: { select: { customerName: true, mobile: true, email: true } }, paymentLinks: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { dueDate: "asc" }, take: 300 });
  const data = invoices.map(i => ({ ...i, invoiceAmount: Number(i.invoiceAmount), amountPaid: Number(i.amountPaid), dueAmount: Number(i.dueAmount) }));
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request); if (!session?.companyId || !canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const parsed = invoiceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const customer = await prisma.customer.findFirst({ where: { id: parsed.data.customerId, companyId: session.companyId } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  const duplicate = await prisma.invoice.findUnique({ where: { companyId_invoiceNumber: { companyId: session.companyId, invoiceNumber: parsed.data.invoiceNumber } } });
  if (duplicate) return NextResponse.json({ error: "Invoice number already exists." }, { status: 409 });
  const status = deriveInvoiceStatus({ amountPaid: 0, invoiceAmount: parsed.data.invoiceAmount, dueDate: parsed.data.dueDate, currentStatus: "SENT" });
  const invoice = await prisma.invoice.create({ data: { ...parsed.data, notes: parsed.data.notes || null, companyId: session.companyId, dueAmount: parsed.data.invoiceAmount, status } });
  await audit({ companyId: session.companyId, userId: session.userId, action: "CREATE", entity: "Invoice", entityId: invoice.id, metadata: { invoiceNumber: invoice.invoiceNumber, amount: parsed.data.invoiceAmount } });
  return NextResponse.json({ data: invoice }, { status: 201 });
}
