// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RevisionForm } from "./revision-form";
import { canvasKeys, type Constraint } from "@/lib/domain/assessment";
import { ECOMMERCE_CANVAS_DECISIONS } from "@/lib/domain/scenario";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const initial = Object.fromEntries(
  canvasKeys.map((key) => [key, ECOMMERCE_CANVAS_DECISIONS[key].choices[0].response]),
) as Parameters<typeof RevisionForm>[0]["initial"];

const constraint: Constraint = {
  title: "Paid acquisition is frozen",
  summary:
    "Finance has frozen paid acquisition while costs and contribution risk are reviewed.",
  affected_fields: ["problem", "solution"],
  business_impact:
    "The plan must recover qualified demand without buying additional traffic.",
  time_pressure: "Ship one measured response in fourteen days.",
};

const response = (value: unknown) => ({ json: async () => value }) as Response;

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

async function completeRevision() {
  const user = userEvent.setup();
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
  return user;
}

describe("RevisionForm processing", () => {
  it("shows saving and navigation phases while controls are locked", async () => {
    let resolve!: (value: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise<Response>((done) => {
          resolve = done;
        }),
      ),
    );
    render(<RevisionForm sessionId="session-1" initial={initial} constraint={constraint} />);
    const user = await completeRevision();
    const submit = screen.getByRole("button", { name: "Lock revision" });
    const form = submit.closest("form");

    await user.click(submit);

    expect(await screen.findByRole("status")).toHaveTextContent("Locking your revision");
    expect(form).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Open Problem" })).toBeDisabled();

    resolve(
      response({
        data: {},
        error: null,
        next_path: "/assessment/session-1/decision",
      }),
    );
    await screen.findByText("Revision locked");
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/assessment/session-1/decision"),
    );
  });

  it("reconciles a lost revision response and preserves selected choices", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("Revision request failed")));
    render(<RevisionForm sessionId="session-1" initial={initial} constraint={constraint} />);
    const user = await completeRevision();
    const submit = screen.getByRole("button", { name: "Lock revision" });
    const form = submit.closest("form");

    await user.click(submit);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ProofSkill could not confirm whether your revision was saved. Refreshing the session state so you can continue safely.",
    );
    expect(form).toHaveAttribute("aria-busy", "false");
    expect(screen.getByRole("button", { name: "Lock revision" })).toBeEnabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Use balanced thresholds/i })).toBeChecked();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("recovers when the response JSON cannot be parsed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        json: async () => {
          throw new Error("Invalid revision response");
        },
      } as unknown as Response),
    );
    render(<RevisionForm sessionId="session-1" initial={initial} constraint={constraint} />);
    const user = await completeRevision();
    const submit = screen.getByRole("button", { name: "Lock revision" });
    const form = submit.closest("form");

    await user.click(submit);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ProofSkill could not confirm whether your revision was saved. Refreshing the session state so you can continue safely.",
    );
    expect(screen.queryByText("Invalid revision response")).not.toBeInTheDocument();
    expect(form).toHaveAttribute("aria-busy", "false");
    expect(screen.getByRole("button", { name: "Lock revision" })).toBeEnabled();
    expect(screen.getByRole("radio", { name: /Use balanced thresholds/i })).toBeChecked();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("refreshes when the revision API reports a state conflict", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response({
      data: null,
      error: { code: "STATE_CONFLICT", message: "Revision already submitted", retryable: false },
    })));
    render(<RevisionForm sessionId="session-1" initial={initial} constraint={constraint} />);
    const user = await completeRevision();
    const submit = screen.getByRole("button", { name: "Lock revision" });

    await user.click(submit);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your session state changed before ProofSkill could confirm the revision save. Refreshing so you can continue safely.",
    );
    expect(submit.closest("form")).toHaveAttribute("aria-busy", "false");
    expect(refresh).toHaveBeenCalledOnce();
  });
});
