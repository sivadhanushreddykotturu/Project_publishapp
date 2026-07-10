# LaunchOps API — Phase 1 MVP Backend

Express + TypeScript backend implementing the LaunchOps PRD (v1.0) and Technical
Specification (v1.2): client onboarding & payment, tester matching & queueing, the
step-based workflow engine, Google Play integration, bug reporting, tester wallet &
UPI payouts, and the admin console data/API layer.

## Stack (per Tech Spec §1)

| Layer | Choice |
|---|---|
| Backend API | Node.js + Express.js (TypeScript) |
| Database | MongoDB (Atlas) via Mongoose |
| Auth | Clerk (`@clerk/express`) |
| File storage | Cloudflare R2 (presigned URLs, `@aws-sdk/client-s3`) |
| Email | Resend |
| Payments | Razorpay (client checkout + webhook). Tester payouts are manual UPI, not a gateway payout API |
| Google Play | `googleapis` (Android Publisher v3) — AAB upload, track release, tester sync |
| API docs | OpenAPI 3.0 via `swagger-jsdoc` + `swagger-ui-express` |

## Getting started

```bash
npm install
cp .env.example .env   # fill in real Clerk/Mongo/R2/Resend/Razorpay credentials
npm run dev             # ts-node-dev, http://localhost:4000
```

- Swagger UI: `http://localhost:4000/api-docs`
- Raw OpenAPI JSON: `http://localhost:4000/api-docs.json`
- Health check: `http://localhost:4000/health`

**For a frontend team building on this API**: every one of the 50 documented paths has a
request body schema, and every 2xx response has a real JSON schema behind `data` — not just
a prose description — reusable component schemas (`Project`, `Assignment`, `Tester`,
`WalletTransaction`, etc.) live under `components.schemas` in the spec, so the OpenAPI JSON
is codegen-ready (e.g. `openapi-typescript`) for a typed client. `tests/app.test.ts` asserts
this holds for every route except the one exception that doesn't need it (the Razorpay
webhook — server-to-server, no frontend ever reads its response) — so this can't silently
regress as new endpoints are added.

## Scripts

- `npm run dev` — hot-reloading dev server
- `npm run build` / `npm start` — compile to `dist/` and run
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — Jest unit tests (spins up an in-memory MongoDB replica set)

## Architecture

- `src/models` — 12 Mongoose collections (Tech Spec §4): users, clients, testers,
  projects (steps embedded), assignments, bugReports, walletTransactions, invoices,
  notifications, supportTickets, metricEvents, auditLogs.
- `src/services` — the actual business rules: `workflowEngine` (step state machine),
  `matching` (atomic slot allocation + waiting queue), `wallet` (ledger + transactions),
  `notification` (dispatch abstraction), `storage` (R2 presigning), `payment` (Razorpay),
  `playIntegration` (Google Play manual/API mode + tracked redirect links).
- `src/controllers` + `src/routes` — thin HTTP layer; every route file carries its own
  `@openapi` JSDoc block that feeds the generated spec.
- `src/jobs` — node-cron scheduler: Step-1 inactivity auto-replacement every 15 min,
  hourly reminder sweep + notification retry, email-review auto-advance every 15 min,
  and a daily staggered-install-pacing sweep.
- `src/middleware/auth.ts` — Clerk session verification + RBAC (`requireRole`), enforced
  a second time at the query level (ownership filters) per resource, per Tech Spec §3.

## The real Play Console timeline (~23 days), not an idealized one

The step template models Google's actual closed-testing mechanics end to end:

| Step | What happens | Duration |
|---|---|---|
| `verification` | LaunchOps checks each tester is real (project gate) | ~1-2 days |
| `google_email_review` | Admin submits the verified tester list to Play Console; Google reviews it | ~2-3h (`GOOGLE_EMAIL_REVIEW_HOURS`), auto-advances via cron if the admin hasn't confirmed manually |
| `play_store_invite` | Each tester opts in via their unique redirect link (project gate) | ~1-2 days |
| `testing_period` | **Mandatory** — Google's own hard floor, not a LaunchOps estimate. Installs staggered ~`INSTALLS_PER_DAY` (default 2) per day so they land naturally instead of all at once | `TESTING_PERIOD_DAYS` (default 14) |
| `production_review` | Admin applies for production (hard-blocked until the 14 days have genuinely elapsed); Google reviews | commonly `PRODUCTION_REVIEW_DAYS` (default 7), can run longer |
| `completion` | Terminal — set once production is confirmed approved | — |

