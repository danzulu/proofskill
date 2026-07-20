# Devpost submission package

## Project fields

- **Name:** ProofSkill
- **Tagline:** Pressure-test product judgment and turn every score into verifiable evidence.
- **Submitter type:** Individual
- **Country:** Colombia
- **Category:** Education
- **Production:** https://proofskill-blond.vercel.app
- **Public demo:** https://proofskill-blond.vercel.app/demo
- **Repository:** https://github.com/danzulu/proofskill
- **License:** MIT

## Description

ProofSkill is an evidence-based product strategy assessment. Instead of asking learners to explain what they know, it asks them to make a coherent plan, changes a material condition, and measures how well they adapt.

The Build Week MVP delivers one complete E-commerce / Intermediate journey:

1. A learner signs in and builds an eight-part strategy through guided decision cards.
2. GPT-5.6 Sol generates an adaptive constraint affecting two to four fields.
3. The learner revises each affected decision and makes the adaptation explicit.
4. A final critical decision forces a visible trade-off, action, and guardrail.
5. GPT-5.6 produces a structured seven-competency evaluation.
6. Deterministic code verifies every positive quote against the saved work, applies transparent scoring rules, and persists the private report.

The result is more than a quiz score: it is a reopenable evidence trail showing the learner's original decision, adaptation, contradictions, strongest proof, primary gap, and next challenge. The private dashboard also restores unfinished sessions.

The public demo is precomputed and explicitly labeled. Live assessments require an account. Supabase Auth and Row Level Security isolate each user's sessions, evaluations, evidence, and AI-run metadata.

## Technological implementation

- `gpt-5.6-sol` through the OpenAI Responses API.
- Structured Outputs with Zod for both constraints and evaluations.
- Low reasoning effort for constraint generation and medium for evaluation.
- `store: false`, privacy-preserving safety identifiers, differentiated failures, and one controlled citation retry.
- Next.js 16 request-scoped auth, protected server routes, idempotent state transitions, and server-only mutations.
- Supabase RLS plus SELECT-only authenticated grants.
- Deterministic evidence validation, versioned scoring, visible caps, and persisted run metadata.

GPT-5.6 proposes the adaptive constraint and evidence draft. It does not own the final report: deterministic application code verifies quotes, applies rubric weights and caps, and prevents unsupported positive evidence from appearing.

## Design and impact

ProofSkill turns assessment into an interactive pressure test. Guided cards reduce blank-page anxiety while the adaptive constraint still requires genuine reasoning. The report translates the experience into actionable learning: what the learner proved, where the strategy contradicted itself, and what challenge should come next.

The same pattern can later support product management education, hiring simulations, cohort coaching, and other domains where observable judgment matters more than memorized terminology.

## How Codex was used

Codex was the primary Build Week development partner. It helped convert the brief into vertical slices, implement the Next.js and Supabase architecture, design the state machine and least-privilege policies, build the guided interactions, create tests, diagnose production deployments, verify the OpenAI integration, and prepare the final submission package. Human control remained over product choices, credentials, external accounts, live testing, and submission.

## Built with

OpenAI GPT-5.6 Sol, OpenAI Responses API, Structured Outputs, Codex, Next.js 16, React 19.2, TypeScript, Supabase Auth, PostgreSQL, Row Level Security, Vercel, Tailwind CSS 4, shadcn/ui, Zod, Vitest, and Playwright.

## Devpost custom fields

- **Submitter Type:** Individual
- **Country:** Colombia
- **Category:** Education
- **Repository URL:** https://github.com/danzulu/proofskill
- **/feedback Session ID:** pending
- **Plugin/dev-tool instructions:** not applicable

## Private judge instructions template

The judge account is verified and the template is ready. Replace the placeholders and paste it only into Devpost's private judging field:

```text
Production URL: https://proofskill-blond.vercel.app/login

Judge email: <JUDGE_EMAIL>
Judge password: <JUDGE_PASSWORD>

1. Sign in with the judge account; email confirmation is already complete.
2. Open Dashboard to see saved history.
3. Choose New assessment for a live GPT-5.6 run.
4. The public precomputed demo is available at https://proofskill-blond.vercel.app/demo.

Please do not change the account password during judging.
```

Never commit the completed credentials to GitHub.

## Status

- Live Devpost check on July 20: the ProofSkill project page is published at https://devpost.com/software/proofskill and the account is registered for OpenAI Build Week, but the project has not yet been submitted to the hackathon.
- Required deliverables still missing in Devpost: a public YouTube demo under three minutes and the `/feedback` Session ID.
- Submission closes July 21, 2026 at 5:00 p.m. Pacific / 7:00 p.m. Bogota. The internal target remains 4:00 p.m. Bogota.

- [x] Public repository and MIT license
- [x] Production URL
- [x] Public labeled demo
- [x] Thumbnail and screenshots
- [x] README, architecture, setup, sample data, and tests
- [x] Judge account created, confirmed, and verified with a saved report
- [ ] Judge credentials copied only into Devpost's private instructions
- [ ] Public YouTube video under three minutes
- [ ] `/feedback` Session ID
- [ ] Final Devpost review and submission
