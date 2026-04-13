# Skcript Mail

Skcript Mail is a B2B email campaign platform built with Next.js, Better Auth, Drizzle ORM, Resend, Redis, and Razorpay. It is designed to send campaigns, track opens and clicks at the individual recipient level, manage recipient lists and templates, and surface organization-level analytics for teams.

The full technical reference lives in [documentation.md](documentation.md). This README is the practical handoff guide for a developer who wants to run and understand the project locally.

## What This App Does

- Create and manage email campaigns.
- Build reusable email templates.
- Import and organize recipients into lists.
- Send campaign emails through Resend.
- Track opens, clicks, unsubscribes, bounces, and complaints.
- Show org-wide dashboards, campaign analytics, and audit logs.
- Support multi-tenant orgs with roles, invites, and billing.

## Tech Stack

- Next.js 16.2.2 with the App Router
- React 19.2.4 and TypeScript
- Better Auth 1.6.0 for authentication and organization management
- Drizzle ORM with PostgreSQL
- Resend for email delivery
- BullMQ + Redis for background email jobs
- Razorpay for billing
- Tailwind CSS 4 and shadcn/ui for the UI
- Recharts for analytics charts

## Project Structure

- `src/app` contains the App Router pages, grouped routes, layouts, API routes, and tracking endpoints.
- `src/components` contains shared UI and shell components.
- `src/lib` contains server actions, auth, database, email, queue, Redis, Razorpay, and utility code.
- `src/worker/email-worker.ts` runs the background email worker.
- `drizzle/` contains database migrations and snapshots.

For a full architecture map, see [documentation.md](documentation.md).

## Prerequisites

Before running the project locally, install:

- Node.js 20 or newer
- PostgreSQL 15
- Redis

On macOS, you can install PostgreSQL and Redis with Homebrew, or run them through Docker if you prefer.

## Local Setup

1. Clone the repository and install dependencies.

```bash
cd "/Users/berjil/Downloads/mail tool/Mail-tool"
npm install
```

2. Create your environment file.

Create a `.env.local` file in the project root and add the variables listed in the next section.

3. Create the database.

If you are using Homebrew locally, start the database and create the app database before pushing the schema.

```bash
brew services start postgresql@15
psql -d postgres -c "CREATE DATABASE skcript_mail;"
```

If you are using Redis locally through Homebrew, start it as well:

```bash
brew services start redis
```

4. Push the Drizzle schema.

```bash
npm run db:push
```

5. Start the Next.js dev server.

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

6. Start the email worker in a separate terminal.

```bash
npm run worker:email
```

7. Create the first account.

Open `/signup`, create a user, then complete onboarding to create the first organization.

## Environment Variables

The app validates required environment variables at startup in `src/lib/env.ts`. Missing required values will fail fast.

### Required

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user@localhost:5432/skcript_mail` |
| `BETTER_AUTH_SECRET` | Session signing and link tracking | any secure random string |
| `NEXT_PUBLIC_APP_URL` | Public app URL used in emails and tracking links | `http://localhost:3000` |

### Optional

| Variable | Purpose | Notes |
|---|---|---|
| `RESEND_API_KEY` | Send transactional and campaign emails | Required for real email delivery |
| `RESEND_DOMAIN` | Verified sender domain | Example: `skcriptmail.com` |
| `RESEND_WEBHOOK_SECRET` | Verify Resend webhooks | Optional in development |
| `REDIS_URL` | BullMQ queue connection | Defaults to `redis://localhost:6379` if configured that way in your environment |
| `RAZORPAY_KEY_ID` | Razorpay payments | Dashboard credential |
| `RAZORPAY_KEY_SECRET` | Razorpay payments and signature verification | Dashboard credential |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay checkout UI | Usually the same public key as `RAZORPAY_KEY_ID` |
| `GOOGLE_CLIENT_ID` | Google login | Optional OAuth provider |
| `GOOGLE_CLIENT_SECRET` | Google login | Optional OAuth provider |
| `STRIPE_SECRET_KEY` | Stripe integration stub | Not fully implemented |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification stub | Not fully implemented |

## Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Start the development server |
| `build` | `next build` | Build the app for production |
| `start` | `next start` | Start the production server |
| `lint` | `eslint` | Run linting |
| `db:generate` | `drizzle-kit generate` | Generate migrations |
| `db:migrate` | `drizzle-kit migrate` | Apply migrations |
| `db:push` | `drizzle-kit push` | Push the schema directly to the database |
| `db:studio` | `drizzle-kit studio` | Open Drizzle Studio |
| `worker:email` | `npx tsx --env-file=.env.local src/worker/email-worker.ts` | Start the background email worker |

## Main Routes

- `/` landing page
- `/login`, `/signup`, `/forgot-password`, `/reset-password` authentication flow
- `/onboarding/setup` organization setup after signup
- `/dashboard` analytics overview
- `/campaigns` campaign list and creation flow
- `/templates` template management
- `/recipients` recipient lists and contacts
- `/settings` organization settings, team, activity, and billing

## Core Runtime Pieces

- `src/middleware.ts` protects app routes and redirects unauthenticated users.
- `src/lib/auth.ts` and `src/lib/auth-client.ts` configure Better Auth.
- `src/lib/db.ts` and `src/lib/db-schema.ts` define the database connection and schema.
- `src/lib/actions/*` contains the business logic for campaigns, dashboards, recipients, templates, and team management.
- `src/lib/email.ts`, `src/lib/queue/email-queue.ts`, and `src/worker/email-worker.ts` handle campaign delivery.
- `src/app/api/track/*` contains open and click tracking endpoints.
- `src/app/api/webhooks/*` handles Resend, Razorpay, and Stripe webhook traffic.

## Key Workflows

### Campaign Sending

1. A user creates a campaign from a template.
2. Recipients are selected from one or more lists.
3. The campaign is stored in the database and recipient jobs are queued in Redis.
4. The worker sends emails through Resend in the background.
5. Open, click, delivery, bounce, and complaint events are tracked back into the campaign tables.

### Tracking

- Open tracking uses a pixel endpoint.
- Click tracking rewrites links through a signed redirect endpoint.
- Unsubscribes are handled through a public tokenized route.

### Billing

- Razorpay powers the current billing flow.
- Stripe webhook support exists in the codebase, but it is not fully implemented yet.

## Notes For Local Development

- Run the Next.js server and the email worker in separate terminals.
- Make sure PostgreSQL, Redis, and the app environment variables are available before starting the app.
- If email delivery is not needed during development, you can still run the app, but campaign sending and worker-driven flows will not complete end to end without Resend and Redis.

## Known Gaps

From the documentation, these are still incomplete or intentionally left as future work:

- Stripe webhook verification
- CSRF protection beyond Better Auth defaults
- Rate limiting on public endpoints
- IP-based abuse detection on tracking endpoints

## Reference Docs

- [documentation.md](documentation.md) for the full technical reference
- [PRD.md](PRD.md) for the product requirements
- [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md) for agent-specific instructions
