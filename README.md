<p align="center">
  <img src="public/favicon.svg" width="76" height="76" alt="PayTrack AI logo" />
</p>

<h1 align="center">PayTrack AI</h1>

<p align="center">
  <strong>Collect invoices with less chasing.</strong><br />
  A focused receivables workspace for Indian B2B teams.
</p>

<p align="center">
  <a href="#quick-start"><img src="https://img.shields.io/badge/Get_started-5B5CE2?style=for-the-badge&logo=rocket&logoColor=white" alt="Get started" /></a>
  <img src="https://img.shields.io/badge/Next.js-15-111827?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

<p align="center">
  <a href="#what-you-can-do">Product</a> · <a href="#quick-start">Quick start</a> · <a href="#integrations">Integrations</a> · <a href="#deployment">Deploy</a>
</p>

---

## The collection command center

PayTrack AI gives each business its own secure workspace to manage customers, invoices, payment links, and follow-ups from one calm, practical dashboard. It is designed to move a receivable from **issued** to **paid**—with clear visibility at every step.

| Create | Collect | Follow up | Understand |
| :--- | :--- | :--- | :--- |
| Customers and invoices | Share secure payment links | Automate WhatsApp, email, and voice reminders | Track outstanding amounts and collection trends |

## What you can do

- **Run a multi-tenant workspace** — self-service registration, company-scoped data, role-ready user models, and authenticated sessions.
- **Stay ahead of receivables** — create, search, filter, and update invoices; support partial and manual payments; surface overdue amounts clearly.
- **Make payment frictionless** — generate Razorpay payment links and let customers pay through a public invoice page.
- **Automate thoughtful nudges** — schedule before-due, on-due, and after-due reminder rules with configurable channels, templates, and attempt limits.
- **See the full story** — dashboard KPIs, collection trend charts, reports, reminder activity, and audit logs keep the team aligned.
- **Integrate safely** — provider adapters fall back to demo mode when credentials are absent, so the complete product flow is testable without sending messages or collecting money.

## Built with intention

| Layer | Choice |
| :--- | :--- |
| Application | Next.js 15, React 19, TypeScript |
| Data | PostgreSQL, Prisma |
| Interface | Tailwind CSS, shadcn-style components, Recharts |
| Authentication | Signed, HTTP-only session cookies with `jose` |
| Payments | Razorpay payment links + webhook reconciliation |
| Messaging | WhatsApp Cloud API, Resend, Twilio Voice |
| Operations | Reminder worker, protected cron endpoint, Docker, Railway config |

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)
- npm

### Run locally

```bash
git clone <your-repository-url>
cd PayTrack-AI-Complete

cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000), then sign in with the seeded workspace:

```text
Email:    owner@aroramills.in
Password: Demo@123
```

You can also create a fresh company at [`/register`](http://localhost:3000/register).

### Start PostgreSQL with Docker

The included Compose file starts PostgreSQL and Redis. Start those services, run the schema commands above from your host, then bring up the app when needed:

```bash
docker compose up -d db redis
npm run db:push
npm run db:seed
docker compose up --build app
```

## A complete collection loop

```text
Customer → Invoice → Payment link → Payment / reconciliation → Reminder automation → Collection insight
```

1. Add a customer and issue an invoice.
2. Create a payment link from the invoice view and share it with the customer.
3. Record a manual payment or accept a Razorpay webhook reconciliation.
4. Configure reminder rules for before, on, or after an invoice due date.
5. Review collection performance, delivery activity, and the audit trail.

## Integrations

Provider credentials are optional in development. Blank provider credentials activate **safe demo mode**: the application creates provider-like records and audit activity, but no real payment, email, WhatsApp message, or call is sent.

| Provider | Capability | Environment variables |
| :--- | :--- | :--- |
| Razorpay | Payment links and payment webhooks | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| Resend | Payment reminder emails | `RESEND_API_KEY`, `RESEND_FROM` |
| WhatsApp Cloud API | Template-based reminders and delivery webhooks | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANGUAGE`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` |
| Twilio | Voice reminders | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |

All supported configuration is documented in [`.env.example`](.env.example). Keep real credentials out of version control.

## Reminder automation

For a one-off local run, execute the worker directly:

```bash
npm run worker
```

For scheduled execution, call the protected endpoint from your scheduler:

```http
POST /api/cron/reminders
Authorization: Bearer <CRON_SECRET>
```

Any trusted scheduler—Railway Cron, GitHub Actions, or an external job runner—can invoke this endpoint hourly or daily.

## Environment essentials

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/paytrack"
JWT_SECRET="use-a-long-random-secret-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="use-a-separate-random-secret"
```

`REDIS_URL` is included for local and future queue-backed deployment scenarios. The current reminder worker runs directly against the database.

## Useful commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:push` | Synchronize the development schema |
| `npm run db:seed` | Load the demo workspace and data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run worker` | Execute due reminder rules once |

## Deployment

The repository includes a standalone-output [Dockerfile](Dockerfile), a [`docker-compose.yml`](docker-compose.yml) for local services, and [`railway.json`](railway.json) for Railway.

Before deploying, set a production PostgreSQL `DATABASE_URL`, long random `JWT_SECRET` and `CRON_SECRET` values, and the public `NEXT_PUBLIC_APP_URL`. Run `prisma db push` (or your approved migration process) against the production database before serving traffic.

### Production readiness checklist

- [ ] Use managed secret storage; never commit production `.env` values.
- [ ] Configure and verify live provider credentials, senders, templates, and webhook endpoints.
- [ ] Connect merchants through the appropriate Razorpay OAuth/partner flow for a true multi-merchant offering.
- [ ] Add a durable queue and distributed rate limiting as reminder volume grows.
- [ ] Set up database backups, operational monitoring, delivery retries, and security review.
- [ ] Add subscription billing and plan enforcement before commercial rollout.

## Project structure

```text
app/          Product pages, API routes, public payment flow, and webhooks
components/   Dashboard, layout, charts, and reusable UI components
jobs/         Reminder processing worker
lib/          Auth, validation, audit, integrations, and Prisma client
prisma/       PostgreSQL schema and demo seed data
public/       Static assets
```

<p align="center">
  Built for teams that want to spend less time chasing invoices—and more time growing the business.
</p>
