# Skcript Mail (Berjil) — Complete Technical Documentation

**Last updated:** April 8, 2026
**Status:** Production-ready
**Version:** 0.1.0

---

## Table of Contents

1. [What Is Skcript Mail](#1-what-is-skcript-mail)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [How to Run](#4-how-to-run)
5. [Environment Variables](#5-environment-variables)
6. [Database Schema](#6-database-schema)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Security](#8-security)
9. [Core Workflows](#9-core-workflows)
10. [Server Actions (Business Logic)](#10-server-actions-business-logic)
11. [API Routes](#11-api-routes)
12. [Email Sending & Tracking](#12-email-sending--tracking)
13. [Email Worker (Background Jobs)](#13-email-worker-background-jobs)
14. [Frontend Pages & Components](#14-frontend-pages--components)
15. [Payments & Billing](#15-payments--billing)
16. [Data Isolation (Multi-Tenancy)](#16-data-isolation-multi-tenancy)
17. [What's Working vs. What's Remaining](#17-whats-working-vs-whats-remaining)

---

## 1. What Is Skcript Mail

Skcript Mail is a **B2B email campaign platform** that shows you exactly **who** opened your email, from **which company**, and at **what time** — not just aggregate open rates like Mailchimp.

**Core differentiator:** Individual-level read receipts + organisation-level rollup, purpose-built for B2B sales and marketing teams.

**Example:** You send a campaign to 500 people. Instead of seeing "32% open rate", you see:
- "Priya Sharma from Tata Corp opened at 2:14 PM"
- "3 out of 5 people at Infosys have opened — Ravi hasn't"
- "All 4 recipients at Zoho opened within 10 minutes"

**Target users:**
- **Campaign Managers** — create/send campaigns, track individual opens
- **Team Members** — operate under a shared org workspace
- **Org Admins** — manage team, billing, see all campaigns across all users

---

## 2. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 16.2.2 (App Router) | Server Actions for backend logic, single codebase |
| **Language** | TypeScript | Type safety across full stack |
| **Auth** | Better Auth 1.6.0 + organisation plugin | Self-hosted, multi-tenant teams, roles, invites built-in |
| **ORM** | Drizzle ORM 0.45.2 | ~7kb bundle (vs Prisma's 1.6MB), SQL-like syntax for analytics queries |
| **Database** | PostgreSQL 15 (local via Homebrew / Neon for prod) | Standard Postgres, no vendor lock-in |
| **DB Driver** | postgres.js (local) / @neondatabase/serverless (prod) | Auto-detected based on connection string |
| **UI** | React 19 + shadcn/ui + Tailwind CSS 4 | Utility-first, dark mode built-in |
| **Charts** | Recharts 3.8.0 | Battle-tested, matches shadcn design tokens |
| **Forms** | React Hook Form + Zod | Schema validation on both client and server |
| **Email Sending** | Resend SDK | Modern API, webhooks, React Email support, 3k emails/month free |
| **Webhook Verification** | Svix | HMAC-SHA256 signature verification for Resend webhooks |
| **Job Queue** | BullMQ + Redis (IORedis) | Background email sending with retries, rate limiting, concurrency |
| **Payments** | Razorpay (primary) + Stripe (stubbed) | Razorpay fully integrated, Stripe webhook handler exists but incomplete |
| **State** | Zustand | Available but not yet used |
| **Data Fetching** | TanStack Query | Available but not yet used |
| **Themes** | next-themes | Dark/light mode toggle |

---

## 3. Project Structure

```
Berjil/
├── drizzle/                    # Generated migration files
├── drizzle.config.ts           # Drizzle ORM config (schema path, DB credentials)
├── skcript-mail/               # Empty — reserved for future use
├── public/                     # Static assets
├── src/
│   ├── middleware.ts           # Auth middleware — protects all app routes
│   ├── app/
│   │   ├── layout.tsx          # Root layout (HTML shell, theme provider)
│   │   ├── page.tsx            # Landing/marketing page (public)
│   │   ├── not-found.tsx       # Custom 404 page
│   │   │
│   │   ├── (auth)/             # Public auth routes (no sidebar)
│   │   │   ├── login/          # Email/password + Google OAuth login
│   │   │   ├── signup/         # Registration
│   │   │   ├── forgot-password/# Request password reset email
│   │   │   ├── reset-password/ # Set new password (token from email)
│   │   │   └── onboarding/     # Post-signup org creation
│   │   │       └── setup/
│   │   │
│   │   ├── (app)/              # Protected routes (sidebar + topnav layout)
│   │   │   ├── layout.tsx      # App shell: sidebar + top nav
│   │   │   ├── error.tsx       # Global error boundary with retry
│   │   │   ├── dashboard/      # Main dashboard with stats, charts, activity
│   │   │   ├── campaigns/      # Campaign list, detail, create wizard
│   │   │   │   ├── page.tsx        # Campaign list
│   │   │   │   ├── [id]/page.tsx   # Campaign detail + analytics
│   │   │   │   └── new/page.tsx    # Campaign creation form
│   │   │   ├── templates/      # Template gallery + custom templates
│   │   │   │   ├── page.tsx        # Template list
│   │   │   │   └── new/page.tsx    # Create new template
│   │   │   ├── recipients/     # Recipient list management
│   │   │   │   ├── page.tsx        # All recipient lists
│   │   │   │   └── [id]/page.tsx   # Single list with recipients table
│   │   │   ├── profile/        # User profile settings
│   │   │   └── settings/       # Org settings hub
│   │   │       ├── page.tsx        # General settings
│   │   │       ├── billing/        # Plan management + payments
│   │   │       ├── team/           # Team members, invites, roles
│   │   │       └── activity/       # Audit log viewer
│   │   │
│   │   └── api/
│   │       ├── auth/[...all]/route.ts          # Better Auth catch-all
│   │       ├── track/
│   │       │   ├── open/[campaignId]/[recipientId]/route.ts   # Tracking pixel
│   │       │   └── click/[campaignId]/[recipientId]/route.ts  # Click redirect
│   │       ├── unsubscribe/[token]/route.ts    # One-click unsubscribe
│   │       ├── webhooks/
│   │       │   ├── resend/route.ts             # Resend event webhooks
│   │       │   ├── stripe/route.ts             # Stripe subscription events
│   │       │   └── razorpay/route.ts           # Razorpay payment events
│   │       └── razorpay/
│   │           ├── create-order/route.ts       # Create payment order
│   │           └── verify-payment/route.ts     # Verify + activate plan
│   │
│   ├── components/
│   │   ├── ui/                 # 25+ shadcn/ui primitives (button, card, dialog, etc.)
│   │   ├── sidebar.tsx         # Collapsible sidebar nav
│   │   └── top-nav.tsx         # Top bar with org name, user menu, theme toggle
│   │
│   ├── lib/
│   │   ├── actions/            # Server actions (all business logic)
│   │   │   ├── auth-helpers.ts     # Session extraction helpers
│   │   │   ├── campaigns.ts        # Campaign CRUD, send, stats, rollup
│   │   │   ├── dashboard.ts        # Dashboard stats, charts, activity
│   │   │   ├── recipients.ts       # Recipient list + recipient CRUD, CSV import
│   │   │   ├── templates.ts        # Template CRUD, gallery seeding
│   │   │   └── team.ts             # Team members, invites, billing, audit log
│   │   ├── queue/              # BullMQ queue configuration
│   │   ├── auth.ts             # Better Auth server config (providers, callbacks, plugins)
│   │   ├── auth-client.ts      # Better Auth client hooks (signIn, signUp, useSession)
│   │   ├── db.ts               # Drizzle + database connection
│   │   ├── db-schema.ts        # Complete database schema (16 tables)
│   │   ├── email.ts            # Resend email service (campaign + transactional)
│   │   ├── env.ts              # Environment variable validation
│   │   ├── razorpay.ts         # Razorpay client instance
│   │   ├── redis.ts            # IORedis connection
│   │   ├── tracking.ts         # Tracking pixel, click tracking, unsubscribe URL utilities
│   │   └── utils.ts            # General utilities (cn, formatters)
│   │
│   ├── types/                  # TypeScript type definitions
│   └── worker/
│       └── email-worker.ts     # Standalone BullMQ worker process
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── components.json             # shadcn/ui configuration
├── PRD.md                      # Product Requirements Document
├── CLAUDE.md                   # AI agent instructions
└── AGENTS.md                   # AI agent rules
```

---

## 4. How to Run

### Prerequisites
- Node.js 20+
- PostgreSQL 15 (via Homebrew or Docker)
- Redis (for email worker queue)

### Local Development

```bash
# 1. Start PostgreSQL
brew services start postgresql@15

# 2. Create the database (first time only)
psql -d postgres -c "CREATE DATABASE skcript_mail;"

# 3. Install dependencies
cd ~/Downloads/Berjil
npm install

# 4. Set up environment variables
# Copy .env.example to .env.local and fill in values (see Section 5)

# 5. Push the database schema
npx drizzle-kit push

# 6. Start the dev server
npm run dev
# App runs at http://localhost:3000

# 7. Start the email worker (separate terminal)
npm run worker:email

# 8. First-time setup
# Visit /signup → create account → create org → land on dashboard
```

### Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Start development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `eslint` | Run linter |
| `db:generate` | `drizzle-kit generate` | Generate migration files |
| `db:migrate` | `drizzle-kit migrate` | Apply migrations |
| `db:push` | `drizzle-kit push` | Push schema directly (dev only) |
| `db:studio` | `drizzle-kit studio` | Open Drizzle Studio GUI |
| `worker:email` | `tsx src/worker/email-worker.ts` | Start background email worker |

---

## 5. Environment Variables

Validated at startup in `/src/lib/env.ts`. Missing required vars will crash the app immediately.

### Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://varunraj@localhost:5432/skcript_mail` |
| `BETTER_AUTH_SECRET` | Session signing + HMAC key for link tracking | Any secure random string (32+ chars) |
| `NEXT_PUBLIC_APP_URL` | Public app URL (used in tracking pixels, emails) | `http://localhost:3000` |

### Optional (feature-specific)

| Variable | Feature | Notes |
|----------|---------|-------|
| `RESEND_API_KEY` | Email sending | Required for actual email delivery |
| `RESEND_DOMAIN` | Sender domain | e.g. `skcriptmail.com` — must be verified in Resend |
| `RESEND_WEBHOOK_SECRET` | Webhook verification | From Resend dashboard; skipped in dev if missing |
| `REDIS_URL` | BullMQ job queue | Default: `redis://localhost:6379` |
| `RAZORPAY_KEY_ID` | Payment processing | Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | Payment + webhook verification | Razorpay dashboard |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client-side payment modal | Same as `RAZORPAY_KEY_ID` |
| `GOOGLE_CLIENT_ID` | Google OAuth login | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth login | Google Cloud Console |
| `STRIPE_SECRET_KEY` | Stripe payments (TODO) | Not yet fully integrated |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification (TODO) | Not yet fully integrated |

---

## 6. Database Schema

**16 tables total** — 7 managed by Better Auth, 9 application-specific.

### Better Auth Tables (auto-managed)

These are created and managed by Better Auth. Do not modify directly.

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user` | User accounts | id, email (unique), name, emailVerified, image, createdAt |
| `session` | Active sessions | id, token (unique), userId, expiresAt, ipAddress, userAgent |
| `account` | Auth providers | userId, provider, accessToken, refreshToken, password (hashed) |
| `verification` | Email/reset tokens | identifier, value, expiresAt |
| `organization` | Orgs | id, name, slug (unique), logo, metadata |
| `member` | Org memberships | orgId, userId, role (owner/admin/member) |
| `invitation` | Pending invites | orgId, email, role, status, expiresAt, inviterId |

### Application Tables

**`organisations`** — Extended billing data for each org
```
id              TEXT PK (refs organization.id)
plan            TEXT DEFAULT 'free'    — free / pro / business
stripe_customer_id       TEXT NULLABLE
stripe_subscription_id   TEXT NULLABLE
razorpay_customer_id     TEXT NULLABLE
razorpay_subscription_id TEXT NULLABLE
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**`templates`** — Email templates (gallery presets + user-created)
```
id              UUID PK
org_id          TEXT FK → organization.id
created_by      TEXT FK → user.id
name            TEXT
subject         TEXT
content_json    JSONB         — template content (TipTap JSON or raw)
content_html    TEXT          — pre-rendered HTML
is_gallery      BOOLEAN       — true = system-provided preset
thumbnail_url   TEXT NULLABLE
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**`recipient_lists`** — Grouping container for recipients
```
id              UUID PK
org_id          TEXT FK → organization.id
name            TEXT
description     TEXT NULLABLE
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**`recipients`** — Individual email contacts
```
id              UUID PK
org_id          TEXT FK → organization.id
list_id         UUID FK → recipient_lists.id
email           TEXT          — UNIQUE per (org_id, email)
first_name      TEXT NULLABLE
last_name       TEXT NULLABLE
company         TEXT NULLABLE — auto-detected from email domain
metadata        JSONB         — custom fields from CSV import
status          TEXT DEFAULT 'active'  — active / unsubscribed / bounced / complained
engagement_score INTEGER DEFAULT 0    — cold(0) / warm(1-3) / hot(4+)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**`campaigns`** — Email campaigns
```
id              UUID PK
org_id          TEXT FK → organization.id
created_by      TEXT FK → user.id
template_id     UUID FK → templates.id NULLABLE
name            TEXT
subject         TEXT
preview_text    TEXT NULLABLE
content_json    JSONB
content_html    TEXT
from_name       TEXT
from_email      TEXT
reply_to        TEXT NULLABLE
status          TEXT DEFAULT 'draft'  — draft / scheduled / sending / sent / paused / failed
scheduled_at    TIMESTAMPTZ NULLABLE
sent_at         TIMESTAMPTZ NULLABLE
tags            JSONB DEFAULT '[]'
stats_cache     JSONB  — {sent, opened, clicked, bounced, unique_opens, unique_clicks}
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**`campaign_recipients`** — Per-recipient delivery state (denormalized for fast reads)
```
id              UUID PK
campaign_id     UUID FK → campaigns.id       — UNIQUE(campaign_id, recipient_id)
recipient_id    UUID FK → recipients.id
resend_email_id TEXT NULLABLE                — Resend API message ID for webhook correlation
status          TEXT DEFAULT 'pending'       — pending / sent / delivered / opened / clicked / bounced / complained
sent_at         TIMESTAMPTZ NULLABLE
delivered_at    TIMESTAMPTZ NULLABLE
first_opened_at TIMESTAMPTZ NULLABLE
last_opened_at  TIMESTAMPTZ NULLABLE
open_count      INTEGER DEFAULT 0            — tracks repeat opens
first_clicked_at TIMESTAMPTZ NULLABLE
click_count     INTEGER DEFAULT 0
bounced_at      TIMESTAMPTZ NULLABLE
bounce_type     TEXT NULLABLE                — hard / soft
```

**`campaign_events`** — Append-only event log (audit trail, never updated)
```
id              UUID PK
campaign_id     UUID FK → campaigns.id
recipient_id    UUID FK → recipients.id
event_type      TEXT  — sent / delivered / opened / clicked / bounced / complained / unsubscribed
event_data      JSONB NULLABLE
                  clicks:  {url: "https://..."}
                  bounces: {bounce_type: "hard"}
                  opens:   {ip: "1.2.3.4", user_agent: "..."}
created_at      TIMESTAMPTZ DEFAULT now()
```

**`unsubscribes`** — Unsubscribe records (per-org suppression list)
```
id              UUID PK
org_id          TEXT FK → organization.id
email           TEXT
campaign_id     UUID FK → campaigns.id NULLABLE
unsubscribed_at TIMESTAMPTZ
```

**`audit_log`** — Team audit trail for compliance
```
id              UUID PK
org_id          TEXT FK → organization.id
user_id         TEXT FK → user.id
action          TEXT   — e.g. "campaign.sent", "member.invited", "template.created"
entity_type     TEXT
entity_id       TEXT
metadata        JSONB NULLABLE
created_at      TIMESTAMPTZ
```

### Indexes

```sql
-- Campaign events (high-volume reads)
CREATE INDEX idx_events_campaign    ON campaign_events (campaign_id, created_at DESC);
CREATE INDEX idx_events_dedup       ON campaign_events (campaign_id, recipient_id, event_type);

-- Campaign recipients
CREATE INDEX idx_cr_campaign_status ON campaign_recipients (campaign_id, status);
CREATE INDEX idx_cr_recipient       ON campaign_recipients (recipient_id);

-- Recipients
CREATE INDEX idx_recipients_org_email  ON recipients (org_id, email);  -- also UNIQUE constraint
CREATE INDEX idx_recipients_org_status ON recipients (org_id, status);

-- Campaigns
CREATE INDEX idx_campaigns_org ON campaigns (org_id, status, created_at DESC);

-- Audit
CREATE INDEX idx_audit_org ON audit_log (org_id, created_at DESC);
```

### Stats Caching Strategy

Three layers of data redundancy, each optimized for different read patterns:

1. **`campaign_events`** — Append-only truth log. Used for auditing and debugging. Never mutated.
2. **`campaign_recipients`** — Materialized state per recipient. Updated on each webhook event. Used for the individual opens/clicks table.
3. **`campaigns.stats_cache`** — Pre-aggregated counts (sent, opened, clicked, bounced). Dashboard reads one row with zero COUNT queries.

Event flow: Webhook arrives → append to `campaign_events` → update `campaign_recipients` row → increment `stats_cache` JSONB.

---

## 7. Authentication & Authorization

### Auth System: Better Auth

All auth data lives in the app's own PostgreSQL database — no external auth service dependency.

### Providers

| Provider | Status | Notes |
|----------|--------|-------|
| Email + Password | Working | Minimum 8 characters |
| Google OAuth | Configured | Requires `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` |

### Session Management

- **Storage:** HTTP-only cookies
- **Cookie name:** `better-auth.session_token` (or `__Secure-better-auth.session_token` on HTTPS)
- **Session lifetime:** 7 days (604,800 seconds)
- **Auto-refresh:** Sessions older than 1 day are automatically refreshed on activity
- **Contents:** userId, email, name, activeOrganizationId

### Auth Flows

**Sign Up:**
1. User enters name, email, password at `/signup`
2. Better Auth creates `user` + `account` records
3. Verification email sent via Resend (if `RESEND_API_KEY` configured)
4. User redirected to `/onboarding/setup` to create their org
5. Org created via Better Auth's organisation plugin → user becomes Owner
6. `ensureOrgRecord()` creates the extended `organisations` row with billing fields
7. Redirect to `/dashboard`

**Login:**
1. User enters credentials at `/login`
2. Better Auth validates and creates session
3. App calls `organization.setActive()` to set the active org on the session (fixes a bug where login had no `activeOrganizationId`)
4. Redirect to dashboard or `callbackUrl`

**Password Reset:**
1. User enters email at `/forgot-password`
2. Better Auth generates reset token, `sendResetPassword` callback sends email via Resend
3. Email contains link to `/reset-password?token=xxx`
4. User sets new password → token consumed → redirect to login

**Email Verification:**
1. On signup, `sendVerificationEmail` callback fires
2. Resend delivers verification email with link
3. User clicks link → Better Auth marks `emailVerified = true`

**Team Invite:**
1. Admin sends invite from Settings > Team
2. Better Auth creates `invitation` record
3. (TODO) Invite email sent via Resend
4. Invitee clicks link → signs up → auto-joins org as Member

### Role System

| Role | Capabilities |
|------|-------------|
| **Owner** | Full access, delete org, manage billing, manage all members |
| **Admin** | See all campaigns, manage members (except owner), invite |
| **Member** | Create and manage own campaigns, view own analytics |

### Middleware (Route Protection)

**File:** `/src/middleware.ts`

All routes are protected by default. The middleware checks for a session cookie and redirects unauthenticated users to `/login?callbackUrl={attempted_path}`.

**Public paths (no auth required):**
- `/` — Landing page
- `/login`, `/signup`, `/forgot-password` — Auth pages
- `/api/auth/[...]` — Better Auth API endpoints
- `/api/track/[...]` — Tracking pixel and click endpoints (must be public for email opens)
- `/api/unsubscribe/[...]` — Unsubscribe handler (must be public)
- `/api/webhooks/[...]` — Resend, Stripe, Razorpay webhooks

**Static assets** (`_next/`, `.svg`, `.png`, `.ico`, etc.) are also excluded from auth checks.

---

## 8. Security

### HMAC-Signed Click Tracking

Every link in campaign emails is rewritten to pass through the click tracker. The original URL is HMAC-signed to prevent tampering.

**Signing (at send time):**
```
original_url → HMAC-SHA256(original_url, BETTER_AUTH_SECRET) → signature
wrapped_url  → /api/track/click/{campaignId}/{recipientId}?url={encoded_original}&sig={signature}
```

**Verification (at click time):**
```typescript
// Timing-safe comparison to prevent timing attacks
const expected = createHmac("sha256", secret).update(url).digest("hex");
timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
```

If the signature is invalid, the request is rejected — no redirect, no tracking.

### Webhook Signature Verification

**Resend webhooks** — verified via Svix library:
```typescript
const wh = new Webhook(RESEND_WEBHOOK_SECRET);
wh.verify(body, {
  "webhook-id": headers["webhook-id"],
  "webhook-timestamp": headers["webhook-timestamp"],
  "webhook-signature": headers["webhook-signature"],
});
```
Falls back to warning-only mode in development if `RESEND_WEBHOOK_SECRET` is not set.

**Razorpay webhooks** — verified via HMAC-SHA256:
```typescript
const expected = createHmac("sha256", RAZORPAY_KEY_SECRET).update(rawBody).digest("hex");
timingSafeEqual(Buffer.from(expected), Buffer.from(headers["x-razorpay-signature"]));
```

**Razorpay payment verification** — signature on `orderId|paymentId`:
```typescript
const expected = createHmac("sha256", RAZORPAY_KEY_SECRET)
  .update(`${orderId}|${paymentId}`)
  .digest("hex");
timingSafeEqual(Buffer.from(expected), Buffer.from(clientSignature));
```

**Stripe webhooks** — TODO: needs `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`. Currently accepts any valid JSON in dev mode.

### Multi-Tenant Data Isolation

Every database query includes `WHERE org_id = ?` via the user's session context. This is enforced at the server action level:

1. `requireSession()` extracts `userId` and `orgId` from the session cookie
2. Every Drizzle query filters by `orgId`
3. No cross-org data leakage is possible through normal application flow

### Tracking Endpoint Hardening

- **Open pixel:** UUID format validated via regex before DB query. Returns the 1x1 GIF regardless of whether the IDs are valid (no information leakage).
- **Click tracker:** HMAC verification required. Invalid signatures get no redirect.
- **Unsubscribe:** Token is base64url-encoded JSON (`{email, orgId, campaignId}`). Decoded and validated before processing.

### Audit Logging

All significant actions are recorded in the `audit_log` table:
- `campaign.created`, `campaign.sent`, `campaign.deleted`
- `member.invited`, `member.removed`
- `template.created`, `template.deleted`
- `plan.changed`

Each entry includes: orgId, userId, action, entityType, entityId, metadata, timestamp.

### Email Compliance

- **List-Unsubscribe header:** Added to every campaign email (RFC 2369)
- **List-Unsubscribe-Post header:** Supports one-click unsubscribe (RFC 8058)
- **Unsubscribe footer:** Visible unsubscribe link appended to every email body
- **Bounce suppression:** Hard-bounced recipients auto-marked as `status = "bounced"` and excluded from future sends
- **Complained suppression:** Recipients who mark as spam get `status = "complained"`

### Environment Variable Validation

`/src/lib/env.ts` validates all required variables at import time. Missing a required variable crashes the app immediately with a clear error message — no silent failures.

### What's NOT Yet Implemented

- API rate limiting on public endpoints (tracking pixel, webhooks)
- Stripe webhook signature verification
- CSRF protection beyond what Better Auth provides
- IP-based abuse detection on tracking endpoints

---

## 9. Core Workflows

### Workflow 1: Campaign Creation & Sending (End-to-End)

```
User clicks "New Campaign"
│
├─ Step 1: SELECT TEMPLATE
│  └─ Choose from gallery presets or custom templates (loaded from DB)
│
├─ Step 2: SELECT RECIPIENTS
│  └─ Pick one or more recipient lists (shows active count per list)
│
├─ Step 3: CAMPAIGN SETTINGS
│  └─ Campaign name, subject line, from name, from email, reply-to, tags
│
├─ Step 4: REVIEW & SEND
│  └─ Summary with recipient count → "Send Now" or "Save as Draft"
│
▼ On "Send Now":
│
├─ 1. Campaign record created in `campaigns` table (status: "sending")
├─ 2. `campaign_recipients` rows created for all active recipients in selected lists
├─ 3. Jobs enqueued to Redis via BullMQ (batches of 50)
│
▼ Email Worker (background process):
│
├─ 4. For each recipient:
│   ├─ Fetch campaign content + recipient data
│   ├─ Rewrite all links through click tracker (HMAC-signed)
│   ├─ Inject 1x1 tracking pixel before </body>
│   ├─ Append unsubscribe footer with one-click link
│   ├─ Add List-Unsubscribe headers
│   └─ Send via Resend API
│
├─ 5. On success: mark campaign_recipient as "sent", store resendEmailId
├─ 6. On failure: retry 3x with exponential backoff, then mark as "bounced" (soft)
├─ 7. When all recipients processed: set campaign status to "sent"
└─ 8. Audit log entry recorded
```

### Workflow 2: Email Open Tracking

```
Recipient opens email in their email client
│
├─ Email client loads images, including the tracking pixel:
│  GET /api/track/open/{campaignId}/{recipientId}
│
├─ Server immediately returns 1x1 transparent GIF (43 bytes, <50ms)
│
└─ Asynchronously (fire-and-forget):
   ├─ Insert into campaign_events (type: "opened", data: {ip, user_agent})
   ├─ Update campaign_recipients:
   │   ├─ status → "opened"
   │   ├─ first_opened_at (set only on first open)
   │   ├─ last_opened_at (always updated)
   │   └─ open_count++
   └─ Update campaigns.stats_cache (increment opened count)
```

**Limitation:** If the recipient's email client blocks images (Apple Mail privacy, Outlook with images disabled), the open will not be detected. The product is transparent about this.

### Workflow 3: Click Tracking

```
Recipient clicks a link in the email
│
├─ Link goes to: /api/track/click/{campaignId}/{recipientId}?url={original}&sig={hmac}
│
├─ Server verifies HMAC signature (timing-safe comparison)
│  ├─ If invalid: reject request (no redirect)
│  └─ If valid: continue
│
├─ Log click event to campaign_events (type: "clicked", data: {url})
├─ Update campaign_recipients (status → "clicked", click_count++)
│
└─ 302 redirect to the original URL
```

### Workflow 4: Resend Webhook Processing

```
Resend sends webhook to POST /api/webhooks/resend
│
├─ Verify Svix signature (webhook-id, webhook-timestamp, webhook-signature)
│
├─ Parse event type:
│  ├─ "email.delivered" → campaign_recipients.status = "delivered", set delivered_at
│  ├─ "email.opened"    → same as tracking pixel (in case of proxy opens)
│  ├─ "email.clicked"   → same as click tracker
│  ├─ "email.bounced"   → mark as bounced, set bounce_type (hard/soft)
│  │                      Hard bounce: also update recipients.status = "bounced"
│  ├─ "email.complained"→ mark as complained, update recipients.status = "complained"
│  └─ other             → ignored
│
└─ Correlation: webhook payload contains resendEmailId → matched to campaign_recipients.resend_email_id
```

### Workflow 5: Unsubscribe

```
Recipient clicks unsubscribe link in email footer
│
├─ GET /api/unsubscribe/{token}
│  token = base64url({ email, orgId, campaignId })
│
├─ Decode and validate token
├─ Insert into `unsubscribes` table
├─ Update `recipients.status` = "unsubscribed" (for this org)
├─ Insert campaign_event (type: "unsubscribed")
│
└─ Return HTML confirmation page: "You have been unsubscribed"
```

### Workflow 6: Onboarding (New User)

```
1. Visit /signup → enter name, email, password
2. Better Auth creates user + account, sends verification email
3. Redirect to /onboarding/setup
4. Enter company/org name
5. Better Auth creates organization + member (role: owner)
6. ensureOrgRecord() creates the `organisations` table entry (plan: "free")
7. Redirect to /dashboard (empty state)
```

### Workflow 7: Payment (Razorpay)

```
1. User visits Settings > Billing, clicks "Upgrade to Pro"
2. POST /api/razorpay/create-order → Razorpay order created (amount based on plan)
3. Razorpay checkout modal opens in browser
4. User completes payment
5. POST /api/razorpay/verify-payment → server verifies signature
6. On success: upsert organisations.plan = "pro", store razorpay IDs
7. Razorpay webhook also fires → POST /api/webhooks/razorpay → double-confirms plan update
```

---

## 10. Server Actions (Business Logic)

All business logic lives in `/src/lib/actions/`. Every action calls `requireSession()` first to extract the authenticated user's `userId` and `orgId`, ensuring multi-tenant data isolation.

### `auth-helpers.ts`

| Function | Purpose |
|----------|---------|
| `getSessionContext()` | Returns `{ userId, userName, userEmail, orgId }` from session cookie |
| `requireSession()` | Same as above but throws if not authenticated |

### `campaigns.ts`

| Function | Purpose |
|----------|---------|
| `getCampaigns()` | List all campaigns for the org, ordered by creation date |
| `getCampaign(id)` | Get single campaign by ID (with org scoping) |
| `getCampaignStats(campaignId)` | Aggregated stats: total, sent, delivered, opened, clicked, bounced |
| `getCampaignRecipients(campaignId)` | All recipients with delivery status, open/click counts, timestamps |
| `getCampaignOrgRollup(campaignId)` | Group recipients by company domain — shows who opened from which company |
| `getCampaignTimeline(campaignId)` | Hourly breakdown of opens/clicks for timeline chart |
| `createCampaign(data)` | Create campaign + generate `campaign_recipients` entries from selected lists |
| `sendCampaign(campaignId)` | Enqueue email jobs to Redis (batches of 50). Guards against double-send |
| `duplicateCampaign(campaignId)` | Clone campaign (name, subject, content) without recipients |
| `deleteCampaign(campaignId)` | Delete campaign |
| `exportCampaignCSV(campaignId)` | Generate CSV with all recipient metrics |
| `resendToNonOpeners(campaignId)` | Create new campaign targeting only recipients who didn't open |

### `dashboard.ts`

| Function | Purpose |
|----------|---------|
| `getDashboardStats()` | Org-wide totals: campaigns, emails sent, open/click/bounce rates, active recipients |
| `getRecentCampaigns()` | Last 5 campaigns with stats cache |
| `getRecentActivity()` | Last 20 audit log entries |
| `getOpensOverTime()` | Opens per day for last 7 days (chart data) |

### `recipients.ts`

| Function | Purpose |
|----------|---------|
| `getRecipientLists()` | All lists with counts (active, bounced, unsubscribed) |
| `getRecipientList(id)` | Single list details |
| `createRecipientList(data)` | Create new list |
| `updateRecipientList(id, data)` | Update name/description |
| `deleteRecipientList(id)` | Delete list and all its recipients |
| `getRecipients(listId, filters?)` | Paginated recipients with search and status filter |
| `getRecipientStats()` | Org-wide: total, active, unsubscribed, bounced |
| `addRecipient(data)` | Add single recipient, auto-detect company from email domain |
| `addRecipientsFromCSV(listId, rows)` | Bulk import, skips duplicates |
| `deleteRecipient(id)` | Remove single recipient |

### `templates.ts`

| Function | Purpose |
|----------|---------|
| `getTemplates()` | User's custom templates for this org |
| `getGalleryTemplates()` | System gallery templates (isGallery=true) |
| `getTemplate(id)` | Single template |
| `createTemplate(data)` | Create custom template |
| `updateTemplate(id, data)` | Update template content |
| `deleteTemplate(id)` | Delete template |
| `duplicateTemplate(id)` | Clone template with "(Copy)" suffix |
| `seedGalleryTemplates()` | Insert 5 preset templates (Product Launch, Newsletter, Event, Welcome, Plain Text) |

### `team.ts`

| Function | Purpose |
|----------|---------|
| `getTeamMembers()` | All org members with role and join date |
| `getPendingInvitations()` | Pending invite list |
| `getOrgPlan()` | Current plan details (free/pro/business) |
| `ensureOrgRecord()` | Create `organisations` row if missing (called during onboarding) |
| `getAuditLog()` | Last 50 org activities |
| `inviteTeamMember(email, role)` | Send invite via Better Auth |
| `removeTeamMember(memberId)` | Remove member from org |
| `changeTeamMemberRole(memberId, role)` | Update member role |
| `revokeInvitation(invitationId)` | Cancel pending invite |
| `deleteOrganisation()` | Owner-only: delete org and all associated data |
| `getCampaignUsage()` | Count campaigns sent in last 30 days (for plan limit checks) |

---

## 11. API Routes

### Auth

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/auth/[...all]` | ALL | Better Auth catch-all handler | Public |

Handles: login, signup, logout, session refresh, password reset, email verification, Google OAuth, org management, invitations.

### Tracking (Public — called from emails)

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/track/open/[campaignId]/[recipientId]` | GET | Returns 1x1 transparent GIF, logs open event | Public (UUID-validated) |
| `/api/track/click/[campaignId]/[recipientId]` | GET | Verifies HMAC, logs click, 302 redirects | Public (HMAC-verified) |
| `/api/unsubscribe/[token]` | GET | Processes unsubscribe, returns confirmation page | Public (token-verified) |

### Webhooks (Public — called by external services)

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/webhooks/resend` | POST | Email delivery/bounce/open/click events | Svix signature |
| `/api/webhooks/razorpay` | POST | Payment captured, subscription events | HMAC signature |
| `/api/webhooks/stripe` | POST | Subscription lifecycle events | TODO: needs Stripe verification |

### Payments (Authenticated)

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/razorpay/create-order` | POST | Create Razorpay order for plan upgrade | Session required |
| `/api/razorpay/verify-payment` | POST | Verify payment signature, activate plan | Session required |

---

## 12. Email Sending & Tracking

### Email Processing Pipeline

When a campaign email is sent, the raw HTML goes through these transformations:

1. **Link rewriting** — Every `href="http(s)://..."` is replaced with a click-tracking URL:
   ```
   /api/track/click/{campaignId}/{recipientId}?url={encoded_original}&sig={hmac_signature}
   ```

2. **Unsubscribe footer** — Appended before `</body>`:
   ```html
   <div style="text-align:center;padding:20px;font-size:12px;color:#999;">
     <a href="/api/unsubscribe/{token}">Unsubscribe</a>
   </div>
   ```

3. **Tracking pixel injection** — Inserted before `</body>`:
   ```html
   <img src="/api/track/open/{campaignId}/{recipientId}" width="1" height="1" style="display:none" />
   ```

4. **Email headers** — Added for email client unsubscribe support:
   ```
   List-Unsubscribe: </api/unsubscribe/{token}>
   List-Unsubscribe-Post: List-Unsubscribe=One-Click
   ```

### Two Email Modes

| Mode | Function | Tracking | Unsubscribe | Used For |
|------|----------|----------|-------------|----------|
| Campaign | `sendCampaignEmail()` | Yes (pixel + click) | Yes (footer + headers) | Marketing emails |
| Transactional | `sendTransactionalEmail()` | No | No | Password resets, verification, invites |

### Tracking Utilities (`/src/lib/tracking.ts`)

| Function | Purpose |
|----------|---------|
| `getTrackingPixelUrl(campaignId, recipientId)` | Build pixel URL |
| `getTrackingPixelHtml(campaignId, recipientId)` | Build `<img>` tag |
| `signUrl(url)` | HMAC-SHA256 sign a URL |
| `wrapLinkWithTracking(url, campaignId, recipientId)` | Build full click-tracking redirect URL |
| `generateUnsubscribeToken(email, orgId, campaignId)` | base64url-encode unsubscribe payload |
| `getUnsubscribeUrl(email, orgId, campaignId)` | Build full unsubscribe URL |

---

## 13. Email Worker (Background Jobs)

**File:** `/src/worker/email-worker.ts`
**Run:** `npm run worker:email` (separate process)

The worker is a standalone Node.js process that connects to Redis and processes email-sending jobs asynchronously.

### Configuration

| Setting | Value |
|---------|-------|
| Queue name | `email-sending` |
| Concurrency | 5 parallel workers |
| Rate limit | 10 jobs/second |
| Retries | 3 attempts |
| Backoff | Exponential (2000ms base) |
| Job ID | `{campaignId}_{recipientId}` (deterministic, prevents duplicates) |

### Job Payload

```typescript
{
  campaignId: string,
  recipientId: string,
  crId: string,          // campaign_recipients row ID
  email: string,
  firstName: string,
  fromAddress: string,
  replyTo: string,
  subject: string,
  contentHtml: string,
  orgId: string
}
```

### Processing Flow

1. **Dequeue job** from Redis
2. **Call `sendCampaignEmail()`** — processes HTML (link rewriting, pixel, unsubscribe), sends via Resend
3. **On success:**
   - Update `campaign_recipients`: status="sent", sentAt, resendEmailId
   - Insert `campaign_events` entry (type: "sent")
4. **On failure (all retries exhausted):**
   - Update `campaign_recipients`: status="bounced", bouncedAt, bounceType="soft"
5. **After each job:**
   - Check if all recipients for this campaign are processed (no "pending" remaining)
   - If complete: set campaign status to "sent" (or "failed" if all bounced)
   - Recompute `stats_cache` with final counts

### Deployment

The worker requires a persistent Node.js process — it cannot run on serverless (Vercel). Deploy options:
- Railway or Render (as a separate service)
- Any VPS/server with `node` + Redis access
- Docker container

---

## 14. Frontend Pages & Components

### Landing Page (`/`)
- Hero: "Mailchimp shows rates. We show names."
- 6 feature cards (read receipts, org rollup, analytics, click tracking, multi-user, engagement)
- 3-tier pricing table (Free / Pro at $12/mo / Business at $49/mo)
- CTA to `/signup`

### Dashboard (`/dashboard`)
- **4 stat cards:** Total Sent, Open Rate %, Click Rate %, Bounce Rate %
- **Opens Over Time chart:** 7-day line graph (Recharts)
- **Recent Campaigns:** Last 5 campaigns with stats
- **Activity Feed:** Last 20 audit log entries (live)
- **Deliverability Health:** Color-coded indicators (green/yellow/red for bounce, open, complaint rates)

### Campaigns
- **List (`/campaigns`):** All campaigns with status badges, search, duplicate/delete actions
- **Detail (`/campaigns/[id]`):**
  - Stats overview (sent, delivered, opened, clicked, bounced)
  - Individual opens table (name, email, company, timestamp)
  - Organisation rollup table (which companies opened, how many from each)
  - Timeline chart (hourly open/click breakdown)
  - Actions: Send, Duplicate, Resend to Non-Openers, Export CSV, Delete
- **Create (`/campaigns/new`):**
  - Select recipient lists
  - Choose template (optional)
  - Subject, from name/email, reply-to
  - Content editor
  - Schedule or send immediately

### Templates
- **List (`/templates`):** Custom templates + gallery presets
- **Create (`/templates/new`):** Name, subject, content editor
- 5 gallery presets auto-seeded: Product Launch, Newsletter, Event Invitation, Welcome, Plain Text

### Recipients
- **Lists (`/recipients`):** All lists with counts (total, active, unsubscribed, bounced)
- **Detail (`/recipients/[id]`):** Recipients table with search, status filter, add manually, CSV import, delete

### Settings
- **General (`/settings`):** Org name, slug
- **Team (`/settings/team`):** Members list with roles, invite, remove, role change, pending invitations, delete org
- **Billing (`/settings/billing`):** Current plan, usage, Razorpay upgrade button
- **Activity (`/settings/activity`):** Last 50 audit log entries

### Shared Components
- **Sidebar** — Collapsible left nav with links to all sections
- **TopNav** — Top bar with org name, user dropdown menu, theme toggle (dark/light)
- **Error Boundary** (`error.tsx`) — Global error handler with retry button
- **404 Page** (`not-found.tsx`) — Custom not-found page

---

## 15. Payments & Billing

### Plan Tiers

| | Free | Pro ($12/mo) | Business ($49/mo) |
|---|---|---|---|
| Team members | 1 | 5 | Unlimited |
| Campaigns/month | 3 | Unlimited | Unlimited |
| Emails/month | 500 | 10,000 | 100,000 |
| Open tracking | Aggregate only | Individual receipts | Individual receipts |
| Org rollup | No | Yes | Yes |
| Click tracking | No | Yes | Yes |
| CSV export | No | Yes | Yes |
| Engagement scoring | No | Yes | Yes |
| Custom domain | No | No | Yes |
| API access | No | No | Yes |

### Payment Providers

**Razorpay (fully integrated):**
- Order creation → Checkout modal → Signature verification → Plan activation
- Webhook handler for payment.captured, subscription.activated, subscription.cancelled
- HMAC-SHA256 signature verification on both payment verification and webhooks

**Stripe (partially integrated):**
- Webhook handler exists for checkout.session.completed, subscription.updated, subscription.deleted
- Checkout flow not yet implemented
- Webhook signature verification not yet implemented
- Needs Stripe SDK integration

### Plan Enforcement

- Campaign send count checked against plan limits (via `getCampaignUsage()`)
- Limits enforced at send time, not template creation
- In-app upgrade modal shown when limits hit

---

## 16. Data Isolation (Multi-Tenancy)

Skcript Mail uses **application-level multi-tenancy** (not database-level RLS).

### How It Works

1. **Every protected server action** calls `requireSession()` which returns the user's `orgId` from their session
2. **Every Drizzle query** includes `WHERE org_id = {orgId}` as a filter
3. **No shared query** can return data from another org
4. **Better Auth** manages org membership — users can only access orgs they belong to
5. **The middleware** ensures only authenticated users reach protected routes

### Example Pattern

```typescript
// Every server action follows this pattern:
export async function getCampaigns() {
  const { orgId } = await requireSession();
  return db.select().from(campaigns).where(eq(campaigns.orgId, orgId));
}
```

This replaces Supabase RLS with explicit query filters — the standard approach for most multi-tenant SaaS apps.

---

## 17. What's Working vs. What's Remaining

### Working

- Email/password authentication (signup, login, logout)
- Google OAuth (configured)
- Organisation creation and management
- Protected routes via middleware
- Template gallery (5 pre-built) + custom template CRUD
- Recipient list management + CSV import
- Company auto-detection from email domain
- Campaign creation wizard
- Campaign sending via Resend (real emails with tracking)
- BullMQ email worker with retries, rate limiting, concurrency
- Open tracking pixel (1x1 GIF, fire-and-forget)
- Click tracking with HMAC verification
- Unsubscribe handling (CAN-SPAM / GDPR compliant)
- Resend webhook handler (delivery, bounce, open, click events)
- Resend webhook signature verification (Svix)
- Campaign analytics (stats, timeline, individual opens, org rollup, bounces)
- Dashboard with real stats and live activity feed
- Team management (members, roles, invitations)
- Audit log tracking all actions
- Password reset flow (forgot → email → reset)
- Email verification on signup
- Auto-set active organization on login
- Dark/light theme toggle
- Campaign duplicate
- Resend to non-openers
- Razorpay payment integration (order, verify, webhook)
- Billing page with real plan and usage data
- Global error boundary with retry
- Custom 404 page
- Environment variable validation

### Needs External API Keys

| Feature | Service | Variable |
|---------|---------|----------|
| Email sending | Resend | `RESEND_API_KEY` (configured) |
| Webhook verification | Resend | `RESEND_WEBHOOK_SECRET` |
| Payments (India) | Razorpay | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| Google login | Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

**Note:** Resend free tier only allows sending to the account owner's email via `onboarding@resend.dev`. To send to real recipients, verify your domain in Resend dashboard (add DNS records).

### Remaining (Post-MVP)

- [ ] Stripe Checkout integration (webhook handler exists, needs Stripe SDK + checkout flow)
- [ ] Stripe webhook signature verification
- [ ] TipTap rich text editor for template editing (currently basic editor)
- [ ] Team member invitation emails via Resend (UI exists, email not sent)
- [ ] CSV export for opens/clicks (action exists, UI not wired)
- [ ] Schedule send (DB field exists, needs cron/scheduler to trigger at scheduled_at)
- [ ] Real-time updates via TanStack Query polling or SSE
- [ ] API rate limiting on tracking/webhook endpoints
- [ ] Domain verification guide in Resend for production email sending
- [ ] BullBoard monitoring dashboard for queue health
- [ ] Engagement score recalculation (cron job)
- [ ] Sentry error tracking integration
- [ ] Mobile responsiveness pass

---

**Connection string (local dev):** `postgresql://varunraj@localhost:5432/skcript_mail`
**Default app URL:** `http://localhost:3000`
**Email worker:** `npm run worker:email` (separate terminal)
