# Assessment UX polish design

Date: July 20, 2026

## Outcome

ProofSkill's authenticated assessment will present one production path, communicate every long-running transition clearly, and finish with a fully guided critical decision. The public precomputed demo remains available at `/demo`, but authenticated users will no longer be offered a fixture rehearsal.

## Scope

This change includes:

- a live-only `/assessment/new` page;
- prominent, accessible processing feedback for strategy submission, revision locking, and final evaluation;
- a critical decision composed entirely of selectable cards;
- error recovery that preserves the server-authoritative assessment state;
- automated tests for the guided payload and processing behavior.

It does not change the scenario, database schema, scoring rubric, OpenAI prompts, public demo, historical fixture sessions, authentication, or report layout.

## Entry screen

`/assessment/new` will show one primary `Live AI Assessment` card and one start button. The card will retain the scenario title, difficulty, duration, and a short explanation that GPT-5.6 generates the adaptive pressure test and evaluation.

When OpenAI is unavailable, the page will show a clear configuration alert instead of exposing a fixture start action. Existing fixture data and the fixture API path remain available for automated tests and the clearly labeled `/demo` route. Historical fixture sessions remain reopenable.

Any fallback copy elsewhere in the authenticated flow that currently directs users to start a fixture rehearsal will instead link to the public demo or dashboard.

## Processing experience

A reusable processing overlay will make long operations impossible to miss. It will cover the current assessment content with a restrained backdrop and a centered status card containing:

- an animated icon;
- a short action title;
- one sentence setting an honest expectation;
- a note that the learner's selections are saved and the page should remain open.

The overlay will use `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`. The parent form will expose `aria-busy`. All mutable controls will be disabled while a submission is pending, preventing double submissions or edits after the request snapshot. Spinner animation will respect reduced-motion preferences.

### Strategy phases

1. `saving`: **Saving your strategy** - the eight decisions are being persisted.
2. `generating`: **GPT-5.6 is creating your pressure test** - the adaptive constraint may take several seconds.
3. `navigating`: **Pressure test ready** - the next step is opening.

If the initial proposal saves but constraint generation fails, the client will refresh from the server-authoritative state. The page will then expose the existing constraint retry path instead of resubmitting the initial proposal.

### Revision phases

1. `saving`: **Locking your revision** - the adaptations, preserved choices, removals, and measurement rule are being saved.
2. `navigating`: **Revision locked** - the critical decision is opening.

Network and response errors remove the overlay and display the existing destructive alert without losing the current in-memory selections.

### Evaluation phases

1. `saving`: **Saving your critical decision** - the four guided choices are being persisted.
2. `evaluating`: **GPT-5.6 is evaluating your evidence** - the model is reviewing the complete decision trail and this can take up to a minute.
3. `navigating`: **Report ready** - the verified result is opening.

Errors remove the overlay, restore interaction when safe, and refresh the server state when the request outcome is ambiguous. The report is shown only after evaluation succeeds.

## Guided critical decision

The critical decision will contain four required card groups:

1. the existing strategic path: protect margin, protect growth, or run a bounded experiment;
2. why that trade-off is defensible;
3. what happens in the first 48 hours;
4. which guardrail stops the plan.

Each of the three new groups will contain three concise options. A selected card will show the same green border, radio indicator, hover treatment, pointer cursor, and keyboard behavior used by the canvas and revision flows. There will be no textareas or optional writing fields on this screen.

The user interface stores option IDs locally, but submission maps every selected ID to a complete English sentence. The existing durable payload remains unchanged:

```ts
{
  choice: "protect_margin" | "protect_growth" | "balanced_experiment";
  rationale: string;
  first_action: string;
  guardrail: string;
}
```

Keeping prose values preserves compatibility with existing reports, evaluation retries, the OpenAI input schema, exact-quote evidence validation, and previously saved authored decisions. No database migration is required. The Zod schema remains permissive enough to reopen historical sessions.

## Component boundaries

- `ProcessingOverlay`: presentation-only component receiving title and description.
- `CanvasForm`, `RevisionForm`, and `DecisionForm`: own small phase unions instead of one ambiguous boolean.
- `ECOMMERCE_SCENARIO.criticalDecision`: owns the three new guided option sets and their full response strings.
- `DecisionForm`: maps selected IDs to full response strings before calling the existing APIs.
- `/assessment/new`: renders one live start path; API-level fixture support remains internal.

No new global state or dependency is needed.

## Error handling

- Every request and JSON parse will be enclosed in `try/catch`.
- A handled API error restores interaction and displays its message.
- A network error uses a stable, actionable message rather than leaving the screen indefinitely busy.
- Once an earlier state transition succeeds, retry behavior follows the current server state instead of replaying the earlier mutation.
- Existing ownership, expected-state filters, and idempotent evaluation persistence remain unchanged.

## Accessibility and responsive behavior

- Card groups use semantic labels and accessible group names.
- Every card remains keyboard selectable through the Radix radio primitive.
- Processing messages are announced without repeatedly interrupting assistive technology.
- Pending forms cannot be changed or submitted twice.
- The overlay remains readable on mobile and does not expose hidden model reasoning.
- Animations include reduced-motion behavior.

## Test strategy

Implementation follows red-green-refactor:

1. Add failing scenario tests requiring exactly three valid, unique options for `rationale`, `first_action`, and `guardrail`.
2. Add a failing compatibility test proving both legacy prose and the new guided payload pass `criticalDecisionSchema` with the same four keys.
3. Add failing evidence tests proving exact guided sentences remain resolvable at the existing source paths.
4. Add failing component tests showing the decision screen has no textboxes, requires four radio groups, submits full sentences rather than IDs, and starts evaluation only after the decision save succeeds.
5. Add failing processing tests for the visible phase messages, `aria-busy`, disabled interaction, error recovery, and the live-only start page.
6. Run focused tests during each cycle, followed by lint, typecheck, the full Vitest suite, E2E coverage, and a production build.
7. Verify the complete live flow in a Vercel Preview before promoting the same artifact to Production.

## Acceptance criteria

- Authenticated users can start only a live AI assessment from `/assessment/new`.
- `/demo` remains public and explicitly labeled as precomputed.
- Strategy submission visibly distinguishes saving from GPT-5.6 constraint generation.
- Revision locking displays an unmistakable processing state.
- The critical decision contains no required writing and can be completed entirely with cards.
- Evaluation displays an unmistakable GPT-5.6 processing state until the report is ready.
- Double submission and editing during processing are prevented.
- Failures return to an actionable screen instead of remaining stuck.
- The stored critical-decision shape, evaluator input, scoring, evidence validation, and historical sessions remain compatible.
