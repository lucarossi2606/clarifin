create table if not exists public.event_candidates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_name text,
  source_type text,
  title text,
  summary text,
  raw_event_text text not null,
  category text,
  region text,
  detected_entities jsonb not null default '{}'::jsonb,
  candidate_assets jsonb not null default '[]'::jsonb,
  candidate_sources jsonb not null default '[]'::jsonb,
  relevance_score numeric,
  urgency_score numeric,
  confidence_score numeric,
  total_score numeric,
  status text not null default 'candidate' check (
    status in (
      'candidate',
      'selected_for_generation',
      'generated',
      'published',
      'ignored',
      'duplicate',
      'failed',
      'archived'
    )
  ),
  source_url text,
  source_payload jsonb,
  why_it_matters text,
  duplicate_of_candidate_id uuid references public.event_candidates(id) on delete set null,
  related_node_id uuid references public.nodes(id) on delete set null,
  auto_generation_attempted boolean not null default false,
  auto_generation_status text,
  auto_generation_error text,
  auto_published boolean not null default false,
  auto_publish_reason text,
  next_check_at timestamptz
);

create index if not exists event_candidates_status_score_idx
  on public.event_candidates (status, total_score desc, created_at desc);

create index if not exists event_candidates_created_at_idx
  on public.event_candidates (created_at desc);

create index if not exists event_candidates_duplicate_idx
  on public.event_candidates (duplicate_of_candidate_id);

create index if not exists event_candidates_related_node_idx
  on public.event_candidates (related_node_id);

create or replace function public.set_event_candidates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists event_candidates_set_updated_at on public.event_candidates;
create trigger event_candidates_set_updated_at
before update on public.event_candidates
for each row
execute function public.set_event_candidates_updated_at();

alter table public.event_candidates enable row level security;

-- Draft/event candidate review remains server-side for now. Service-role Edge
-- Functions bypass RLS; public clients intentionally receive no direct policy
-- for inserting, updating, or reading candidates.
