create table if not exists public.research_runs (
  id uuid primary key default gen_random_uuid(),
  node_id text null,
  raw_event_text text not null,
  research_plan jsonb not null,
  evidence_map jsonb not null,
  quality_gate jsonb not null,
  missing_data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists research_runs_node_id_idx
  on public.research_runs (node_id);
create index if not exists research_runs_created_at_idx
  on public.research_runs (created_at desc);
