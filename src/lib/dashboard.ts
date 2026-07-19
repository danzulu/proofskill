import type { AssessmentStatus, RunMode } from "@/lib/domain/assessment";

export type DashboardEvaluation = {
  total_score: number;
  level: string;
};

export type RawDashboardSession = {
  id: string;
  status: AssessmentStatus;
  run_mode: RunMode;
  difficulty: string;
  created_at: string;
  completed_at: string | null;
  evaluations: DashboardEvaluation | DashboardEvaluation[] | null;
};

export type DashboardSession = Omit<RawDashboardSession, "evaluations"> & {
  evaluations: DashboardEvaluation[];
};

export function normalizeDashboardSessions(rows: RawDashboardSession[]): DashboardSession[] {
  return rows.map((row) => ({
    ...row,
    evaluations: Array.isArray(row.evaluations)
      ? row.evaluations
      : row.evaluations
        ? [row.evaluations]
        : [],
  }));
}

export function getBestDashboardScore(sessions: DashboardSession[]) {
  const scores = sessions.flatMap((session) =>
    session.evaluations.map((evaluation) => evaluation.total_score),
  );
  return scores.length > 0 ? Math.max(...scores) : null;
}
