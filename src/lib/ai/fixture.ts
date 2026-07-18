import type {
  AssessmentAI,
  ConstraintInput,
  EvaluationDraft,
  EvaluationInput,
} from "@/lib/domain/assessment";
import { constraintSchema, evaluationDraftSchema } from "@/lib/domain/assessment";

function quote(value: string, max = 180) {
  return value.length <= max ? value : value.slice(0, max).trimEnd();
}

export class FixtureAssessmentAI implements AssessmentAI {
  async generateConstraint(input: ConstraintInput) {
    void input;
    return constraintSchema.parse({
      title: "Paid acquisition is paused",
      summary:
        "Finance freezes paid acquisition for 30 days after CAC rises again. The team must recover checkout completion using owned traffic and product changes, without introducing a sitewide discount.",
      affected_fields: ["acquisition", "solution", "revenue", "success_metrics"],
      business_impact:
        "The original growth plan loses its largest traffic lever, while a broad promotion would breach the contribution-margin guardrail.",
      time_pressure: "Choose and launch one measurable experiment within 14 days.",
    });
  }

  async evaluate(input: EvaluationInput): Promise<EvaluationDraft> {
    const draft = {
      competency_scores: {
        problem_framing: 82,
        customer_insight: 76,
        strategic_coherence: 79,
        adaptability: 86,
        prioritization: 81,
        measurement: 84,
        decision_quality: 83,
      },
      evidence: [
        {
          competency: "problem_framing",
          kind: "positive",
          source_path: "initial_canvas.problem",
          exact_quote: quote(input.initial_canvas.problem),
          explanation: "The proposal frames a specific behavioral and commercial problem.",
        },
        {
          competency: "adaptability",
          kind: "positive",
          source_path: "revision_strategy.adaptations.acquisition",
          exact_quote: quote(
            input.revision_strategy.adaptations.acquisition ??
              input.revised_canvas.acquisition,
          ),
          explanation: "The acquisition response directly addresses the paid-channel freeze.",
        },
        {
          competency: "measurement",
          kind: "positive",
          source_path: "revision_strategy.measure",
          exact_quote: quote(input.revision_strategy.measure),
          explanation: "The revision defines a way to decide whether the change worked.",
        },
        {
          competency: "decision_quality",
          kind: "positive",
          source_path: "critical_decision.rationale",
          exact_quote: quote(input.critical_decision.rationale),
          explanation: "The final decision makes the trade-off and rationale explicit.",
        },
        {
          competency: "strategic_coherence",
          kind: "contradiction",
          source_path: "initial_canvas.revenue",
          exact_quote: quote(input.initial_canvas.revenue),
          explanation: "The original revenue logic needs a clearer connection to the revised intervention.",
        },
      ],
      contradictions: [
        "The proposed speed of learning may conflict with the amount of behavior change expected in a 14-day window.",
      ],
      main_gap:
        "The plan does not yet define the minimum sample or decision threshold required to distinguish signal from short-term noise.",
      next_challenge:
        "Design a two-cell experiment with an explicit sample threshold, stop condition, and contribution-margin guardrail.",
      summary:
        "A coherent response that adapts the plan to a material constraint and makes a defensible trade-off. The strongest improvement would be a sharper decision rule for the experiment.",
    };
    return evaluationDraftSchema.parse(draft);
  }
}
