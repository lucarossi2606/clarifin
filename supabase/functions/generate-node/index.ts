import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const assetTypeEnum = [
  "public_equity",
  "private_company",
  "etf_or_fund",
  "commodity",
  "currency",
  "rate",
  "index",
  "unknown",
];

const assetClassEnum = [
  "index",
  "bond",
  "commodity",
  "currency",
  "stock",
  "rate",
  "other",
];

const transmissionChannelEnum = [
  "governance",
  "capital_allocation",
  "AI_compute",
  "energy_infrastructure",
  "supply_chain",
  "demand",
  "margins",
  "pricing_power",
  "regulation",
  "rates",
  "FX",
  "commodities",
  "consumer_spending",
  "sector_readthrough",
  "private_public_market_link",
  "other",
];

const allowedCategories = [
  "Geopolitics",
  "Macro",
  "Central Banks",
  "Earnings",
  "Corporate",
  "Technology",
  "Energy",
  "Commodities",
  "Regulation",
  "Markets",
  "Consumer",
  "Financials",
  "Healthcare",
  "Real Estate",
  "Crypto",
  "Other",
];

const allowedEventTypes = [
  "Product Launch",
  "Merger / Acquisition",
  "Merger Speculation",
  "Strategic Partnership",
  "Capital Allocation",
  "Ownership / Governance",
  "Guidance Update",
  "Restructuring",
  "IPO / Listing",
  "Litigation",
  "Analyst Rating",
  "Economic Data Release",
  "Inflation Data",
  "Labor Market Data",
  "GDP Release",
  "Retail Sales",
  "PMI / ISM",
  "Rate Decision",
  "Central Bank Speech",
  "Policy Guidance",
  "Geopolitical Escalation",
  "Geopolitical De-escalation",
  "Conflict Risk",
  "Sanctions",
  "Trade Restrictions",
  "Shipping Disruption",
  "Energy Security",
  "Diplomatic Negotiation",
  "Commodity Price Move",
  "Oil Supply Shock",
  "Gas / LNG Supply",
  "Currency Move",
  "Bond Yield Move",
  "Equity Market Move",
  "Credit Stress",
  "Liquidity Event",
  "AI Infrastructure",
  "Semiconductor Supply Chain",
  "Cloud / Software Demand",
  "Cybersecurity Event",
  "Data Center / Power Demand",
  "Earnings Release",
  "Earnings Preview",
  "Earnings Guidance",
  "Margin Update",
  "Revenue Update",
  "Regulatory Action",
  "Antitrust",
  "Export Controls",
  "Tax / Subsidy Policy",
  "Environmental Regulation",
  "Other",
];

const allowedEventStatuses = [
  "confirmed",
  "scheduled",
  "report",
  "speculation",
  "rumor",
  "denied",
  "mixed_reports",
  "unknown",
];

const nodeSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "category",
    "event_type",
    "event_status",
    "short",
    "impact",
    "confidence",
    "timestamp",
    "region",
    "why_matters",
    "affected_assets",
    "causal_chain",
    "scenarios",
    "counterarguments",
    "sources",
  ],
  properties: {
    title: { type: "string" },
    category: { type: "string", enum: allowedCategories },
    event_type: { type: "string", enum: allowedEventTypes },
    event_status: { type: "string", enum: allowedEventStatuses },
    short: { type: "string" },
    impact: { type: "integer", minimum: 0, maximum: 100 },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    timestamp: { type: "string" },
    region: { type: "string" },
    why_matters: { type: "string" },
    affected_assets: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["ticker_or_asset", "ticker", "name", "asset_class", "direction", "strength", "reason", "evidence", "uncertainty"],
        properties: {
          ticker_or_asset: { type: "string" },
          ticker: { type: "string" },
          name: { type: "string" },
          asset_class: { type: "string", enum: assetClassEnum },
          direction: { type: "string", enum: ["positive", "negative", "mixed", "neutral"] },
          strength: { type: "string" },
          reason: { type: "string" },
          evidence: { type: "string" },
          uncertainty: { type: "string" },
        },
      },
    },
    causal_chain: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "event", "mechanism", "sector_impact", "asset_impact", "watch"],
        properties: {
          title: { type: "string" },
          event: { type: "string" },
          mechanism: { type: "string" },
          sector_impact: { type: "string" },
          asset_impact: { type: "string" },
          watch: { type: "string" },
        },
      },
    },
    scenarios: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "body"],
        properties: {
          title: { type: "string" },
          body: { type: "string" },
        },
      },
    },
    counterarguments: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: { type: "string" },
    },
    sources: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string" },
    },
  },
};

const researchPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "event_classification",
    "entities",
    "transmission_channels",
    "potentially_affected_assets_to_research",
    "research_questions",
    "data_needed_before_strong_conclusion",
    "known_from_input",
    "not_known_from_input",
    "hallucination_risks",
    "assumptions_that_must_not_be_made",
  ],
  properties: {
    event_classification: {
      type: "object",
      additionalProperties: false,
      required: ["category", "event_type", "event_status", "time_sensitivity", "primary_theme", "secondary_themes"],
      properties: {
        category: { type: "string", enum: allowedCategories },
        event_type: { type: "string", enum: allowedEventTypes },
        event_status: { type: "string", enum: allowedEventStatuses },
        time_sensitivity: { type: "string", enum: ["immediate", "near_term", "long_term", "unknown"] },
        primary_theme: { type: "string" },
        secondary_themes: { type: "array", items: { type: "string" } },
      },
    },
    entities: {
      type: "object",
      additionalProperties: false,
      required: [
        "directly_mentioned_companies",
        "private_companies_or_entities",
        "public_tickers_mentioned",
        "people_mentioned",
        "products_or_business_lines",
        "geographies",
      ],
      properties: {
        directly_mentioned_companies: { type: "array", items: { type: "string" } },
        private_companies_or_entities: { type: "array", items: { type: "string" } },
        public_tickers_mentioned: { type: "array", items: { type: "string" } },
        people_mentioned: { type: "array", items: { type: "string" } },
        products_or_business_lines: { type: "array", items: { type: "string" } },
        geographies: { type: "array", items: { type: "string" } },
      },
    },
    transmission_channels: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "channel",
          "mechanism",
          "directly_affected_entities",
          "indirectly_affected_entities_to_research",
          "possible_public_assets_to_check",
          "time_horizon",
          "confidence",
          "missing_data",
        ],
        properties: {
          channel: { type: "string", enum: transmissionChannelEnum },
          mechanism: { type: "string" },
          directly_affected_entities: { type: "array", items: { type: "string" } },
          indirectly_affected_entities_to_research: { type: "array", items: { type: "string" } },
          possible_public_assets_to_check: { type: "array", items: { type: "string" } },
          time_horizon: { type: "string", enum: ["immediate", "near_term", "long_term"] },
          confidence: { type: "integer", minimum: 0, maximum: 100 },
          missing_data: { type: "array", items: { type: "string" } },
        },
      },
    },
    potentially_affected_assets_to_research: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["asset_or_ticker", "asset_type", "why_it_might_matter", "evidence_from_input", "needs_verification"],
        properties: {
          asset_or_ticker: { type: "string" },
          asset_type: { type: "string", enum: assetTypeEnum },
          why_it_might_matter: { type: "string" },
          evidence_from_input: { type: "string" },
          needs_verification: { type: "boolean" },
        },
      },
    },
    research_questions: { type: "array", items: { type: "string" } },
    data_needed_before_strong_conclusion: { type: "array", items: { type: "string" } },
    known_from_input: { type: "array", items: { type: "string" } },
    not_known_from_input: { type: "array", items: { type: "string" } },
    hallucination_risks: { type: "array", items: { type: "string" } },
    assumptions_that_must_not_be_made: { type: "array", items: { type: "string" } },
  },
};

