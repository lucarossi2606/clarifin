create table if not exists public.research_fact_packs (
  id uuid primary key default gen_random_uuid(),
  node_id text,
  raw_event_text text,
  normalized_query text,
  detected_entities jsonb,
  detected_regions jsonb,
  related_news_count int,
  related_news jsonb,
  source_domains jsonb,
  candidate_assets jsonb,
  research_warnings jsonb,
  missing_data jsonb,
  created_at timestamptz default now()
);

alter table public.research_fact_packs enable row level security;

drop policy if exists "Public can read research fact packs"
on public.research_fact_packs;

create policy "Public can read research fact packs"
on public.research_fact_packs
for select
to anon
using (true);
