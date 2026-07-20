# Production and submission checklist

Status last reviewed: July 20, 2026 (America/Bogota).

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
- [x] Create and verify judge account with a saved report; keep credentials out of Git.

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
- [x] Production deployment `dpl_CZc9roEpt4jQDC8a1MyL5uxHvoWG`: judge login, dashboard, live-only assessment entry, public demo, and saved live report exercised successfully.
- [x] Application favicon/icon deployed.
- [x] Focused local suite: 7 files / 31 tests passed.
- [x] `npm run check`: lint, typecheck, 15 Vitest files / 51 tests, and production build passed.
- [x] `npm run test:e2e`: Playwright starts and waits for the local development server; the public-demo test passed (1/1). When `E2E_BASE_URL` is set, the same test runs against that external URL without starting a local server.
- [x] Preview deployment `dpl_4fZDq1S8dGg9Qk3GVrXzdjwCtM4m`: completed the full Live AI flow, verified all processing states, reopened the persisted report from the dashboard, confirmed `/demo` remained visibly precomputed, and reviewed clean runtime logs.
- [x] Promoted that exact Preview artifact to Production as `dpl_CZc9roEpt4jQDC8a1MyL5uxHvoWG`.
- [ ] Repeat the complete flow in an incognito window with the prepared judge account.
- [ ] Final incognito smoke: judge login, Google login, dashboard, live flow, saved report, public demo.
- [x] Confirm no new runtime errors after the authenticated Production smoke test.

## Submission

- [x] Public GitHub repository and MIT license; `origin/main` synchronized with the verified release documentation.
- [x] README includes setup, sample/demo data, architecture, tests, and Build Week disclosure.
- [x] Devpost draft created.
- [x] Thumbnail uploaded and PII-free screenshots captured.
- [x] Video script targets 2:45-2:55 and explains GPT-5.6 and Codex.
- [ ] Feature freeze July 21 at 1:00 p.m. Bogota.
- [ ] Record and upload public YouTube video under three minutes.
- [ ] Run `/feedback` from the task containing most core work.
- [ ] Add the verified judge credentials to Devpost's private field and complete the remaining required fields.
- [ ] Submit by July 21 at 4:00 p.m. Bogota; official close is 7:00 p.m. Bogota.
