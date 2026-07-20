# Security verification

Audit date: July 20, 2026.

This document records the production security audit and disposable two-account acceptance test completed for the dedicated ProofSkill Supabase project. It contains no credentials or secret values.

## Database status

- PostgreSQL 17 project reported healthy.
- Remote migration present: `20260718020610 initial_schema`.
- The apparently corresponding local file is `20260718011704_initial_schema.sql`; reconcile this version-history mismatch before any future `db push` instead of pushing blindly.
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

One warning remains: leaked-password protection is disabled. The project is on Supabase Free, while HaveIBeenPwned password protection is available on Pro and above. Enabling it therefore requires an authorized plan upgrade; otherwise the limitation must be explicitly accepted for the hackathon MVP.

Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### Performance Advisor

One informational item reports `ai_runs_session_id_idx` as unused. The dataset is currently very small. The index is intentionally retained because production telemetry is queried by session and the index supports the intended relationship as data grows.

## Final two-account acceptance check

Run on July 20 against Production with `npm run security:isolation`:

- Created two confirmed temporary users, one challenge session for User A, and isolated challenge/report sessions for User B.
- Verified each user could select their own session and could not select the other user's session.
- Verified User A could not select User B's evaluation, evidence, or AI-run rows while User B could read each owned child row.
- Verified authenticated direct UPDATE and forged evaluation INSERT attempts were rejected.
- Authenticated the browser as User A and confirmed User B's report and evaluation endpoints returned `404 NOT_FOUND`; the initial-submission mutation returned `409 STATE_CONFLICT` and left User B's session unchanged.
- Authenticated a separate browser context as User B and confirmed the same owned report and idempotent completed-evaluation endpoints returned `200`, with the report remaining completed.
- Revoked both temporary sessions, deleted only the generated users, and confirmed zero temporary security-test users remained.

## Remaining manual acceptance checks

- Run Google OAuth from a fresh incognito window in Production.
- Copy the already verified judge credentials only into Devpost's private judging field.

These remaining checks are listed explicitly rather than being inferred from schema inspection.
