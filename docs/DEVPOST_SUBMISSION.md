# Devpost submission draft

## Project

Name: ProofSkill  
Tagline: Pressure-test business judgment and turn every score into verifiable evidence.  
Category: Education  
Submitter: Individual  
Country: Colombia

## Description

ProofSkill is an evidence-based business assessment. Instead of asking learners to explain what they know, it asks them to make a strategy, changes a material condition, and measures how well they adapt.

The Build Week MVP delivers one complete E-commerce / Intermediate journey:

1. A learner signs in and completes an eight-field strategy canvas.
2. GPT‑5.6 Sol generates an adaptive constraint affecting two to four fields.
3. The learner revises the proposal and makes every adaptation explicit.
4. A critical decision forces a visible trade-off and guardrail.
5. GPT‑5.6 produces a structured seven-competency evaluation.
6. Deterministic code verifies every positive quote against the saved work, applies transparent scoring rules, and persists the private report.

The public demo is precomputed and explicitly labeled. Live assessments require an account, and Supabase RLS isolates each user's sessions, evaluations, evidence, and AI-run metadata.

## How GPT‑5.6 is used

- gpt-5.6-sol through the Responses API.
- Structured Outputs with Zod for constraints and evaluations.
- Low reasoning effort for constraint generation; medium for evaluation.
- Storage disabled and a privacy-preserving safety identifier.
- No request or storage of chain of thought.

GPT‑5.6 proposes the adaptive constraint and evidence draft. It does not own the final score: deterministic code verifies citations, applies rubric weights and caps, and prevents unsupported positive evidence from appearing.

## How Codex was used

Codex helped close scope, scaffold and implement the Next.js vertical slice, model the state machine, design Supabase RLS and least-privilege grants, implement auth callbacks and secure handlers, create tests, and prepare the deployment, video, and submission package. The Build Week log separates prior planning from event implementation.

## Built with

OpenAI GPT‑5.6 Sol, Responses API, Structured Outputs, Codex, Next.js 16, React 19.2, TypeScript, Supabase Auth, Postgres, RLS, Vercel, Tailwind CSS 4, shadcn/ui, Zod, Vitest, and Playwright.

## Final fields checklist

- [ ] Public GitHub repository and MIT license
- [ ] Production URL
- [ ] Public YouTube video under three minutes
- [ ] /feedback Session ID
- [ ] Thumbnail and screenshots
- [ ] Private judge email and password
- [ ] Verify private instructions contain no secrets other than judge credentials
- [ ] Submit before 4:00 p.m. Bogota internal deadline

