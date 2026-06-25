export const genericExposureLabels = new Set([
  "regional security dynamics",
  "governance",
  "policy",
  "market impact",
  "sector",
  "demand",
  "consumer spending",
  "regional dynamics",
  "economy",
  "business",
  "geopolitics",
  "theme",
  "consumer",
  "investor sentiment",
  "market dynamics"
]);

export const sectorEtfs = new Set([
  "XLE",
  "XLI",
  "XLY",
  "XLB",
  "XLK",
  "XLRE",
  "XLU",
  "XLF",
  "XLV",
  "XLP"
]);

const weakDirectTickers = new Set([
  "RACE",
  "MC.PA",
  "LVMH",
  "RMS.PA",
  "CRWD",
  "PANW",
  "V",
  "MA",
  "ASML",
  "TSM",
  "TSMC"
]);

const broadEquityTickers = new Set(["SPY", "QQQ", "DIA", "IWM", "DAX", "SX5E", "EURO STOXX 50"]);
const oilTickers = new Set(["BRENT CRUDE", "BRENT", "WTI CRUDE", "WTI", "USO", "BNO", "CL=F", "BZ=F"]);
const safeHavenTickers = new Set(["GLD", "GOLD", "XAU", "XAU/USD"]);
const ratesTickers = new Set(["TLT", "IEF", "SHY", "US10Y", "10Y", "BND"]);
const usdTickers = new Set(["DXY", "USD", "EUR/USD", "USD/JPY"]);
const airlineTickers = new Set(["DAL", "UAL", "AAL", "LHA.DE", "IAG.L", "RYAAY"]);
const tankerTickers = new Set(["FRO", "STNG", "TNK", "DHT"]);
const defenseTickers = new Set(["LMT", "RTX", "NOC", "GD", "RHM.DE"]);
const semiAiTickers = new Set(["NVDA", "AMD", "AVGO", "SOXX", "SMH"]);

const marketSpecificTerms = [
  "oil",
  "crude",
  "brent",
  "wti",
  "shipping",
  "hormuz",
  "insurance",
  "war-risk",
  "tanker",
  "jet fuel",
  "airline",
  "inflation",
  "rates",
  "yield",
  "treasury",
  "duration",
  "gold",
  "safe-haven",
  "defense",
  "risk premium",
  "risk assets",
  "dollar",
  "guidance",
  "margin",
  "data-center",
  "hyperscaler",
  "capex",
  "semiconductor"
];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value) {
  return String(value ?? "").trim();
}

function lower(value) {
  return clean(value).toLowerCase();
}

