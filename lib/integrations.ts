export type ReminderPayload = {
  to: string;
  email?: string | null;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  paymentLink: string;
  message?: string;
};

function demoMode(value?: string) {
  return !value || value.startsWith("demo_") || value === "";
}

export async function sendWhatsAppReminder(payload: ReminderPayload) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (demoMode(token) || demoMode(phoneNumberId)) return { providerId: `demo_whatsapp_${Date.now()}`, status: "SENT" as const };

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: payload.to.replace(/\D/g, ""),
      type: "template",
      template: {
        name: process.env.WHATSAPP_TEMPLATE_NAME || "payment_reminder",
        language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en" },
        components: [{ type: "body", parameters: [
          { type: "text", text: payload.customerName },
          { type: "text", text: payload.invoiceNumber },
          { type: "text", text: `₹${payload.amount.toLocaleString("en-IN")}` },
          { type: "text", text: payload.paymentLink },
        ] }],
      },
    }),
  });
  if (!response.ok) throw new Error(`WhatsApp request failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { providerId: data.messages?.[0]?.id as string | undefined, status: "SENT" as const };
}

export async function sendEmailReminder(payload: ReminderPayload) {
  if (!payload.email || demoMode(process.env.RESEND_API_KEY)) return { providerId: `demo_email_${Date.now()}`, status: "SENT" as const };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "PayTrack AI <onboarding@resend.dev>",
      to: [payload.email],
      subject: `Payment reminder — ${payload.invoiceNumber}`,
      html: `<p>Hi ${escapeHtml(payload.customerName)},</p><p>This is a reminder that ₹${payload.amount.toLocaleString("en-IN")} remains due for invoice <strong>${escapeHtml(payload.invoiceNumber)}</strong>.</p><p><a href="${escapeHtml(payload.paymentLink)}">Pay securely</a></p><p>Thank you.</p>`,
    }),
  });
  if (!response.ok) throw new Error(`Email request failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { providerId: data.id as string | undefined, status: "SENT" as const };
}

export async function sendVoiceReminder(payload: ReminderPayload) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (demoMode(sid) || demoMode(auth) || !from) return { providerId: `demo_voice_${Date.now()}`, status: "SENT" as const };
  const form = new URLSearchParams({
    To: payload.to,
    From: from,
    Url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/voice?customerName=${encodeURIComponent(payload.customerName)}&invoiceNumber=${encodeURIComponent(payload.invoiceNumber)}&amount=${encodeURIComponent(payload.amount)}&paymentLink=${encodeURIComponent(payload.paymentLink)}`,
  });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${auth}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!response.ok) throw new Error(`Twilio request failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { providerId: data.sid as string | undefined, status: "SENT" as const };
}

export async function createRazorpayPaymentLink(amount: number, referenceId: string, customer?: { name?: string; email?: string | null; contact?: string }) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${referenceId}`;
  if (demoMode(keyId) || demoMode(secret)) return { id: `demo_link_${referenceId}`, short_url: publicUrl, status: "created" };
  const encoded = Buffer.from(`${keyId}:${secret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: { Authorization: `Basic ${encoded}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: "INR",
      reference_id: referenceId,
      description: `Payment for invoice ${referenceId}`,
      customer: customer && { name: customer.name, email: customer.email || undefined, contact: customer.contact },
      notify: { sms: false, email: false },
      reminder_enable: false,
    }),
  });
  if (!response.ok) throw new Error(`Razorpay request failed: ${response.status} ${await response.text()}`);
  return response.json();
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char] || char));
}
