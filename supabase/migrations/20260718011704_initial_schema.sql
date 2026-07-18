create table public.assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id text not null,
  scenario_version text not null,
  difficulty text not null check (difficulty in ('Intermediate')),
  run_mode text not null check (run_mode in ('live', 'fixture')),
  status text not null default 'challenge' check (
    status in (
      'challenge',
      'initial_submitted',
      'constraint_generating',
      'constraint',
      'revision_submitted',
      'critical_decision',
      'evaluating',
      'completed'
    )
  ),
  initial_canvas jsonb,
  constraint_payload jsonb,
  revised_canvas jsonb,
  revision_strategy jsonb,
  critical_decision jsonb,
  evaluation_claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.assessment_sessions(id) on delete cascade,
  total_score smallint not null check (total_score between 0 and 100),
  level text not null check (level in ('Foundational', 'Developing', 'Proficient', 'Advanced')),
  competency_scores jsonb not null,
  rubric_version text not null,
  model text not null,
  deterministic_adjustments jsonb not null default '[]'::jsonb,
  contradictions jsonb not null default '[]'::jsonb,
  summary text not null,
  main_gap text not null,
  next_challenge text not null,
  created_at timestamptz not null default now()
);

create table public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  competency text not null,
  kind text not null check (kind in ('positive', 'contradiction')),
  source_path text not null,
  exact_quote text not null,
  valid boolean not null,
  explanation text not null,
  created_at timestamptz not null default now()
);

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  kind text not null check (kind in ('constraint', 'evaluation')),
  model text not null,
  run_mode text not null check (run_mode in ('live', 'fixture')),
  status text not null check (status in ('succeeded', 'failed')),
  latency_ms integer not null check (latency_ms >= 0),
  request_id text,
  error_code text,
  created_at timestamptz not null default now()
);

create index assessment_sessions_user_created_idx
  on public.assessment_sessions (user_id, created_at desc);
create index assessment_sessions_user_status_idx
  on public.assessment_sessions (user_id, status);
create index evaluations_session_id_idx on public.evaluations (session_id);
create index evidence_items_evaluation_id_idx on public.evidence_items (evaluation_id);
create index evidence_items_session_id_idx on public.evidence_items (session_id);
create index ai_runs_session_id_idx on public.ai_runs (session_id);

alter table public.assessment_sessions enable row level security;
alter table public.evaluations enable row level security;
alter table public.evidence_items enable row level security;
alter table public.ai_runs enable row level security;

create policy "Users read their assessment sessions"
  on public.assessment_sessions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read their evaluations"
  on public.evaluations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.assessment_sessions session
      where session.id = evaluations.session_id
        and session.user_id = (select auth.uid())
    )
  );

create policy "Users read their evidence"
  on public.evidence_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.assessment_sessions session
      where session.id = evidence_items.session_id
        and session.user_id = (select auth.uid())
    )
  );

create policy "Users read their AI run metadata"
  on public.ai_runs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.assessment_sessions session
      where session.id = ai_runs.session_id
        and session.user_id = (select auth.uid())
    )
  );

grant usage on schema public to authenticated;
grant select on public.assessment_sessions, public.evaluations, public.evidence_items, public.ai_runs
  to authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.assessment_sessions, public.evaluations, public.evidence_items, public.ai_runs
  from anon, authenticated;
revoke all on public.assessment_sessions, public.evaluations, public.evidence_items, public.ai_runs
  from anon;
