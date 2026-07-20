// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StartAssessmentButton } from "./start-assessment-button";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const response = (value: unknown) => ({ json: async () => value }) as Response;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  push.mockReset();
});

describe("StartAssessmentButton", () => {
  it.each([
    ["response loss", () => Promise.reject(new Error("Failed to fetch"))],
    ["malformed JSON", () => Promise.resolve({ json: async () => { throw new Error("Unexpected token <"); } } as unknown as Response)],
  ])("blocks replay and offers dashboard reconciliation after %s", async (_label, request) => {
    const fetchMock = vi.fn().mockImplementationOnce(request);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<StartAssessmentButton />);
    const start = screen.getByRole("button", { name: "Start live assessment" });

    await user.click(start);

    expect(await screen.findByText(
      "ProofSkill could not confirm whether the assessment was created. Check your dashboard before starting another assessment.",
    )).toBeInTheDocument();
    expect(screen.queryByText(/Failed to fetch|Unexpected token/)).not.toBeInTheDocument();
    expect(start).toBeDisabled();
    expect(screen.getByRole("link", { name: "Check dashboard" })).toHaveAttribute("href", "/dashboard");
    await user.click(start);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("allows retry after a confirmed API error", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ data: null, error: { code: "CREATE_FAILED", message: "Try again later.", retryable: true } }))
      .mockResolvedValueOnce(response({ data: { id: "session-1" }, error: null, next_path: "/assessment/session-1" }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<StartAssessmentButton />);
    const start = screen.getByRole("button", { name: "Start live assessment" });

    await user.click(start);
    expect(await screen.findByText("Try again later.")).toBeInTheDocument();
    expect(start).toBeEnabled();

    await user.click(start);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/assessment/session-1"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("marks its pending loader as reduced-motion safe", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    const user = userEvent.setup();
    render(<StartAssessmentButton />);
    const start = screen.getByRole("button", { name: "Start live assessment" });

    await user.click(start);

    expect(start.querySelector("svg")).toHaveClass("motion-reduce:animate-none");
  });
});
