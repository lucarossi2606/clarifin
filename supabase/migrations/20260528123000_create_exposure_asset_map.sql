create table if not exists public.exposure_asset_map (
  id uuid primary key default gen_random_uuid(),
  exposure_key text not null,
  exposure_label text not null,
  exposure_type text,
  candidate_asset text not null,
  candidate_name text,
  asset_class text not null check (asset_class in ('stock', 'index', 'bond', 'rate', 'commodity', 'currency', 'other')),
  default_direction_escalation text check (default_direction_escalation in ('positive', 'negative', 'neutral', 'mixed', 'strongly positive', 'strongly negative')),
  default_direction_deescalation text check (default_direction_deescalation in ('positive', 'negative', 'neutral', 'mixed', 'strongly positive', 'strongly negative')),
  rationale text,
  region text,
  priority int default 50,
  is_active boolean default true,
  created_at timestamptz default now()
);

create unique index if not exists exposure_asset_map_unique_active_candidate
on public.exposure_asset_map (exposure_key, candidate_asset);

alter table public.exposure_asset_map enable row level security;

drop policy if exists "Public can read exposure asset map" on public.exposure_asset_map;
create policy "Public can read exposure asset map"
on public.exposure_asset_map
for select
to anon
using (is_active = true);

insert into public.exposure_asset_map (
  exposure_key,
  exposure_label,
  exposure_type,
  candidate_asset,
  candidate_name,
  asset_class,
  default_direction_escalation,
  default_direction_deescalation,
  rationale,
  region,
  priority
) values
  ('defense_aerospace', 'Defense / Aerospace', 'industry_group', 'LMT', 'Lockheed Martin', 'stock', 'positive', 'negative', 'Defense contractors can benefit when geopolitical risk raises attention on aerospace, missile, surveillance or naval capabilities.', 'us', 95),
  ('defense_aerospace', 'Defense / Aerospace', 'industry_group', 'NOC', 'Northrop Grumman', 'stock', 'positive', 'negative', 'Northrop Grumman is a major defense contractor exposed to aerospace, surveillance and strategic systems demand.', 'us', 92),
  ('defense_aerospace', 'Defense / Aerospace', 'industry_group', 'RTX', 'RTX Corp', 'stock', 'positive', 'negative', 'RTX has defense and aerospace exposure that can matter when military risk or procurement expectations rise.', 'us', 88),
  ('defense_aerospace', 'Defense / Aerospace', 'industry_group', 'GD', 'General Dynamics', 'stock', 'positive', 'negative', 'General Dynamics has defense and naval exposure that can become relevant in military-risk scenarios.', 'us', 85),

  ('cruise_caribbean_travel', 'Cruise Operators / Caribbean Travel', 'industry_group', 'CCL', 'Carnival', 'stock', 'negative', 'positive', 'Cruise operators can be pressured by Caribbean route uncertainty, weaker booking sentiment or higher operating risk.', 'us', 94),
  ('cruise_caribbean_travel', 'Cruise Operators / Caribbean Travel', 'industry_group', 'RCL', 'Royal Caribbean', 'stock', 'negative', 'positive', 'Royal Caribbean has direct cruise exposure and can be sensitive to Caribbean travel risk and booking sentiment.', 'us', 92),
  ('cruise_caribbean_travel', 'Cruise Operators / Caribbean Travel', 'industry_group', 'NCLH', 'Norwegian Cruise Line', 'stock', 'negative', 'positive', 'Norwegian Cruise Line can be sensitive to Caribbean itinerary uncertainty and travel demand risk.', 'us', 89),

  ('airlines_transport', 'Airlines / Transport', 'industry_group', 'DAL', 'Delta Air Lines', 'stock', 'negative', 'positive', 'Airlines can be pressured by route uncertainty, fuel costs, insurance costs and weaker travel sentiment.', 'us', 88),
  ('airlines_transport', 'Airlines / Transport', 'industry_group', 'UAL', 'United Airlines', 'stock', 'negative', 'positive', 'United Airlines can be sensitive to route disruption, risk sentiment and operating-cost pressure.', 'us', 86),
  ('airlines_transport', 'Airlines / Transport', 'industry_group', 'AAL', 'American Airlines', 'stock', 'negative', 'positive', 'American Airlines can be sensitive to travel sentiment, costs and route uncertainty.', 'us', 84),
  ('airlines_transport', 'Airlines / Transport', 'industry_group', 'LUV', 'Southwest Airlines', 'stock', 'negative', 'positive', 'Southwest can be affected if travel risk or fuel costs pressure airline margins.', 'us', 78),

  ('safe_havens_gold', 'Safe Havens / Gold', 'theme', 'GLD', 'Gold ETF', 'commodity', 'positive', 'negative', 'Gold proxies can benefit when investors seek safe havens during geopolitical escalation.', 'global', 96),
  ('safe_havens_gold', 'Safe Havens / Gold', 'theme', 'Gold', 'Gold', 'commodity', 'positive', 'negative', 'Gold can benefit when geopolitical risk raises safe-haven demand.', 'global', 90),
  ('safe_havens_gold', 'Safe Havens / Gold', 'theme', 'DXY', 'US Dollar Index', 'currency', 'positive', 'neutral', 'The dollar can act as a defensive currency, though the reaction depends on rates, energy prices and relative risk appetite.', 'global', 82),

  ('oil_energy_prices', 'Oil Prices / Energy Prices', 'theme', 'Brent', 'Brent Crude', 'commodity', 'positive', 'negative', 'Brent crude can move with geopolitical supply-risk premia and shipping-risk perceptions.', 'global', 95),
  ('oil_energy_prices', 'Oil Prices / Energy Prices', 'theme', 'WTI', 'WTI Crude', 'commodity', 'positive', 'negative', 'WTI crude can move with oil supply-risk premia and inflation expectations.', 'global', 90),
  ('oil_energy_prices', 'Oil Prices / Energy Prices', 'theme', 'USO', 'United States Oil Fund', 'commodity', 'positive', 'negative', 'USO is a crude-oil proxy for monitoring the oil-price channel.', 'us', 88),

  ('bonds_duration_rates', 'Bonds / Duration / Rates', 'theme', 'TLT', 'Long-duration US Treasuries', 'bond', 'negative', 'positive', 'Long-duration Treasuries can be pressured by inflation shocks and supported when risk or inflation premia ease.', 'us', 94),
  ('bonds_duration_rates', 'Bonds / Duration / Rates', 'theme', 'BND', 'Broad bond market', 'bond', 'mixed', 'positive', 'Broad bonds can reflect the balance between inflation risk, growth fears and safe-haven demand.', 'us', 82),
  ('bonds_duration_rates', 'Bonds / Duration / Rates', 'theme', 'US10Y', 'US 10Y Treasury Yield', 'rate', 'positive', 'negative', 'The 10-year yield can rise with inflation/risk premia and fall if inflation expectations ease.', 'us', 85),

  ('broad_us_equities_risk', 'Broad US Equities / Risk Sentiment', 'theme', 'SPY', 'S&P 500 ETF', 'index', 'negative', 'positive', 'Broad equities can be pressured by risk-off moves and supported when geopolitical risk eases.', 'us', 88),
  ('broad_us_equities_risk', 'Broad US Equities / Risk Sentiment', 'theme', 'QQQ', 'Nasdaq 100 ETF', 'index', 'negative', 'positive', 'Growth-heavy equities can be sensitive to risk appetite and rate expectations.', 'us', 84),
  ('broad_us_equities_risk', 'Broad US Equities / Risk Sentiment', 'theme', 'IWM', 'Russell 2000 ETF', 'index', 'negative', 'positive', 'Small caps can be sensitive to domestic risk appetite, funding conditions and broad equity sentiment.', 'us', 78),

  ('emerging_markets_latam', 'Emerging Markets / LatAm Risk', 'theme', 'EEM', 'Emerging Markets ETF', 'index', 'negative', 'positive', 'Emerging markets can be pressured when regional risk or dollar strength rises.', 'global', 80),
  ('emerging_markets_latam', 'Emerging Markets / LatAm Risk', 'theme', 'EWZ', 'Brazil ETF', 'index', 'negative', 'positive', 'Brazil exposure can matter for LatAm risk sentiment and regional spillovers.', 'latam', 76),
  ('emerging_markets_latam', 'Emerging Markets / LatAm Risk', 'theme', 'EWW', 'Mexico ETF', 'index', 'negative', 'positive', 'Mexico exposure can matter when regional risk affects LatAm sentiment or North American trade perceptions.', 'latam', 74)
on conflict (exposure_key, candidate_asset) do update
set
  exposure_label = excluded.exposure_label,
  exposure_type = excluded.exposure_type,
  candidate_name = excluded.candidate_name,
  asset_class = excluded.asset_class,
  default_direction_escalation = excluded.default_direction_escalation,
  default_direction_deescalation = excluded.default_direction_deescalation,
  rationale = excluded.rationale,
  region = excluded.region,
  priority = excluded.priority,
  is_active = true;
