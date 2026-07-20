# ProofSkill Build Week log

All dates and times use America/Bogota.

## Prior work

- A product concept and planning document existed before Build Week.
- No production application, authenticated assessment flow, AI evaluation pipeline, persistence layer, or deployed submission existed before the event.

## July 17, 2026 - foundation and vertical slice

- Closed the MVP around one E-commerce / Intermediate scenario.
- Selected Supabase Auth as the only identity source.
- Scaffolded Next.js 16, React 19.2, TypeScript strict, Tailwind CSS 4, Geist, and shadcn/ui.
- Added email/password, email confirmation, Google OAuth callback, recovery, update-password, logout, and safe internal redirects.
- Added the Supabase schema, RLS policies, read-only authenticated grants, foreign-key indexes, and server-only mutation pattern.
- Implemented the state machine, fixture/OpenAI adapters, deterministic scoring, evidence validation, retry behavior, AI-run metadata, and report idempotency.
- Implemented the landing page, labeled public demo, private dashboard, resumable flow, and evidence report.
- Added unit tests, a public-demo E2E spec, lint/typecheck/build gates, an MIT license, and the first submission drafts.
- Published the public repository and created the Devpost draft.

## July 18, 2026 - interaction and deployment hardening

- Replaced large free-text sections with guided selection cards and optional detail so the assessment feels like an interactive decision exercise.
- Added card-based revision adaptations, preservation/removal choices, measurement choices, and visible selected states.
- Audited pointer cursors and interaction affordances for buttons and selectable cards.
- Fixed registration/login redirects and dashboard session behavior across Vercel URLs.
- Corrected Vercel environment variables and redeployed a working Preview and Production build.
- Added a dedicated application icon and verified the production asset.

## July 19, 2026 - live AI, security, and submission package

- Connected the dedicated Supabase project and verified the remote migration.
- Confirmed four RLS-enabled tables, read-only authenticated grants, and owner-scoped SELECT policies.
- Connected the OpenAI project, verified `gpt-5.6-sol`, and completed a live constraint and evaluation flow.
- Verified fixture and live reports persist in the private dashboard.
- Ran local lint, TypeScript, unit tests, E2E coverage, and production build gates.
- Audited Supabase Security and Performance Advisors and documented the remaining warning and informational item.
- Captured public, PII-free screenshots and uploaded the Devpost thumbnail.
- Reworked README, architecture, security, video, and Devpost materials for judges.

## July 20, 2026 - final assessment experience and local handoff

- Made authenticated assessment starts Live AI only and retained `/demo` as the visibly precomputed public demonstration.
- Added explicit processing overlays for strategy submission, revision locking, final-decision submission, and evaluation retry.
- Replaced the final writing fields with four required guided decision-card groups: strategic path, rationale, first action, and stop guardrail.
- Historical pre-final-review verification (superseded): the focused suite passed 8 files / 27 tests.
- Historical pre-final-review verification (superseded): `npm run check` passed lint, TypeScript, 14 Vitest files / 41 tests, and the Next.js production build.
- Made `npm run test:e2e` self-contained: it starts and waits for the local development server, reuses an existing local server outside CI, and skips the launcher when `E2E_BASE_URL` targets an external environment. The public-demo E2E test passed; the later Preview and Production release checks are recorded below.

## July 20, 2026 - final review recovery verification

- Implemented safe reconciliation for ambiguous non-idempotent assessment mutations and session creation without automatic replay.
- Exact-head focused verification passed: 7 files / 31 tests.
- Exact-head `npm run check` passed: lint, TypeScript, 15 Vitest files / 51 tests, and the Next.js production build.
- Exact-head `npm run test:e2e` passed the public-demo test (1/1).

## July 20, 2026 - verified Vercel release

- Verified Preview deployment `dpl_4fZDq1S8dGg9Qk3GVrXzdjwCtM4m` through the complete authenticated Live AI flow: live-only start, strategy processing, GPT-5.6 constraint, guided revision, four-card critical decision, evaluation processing, persisted report, dashboard reopen, and visibly precomputed public demo.
- The live report completed with model `gpt-5.6-sol`, score 65, verified source quotes, and persisted history.
- Promoted that exact Preview artifact to Production as deployment `dpl_CZc9roEpt4jQDC8a1MyL5uxHvoWG` at https://proofskill-blond.vercel.app.
- Production smoke-tested judge login, dashboard, live-only assessment entry, saved live report, and public demo. The post-smoke Vercel runtime logs contained no new error, fatal, or warning entries.
- Verified the judge account and its saved report. Credentials remain outside the repository and are reserved for Devpost's private judging instructions.
- Ran the final Production two-account isolation test with temporary confirmed users: owner and child reads were isolated, direct mutations and forged scores were rejected, cross-user report/evaluation/mutation routes disclosed no data and made no changes, and cleanup left zero temporary users.
- Pushed the verified `main` branch to the public GitHub repository.

## Remaining submission actions

- Enable Supabase leaked-password protection or document the final decision.
- Complete the Google OAuth incognito smoke test.
- Record and upload the public YouTube video under three minutes.
- Run `/feedback` in the Codex task containing most of the core work and copy its Session ID.
- Complete the remaining Devpost fields and submit before the internal deadline: July 21 at 4:00 p.m. Bogota.
