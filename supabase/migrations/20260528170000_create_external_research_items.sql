create table if not exists public.external_research_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  node_id text null,
  research_run_id uuid null references public.research_runs(id) on delete set null,
  source_name text not null,
  source_type text not null check (
    source_type in ('news', 'macro', 'earnings', 'energy', 'market_data', 'fundamentals', 'other')
  ),
  query_or_endpoint text,
  request_summary jsonb not null default '{}'::jsonb,
  response_summary jsonb not null default '{}'::jsonb,
  raw_payload jsonb null,
  extracted_facts jsonb null,
  status text not null check (
    status in ('success', 'failed', 'timeout', 'no_results', 'rate_limited', 'skipped')
  ),
  warning text null,
  used_in_final_node boolean not null default false,
  data_quality text not null default 'unknown' check (
    data_quality in ('high', 'medium', 'low', 'unknown')
  )
);
create index if not exists external_research_items_node_id_idx
  on public.external_research_items (node_id);
create index if not exists external_research_items_research_run_id_idx
  on public.external_research_items (research_run_id);
create index if not exists external_research_items_source_status_idx
  on public.external_research_items (source_name, status, created_at desc);
create index if not exists external_research_items_created_at_idx
  on public.external_research_items (created_at desc);
alter table public.external_research_items enable row level security;
drop policy if exists "Public can read external research items"
on public.external_research_items;
create policy "Public can read external research items"
on public.external_research_items
for select
to anon
using (true);
grant select on public.external_research_items to anon, authenticated;
