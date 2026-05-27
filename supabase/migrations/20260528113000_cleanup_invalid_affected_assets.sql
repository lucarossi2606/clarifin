-- Clarifin content-model cleanup:
-- sector ETF proxies belong in node_research_exposures, never affected_assets.

insert into public.node_research_exposures (
  node_id,
  theme,
  sector_or_theme_type,
  why_relevant,
  sector_proxy_tickers,
  direction_hint,
  data_needed,
  time_horizon,
  confidence
)
select
  a.node_id::text,
  case upper(a.ticker)
    when 'XLE' then 'Energy'
    when 'XLF' then 'Financials'
    when 'XLV' then 'Health Care'
    when 'XLP' then 'Consumer Staples'
    when 'XLY' then 'Consumer Discretionary'
    when 'XLI' then 'Industrials'
    when 'XLK' then 'Technology'
    when 'XLU' then 'Utilities'
    when 'XLRE' then 'Real Estate'
    when 'XLB' then 'Materials'
    else upper(a.ticker)
  end as theme,
  'equity_sector' as sector_or_theme_type,
  coalesce(nullif(a.reason, ''), 'Equity-sector exposure proxy moved out of affected assets.') as why_relevant,
  array[upper(a.ticker)]::text[] as sector_proxy_tickers,
  coalesce(nullif(lower(a.direction), ''), 'mixed') as direction_hint,
  coalesce(nullif(a.uncertainty, ''), 'Moved from affected_assets because Clarifin treats equity sector ETFs as exposure proxies, not concrete affected assets.') as data_needed,
  'near_term' as time_horizon,
  45 as confidence
from public.affected_assets a
where upper(coalesce(a.ticker, '')) in ('XLE', 'XLF', 'XLV', 'XLP', 'XLY', 'XLI', 'XLK', 'XLU', 'XLRE', 'XLB')
  and not exists (
    select 1
    from public.node_research_exposures e
    where e.node_id = a.node_id::text
      and e.sector_proxy_tickers @> array[upper(a.ticker)]::text[]
  );

delete from public.affected_assets
where upper(coalesce(ticker, '')) in (
    'XLE', 'XLF', 'XLV', 'XLP', 'XLY', 'XLI', 'XLK', 'XLU', 'XLRE', 'XLB',
    'UNKNOWN', 'N/A', 'NA', 'NONE', 'TBD', 'UNVERIFIED',
    'ENERGY', 'OIL & GAS', 'OIL AND GAS', 'SHIPPING', 'TRANSPORTATION',
    'AIRLINES', 'AIRLINES / TRANSPORT', 'DEFENSE', 'CONSUMER DISCRETIONARY',
    'CONSUMER STAPLES', 'FINANCIALS', 'HEALTH CARE', 'HEALTHCARE',
    'INDUSTRIALS', 'TECHNOLOGY', 'UTILITIES', 'REAL ESTATE', 'MATERIALS',
    'RATE-SENSITIVE SECTORS', 'INFLATION-SENSITIVE SECTORS', 'LNG',
    'SUPPLY CHAIN', 'AI INFRASTRUCTURE', 'SEMICONDUCTOR SUPPLY CHAIN',
    'OIL PRODUCERS', 'ENERGY PRODUCERS', 'DEFENSE STOCKS', 'GOLD MINERS',
    'BOND MARKETS', 'GROWTH EQUITIES', 'SAFE HAVENS'
  )
  or upper(coalesce(name, '')) in (
    'XLE', 'XLF', 'XLV', 'XLP', 'XLY', 'XLI', 'XLK', 'XLU', 'XLRE', 'XLB',
    'UNKNOWN', 'N/A', 'NA', 'NONE', 'TBD', 'UNVERIFIED',
    'ENERGY', 'OIL & GAS', 'OIL AND GAS', 'SHIPPING', 'TRANSPORTATION',
    'AIRLINES', 'AIRLINES / TRANSPORT', 'DEFENSE', 'CONSUMER DISCRETIONARY',
    'CONSUMER STAPLES', 'FINANCIALS', 'HEALTH CARE', 'HEALTHCARE',
    'INDUSTRIALS', 'TECHNOLOGY', 'UTILITIES', 'REAL ESTATE', 'MATERIALS',
    'RATE-SENSITIVE SECTORS', 'INFLATION-SENSITIVE SECTORS', 'LNG',
    'SUPPLY CHAIN', 'AI INFRASTRUCTURE', 'SEMICONDUCTOR SUPPLY CHAIN',
    'OIL PRODUCERS', 'ENERGY PRODUCERS', 'DEFENSE STOCKS', 'GOLD MINERS',
    'BOND MARKETS', 'GROWTH EQUITIES', 'SAFE HAVENS'
  );
