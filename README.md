# PayTrack AI

PayTrack AI is a multi-tenant B2B receivables and payment-follow-up SaaS for Indian businesses. The project now includes a working local product flow for authentication, companies, customers, invoices, payments, payment links, reminders, automation rules, reports, audit logs, webhooks, and a public payment page.

## 1. Quick start

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Demo login:

- Email: `owner@aroramills.in`
- Password: `Demo@123`

You can also open `/register` to create a new workspace.

## 2. Core product flow

1. Create customer.
2. Create invoice.
3. Create a payment link.
4. Open the public payment page at `/pay/<invoiceId>`.
5. Record manual payments or reconcile Razorpay webhook payments.
6. Send WhatsApp/email/voice reminders.
7. Add automation rules and run the reminder worker.
8. Review collection activity and reports.

## 3. Automated reminders

Run the worker manually:

```bash
npm run worker
```

Or call:

```text
POST /api/cron/reminders
Authorization: Bearer <CRON_SECRET>
```

A Railway cron, GitHub Actions schedule, or another scheduler can call that endpoint hourly/daily.

## 4. Local development integrations

Without provider secrets, the integration layer runs in safe demo mode. It creates audit records but does not send real money or messages.

Add real credentials to `.env` only when you are ready:

- Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- Email: `RESEND_API_KEY`, `RESEND_FROM`
- WhatsApp Cloud API: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, template values and webhook verify token
- Voice: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

## 5. Production notes

The code deliberately keeps provider secrets on the server and treats the external providers as adapters. For a production multi-merchant deployment, connect merchant Razorpay accounts through the provider's OAuth/partner flow and keep tokens in a managed secret store. Do not ship secrets to the browser.

Before going live with real payments, complete:

- production secret management
- real merchant OAuth connections
- verified WhatsApp sender/template setup or an approved direct-send path where eligible
- delivery webhooks and provider retry policies
- Redis-backed distributed rate limiting and durable job scheduling
- rotating refresh-token/session strategy if sessions need to outlive the current cookie lifetime
- database backups, monitoring, and a security review
- subscription billing integration and plan enforcement

## 6. Docker / Railway

The Dockerfile uses Next standalone output. Create an external PostgreSQL database and set environment variables in the platform. Run `prisma db push` or proper migration deployment before the application starts.
