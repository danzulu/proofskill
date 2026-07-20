// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CanvasForm } from "./canvas-form";
import { canvasKeys } from "@/lib/domain/assessment";
import { ECOMMERCE_CANVAS_DECISIONS } from "@/lib/domain/scenario";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const initial = Object.fromEntries(
  canvasKeys.map((key) => [key, ECOMMERCE_CANVAS_DECISIONS[key].choices[0].response]),
) as Parameters<typeof CanvasForm>[0]["initial"];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

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

async function submitStrategy() {
  await userEvent.click(screen.getByRole("button", { name: "Open Success metrics" }));
  const submit = screen.getByRole("button", { name: "Submit strategy" });
  await userEvent.click(submit);
  return submit.closest("form");
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  push.mockReset();
  refresh.mockReset();
});

describe("CanvasForm processing", () => {
  it("shows saving, generation, and navigation phases while controls are locked", async () => {
    const saved = deferred<Response>();
    const generated = deferred<Response>();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValueOnce(saved.promise).mockReturnValueOnce(generated.promise),
    );
    render(<CanvasForm sessionId="session-1" initial={initial} />);

    const form = await submitStrategy();

    expect(await screen.findByRole("status")).toHaveTextContent("Saving your strategy");
    expect(form).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Open Problem" })).toBeDisabled();

    saved.resolve(response({ data: {}, error: null }));
    await screen.findByText("GPT-5.6 is creating your pressure test");

    generated.resolve(
      response({
        data: {},
        error: null,
        next_path: "/assessment/session-1/constraint",
      }),
    );
    await screen.findByText("Pressure test ready");
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/assessment/session-1/constraint"),
    );
  });

  it("refreshes into the retry state when constraint generation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(response({ data: {}, error: null }))
        .mockResolvedValueOnce(
          response({ data: null, error: { message: "Constraint failed" } }),
        ),
    );
    render(<CanvasForm sessionId="session-1" initial={initial} />);

    const form = await submitStrategy();

    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(form).toHaveAttribute("aria-busy", "false");
    expect(screen.getByText("Constraint failed")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("recovers from an initial request rejection without refreshing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("Network unavailable")));
    render(<CanvasForm sessionId="session-1" initial={initial} />);

    const form = await submitStrategy();

    expect(await screen.findByText("Network unavailable")).toBeInTheDocument();
    expect(form).toHaveAttribute("aria-busy", "false");
    expect(screen.getByRole("button", { name: "Submit strategy" })).toBeEnabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refreshes after constraint JSON parsing fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(response({ data: {}, error: null }))
        .mockResolvedValueOnce({
          json: async () => {
            throw new Error("Invalid constraint response");
          },
        } as unknown as Response),
    );
    render(<CanvasForm sessionId="session-1" initial={initial} />);

    const form = await submitStrategy();

    expect(await screen.findByText("Invalid constraint response")).toBeInTheDocument();
    expect(form).toHaveAttribute("aria-busy", "false");
    expect(refresh).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
