create table if not exists public.node_indirect_impacts (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.nodes(id) on delete cascade,
  created_at timestamptz not null default now(),
  symbol text null,
  company_name text null,
  title text null,
  direction text null check (
    direction is null or direction in ('positive', 'negative', 'mixed', 'neutral')
  ),
  strength text null check (
    strength is null or strength in ('weak', 'medium', 'high')
  ),
  reason text not null,
  evidence_required_to_upgrade text null,
  source_channel text null,
  sort_order int null default 0
);

create index if not exists node_indirect_impacts_node_id_idx
  on public.node_indirect_impacts (node_id, sort_order);

create index if not exists node_indirect_impacts_created_at_idx
  on public.node_indirect_impacts (created_at desc);

alter table public.node_indirect_impacts enable row level security;

drop policy if exists "Public can read node indirect impacts"
  on public.node_indirect_impacts;

create policy "Public can read node indirect impacts"
  on public.node_indirect_impacts
  for select
  to anon
  using (true);

grant select on public.node_indirect_impacts to anon, authenticated;
