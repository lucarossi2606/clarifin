alter table upcoming_events
  add column if not exists company_name text,
  add column if not exists event_type text,
  add column if not exists country text,
  add column if not exists expected_value text,
  add column if not exists previous_value text,
  add column if not exists actual_value text,
  add column if not exists eps_estimate numeric,
  add column if not exists revenue_estimate numeric,
  add column if not exists fiscal_date_ending text,
  add column if not exists data_quality text;
