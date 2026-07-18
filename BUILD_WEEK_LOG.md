# ProofSkill Build Week log

All times are America/Bogota.

## July 17, 2026

- Closed MVP scope around one E-commerce / Intermediate vertical slice.
- Selected Supabase Auth instead of a second identity provider to keep identity and user-owned results in one authorization system.
- Scaffolded Next.js 16, React 19.2.4, TypeScript strict, Tailwind 4, Geist, and shadcn/ui.
- Added email/password, email confirmation route, Google OAuth callback, recovery, update-password, logout, and safe internal redirects.
- Added the Supabase schema, RLS policies, read-only authenticated grants, foreign-key indexes, and server-only mutation pattern.
- Implemented the scenario, state machine, fixture/OpenAI adapters, deterministic scoring, evidence verification, retry, AI-run metadata, and report idempotency.
- Implemented landing page, public labeled demo, private dashboard, resumable assessment flow, and evidence report.
- Added unit tests, E2E public-demo spec, lint/typecheck/build gates, MIT license, README, video script, Devpost copy, and production checklist.
- Gate result: unit tests, TypeScript, ESLint, and Next.js production build pass locally.
- Published the MIT-licensed repository at https://github.com/danzulu/proofskill.
- Created the Devpost project draft at https://devpost.com/software/proofskill.

## Remaining credentialed work

- Create/link the dedicated Supabase project and apply the migration.
- Configure Google OAuth, email template, redirects, and final Production SITE_URL.
- Add the OpenAI API key and run one GPT‑5.6 live smoke assessment.
- Create/link Vercel, set environment variables, validate Preview, and promote the same artifact.
- Precreate and verify the judge account.
- Record/upload the final public YouTube video.
- Add final Production/repository/video URLs, thumbnail, screenshots, private judge credentials, and /feedback Session ID to Devpost.
