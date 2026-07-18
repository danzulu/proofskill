import { z } from "zod";

export const canvasKeys = [
  "problem",
  "target_customer",
  "value_proposition",
  "solution",
  "acquisition",
  "retention",
  "revenue",
  "success_metrics",
] as const;

export type CanvasKey = (typeof canvasKeys)[number];

const meaningfulText = z.string().trim().min(20).max(1_500);

export const canvasSchema = z.object({
  problem: meaningfulText,
  target_customer: meaningfulText,
  value_proposition: meaningfulText,
  solution: meaningfulText,
  acquisition: meaningfulText,
  retention: meaningfulText,
  revenue: meaningfulText,
  success_metrics: meaningfulText,
});

export type Canvas = z.infer<typeof canvasSchema>;

export const assessmentStatusSchema = z.enum([
  "challenge",
  "initial_submitted",
  "constraint_generating",
  "constraint",
  "revision_submitted",
  "critical_decision",
  "evaluating",
  "completed",
]);

export type AssessmentStatus = z.infer<typeof assessmentStatusSchema>;

export const runModeSchema = z.enum(["live", "fixture"]);
export type RunMode = z.infer<typeof runModeSchema>;

export const constraintSchema = z.object({
  title: z.string().min(5).max(120),
  summary: z.string().min(20).max(600),
  affected_fields: z.array(z.enum(canvasKeys)).min(2).max(4),
  business_impact: z.string().min(20).max(500),
  time_pressure: z.string().min(10).max(200),
});

export type Constraint = z.infer<typeof constraintSchema>;

export const revisionStrategySchema = z.object({
  adaptations: z.partialRecord(z.enum(canvasKeys), z.string().trim().min(10).max(600)),
  keep: z.string().trim().min(10).max(600),
  remove: z.string().trim().min(10).max(600),
  measure: z.string().trim().min(10).max(600),
});

export type RevisionStrategy = z.infer<typeof revisionStrategySchema>;

export const criticalDecisionSchema = z.object({
  choice: z.enum(["protect_margin", "protect_growth", "balanced_experiment"]),
  rationale: z.string().trim().min(30).max(1_000),
  first_action: z.string().trim().min(15).max(500),
  guardrail: z.string().trim().min(15).max(500),
});

export type CriticalDecision = z.infer<typeof criticalDecisionSchema>;

export const competencyKeys = [
  "problem_framing",
  "customer_insight",
  "strategic_coherence",
  "adaptability",
  "prioritization",
  "measurement",
  "decision_quality",
] as const;

export type CompetencyKey = (typeof competencyKeys)[number];

export const evidenceSchema = z.object({
  competency: z.enum(competencyKeys),
  kind: z.enum(["positive", "contradiction"]),
  source_path: z.string().min(3).max(120),
  exact_quote: z.string().min(4).max(400),
  explanation: z.string().min(10).max(500),
});

export type Evidence = z.infer<typeof evidenceSchema>;

export const evaluationDraftSchema = z.object({
  competency_scores: z.object(
    Object.fromEntries(
      competencyKeys.map((key) => [key, z.number().int().min(0).max(100)]),
    ) as Record<CompetencyKey, z.ZodNumber>,
  ),
  evidence: z.array(evidenceSchema).min(4).max(18),
  contradictions: z.array(z.string().min(10).max(500)).max(6),
  main_gap: z.string().min(20).max(500),
  next_challenge: z.string().min(20).max(500),
  summary: z.string().min(30).max(900),
});

export type EvaluationDraft = z.infer<typeof evaluationDraftSchema>;

export const constraintInputSchema = z.object({
  scenario: z.string(),
  initial_canvas: canvasSchema,
});

export type ConstraintInput = z.infer<typeof constraintInputSchema>;

export const evaluationInputSchema = z.object({
  scenario: z.string(),
  initial_canvas: canvasSchema,
  constraint: constraintSchema,
  revised_canvas: canvasSchema,
  revision_strategy: revisionStrategySchema,
  critical_decision: criticalDecisionSchema,
});

export type EvaluationInput = z.infer<typeof evaluationInputSchema>;

export interface AssessmentAI {
  generateConstraint(input: ConstraintInput, userId: string): Promise<Constraint>;
  evaluate(input: EvaluationInput, userId: string): Promise<EvaluationDraft>;
}

export type ApiResult<T> =
  | { data: T; error: null; next_path?: string }
  | {
      data: null;
      error: { code: string; message: string; retryable: boolean };
    };
