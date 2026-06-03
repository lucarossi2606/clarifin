alter table public.external_research_items
  drop constraint if exists external_research_items_source_type_check;

alter table public.external_research_items
  add constraint external_research_items_source_type_check
  check (
    source_type in (
      'news',
      'macro',
      'earnings',
      'energy',
      'market_data',
      'fundamentals',
      'company_profile',
      'other'
    )
  );
