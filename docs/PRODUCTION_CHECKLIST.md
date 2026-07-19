# Production and submission checklist

Status last reviewed: July 19, 2026 (America/Bogota).

## Supabase

- [x] Dedicated ProofSkill project.
- [x] Remote migration applied and listed.
- [x] Four application tables have RLS enabled.
- [x] Authenticated grants are SELECT-only for application tables.
- [x] Owner-scoped session and child SELECT policies verified.
- [x] Email confirmation flow implemented.
- [x] PKCE confirmation and OAuth callback routes implemented.
- [x] Production SITE_URL and application redirect behavior configured.
- [x] Direct authenticated score/evidence writes are not granted.
- [x] Security and Performance Advisors reviewed and documented.
- [ ] Enable leaked-password protection or record the final acceptance decision.
- [ ] Run final two-account check: User A cannot read, mutate, or evaluate User B's session.
- [ ] Run final Google OAuth smoke test from an incognito window.
- [ ] Create and verify judge account; store credentials only in Devpost private instructions.

## OpenAI

- [x] `OPENAI_API_KEY` stored as a secret and excluded from Git.
- [x] `OPENAI_MODEL` equals `gpt-5.6-sol`.
- [x] Live constraint smoke test completed.
- [x] Live evaluation and persisted report completed.
- [x] Invalid evidence retry covered by deterministic tests/fixtures.
- [x] No chain of thought requested or stored.
- [ ] Recheck Vercel Production logs immediately before recording.

## Vercel

- [x] Public Production deployment is available.
- [x] Environment variables applied and redeployed.
- [x] Login, dashboard, public demo, and live assessment exercised in Production.
- [x] Application favicon/icon deployed.
- [x] Local lint, typecheck, tests, E2E, and production build gates pass.
- [ ] Final incognito smoke: judge login, Google login, dashboard, live flow, saved report, public demo.
- [ ] Confirm no new runtime errors after the final smoke test.

## Submission

- [x] Public GitHub repository and MIT license.
- [x] README includes setup, sample/demo data, architecture, tests, and Build Week disclosure.
- [x] Devpost draft created.
- [x] Thumbnail uploaded and PII-free screenshots captured.
- [x] Video script targets 2:45-2:55 and explains GPT-5.6 and Codex.
- [ ] Feature freeze July 21 at 1:00 p.m. Bogota.
- [ ] Record and upload public YouTube video under three minutes.
- [ ] Run `/feedback` from the task containing most core work.
- [ ] Add private judge credentials and remaining required Devpost fields.
- [ ] Submit by July 21 at 4:00 p.m. Bogota; official close is 7:00 p.m. Bogota.
