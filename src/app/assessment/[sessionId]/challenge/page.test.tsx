// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import ChallengePage from "./page";
import { isLiveAIConfigured } from "@/lib/ai/availability";
import { requireUser } from "@/lib/auth";
import { getSessionForPage } from "@/lib/page-data";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/components/assessment-shell", () => ({
  AssessmentShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/canvas-form", () => ({
  CanvasForm: () => <div data-testid="canvas-form" />,
}));
vi.mock("@/components/generate-constraint-button", () => ({
  GenerateConstraintButton: () => <div data-testid="generate-constraint-button" />,
}));
vi.mock("@/lib/ai/availability", () => ({ isLiveAIConfigured: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/page-data", () => ({ getSessionForPage: vi.fn() }));

const authenticatedUser = {
  id: "user-1",
  aud: "authenticated",
  role: "authenticated",
  email: "user@example.com",
  created_at: "2026-07-20T00:00:00.000Z",
  app_metadata: {},
  user_metadata: {},
} satisfies User;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function renderChallenge(session: { run_mode: "live" | "fixture" }) {
  vi.mocked(requireUser).mockResolvedValue(authenticatedUser);
  vi.mocked(getSessionForPage).mockResolvedValue({
    ...session,
    status: "challenge",
    initial_canvas: null,
  } as never);

  render(await ChallengePage({ params: Promise.resolve({ sessionId: "session-1" }) }));
}

describe("ChallengePage", () => {
  it("offers the public demo and dashboard when a live session is unavailable", async () => {
    vi.mocked(isLiveAIConfigured).mockReturnValue(false);

    await renderChallenge({ run_mode: "live" });

    expect(screen.getByRole("link", { name: "Open the public demo" })).toHaveAttribute("href", "/demo");
    expect(screen.getByRole("link", { name: "Go to dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("link", { name: /fixture/i })).not.toBeInTheDocument();
  });

  it("renders an existing fixture session when live AI is unavailable", async () => {
    vi.mocked(isLiveAIConfigured).mockReturnValue(false);

    await renderChallenge({ run_mode: "fixture" });

    expect(screen.getByTestId("canvas-form")).toBeInTheDocument();
    expect(screen.queryByText("Live AI is not configured in this environment")).not.toBeInTheDocument();
  });
});
