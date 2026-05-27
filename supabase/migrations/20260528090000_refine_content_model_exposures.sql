alter table public.node_research_exposures
  add column if not exists sector_or_theme_type text,
  add column if not exists sector_proxy_tickers text[] default '{}'::text[],
  add column if not exists direction_hint text;

update public.node_research_exposures
set sector_proxy_tickers = possible_tickers
where (sector_proxy_tickers is null or array_length(sector_proxy_tickers, 1) is null)
  and possible_tickers is not null;

alter table public.affected_assets
  add column if not exists asset_class text,
  add column if not exists uncertainty text;

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
