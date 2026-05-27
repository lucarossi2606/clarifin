create table if not exists public.node_research_exposures (
  id uuid primary key default gen_random_uuid(),
  node_id text not null,
  theme text,
  why_relevant text,
  possible_tickers text[] not null default '{}'::text[],
  data_needed text,
  time_horizon text,
  created_at timestamptz not null default now()
);

create index if not exists node_research_exposures_node_id_idx
  on public.node_research_exposures (node_id);

create index if not exists node_research_exposures_created_at_idx
  on public.node_research_exposures (created_at desc);

alter table public.node_research_exposures enable row level security;

drop policy if exists "Public can read exposures for published nodes" on public.node_research_exposures;
create policy "Public can read exposures for published nodes"
  on public.node_research_exposures
  for select
  using (
    exists (
      select 1
      from public.nodes
      where nodes.id::text = node_research_exposures.node_id
        and nodes.status = 'published'
    )
  );

grant select on public.node_research_exposures to anon, authenticated;
