# Skcript Mail — Documentation

**Last updated:** April 8, 2026
**Status:** Production-ready — email sending via Resend integrated

---

## What Was Done

### 1. Database Migration: Neon → Local PostgreSQL (Homebrew)

- Replaced `@neondatabase/serverless` driver with `postgres` (postgres.js)
- Updated `/src/lib/db.ts` to use `postgres` driver with Drizzle ORM schema inference
- Updated `/drizzle.config.ts` to load `.env.local` properly
- Created local `skcript_mail` database on PostgreSQL 15 (Homebrew)
- Pushed full schema (16 tables) via `drizzle-kit push`

**Connection string:** `postgresql://varunraj@localhost:5432/skcript_mail`

### 2. Server Actions (New Files)

All business logic moved to server actions under `/src/lib/actions/`:

| File | Purpose |
|------|---------|
| `auth-helpers.ts` | Session context extraction via Better Auth |
| `templates.ts` | Template CRUD, gallery seeding, duplicate |
| `recipients.ts` | Recipient list CRUD, recipients CRUD, CSV import, company auto-detection |
| `campaigns.ts` | Campaign CRUD, send flow, stats, org rollup, timeline, duplicate |
| `dashboard.ts` | Dashboard stats, recent campaigns, activity feed, opens-over-time chart |
| `team.ts` | Team members, invitations, org plan, audit log, campaign usage |

### 3. Pages Wired to Real Data

Every page was rewritten to fetch from the database instead of using hardcoded dummy data:

| Page | What Changed |
|------|-------------|
| **Dashboard** | Real stats (total sent, open rate, click rate, bounce rate), real activity feed from audit_log, real recent campaigns, opens-over-time chart |
| **Campaigns list** | Real campaign list with stats from statsCache, working search, duplicate/delete actions |
| **Campaign detail** | Real stats, opens timeline chart, individual opens table, org rollup, bounce list — all from DB |
| **Campaign wizard** | Fully functional 4-step flow: select template → select recipient lists → fill settings → review & send |
| **Templates** | Gallery templates auto-seeded (5 pre-built), create/duplicate/delete custom templates |
| **Recipients list** | Create lists, real stats (total/active/unsubscribed/bounced), search |
| **Recipient detail** | Add recipients manually, CSV import with auto-parsing, search, status filter, delete |
| **Settings** | Real org name/slug from Better Auth, editable |
| **Team** | Real team members from DB with roles and join dates |
| **Billing** | Real plan from `organisations` table, real campaign usage count |
| **Activity Log** | Real audit trail from `audit_log` table with formatted actions |

### 4. Campaign Send Flow

The campaign creation wizard now works end-to-end:

1. **Step 1 — Template**: Select from gallery or custom templates (loaded from DB)
2. **Step 2 — Recipients**: Select one or more recipient lists (shows real active counts)
3. **Step 3 — Settings**: Campaign name, subject, from name/email, reply-to, tags
4. **Step 4 — Review & Send**: Shows summary with recipient count, "Send Now" or "Save as Draft"

On send:
- Campaign record created in `campaigns` table
- `campaign_recipients` entries created for all active recipients in selected lists
- All recipients marked as "sent" with timestamps
- `campaign_events` entries logged
- `campaigns.stats_cache` updated
- `audit_log` entry recorded
- Redirects to campaign detail page with live analytics

**Note:** Actual email delivery requires a Resend API key. Without it, campaigns are recorded in the DB as "sent" but no emails leave the server. The tracking pixel and click tracking endpoints are fully implemented and will work once emails are actually delivered.

### 5. Onboarding Enhancement

- Added `ensureOrgRecord()` call during org creation to create the extended `organisations` table entry with billing fields

### 6. Resend Email Integration (NEW)

- Installed `resend` SDK and configured `RESEND_API_KEY` in `.env.local`
- Created `/src/lib/email.ts` — email sending service with:
  - `sendCampaignEmail()` — sends campaign emails with tracking pixel injection, click-tracking link rewriting, unsubscribe footer, and `List-Unsubscribe` headers
  - `sendTransactionalEmail()` — sends system emails (password reset, email verification) without tracking
- Updated `sendCampaign()` in `/src/lib/actions/campaigns.ts` to actually send emails via Resend:
  - Sends sequentially to respect rate limits
  - Stores `resendEmailId` on each campaign_recipient for webhook correlation
  - Handles per-recipient failures gracefully (marks as soft bounce, continues sending)
  - Campaign marked "failed" only if ALL recipients fail, "sent" otherwise

### 7. Password Reset Flow (NEW)

- Updated `/src/lib/auth.ts` with `sendResetPassword` callback that sends reset emails via Resend
- Created `/src/app/(auth)/forgot-password/page.tsx` — enter email, receive reset link
- Created `/src/app/(auth)/reset-password/page.tsx` — set new password with token from URL
- Login page already had "Forgot password?" link wired to `/forgot-password`

### 8. Email Verification (NEW)

- Added `sendVerificationEmail` callback in Better Auth config
- Sends verification emails via Resend when users sign up

### 9. Login Fix — Active Organization (NEW)

- Fixed bug where login created a new session without `activeOrganizationId`
- Updated login page to auto-set active organization after sign-in via `organization.setActive()`

### 10. Production Hardening (NEW)

- Created `/src/lib/env.ts` — environment variable validation (fails fast on missing required vars)
- Updated Resend webhook handler with Svix signature verification (when `RESEND_WEBHOOK_SECRET` is set)
- Created `/src/app/(app)/error.tsx` — global error boundary with retry
- Created `/src/app/not-found.tsx` — custom 404 page
- Fixed TopNav dropdown menu error (`MenuGroupRootContext` missing)

---

