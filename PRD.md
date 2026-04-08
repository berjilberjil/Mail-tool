New Skc f
ull
# Skcript Mail — Product Requirements Document (PRD)
**Prepared for:** Skcript Engineering Team
**Date:** April 2026 | Confidential
**Build Tool:** Claude Code (full access)
---
## 1. Problem Statement
Teams sending B2B email campaigns have **zero visibility** in
to WHO specifically opened their email, from which company, a
nd at exactly what time.
Tools like Mailchimp only give aggregate open rates — a numbe
r. They don't tell you:
- Which individual person opened it
- Which organisation they are from
- Exactly when (to the second) they opened it
- Whether everyone in that org has seen it or just one person
**Skcript Mail solves this** with individual-level read recei
pts + organisation-level rollup — purpose-built for B2B sales
& marketing teams.
---
## 2. Target Users
| Segment | Description |
|---------|-------------|
New Skc full 1
| **PRIMARY — Campaign Managers** | People inside a company w
ho create and send email campaigns. They need to know exactly
who read what and when. |
| **SECONDARY — Team Members** | Multiple users under the sam
e org account. Each uses the tool individually. All activity
visible to admin. |
| **TERTIARY — Org Admins** | Manage workspace, invite/remove
members, control billing, see all campaigns across all users
in the org. |
| **NOT FOR** | Solo freelancers (allowed on free plan but no
t the core use case). |
---
## 3. Value Proposition
> **Mailchimp shows you open RATES. Skcript Mail shows you op
en NAMES — with timestamps.**
| Differentiator | Description |
|----------------|-------------|
| Individual read receipts | Name + exact timestamp per recip
ient |
| Organisation rollup | How many from Tata Corp read it? Who
specifically? |
| First & last open time | Per organisation tracking |
| Multi-user workspace | Your whole team uses one account |
| Real-time dashboard | Live tracking as opens happen |
| Link click tracking | Who clicked what link, when |
| Engagement scoring | Cold/Warm/Hot recipient classification
|
| Bounce protection | Auto-suppress hard bounces, protect sen
der reputation |
---
New Skc full 2
## 4. Tech Stack
| Layer | Choice | Why This Over Alternatives |
|-------|--------|---------------------------|
| **Framework** | Next.js 15 (App Router + Server Actions) |
Server Actions eliminate separate API route files for CRUD. S
treaming + Suspense for analytics. One codebase for frontend
+ backend. |
| **Styling** | Tailwind CSS 4 | Utility-first, fast iteratio
n, pairs natively with shadcn/ui. |
| **Components** | shadcn/ui | Not a dependency — copies into
your project giving full control. Consistent design system wi
th dark mode built-in. |
| **Charts** | shadcn/ui Charts (Recharts-based) | Matches sh
adcn design tokens. Recharts is battle-tested. Tremor is heav
ier and brings conflicting design system. |
| **WYSIWYG Editor** | TipTap + shadcn-tiptap | Slate require
s building UI from scratch. BlockNote is less flexible for em
ail-specific needs. TipTap has mature extension ecosystem + f
irst-class shadcn integration. |
| **ORM** | Drizzle ORM | **~7kb vs Prisma's ~1.6MB bundle**
— critical for Vercel cold starts on high-traffic tracking pi
xel endpoint. SQL-like syntax is natural for analytics aggreg
ation queries. No binary engine dependency. |
| **Database** | PostgreSQL (via Neon) | Serverless Postgres
with generous free tier. Connection pooling built-in. No vend
or lock-in — standard PostgreSQL. Neon provides branching for
dev/staging environments. |
| **Auth** | Better Auth | Framework-agnostic, built for Nex
t.js App Router. Supports email+password, organisations/team
s, roles, and invites out of the box. No external service dep
endency — auth data lives in your own PostgreSQL database. Mo
re flexible than Clerk/Auth.js, self-hosted by design. |
| **Queue** | Bull + Redis | Industry-standard job queue for
background processing. Handles retries, exponential backoff,
concurrency control, job progress tracking. Mature ecosystem
New Skc full 3
with BullBoard for monitoring. Redis is the backing store. |
| **Redis** | Redis (via Upstash or self-hosted) | Required f
or Bull queue storage. Upstash provides serverless Redis if d
eploying on Vercel. Self-hosted Redis if deploying on Railwa
y/VPS. |
| **Email Sending** | Resend | Modern API, batch send (100 em
ails/call), webhooks for bounce/delivery events, React Email
SDK, 3k emails/month free tier. |
| **Email Templates** | React Email | Build templates as Reac
t components that render to cross-client-compatible HTML. Use
d for system templates + campaign content wrapper. |
| **Client State** | Zustand | Simple single-store pattern. 2
-3 stores max for this app. Jotai's atomic model is overkill
here. |
| **Data Fetching** | TanStack Query | Caching, refetch inter
vals for near-real-time analytics, pagination. Essential for
the live dashboard. |
| **Forms + Validation** | react-hook-form + Zod | Zod valida
tes Server Action inputs, webhook payloads, and forms. `drizz
le-zod` auto-generates schemas from DB schema. |
| **Billing** | Stripe + @stripe/stripe-js | Industry standar
d. Checkout sessions + webhooks for subscription lifecycle. |
| **Real-time** | Server-Sent Events (SSE) or polling via Tan
Stack Query | TanStack Query `refetchInterval` for near-real-
time dashboard updates (polls every 5s). SSE for the activity
feed if true real-time is needed. No external dependency requ
ired. |
| **Deployment** | Vercel (frontend) + Railway/Render (Bull w
orkers) | Next.js app on Vercel. Bull workers need a persiste
nt process — deployed as a separate service on Railway or Ren
der. |
| **Monitoring** | Sentry (free tier) | Error tracking for pr
oduction. Optional Vercel Analytics for web vitals. |
### Key Architecture Decision: Bull + Redis for Queue
New Skc full 4
Sending 10,000 emails in one API request would time out. Bull
queues each send job in Redis and processes them in backgroun
d workers:
- **Concurrency control** — process 10 jobs in parallel, conf
igurable
on failure
sends
health
- **Automatic retries** — 3 attempts with exponential backoff
- **Job progress tracking** — real-time progress of campaign
- **BullBoard UI** — built-in monitoring dashboard for queue
- **Battle-tested** — used by thousands of production apps
```
User clicks "Send"
→ API creates campaign record + recipient entries
→ Pushes one job per recipient (or per batch of 50) to Bull
queue
→ Bull workers process jobs in background:
→ Render email with tracking pixel + click wrapping
→ Call Resend API to send
→ Update recipient status in DB
→ Campaign status updates to "sent" when all jobs complete
```
**Deployment note:** Bull workers require a persistent Node.j
s process. Deploy the worker as a separate service on Railway
or Render alongside the Vercel-hosted Next.js app.
### Key Architecture Decision: Better Auth over Supabase Auth
/ Clerk / Auth.js
- **Better Auth** stores all auth data in YOUR PostgreSQL dat
abase — no external auth service to depend on
- Built-in **organisation & team** plugin — supports multi-te
New Skc full 5
nant orgs, roles (owner/admin/member), and invites natively
- Works with Next.js App Router + Server Actions out of the b
ox
- Email + password auth, magic links, and OAuth (Google, GitH
ub) all supported
- **No vendor lock-in** — your users table is a standard Post
gres table you fully control
- More mature and feature-complete than Auth.js for multi-ten
ant B2B apps
### Key Architecture Decision: PostgreSQL (Neon) over Supabas
e
- **No vendor lock-in** — standard PostgreSQL, portable to an
y provider
- **Neon** provides serverless Postgres with connection pooli
ng, branching, and a generous free tier
- Auth, queue, and all data live in the same database — simpl
er architecture
- RLS is replaced by application-level org scoping in Drizzle
queries (middleware + query filters)
- Real-time updates handled via TanStack Query polling + SSE
— no dependency on Supabase Realtime
---
## 5. Features (MVP)
### F1 — Email Templates
- Pre-built template gallery (5 templates at launch)
- TipTap-based block editor: heading, text, image, button, di
vider
- Save custom templates per organisation
- Preview before sending (desktop + mobile view)
- Templates stored as TipTap JSON in PostgreSQL, rendered to
New Skc full 6
HTML via React Email at send time
### F2 — Campaign Creation & Sending
- Create campaign: pick template, write subject line, add rec
ipients
- Recipient input: CSV upload (via Papa Parse) OR manual past
e of emails
- Auto-detect organisation from email domain (e.g., @tata.com
→ Tata)
- Optional manual org tagging for ambiguous emails
- Schedule send (date/time picker) OR send immediately
- Bull queue handles batched sending in background via Resend
- Each email gets a unique tracking pixel + click-wrapped lin
ks + unsubscribe link injected automatically
### F3 — Individual Read Receipts (CORE FEATURE)
- Each recipient's email contains a unique 1x1 pixel image
- URL format: `/api/track/open/[campaignId]/[recipientId]`
- When email client loads the image → server logs the open vi
a `waitUntil()` (responds in <50ms)
- Logged data: recipient email, timestamp (to the second), IP
address, user agent
- Returns a hardcoded 1x1 transparent GIF (~43 bytes)
- **Caveat:** Image-blocking email clients won't register ope
ns — be transparent about this in the product
### F4 — Organisation-Level Rollup
- Group recipients by organisation (domain-based or manual ta
g)
- Dashboard shows per organisation:
- Total recipients from that org
- How many have opened (and who specifically)
- First open timestamp & last open timestamp
New Skc full 7
- % opened within the org
- Exportable as CSV
### F5 — Analytics Dashboard
- Per campaign view:
- Total sent / delivered / opened / clicked / bounced
- Open rate % and click rate %
- Opens over time chart (line graph via Recharts)
- Individual opens table (name, email, org, time)
- Org rollup table
- Bounce list with type (hard/soft)
- Near-real-time updates via TanStack Query polling (every 5
seconds)
- Filter by organisation, date range
- Deliverability health indicators (color-coded badges: gree
n/yellow/red)
### F6 — Multi-User Workspace (Organisations)
- Every account belongs to an Organisation
- **Org Admin can:**
- Invite team members via email link
- Remove members
- See ALL campaigns across all members
- Manage billing plan
- **Org Member can:**
- Create and manage their own campaigns
- View their own analytics
- Cannot see other members' campaigns (unless admin)
- Roles: Owner / Admin / Member (three levels)
- Better Auth's organisation plugin handles roles + invites n
atively
- Data isolation enforced via application-level org scoping i
n all Drizzle queries
New Skc full 8
### F7 — Authentication & Onboarding
- Better Auth: email + password (OAuth optional for MVP)
- **Sign up flow:**
1. Enter name, email, password
2. Create organisation (company name)
3. Land on dashboard (empty state)
- **Invite flow:**
- Admin sends invite → new user gets email via Resend
- Clicks link → signs up → auto-joins that org as Member
- Better Auth's invite system handles the token + org assoc
iation
- Protected routes via Next.js middleware using Better Auth s
ession checks
### F8 — Monetisation & Plan Enforcement
| | FREE | PRO (₹999 / $12/mo) | BUSINESS (₹3,999 / $49/mo) |
|---|---|---|---|
| Team members | 1 | 5 | Unlimited |
| Campaigns/month | 3 | Unlimited | Unlimited |
| Emails/month | 500 | 10,000 | 100,000 |
| Open tracking | Aggregate count only | Individual read rece
ipts | Everything in Pro |
| Org rollup | No | Yes | Yes |
| Click tracking | No | Yes | Yes |
| CSV export | No | Yes | Yes |
| Engagement scoring | No | Yes | Yes |
| Custom sending domain | No | No | Yes |
| API access | No | No | Yes |
| Priority support | No | No | Yes |
- Stripe for subscription billing via Checkout sessions
- Plan limits enforced at campaign send time (not template cr
eation)
- In-app upgrade modal when limit is hit
New Skc full 9
- Stripe webhook updates plan status in PostgreSQL on payment
events
### F9 — Campaign Link Click Tracking
- Every link in the email is replaced with a redirect URL:
`/api/track/click/[campaignId]/[recipientId]?url=HMAC_SIGNE
D_ORIGINAL`
- HMAC signature prevents URL tampering
- Server logs the click via `waitUntil()`, then 302 redirects
to original URL
- Dashboard shows: who clicked, which link, at what time
### F10 — Unsubscribe Management
- Every email includes a one-click unsubscribe link (CAN-SPAM
/ GDPR requirement)
- URL: `/api/unsubscribe/[token]`
- Unsubscribed emails stored per org and suppressed from futu
re sends
- Dashboard shows unsubscribe count per campaign
- Admin can view and export the suppression list
### F11 — Campaign Duplicate & Resend to Non-Openers
- Duplicate any past campaign with one click
- Resend to: everyone / only non-openers / specific org
- "Resend to non-openers" is a high-value workflow for sales
teams
- Uses the same Bull queue infrastructure
### F12 — Activity Feed (Real-time)
- Live feed on the dashboard sidebar
- Shows events: "Priya from Infosys just opened Campaign X —
2 mins ago"
New Skc full 10
- Powered by Server-Sent Events (SSE) from the API or TanStac
k Query polling
- "War room" feel during a big campaign launch
### F13 — Bounce Tracking (via Resend Webhooks)
- Resend sends webhooks for hard/soft bounces automatically
- Store bounce type, update recipient status to "bounced"
- Hard bounces auto-suppress from future sends
- Dashboard shows bounce rate per campaign + bounced recipien
t list
- Warning banner when bounce rate exceeds 5% ("Your sender re
putation is at risk")
- **Impact:** ~2 hours to build. Protects sender reputation.
### F14 — Recipient Engagement Scoring
- Derived metric: count opens + clicks per recipient over las
t 30 days
- Bucket into: **Cold** (0) / **Warm** (1-3) / **Hot** (4+)
- Color-coded badges in recipient list
- Filter recipient lists by engagement level
- "Resend to cold contacts" workflow
- **Impact:** One SQL query + badge UI. Turns raw data into a
ctionable intelligence.
### F15 — Campaign Tags
- `tags` JSONB column on campaigns
- Create, assign, and filter campaigns by tags in list view
- **Impact:** Organization at scale. Essential when teams run
50+ campaigns.
### F16 — Team Audit Trail
- `audit_log` table records every significant action
New Skc full 11
- campaign.created, campaign.sent, member.invited, member.r
emoved, plan.changed
- Simple chronological table in Settings → Activity
- **Impact:** B2B requirement for accountability and trust.
### F17 — Deliverability Health Indicators
- Show bounce rate, open rate, complaint rate with color-code
d badges (green/yellow/red)
- Warning banner when bounce rate exceeds 5%
- **Impact:** Proactive guidance. No external service needed
— just math on existing data.
### F18 — Dark Mode
- shadcn/ui + `next-themes` — supported out of the box
- Toggle in top nav user menu
---
## 6. User Flow (Step by Step)
**Step 1 — Sign Up**
User visits skcript-mail.com → clicks Sign Up → enters name,
email, password → Better Auth creates the account in PostgreS
QL
**Step 2 — Create Organisation**
First login triggers org creation screen → user enters compan
y name → org created in DB via Better Auth's organisation plu
gin → user becomes Owner → lands on main dashboard (empty sta
te)
**Step 3 — Invite Team (optional)**
Admin goes to Settings → Team → enters teammate email → invit
e email sent via Resend → teammate clicks link → signs up → B
New Skc full 12
etter Auth auto-joins them to the org as Member
**Step 4 — Create a Template**
Goes to Templates → New Template → picks a base template from
gallery → edits using TipTap block editor → saves to org's te
mplate library
**Step 5 — Create a Campaign**
Goes to Campaigns → New Campaign → picks template → writes ca
mpaign name → uploads CSV or pastes emails → system auto-dete
cts org from domain → reviews recipient list → picks Send Now
or Schedule → clicks Launch
**Step 6 — Sending (background)**
API creates campaign record → generates unique tracking IDs p
er recipient → pushes jobs to Bull queue in Redis → Bull work
ers process each job: render email via React Email → inject t
racking pixel + wrap links + add unsubscribe → call Resend AP
I → update status in PostgreSQL
**Step 7 — Track in Real Time**
Campaign analytics page polls via TanStack Query (every 5s) →
as recipients open emails, tracking pixel fires → server reco
rds open → dashboard updates on next poll → activity feed sho
ws "Priya from Infosys opened 2 mins ago"
**Step 8 — Act on the Data**
Filter opens by organisation → identify which orgs have NOT o
pened → create a resend campaign for non-openers → export ope
ns list as CSV for sales team
**Step 9 — Upgrade (if needed)**
User hits send limit → in-app upgrade modal → Stripe Checkout
→ payment succeeds → webhook updates plan in PostgreSQL → hig
her limits immediately active
New Skc full 13
---
## 7. Database Schema (PostgreSQL via Drizzle ORM)
**Note:** Better Auth manages its own tables (`user`, `sessio
n`, `account`, `verification`, `organization`, `member`, `inv
itation`) automatically. The tables below are application-spe
cific tables that reference Better Auth's `user` and `organiz
ation` tables.
### Table: organisations (extends Better Auth's `organization
` table)
```
id text PRIMARY KEY (matches Better Auth
org ID)
plan text DEFAULT 'free' (free / pro / bus
iness)
stripe_customer_id text NULLABLE
stripe_subscription_id text NULLABLE
created_at timestamptz
updated_at timestamptz
```
### Table: templates
```
id uuid PRIMARY KEY
org_id text FK → organisation.id
created_by text FK → user.id
name text
subject text
content_json jsonb (TipTap JSON)
content_html text (cached rendered HTML)
is_gallery boolean (pre-built templates)
thumbnail_url text NULLABLE
created_at timestamptz
updated_at timestamptz
New Skc full 14
```
### Table: recipient_lists
```
id uuid PRIMARY KEY
org_id text FK → organisation.id
name text
description text NULLABLE
created_at timestamptz
updated_at timestamptz
```
### Table: recipients
```
id uuid PRIMARY KEY
org_id text FK → organisation.id
list_id uuid FK → recipient_lists.id
email text
first_name text NULLABLE
last_name text NULLABLE
company text NULLABLE (auto-detected from dom
ain or manual)
metadata jsonb (custom CSV fields)
status text DEFAULT 'active' (active / unsub
scribed / bounced / complained)
engagement_score integer DEFAULT 0 (cold=0 / warm / ho
t)
created_at timestamptz
updated_at timestamptz
UNIQUE (org_id, email)
```
### Table: campaigns
```
id uuid PRIMARY KEY
org_id text FK → organisation.id
New Skc full 15
created_by text FK → user.id
template_id uuid FK → templates.id NULLABLE
name text
subject text
preview_text text NULLABLE
content_json jsonb (TipTap JSON)
content_html text (rendered HTML)
from_name text
from_email text
reply_to text NULLABLE
status text DEFAULT 'draft' (draft / schedul
ed / sending / sent / paused / failed)
scheduled_at timestamptz NULLABLE
sent_at timestamptz NULLABLE
tags jsonb DEFAULT '[]'
stats_cache jsonb ({sent, opened, clicked, bounce
d, unique_opens, unique_clicks})
created_at timestamptz
updated_at timestamptz
```
### Table: campaign_recipients (join table + denormalized sta
te)
```
id uuid PRIMARY KEY
campaign_id uuid FK → campaigns.id
recipient_id uuid FK → recipients.id
resend_email_id text NULLABLE
status text DEFAULT 'pending' (pending / sen
t / delivered / opened / clicked / bounced / complained)
sent_at timestamptz NULLABLE
delivered_at timestamptz NULLABLE
first_opened_at timestamptz NULLABLE
last_opened_at timestamptz NULLABLE
open_count integer DEFAULT 0
first_clicked_at timestamptz NULLABLE
New Skc full 16
click_count integer DEFAULT 0
bounced_at timestamptz NULLABLE
bounce_type text NULLABLE (hard / soft)
UNIQUE (campaign_id, recipient_id)
```
### Table: campaign_events (append-only event log)
```
id uuid PRIMARY KEY
campaign_id uuid FK → campaigns.id
recipient_id uuid FK → recipients.id
event_type text (sent / delivered / opened / cli
cked / bounced / complained / unsubscribed)
event_data jsonb NULLABLE
— clicks: {url: "..."}
— bounces: {bounce_type: "hard"}
— opens: {ip: "...", user_agent:
"..."}
created_at timestamptz DEFAULT now()
```
### Table: unsubscribes
```
id uuid PRIMARY KEY
org_id text FK → organisation.id
email text
campaign_id uuid FK → campaigns.id NULLABLE
unsubscribed_at timestamptz
```
### Table: audit_log
```
id uuid PRIMARY KEY
org_id text FK → organisation.id
user_id text FK → user.id
action text (e.g., "campaign.sent", "member.
New Skc full 17
invited")
entity_type text
entity_id text
metadata jsonb NULLABLE
created_at timestamptz
```
### Indexing Strategy
```sql
-- High-volume event queries
CREATE INDEX idx_events_campaign ON campaign_events (campaign
_id, created_at DESC);
CREATE INDEX idx_events_dedup ON campaign_events (campaign_i
d, recipient_id, event_type);
-- Campaign recipient lookups
CREATE INDEX idx_cr_campaign_status ON campaign_recipients (c
ampaign_id, status);
CREATE INDEX idx_cr_recipient ON campaign_recipients (recipie
nt_id);
-- Recipient lookups
CREATE INDEX idx_recipients_org_email ON recipients (org_id,
email);
CREATE INDEX idx_recipients_org_status ON recipients (org_id,
status);
-- Campaign list
CREATE INDEX idx_campaigns_org ON campaigns (org_id, status,
created_at DESC);
-- Audit trail
CREATE INDEX idx_audit_org ON audit_log (org_id, created_at D
ESC);
```
New Skc full 18
### Stats Caching Strategy
- `campaign_recipients` = materialized state per recipient (f
ast individual reads)
- `campaign_events` = append-only log (auditability + debuggi
ng)
- `campaigns.stats_cache` = pre-aggregated counts (dashboard
reads one row, no COUNT queries)
- Update `stats_cache` incrementally on each webhook event, o
r recompute via a cron job every 5 minutes
---
## 8. Frontend Components (Next.js App Router)
### Pages
```
/ → Landing / marketing
page
/login → Login page
/signup → Signup page
/onboarding/setup → Create org (first l
ogin only)
/dashboard → Main dashboard / ov
erview
/campaigns → Campaign list
/campaigns/new → Campaign creation w
izard
/campaigns/[id] → Campaign detail + a
nalytics
/templates → Template gallery
/templates/new → Template editor (Ti
pTap)
/templates/[id]/edit → Edit existing templ
ate
/recipients → Recipient lists
/recipients/[id] → List detail
New Skc full 19
/settings → Org settings
/settings/team → Team management
/settings/billing → Plan + Stripe billi
ng
/settings/activity → Audit trail
```
### API Routes (Route Handlers)
```
/api/auth/[...all] → Better Auth c
atch-all handler
/api/track/open/[campaignId]/[recipientId] → Tracking pixe
l endpoint
/api/track/click/[campaignId]/[recipientId] → Click trackin
g redirect
/api/unsubscribe/[token] → Unsubscribe h
andler
/api/webhooks/resend → Resend webhoo
k handler
/api/webhooks/stripe → Stripe webhoo
k handler
```
### Reusable Components
```
<Sidebar /> → Left sidebar with nav links
<TopNav /> → Top nav with org name + user men
u + dark mode toggle
<CampaignCard /> → Campaign summary card in list vi
ew
<TemplateCard /> → Template thumbnail card
<RecipientTable /> → Table of individual opens with t
imestamps
<OrgRollupTable /> → Org-level open stats table
<OpenOverTimeChart /> → Line chart for open trends
<StatCard /> → Single metric card (sent, opene
New Skc full 20
d, rate)
<ActivityFeed /> → Real-time sidebar event feed
<PlanBadge /> → Shows current plan (Free / Pro /
Business)
<UpgradeModal /> → Shown when plan limit is hit
<BlockEditor /> → TipTap-based template editor
<RecipientUploader /> → CSV upload + paste area
<OrgTag /> → Auto-detected org badge on recip
ient row
<SchedulePicker /> → Date/time picker for scheduled s
ends
<EngagementBadge /> → Cold/Warm/Hot color-coded badge
<HealthIndicator /> → Deliverability health badge (gre
en/yellow/red)
<EmptyState /> → Friendly empty state for new use
rs
```
---
## 9. Architecture Details
### Tracking Pixel Endpoint (High Throughput)
```
GET /api/track/open/[campaignId]/[recipientId]
1. Campaign + recipient IDs encoded in URL → NO database look
up needed
2. Return hardcoded 1x1 transparent GIF Buffer immediately (~
43 bytes)
3. Use waitUntil() to write event to DB AFTER response return
s → <50ms response
4. Consider Edge Runtime for lower latency
```
### Click Tracking Endpoint
New Skc full 21
```
GET /api/track/click/[campaignId]/[recipientId]?url=HMAC_SIGN
ED_URL
1. Verify HMAC signature on URL (prevent tampering)
2. Log click event via waitUntil()
3. 302 redirect to original URL
```
### Bull Queue — Campaign Send Flow
```
User clicks "Send"
→ Server Action validates plan limits
→ Creates campaign_recipients entries in DB
→ Pushes jobs to Bull queue (one per batch of 50 recipient
s)
→ Updates campaign status to "sending"
Bull Worker (persistent process on Railway/Render):
→ Picks up job from Redis queue
→ Fetches campaign content + recipient batch from PostgreSQ
L
→ Renders React Email template with personalization
→ Injects tracking pixel + wraps links + adds unsubscribe
→ Calls Resend batch send API (up to 100/call)
→ Updates campaign_recipients status in DB
→ On all jobs complete → sets campaign status to "sent"
Worker Config:
→ Concurrency: 10 parallel workers (configurable)
→ Retry: 3 attempts with exponential backoff
→ Remove on complete: true (keep Redis lean)
```
### Bull Worker Deployment
```
New Skc full 22
Project structure:
/src/app/... → Next.js app (deployed on Verce
l)
/src/workers/ → Bull worker entry point (deploy
ed on Railway/Render)
/src/lib/ → Shared code (DB, email renderin
g, etc.)
The worker is a standalone Node.js script that:
1. Connects to Redis
2. Connects to PostgreSQL (same DB as the app)
3. Registers Bull job processors
4. Runs indefinitely, processing jobs as they arrive
```
### Data Isolation (replacing Supabase RLS)
- Every Drizzle query includes a `.where(eq(table.orgId, curr
entUser.orgId))` filter
- A shared `withOrgScope(query, orgId)` utility wraps all que
ries
- Better Auth middleware extracts the user's org from their s
ession
- All Server Actions and API routes validate org membership b
efore any DB operation
---
## 10. Success Metrics (KPIs)
| Metric | Target (Month 1) |
|--------|-------------------|
| Orgs signed up | 20+ |
| Campaigns sent | 100+ total |
| Emails delivered | 10,000+ |
| D7 retention | 40%+ (sent a 2nd campaign in 7 days) |
| Free → Pro upgrades | 5+ conversions |
New Skc full 23
| MRR | ₹5,000+ ($60+) |
| NPS (30-day) | 40+ |
| Bounce rate | Below 2% per campaign |
| Unsubscribe rate | Below 0.5% per campaign |
---
## 11. Scope — IN vs OUT
### IN SCOPE (build for MVP)
- Email campaign creation and sending
- Pre-built template gallery + TipTap block editor
- Individual read receipts with exact timestamps
- Organisation-level open rollup
- Multi-user orgs with Owner / Admin / Member roles
- Analytics dashboard with polling-based near-real-time updat
es
- Bull + Redis queue for bulk email sending
- Link click tracking with HMAC-signed URLs
- Unsubscribe management (CAN-SPAM / GDPR compliant)
- Bounce tracking via Resend webhooks
- Recipient engagement scoring (Cold / Warm / Hot)
- Campaign duplicate & resend to non-openers
- Activity feed
- Campaign tags for organization
- Team audit trail
- Deliverability health indicators
- Stripe billing + plan enforcement
- CSV recipient import (Papa Parse)
- Export opens/clicks as CSV
- Dark mode
### OUT OF SCOPE (post-MVP)
- SMS or WhatsApp campaigns
- Email automation / drip sequences
- A/B testing
New Skc full 24
- CRM integrations (HubSpot, Salesforce)
- AI email content writing
- Landing page builder
- Mobile native app
- Custom email domain (Business plan — post MVP)
- White labelling
- Multi-language support
- Smart send time optimization
- Email preview rendering (Gmail vs Outlook simulation)
- External API / webhook access for integrations
---
## 12. Timeline — 4 Week Ship Plan
### Week 1 — Foundation
- Next.js 15 project setup + Tailwind CSS 4 + shadcn/ui scaff
old
- PostgreSQL database on Neon + Drizzle ORM schema + migratio
ns
- Better Auth integration (email+password, org plugin, roles,
middleware)
- Org creation onboarding flow
- Dashboard layout (sidebar, top nav, empty states)
- Recipient lists — CRUD, CSV import (Papa Parse), auto-detec
t company from domain
### Week 2 — Campaign Core
- Template gallery (5 pre-built React Email templates) + TipT
ap editor
- TipTap JSON → React Email → HTML rendering pipeline
- Campaign creation wizard (pick template, add recipients, sc
hedule/send)
- Bull + Redis setup + worker deployment on Railway/Render
- Tracking pixel endpoint with `waitUntil()` + hardcoded GIF
- Click tracking redirect endpoint with HMAC verification
New Skc full 25
- Unsubscribe endpoint + suppression list
- Resend webhook handler (delivery, open, click, bounce, comp
laint)
### Week 3 — Analytics + Features
- Per-campaign analytics page (opens timeline chart, recipien
t read receipt table, org rollup table, bounce list)
- Main dashboard (total sends, open rate trend, top campaign
s, health indicators)
- Activity feed sidebar (polling or SSE)
- Engagement scoring (cron job to recalculate)
- Campaign duplicate + resend to non-openers
- Campaign tags + filtering
- Team management (invite via Better Auth, remove, role manag
ement)
- Audit trail (Settings → Activity)
- Dark mode via next-themes
### Week 4 — Billing + Ship
- Stripe Checkout integration + plan gating
- Upgrade modal when limits hit
- Stripe webhook for subscription lifecycle
- CSV export for opens/clicks
- Mobile responsiveness pass
- Error handling, loading states, edge cases
- Deploy Next.js to Vercel + Bull worker to Railway
- Production PostgreSQL + Redis setup
- QA + bug fixes
---
## 13. Technical Notes
### How Read Receipts Work
When you send an email, you embed a tiny invisible image:
```html
New Skc full 26
<img src="https://app.skcriptmail.com/api/track/open/CAMPAIGN
_ID/RECIPIENT_ID" width="1" height="1" />
```
The IDs are unique per recipient. When their email client loa
ds the image, it makes a GET request to your server — you kno
w exactly who opened and when. You return a 1x1 transparent G
IF (43 bytes). This is industry standard. **Limitation:** if
the email client blocks images (some do), the open won't regi
ster.
### Why Bull + Redis
Sending 10,000 emails in one API request would time out in se
conds. Bull puts each send job in a Redis queue. Background w
orkers process them asynchronously. If one fails, it retries
automatically with exponential backoff. You can track progres
s in real time via BullBoard. This is the industry-standard a
pproach for bulk email. **Trade-off:** requires a separate pe
rsistent worker process (deployed on Railway/Render alongside
Vercel).
### Why Better Auth over Supabase Auth / Clerk / Auth.js
Better Auth stores all auth data in your own PostgreSQL datab
ase — no external auth service dependency. Its built-in organ
isation plugin provides multi-tenant teams, roles (owner/admi
n/member), and invite flows out of the box. Unlike Auth.js, i
t has first-class support for the B2B multi-tenant pattern th
is product needs. Unlike Clerk, it's self-hosted and free.
### Why PostgreSQL (Neon) over Supabase
Supabase bundles auth + DB + realtime + storage into one plat
form. Since we're using Better Auth and Bull+Redis instead of
Supabase Auth and Supabase Realtime, there's no reason to use
Supabase as the database provider. Neon provides serverless P
ostgreSQL with connection pooling, database branching for de
v/staging, and a generous free tier — without the Supabase ve
ndor lock-in.
New Skc full 27
### Why Drizzle Instead of Prisma
Prisma's binary engine is ~1.6MB — causes slow cold starts on
Vercel serverless. The tracking pixel endpoint is your highes
t-traffic route; cold starts matter. Drizzle is ~7kb, has SQL
-like syntax perfect for analytics queries, and works nativel
y with any PostgreSQL connection.
### Data Isolation (replacing Supabase RLS)
Without Supabase RLS, data isolation is enforced at the appli
cation level:
- Every Drizzle query includes `WHERE org_id = ?` via a share
d `withOrgScope()` utility
- Better Auth middleware extracts the user's active org from
their session
- Server Actions validate org membership before any DB operat
ion
- This is the standard approach for most multi-tenant SaaS ap
plications
### Dual-Table Event Pattern
`campaign_events` is the append-only truth log. `campaign_rec
ipients` is the materialized/denormalized view for fast read
s. `campaigns.stats_cache` holds pre-aggregated counts. Event
s flow in via webhooks → append to events → update recipients
row → increment stats cache. Dashboard reads stats_cache (one
row, no aggregation).
---
**END OF PRD**
Prepared for: Skcript Engineering Team
April 2026 | Confidential
New Skc full 28