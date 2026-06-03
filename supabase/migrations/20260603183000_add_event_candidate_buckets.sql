alter table public.event_candidates
  add column if not exists display_bucket text not null default 'top',
  add column if not exists event_type text,
  add column if not exists market_importance_score numeric,
  add column if not exists earnings_date date,
  add column if not exists company_name text,
  add column if not exists eps_estimate numeric,
  add column if not exists revenue_estimate numeric,
  add column if not exists fiscal_date_ending text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_candidates_display_bucket_check'
  ) then
    alter table public.event_candidates
      add constraint event_candidates_display_bucket_check
      check (display_bucket in ('top', 'upcoming', 'watchlist_later'));
  end if;
end $$;

create index if not exists event_candidates_bucket_status_score_idx
  on public.event_candidates (display_bucket, status, total_score desc, created_at desc);

create index if not exists event_candidates_earnings_dedupe_idx
  on public.event_candidates (event_type, earnings_date, created_at desc)
  where event_type = 'earnings';

update public.event_candidates
set
  display_bucket = 'upcoming',
  event_type = coalesce(event_type, 'earnings')
where lower(coalesce(category, '')) = 'earnings'
  and display_bucket = 'top';
