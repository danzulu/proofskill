# Assessment UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the authenticated assessment live-only, show unmistakable processing states, and replace the final written decision with four required card selections.

**Architecture:** Preserve the existing API and persisted `CriticalDecision` contract. Add scenario-owned guided response metadata, map client-only option IDs to complete prose before submission, and reuse one accessible overlay across the three client forms. Keep fixture support internal for tests and the labeled public demo.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript 5.9 strict, Tailwind CSS 4, Radix/shadcn radio primitives, Vitest 4, Testing Library, Playwright.

## Global Constraints

- Read relevant installed Next.js guides before changing App Router code.
- Do not change database tables, RLS, API routes, evaluator prompts, scoring, or report schemas.
- Keep `critical_decision` keys exactly `choice`, `rationale`, `first_action`, and `guardrail`.
- Submit complete prose responses, never guided option IDs, to preserve evaluation and evidence quality.
- Keep `/demo` public and explicitly labeled as precomputed.
- Historical fixture sessions remain reopenable; only new authenticated starts become live-only.
- All pending states must disable mutable controls, expose `aria-busy`, and announce status through `role="status"`.
- Every behavior change follows red-green-refactor.

## File map

- Create `src/lib/domain/critical-decision.ts`: map guided IDs to the existing durable payload.
- Create `src/lib/domain/critical-decision.test.ts`: payload compatibility and invalid-selection tests.
- Modify `src/lib/domain/scenario.ts`: add three guided option groups with full prose responses.
- Modify `src/lib/domain/scenario.test.ts`: validate option counts, unique IDs, and schema-valid responses.
- Modify `src/lib/domain/evidence.test.ts`: prove guided response quotes resolve at existing source paths.
- Create `src/components/processing-overlay.tsx`: reusable accessible busy overlay.
- Create `src/components/processing-overlay.test.tsx`: visible copy and status semantics.
- Create `src/components/assessment-start-panel.tsx`: live-only start presentation.
- Create `src/components/assessment-start-panel.test.tsx`: no fixture action and configured/unconfigured states.
- Modify `src/app/assessment/new/page.tsx`: render the live-only panel.
- Modify `src/components/start-assessment-button.tsx`: always create `run_mode: "live"` and handle network errors.
- Modify `src/app/assessment/[sessionId]/challenge/page.tsx`: remove fixture-rehearsal fallback copy.
- Modify `src/components/canvas-form.tsx`: phased saving/generating/navigating overlay and recovery.
- Modify `src/components/revision-form.tsx`: phased saving/navigating overlay.
- Modify `src/components/decision-form.tsx`: four guided groups and phased evaluation overlay.
- Create `src/components/decision-form.test.tsx`: no writing, full-prose payload, sequencing, and pending UI.
- Update `README.md`, `BUILD_WEEK_LOG.md`, `docs/PRODUCTION_CHECKLIST.md`, and `docs/VIDEO_SCRIPT.md` after verification.

---

### Task 1: Guided critical-decision domain data

**Files:**
- Modify: `src/lib/domain/scenario.ts`
- Modify: `src/lib/domain/scenario.test.ts`
- Create: `src/lib/domain/critical-decision.ts`
- Create: `src/lib/domain/critical-decision.test.ts`
- Modify: `src/lib/domain/evidence.test.ts`

**Interfaces:**
- Consumes: `criticalDecisionSchema`, `CriticalDecision`, and `ECOMMERCE_SCENARIO`.
- Produces: `decisionDetailKeys`, `GuidedDecisionSelections`, and `buildGuidedCriticalDecision(selections): CriticalDecision | null`.

- [ ] **Step 1: Write failing scenario and mapping tests**

Add this behavior to `scenario.test.ts`:

```ts
import { criticalDecisionSchema } from "./assessment";

it("offers three schema-valid choices for every critical decision detail", () => {
  const details = ECOMMERCE_SCENARIO.criticalDecision.details;
  for (const detail of Object.values(details)) {
    expect(detail.choices).toHaveLength(3);
    expect(new Set(detail.choices.map((choice) => choice.id)).size).toBe(3);
  }
  expect(
    criticalDecisionSchema.safeParse({
      choice: ECOMMERCE_SCENARIO.criticalDecision.choices[0].value,
      rationale: details.rationale.choices[0].response,
      first_action: details.first_action.choices[0].response,
      guardrail: details.guardrail.choices[0].response,
    }).success,
  ).toBe(true);
});
```