const finalDraftSchema = {
  type: "object",
  additionalProperties: false,
  required: ["node", "evidence_map", "affected_asset_validation", "assets_to_research", "quality_gate", "missing_data", "warnings"],
  properties: {
    node: nodeSchema,
    evidence_map: {
      type: "array",
      minItems: 3,
      maxItems: 16,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claim", "classification", "support", "final_node_usage"],
        properties: {
          claim: { type: "string" },
          classification: {
            type: "string",
            enum: ["input_fact", "source_fact", "market_reaction", "inference", "unverified", "missing"],
          },
          support: { type: "string" },
          final_node_usage: { type: "string" },
        },
      },
    },
    affected_asset_validation: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "ticker_or_asset",
          "asset_type",
          "tradability",
          "direction",
          "time_horizon",
          "evidence_type",
          "evidence",
          "reason",
          "uncertainty",
          "confidence",
        ],
        properties: {
          ticker_or_asset: { type: "string" },
          asset_type: { type: "string", enum: assetTypeEnum },
          tradability: {
            type: "string",
            enum: ["directly_tradable", "indirectly_tradable", "private_not_directly_tradable", "unknown"],
          },
          direction: { type: "string", enum: ["positive", "negative", "mixed", "neutral"] },
          time_horizon: { type: "string", enum: ["immediate", "near_term", "long_term"] },
          evidence_type: {
            type: "string",
            enum: [
              "direct_mention",
              "market_reaction",
              "explicit_source_link",
              "causal_chain",
              "peer_readthrough",
              "user_mentioned_ticker_needs_verification",
              "insufficient",
            ],
          },
          evidence: { type: "string" },
          reason: { type: "string" },
          uncertainty: { type: "string" },
          confidence: { type: "integer", minimum: 0, maximum: 100 },
        },
      },
    },
    assets_to_research: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "theme",
          "sector_or_theme_type",
          "why_relevant",
          "sector_proxy_tickers",
          "direction_hint",
          "possible_tickers_to_check",
          "data_needed",
          "time_horizon",
          "confidence",
        ],
        properties: {
          theme: { type: "string" },
          sector_or_theme_type: { type: "string" },
          why_relevant: { type: "string" },
          sector_proxy_tickers: { type: "array", items: { type: "string" } },
          possible_tickers_to_check: { type: "array", items: { type: "string" } },
          direction_hint: { type: "string", enum: ["positive", "negative", "mixed", "neutral", "watch"] },
          data_needed: { type: "string" },
          time_horizon: { type: "string" },
          confidence: { type: "integer", minimum: 0, maximum: 100 },
        },
      },
    },
    quality_gate: {
      type: "object",
      additionalProperties: false,
      required: ["passed", "checks", "revisions_made", "summary"],
      properties: {
        passed: { type: "boolean" },
        checks: {
          type: "array",
          minItems: 10,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["check", "passed", "notes"],
            properties: {
              check: { type: "string" },
              passed: { type: "boolean" },
              notes: { type: "string" },
            },
          },
        },
        revisions_made: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
      },
    },
    missing_data: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
  },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function cleanStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required Supabase secret: ${name}`);
  return value;
}

function clampScore(value: unknown, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function normalizeScore(value: unknown, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  // The model can sometimes answer on a 1-5 scale despite the schema saying 0-100.
  if (number > 0 && number <= 5) return clampScore(number * 10, fallback);
  return clampScore(number, fallback);
}

function safeDirection(value: unknown) {
  const direction = String(value || "mixed").toLowerCase();
  if (["positive", "negative", "mixed", "neutral"].includes(direction)) return direction;
  return "mixed";
}

function isKnownRegionTicker(ticker: string) {
  const normalized = String(ticker || "").trim().toUpperCase();
  const knownEuropean = new Set(["RACE", "LVMH", "MC.PA", "RMS.PA", "KER.PA", "ASML", "SAP", "VNA", "RHM"]);
  const knownUs = new Set([
    "AAPL",
    "MSFT",
    "NVDA",
    "AMZN",
    "META",
    "GOOGL",
    "GOOG",
    "TSLA",
    "JPM",
    "GS",
    "COST",
    "NKE",
    "FDX",
    "ADBE",
  ]);

  return knownEuropean.has(normalized)
    || knownUs.has(normalized)
    || normalized.endsWith(".PA")
    || normalized.endsWith(".DE")
    || normalized.endsWith(".AS")
    || normalized.endsWith(".MI");
}

function normalizeTaxonomyValue(value: unknown, allowed: string[], fallback: string) {
  const raw = String(value || "").trim();
  const exact = allowed.find((item) => item === raw);
  if (exact) return exact;
  const comparable = raw.toLowerCase().replace(/[\s_/-]+/g, " ").trim();
  const loose = allowed.find((item) => item.toLowerCase().replace(/[\s_/-]+/g, " ").trim() === comparable);
  return loose || fallback;
}

function normalizeCategory(value: unknown) {
  return normalizeTaxonomyValue(value, allowedCategories, "Other");
}

function normalizeEventType(value: unknown) {
  return normalizeTaxonomyValue(value, allowedEventTypes, "Other");
}

function normalizeEventStatus(value: unknown) {
  return normalizeTaxonomyValue(value, allowedEventStatuses, "unknown");
}
function normalizeGeneratedRegion(generated: Record<string, unknown>) {
  const affectedAssets = Array.isArray(generated.affected_assets) ? generated.affected_assets : [];
  const primaryAsset = affectedAssets[0] as Record<string, unknown> | undefined;
  const ticker = String(primaryAsset?.ticker || "").trim().toUpperCase();
  const name = String(primaryAsset?.name || "").trim().toLowerCase();

  const europeanAssets = new Set(["RACE", "LVMH", "MC.PA", "RMS.PA", "KER.PA", "ASML", "SAP", "VNA", "RHM"]);
  const usAssets = new Set([
    "AAPL",
    "MSFT",
    "NVDA",
    "AMZN",
    "META",
    "GOOGL",
    "GOOG",
    "TSLA",
    "JPM",
    "GS",
    "COST",
    "NKE",
    "FDX",
    "ADBE",
  ]);

  // Region describes the primary market exposure, not where products are sold.
  if (europeanAssets.has(ticker) || ticker.endsWith(".PA") || ticker.endsWith(".DE") || ticker.endsWith(".AS") || ticker.endsWith(".MI")) {
    return "eu";
  }
  if (usAssets.has(ticker)) return "us";

  const normalizedRegion = String(generated.region || "global").trim().toLowerCase();
  if (["us", "usa", "united states", "america", "united states of america"].includes(normalizedRegion)) return "us";
  if (["eu", "europe", "eurozone", "ecb", "european union"].includes(normalizedRegion)) return "eu";
  return "global";
}

function applyTaxonomyGuardrails(plan: Record<string, unknown>, rawEventText: string) {
  const classification = plan.event_classification as Record<string, unknown> | undefined;
  if (!classification) return;

  classification.category = normalizeCategory(classification.category);
  classification.event_type = normalizeEventType(classification.event_type);
  classification.event_status = normalizeEventStatus(classification.event_status);

  const raw = rawEventText.toLowerCase();
  const hasReportedSource = /\b(reportedly|according to|report says|reported|source says|sources say)\b/.test(raw);
  const hasPossibilityLanguage = /\b(possibility|possible|discussed|discussion|considering|exploring|speculation|rumor|rumour)\b/.test(raw);
  const hasCombinationLanguage = /\b(combin\w*|merger|merge|acquisition|takeover|deal)\b/.test(raw);
  const hasDenialLanguage = /\b(denied|denies|denial|officials denied|mixed reports)\b/.test(raw);
  const hasDeEscalationLanguage = /\b(de-escalation|deescalation|ceasefire|agreement|deal to reduce tensions|diplomatic talks|negotiation)\b/.test(raw);
  const hasEscalationLanguage = /\b(escalation|attack|strike|invasion|conflict risk|sanctions|shipping disruption|blockade)\b/.test(raw);

  if (hasCombinationLanguage && hasPossibilityLanguage) {
    classification.category = "Corporate";
    classification.event_type = "Merger Speculation";
    classification.event_status = hasReportedSource ? "report" : "speculation";
  }

  if (hasDeEscalationLanguage && (classification.category === "Geopolitics" || raw.includes("iran") || raw.includes("conflict") || raw.includes("tensions"))) {
    classification.category = "Geopolitics";
    classification.event_type = "Geopolitical De-escalation";
    if (hasDenialLanguage) classification.event_status = "mixed_reports";
    else if (hasReportedSource) classification.event_status = "report";
  } else if (hasEscalationLanguage && classification.category === "Geopolitics") {
    classification.event_type = "Geopolitical Escalation";
    if (hasReportedSource && classification.event_status === "unknown") classification.event_status = "report";
  }

  plan.event_classification = classification;
}
function summarizeResearchPlan(plan: Record<string, unknown>) {
  const classification = plan.event_classification as Record<string, unknown> | undefined;
  const entities = plan.entities as Record<string, unknown> | undefined;
  const transmissionChannels = Array.isArray(plan.transmission_channels) ? plan.transmission_channels : [];
  return {
    category: classification?.category || "Other",
    event_type: classification?.event_type || "Other",
    event_status: classification?.event_status || "unknown",
    time_sensitivity: classification?.time_sensitivity || "unknown",
    primary_theme: classification?.primary_theme || "",
    public_tickers_mentioned: entities?.public_tickers_mentioned || [],
    companies_mentioned: entities?.directly_mentioned_companies || [],
    transmission_channels_count: transmissionChannels.length,
    transmission_channel_names: transmissionChannels
      .map((channel: unknown) => String((channel as Record<string, unknown>)?.channel || "").trim())
      .filter(Boolean),
    research_questions_count: Array.isArray(plan.research_questions) ? plan.research_questions.length : 0,
  };
}

function summarizeQualityGate(qualityGate: Record<string, unknown>) {
  const checks = Array.isArray(qualityGate.checks) ? qualityGate.checks as Record<string, unknown>[] : [];
  const failedChecks = checks
    .filter((check) => check.passed === false)
    .map((check) => String(check.check || "").trim())
    .filter(Boolean);

  return {
    passed: Boolean(qualityGate.passed),
    failed_checks: failedChecks,
    summary: String(qualityGate.summary || ""),
  };
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function normalizeComparable(value: unknown) {
  return String(value || "").trim().toUpperCase();
}

function appendMissingData(validatedDraft: Record<string, unknown>, items: string[]) {
  const existing = Array.isArray(validatedDraft.missing_data) ? validatedDraft.missing_data : [];
  validatedDraft.missing_data = uniqueStrings([...existing, ...items]);
}

function getTransmissionChannels(plan: Record<string, unknown>) {
  return Array.isArray(plan.transmission_channels) ? plan.transmission_channels as Record<string, unknown>[] : [];
}

function addTransmissionChannel(plan: Record<string, unknown>, channel: Record<string, unknown>) {
  const channels = getTransmissionChannels(plan);
  const existing = new Set(channels.map((item) => String(item.channel || "").trim()));
  if (!existing.has(String(channel.channel || "").trim())) {
    channels.push(channel);
  }
  plan.transmission_channels = channels;
}

function collectTransmissionMissingData(plan: Record<string, unknown>) {
  return getTransmissionChannels(plan)
    .flatMap((channel) => Array.isArray(channel.missing_data) ? channel.missing_data : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function extractCashtags(rawEventText: string) {
  return [...rawEventText.matchAll(/\$([A-Z][A-Z0-9.]{0,12})\b/g)]
    .map((match) => match[1].trim().toUpperCase())
    .filter(Boolean);
}

function getPlanPublicTickers(plan: Record<string, unknown>) {
  const entities = plan.entities as Record<string, unknown> | undefined;
  return Array.isArray(entities?.public_tickers_mentioned)
    ? entities.public_tickers_mentioned.map((ticker) => normalizeComparable(ticker)).filter(Boolean)
    : [];
}

function detectMarketReaction(rawEventText: string) {
  const raw = rawEventText.toLowerCase();
  const positive = [
    "shares moved higher",
    "stock moved higher",
    "shares rose",
    "stock rose",
    "shares gained",
    "stock gained",
    "shares were higher",
    "stock was higher",
    "moved slightly higher",
  ];
  const negative = [
    "shares moved lower",
    "stock moved lower",
    "shares fell",
    "stock fell",
    "shares dropped",
    "stock dropped",
    "shares declined",
    "stock declined",
    "moved slightly lower",
  ];

  if (negative.some((phrase) => raw.includes(phrase))) {
    return {
      direction: "negative",
      evidence: "The input mentions a negative stock/share-price reaction.",
    };
  }

  if (positive.some((phrase) => raw.includes(phrase))) {
    return {
      direction: "mixed",
      evidence: "The input mentions a positive stock/share-price reaction, but the underlying event still requires verification.",
    };
  }

  return null;
}

function hasAsset(assets: Record<string, unknown>[], ticker: string) {
  return assets.some((asset) => String(asset.ticker || "").trim().toUpperCase() === ticker);
}

function getEntitiesDetected(plan: Record<string, unknown>) {
  const entities = plan.entities as Record<string, unknown> | undefined;
  return {
    directly_mentioned_companies: entities?.directly_mentioned_companies || [],
    private_companies_or_entities: entities?.private_companies_or_entities || [],
    public_tickers_mentioned: entities?.public_tickers_mentioned || [],
    people_mentioned: entities?.people_mentioned || [],
    products_or_business_lines: entities?.products_or_business_lines || [],
    geographies: entities?.geographies || [],
  };
}

function getPrivateEntities(plan: Record<string, unknown>) {
  const entities = plan.entities as Record<string, unknown> | undefined;
  return Array.isArray(entities?.private_companies_or_entities)
    ? entities.private_companies_or_entities.map((entity) => String(entity || "").trim().toLowerCase()).filter(Boolean)
    : [];
}

function isInvalidAssetLabel(value: unknown) {
  const normalized = normalizeComparable(value);
  return !normalized
    || normalized === "UNKNOWN"
    || normalized === "N/A"
    || normalized === "NA"
    || normalized === "NONE"
    || normalized === "TBD"
    || normalized === "UNVERIFIED";
}

const sectorEtfExposureMap: Record<string, { theme: string; sector_or_theme_type: string }> = {
  XLE: { theme: "Energy", sector_or_theme_type: "equity_sector" },
  XLF: { theme: "Financials", sector_or_theme_type: "equity_sector" },
  XLV: { theme: "Health Care", sector_or_theme_type: "equity_sector" },
  XLP: { theme: "Consumer Staples", sector_or_theme_type: "equity_sector" },
  XLY: { theme: "Consumer Discretionary", sector_or_theme_type: "equity_sector" },
  XLI: { theme: "Industrials", sector_or_theme_type: "equity_sector" },
  XLK: { theme: "Technology", sector_or_theme_type: "equity_sector" },
  XLU: { theme: "Utilities", sector_or_theme_type: "equity_sector" },
  XLRE: { theme: "Real Estate", sector_or_theme_type: "equity_sector" },
  XLB: { theme: "Materials", sector_or_theme_type: "equity_sector" },
};

const sectorEtfProxySet = new Set(Object.keys(sectorEtfExposureMap));
const broadSectorLabelSet = new Set([
  "ENERGY",
  "OIL & GAS",
  "OIL AND GAS",
  "SHIPPING",
  "TRANSPORTATION",
  "AIRLINES",
  "AIRLINES / TRANSPORT",
  "DEFENSE",
  "CONSUMER DISCRETIONARY",
  "CONSUMER STAPLES",
  "FINANCIALS",
  "HEALTH CARE",
  "HEALTHCARE",
  "INDUSTRIALS",
  "TECHNOLOGY",
  "UTILITIES",
  "REAL ESTATE",
  "MATERIALS",
  "RATE-SENSITIVE SECTORS",
  "INFLATION-SENSITIVE SECTORS",
  "LNG",
  "SUPPLY CHAIN",
  "AI INFRASTRUCTURE",
  "SEMICONDUCTOR SUPPLY CHAIN",
  "OIL PRODUCERS",
  "ENERGY PRODUCERS",
  "DEFENSE STOCKS",
  "GOLD MINERS",
  "TRANSPORT",
  "TRANSPORTATION STOCKS",
  "SHIPPING COMPANIES",
  "LNG EXPORTERS",
  "BONDS",
  "BOND MARKETS",
  "GROWTH EQUITIES",
  "SAFE HAVENS",
  "UNKNOWN",
]);

const broadConcreteAffectedAssetSet = new Set([
  "SPY", "QQQ", "DIA", "IWM", "DAX", "SX5E", "EXS1",
  "TLT", "BND", "IEF", "US10Y", "BUND YIELD",
  "BRENT", "WTI", "BRENT CRUDE", "WTI CRUDE", "USO", "GLD",
  "DXY", "EUR/USD", "USD/JPY", "GBP/USD",
]);

function cleanSectorProxyTickers(values: unknown[]) {
  return uniqueStrings(values)
    .map((ticker) => String(ticker || "").trim().toUpperCase())
    .filter((ticker) => !isInvalidAssetLabel(ticker) && sectorEtfProxySet.has(ticker));
}

function isSectorEtfProxy(value: unknown) {
  return sectorEtfProxySet.has(String(value || "").trim().toUpperCase());
}

function isBroadSectorOrThemeLabel(value: unknown) {
  const normalized = String(value || "").trim().toUpperCase();
  return broadSectorLabelSet.has(normalized);
}

function isConcreteAffectedAssetLabel(value: unknown) {
  const normalized = String(value || "").trim().toUpperCase();
  const looksLikeTicker = /^[A-Z][A-Z0-9.]{0,12}$/.test(normalized);
  const looksLikeCrossAsset = /^[A-Z]{2,5}\/[A-Z]{2,5}$/.test(normalized);
  if (isInvalidAssetLabel(normalized) || isSectorEtfProxy(normalized) || isBroadSectorOrThemeLabel(normalized)) return false;
  if (broadConcreteAffectedAssetSet.has(normalized) || looksLikeCrossAsset) return true;
  return looksLikeTicker && !normalized.includes("ETF") && !normalized.includes("STOCK") && !normalized.includes("SECTOR");
}

function isAllowedConcreteAffectedAsset(asset: Record<string, unknown>, acceptedTickerEvidence: string[]) {
  const ticker = String(asset.ticker || asset.ticker_or_asset || "").trim().toUpperCase();
  const name = String(asset.name || "").trim().toUpperCase();
  const assetClass = String(asset.asset_class || "other").trim().toLowerCase();
  const looksLikeTicker = /^[A-Z][A-Z0-9.]{0,12}$/.test(ticker);
  const looksLikeCrossAsset = /^[A-Z]{2,5}\/[A-Z]{2,5}$/.test(ticker) || ["US10Y", "BUND YIELD", "BRENT", "WTI", "BRENT CRUDE", "WTI CRUDE"].includes(ticker);
  const accepted = acceptedTickerEvidence.includes(ticker);

  if (isInvalidAssetLabel(ticker) || isSectorEtfProxy(ticker)) return false;
  if (isBroadSectorOrThemeLabel(ticker) || isBroadSectorOrThemeLabel(name)) return false;
  if (assetClass === "sector" || assetClass === "etf") return false;
  if (name && (name.includes("PRIVATE") || name.includes("NOT DIRECTLY TRADABLE"))) return false;
  if (accepted && (looksLikeTicker || looksLikeCrossAsset)) return true;
  if (broadConcreteAffectedAssetSet.has(ticker)) return true;
  return false;
}

function textIncludesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function getResearchText(rawEventText: string, plan: Record<string, unknown>) {
  const classification = plan.event_classification || {};
  const channelText = getTransmissionChannels(plan)
    .map((channel) => [
      channel.channel,
      channel.mechanism,
      ...(Array.isArray(channel.directly_affected_entities) ? channel.directly_affected_entities : []),
      ...(Array.isArray(channel.indirectly_affected_entities_to_research) ? channel.indirectly_affected_entities_to_research : []),
    ].join(" "))
    .join(" ");
  return `${rawEventText} ${JSON.stringify(classification)} ${channelText}`.toLowerCase();
}

function detectEventSign(rawEventText: string, plan: Record<string, unknown>) {
  const text = getResearchText(rawEventText, plan);
  const classification = plan.event_classification as Record<string, unknown> | undefined;
  const eventType = String(classification?.event_type || "").toLowerCase();
  if (eventType.includes("de-escalation") || eventType.includes("deescalation")) return "easing";
  if (eventType.includes("escalation") && !eventType.includes("de-escalation") && !eventType.includes("deescalation")) return "tightening";
  const signText = text.replace(/de[-\s]?escalation/g, "deescalation");
  const easingTerms = [
    "deescalation",
    "deescalation",
    "ceasefire",
    "truce",
    "agreement",
    "deal",
    "peace",
    "lower tensions",
    "reduced tensions",
    "easing tensions",
    "ease tensions",
    "less disruption",
    "risk premium down",
    "risk premium lower",
    "normalization",
    "diplomatic",
  ];
  const tighteningTerms = [
    "escalation",
    "attack",
    "conflict",
    "war",
    "strike",
    "sanctions",
    "blockade",
    "closure",
    "closed",
    "disruption",
    "supply shock",
    "retaliation",
    "embargo",
    "higher tensions",
    "risk premium up",
    "risk premium higher",
  ];
  const easingScore = easingTerms.filter((term) => signText.includes(term)).length;
  const tighteningScore = tighteningTerms.filter((term) => signText.includes(term)).length;
  if (easingScore > tighteningScore) return "easing";
  if (tighteningScore > easingScore) return "tightening";
  return "unclear";
}

function hasUncertaintyLanguage(rawEventText: string) {
  const raw = rawEventText.toLowerCase();
  return textIncludesAny(raw, ["reportedly", "reports suggest", "possible", "may", "could", "denied", "uncertain", "mixed reports", "not confirmed"]);
}

function signDirection(sign: string, tighteningDirection: string, easingDirection: string, uncertain = false) {
  if (sign === "tightening") return tighteningDirection;
  if (sign === "easing") return easingDirection;
  return uncertain ? "neutral" : "neutral";
}

function directionalHintForExposure(item: Record<string, unknown>, sign: string) {
  const text = [
    item.theme,
    item.sector_or_theme_type,
    item.why_relevant,
  ].map((value) => String(value || "").toLowerCase()).join(" ");
  const current = safeDirection(item.direction_hint);

  if (sign === "easing" || sign === "tightening") {
    const negativeWhenEasing = ["energy", "oil", "gas", "lng", "safe haven", "safe-haven", "gold", "defense"];
    const positiveWhenEasing = ["consumer", "airline", "transport", "shipping", "rate-sensitive", "bond", "duration", "growth", "equity", "risk appetite", "real estate"];
    if (textIncludesAny(text, negativeWhenEasing)) return sign === "easing" ? "negative" : "positive";
    if (textIncludesAny(text, positiveWhenEasing)) return sign === "easing" ? "positive" : "negative";
  }

  return current === "mixed" ? "neutral" : current;
}

function splitOpposingExposure(item: Record<string, unknown>, sign: string) {
  const text = [item.theme, item.why_relevant, item.sector_or_theme_type]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  if (sign !== "easing" && sign !== "tightening") return [item];

  const splitItems: Record<string, unknown>[] = [];
  const hasDefense = textIncludesAny(text, ["defense", "aerospace"]);
  const hasTransport = textIncludesAny(text, ["airline", "airlines", "transport", "shipping"]);
  const hasEnergy = textIncludesAny(text, ["lng", "energy", "oil", "gas"]);
  const proxyValues = Array.isArray(item.sector_proxy_tickers)
    ? item.sector_proxy_tickers
    : Array.isArray(item.possible_tickers_to_check)
      ? item.possible_tickers_to_check
      : [];

  if (hasDefense && hasTransport) {
    splitItems.push({
      ...item,
      theme: "Defense",
      sector_or_theme_type: "theme",
      why_relevant: "Lower geopolitical risk can reduce the immediate risk-premium narrative for defense demand.",
      sector_proxy_tickers: [],
      possible_tickers_to_check: [],
      direction_hint: sign === "easing" ? "negative" : "positive",
    });
    splitItems.push({
      ...item,
      theme: "Airlines / Transport",
      sector_or_theme_type: "industry_group",
      why_relevant: "Lower fuel and disruption risk can support transport margins if the de-escalation is confirmed.",
      sector_proxy_tickers: [],
      possible_tickers_to_check: [],
      direction_hint: sign === "easing" ? "positive" : "negative",
    });
    return splitItems;
  }

  if (hasEnergy && hasTransport) {
    splitItems.push({
      ...item,
      theme: hasEnergy ? "Energy" : String(item.theme || "Energy"),
      sector_or_theme_type: "theme",
      why_relevant: "Lower disruption risk can reduce the energy risk premium if confirmed.",
      sector_proxy_tickers: cleanSectorProxyTickers(proxyValues),
      possible_tickers_to_check: cleanSectorProxyTickers(proxyValues),
      direction_hint: sign === "easing" ? "negative" : "positive",
    });
    splitItems.push({
      ...item,
      theme: "Shipping / Transport",
      sector_or_theme_type: "industry_group",
      why_relevant: "Lower route disruption and insurance risk can support transport economics if confirmed.",
      sector_proxy_tickers: [],
      possible_tickers_to_check: [],
      direction_hint: sign === "easing" ? "positive" : "negative",
    });
    return splitItems;
  }

  return [item];
}

function addInferredAsset(
  assets: Record<string, unknown>[],
  ticker: string,
  name: string,
  assetClass: string,
  direction: string,
  strength: string,
  reason: string,
  uncertainty: string,
) {
  const normalized = ticker.toUpperCase();
  if (hasAsset(assets, normalized)) return;
  assets.push({
    ticker: normalized,
    ticker_or_asset: normalized,
    name,
    asset_class: assetClass,
    direction,
    strength,
    reason,
    uncertainty,
  });
}

function inferConcreteMacroAffectedAssets(rawEventText: string, plan: Record<string, unknown>) {
  const text = getResearchText(rawEventText, plan);
  const sign = detectEventSign(rawEventText, plan);
  const uncertain = hasUncertaintyLanguage(rawEventText);
  const assets: Record<string, unknown>[] = [];
  const signText = sign === "easing"
    ? "the input points to easing risk conditions"
    : sign === "tightening"
      ? "the input points to tighter risk conditions"
      : "the input does not establish a clear event sign";
  const uncertainty = uncertain
    ? "The report or event details are not fully confirmed, so direction should remain mixed unless market data confirms the channel."
    : "The channel still needs verification through prices, positioning, and follow-up data.";

  if (textIncludesAny(text, ["oil", "crude", "brent", "wti", "energy supply", "supply risk", "shipping risk", "risk premium", "lng"])) {
    const direction = signDirection(sign, "positive", "negative", uncertain);
    addInferredAsset(
      assets,
      "BRENT CRUDE",
      "Brent Crude",
      "commodity",
      direction,
      "medium",
      `If confirmed, ${signText} can change the crude oil risk premium, transport costs, and inflation expectations.`,
      uncertainty,
    );
    addInferredAsset(
      assets,
      "USO",
      "USO",
      "commodity",
      direction,
      "medium",
      "USO is a commodity proxy to monitor the oil-price channel, not an equity-sector exposure.",
      uncertainty,
    );
  }

  if (textIncludesAny(text, ["gold", "safe haven", "safe-haven", "geopolitical risk premium"])) {
    const direction = signDirection(sign, "positive", "negative", uncertain);
    addInferredAsset(
      assets,
      "GLD",
      "GLD",
      "commodity",
      direction,
      "medium",
      "GLD is a gold-price proxy to monitor the safe-haven channel, not an equity-sector exposure.",
      uncertainty,
    );
  }

  if (textIncludesAny(text, ["inflation", "rates", "rate", "bond", "bonds", "yield", "yields", "duration"])) {
    const direction = signDirection(sign, "negative", "positive", uncertain);
    addInferredAsset(
      assets,
      "TLT",
      "TLT",
      "bond",
      direction,
      "medium",
      `TLT is a duration proxy because ${signText} can affect inflation expectations, yields, and long-duration bond prices.`,
      uncertainty,
    );
  }

  if (textIncludesAny(text, ["dollar", "dxy", "currency", "fx", "eur/usd", "usd"])) {
    addInferredAsset(
      assets,
      "DXY",
      "DXY",
      "currency",
      "neutral",
      "medium",
      "DXY is a concrete currency proxy; the dollar response depends on relative risk appetite, oil prices, and rate expectations.",
      uncertainty,
    );
  }

  if (textIncludesAny(text, ["risk appetite", "equities", "equity", "growth stocks", "growth equities", "stock market", "broader market"])) {
    const direction = signDirection(sign, "negative", "positive", uncertain);
    addInferredAsset(
      assets,
      "SPY",
      "SPY",
      "index",
      direction,
      "medium",
      `SPY is a broad equity-index proxy because ${signText} can move risk appetite and discount-rate expectations.`,
      uncertainty,
    );
    if (textIncludesAny(text, ["growth stocks", "growth equities", "technology", "long-duration equities"])) {
      addInferredAsset(
        assets,
        "QQQ",
        "QQQ",
        "index",
        direction,
        "medium",
        "QQQ is a growth-equity index proxy; the channel matters only if rates, inflation expectations, or risk appetite move materially.",
        uncertainty,
      );
    }
  }

  return assets;
}

function getSectorEtfExposuresFromAffectedAssets(validatedDraft: Record<string, unknown>) {
  const node = validatedDraft.node as Record<string, unknown> | undefined;
  const assets = Array.isArray(node?.affected_assets) ? node.affected_assets as Record<string, unknown>[] : [];
  return assets
    .map((asset) => {
      const ticker = String(asset.ticker_or_asset || asset.ticker || "").trim().toUpperCase();
      const mapped = sectorEtfExposureMap[ticker];
      if (!mapped) return null;
      return {
        theme: mapped.theme,
        sector_or_theme_type: mapped.sector_or_theme_type,
        why_relevant: String(asset.reason || `${mapped.theme} is an equity-sector exposure to watch for this event.`).trim(),
        sector_proxy_tickers: [ticker],
        possible_tickers_to_check: [ticker],
        direction_hint: safeDirection(asset.direction),
        data_needed: String(asset.uncertainty || "Verify whether the sector exposure is material and how much is already priced in.").trim(),
        time_horizon: "near_term",
        confidence: normalizeScore(asset.confidence, 45),
      };
    })
    .filter(Boolean) as Record<string, unknown>[];
}

function getAssetsToResearch(validatedDraft: Record<string, unknown>, researchPlan: Record<string, unknown>, rawEventText = "") {
  const generated = Array.isArray(validatedDraft.assets_to_research)
    ? validatedDraft.assets_to_research as Record<string, unknown>[]
    : [];
  const planAssets = Array.isArray(researchPlan.potentially_affected_assets_to_research)
    ? researchPlan.potentially_affected_assets_to_research as Record<string, unknown>[]
    : [];
  const sectorEtfExposures = getSectorEtfExposuresFromAffectedAssets(validatedDraft);
  const eventSign = detectEventSign(rawEventText, researchPlan);
  const channelAssets = getTransmissionChannels(researchPlan).map((channel) => {
    const proxyTickers = Array.isArray(channel.possible_public_assets_to_check)
      ? cleanSectorProxyTickers(channel.possible_public_assets_to_check)
      : [];
    return {
      theme: String(channel.channel || "Transmission channel").replace(/_/g, " "),
      sector_or_theme_type: "transmission_channel",
      why_relevant: String(channel.mechanism || ""),
      sector_proxy_tickers: proxyTickers,
      possible_tickers_to_check: proxyTickers,
      direction_hint: "mixed",
      data_needed: Array.isArray(channel.missing_data) ? channel.missing_data.join("; ") : "",
      time_horizon: String(channel.time_horizon || ""),
      confidence: normalizeScore(channel.confidence, 35),
    };
  });

  const fallbackNeeded = generated.length < 3;
  const normalized = [
    ...generated,
    ...sectorEtfExposures,
    ...(fallbackNeeded ? planAssets.map((asset) => ({
      theme: String(asset.asset_or_ticker || "Exposure to research"),
      sector_or_theme_type: "theme",
      why_relevant: String(asset.why_it_might_matter || ""),
      sector_proxy_tickers: [],
      possible_tickers_to_check: [],
      direction_hint: "mixed",
      data_needed: String(asset.evidence_from_input || asset.needs_verification ? "Verify the sector/theme, proxy mapping, exposure and direction before treating it as concrete." : ""),
      time_horizon: "",
      confidence: asset.needs_verification ? 25 : 35,
    })) : []),
    ...(fallbackNeeded ? channelAssets : []),
  ].flatMap((item) => splitOpposingExposure(item, eventSign)).map((item) => {
    const sectorProxyTickers = Array.isArray(item.sector_proxy_tickers)
      ? item.sector_proxy_tickers
      : Array.isArray(item.possible_tickers_to_check)
        ? item.possible_tickers_to_check
        : [];
    const cleanProxyTickers = cleanSectorProxyTickers(sectorProxyTickers);
    return {
      theme: String(item.theme || "").trim(),
      sector_or_theme_type: String(item.sector_or_theme_type || "theme").trim(),
      why_relevant: String(item.why_relevant || "").trim(),
      sector_proxy_tickers: cleanProxyTickers,
      possible_tickers_to_check: cleanProxyTickers,
      direction_hint: directionalHintForExposure(item, eventSign),
      data_needed: String(item.data_needed || "").trim(),
      time_horizon: String(item.time_horizon || "").trim(),
      confidence: normalizeScore(item.confidence, 35),
    };
  }).filter((item) => item.theme || item.why_relevant || item.sector_proxy_tickers.length || item.data_needed);

  const seen = new Set<string>();
  return normalized.filter((item) => {
    const key = `${item.theme}|${item.why_relevant}|${item.data_needed}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}
