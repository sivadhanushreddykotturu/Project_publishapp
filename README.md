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
| Payments | Razorpay (orders + webhook; UPI payouts via Razorpay X) |
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
  hourly reminder sweep + notification retry.
- `src/middleware/auth.ts` — Clerk session verification + RBAC (`requireRole`), enforced
  a second time at the query level (ownership filters) per resource, per Tech Spec §3.

## Notable design decisions

- **Atomic tester matching**: `Project.activeTesterCount` is incremented only via a
  guarded `findOneAndUpdate` (`activeTesterCount < requiredTesters`), so concurrent
  joins can never overfill a project — no external lock needed.
- **Step 1 vs Step 2+ replacement**: automatic tester replacement only applies to Step 1
  (PRD §4.4); Step 2+ inactivity instead flags the assignment and surfaces an admin alert.
- **Payments never block onboarding**: every payment-driven action has a manual fallback
  (`mark-paid` invoice endpoint, manual UPI payout marking) per the Tech Spec §14 risk register.
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
