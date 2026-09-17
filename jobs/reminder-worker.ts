import { prisma } from "@/lib/prisma";
import { sendEmailReminder, sendVoiceReminder, sendWhatsAppReminder } from "@/lib/integrations";

function isRuleDue(rule: { trigger: string; offsetDays: number }, dueDate: Date, now: Date) {
  const target = new Date(dueDate);
  if (rule.trigger === "BEFORE_DUE") target.setDate(target.getDate() - rule.offsetDays);
  else if (rule.trigger === "AFTER_DUE") target.setDate(target.getDate() + rule.offsetDays);
  const dayTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const dayNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return dayTarget === dayNow;
}

export async function processReminderRules() {
  const now = new Date();
  const rules = await prisma.automationRule.findMany({ where: { enabled: true }, include: { company: true } });
  let sent = 0; let skipped = 0; let failed = 0;
  for (const rule of rules) {
    const invoices = await prisma.invoice.findMany({ where: { companyId: rule.companyId, dueAmount: { gt: 0 }, status: { notIn: ["DRAFT", "PAID", "CANCELLED"] }, ...(rule.trigger === "BEFORE_DUE" ? { dueDate: { gte: now } } : {}) }, include: { customer: true, paymentLinks: { orderBy: { createdAt: "desc" }, take: 1 } }, take: 500 });
    for (const invoice of invoices) {
      if (!isRuleDue(rule, invoice.dueDate, now)) continue;
      const existing = await prisma.reminderLog.count({ where: { invoiceId: invoice.id, automationRuleId: rule.id, createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } } });
      if (existing >= rule.maxAttempts) { skipped++; continue; }
      try {
        const paymentLink = invoice.paymentLinks?.[0]?.shortUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoice.id}`;
        const payload = { to: invoice.customer.mobile, email: invoice.customer.email, customerName: invoice.customer.customerName, invoiceNumber: invoice.invoiceNumber, amount: Number(invoice.dueAmount), paymentLink, message: rule.template || undefined };
        const result = rule.channel === "EMAIL" ? await sendEmailReminder(payload) : rule.channel === "VOICE" ? await sendVoiceReminder(payload) : await sendWhatsAppReminder(payload);
        await prisma.reminderLog.create({ data: { invoiceId: invoice.id, automationRuleId: rule.id, channel: rule.channel, status: "SENT", sentAt: new Date(), providerId: result.providerId, recipient: rule.channel === "EMAIL" ? invoice.customer.email || invoice.customer.mobile : invoice.customer.mobile } });
        sent++;
      } catch (error) {
        await prisma.reminderLog.create({ data: { invoiceId: invoice.id, automationRuleId: rule.id, channel: rule.channel, status: "FAILED", error: error instanceof Error ? error.message : "Unknown error" } });
        failed++;
      }
    }
  }
  return { ok: true, sent, skipped, failed };
}

if (require.main === module) processReminderRules().then((result) => { console.log(result); }).finally(() => prisma.$disconnect());
