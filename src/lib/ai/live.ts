import "server-only";

import { createHash } from "node:crypto";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type {
  AssessmentAI,
  ConstraintInput,
  EvaluationInput,
} from "@/lib/domain/assessment";
import { constraintSchema, evaluationDraftSchema } from "@/lib/domain/assessment";

let client: OpenAI | null = null;

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AssessmentAIError(
      "OPENAI_NOT_CONFIGURED",
      false,
      "Live AI is not configured in this environment. Start a fixture rehearsal or add OPENAI_API_KEY and redeploy.",
    );
  }
  client ??= new OpenAI({ apiKey, timeout: 55_000, maxRetries: 0 });
  return client;
}

function safetyIdentifier(userId: string) {
  return createHash("sha256").update(`proofskill:${userId}`).digest("hex").slice(0, 32);
}

export class AssessmentAIError extends Error {
  constructor(
    public readonly code: string,
    public readonly retryable: boolean,
    message = code,
  ) {
    super(message);
    this.name = "AssessmentAIError";
  }
}

function classify(error: unknown): AssessmentAIError {
  if (error instanceof AssessmentAIError) return error;
  if (error instanceof OpenAI.RateLimitError) {
    return new AssessmentAIError("OPENAI_RATE_LIMIT", true, "The model is temporarily busy.");
  }
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new AssessmentAIError("OPENAI_TIMEOUT", true, "The model request timed out.");
  }
  if (error instanceof OpenAI.APIError) {
    return new AssessmentAIError("OPENAI_API_ERROR", error.status >= 500, error.message);
  }
  return new AssessmentAIError("OPENAI_UNKNOWN", false, "Unexpected model error.");
}

export class LiveAssessmentAI implements AssessmentAI {
  async generateConstraint(input: ConstraintInput, userId: string) {
    try {
      const response = await getOpenAI().responses.parse({
        model: process.env.OPENAI_MODEL || "gpt-5.6-sol",
        reasoning: { effort: "low" },
        store: false,
        safety_identifier: safetyIdentifier(userId),
        input: [
          {
            role: "system",
            content:
              "You design fair business simulations for education. Generate one plausible, material constraint. Affect exactly 2-4 supplied canvas fields. Do not invent personal data or ask for chain of thought.",
          },
          { role: "user", content: JSON.stringify(input) },
        ],
        text: { format: zodTextFormat(constraintSchema, "assessment_constraint") },
      });
      if (!response.output_parsed) {
        throw new AssessmentAIError("OPENAI_REFUSAL_OR_SCHEMA", false);
      }
      return response.output_parsed;
    } catch (error) {
      throw classify(error);
    }
  }

  async evaluate(input: EvaluationInput, userId: string) {
    try {
      const response = await getOpenAI().responses.parse({
        model: process.env.OPENAI_MODEL || "gpt-5.6-sol",
        reasoning: { effort: "medium" },
        store: false,
        safety_identifier: safetyIdentifier(userId),
        input: [
          {
            role: "system",
            content:
              "Evaluate the work using seven competency scores from 0-100. Evidence quotes must be exact substrings of the supplied source_path. Never provide hidden reasoning or chain of thought. Return concise conclusions and verifiable evidence only.",
          },
          { role: "user", content: JSON.stringify(input) },
        ],
        text: { format: zodTextFormat(evaluationDraftSchema, "assessment_evaluation") },
      });
      if (!response.output_parsed) {
        throw new AssessmentAIError("OPENAI_REFUSAL_OR_SCHEMA", false);
      }
      return response.output_parsed;
    } catch (error) {
      throw classify(error);
    }
  }
}
