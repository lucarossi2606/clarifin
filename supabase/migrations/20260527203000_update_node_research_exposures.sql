create table if not exists public.node_research_exposures (
  id uuid primary key default gen_random_uuid(),
  node_id text not null,
  theme text not null,
  why_relevant text,
  possible_tickers text[] default '{}'::text[],
  data_needed text,
  time_horizon text,
  confidence int,
  created_at timestamptz default now()
);
alter table public.node_research_exposures
  add column if not exists confidence int;
update public.node_research_exposures
set theme = 'Exposure to research'
where theme is null or btrim(theme) = '';
alter table public.node_research_exposures
  alter column theme set not null;
alter table public.node_research_exposures
  alter column possible_tickers set default '{}'::text[];
alter table public.node_research_exposures enable row level security;
drop policy if exists "Public can read exposures for published nodes" on public.node_research_exposures;
drop policy if exists "Public can read exposures for published or draft nodes" on public.node_research_exposures;
drop policy if exists "Public can read node research exposures" on public.node_research_exposures;
create policy "Public can read node research exposures"
  on public.node_research_exposures
  for select
  to anon
  using (true);
grant select on public.node_research_exposures to anon, authenticated;
