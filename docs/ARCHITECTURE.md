# Architecture and security decisions

## Identity

Supabase Auth is the only identity source. Clerk was reviewed through the installed Vercel auth guidance, but adding it would require synchronizing an external identity with Supabase-owned assessment rows. One identity system makes ownership checks and RLS auditable.

## Request boundaries

- src/proxy.ts refreshes cookies and performs optimistic redirects.
- Server Components call getUser or requireUser and read through RLS.
- Route Handlers call getUser, verify user_id and expected state, then use the lazy secret-key client.
- The browser never receives the Supabase secret key or OpenAI key.

## State machine

    challenge
      → initial_submitted
      → constraint_generating
      → constraint
      → revision_submitted
      → critical_decision
      → evaluating
      → completed

Expected-state filters make double submission observable. evaluations.session_id is unique, so a report can be created at most once.

## Evidence and score

The model proposes seven competency scores and source-backed evidence. Deterministic code:

1. Resolves each source_path.
2. Normalizes whitespace and case and verifies the exact quote is a substring.
3. Retries evaluation once when more than 30 percent of positive citations are invalid.
4. Prevents invalid positive evidence from appearing.
5. Applies rubric weights and visible caps.

No chain of thought is requested or stored.

