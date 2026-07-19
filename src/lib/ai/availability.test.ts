import { afterEach, describe, expect, it } from "vitest";
import { areFixturesEnabled, isLiveAIConfigured } from "./availability";

const originalFixtures = process.env.ENABLE_AI_FIXTURES;
const originalOpenAIKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  if (originalFixtures === undefined) delete process.env.ENABLE_AI_FIXTURES;
  else process.env.ENABLE_AI_FIXTURES = originalFixtures;
  if (originalOpenAIKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalOpenAIKey;
});

describe("assessment AI availability", () => {
  it("enables fixtures only with an explicit true value", () => {
    process.env.ENABLE_AI_FIXTURES = "true";
    expect(areFixturesEnabled()).toBe(true);
    process.env.ENABLE_AI_FIXTURES = "false";
    expect(areFixturesEnabled()).toBe(false);
  });

  it("requires a non-empty OpenAI API key for live runs", () => {
    delete process.env.OPENAI_API_KEY;
    expect(isLiveAIConfigured()).toBe(false);
    process.env.OPENAI_API_KEY = "   ";
    expect(isLiveAIConfigured()).toBe(false);
    process.env.OPENAI_API_KEY = "sk-test";
    expect(isLiveAIConfigured()).toBe(true);
  });
});