Create `critical-decision.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { criticalDecisionSchema } from "./assessment";
import { buildGuidedCriticalDecision } from "./critical-decision";
import { ECOMMERCE_SCENARIO } from "./scenario";

const details = ECOMMERCE_SCENARIO.criticalDecision.details;
const selections = {
  choice: "balanced_experiment",
  rationale: details.rationale.choices[0].id,
  first_action: details.first_action.choices[0].id,
  guardrail: details.guardrail.choices[0].id,
};

describe("guided critical decision", () => {
  it("maps client option ids to the durable prose payload", () => {
    const result = buildGuidedCriticalDecision(selections);
    expect(result).toEqual({
      choice: "balanced_experiment",
      rationale: details.rationale.choices[0].response,
      first_action: details.first_action.choices[0].response,
      guardrail: details.guardrail.choices[0].response,
    });
    expect(criticalDecisionSchema.safeParse(result).success).toBe(true);
  });

  it("rejects incomplete and unknown guided selections", () => {
    expect(buildGuidedCriticalDecision({ ...selections, rationale: "" })).toBeNull();
    expect(buildGuidedCriticalDecision({ ...selections, guardrail: "unknown" })).toBeNull();
  });

  it("keeps legacy authored prose schema-compatible", () => {
    expect(
      criticalDecisionSchema.safeParse({
        choice: "protect_margin",
        rationale: "Protecting contribution quality keeps the experiment economically defensible.",
        first_action: "Define the eligible cohort and baseline performance first.",
        guardrail: "Stop if contribution margin falls below the agreed floor.",
      }).success,
    ).toBe(true);
  });
});
```

Add `import { ECOMMERCE_SCENARIO } from "./scenario";` to `evidence.test.ts`, then extend it with:

```ts
it.each(["rationale", "first_action", "guardrail"] as const)(
  "verifies guided critical-decision evidence at %s",
  (key) => {
    const response = ECOMMERCE_SCENARIO.criticalDecision.details[key].choices[0].response;
    const guidedInput = {
      ...input,
      critical_decision: { ...input.critical_decision, [key]: response },
    } satisfies EvaluationInput;
    expect(
      validateEvidence(guidedInput, {
        competency: "decision_quality",
        kind: "positive",
        source_path: `critical_decision.${key}`,
        exact_quote: response,
        explanation: "The selected response makes the final decision explicit.",
      }),
    ).toBe(true);
  },
);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
npm.cmd test -- src/lib/domain/scenario.test.ts src/lib/domain/critical-decision.test.ts src/lib/domain/evidence.test.ts
```

Expected: FAIL because `criticalDecision.details` and `buildGuidedCriticalDecision` do not exist.

- [ ] **Step 3: Add the guided option metadata**

Add `details` under `ECOMMERCE_SCENARIO.criticalDecision` with these exact response strings:

```ts
details: {
  rationale: {
    prompt: "Why is this trade-off defensible?",
    choices: [
      {
        id: "economic_quality",
        title: "Protect economic quality",
        tradeoff: "Durability",
        response: "Prioritize contribution quality because growth that depends on unsustainable margin loss is not durable.",
      },
      {
        id: "recover_demand",
        title: "Recover demand quickly",
        tradeoff: "Speed",
        response: "Prioritize a fast recovery in qualified checkout demand while accepting a controlled and temporary economic cost.",
      },
      {
        id: "buy_evidence",
        title: "Buy evidence before scale",
        tradeoff: "Learning",
        response: "Use a bounded test because credible evidence is more valuable than committing the full budget under uncertainty.",
      },
    ],
  },
  first_action: {
    prompt: "What happens in the first 48 hours?",
    choices: [
      {
        id: "define_cohort",
        title: "Define the cohort",
        tradeoff: "Focus",
        response: "Define the eligible cohort, baseline current performance, and assign one accountable owner before launch.",
      },
      {
        id: "ship_reversible",
        title: "Ship one reversible move",
        tradeoff: "Momentum",
        response: "Ship one reversible treatment to the highest-intent cohort and verify its instrumentation within 48 hours.",
      },
      {
        id: "create_control",
        title: "Create the control",
        tradeoff: "Causal proof",
        response: "Create exposed and control cohorts, confirm event tracking, and publish the decision thresholds before launch.",
      },
    ],
  },
  guardrail: {
    prompt: "What makes you stop?",
    choices: [
      {
        id: "margin_floor",
        title: "Margin floor fails",
        tradeoff: "Economics",
        response: "Stop if contribution margin per session falls below the predefined floor.",
      },
      {
        id: "trust_signal",
        title: "Trust deteriorates",
        tradeoff: "Customer risk",
        response: "Stop if cancellations, refunds, or customer complaints rise beyond the agreed threshold.",
      },
      {
        id: "lift_not_reached",
        title: "Minimum lift is missed",
        tradeoff: "Decision discipline",
        response: "Stop at the decision date if minimum incremental lift is not reached or any guardrail fails.",
      },
    ],
  },
},
```

