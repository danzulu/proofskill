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
- [x] Project owner explicitly accepted Supabase Free for the hackathon MVP on July 20; leaked-password protection remains a known limitation to revisit before long-term production use.
- [x] Run final two-account Production check: User A cannot read, mutate, or evaluate User B's session; direct writes fail; cleanup leaves zero temporary users.
- [x] Run final Google OAuth Production login smoke test; completed July 20 without exposing account credentials.
- [x] Create and verify judge account with a saved report; keep credentials out of Git.

## OpenAI

- [x] `OPENAI_API_KEY` stored as a secret and excluded from Git.
- [x] `OPENAI_MODEL` equals `gpt-5.6-sol`.
- [x] Live constraint smoke test completed.
- [x] Live evaluation and persisted report completed.
- [x] Invalid evidence retry covered by deterministic tests/fixtures.
- [x] No chain of thought requested or stored.
- [x] Rechecked Vercel Production logs immediately before the final render; no error-level events were returned.

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
- [x] Published commit `1db3fd8` through verified Preview `dpl_6jKaHpdPNx2L22Z8JM82C6DkJ1NK`, promoted it to Production as `dpl_6oB7AXr11UWANSoKqoP6Y4EKgnUZ`, and passed the public-demo E2E check.
- [x] Repeated the protected flow with the prepared judge account and reopened its persisted report.
- [x] Final fresh-context acceptance covered judge login, Google login, dashboard, Live AI entry, saved report, and public demo.
- [x] Confirm no new runtime errors after the authenticated Production smoke test.
- [x] Final fresh-context smoke on `dpl_6oB7AXr11UWANSoKqoP6Y4EKgnUZ`: judge login, dashboard, Live-AI-only entry, and labeled public demo; post-smoke error log query was empty.

## Submission

- [x] Public GitHub repository and MIT license; `origin/main` synchronized with the verified release documentation.
- [x] README includes setup, sample/demo data, architecture, tests, and Build Week disclosure.
- [x] Devpost project created and submitted to OpenAI Build Week.
- [x] Thumbnail uploaded and PII-free screenshots captured.
- [x] Final video script and narration explain GPT-5.6 and Codex.
- [x] Production capture verified seven 1920x1080 VP8 WebM clips: `01-dashboard.webm`, `02-guided-strategy.webm`, `03-adaptive-constraint.webm`, `04-guided-revision.webm`, `05-critical-decision.webm`, `06-evidence-report.webm`, and `07-persistence.webm`.
- [x] Binary verification completed full decode, SHA-256 hashing, and stream/chapter/metadata checks; the latest raw-clip QA bundle is `2026-07-20T23-39-22-456Z` with 21 expected frames.
- [x] Rendered `proofskill-devpost-demo.mp4`: 2:35.3, H.264 High, AAC stereo, 1920x1080, 25 fps, full decode accepted, and 18 representative final-cut frames reviewed without credentials or browser chrome.
- [x] Feature freeze started after the verified release and submission.
- [x] Uploaded the public 2:35.3 YouTube video using real product footage and the permitted AI-assisted voiceover: https://www.youtube.com/watch?v=n57KMYymFCA
- [x] Added primary Codex task ID `019f729e-283a-7a03-a3a5-7c14c2cecaee` as the `/feedback` Session ID.
- [x] Added verified judge credentials only to Devpost's private field and completed all required fields.
- [x] Devpost accepted submission `1108778` on July 20, before the internal and official deadlines.
