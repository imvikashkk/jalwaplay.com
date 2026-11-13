# Jalwaplay

Next.js 16 (App Router) streaming site with direct mobile-number login (no OTP),
subscription plans paid through the **SabPaisa** payment gateway, and PostgreSQL.

## User flow

```
App open ──► /auth (mobile number, no OTP)
                 │
                 ├── no active subscription ──► /subscription (choose plan, Pay)
                 │                                   │
                 │                                   ▼
                 │                          SabPaisa checkout (hosted)
                 │                                   │
                 │                 /api/payment/sabpaisa/callback (decrypt + activate)
                 │                                   │
                 │                                   ▼
                 │                          /payment/status ──► / (Home)
                 │
                 └── active subscription ─────────────────────► / (Home)
```

* `src/proxy.ts` guards every page using the signed `mr_token` session cookie and a
  signed `mr_has_sub` flag (tamper-proof). Sessions survive app restarts; a subscriber's
  session lasts until the subscription ends, others for 3 days.
* Logged-in users can't reopen `/auth`; users without a subscription can only reach
  `/subscription`, `/profile` and the legal pages.

## Setup

Requirements: Node.js ≥ 20.9, PostgreSQL ≥ 13.

```bash
npm install
cp .env.example .env.local      # fill in the values (see below)
npm run db:setup                # creates/migrates tables, seeds plans (safe to re-run)
npm run dev                     # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Other scripts: `npm run lint`, `npm run typecheck`.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | yes | PostgreSQL connection |
| `DB_SSL` | no | `true` for managed Postgres requiring TLS |
| `USER_TOKEN_SECRET` | **yes in production** | HMAC secret for sessions + OTP hashing (long random string) |
| `NEXT_PUBLIC_APP_URL` | yes | Public base URL — used for the SabPaisa callback URL and Meta CAPI |
| `SABPAISA_CLIENT_CODE`, `SABPAISA_API_KEY`, `SABPAISA_SECRET_KEY` | for payments | SabPaisa v2 API credentials |
| `SABPAISA_ENV` | no | `staging` (default) or `production` |
| `SABPAISA_MERCHANT_ID`, `SABPAISA_BASE_URL` | no | optional overrides (see `.env.example`) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | for `/admin` | admin panel login (panel stays locked without a password) |
| `AFFILIATE_POSTBACK_URL` | no | S2S postback on purchase; placeholders `{click_id}` `{payout}` `{pub}` `{txn_id}` |
| `AUTH_WALL_DISABLED` | no | `true` temporarily opens the site without login |

## SabPaisa payments

* `src/lib/sabpaisa.ts` — SabPaisa v2 Merchant API: create payment (HMAC-SHA256
  checksum), Status Enquiry API, return-URL signature check.
* `/api/payment/initiate` creates a pending payment at SabPaisa and returns the hosted
  checkout URL; the browser is redirected there.
* `/api/payment/sabpaisa/callback` (returnUrl) confirms the payment with the Enquiry API,
  checks the amount, activates the subscription and redirects to `/payment/status` → Home.
* `/api/payment/verify` asks SabPaisa's enquiry API if the callback hasn't arrived yet.
* Test with `SABPAISA_ENV=staging` and the staging credentials first; switch to
  `production` with the live credentials.

## Test / complimentary accounts

There is no hard-coded demo login. To give any number an active subscription,
store it in the database (no payment row is created):

```bash
npm run sub:grant -- 7566634500            # most expensive plan, 3650 days
npm run sub:grant -- 9876543210 30 2       # 30 days on plan id 2
npm run sub:revoke -- 7566634500           # cancel it (to test the plans page)
```

The account then behaves exactly like a paying user and shows up in `/admin`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Setup error: Database is not configured…` | create `.env.local` from `.env.example`, restart `npm run dev` |
| `Setup error: Cannot connect to PostgreSQL…` | start PostgreSQL; check `DB_HOST` / `DB_PORT` |
| `Setup error: PostgreSQL login failed…` | check `DB_USER` / `DB_PASSWORD` |
| `Setup error: Database "…" does not exist` | `createdb jalwaplay` then `npm run db:setup` |
| `Setup error: Database tables are missing or outdated` | `npm run db:setup` |

In production builds the browser only sees a generic message; the exact cause is in the server log.

## Security notes

* Login is by mobile number only, with **no OTP** — anyone who types a number is
  logged in as that number (including access to its subscription).
* A subscription is only activated after SabPaisa's Enquiry API (called server-side
  with our API key) reports SUCCESS, and the paid amount must cover the plan price.
* Payment confirmation (`/api/payment/verify`) only works for the paying user.

## Project structure

```
src/app/            routes (auth, subscription, profile, payment/status, legal pages)
src/app/api/        auth, plans, user, payment, pixel-config route handlers
src/components/     UI (Auth login, Subscriptions, PaymentStatus, admin, …)
src/lib/            db, session/token, SabPaisa, affiliate, admin, schema.sql
src/proxy.ts        auth + subscription route guard
scripts/db-setup.mjs applies src/lib/schema.sql
```