function isThinText(value: unknown) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length < 12;
}

function improveInvestorExplanation(node: Record<string, unknown>, researchPlan: Record<string, unknown>) {
  const channels = getTransmissionChannels(researchPlan);
  if (!channels.length) return;

  const channelNames = channels
    .map((channel) => String(channel.channel || "").replace(/_/g, " "))
    .filter(Boolean)
    .slice(0, 5)
    .join(", ");
  const mechanisms = channels
    .map((channel) => String(channel.mechanism || "").trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");

  if (isThinText(node.why_matters) || String(node.why_matters || "").toLowerCase().includes("investor sentiment")) {
    node.why_matters = [
      `For private investors, the headline matters because it can transmit through ${channelNames || "multiple market channels"}.`,
      mechanisms ? `Key mechanisms to test: ${mechanisms}` : "",
      "The useful question is whether the event changes supply availability, input costs, margins, discount rates, risk premia, or verified exposure to tradable assets.",
    ].filter(Boolean).join(" ");
  }
}

function improveCausalChains(node: Record<string, unknown>, researchPlan: Record<string, unknown>) {
  const channels = getTransmissionChannels(researchPlan);
  const existingChains = Array.isArray(node.causal_chain) ? node.causal_chain as Record<string, unknown>[] : [];
  const sourceChains = existingChains.length ? existingChains : channels.map((channel) => ({
    title: String(channel.channel || "Transmission channel").replace(/_/g, " "),
    event: "Event described in the input",
    mechanism: channel.mechanism,
    sector_impact: "",
    asset_impact: "",
    watch: "",
  }));

  const cleanList = (values: unknown[]) => {
    const seen = new Set<string>();
    return values
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .filter((value) => {
        const key = value.toLowerCase().replace(/\s+/g, " ");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  node.causal_chain = sourceChains.slice(0, 5).map((chain, index) => {
    const channel = channels[index] || {};
    const affectedGroups = cleanList([
      ...(Array.isArray(channel.directly_affected_entities) ? channel.directly_affected_entities : []),
      ...(Array.isArray(channel.indirectly_affected_entities_to_research) ? channel.indirectly_affected_entities_to_research : []),
    ]).slice(0, 5).join(", ");
    const missingData = Array.isArray(channel.missing_data)
      ? uniqueStrings(channel.missing_data).join("; ")
      : String(chain.watch || "");
    const baseMechanism = String(channel.mechanism || chain.mechanism || "").trim();
    const event = String(chain.event || "Event described in the input").trim();
    let cleanImpact = String(chain.asset_impact || chain.sector_impact || "")
      .replace(/\bpossible tickers? to check[^.]*\./gi, "")
      .replace(/\bnot validated affected assets[^.]*\./gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (/^watch for movements/i.test(cleanImpact) || isThinText(cleanImpact)) {
      cleanImpact = baseMechanism;
    }

    return {
      title: String(chain.title || channel.channel || "Transmission channel").trim(),
      event,
      mechanism: baseMechanism || "The event changes expectations through the identified channel.",
      sector_impact: affectedGroups || "Relevant exposures still need verification.",
      asset_impact: cleanImpact || baseMechanism || "The market effect depends on the size, duration, and confirmation of the event.",
      watch: missingData || "Confirm the size, duration, and market relevance of the channel.",
    };
  });
}

function getRejectedAssets(validatedDraft: Record<string, unknown>, acceptedAssets: Record<string, unknown>[]) {
  const accepted = new Set(acceptedAssets.map((asset) => String(asset.ticker || "").trim().toUpperCase()));
  const validations = Array.isArray(validatedDraft.affected_asset_validation)
    ? validatedDraft.affected_asset_validation as Record<string, unknown>[]
    : [];

  return validations
    .filter((asset) => !accepted.has(String(asset.ticker_or_asset || "").trim().toUpperCase()))
    .map((asset) => ({
      ticker_or_asset: asset.ticker_or_asset || "",
      asset_type: asset.asset_type || "unknown",
      evidence_type: asset.evidence_type || "insufficient",
      reason: asset.reason || "",
      uncertainty: asset.uncertainty || "",
    }));
}

function applyConservativeGuardrails(args: {
  generatedNode: Record<string, unknown>;
  validatedDraft: Record<string, unknown>;
  researchPlan: Record<string, unknown>;
  rawEventText: string;
  tickers: string[];
}) {
  const raw = args.rawEventText.toLowerCase();
  const node = args.generatedNode;
  const assets = Array.isArray(node.affected_assets) ? node.affected_assets as Record<string, unknown>[] : [];
  const mentionedTickers = uniqueStrings([...args.tickers, ...extractCashtags(args.rawEventText)]).map((ticker) => ticker.toUpperCase());
  const acceptedTickerEvidence = uniqueStrings([...mentionedTickers, ...getPlanPublicTickers(args.researchPlan)]).map((ticker) => ticker.toUpperCase());
  const marketReaction = detectMarketReaction(args.rawEventText);
  const privateEntities = getPrivateEntities(args.researchPlan);
  const planDataNeeded = Array.isArray(args.researchPlan.data_needed_before_strong_conclusion)
    ? args.researchPlan.data_needed_before_strong_conclusion as string[]
    : [];
  const planNotKnown = Array.isArray(args.researchPlan.not_known_from_input)
    ? args.researchPlan.not_known_from_input as string[]
    : [];

  appendMissingData(args.validatedDraft, [...planDataNeeded, ...planNotKnown, ...collectTransmissionMissingData(args.researchPlan)]);

  if (raw.includes("reportedly") || raw.includes("rumor") || raw.includes("possibility") || raw.includes("speculation")) {
    node.confidence = Math.min(clampScore(node.confidence, 35), 60);
  }

  if (marketReaction && (raw.includes("report") || raw.includes("reportedly") || raw.includes("rumor") || raw.includes("speculation"))) {
    node.impact = Math.min(clampScore(node.impact, 40), 55);
  }

  for (const ticker of mentionedTickers) {
    if (!hasAsset(assets, ticker)) {
      assets.push({
        ticker,
        name: ticker,
        direction: marketReaction ? marketReaction.direction : "neutral",
        asset_class: "other",
        strength: "watch",
        reason: [
          `${ticker} appears in the input or was provided by the user, so it can be tracked as a directly mentioned public-market symbol.`,
          marketReaction ? `Evidence: ${marketReaction.evidence}` : "Evidence: the ticker was directly mentioned by the user/input.",
          "The instrument, exposure, and causal link still require verification before treating it as a strong affected asset.",
        ].join(" "),
      });
    }
  }

  for (const inferredAsset of inferConcreteMacroAffectedAssets(args.rawEventText, args.researchPlan)) {
    const ticker = String(inferredAsset.ticker || "").trim().toUpperCase();
    if (ticker && !hasAsset(assets, ticker)) {
      assets.push(inferredAsset);
    }
  }

  for (const asset of assets) {
    const ticker = String(asset.ticker || "").trim().toUpperCase();
    const name = String(asset.name || "").trim();
    const normalizedName = name.toLowerCase();
    const reason = String(asset.reason || "").trim();
    const nameMatchesPrivateEntity = privateEntities.some((entity) => entity && entity === normalizedName);
    const mentionedUnknownTickerMappedToName = acceptedTickerEvidence.includes(ticker)
      && !isKnownRegionTicker(ticker)
      && normalizedName
      && normalizedName !== ticker.toLowerCase();

    if (acceptedTickerEvidence.includes(ticker) && (nameMatchesPrivateEntity || mentionedUnknownTickerMappedToName) && ticker.toLowerCase() !== normalizedName) {
      asset.name = ticker;
      asset.direction = ["positive", "negative"].includes(safeDirection(asset.direction)) ? "mixed" : safeDirection(asset.direction);
      asset.reason = [
        `${ticker} is a user-mentioned public-market symbol, but the draft mapped it to another named entity without verified exposure. The instrument must not be treated as the underlying company itself without holdings/exposure verification.`,
        reason ? `Original model reason: ${reason}` : "",
        "Verify what the instrument holds, whether exposure is direct or indirect, and whether it is investable for the user.",
      ].filter(Boolean).join(" ");
    }

    if (marketReaction) {
      const currentReason = String(asset.reason || "").trim();
      asset.direction = safeDirection(asset.direction) === "positive" && marketReaction.direction === "negative"
        ? "negative"
        : safeDirection(asset.direction) === "positive"
          ? "mixed"
          : safeDirection(asset.direction);
      asset.reason = [
        currentReason,
        `Market reaction check: ${marketReaction.evidence}`,
      ].filter(Boolean).join(" ");
    }
  }

  node.affected_assets = assets.filter((asset) => {
    const ticker = String(asset.ticker || "").trim().toUpperCase();
    if (isInvalidAssetLabel(asset.name)) asset.name = ticker;
    return isAllowedConcreteAffectedAsset(asset, acceptedTickerEvidence);
  });

  improveInvestorExplanation(node, args.researchPlan);
  improveCausalChains(node, args.researchPlan);
  node.region = normalizeGeneratedRegion(node);
  node.timestamp = new Date().toISOString();
}

async function callOpenAIJson(args: {
  apiKey: string;
  model: string;
  temperature: number;
  messages: Array<{ role: "system" | "user"; content: string }>;
  schemaName: string;
  schema: Record<string, unknown>;
}) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      temperature: args.temperature,
      messages: args.messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: args.schemaName,
          strict: true,
          schema: args.schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${details}`);
  }

  const completion = await response.json();
  const message = completion.choices?.[0]?.message;
  if (message?.refusal) throw new Error(`OpenAI refused the request: ${message.refusal}`);
  if (!message?.content) throw new Error("OpenAI returned no content.");

  return JSON.parse(message.content);
}

async function createResearchPlan(input: {
  raw_event_text: string;
  source_urls: string[];
  tickers: string[];
  apiKey: string;
  model: string;
}) {
  return await callOpenAIJson({
    apiKey: input.apiKey,
    model: input.model,
    temperature: 0.15,
    schemaName: "clarifin_research_plan",
    schema: researchPlanSchema,
    messages: [
      {
        role: "system",
        content: [
          "You are Clarifin's cautious financial research planner.",
          "Do not draft a final node. Create a research plan only.",
          "Use only the allowed Clarifin taxonomy values for category, event_type, and event_status. Never invent custom category names.",
          "Do not browse the web and do not pretend web research happened.",
          "Use only raw_event_text, user-provided tickers, and source URL labels.",
          "A source URL is not source content. Do not treat a URL as verified evidence.",
          "Be curious and identify non-obvious research angles, but separate confirmed input facts from missing information.",
          "Do not claim that a company is publicly traded unless a ticker is provided or the input directly says it is public.",
          "Identify private companies separately from public tickers.",
          "Identify ETFs/funds separately from underlying companies.",
          "Flag indirect exposure, verification needs, hallucination risks, and assumptions that must not be made.",
          "",
          "Build transmission channels before deciding affected assets:",
          "- Do not stop at directly mentioned tickers.",
          "- Identify economically plausible channels, but label them as hypotheses until verified.",
          "- Indirect concrete instruments can appear as possible_public_assets_to_check, but they should not become final affected_assets without evidence.",
          "- Transmission channels should help a private investor understand why the event matters beyond a watchlist ticker.",
          "- Exposures are sectors, themes, economic areas, equity sectors, or industry groups. They are not concrete affected assets.",
          "- Equity sector ETFs can be listed as sector proxies inside Exposures, but the exposure theme must remain the main title.",
          "- For macro or geopolitical events, scan cross-asset channels such as commodities, shipping and insurance costs, transport fuel users, inflation, rates and bonds, safe havens, currencies, defense/security, consumer demand, risk appetite, and regional energy security. Keep each as a hypothesis until verified.",
          "- Use the channel taxonomy generically. For example, related-party reports can raise governance and capital_allocation channels; shared infrastructure can raise AI_compute or energy_infrastructure channels; private entities linked to public symbols can raise private_public_market_link channels.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          "Create the structured research plan JSON for this Clarifin draft.",
          "",
          `User-provided tickers: ${input.tickers.length ? input.tickers.join(", ") : "none"}`,
          `User-provided source URLs: ${input.source_urls.length ? input.source_urls.join(", ") : "none"}`,
          "",
          "Raw event text:",
          input.raw_event_text,
        ].join("\n"),
      },
    ],
  });
}

async function createValidatedDraft(input: {
  raw_event_text: string;
  source_urls: string[];
  tickers: string[];
  research_plan: Record<string, unknown>;
  apiKey: string;
  model: string;
}) {
  const sourceInstruction = input.source_urls.length
    ? `Use only these source URL labels in sources; do not claim their contents were read: ${input.source_urls.join(", ")}`
    : `No source URL was provided. Set sources exactly to ["User provided event text"].`;

  return await callOpenAIJson({
    apiKey: input.apiKey,
    model: input.model,
    temperature: 0.12,
    schemaName: "clarifin_evidence_aware_node_draft",
    schema: finalDraftSchema,
    messages: [
      {
        role: "system",
        content: [
          "You are Clarifin's cautious evidence-aware financial research assistant.",
          "You must not browse the web. You must not pretend web/API research happened.",
          "Your job is to generate a draft only after evidence mapping, affected-asset validation, and a quality gate.",
          "Use only the allowed Clarifin taxonomy values for category, event_type, and event_status. Never invent custom category names.",
          "If an event describes a reported possible combination, merger discussion, takeover possibility, or deal exploration without a confirmed transaction, use event_type=Merger Speculation, not Merger / Acquisition. Use event_status=report when attributed to a report/source, speculation when not attributed, and rumor only for unsupported market chatter.",
          "The final node should explain the important transmission channels even when some assets remain unverified.",
          "",
          "Taxonomy rules:",
          `- Allowed categories: ${allowedCategories.join(", ")}`,
          `- Allowed event_type values: ${allowedEventTypes.join(", ")}`,
          `- Allowed event_status values: ${allowedEventStatuses.join(", ")}`,
          "- category is the broad main category; event_type is the specific event type; event_status is certainty/status.",
          "- For uncertain events, choose category by economic topic and put uncertainty in event_status.",
          "",
          "Evidence mapping rules:",
          "- Classify each important claim as input_fact, source_fact, market_reaction, inference, unverified, or missing.",
          "- Because this version does not fetch source URLs, source_fact is allowed only when the user provided actual source text in raw_event_text.",
          "- The final node must not present inference or unverified claims as confirmed fact.",
          "- Missing information should be explicitly flagged instead of guessed.",
          "",
          "Affected asset validation rules:",
          "- No affected asset without evidence.",
          "- Never create affected_assets with ticker/name UNKNOWN, N/A, none, broad sector names, equity sector names, or placeholder labels.",
          "- Only use affected_assets for concrete market instruments or asset classes: broad indices/index ETFs, bonds/rates/duration proxies, commodities/commodity proxies, currencies, and individual stocks when justified. Do not use equity sector ETFs as affected_assets in Clarifin.",
          `- affected_assets asset_class must be one of: ${assetClassEnum.join(", ")}. Do not use asset_class=sector or asset_class=etf; sectors belong to Exposures.`,
          "- If the event is macro/geopolitical and no concrete ticker is provided, affected_assets may be empty only when no concrete commodity, rate, currency, broad index, or bond proxy is justified by the causal mechanism.",
          "- Broad groups such as sectors, themes, economic areas, equity sectors, industry groups, producers, transport, insurers, or regional markets belong in causal_chain or assets_to_research. Concrete commodities, currencies, rates, broad indices/index ETFs, or stocks may be affected_assets only when evidence-supported.",
          "- A directly mentioned public ticker may be included when the reason clearly states the direct evidence and uncertainty.",
          "- A ticker is evidence-supported when it is directly mentioned with a cashtag, explicitly provided by the user, or tied to a stated market reaction.",
          "- Directly mentioned assets may be included, but direction still needs evidence.",
          "- If a market reaction is mentioned, direction must incorporate it.",
          "- Direction labels should usually be positive, negative, or neutral. Use mixed only when the directional case is genuinely unclear or two opposing forces are equally important.",
          "- If the likely market direction is clear but the event is unconfirmed, still choose the likely direction and reflect uncertainty in reason/uncertainty instead of defaulting to mixed.",
          "- Do not mark an asset positive just because a strategy sounds exciting.",
          "- Separate immediate market reaction from long-term strategy.",
          "- Private companies must be private_not_directly_tradable.",
          "- Private companies must be kept in research planning and missing data, not inserted as normal public affected_assets unless a direct public ticker is verified.",
          "- ETFs/funds must not be treated as the underlying company.",
          "- If a user-provided ticker looks like an indirect exposure vehicle, ETF, fund, SPV, or proxy, do not treat it as the underlying private company. Treat it as an instrument requiring verification of holdings/exposure. Use evidence_type=user_mentioned_ticker_needs_verification.",
          "- Peers, competitors, suppliers, and luxury peers require an explicit and specific causal chain. Broad equity sectors remain Exposures; sector ETFs must be sector_proxy_tickers inside Exposures and must never be affected_assets.",
          "- In reported related-party transactions or merger discussions, a slight positive price move does not erase governance and capital-allocation risk; direction should usually be mixed unless evidence is strong.",
          "",
          "Writing rules:",
          "- No investment advice, no buy/sell/hold recommendations, no performance promises.",
          "- Be specific and conservative.",
          "- why_matters must explain broader investor relevance, not just summarize the article.",
          "- causal_chain is the main value of the node. Use the research_plan transmission_channels to explain event -> economic channel -> market effect -> sector/asset impact across governance, capital allocation, infrastructure, supply chains, demand, commodities, rates, FX, private/public-market links, or other relevant channels.",
          "- Causal chains must be concise and non-duplicative. Do not repeat the same sector names twice. Use short event -> channel -> market effect phrasing.",
          "- For each causal chain, fit the clean mechanism into: event, mechanism, sector_impact, asset_impact, and watch. Avoid long numbered paragraphs.",
          "- assets_to_research is the Exposures layer. Each item must be a sector, theme, economic area, equity sector, or industry group with theme, sector_or_theme_type, why_relevant, sector_proxy_tickers, direction_hint, data_needed, time_horizon, and confidence. Do not use it as a list of concrete affected assets. Equity sector ETFs such as XLE/XLF/XLV/XLP/XLY/XLI/XLK/XLU/XLRE/XLB belong here as sector_proxy_tickers, never in affected_assets.",
          "- For broad macro or geopolitical events, include 4-7 exposure items when economically relevant, including direct, indirect, and delayed channels. Do not stop at the first obvious sector.",
          "- Direction matters: distinguish escalation from de-escalation, tighter from easier financial conditions, demand acceleration from demand weakness, and margin expansion from margin pressure. Set direction_hint from the event sign, not from a generic playbook.",
          "- Use positive or negative direction_hint when the event sign clearly eases or pressures an exposure if confirmed. Unconfirmed does not automatically mean mixed. Use mixed only when opposing forces are central or the input is too vague.",
          "- Do not combine exposure themes with opposite likely directions into one item. Split them into separate exposure cards, for example defense versus airlines, or energy versus transport.",
          "- sector_proxy_tickers should contain equity sector proxies such as XLE, XLF, XLV, XLP, XLY, XLI, XLK, XLU, XLRE, and XLB. Do not place commodity proxies, bond proxies, currencies, broad index ETFs, or individual stocks in sector_proxy_tickers.",
          "- For affected_assets, avoid vague labels such as OIL or GOLD. Prefer concrete instruments or products such as Brent Crude, WTI Crude, USO, GLD, TLT, BND, SPY, QQQ, DXY, EUR/USD, or directly justified individual stocks.",
          "- Do not duplicate the same economic channel with too many near-identical affected assets. Prefer the cleanest useful product list.",
          "- Explain direct, indirect, and delayed impacts, but keep unverified indirect assets out of affected_assets.",
          "- Impact and confidence are 0-100 scores, not 1-5 ratings.",
          "- Avoid generic phrases unless supported by a specific mechanism.",
          "- Avoid phrases like various sectors, investor sentiment, or market dynamics unless the mechanism is specific.",
          "- Do not write scenarios that predict stock-price gains or losses. Scenarios should focus on what would confirm or weaken the event thesis.",
          "- Avoid vague phrases such as market dynamics, investor interest, positive market reaction, significant positive reaction, potential synergies, and stock prices could rise unless the input directly supports the mechanism.",
          "- For speculative reports, keep confidence capped and write about verification needs, governance, ownership, transaction structure, and missing data.",
          "- Prefer phrases like: The immediate market reaction suggests...; The main uncertainty is...; The report does not confirm...; Strategically relevant is not automatically positive for shareholders because...; Missing data: ...",
          "",
          "Region rules:",
          "- Region describes primary market/asset exposure, not geographic sales footprint.",
          "- European-listed companies are eu.",
          "- Major US-listed companies are us.",
          "- Macro/global or spread-out exposure is global.",
          "",
          "Final quality gate:",
          "Run all 10 requested checks. If the draft fails, revise before returning JSON.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          "Generate one conservative Clarifin node draft from the research plan.",
          "",
          "You must return JSON only with node, evidence_map, affected_asset_validation, assets_to_research, quality_gate, missing_data, and warnings.",
          `- ${sourceInstruction}`,
          `- User-provided tickers: ${input.tickers.length ? input.tickers.join(", ") : "none"}`,
          "",
          "Research plan JSON:",
          JSON.stringify(input.research_plan, null, 2),
          "",
          "Raw event text:",
          input.raw_event_text,
        ].join("\n"),
      },
    ],
  });
}

function normalizeGeneratedNode(generated: Record<string, unknown>, sourceUrls: string[]) {
  const node = generated.node as Record<string, unknown>;
  const classification = generated.event_classification as Record<string, unknown> | undefined;
  node.category = normalizeCategory(classification?.category || node.category);
  node.event_type = normalizeEventType(classification?.event_type || node.event_type);
  node.event_status = normalizeEventStatus(classification?.event_status || node.event_status);
  node.impact = normalizeScore(node.impact, 40);
  node.confidence = normalizeScore(node.confidence, 35);

  node.affected_assets = (Array.isArray(node.affected_assets) ? node.affected_assets : [])
    .map((asset: Record<string, unknown>) => {
      const reason = String(asset.reason || "").trim();
      const evidence = String(asset.evidence || "").trim();
      const uncertainty = String(asset.uncertainty || "").trim();
      const ticker = String(asset.ticker_or_asset || asset.ticker || "").trim().toUpperCase();
      const assetClass = assetClassEnum.includes(String(asset.asset_class || "").trim().toLowerCase())
        ? String(asset.asset_class).trim().toLowerCase()
        : "other";
      const name = String(asset.name || ticker).trim();
      const strength = String(asset.strength || "watch").trim().toLowerCase();

      return {
        ticker,
        ticker_or_asset: ticker,
        name: isInvalidAssetLabel(name) ? ticker : name,
        asset_class: assetClass,
        direction: safeDirection(asset.direction),
        strength: ["high", "medium", "watch"].includes(strength) ? strength : "watch",
        uncertainty,
        reason: reason || evidence || "Concrete instrument to monitor through this event channel.",
      };
    })
    .filter((asset: Record<string, string>) => asset.ticker && asset.reason && !isInvalidAssetLabel(asset.ticker) && !isInvalidAssetLabel(asset.name) && !isSectorEtfProxy(asset.ticker) && !isBroadSectorOrThemeLabel(asset.ticker) && !isBroadSectorOrThemeLabel(asset.name));

  node.sources = sourceUrls.length ? sourceUrls : ["User provided event text"];
  node.region = normalizeGeneratedRegion(node);
  return node;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Use POST for generate-node." }, 405);

  try {
    const body = await req.json();
    const rawEventText = String(body.raw_event_text || "").trim();
    const sourceUrls = cleanStringArray(body.source_urls);
    const tickers = cleanStringArray(body.tickers).map((ticker) => ticker.toUpperCase());

    if (!rawEventText) {
      return jsonResponse({ error: "raw_event_text is required." }, 400);
    }

    const openAiApiKey = requireEnv("OPENAI_API_KEY");
    const model = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const warnings: string[] = [];

    const researchPlan = await createResearchPlan({
      raw_event_text: rawEventText,
      source_urls: sourceUrls,
      tickers,
      apiKey: openAiApiKey,
      model,
    });
    applyTaxonomyGuardrails(researchPlan, rawEventText);

    const validatedDraft = await createValidatedDraft({
      raw_event_text: rawEventText,
      source_urls: sourceUrls,
      tickers,
      research_plan: researchPlan,
      apiKey: openAiApiKey,
      model,
    });

    const generatedNode = normalizeGeneratedNode(validatedDraft, sourceUrls);
    const taxonomyClassification = researchPlan.event_classification as Record<string, unknown> | undefined;
    generatedNode.category = normalizeCategory(taxonomyClassification?.category || generatedNode.category);
    generatedNode.event_type = normalizeEventType(taxonomyClassification?.event_type || generatedNode.event_type);
    generatedNode.event_status = normalizeEventStatus(taxonomyClassification?.event_status || generatedNode.event_status);
    applyConservativeGuardrails({
      generatedNode,
      validatedDraft,
      researchPlan,
      rawEventText,
      tickers,
    });
    const assetsToResearch = getAssetsToResearch(validatedDraft, researchPlan, rawEventText);

    const { data: node, error: nodeError } = await supabase
      .from("nodes")
      .insert({
        title: generatedNode.title,
        category: generatedNode.category,
        event_type: generatedNode.event_type,
        event_status: generatedNode.event_status,
        short: generatedNode.short,
        impact: generatedNode.impact,
        confidence: generatedNode.confidence,
        timestamp: new Date().toISOString(),
        region: generatedNode.region,
        status: "draft",
      })
      .select("id")
      .single();

    if (nodeError) throw new Error(`Could not insert node draft: ${nodeError.message}`);

    const nodeId = node.id;
    const affectedAssets = generatedNode.affected_assets
      .filter((asset: Record<string, unknown>) => isAllowedConcreteAffectedAsset(asset, uniqueStrings([...tickers, ...extractCashtags(rawEventText), ...getPlanPublicTickers(researchPlan)]).map((ticker) => ticker.toUpperCase())))
      .map((asset: Record<string, unknown>) => ({
        node_id: nodeId,
        ticker: asset.ticker,
        name: asset.name,
        direction: asset.direction,
        strength: asset.strength,
        reason: asset.reason,
        asset_class: asset.asset_class,
        uncertainty: asset.uncertainty,
      }));

    if (affectedAssets.length) {
      const { error: assetsError } = await supabase.from("affected_assets").insert(affectedAssets);
      if (assetsError) throw new Error(`Could not insert affected assets: ${assetsError.message}`);
    }

    const researchExposures = assetsToResearch.map((exposure: Record<string, unknown>) => {
      const sectorProxyTickers = Array.isArray(exposure.sector_proxy_tickers)
        ? cleanSectorProxyTickers(exposure.sector_proxy_tickers)
        : Array.isArray(exposure.possible_tickers_to_check)
          ? cleanSectorProxyTickers(exposure.possible_tickers_to_check)
          : [];
      return {
        node_id: String(nodeId),
        theme: String(exposure.theme || "").trim(),
        sector_or_theme_type: String(exposure.sector_or_theme_type || "theme").trim(),
        why_relevant: String(exposure.why_relevant || "").trim(),
        possible_tickers: sectorProxyTickers,
        sector_proxy_tickers: sectorProxyTickers,
        direction_hint: String(exposure.direction_hint || "mixed").trim().toLowerCase(),
        data_needed: String(exposure.data_needed || "").trim(),
        time_horizon: String(exposure.time_horizon || "").trim(),
        confidence: normalizeScore(exposure.confidence, 35),
      };
    }).filter((exposure) => exposure.theme || exposure.why_relevant || exposure.sector_proxy_tickers.length || exposure.data_needed);

    if (researchExposures.length) {
      const { error: exposureError } = await supabase.from("node_research_exposures").insert(researchExposures);
      if (exposureError) {
        warnings.push(`node_research_exposures was not saved: ${exposureError.message}`);
      }
    }

    const { error: detailsError } = await supabase.from("node_details").insert({
      node_id: nodeId,
      why_matters: generatedNode.why_matters,
      causal_chain: generatedNode.causal_chain,
      scenarios: generatedNode.scenarios,
      counterarguments: generatedNode.counterarguments,
      sources: generatedNode.sources,
    });

    if (detailsError) throw new Error(`Could not insert node details: ${detailsError.message}`);

    const { error: researchRunError } = await supabase.from("research_runs").insert({
      node_id: String(nodeId),
      raw_event_text: rawEventText,
      research_plan: researchPlan,
      evidence_map: validatedDraft.evidence_map,
      quality_gate: validatedDraft.quality_gate,
      missing_data: validatedDraft.missing_data,
      assets_to_research: assetsToResearch,
    });

    if (researchRunError) {
      warnings.push(`research_runs was not saved: ${researchRunError.message}`);
    }

    return jsonResponse({
      ok: true,
      node_id: nodeId,
      status: "draft",
      research_plan_summary: summarizeResearchPlan(researchPlan),
      transmission_channels: getTransmissionChannels(researchPlan),
      assets_to_research: assetsToResearch,
      missing_data: validatedDraft.missing_data,
      quality_gate_summary: summarizeQualityGate(validatedDraft.quality_gate),
      affected_assets_count: affectedAssets.length,
      warnings: [...warnings, ...(Array.isArray(validatedDraft.warnings) ? validatedDraft.warnings : [])],
      generated: generatedNode,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});




