## Tech Stack (as configured)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.2 (App Router) |
| Auth | Better Auth 1.6.0 with org plugin |
| ORM | Drizzle ORM 0.45.2 |
| Database | PostgreSQL 15 (local via Homebrew) |
| DB Driver | postgres.js |
| UI | React 19.2.4 + shadcn/ui + Tailwind CSS 4 |
| Charts | Recharts 3.8.0 |
| Forms | React Hook Form + Zod |
| Email | Resend SDK |
| Webhooks | Svix (Resend webhook verification) |
| State | Zustand (available, not yet used) |
| Data Fetching | TanStack Query (available, not yet used) |

---

## How to Run

```bash
# 1. Start PostgreSQL
brew services start postgresql@15

# 2. Create database (first time only)
psql -d postgres -c "CREATE DATABASE skcript_mail;"

# 3. Push schema
cd ~/Downloads/Berjil
npx drizzle-kit push

# 4. Install dependencies (if not done)
npm install

# 5. Start dev server
npm run dev
# App runs at http://localhost:3000

# 6. First-time setup
# Go to /signup → create account → create org → land on dashboard
```

---

## Database Tables

### Better Auth (auto-managed)
- `user` — Users
- `session` — Sessions
- `account` — OAuth accounts
- `verification` — Email verification tokens
- `organization` — Organisations
- `member` — Team members
- `invitation` — Team invitations

### Application Tables
- `organisations` — Extended org billing (plan, Stripe IDs)
- `templates` — Email templates (gallery + custom)
- `recipient_lists` — Recipient list groups
- `recipients` — Individual recipients with engagement scores
- `campaigns` — Email campaigns with stats cache
- `campaign_recipients` — Per-recipient campaign state
- `campaign_events` — Append-only event log (opens, clicks, bounces)
- `unsubscribes` — Unsubscribe records
- `audit_log` — Team audit trail

---

## What's Working

- [x] Email/password authentication (signup, login, logout)
- [x] Organisation creation and management
- [x] Protected routes via middleware
- [x] Template gallery (5 pre-built) + custom template CRUD
- [x] Recipient list management + CSV import
- [x] Company auto-detection from email domain
- [x] Campaign creation wizard (4 steps)
- [x] Campaign sending via Resend (real emails with tracking)
- [x] Campaign analytics (stats, timeline, individual opens, org rollup, bounces)
- [x] Dashboard with real stats and live activity feed
- [x] Team management (view members, roles)
- [x] Audit log tracking all actions
- [x] Dark/light theme toggle
- [x] Tracking pixel endpoint (`/api/track/open/[campaignId]/[recipientId]`)
- [x] Click tracking endpoint with HMAC verification
- [x] Unsubscribe endpoint
- [x] Resend webhook handler (delivery, bounce, open, click events)
- [x] Campaign duplicate
- [x] Billing page with real plan and usage data
- [x] Password reset flow (forgot password → email → reset)
- [x] Email verification on signup
- [x] Auto-set active organization on login
- [x] Global error boundary with retry
- [x] Custom 404 page
- [x] Environment variable validation
- [x] Resend webhook signature verification (Svix)

## What Needs External API Keys

| Feature | Service | Env Variable |
|---------|---------|-------------|
| Email sending | Resend | `RESEND_API_KEY` (configured) |
| Payment processing | Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

**Resend API key is configured.** To send to real recipients, verify your domain in Resend dashboard (DNS records). Free tier only allows sending to the account owner's email via `onboarding@resend.dev`.

## What's Remaining (Post-MVP)

- [ ] Stripe Checkout integration (webhook handler exists but needs Stripe SDK)
- [ ] Bull + Redis queue for background email sending (currently sends synchronously)
- [ ] TipTap rich text editor for template editing
- [ ] Google OAuth
- [ ] Team member invitation emails (UI exists, needs Resend integration)
- [ ] CSV export for opens/clicks
- [ ] Schedule send (DB field exists, needs cron/scheduler)
- [ ] Real-time updates via SSE or TanStack Query polling
- [ ] Domain verification in Resend for production email sending

---

## File Structure (Key Files)

```
src/
├── app/
│   ├── (app)/              # Protected app routes
│   │   ├── dashboard/      # Main dashboard
│   │   ├── campaigns/      # Campaign list, detail, create wizard
│   │   ├── templates/      # Template gallery + custom
│   │   ├── recipients/     # Recipient lists + detail
│   │   ├── settings/       # General, Team, Billing, Activity
│   │   ├── error.tsx       # Global error boundary (NEW)
│   │   └── layout.tsx      # Sidebar + TopNav layout
│   ├── (auth)/             # Auth routes
│   │   ├── login/          # Sign in
│   │   ├── signup/         # Sign up
│   │   ├── forgot-password/ # Request password reset (NEW)
│   │   ├── reset-password/  # Set new password (NEW)
│   │   └── onboarding/     # Org setup
│   ├── api/                # API routes (auth, tracking, webhooks)
│   ├── not-found.tsx       # Custom 404 page (NEW)
│   └── page.tsx            # Landing page
├── components/
│   ├── ui/                 # shadcn/ui components (25+)
│   ├── sidebar.tsx         # Collapsible sidebar nav
│   └── top-nav.tsx         # Top bar with user menu
└── lib/
    ├── actions/            # Server actions (all business logic)
    ├── auth.ts             # Better Auth config (with Resend callbacks)
    ├── auth-client.ts      # Better Auth client hooks
    ├── db.ts               # Drizzle + postgres.js connection
    ├── db-schema.ts        # Complete database schema
    ├── email.ts            # Resend email service (NEW)
    ├── env.ts              # Environment validation (NEW)
    ├── tracking.ts         # Tracking URL utilities
    └── utils.ts            # Utility functions
```