Only `verification`, `play_store_invite`, and `testing_period` carry individual tester
actions (`Assignment.currentStep` only ever takes those three values); the other three are
project-level milestones the admin advances directly via
`POST /projects/:id/submit-email-review` → `/confirm-email-review` → `/testers-invited` →
`/apply-production` → `/confirm-production-approved`. Two things are enforced as hard,
non-negotiable gates because Google enforces them the same way: the 14-day floor blocks
`/apply-production` outright, and email-review/production-approval have no API signal to
poll, so they're explicit admin confirmations rather than fabricated automation.

## Client package verification gate

`testers_only` is fully self-serve — pay and go, same as always. `managed_testing`,
`launch_ready`, and `custom` (a bespoke, admin-negotiated tier with no fixed pricing) instead
require the client to be verified before payment unlocks: the agreed criterion is proof they
control the Play Console listing, plus a direct discussion with the team. `POST /projects`
for those packages creates the project in `pending_verification` with **no invoice** — the
client calls `POST /projects/:id/verification/submit` with proof, the admin reviews (the
direct-discussion part happens outside the platform) and calls
`POST /projects/:id/verification/review`. Approving creates the invoice and moves the
project to `awaiting_payment`; for `custom` projects the admin must supply `customAmount`
since there's no pricing formula to fall back on. Rejecting leaves it in
`pending_verification` so the client can resubmit.

> **Still open**: the "custom plan" tier's actual pricing/feature set hasn't been provided
> yet (a Canva doc was referenced but not received — what came through was the same PRD
> already on file). The `custom` package enum value and the manual-amount approval path are
> built and tested; the plan's real terms need to come from that doc before this is
> client-facing.

## Notable design decisions

- **Atomic tester matching**: `Project.activeTesterCount` is incremented only via a
  guarded `findOneAndUpdate` (`activeTesterCount < requiredTesters`), so concurrent
  joins can never overfill a project — no external lock needed.
- **verification vs. later-step replacement**: automatic tester replacement only applies
  during `verification` (PRD §4.4); inactivity on any step after that instead flags the
  assignment and surfaces an admin alert — once a tester is on Google's testing track,
  auto-removal would break closed-testing continuity.
- **Payments never block onboarding**: every payment-driven action has a manual fallback
  (`mark-paid` invoice endpoint) per the Tech Spec §14 risk register.
- **Payouts are manual UPI, by design, not a gateway integration gap**: a payment gateway
  takes a commission on payouts, so tester withdrawals are paid by the admin directly via
  UPI, then closed out with `POST /wallet/withdrawals/:id/complete` (attaches the UPI
  transaction ID as proof, decrements the wallet balance). `requestWithdrawal` quotes an
  `expectedCompletionAt` (`WITHDRAWAL_SLA_HOURS`, default 48h) up front. There's no
  automated payout call anywhere in the codebase to fall back from — this is the intended
  end state, not a stub.
- **Files never touch the API**: uploads/downloads are presigned R2 URLs only, except the
  one backend-to-backend hop `googlePlayApi` needs to stream a client's AAB from R2 to
  Google's upload endpoint.
- **Google Play API mode is real, with one documented Google-side limit**: `POST
  /projects/:id/sync-play-release` runs the actual edit lifecycle (insert → upload bundle →
  update track release → commit) against the Android Publisher v3 API. Tester-list sync is
  best-effort — Google's `Testers` resource only supports assigning a **Google Group** to a
  track, not raw individual emails, so automated tester sync requires
  `playIntegration.testerGoogleGroupEmail` to be set; otherwise those testers still go through
  Play Console or the existing manual `/testers-invited` flow. Any API failure records
  `playIntegration.lastApiError` and returns a 502 pointing at that manual fallback — a
  project is never left blocked on Google's API being reachable.