- [ ] **Step 4: Implement the pure payload mapper**

Create `critical-decision.ts`:

```ts
import type { CriticalDecision } from "./assessment";
import { criticalDecisionSchema } from "./assessment";
import { ECOMMERCE_SCENARIO } from "./scenario";

export const decisionDetailKeys = ["rationale", "first_action", "guardrail"] as const;
export type DecisionDetailKey = (typeof decisionDetailKeys)[number];

export type GuidedDecisionSelections = {
  choice: string;
  rationale: string;
  first_action: string;
  guardrail: string;
};

export function buildGuidedCriticalDecision(
  selections: GuidedDecisionSelections,
): CriticalDecision | null {
  const detailResponses = Object.fromEntries(
    decisionDetailKeys.map((key) => [
      key,
      ECOMMERCE_SCENARIO.criticalDecision.details[key].choices.find(
        (choice) => choice.id === selections[key],
      )?.response ?? "",
    ]),
  );
  const parsed = criticalDecisionSchema.safeParse({
    choice: selections.choice,
    ...detailResponses,
  });
  return parsed.success ? parsed.data : null;
}
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the Step 2 command. Expected: all focused tests pass.

- [ ] **Step 6: Commit the domain slice**

```powershell
git add src/lib/domain/scenario.ts src/lib/domain/scenario.test.ts src/lib/domain/critical-decision.ts src/lib/domain/critical-decision.test.ts src/lib/domain/evidence.test.ts
git commit -m "Add guided critical decision options"
```

---

### Task 2: Accessible processing overlay

**Files:**
- Create: `src/components/processing-overlay.tsx`
- Create: `src/components/processing-overlay.test.tsx`

**Interfaces:**
- Produces: `ProcessingOverlay({ title, description }: ProcessingOverlayProps)`.

- [ ] **Step 1: Write the failing component test**

Create `processing-overlay.test.tsx`:

```tsx
// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProcessingOverlay } from "./processing-overlay";