function normalizeTicker(value) {
  const ticker = clean(value).toUpperCase();
  if (ticker === "BRENT") return "BRENT CRUDE";
  if (ticker === "WTI") return "WTI CRUDE";
  return ticker;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function pathItems(output, path) {
  let cursor = output;
  for (const part of path) {
    cursor = cursor?.[part];
  }
  return asArray(cursor);
}

export function normalizeGeneratorOutput(output) {
  const generated = output?.generated || output?.node || {};
  const directImpact = asArray(output?.direct_impact).length
    ? asArray(output.direct_impact)
    : asArray(output?.affected_assets_inserted).length
      ? asArray(output.affected_assets_inserted)
      : pathItems(output, ["app_facing_sections", "direct_impact", "items"]).length
        ? pathItems(output, ["app_facing_sections", "direct_impact", "items"])
        : asArray(generated?.affected_assets);

  const indirectImpact = asArray(output?.indirect_impact).length
    ? asArray(output.indirect_impact)
    : asArray(output?.second_order_watchlist).length
      ? asArray(output.second_order_watchlist)
      : pathItems(output, ["app_facing_sections", "indirect_impact", "items"]).length
        ? pathItems(output, ["app_facing_sections", "indirect_impact", "items"])
        : asArray(generated?.indirect_impact);

  const exposures = asArray(output?.final_exposures_inserted).length
    ? asArray(output.final_exposures_inserted)
    : asArray(output?.exposures_inserted).length
      ? asArray(output.exposures_inserted)
      : asArray(output?.assets_to_research).length
        ? asArray(output.assets_to_research)
        : asArray(generated?.assets_to_research);

  const causalChains = asArray(generated?.causal_chain).length
    ? asArray(generated.causal_chain)
    : asArray(output?.causal_chain);

  return {
    raw: output || {},
    generated,
    category: clean(generated.category || output?.category || output?.event_classification?.category),
    eventType: clean(generated.event_type || output?.event_type || output?.event_classification?.event_type),
    eventStatus: clean(generated.event_status || output?.event_status || output?.status),
    status: clean(output?.status || generated.status),
    publishBlocked: output?.publish_blocked === true || output?.publishing_safety?.passed === false,
    directImpact,
    indirectImpact,
    exposures,
    whyItMatters: clean(generated.why_matters || output?.why_it_matters || output?.why_matters),
    causalChains,
    warnings: asArray(output?.warnings)
  };
}

function itemText(item) {
  if (!item || typeof item !== "object") return clean(item);
  return [
    item.ticker,
    item.ticker_or_asset,
    item.symbol,
    item.name,
    item.company,
    item.channel,
    item.theme,
    item.title,
    item.reason,
    item.why_relevant,
    item.explanation,
    item.uncertainty,
    item.evidence_required_to_upgrade
  ].map(clean).join(" ");
}

function itemTicker(item) {
  return normalizeTicker(item?.ticker || item?.ticker_or_asset || item?.symbol || item?.canonical_asset || item?.name);
}

function exposureTitle(exposure) {
  return clean(exposure?.theme || exposure?.exposure_label || exposure?.title || exposure?.name);
}

function exposureReason(exposure) {
  return clean(exposure?.why_relevant || exposure?.reason || exposure?.explanation || exposure?.data_needed);
}

function textHasAny(value, terms) {
  const text = lower(value);
  return terms.some((term) => text.includes(lower(term)));
}

function countTerms(value, terms) {
  const text = lower(value);
  return unique(terms.filter((term) => text.includes(lower(term)))).length;
}

function directChannelsForItem(item) {
  const ticker = itemTicker(item);
  const text = lower(itemText(item));
  const channels = new Set();

  if (oilTickers.has(ticker) || textHasAny(text, ["brent", "wti", "crude", "oil", "lng", "energy", "fuel"])) channels.add("oil_energy");
  if (safeHavenTickers.has(ticker) || textHasAny(text, ["gold", "safe haven", "safe-haven"])) channels.add("safe_haven");
  if (ratesTickers.has(ticker) || textHasAny(text, ["treasury", "yield", "rates", "rate-cut", "duration", "bond"])) channels.add("rates_duration");
  if (broadEquityTickers.has(ticker) || textHasAny(text, ["s&p", "nasdaq", "qqq", "spy", "risk-on", "risk assets", "broad equity", "dax", "euro stoxx"])) channels.add("broad_equity");
  if (usdTickers.has(ticker) || textHasAny(text, ["dxy", "usd", "dollar", "currency", "fx"])) channels.add("usd_fx");
  if (airlineTickers.has(ticker) || textHasAny(text, ["airline", "travel", "jet fuel", "fuel cost"])) channels.add("airline_travel");
  if (tankerTickers.has(ticker) || textHasAny(text, ["tanker", "shipping", "war-risk insurance", "marine insurance", "rerouting"])) channels.add("tanker_shipping");
  if (defenseTickers.has(ticker) || textHasAny(text, ["defense", "aerospace", "procurement", "military premium"])) channels.add("defense");
  if (semiAiTickers.has(ticker) || textHasAny(text, ["semiconductor", "ai", "data-center", "data center", "hyperscaler", "capex", "gpu"])) channels.add("semiconductors_ai");

  if (channels.has("safe_haven") || channels.has("rates_duration") || channels.has("broad_equity") || channels.has("usd_fx")) {
    channels.add("safe_haven_rates_or_risk");
  }
  if (channels.has("airline_travel") || channels.has("tanker_shipping") || channels.has("defense")) {
    channels.add("travel_airline_tanker_or_defense");
  }

  return channels;
}

function directHasChannel(ctx, channel) {
  return ctx.directImpact.some((item) => directChannelsForItem(item).has(channel));
}

function directHasAnyAsset(ctx, assets) {
  const normalizedAssets = assets.map(normalizeTicker);
  return ctx.directImpact.some((item) => {
    const ticker = itemTicker(item);
    const text = clean(itemText(item)).toUpperCase();
    return normalizedAssets.some((asset) => ticker === asset || text.includes(asset));
  });
}

function isGenericExposure(exposure) {
  return genericExposureLabels.has(lower(exposureTitle(exposure)));
}

function check(name, passed, reason, skipped = false) {
  return { name, passed: Boolean(passed), skipped: Boolean(skipped), reason: passed ? "" : reason };
}

function checkTextAny(name, value, terms, minCount = 1) {
  const matched = countTerms(value, terms);
  return check(name, matched >= minCount, `Expected at least ${minCount} of [${terms.join(", ")}], found ${matched}.`);
}

export function validateFixtureContract(fixture) {
  const errors = [];
  if (!fixture || typeof fixture !== "object") errors.push("Fixture is not an object.");
  if (!clean(fixture?.name)) errors.push("Missing fixture name.");
  if (!clean(fixture?.input?.raw_event_text)) errors.push("Missing input.raw_event_text.");
  if (!fixture?.expected || typeof fixture.expected !== "object") errors.push("Missing expected object.");
  if (fixture?.expected?.min_direct_impact_count != null && Number(fixture.expected.min_direct_impact_count) < 0) {
    errors.push("min_direct_impact_count must be non-negative.");
  }
  if (fixture?.expected?.required_direct_channels && !Array.isArray(fixture.expected.required_direct_channels)) {
    errors.push("required_direct_channels must be an array.");
  }
  return {
    passed: errors.length === 0,
    errors
  };
}

export function evaluateFixtureOutput(fixture, output) {
  const expected = fixture.expected || {};
  const ctx = normalizeGeneratorOutput(output);
  const checks = [];

  if (expected.category) {
    checks.push(check("eventTypeMatchesInput.category", lower(ctx.category) === lower(expected.category), `Expected category ${expected.category}, got ${ctx.category || "(empty)"}.`));
  }
  if (expected.category_any) {
    checks.push(check("eventTypeMatchesInput.categoryAny", expected.category_any.some((item) => lower(ctx.category).includes(lower(item))), `Expected category to include one of [${expected.category_any.join(", ")}], got ${ctx.category || "(empty)"}.`));
  }
  if (expected.event_type_any) {
    checks.push(check("eventTypeMatchesInput.eventType", expected.event_type_any.some((item) => lower(ctx.eventType).includes(lower(item))), `Expected event_type to include one of [${expected.event_type_any.join(", ")}], got ${ctx.eventType || "(empty)"}.`));
  }
  if (expected.event_status_any) {
    checks.push(check("eventTypeMatchesInput.eventStatus", expected.event_status_any.some((item) => lower(ctx.eventStatus).includes(lower(item))), `Expected event_status/status to include one of [${expected.event_status_any.join(", ")}], got ${ctx.eventStatus || "(empty)"}.`));
  }

  if (expected.min_direct_impact_count != null) {
    checks.push(check("directImpactNotEmpty", ctx.directImpact.length >= Number(expected.min_direct_impact_count), `Expected Direct Impact count >= ${expected.min_direct_impact_count}, got ${ctx.directImpact.length}.`));
  }
  if (expected.max_direct_impact_count != null) {
    checks.push(check("directImpactCompact", ctx.directImpact.length <= Number(expected.max_direct_impact_count), `Expected Direct Impact count <= ${expected.max_direct_impact_count}, got ${ctx.directImpact.length}.`));
  }
  if (expected.min_indirect_impact_count != null) {
    checks.push(check("indirectImpactNotTooNarrow", ctx.indirectImpact.length >= Number(expected.min_indirect_impact_count), `Expected Indirect Impact count >= ${expected.min_indirect_impact_count}, got ${ctx.indirectImpact.length}.`));
  }
  if (expected.min_exposures_count != null) {
    checks.push(check("exposuresPresent", ctx.exposures.length >= Number(expected.min_exposures_count), `Expected Exposures count >= ${expected.min_exposures_count}, got ${ctx.exposures.length}.`));
  }

  for (const channel of asArray(expected.required_direct_channels)) {
    checks.push(check(`requiredDirectChannel.${channel}`, directHasChannel(ctx, channel), `Missing required Direct Impact channel: ${channel}.`));
  }

  if (expected.direct_must_include_any_assets) {
    checks.push(check("directMustIncludeAnyAssets", directHasAnyAsset(ctx, expected.direct_must_include_any_assets), `Direct Impact must include one of [${expected.direct_must_include_any_assets.join(", ")}].`));
  }

  checks.push(check("noUnknownAssets", ctx.directImpact.every((item) => {
    const ticker = itemTicker(item);
    return ticker && !["UNKNOWN", "N/A", "NA", "NONE", "TBD", "UNVERIFIED"].includes(ticker);
  }), "Direct Impact contains an unknown or placeholder asset."));

  if (expected.forbidden_generic_exposure_labels) {
    const generic = ctx.exposures.filter(isGenericExposure).map(exposureTitle);
    checks.push(check("noGenericExposureLabels", generic.length === 0, `Generic exposure labels found: ${generic.join(", ")}.`));
  }

  if (expected.sector_etfs_only_in_exposures) {
    const directSectorEtfs = ctx.directImpact.map(itemTicker).filter((ticker) => sectorEtfs.has(ticker));
    checks.push(check("sectorETFsOnlyInExposures", directSectorEtfs.length === 0, `Sector ETFs found in Direct Impact: ${directSectorEtfs.join(", ")}.`));
  }

  if (expected.weak_company_links_not_direct) {
    const weakDirect = ctx.directImpact.map(itemTicker).filter((ticker) => weakDirectTickers.has(ticker));
    checks.push(check("weakCompanyLinksNotDirect", weakDirect.length === 0, `Weak or conditional company links found in Direct Impact: ${weakDirect.join(", ")}.`));
  }

  if (expected.why_it_matters_terms_any) {
    checks.push(checkTextAny("whyItMattersIsSpecific", ctx.whyItMatters, expected.why_it_matters_terms_any, Number(expected.why_it_matters_min_terms || 1)));
  }

  if (expected.causal_chains_market_specific) {
    const chainText = ctx.causalChains.map(itemText).join(" ");
    checks.push(check("causalChainsAreSpecific", ctx.causalChains.length > 0 && textHasAny(chainText, marketSpecificTerms), "Causal chains are missing or do not include market-specific mechanisms."));
  }

  if (expected.requires_deescalation_inverse_risk_premium) {
    const combined = [
      ctx.whyItMatters,
      ctx.directImpact.map(itemText).join(" "),
      ctx.exposures.map(itemText).join(" "),
      ctx.causalChains.map(itemText).join(" ")
    ].join(" ");
    checks.push(check("deescalationHasInverseRiskPremiumChannels", textHasAny(combined, ["risk premium unwind", "de-escalation", "ceasefire", "insurance normalization", "shipping safety", "safe-haven unwind", "defense premium"]), "Missing inverse risk-premium de-escalation channels."));
  }

  if (expected.requires_concrete_oil_shipping_insurance_channel) {
    const combined = [
      ctx.directImpact.map(itemText).join(" "),
      ctx.exposures.map(itemText).join(" "),
      ctx.causalChains.map(itemText).join(" ")
    ].join(" ");
    checks.push(check("escalationHasConcreteOilShippingInsuranceChannel", textHasAny(combined, ["brent", "crude", "oil", "hormuz", "shipping", "war-risk insurance", "marine insurance", "tanker"]), "Missing concrete oil/shipping/insurance channel."));
  }

  if (expected.upcoming_only_unless_manually_selected) {
    const statusText = `${ctx.eventType} ${ctx.eventStatus} ${ctx.status}`;
    checks.push(check("earningsRoutedToUpcomingUnlessMegaCap", textHasAny(statusText, ["upcoming", "scheduled", "earnings"]), `Expected upcoming/scheduled earnings routing, got ${statusText || "(empty)"}.`));
  }

  if (expected.not_top_event_by_default || expected.must_not_auto_publish) {
    checks.push(check("notPublishedIfQualityFails", lower(ctx.status) !== "published" && ctx.raw?.auto_published !== true, `Fixture must not auto-publish; status=${ctx.status || "(empty)"}.`));
  }

  if (expected.must_not_publish_if_direct_impact_empty && ctx.directImpact.length === 0) {
    checks.push(check("notPublishedIfQualityFails.emptyDirect", ctx.publishBlocked || lower(ctx.status).includes("draft") || lower(ctx.status).includes("failed"), "Direct Impact is empty but output is not publish-blocked/draft/failed."));
  }

  if (expected.no_broad_market_node) {
    const broadDirect = ctx.directImpact.map(itemTicker).filter((ticker) => broadEquityTickers.has(ticker));
    checks.push(check("noBroadMarketNode", broadDirect.length === 0, `Normal upcoming earnings should not create broad market Direct Impact: ${broadDirect.join(", ")}.`));
  }

  if (expected.exposure_terms_any) {
    checks.push(checkTextAny("exposureTitlesMatchReasons", ctx.exposures.map(itemText).join(" "), expected.exposure_terms_any, 1));
  } else if (ctx.exposures.length) {
    const mismatches = ctx.exposures.filter((exposure) => {
      const title = lower(exposureTitle(exposure));
      const reason = lower(exposureReason(exposure));
      if (!title || !reason) return false;
      const tokens = title.split(/[^a-z0-9]+/).filter((token) => token.length > 3 && !["risk", "assets", "watchlist"].includes(token));
      return tokens.length > 0 && !tokens.some((token) => reason.includes(token));
    }).map(exposureTitle);
    checks.push(check("exposureTitlesMatchReasons", mismatches.length === 0, `Exposure titles do not match their reasons: ${mismatches.join(", ")}.`));
  }

  if (expected.no_generic_earnings_text) {
    const combined = `${ctx.whyItMatters} ${ctx.causalChains.map(itemText).join(" ")} ${ctx.exposures.map(itemText).join(" ")}`;
    checks.push(check("noGenericEarningsText", textHasAny(combined, ["ai", "data-center", "data center", "hyperscaler", "capex", "margin", "guidance", "semiconductor"]), "Mega-cap earnings output is too generic."));
  }

  if (expected.no_irrelevant_company_watchlist) {
    const watchlistText = ctx.indirectImpact.map(itemTicker).join(" ");
    const irrelevant = ["RACE", "MC.PA", "RMS.PA", "CRWD", "PANW", "V", "MA"].filter((ticker) => watchlistText.includes(ticker));
    checks.push(check("noIrrelevantCompanyWatchlist", irrelevant.length === 0, `Irrelevant company watchlist names found: ${irrelevant.join(", ")}.`));
  }

  const passed = checks.every((result) => result.passed || result.skipped);
  return {
    passed,
    checks,
    summary: {
      direct_impact_count: ctx.directImpact.length,
      indirect_impact_count: ctx.indirectImpact.length,
      exposures_count: ctx.exposures.length,
      category: ctx.category,
      event_type: ctx.eventType,
      status: ctx.status,
      publish_blocked: ctx.publishBlocked
    }
  };
}

