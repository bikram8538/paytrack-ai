import { InvoiceStatus } from "@prisma/client";

export function deriveInvoiceStatus(input: { amountPaid: number; invoiceAmount: number; dueDate: Date; currentStatus?: InvoiceStatus }) {
  if (input.currentStatus === InvoiceStatus.DRAFT || input.currentStatus === InvoiceStatus.CANCELLED) return input.currentStatus;
  if (input.amountPaid >= input.invoiceAmount) return InvoiceStatus.PAID;
  if (input.amountPaid > 0) return InvoiceStatus.PARTIALLY_PAID;
  return input.dueDate.getTime() < Date.now() ? InvoiceStatus.OVERDUE : input.currentStatus === InvoiceStatus.SENT ? InvoiceStatus.SENT : InvoiceStatus.DUE;
}
