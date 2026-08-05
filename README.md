# LaunchOps

Real testers for Google Play closed testing. Clients buy a package, LaunchOps runs the whole loop — 14+ real testers on real devices, a five-step verified workflow, deduplicated bug reports, and a completion report ready for Play Console.

## Monorepo layout

```
apps/web          Next.js 15 (App Router) — marketing site + /client /tester /admin
apps/api          Express + TypeScript — workflow engine, matching/queue, wallet, cron
packages/types    Shared domain contract (roles, step templates, packages, API shapes)
```

## Stack

Clerk (auth, roles in `publicMetadata.role`) · MongoDB Atlas + Mongoose · Cloudinary (signed uploads) · Resend (optional email; console fallback) · Vitest + mongodb-memory-server (tests)

## Quickstart

```bash
npm install
npm run build -w @launchops/types   # shared package, once (or --watch via dev)
npm run dev:api                     # http://localhost:4000  (needs apps/api/.env)
npm run dev:web                     # http://localhost:3000  (needs apps/web/.env.local)
```

Env templates: `apps/api/.env.example` and `apps/web/.env.example`. Minimum to boot: Clerk test keys + a MongoDB Atlas URI. Cloudinary enables proof uploads; Resend enables real email. Admin role is invite-only — set `{"role": "admin"}` in the user's Clerk public metadata.

## Verify

```bash
npm run test        # 38 API tests: workflow engine, join-cutoff races, wallet, security
npm run build       # types → api → web, in order
npm run lint
```
