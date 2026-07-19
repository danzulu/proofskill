# Security verification

Audit date: July 19, 2026.

This document records the read-only production checks completed for the dedicated ProofSkill Supabase project. It contains no credentials or secret values.

## Database status

- PostgreSQL 17 project reported healthy.
- Remote migration present: `20260718020610 initial_schema`.
- Application tables: `assessment_sessions`, `evaluations`, `evidence_items`, and `ai_runs`.
- RLS is enabled on all four tables.
- `evaluations.session_id` is unique for report idempotency.
- Ownership and foreign-key indexes from the migration are present.

## Grants and policies

- The `authenticated` role has SELECT only on the four application tables.
- No application-table INSERT, UPDATE, or DELETE grants are exposed to authenticated clients.
- No anonymous application-table grants were found in the audit.
- Session SELECT policy uses the authenticated user ID as owner.
- Child SELECT policies require an owned related session.
- Server mutations verify `getUser()`, session ownership, and expected state before using the server-only Supabase secret client.

## Advisor results

### Security Advisor

One warning remains: leaked-password protection is disabled. This is an Auth hardening option and does not expose database rows. It should be enabled before the final freeze if available for the project plan.

Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### Performance Advisor

One informational item reports `ai_runs_session_id_idx` as unused. The dataset is currently very small. The index is intentionally retained because production telemetry is queried by session and the index supports the intended relationship as data grows.

## Remaining manual acceptance checks

- Create two confirmed users and verify User A cannot read, mutate, or evaluate User B's session through both application routes and direct authenticated queries.
- Run Google OAuth from a fresh incognito window in Production.
- Verify judge credentials work, then store them only in Devpost's private judging field.

These remaining checks are listed explicitly rather than being inferred from schema inspection.
