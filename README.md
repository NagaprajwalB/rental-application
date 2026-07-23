# Ledger — a production to-do app

Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion, backed by DynamoDB. Serverless
end to end: no server to patch, scales to zero, costs cents a month for personal use.

Read **before deploying**: [A note on Next.js 14](#a-note-on-nextjs-14).

## Stack & why

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | API routes + UI in one deployable, edge middleware for auth |
| Data | DynamoDB, on-demand billing | Zero idle cost, no servers/connections to manage, scales automatically |
| Validation | Zod | Same schema shape drives both compile-time types and runtime request validation |
| Motion | Framer Motion | Layout-aware list reordering, exit animations, shared-layout tab pill |
| Auth | Signed cookie, HMAC-SHA256 via Web Crypto | App is single-tenant (personal use); avoids pulling in a full auth provider for one user |

## Architecture

```
Browser ──▶ middleware.ts (edge)         verifies signed session cookie
              │  redirects to /login if missing/expired
              ▼
         app/page.tsx (RSC)              reads DynamoDB directly on the server for first paint
              │
              ▼
         components/TodoApp.tsx (client) optimistic UI via hooks/useTodos.ts
              │
              ▼
         app/api/todos/**                validates with zod, calls lib/todos-service.ts
              │
              ▼
         lib/todos-service.ts            DynamoDB single-table access patterns
              │
              ▼
         DynamoDB table "ledger-todo"
```

### DynamoDB key design

Single table, two access patterns, no scans:

```
pk = "USER#<userId>"        sk = "TODO#<todoId>"                 → get / update / delete by id (O(1))
gsi1pk = "USER#<userId>"    gsi1sk = "<createdAtIso>#<todoId>"   → list a user's todos, oldest first
```

`userId` defaults to `"default"` everywhere (see `lib/todos-service.ts`) because the app is
single-tenant today. The key design already partitions by user, so turning on real multi-user
auth later is a data-model no-op — swap the constant for a value from the session/JWT.

Filtering "open" vs "done" happens in application code, not a third index: at personal-app scale
(dozens to low-thousands of items) a full list fits comfortably in one `Query` response, so a
third GSI would be complexity the access pattern hasn't earned yet. If this ever needs to serve
many users with large lists, that's the first thing to add back.

### Why a password gate instead of full auth

The brief is a personal to-do app. Rather than bolt on NextAuth/Cognito/Clerk for a single owner,
`middleware.ts` gates every route behind one shared passphrase, stored as an HMAC-signed,
`httpOnly` cookie (`lib/session.ts`). It cannot be forged or extended by tampering with the
client, and it fails closed (500, not open) if `SESSION_SECRET` is missing. If you need multiple
people to have separate accounts, replace this layer — the DynamoDB schema already supports it.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run table:create         # creates the DynamoDB table via the SDK (dev convenience)
npm run dev
```

Required env vars (see `.env.example` for the full list with comments):

- `AWS_REGION`, `DYNAMODB_TABLE_NAME`
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — only for local dev; use an IAM execution role in
  production instead of static keys
- `APP_PASSWORD` — the passphrase for the login gate
- `SESSION_SECRET` — generate with `openssl rand -base64 32`

## Testing & CI

```bash
npm run type-check   # tsc --noEmit
npm run lint          # eslint
npm test              # vitest — service layer tested against a mocked DynamoDB client
npm run build          # production build
```

`.github/workflows/ci.yml` runs all four on every push/PR.

## Deploying

**Infrastructure (DynamoDB):**

```bash
aws cloudformation deploy \
  --template-file infra/dynamodb-table.yaml \
  --stack-name ledger-todo \
  --parameter-overrides TableName=ledger-todo
```

This provisions the table with on-demand billing, encryption at rest, and point-in-time
recovery. Attach `infra/iam-policy.json` (least-privilege — scoped to exactly this table and its
GSI) to whatever execution role runs the app.

**App (Vercel is the path of least resistance for Next.js):**

1. Push this repo to GitHub, import it in Vercel.
2. Set the env vars above in the Vercel project settings (use a real IAM role/OIDC if your
   platform supports it instead of long-lived keys; Vercel doesn't natively assume AWS roles, so
   for Vercel specifically create an IAM user scoped to `infra/iam-policy.json` and use its keys
   as `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` env vars).
3. Deploy. Middleware runs on Vercel's Edge Runtime automatically.

Any platform that runs Next.js (self-hosted Node, containers, AWS Amplify, Lambda via
`@vercel/next` or OpenNext) works the same way — only the IAM credential wiring changes.

## Cost

DynamoDB on-demand pricing means idle cost is $0. At personal-use volumes (a few hundred reads/
writes a day) this table costs a few cents a month, dominated by the flat per-GB storage price
long before request volume matters. The Next.js app itself is free on Vercel's hobby tier for
personal projects.

## A note on Next.js 14

Next.js 14 reached end-of-life in October 2025. This project pins `next@14.2.35` — the final
patched 14.x release, which closes several CVEs disclosed in late 2025, including a critical
**middleware authorization-bypass** (CVE-2025-29927) that would have gone straight through this
app's password gate. 14.x will not receive fixes for anything disclosed after EOL.

Given this app leans on middleware for its entire auth model, the honest recommendation is to
migrate to Next.js 15 (or later) before running this anywhere it matters, and to keep dependencies
patched on an ongoing basis regardless. The scaffold was built against 14 because that's what was
asked for; treat the version pin as a starting point to revisit, not an endorsement.

## What's deliberately out of scope

- **Multi-user accounts** — schema supports it, auth layer doesn't implement it yet.
- **Offline support / PWA** — would need a service worker and a local-first sync strategy.
- **Rate limiting on the todos API** — only the login endpoint is rate-limited (in-memory, per
  server instance). For a public multi-instance deployment, move this to Upstash Redis or your
  platform's built-in rate limiting.
- **Reordering / drag-and-drop** — the data model sorts by creation time; adding a `position`
  field is straightforward if you want manual ordering.
