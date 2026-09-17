import { PrismaClient, InvoiceStatus, PaymentMethod, Role, SubscriptionPlan } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
 const password = await bcrypt.hash("Demo@123", 12);
 const company = await prisma.company.upsert({ where: { email: "hello@aroramills.in" }, update: {}, create: { companyName: "Arora Rice Mills", email: "hello@aroramills.in", phone: "+91 98765 43210", address: "Karnal, Haryana", subscriptionPlan: SubscriptionPlan.GROWTH } });
 await prisma.user.upsert({ where: { email: "owner@aroramills.in" }, update: {}, create: { name: "Rohan Arora", email: "owner@aroramills.in", password, role: Role.COMPANY_OWNER, companyId: company.id } });
 const customers = await Promise.all(["Sharma Traders", "Krishna Distributors", "Greenfield Foods", "Anand Agencies"].map((customerName, i) => prisma.customer.upsert({ where: { id: `demo-customer-${i}` }, update: {}, create: { id: `demo-customer-${i}`, companyId: company.id, customerName, mobile: `+91987650000${i}`, email: `accounts${i}@example.com` } })));
 const data = [{ n: "INV-2026-1042", i: 0, a: 125000, paid: 125000, s: InvoiceStatus.PAID, due: -10 }, { n: "INV-2026-1043", i: 1, a: 84500, paid: 0, s: InvoiceStatus.OVERDUE, due: -8 }, { n: "INV-2026-1044", i: 2, a: 210000, paid: 60000, s: InvoiceStatus.DUE, due: 3 }, { n: "INV-2026-1045", i: 3, a: 45000, paid: 0, s: InvoiceStatus.SENT, due: 12 }];
 for (const d of data) { await prisma.invoice.upsert({ where: { companyId_invoiceNumber: { companyId: company.id, invoiceNumber: d.n } }, update: {}, create: { companyId: company.id, customerId: customers[d.i].id, invoiceNumber: d.n, invoiceAmount: d.a, amountPaid: d.paid, dueAmount: d.a - d.paid, issueDate: new Date(), dueDate: new Date(Date.now() + d.due * 86400000), status: d.s } }); }
 await prisma.subscription.upsert({ where: { id: "demo-subscription" }, update: {}, create: { id: "demo-subscription", companyId: company.id, plan: SubscriptionPlan.GROWTH, amount: 999, expiryDate: new Date(Date.now() + 30 * 86400000) } });
}
main().finally(() => prisma.$disconnect());
