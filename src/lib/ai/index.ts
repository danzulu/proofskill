import "server-only";

import type { AssessmentAI, RunMode } from "@/lib/domain/assessment";
import { FixtureAssessmentAI } from "./fixture";
import { LiveAssessmentAI } from "./live";

const fixture = new FixtureAssessmentAI();
const live = new LiveAssessmentAI();

export function getAssessmentAI(runMode: RunMode): AssessmentAI {
  if (runMode === "fixture") {
    if (process.env.ENABLE_AI_FIXTURES !== "true") {
      throw new Error("AI fixtures are disabled in this environment.");
    }
    return fixture;
  }
  return live;
}

