// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssessmentStartPanel } from "./assessment-start-panel";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  cleanup();
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

  it("keeps the live start action available after a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));
    render(<AssessmentStartPanel liveConfigured />);

    await userEvent.click(screen.getByRole("button", { name: "Start live assessment" }));

    expect(await screen.findByText("The assessment could not start. Check your connection and try again.")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("button", { name: "Start live assessment" })).toBeEnabled();
  });
});
