# ProofSkill architecture

## Design goal

ProofSkill produces a durable learning artifact from a product decision exercise. The architecture separates flexible AI judgment from deterministic evidence and authorization rules.

## Identity

Supabase Auth is the only identity source. Email/password with confirmation and Google OAuth both resolve to the same Supabase user ID, which owns every assessment row. Using one identity system keeps application ownership checks and database RLS policies auditable.

## Request boundaries

```text
Browser
  -> Next.js Server Components / Server Actions / Route Handlers
       -> request-scoped Supabase authenticated client
       -> lazy server-only Supabase administrative client
       -> lazy server-only OpenAI client
```

- `src/proxy.ts` refreshes auth cookies and performs convenience redirects.
- It is not the authorization boundary.
- Protected Server Components, Server Actions, and Route Handlers call `supabase.auth.getUser()`.
- Route Handlers verify the owner and expected state before mutating with the server-only secret client.
- Authenticated pages are dynamic and use private, no-store responses.
- The browser never receives the Supabase secret key or OpenAI API key.
- `next` redirects are accepted only when they resolve to an internal path.

## Assessment state machine

```text
challenge
  -> initial_submitted
  -> constraint_generating
  -> constraint
  -> revision_submitted
  -> critical_decision
  -> evaluating
  -> completed
```

Updates include the expected current state and user owner in the database filter. This makes double submissions safe and observable. `evaluations.session_id` is unique, so a session can produce at most one persisted report.

## Data model

- `assessment_sessions`: owner, mode, state, scenario inputs, submissions, and generated constraint.
- `evaluations`: unique report, rubric/model metadata, deterministic score, level, gap, and next challenge.
- `evidence_items`: competency evidence with exact source paths and quote-validation state.
- `ai_runs`: server-side model run metadata, latency, attempt, status, and failure category.

All four tables have RLS enabled. Authenticated users receive SELECT only. Child policies confirm ownership through the related session. Direct browser writes to scores, evidence, and telemetry are not granted.

## AI boundary

The `AssessmentAI` interface has two implementations:

- `LiveAssessmentAI`: OpenAI Responses API using `gpt-5.6-sol` and Structured Outputs.
- `FixtureAssessmentAI`: deterministic development, E2E, and clearly labeled public demo behavior.

Constraint generation uses low reasoning effort. Evaluation uses medium reasoning effort. Both use `store: false`, Zod schemas, and a stable non-identifying safety identifier. The application distinguishes refusals, timeouts, rate limits, schema failures, and configuration errors. No chain of thought is requested or stored.

## Evidence and scoring

The model proposes seven competency assessments and source-backed evidence. Deterministic application code then:

1. Resolves each `source_path` into the saved learner submission.
2. Normalizes whitespace and case and checks that the exact quote is present.
3. Retries evaluation once if more than 30 percent of positive citations are invalid.
4. Removes unsupported positive evidence from the displayed report.
5. Applies versioned rubric weights, visible caps, and deterministic adjustments.
6. Persists model and rubric versions with the final result.

GPT-5.6 proposes the evaluation; application code owns the final evidence validity and score calculation.

## Deployment

- Vercel hosts the Next.js production artifact.
- Production URL: https://proofskill-blond.vercel.app
- Supabase provides authentication and Postgres persistence.
- OpenAI provides live adaptive constraint and evaluation calls.
- Environment secrets are scoped in Vercel and excluded from Git.

See [Security verification](SECURITY_VERIFICATION.md) for the latest database audit.
