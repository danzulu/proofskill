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
    const overlay = status.parentElement?.parentElement;
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status).toHaveTextContent("GPT-5.6 is evaluating your evidence");
    expect(status).toHaveTextContent("This can take up to a minute.");
    expect(status).toHaveTextContent("Keep this page open. Your selections are safe.");
    expect(overlay).toHaveClass("fixed", "inset-0");
    expect(status.querySelector("svg")).toHaveClass("motion-reduce:animate-none");
  });
});
