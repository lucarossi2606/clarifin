alter table public.research_fact_packs
  add column if not exists external_data_observations jsonb not null default '[]'::jsonb;
