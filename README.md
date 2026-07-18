# ProofSkill

ProofSkill is an evidence-based business assessment for the OpenAI Build Week hackathon, Education category. A learner proposes an e-commerce strategy, receives an adaptive constraint, revises the plan, makes a critical decision, and receives a private report backed by exact quotes from their own submission.

The public /demo is precomputed and labeled. Real assessments require an authenticated account and are persisted per user.

Repository: https://github.com/danzulu/proofskill  
Devpost draft: https://devpost.com/software/proofskill

## What is implemented

- Email/password signup, confirmation, login, logout, recovery, and password update with Supabase Auth.
- Google OAuth callback flow.
- Private dashboard with resumable sessions and completed reports.
- One versioned E-commerce / Intermediate scenario.
- Eight-field proposal canvas, adaptive constraint, explicit revision, critical decision, and report.
- AssessmentAI interface with fixture and GPT‑5.6 Sol implementations.
- Responses API Structured Outputs using Zod, store disabled, intentional reasoning effort, and a privacy-preserving safety identifier.
- Deterministic scoring, score caps, exact-quote verification, one evidence retry, and idempotent reports.
- Supabase migration with RLS, ownership policies, least-privilege grants, foreign-key indexes, and server-only writes.
- Next.js 16 App Router, React 19.2.4, TypeScript strict, Tailwind 4, Geist, and shadcn/ui.

## Architecture

    Browser
      ├─ Supabase Auth cookies (publishable key)
      ├─ Server Components: private reads through RLS
      └─ Route Handlers: getUser → ownership/state check → secret-key mutation
                                        │
                                        ├─ FixtureAssessmentAI
                                        └─ LiveAssessmentAI → OpenAI Responses API

    Supabase
      assessment_sessions ─┬─ evaluations (unique session_id)
                           ├─ evidence_items
                           └─ ai_runs

src/proxy.ts refreshes auth cookies and performs convenience redirects. It is not the authorization boundary. Every protected page and endpoint validates the user again.

## Local setup

Requirements: Node.js 20.9+ and a Supabase project.

    npm install
    copy .env.example .env.local
    npm run dev

Required environment variables:

    NEXT_PUBLIC_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    SUPABASE_SECRET_KEY
    NEXT_PUBLIC_SITE_URL
    OPENAI_API_KEY
    OPENAI_MODEL=gpt-5.6-sol
    ENABLE_AI_FIXTURES

Only NEXT_PUBLIC values reach the browser. Never expose SUPABASE_SECRET_KEY or OPENAI_API_KEY.

Apply the migration:

    npx supabase link --project-ref PROJECT_REF
    npx supabase db push

For a local labeled fixture rehearsal, set ENABLE_AI_FIXTURES=true. Production should default to false; the public /demo remains available without that flag.

## Supabase Auth configuration

1. Enable email/password and require email confirmation.
2. Set SITE_URL to the final Production URL.
3. Add http://localhost:3000/** and the real Vercel Preview wildcard as redirect URLs.
4. Configure the confirmation template for PKCE so it targets /auth/confirm with TokenHash and type=email.
5. Configure Google in Supabase Auth. The authorized callback in Google is the Supabase callback shown by the dashboard.
6. Store Google Client ID/Secret in Supabase, never in this repository.

## Judge account

Set JUDGE_EMAIL and JUDGE_PASSWORD only in .env.local, then run:

    npm run judge:create

The credentials belong only in Devpost's private judging instructions. Do not commit them or put them in the public README.

## Verification

    npm run lint
    npm run typecheck
    npm run test
    npm run build
    npm run test:e2e

The E2E command expects a running app. Set E2E_BASE_URL to a Preview or Production URL when testing a deployment.

Security verification before submission:

- User A cannot select a session, evaluation, evidence item, or AI run owned by B.
- Direct inserts, updates, and deletes as authenticated fail.
- Double submissions return a state conflict or the existing idempotent result.
- Positive evidence not found at its source path is never displayed as positive.
- No secret appears in browser bundles, Git history, build logs, or Devpost public fields.

## Deployment

Use Vercel Git integration. Validate a Preview first, run the smoke suite, then promote that same deployment artifact to Production. Scope Preview and Production environment variables separately so Preview never uses Production data accidentally.

## Build Week disclosure

The original concept and long-form planning document existed before Build Week. The implemented hackathon vertical slice—application scaffold, authentication, persistence, state machine, AI adapters, scoring, evidence validation, UI, tests, deployment material, and submission package—was built during the event. See BUILD_WEEK_LOG.md and PROOFSKILL_MASTER_PLAN_CODEX.md.

## Limitations

The MVP intentionally contains one English scenario at one difficulty. It does not include organizations, certificates, payments, public user reports, profile editing, cross-user comparisons, or an admin dashboard.

## License

MIT