describe("ProcessingOverlay", () => {
  it("announces a visible processing state", () => {
    render(
      <ProcessingOverlay
        title="GPT-5.6 is evaluating your evidence"
        description="This can take up to a minute."
      />,
    );
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status).toHaveTextContent("GPT-5.6 is evaluating your evidence");
    expect(status).toHaveTextContent("This can take up to a minute.");
    expect(status).toHaveTextContent("Keep this page open. Your selections are safe.");
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
npm.cmd test -- src/components/processing-overlay.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the component**

```tsx
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type ProcessingOverlayProps = {
  title: string;
  description: string;
};

export function ProcessingOverlay({ title, description }: ProcessingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 px-5 backdrop-blur-sm">
      <Card className="w-full max-w-md border-primary/30 shadow-2xl">
        <CardContent
          aria-atomic="true"
          aria-live="polite"
          className="p-8 text-center"
          role="status"
        >
          <Loader2 className="mx-auto size-9 animate-spin text-primary motion-reduce:animate-none" />
          <h2 className="mt-5 text-2xl tracking-tight">{title}</h2>
          <p className="mt-3 leading-6 text-muted-foreground">{description}</p>
          <p className="mt-5 text-xs text-muted-foreground">Keep this page open. Your selections are safe.</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Verify GREEN and commit**

Run the Step 2 command, then:

```powershell
git add src/components/processing-overlay.tsx src/components/processing-overlay.test.tsx
git commit -m "Add assessment processing overlay"
```

---

### Task 3: Live-only assessment entry

**Files:**
- Create: `src/components/assessment-start-panel.tsx`
- Create: `src/components/assessment-start-panel.test.tsx`
- Modify: `src/app/assessment/new/page.tsx`
- Modify: `src/components/start-assessment-button.tsx`
- Modify: `src/app/assessment/[sessionId]/challenge/page.tsx`

**Interfaces:**
- Produces: `AssessmentStartPanel({ liveConfigured }: { liveConfigured: boolean })`.
- Changes: `StartAssessmentButton` accepts no run-mode prop and always posts `{ run_mode: "live" }`.

- [ ] **Step 1: Write failing live-only tests**

Create `assessment-start-panel.test.tsx`:

```tsx
// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssessmentStartPanel } from "./assessment-start-panel";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  vi.restoreAllMocks();
  push.mockReset();
});

describe("AssessmentStartPanel", () => {
  it("offers one live assessment and no fixture rehearsal", () => {
    render(<AssessmentStartPanel liveConfigured />);
    expect(screen.getByRole("heading", { name: "Live AI Assessment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start live assessment" })).toBeInTheDocument();
    expect(screen.queryByText(/fixture rehearsal/i)).not.toBeInTheDocument();
  });

  it("shows configuration guidance instead of a start action", () => {
    render(<AssessmentStartPanel liveConfigured={false} />);
    expect(screen.getByText("OpenAI is not configured yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start live assessment" })).not.toBeInTheDocument();
  });

  it("creates only a live session", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ data: { id: "session-1" }, error: null, next_path: "/assessment/session-1/challenge" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AssessmentStartPanel liveConfigured />);
    await userEvent.click(screen.getByRole("button", { name: "Start live assessment" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ run_mode: "live" });
    expect(push).toHaveBeenCalledWith("/assessment/session-1/challenge");
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
npm.cmd test -- src/components/assessment-start-panel.test.tsx
```

Expected: FAIL because the panel does not exist and the current button requires `runMode`.

- [ ] **Step 3: Implement the live panel and simplify the start button**

Create `assessment-start-panel.tsx`:

```tsx
import { CheckCircle2 } from "lucide-react";
import { StartAssessmentButton } from "@/components/start-assessment-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AssessmentStartPanel({ liveConfigured }: { liveConfigured: boolean }) {
  return (
    <Card className="mt-10 border-primary/25">
      <CardHeader><CardTitle>Live AI Assessment</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Complete a real adaptive assessment powered by GPT-5.6. Your report remains private and saved to your dashboard.
        </p>
        <ul className="grid gap-2 text-sm sm:grid-cols-3">
          {["Adaptive pressure test", "Verified evidence", "Saved private report"].map((item) => (
            <li className="flex gap-2" key={item}><CheckCircle2 className="size-4 text-primary" />{item}</li>
          ))}
        </ul>
        {liveConfigured ? <StartAssessmentButton /> : (
          <Alert>
            <AlertTitle>OpenAI is not configured yet</AlertTitle>
            <AlertDescription>Add OPENAI_API_KEY to this environment and redeploy before starting a live assessment.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

Update `StartAssessmentButton` so `start()` posts this exact body and catches network failures:

```ts
body: JSON.stringify({ run_mode: "live" })
```

The catch branch sets `The assessment could not start. Check your connection and try again.`, clears pending, and the error paragraph uses `aria-live="polite"`.

In `page.tsx`, remove `areFixturesEnabled`, the fixture card, and the two-column grid. Render `<AssessmentStartPanel liveConfigured={isLiveAIConfigured()} />`.

In the challenge fallback, replace the fixture CTA with a link to `/demo` labeled `Open the public demo` and a dashboard link.

- [ ] **Step 4: Verify GREEN and commit**

Run the Step 2 command, then:

```powershell
git add src/components/assessment-start-panel.tsx src/components/assessment-start-panel.test.tsx src/components/start-assessment-button.tsx src/app/assessment/new/page.tsx src/app/assessment/[sessionId]/challenge/page.tsx
git commit -m "Make authenticated assessments live only"
```

---

### Task 4: Strategy and revision processing phases

**Files:**
- Modify: `src/components/canvas-form.tsx`
- Create: `src/components/canvas-form.test.tsx`
- Modify: `src/components/revision-form.tsx`
- Create: `src/components/revision-form.test.tsx`

**Interfaces:**
- Consumes: `ProcessingOverlay`.
- Produces local phase unions: canvas `idle | saving | generating | navigating`; revision `idle | saving | navigating`.

- [ ] **Step 1: Write failing CanvasForm processing tests**

Create `canvas-form.test.tsx`:

```tsx
// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CanvasForm } from "./canvas-form";
import { canvasKeys, type Constraint } from "@/lib/domain/assessment";
import { ECOMMERCE_CANVAS_DECISIONS } from "@/lib/domain/scenario";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const initial = Object.fromEntries(
  canvasKeys.map((key) => [key, ECOMMERCE_CANVAS_DECISIONS[key].choices[0].response]),
) as Parameters<typeof CanvasForm>[0]["initial"];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

const response = (value: unknown) => ({ json: async () => value }) as Response;

afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
  refresh.mockReset();
});

describe("CanvasForm processing", () => {
  it("shows saving, generation, and navigation phases", async () => {
    const saved = deferred<Response>();
    const generated = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn().mockReturnValueOnce(saved.promise).mockReturnValueOnce(generated.promise));
    render(<CanvasForm sessionId="session-1" initial={initial} />);
    await userEvent.click(screen.getByRole("button", { name: "Open Success metrics" }));
    const submit = screen.getByRole("button", { name: "Submit strategy" });
    const form = submit.closest("form");
    await userEvent.click(submit);
    expect(form).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Saving your strategy");
    saved.resolve(response({ data: {}, error: null }));
    await screen.findByText("GPT-5.6 is creating your pressure test");
    generated.resolve(response({ data: {}, error: null, next_path: "/assessment/session-1/constraint" }));
    await screen.findByText("Pressure test ready");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/assessment/session-1/constraint"));
  });

  it("refreshes into the retry state when constraint generation fails", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response({ data: {}, error: null }))
      .mockResolvedValueOnce(response({ data: null, error: { message: "Constraint failed" } })));
    render(<CanvasForm sessionId="session-1" initial={initial} />);
    await userEvent.click(screen.getByRole("button", { name: "Open Success metrics" }));
    await userEvent.click(screen.getByRole("button", { name: "Submit strategy" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify CanvasForm RED**

```powershell
npm.cmd test -- src/components/canvas-form.test.tsx
```

Expected: FAIL because the overlay and phased copy are absent.

- [ ] **Step 3: Implement CanvasForm phases**

Replace `pending` with `phase`, derive `busy = phase !== "idle"`, wrap both requests and JSON parsing in `try/catch`, and render:

```ts
type CanvasPhase = "idle" | "saving" | "generating" | "navigating";
const [phase, setPhase] = useState<CanvasPhase>("idle");
const busy = phase !== "idle";

async function submit(formData: FormData) {
  setPhase("saving");
  setError("");
  let initialSaved = false;
  try {
    const canvas = Object.fromEntries(canvasKeys.map((key) => [key, formData.get(key)]));
    const initialResponse = await fetch(`/api/sessions/${sessionId}/initial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(canvas),
    });
    const initialResult = (await initialResponse.json()) as ApiResult<unknown>;
    if (initialResult.error) throw new Error(initialResult.error.message);
    initialSaved = true;
    setPhase("generating");
    const constraintResponse = await fetch(`/api/sessions/${sessionId}/constraint`, { method: "POST" });
    const constraintResult = (await constraintResponse.json()) as ApiResult<unknown>;
    if (constraintResult.error) throw new Error(constraintResult.error.message);
    setPhase("navigating");
    router.push(constraintResult.next_path || `/assessment/${sessionId}/constraint`);
  } catch (caught) {
    setError(caught instanceof Error ? caught.message : "The strategy could not be processed. Check your connection and try again.");
    setPhase("idle");
    if (initialSaved) router.refresh();
  }
}
```

Render:

```tsx
{phase === "saving" && (
  <ProcessingOverlay
    title="Saving your strategy"
    description="ProofSkill is securely saving your eight decisions before the pressure test begins."
  />
)}
{phase === "generating" && (
  <ProcessingOverlay
    title="GPT-5.6 is creating your pressure test"
    description="The model is reviewing the full strategy and generating a material constraint. This can take several seconds."
  />
)}
{phase === "navigating" && (
  <ProcessingOverlay
    title="Pressure test ready"
    description="Opening the adaptive constraint and the decisions it affects."
  />
)}
```

Set `aria-busy={busy}` on the form and wrap mutable content in `<fieldset disabled={busy}>`. After an initial save followed by any constraint failure, call `router.refresh()` so the server renders the retry state.

- [ ] **Step 4: Verify CanvasForm GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Write failing RevisionForm processing tests**

Create `revision-form.test.tsx`:

```tsx
// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RevisionForm } from "./revision-form";
import { canvasKeys } from "@/lib/domain/assessment";
import { ECOMMERCE_CANVAS_DECISIONS } from "@/lib/domain/scenario";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const initial = Object.fromEntries(
  canvasKeys.map((key) => [key, ECOMMERCE_CANVAS_DECISIONS[key].choices[0].response]),
) as Parameters<typeof RevisionForm>[0]["initial"];
const constraint: Constraint = {
  title: "Paid acquisition is frozen",
  summary: "Finance has frozen paid acquisition while costs and contribution risk are reviewed.",
  affected_fields: ["problem", "solution"],
  business_impact: "The plan must recover qualified demand without buying additional traffic.",
  time_pressure: "Ship one measured response in fourteen days.",
};

afterEach(() => { vi.unstubAllGlobals(); push.mockReset(); });

describe("RevisionForm processing", () => {
  it("locks the revision with visible processing", async () => {
    let resolve!: (value: Response) => void;
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>((done) => { resolve = done; })));
    const user = userEvent.setup();
    render(<RevisionForm sessionId="session-1" initial={initial} constraint={constraint} />);
    for (const label of [
      /Narrow the behavior/i,
      /Reduce to one intervention/i,
      /Keep the core hypothesis/i,
      /Remove broad exposure/i,
      /Use balanced thresholds/i,
    ]) {
      await user.click(screen.getByRole("radio", { name: label }));
      const next = screen.queryByRole("button", { name: /Continue/i });
      if (next) await user.click(next);
    }
    const submit = screen.getByRole("button", { name: "Lock revision" });
    const form = submit.closest("form");
    await user.click(submit);
    expect(form).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Locking your revision");
    resolve({ json: async () => ({ data: {}, error: null, next_path: "/assessment/session-1/decision" }) } as Response);
    await screen.findByText("Revision locked");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/assessment/session-1/decision"));
  });
});
```

- [ ] **Step 6: Implement RevisionForm phases and verify GREEN**

Replace `pending` with the revision phase union. Use this request structure:

```ts
type RevisionPhase = "idle" | "saving" | "navigating";
const [phase, setPhase] = useState<RevisionPhase>("idle");
const busy = phase !== "idle";

async function submit() {
  setPhase("saving");
  setError("");
  try {
    const response = await fetch(`/api/sessions/${sessionId}/revision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revised_canvas, revision_strategy }),
    });
    const result = (await response.json()) as ApiResult<unknown>;
    if (result.error) throw new Error(result.error.message);
    setPhase("navigating");
    router.push(result.next_path || `/assessment/${sessionId}/decision`);
  } catch (caught) {
    setError(caught instanceof Error ? caught.message : "The revision could not be saved. Check your connection and try again.");
    setPhase("idle");
  }
}
```

Keep the existing payload composition immediately before the `try` block. Render `ProcessingOverlay` with:

```ts
const revisionProcessing = {
  saving: {
    title: "Locking your revision",
    description: "ProofSkill is saving every adaptation, preserved choice, removal, and measurement rule.",
  },
  navigating: {
    title: "Revision locked",
    description: "Opening the final critical decision.",
  },
} as const;
```

Run:

```powershell
npm.cmd test -- src/components/revision-form.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit both form slices**

```powershell
git add src/components/canvas-form.tsx src/components/canvas-form.test.tsx src/components/revision-form.tsx src/components/revision-form.test.tsx
git commit -m "Show assessment processing phases"
```

---

### Task 5: Guided final decision and evaluation phases

**Files:**
- Modify: `src/components/decision-form.tsx`
- Create: `src/components/decision-form.test.tsx`
- Modify: `src/components/evaluate-retry-button.tsx`

**Interfaces:**
- Consumes: `buildGuidedCriticalDecision`, `decisionDetailKeys`, `ProcessingOverlay`.
- Produces local phase union `idle | saving | evaluating | navigating`.

- [ ] **Step 1: Write failing interaction tests**

Create `decision-form.test.tsx`:

```tsx
// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DecisionForm } from "./decision-form";
import { ECOMMERCE_SCENARIO } from "@/lib/domain/scenario";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
const response = (value: unknown) => ({ json: async () => value }) as Response;

afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
  refresh.mockReset();
});

describe("DecisionForm", () => {
  it("submits four guided prose choices and announces evaluation phases", async () => {
    const saved = deferred<Response>();
    const evaluated = deferred<Response>();
    const fetchMock = vi.fn().mockReturnValueOnce(saved.promise).mockReturnValueOnce(evaluated.promise);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<DecisionForm sessionId="session-1" />);

    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.getAllByRole("radiogroup")).toHaveLength(4);
    const submit = screen.getByRole("button", { name: "Submit for evaluation" });
    expect(submit).toBeDisabled();

    for (const label of [
      /Protect margin/i,
      /Protect economic quality/i,
      /Define the cohort/i,
      /Margin floor fails/i,
    ]) {
      await user.click(screen.getByRole("radio", { name: label }));
    }
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(screen.getByRole("status")).toHaveTextContent("Saving your critical decision");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(Object.keys(body).sort()).toEqual(["choice", "first_action", "guardrail", "rationale"]);
    expect(body).toEqual({
      choice: "protect_margin",
      rationale: ECOMMERCE_SCENARIO.criticalDecision.details.rationale.choices[0].response,
      first_action: ECOMMERCE_SCENARIO.criticalDecision.details.first_action.choices[0].response,
      guardrail: ECOMMERCE_SCENARIO.criticalDecision.details.guardrail.choices[0].response,
    });

    saved.resolve(response({ data: {}, error: null }));
    await screen.findByText("GPT-5.6 is evaluating your evidence");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    evaluated.resolve(response({ data: {}, error: null, next_path: "/results/session-1" }));
    await screen.findByText("Report ready");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/results/session-1"));
  });

  it("restores an actionable state when saving fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({
      data: null,
      error: { message: "Could not save the decision." },
    })));
    const user = userEvent.setup();
    render(<DecisionForm sessionId="session-1" />);
    for (const label of [/Protect margin/i, /Protect economic quality/i, /Define the cohort/i, /Margin floor fails/i]) {
      await user.click(screen.getByRole("radio", { name: label }));
    }
    await user.click(screen.getByRole("button", { name: "Submit for evaluation" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save the decision.");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
npm.cmd test -- src/components/decision-form.test.tsx
```

Expected: FAIL because three textareas remain and phased overlays are absent.

- [ ] **Step 3: Replace textareas with guided cards**

Use controlled `GuidedDecisionSelections` state. Render the existing strategic-path group plus one fieldset/radio group for each detail in `ECOMMERCE_SCENARIO.criticalDecision.details`. Each card uses `cursor-pointer`, a visible selected border/ring, and the existing Radix radio primitive. Remove the `Textarea` import entirely.

Change the form to a normal `onSubmit` handler with `event.preventDefault()`. Call `buildGuidedCriticalDecision`; do not submit if it returns `null`.

Use this state and card-group structure:

```tsx
type DecisionPhase = "idle" | "saving" | "evaluating" | "navigating";
const [phase, setPhase] = useState<DecisionPhase>("idle");
const [selections, setSelections] = useState<GuidedDecisionSelections>({
  choice: "",
  rationale: "",
  first_action: "",
  guardrail: "",
});
const busy = phase !== "idle";
const complete = Object.values(selections).every(Boolean);

{decisionDetailKeys.map((key) => {
  const detail = ECOMMERCE_SCENARIO.criticalDecision.details[key];
  return (
    <fieldset className="space-y-4" disabled={busy} key={key}>
      <legend className="text-xl font-semibold">{detail.prompt}</legend>
      <RadioGroup
        aria-label={detail.prompt}
        className="grid gap-4 md:grid-cols-3"
        onValueChange={(value) => setSelections((current) => ({ ...current, [key]: value }))}
        value={selections[key]}
      >
        {detail.choices.map((option) => (
          <Label
            className="min-h-44 cursor-pointer flex-col items-stretch rounded-xl border bg-card p-5 transition-all hover:border-primary/45 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-primary/35"
            htmlFor={`${key}-${option.id}`}
            key={option.id}
          >
            <span className="flex items-center justify-between gap-3">
              <Badge variant="outline">{option.tradeoff}</Badge>
              <RadioGroupItem id={`${key}-${option.id}`} value={option.id} />
            </span>
            <span className="mt-4 text-base font-semibold text-foreground">{option.title}</span>
            <span className="mt-2 text-sm font-normal leading-6 text-muted-foreground">{option.response}</span>
          </Label>
        ))}
      </RadioGroup>
    </fieldset>
  );
})}
```

- [ ] **Step 4: Add evaluation processing and recovery**

Use these exact messages:

```ts
const evaluationProcessing = {
  saving: {
    title: "Saving your critical decision",
    description: "ProofSkill is preserving the trade-off, first action, and stop rule before evaluation.",
  },
  evaluating: {
    title: "GPT-5.6 is evaluating your evidence",
    description: "The model is reviewing the complete decision trail. This can take up to a minute.",
  },
  navigating: {
    title: "Report ready",
    description: "Opening the verified competency report and evidence trail.",
  },
} as const;
```

Wrap all requests and JSON parsing in `try/catch`. On an evaluation API error, reset the phase, show the message, and call `router.refresh()`. On an ambiguous network error, show `The evaluation connection was interrupted. Refreshing the saved session state.` and refresh.

Use this submission sequence:

```tsx
async function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const body = buildGuidedCriticalDecision(selections);
  if (!body) {
    setError("Choose one option in every decision group.");
    return;
  }
  setPhase("saving");
  setError("");
  let decisionSaved = false;
  try {
    const decisionResponse = await fetch(`/api/sessions/${sessionId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const decision = (await decisionResponse.json()) as ApiResult<unknown>;
    if (decision.error) {
      setError(decision.error.message);
      setPhase("idle");
      return;
    }
    decisionSaved = true;
    setPhase("evaluating");
    const evaluationResponse = await fetch(`/api/sessions/${sessionId}/evaluate`, { method: "POST" });
    const evaluation = (await evaluationResponse.json()) as ApiResult<unknown>;
    if (evaluation.error) {
      setError(evaluation.error.message);
      setPhase("idle");
      router.refresh();
      return;
    }
    setPhase("navigating");
    router.push(evaluation.next_path || `/results/${sessionId}`);
  } catch (caught) {
    setError(
      decisionSaved
        ? "The evaluation connection was interrupted. Refreshing the saved session state."
        : caught instanceof Error
          ? caught.message
          : "The decision could not be saved. Check your connection and try again.",
    );
    setPhase("idle");
    if (decisionSaved) router.refresh();
  }
}
```

Update `EvaluateRetryButton` to use the same evaluation overlay while pending and add network error handling.

- [ ] **Step 5: Verify GREEN and commit**

Run the Step 2 command, then:

```powershell
git add src/components/decision-form.tsx src/components/decision-form.test.tsx src/components/evaluate-retry-button.tsx
git commit -m "Guide the final decision and evaluation"
```

---

### Task 6: Full verification, visual QA, and handoff

**Files:**
- Modify: `README.md`
- Modify: `BUILD_WEEK_LOG.md`
- Modify: `docs/PRODUCTION_CHECKLIST.md`
- Modify: `docs/VIDEO_SCRIPT.md`
- Test: all changed unit/component tests and `tests/e2e/public-demo.spec.ts`

**Interfaces:**
- Consumes all earlier tasks.
- Produces a verified Preview artifact ready for Production promotion.

- [ ] **Step 1: Run the focused test set**

```powershell
npm.cmd test -- src/lib/domain/scenario.test.ts src/lib/domain/critical-decision.test.ts src/lib/domain/evidence.test.ts src/components/processing-overlay.test.tsx src/components/assessment-start-panel.test.tsx src/components/canvas-form.test.tsx src/components/revision-form.test.tsx src/components/decision-form.test.tsx
```

Expected: all focused test files pass with zero failures.

- [ ] **Step 2: Run the complete repository gate**

```powershell
npm.cmd run check
npm.cmd run test:e2e
```

Expected: ESLint clean, TypeScript clean, all Vitest tests pass, Next.js production build succeeds, and Playwright public-demo E2E passes.

- [ ] **Step 3: Run React quality review**

Check all changed TSX files for semantic buttons/fieldsets, hook ordering, complete dependencies, stable keys, no unnecessary memoization, pointer cursors, accessible group names, and reduced-motion animation.

- [ ] **Step 4: Update submission documentation**

Record the live-only flow, new processing overlays, guided final decision, test count, and manual Preview requirements in the four listed documents. Keep credentials and API keys out of Git.

- [ ] **Step 5: Commit verified documentation**

```powershell
git add README.md BUILD_WEEK_LOG.md docs/PRODUCTION_CHECKLIST.md docs/VIDEO_SCRIPT.md
git commit -m "Document final assessment experience"
```

- [ ] **Step 6: Deploy and verify a Vercel Preview**

Deploy the tested branch through Git integration or `vercel deploy`. In the Preview, verify:

1. `/assessment/new` exposes only Live AI Assessment.
2. Submit strategy shows saving and GPT-5.6 generation phases.
3. Lock revision shows its processing overlay.
4. The final decision has four card groups and no writing fields.
5. Submit for evaluation shows processing until the report opens.
6. Refreshing the dashboard reopens the completed report.
7. `/demo` remains public and visibly precomputed.

- [ ] **Step 7: Promote the verified artifact and smoke-test Production**

Promote the exact Preview artifact. Repeat the seven checks from Step 6 in an incognito browser using the judge account. Review Vercel runtime logs for new errors before recording the final video.
