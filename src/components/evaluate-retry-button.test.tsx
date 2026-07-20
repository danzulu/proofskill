// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EvaluateRetryButton } from "./evaluate-retry-button";

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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  push.mockReset();
  refresh.mockReset();
});

describe("EvaluateRetryButton", () => {
  it("announces evaluation and disables retry while the request is pending", async () => {
    const evaluated = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(evaluated.promise));
    const user = userEvent.setup();
    render(<EvaluateRetryButton sessionId="session-1" />);
    const retry = screen.getByRole("button", { name: "Resume evaluation" });

    await user.click(retry);

    expect(screen.getByRole("status")).toHaveTextContent(
      "GPT-5.6 is evaluating your evidence",
    );
    expect(retry).toBeDisabled();
  });

  it("navigates to the returned report after evaluation succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({ data: {}, error: null, next_path: "/results/session-1" }),
      ),
    );
    const user = userEvent.setup();
    render(<EvaluateRetryButton sessionId="session-1" />);

    await user.click(screen.getByRole("button", { name: "Resume evaluation" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/results/session-1"));
  });

  it("shows an API error and re-enables retry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({ data: null, error: { message: "Evaluation is still unavailable." } }),
      ),
    );
    const user = userEvent.setup();
    render(<EvaluateRetryButton sessionId="session-1" />);

    await user.click(screen.getByRole("button", { name: "Resume evaluation" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Evaluation is still unavailable.",
    );
    expect(screen.getByRole("button", { name: "Resume evaluation" })).toBeEnabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("recovers from a network failure with an actionable message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const user = userEvent.setup();
    render(<EvaluateRetryButton sessionId="session-1" />);

    await user.click(screen.getByRole("button", { name: "Resume evaluation" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The evaluation connection was interrupted. Check your connection and try again.",
    );
    expect(screen.getByRole("button", { name: "Resume evaluation" })).toBeEnabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalledOnce();
  });
});
