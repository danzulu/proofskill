import type { ScoredEvaluation } from "@/lib/domain/scoring";

export const DEMO_REPORT: ScoredEvaluation = {
  total_score: 82,
  level: "Proficient",
  competency_scores: {
    problem_framing: 84,
    customer_insight: 76,
    strategic_coherence: 81,
    adaptability: 88,
    prioritization: 82,
    measurement: 79,
    decision_quality: 83,
  },
  evidence: [
    {
      competency: "adaptability",
      kind: "positive",
      source_path: "revision_strategy.adaptations.acquisition",
      exact_quote: "Shift the first experiment to owned cart-recovery email and on-site checkout guidance",
      explanation: "The response replaces the unavailable paid lever with an owned-channel test.",
    },
    {
      competency: "decision_quality",
      kind: "positive",
      source_path: "critical_decision.rationale",
      exact_quote: "A bounded experiment protects the option to stop if contribution margin deteriorates",
      explanation: "The trade-off and stop logic are explicit.",
    },
  ],
  contradictions: [
    "The 14-day learning window is shorter than the proposed repeat-purchase measurement period.",
  ],
  main_gap:
    "The test needs a precommitted sample threshold and minimum detectable effect before launch.",
  next_challenge:
    "Define the exact decision rule that would cause you to scale, iterate, or stop the intervention.",
  summary:
    "The proposal adapts coherently under pressure and preserves both learning speed and a margin guardrail.",
  deterministic_adjustments: [],
};

