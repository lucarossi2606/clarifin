alter table public.nodes
  add column if not exists event_type text,
  add column if not exists event_status text;

create index if not exists nodes_event_type_idx
  on public.nodes (event_type);

create index if not exists nodes_event_status_idx
  on public.nodes (event_status);