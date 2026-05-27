alter table public.research_runs
  add column if not exists assets_to_research jsonb not null default '[]'::jsonb;
