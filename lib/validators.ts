import { z } from "zod";

export const customerSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  mobile: z.string().trim().min(8).max(20),
  email: z.string().email().optional().or(z.literal("")),
  gstNumber: z.string().trim().max(20).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
});

export const invoiceSchema = z.object({
  customerId: z.string().cuid(),
  invoiceNumber: z.string().trim().min(1).max(50),
  invoiceAmount: z.coerce.number().positive(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  notes: z.string().max(1000).optional().or(z.literal("")),
}).refine((data) => data.dueDate >= data.issueDate, { message: "Due date must be after issue date", path: ["dueDate"] });

export const invoiceUpdateSchema = z.object({
  invoiceAmount: z.coerce.number().positive().optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(["DRAFT", "SENT", "DUE", "OVERDUE", "PARTIALLY_PAID", "PAID", "CANCELLED"]).optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().positive(),
  paymentMethod: z.enum(["UPI", "RAZORPAY", "BANK_TRANSFER", "CASH", "OTHER"]),
  reference: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

export const automationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  trigger: z.enum(["BEFORE_DUE", "ON_DUE", "AFTER_DUE"]),
  offsetDays: z.coerce.number().int().min(0).max(30),
  channel: z.enum(["WHATSAPP", "EMAIL", "VOICE"]),
  enabled: z.boolean().default(true),
  maxAttempts: z.coerce.number().int().min(1).max(10).default(1),
  template: z.string().max(2000).optional().or(z.literal("")),
});
