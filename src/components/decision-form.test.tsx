// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DecisionForm } from "./decision-form";
import { ECOMMERCE_SCENARIO } from "@/lib/domain/scenario";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const response = (value: unknown) => ({ json: async () => value }) as Response;

const guidedLabels = [
  /Protect margin/i,
  /Protect economic quality/i,
  /Define the cohort/i,
  /Margin floor fails/i,
];

async function completeDecision() {
  const user = userEvent.setup();
  for (const label of guidedLabels) {
    await user.click(screen.getByRole("radio", { name: label }));
  }
  return user;
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  push.mockReset();
  refresh.mockReset();
});

describe("DecisionForm", () => {
  it("submits four guided prose choices and announces evaluation phases", async () => {
    const saved = deferred<Response>();
    const evaluated = deferred<Response>();
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(saved.promise)
      .mockReturnValueOnce(evaluated.promise);
    vi.stubGlobal("fetch", fetchMock);
    render(<DecisionForm sessionId="session-1" />);

    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.getAllByRole("radiogroup")).toHaveLength(4);
    expect(
      screen.getByRole("radiogroup", {
        name: ECOMMERCE_SCENARIO.criticalDecision.prompt,
      }),
    ).toBeInTheDocument();
    for (const key of ["rationale", "first_action", "guardrail"] as const) {
      expect(
        screen.getByRole("radiogroup", {
          name: ECOMMERCE_SCENARIO.criticalDecision.details[key].prompt,
        }),
      ).toBeInTheDocument();
    }

    const submit = screen.getByRole("button", { name: "Submit for evaluation" });
    expect(submit).toBeDisabled();
    const user = await completeDecision();
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Saving your critical decision",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(Object.keys(body).sort()).toEqual([
      "choice",
      "first_action",
      "guardrail",
      "rationale",
    ]);
    expect(body).toEqual({
      choice: "protect_margin",
      rationale:
        ECOMMERCE_SCENARIO.criticalDecision.details.rationale.choices[0].response,
      first_action:
        ECOMMERCE_SCENARIO.criticalDecision.details.first_action.choices[0].response,
      guardrail:
        ECOMMERCE_SCENARIO.criticalDecision.details.guardrail.choices[0].response,
    });
    expect(JSON.stringify(body)).not.toContain("economic_quality");
    expect(JSON.stringify(body)).not.toContain("define_cohort");
    expect(JSON.stringify(body)).not.toContain("margin_floor");

    saved.resolve(response({ data: {}, error: null }));
    await screen.findByText("GPT-5.6 is evaluating your evidence");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    evaluated.resolve(
      response({ data: {}, error: null, next_path: "/results/session-1" }),
    );
    await screen.findByText("Report ready");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/results/session-1"));
  });

  it("restores an actionable state when saving fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          data: null,
          error: { message: "Could not save the decision." },
        }),
      ),
    );
    render(<DecisionForm sessionId="session-1" />);
    const user = await completeDecision();

    await user.click(screen.getByRole("button", { name: "Submit for evaluation" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save the decision.",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit for evaluation" })).toBeEnabled();
    for (const label of guidedLabels) {
      expect(screen.getByRole("radio", { name: label })).toBeChecked();
    }
  });

  it.each([
    ["response loss", () => Promise.reject(new Error("Failed to fetch"))],
    ["malformed JSON", () => Promise.resolve({ json: async () => { throw new Error("Unexpected token <"); } } as unknown as Response)],
  ])("reconciles decision %s while preserving all selections", async (_label, request) => {
    vi.stubGlobal("fetch", vi.fn().mockImplementationOnce(request));
    render(<DecisionForm sessionId="session-1" />);
    const user = await completeDecision();
    const submit = screen.getByRole("button", { name: "Submit for evaluation" });

    await user.click(submit);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ProofSkill could not confirm whether your critical decision was saved. Refreshing the session state so you can continue safely.",
    );
    expect(screen.queryByText(/Failed to fetch|Unexpected token/)).not.toBeInTheDocument();
    expect(submit.closest("form")).toHaveAttribute("aria-busy", "false");
    expect(submit).toBeEnabled();
    for (const label of guidedLabels) {
      expect(screen.getByRole("radio", { name: label })).toBeChecked();
    }
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("refreshes when the decision API reports a state conflict", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response({
      data: null,
      error: { code: "STATE_CONFLICT", message: "Decision already submitted", retryable: false },
    })));
    render(<DecisionForm sessionId="session-1" />);
    const user = await completeDecision();
    const submit = screen.getByRole("button", { name: "Submit for evaluation" });

    await user.click(submit);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your session state changed before ProofSkill could confirm the critical decision save. Refreshing so you can continue safely.",
    );
    expect(submit.closest("form")).toHaveAttribute("aria-busy", "false");
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("refreshes the saved session when the evaluation API returns an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(response({ data: {}, error: null }))
        .mockResolvedValueOnce(
          response({ data: null, error: { message: "Evaluation could not finish." } }),
        ),
    );
    render(<DecisionForm sessionId="session-1" />);
    const user = await completeDecision();

    await user.click(screen.getByRole("button", { name: "Submit for evaluation" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Evaluation could not finish.",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Submit for evaluation" })).toBeEnabled();
  });

  it("reports an interrupted evaluation connection and refreshes saved state", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(response({ data: {}, error: null }))
        .mockRejectedValueOnce(new Error("socket closed")),
    );
    render(<DecisionForm sessionId="session-1" />);
    const user = await completeDecision();

    await user.click(screen.getByRole("button", { name: "Submit for evaluation" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The evaluation connection was interrupted. Refreshing the saved session state.",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("locks every mutable control while saving", async () => {
    const saved = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(saved.promise));
    render(<DecisionForm sessionId="session-1" />);
    const user = await completeDecision();
    const submit = screen.getByRole("button", { name: "Submit for evaluation" });
    const form = submit.closest("form");

    await user.click(submit);

    expect(form).toHaveAttribute("aria-busy", "true");
    expect(submit).toBeDisabled();
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
  });
});
