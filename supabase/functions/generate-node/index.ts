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

const gdeltDocApiEndpoint = "https://api.gdeltproject.org/api/v2/doc/doc";
const gdeltApiKeyNotice = "No GDELT API key required. No Supabase secret needed.";
const gdeltEndpointSummary = {
  endpoint: gdeltDocApiEndpoint,
  method: "GET",
  api_family: "GDELT DOC 2.0 API",
  query_parameter: "query",
  mode: "artlist",
  format: "json",
  maxrecords: 8,
  sort: "hybridrel",
  timespan: "14d",
  url_encoding: "URLSearchParams",
};
const gdeltCacheTtlMs = 10 * 60 * 1000;
const gdeltRequestCache = new Map<string, { expiresAt: number; result: Record<string, unknown> }>();

const fredObservationsEndpoint = "https://api.stlouisfed.org/fred/series/observations";
const fredSeriesEndpoint = "https://api.stlouisfed.org/fred/series";
const fredEndpointSummary = {
  api_family: "FRED API Version 1",
  observations_endpoint: fredObservationsEndpoint,
  metadata_endpoint: fredSeriesEndpoint,
  method: "GET",
  required_parameters: ["api_key", "series_id"],
  fixed_parameters: {
    file_type: "json",
    sort_order: "desc",
  },
  note: "Clarifin fetches selected series_id observations only; it does not use FRED Version 2 bulk release endpoints.",
};
const fredSeriesCatalog: Record<string, {
  title: string;
  type: string;
  defaultWindowYears: number;
  limit: number;
}> = {
  FEDFUNDS: { title: "Effective Federal Funds Rate", type: "rates", defaultWindowYears: 5, limit: 120 },
  DGS10: { title: "10-Year Treasury Constant Maturity Rate", type: "rates", defaultWindowYears: 2, limit: 520 },
  DGS2: { title: "2-Year Treasury Constant Maturity Rate", type: "rates", defaultWindowYears: 2, limit: 520 },
  T10Y2Y: { title: "10-Year Treasury minus 2-Year Treasury spread", type: "rates", defaultWindowYears: 5, limit: 260 },
  CPIAUCSL: { title: "Consumer Price Index", type: "inflation", defaultWindowYears: 5, limit: 120 },
  CPILFESL: { title: "Core CPI", type: "inflation", defaultWindowYears: 5, limit: 120 },
  UNRATE: { title: "Unemployment Rate", type: "labor", defaultWindowYears: 5, limit: 120 },
  PAYEMS: { title: "Nonfarm Payrolls", type: "labor", defaultWindowYears: 5, limit: 120 },
  ICSA: { title: "Initial Jobless Claims", type: "labor", defaultWindowYears: 2, limit: 160 },
  BAMLH0A0HYM2: { title: "ICE BofA US High Yield Option-Adjusted Spread", type: "credit", defaultWindowYears: 2, limit: 520 },
  NFCI: { title: "Chicago Fed National Financial Conditions Index", type: "financial_conditions", defaultWindowYears: 3, limit: 180 },
};
const fredRequestCache = new Map<string, { expiresAt: number; result: Record<string, unknown> }>();
const fredCacheTtlMs = 10 * 60 * 1000;

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
        required: ["title", "explanation", "direction", "time_horizon", "event", "mechanism", "sector_impact", "asset_impact", "watch"],
        properties: {
          title: { type: "string" },
          explanation: { type: "string" },
          direction: { type: "string", enum: ["positive", "negative", "mixed", "neutral"] },
          time_horizon: { type: "string" },
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

const candidateAssetEvaluationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["accepted_assets", "rejected_assets", "summary"],
  properties: {
    accepted_assets: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["candidate_asset", "candidate_name", "asset_class", "direction", "reason", "confidence"],
        properties: {
          candidate_asset: { type: "string" },
          candidate_name: { type: "string" },
          asset_class: { type: "string", enum: assetClassEnum },
          direction: { type: "string", enum: ["positive", "negative", "neutral", "mixed", "strongly positive", "strongly negative"] },
          reason: { type: "string" },
          confidence: { type: "integer", minimum: 0, maximum: 100 },
        },
      },
    },
    rejected_assets: {
      type: "array",
      maxItems: 24,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["candidate_asset", "reason"],
        properties: {
          candidate_asset: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
    summary: { type: "string" },
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

function cloneForDebug<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null)) as T;
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

function getResearchEntities(plan: Record<string, unknown>) {
  const entities = plan.entities as Record<string, unknown> | undefined;
  return {
    directly_mentioned_companies: cleanStringArray(entities?.directly_mentioned_companies),
    private_companies_or_entities: cleanStringArray(entities?.private_companies_or_entities),
    public_tickers_mentioned: cleanStringArray(entities?.public_tickers_mentioned).map((ticker) => ticker.toUpperCase()),
    people_mentioned: cleanStringArray(entities?.people_mentioned),
    products_or_business_lines: cleanStringArray(entities?.products_or_business_lines),
    geographies: cleanStringArray(entities?.geographies),
  };
}

function getDetectedRegions(plan: Record<string, unknown>) {
  const entities = getResearchEntities(plan);
  const classification = plan.event_classification as Record<string, unknown> | undefined;
  return uniqueStrings([
    ...entities.geographies,
    classification?.primary_theme,
    ...(Array.isArray(classification?.secondary_themes) ? classification.secondary_themes : []),
  ]).slice(0, 12);
}

function cleanSearchTerm(value: unknown) {
  return String(value || "")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[$#]/g, " ")
    .replace(/[^\p{L}\p{N}\s./&-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function quoteGdeltTerm(term: string) {
  const cleaned = cleanSearchTerm(term);
  if (!cleaned) return "";
  return /\s/.test(cleaned) ? `"${cleaned}"` : cleaned;
}

function keywordTermsFromText(text: string) {
  const stopWords = new Set([
    "after",
    "again",
    "around",
    "could",
    "from",
    "have",
    "into",
    "over",
    "said",
    "says",
    "that",
    "their",
    "this",
    "with",
    "would",
    "about",
    "according",
    "reported",
    "reportedly",
    "possible",
    "investors",
    "market",
    "markets",
  ]);
  return uniqueStrings(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word)),
  ).slice(0, 8);
}

function buildGdeltQuery(plan: Record<string, unknown>, rawEventText: string) {
  const entities = getResearchEntities(plan);
  const classification = plan.event_classification as Record<string, unknown> | undefined;
  const eventType = String(classification?.event_type || "").toLowerCase();
  const primaryEntities = uniqueStrings([
    ...entities.directly_mentioned_companies,
    ...entities.private_companies_or_entities,
    ...entities.public_tickers_mentioned,
    ...entities.geographies,
  ]).slice(0, 3);
  const eventSearchTerms: string[] = [];
  if (eventType.includes("escalation") || eventType.includes("conflict")) eventSearchTerms.push("military tensions", "security risk");
  if (eventType.includes("de-escalation") || eventType.includes("diplomatic")) eventSearchTerms.push("diplomatic talks", "de-escalation");
  if (eventType.includes("merger")) eventSearchTerms.push("merger talks", "deal speculation");
  if (eventType.includes("inflation")) eventSearchTerms.push("inflation data");
  if (eventType.includes("rate decision")) eventSearchTerms.push("rate decision");
  if (eventType.includes("earnings")) eventSearchTerms.push("earnings");
  const eventTerms = uniqueStrings([
    ...eventSearchTerms,
    ...keywordTermsFromText(rawEventText),
  ])
    .map(cleanSearchTerm)
    .filter((term) => term.length > 2)
    .filter((term) => !["Other", "unknown", "geopolitics", "governance", "demand"].includes(term))
    .slice(0, 3);
  const queryTerms = uniqueStrings([...primaryEntities, ...eventTerms])
    .map(quoteGdeltTerm)
    .filter(Boolean)
    .slice(0, 5);
  return queryTerms.join(" ").slice(0, 240);
}

function domainFromUrl(value: unknown) {
  const url = String(value || "").trim();
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function gdeltWarningForStatus(status: string, httpStatus?: number | null) {
  if (status === "rate_limited") return "GDELT rate-limited the request. Continuing without external headline support.";
  if (status === "timeout") return "GDELT request timed out. Continuing without external headline support.";
  if (status === "no_results") return "No recent related GDELT headlines were found for the lightweight query.";
  if (status === "skipped") return "GDELT skipped: no usable query.";
  if (httpStatus) return `GDELT research unavailable: HTTP ${httpStatus}. Continuing without external headline support.`;
  return "GDELT research unavailable. Continuing without external headline support.";
}

function buildGdeltDiagnostics(args: {
  attempted: boolean;
  status: "success" | "no_results" | "rate_limited" | "timeout" | "failed" | "skipped";
  query: string;
  httpStatus?: number | null;
  relatedHeadlineCount?: number;
  warning?: string;
  attempts?: number;
  cacheHit?: boolean;
  requestUrl?: string;
}) {
  const relatedHeadlineCount = Number(args.relatedHeadlineCount || 0);
  return {
    attempted: args.attempted,
    http_request_attempted: args.attempted && !args.cacheHit && args.status !== "skipped",
    succeeded: ["success", "no_results"].includes(args.status),
    status: args.status,
    query: args.query,
    endpoint_summary: gdeltEndpointSummary,
    http_status: args.httpStatus ?? null,
    related_headline_count: relatedHeadlineCount,
    warning: args.warning || (args.status === "success" ? "" : gdeltWarningForStatus(args.status, args.httpStatus ?? null)),
    api_key_notice: gdeltApiKeyNotice,
    attempts: args.attempts || 0,
    cache_hit: Boolean(args.cacheHit),
    request_url: args.requestUrl || "",
  };
}

function buildGdeltUrl(query: string) {
  const url = new URL(gdeltDocApiEndpoint);
  url.search = new URLSearchParams({
    query,
    mode: String(gdeltEndpointSummary.mode),
    format: String(gdeltEndpointSummary.format),
    maxrecords: String(gdeltEndpointSummary.maxrecords),
    sort: String(gdeltEndpointSummary.sort),
    timespan: String(gdeltEndpointSummary.timespan),
  }).toString();
  return url.toString();
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isoDateYearsAgo(years: number) {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.toISOString().slice(0, 10);
}

async function fetchGdeltRelatedNews(query: string) {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) {
    const diagnostics = buildGdeltDiagnostics({
      attempted: false,
      status: "skipped",
      query: "",
      warning: gdeltWarningForStatus("skipped"),
    });
    return {
      related_news: [],
      source_domains: [],
      warnings: [diagnostics.warning],
      diagnostics,
    };
  }

  const cacheKey = normalizedQuery.toLowerCase();
  const cached = gdeltRequestCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    const cachedResult = cloneForDebug(cached.result);
    const diagnostics = cachedResult.diagnostics as Record<string, unknown>;
    cachedResult.diagnostics = {
      ...diagnostics,
      attempted: true,
      http_request_attempted: false,
      cache_hit: true,
    };
    return cachedResult;
  }

  const requestUrl = buildGdeltUrl(normalizedQuery);
  const maxAttempts = 3;
  const timeoutMs = 4500;
  let lastHttpStatus: number | null = null;
  let finalWarning = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(requestUrl, { signal: controller.signal });
      lastHttpStatus = response.status;
      clearTimeout(timeoutId);

      if (response.status === 429) {
        finalWarning = gdeltWarningForStatus("rate_limited", response.status);
        if (attempt < maxAttempts) {
          const retryAfter = Number(response.headers.get("retry-after"));
          const retryDelayMs = Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(1200, retryAfter * 1000)
            : 350 + ((attempt - 1) * 450);
          await delay(retryDelayMs);
          continue;
        }
        const diagnostics = buildGdeltDiagnostics({
          attempted: true,
          status: "rate_limited",
          query: normalizedQuery,
          httpStatus: response.status,
          warning: finalWarning,
          attempts: attempt,
          requestUrl,
        });
        return {
          related_news: [],
          source_domains: [],
          warnings: [diagnostics.warning],
          diagnostics,
        };
      }

      if (!response.ok) {
        finalWarning = gdeltWarningForStatus("failed", response.status);
        if (response.status >= 500 && attempt < maxAttempts) {
          await delay(350 + ((attempt - 1) * 450));
          continue;
        }
        const diagnostics = buildGdeltDiagnostics({
          attempted: true,
          status: "failed",
          query: normalizedQuery,
          httpStatus: response.status,
          warning: finalWarning,
          attempts: attempt,
          requestUrl,
        });
        return {
          related_news: [],
          source_domains: [],
          warnings: [diagnostics.warning],
          diagnostics,
        };
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("json")) {
        const diagnostics = buildGdeltDiagnostics({
          attempted: true,
          status: "failed",
          query: normalizedQuery,
          httpStatus: response.status,
          warning: "GDELT returned a non-JSON response. Continuing without external headline support.",
          attempts: attempt,
          requestUrl,
        });
        return {
          related_news: [],
          source_domains: [],
          warnings: [diagnostics.warning],
          diagnostics,
        };
      }

      const payload = await response.json();
      const articles = Array.isArray(payload.articles) ? payload.articles : [];
      const relatedNews = articles
        .map((article: Record<string, unknown>) => {
          const urlValue = String(article.url || "").trim();
          const domain = String(article.domain || "").trim() || domainFromUrl(urlValue);
          return {
            title: String(article.title || "").trim(),
            url: urlValue,
            domain,
            date: String(article.seendate || article.datetime || article.date || "").trim(),
          };
        })
        .filter((article: Record<string, unknown>) => article.title || article.url)
        .slice(0, Number(gdeltEndpointSummary.maxrecords));
      const sourceDomains = uniqueStrings(relatedNews.map((article) => article.domain)).slice(0, 10);
      const status = relatedNews.length ? "success" : "no_results";
      const diagnostics = buildGdeltDiagnostics({
        attempted: true,
        status,
        query: normalizedQuery,
        httpStatus: response.status,
        relatedHeadlineCount: relatedNews.length,
        warning: status === "no_results" ? gdeltWarningForStatus("no_results") : "",
        attempts: attempt,
        requestUrl,
      });
      const result = {
        related_news: relatedNews,
        source_domains: sourceDomains,
        warnings: diagnostics.warning ? [diagnostics.warning] : [],
        diagnostics,
      };
      gdeltRequestCache.set(cacheKey, {
        expiresAt: Date.now() + gdeltCacheTtlMs,
        result: cloneForDebug(result),
      });
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === "AbortError") {
        const diagnostics = buildGdeltDiagnostics({
          attempted: true,
          status: "timeout",
          query: normalizedQuery,
          httpStatus: lastHttpStatus,
          warning: gdeltWarningForStatus("timeout"),
          attempts: attempt,
          requestUrl,
        });
        return {
          related_news: [],
          source_domains: [],
          warnings: [diagnostics.warning],
          diagnostics,
        };
      }

      finalWarning = gdeltWarningForStatus("failed", lastHttpStatus);
      if (attempt < maxAttempts) {
        await delay(350 + ((attempt - 1) * 450));
        continue;
      }
      const diagnostics = buildGdeltDiagnostics({
        attempted: true,
        status: "failed",
        query: normalizedQuery,
        httpStatus: lastHttpStatus,
        warning: finalWarning,
        attempts: attempt,
        requestUrl,
      });
      return {
        related_news: [],
        source_domains: [],
        warnings: [diagnostics.warning],
        diagnostics,
      };
    }
  }

  const diagnostics = buildGdeltDiagnostics({
    attempted: true,
    status: "failed",
    query: normalizedQuery,
    httpStatus: lastHttpStatus,
    warning: finalWarning || gdeltWarningForStatus("failed", lastHttpStatus),
    attempts: maxAttempts,
    requestUrl,
  });
  return {
    related_news: [],
    source_domains: [],
    warnings: [diagnostics.warning],
    diagnostics,
  };
}

function buildGdeltExternalResearchItem(query: string, gdeltResult: Record<string, unknown>) {
  const diagnostics = gdeltResult.diagnostics as Record<string, unknown> | undefined;
  const relatedNews = Array.isArray(gdeltResult.related_news)
    ? gdeltResult.related_news as Record<string, unknown>[]
    : [];
  const sourceDomains = Array.isArray(gdeltResult.source_domains)
    ? gdeltResult.source_domains as string[]
    : [];
  const status = String(diagnostics?.status || "failed");
  const warning = String(diagnostics?.warning || "").trim();
  const dataQuality = status === "success" && relatedNews.length ? "low" : status === "no_results" ? "low" : "unknown";

  return {
    source_name: "GDELT",
    source_type: "news",
    query_or_endpoint: query || gdeltDocApiEndpoint,
    request_summary: {
      query,
      endpoint_summary: gdeltEndpointSummary,
      attempted: Boolean(diagnostics?.attempted),
      attempts: diagnostics?.attempts || 0,
      cache_hit: Boolean(diagnostics?.cache_hit),
      api_key_notice: gdeltApiKeyNotice,
      note: "GDELT headlines are supporting metadata only, not full article research.",
    },
    response_summary: {
      status,
      http_status: diagnostics?.http_status ?? null,
      related_headline_count: relatedNews.length,
      source_domains: sourceDomains,
      warning,
    },
    raw_payload: {
      related_news: relatedNews,
      source_domains: sourceDomains,
      diagnostics,
    },
    extracted_facts: {
      headlines: relatedNews.map((item) => ({
        title: item.title || "",
        domain: item.domain || "",
        date: item.date || "",
      })),
      source_domains: sourceDomains,
      caveat: "Headlines were not treated as article confirmation.",
    },
    status,
    warning: warning || null,
    used_in_final_node: relatedNews.length > 0,
    data_quality: dataQuality,
  };
}

async function collectGdeltResearch(args: {
  researchPlan: Record<string, unknown>;
  rawEventText: string;
}) {
  const gdeltQuery = buildGdeltQuery(args.researchPlan, args.rawEventText);
  const gdeltResult = await fetchGdeltRelatedNews(gdeltQuery);
  return {
    gdeltQuery,
    gdeltResult,
    externalResearchItem: buildGdeltExternalResearchItem(gdeltQuery, gdeltResult),
  };
}

function getFredTopicText(researchPlan: Record<string, unknown>, rawEventText: string) {
  const classification = researchPlan.event_classification as Record<string, unknown> | undefined;
  const channels = getTransmissionChannels(researchPlan)
    .map((channel) => [
      channel.channel,
      channel.mechanism,
      channel.time_horizon,
      ...(Array.isArray(channel.missing_data) ? channel.missing_data : []),
    ].filter(Boolean).join(" "));
  return [
    rawEventText,
    classification?.category,
    classification?.event_type,
    classification?.primary_theme,
    ...(Array.isArray(classification?.secondary_themes) ? classification?.secondary_themes as string[] : []),
    ...channels,
  ].map((value) => String(value || "").toLowerCase()).join(" ");
}

function shouldRunFredMacroResearch(researchPlan: Record<string, unknown>, rawEventText: string) {
  const text = getFredTopicText(researchPlan, rawEventText);
  const macroTerms = [
    "macro",
    "fed",
    "federal reserve",
    "fomc",
    "rate decision",
    "interest rate",
    "rates",
    "bond yield",
    "bond yields",
    "treasury",
    "yield curve",
    "inflation",
    "cpi",
    "core cpi",
    "labor market",
    "labour market",
    "unemployment",
    "payroll",
    "payrolls",
    "jobs report",
    "jobless claims",
    "recession",
    "credit spread",
    "credit spreads",
    "financial conditions",
    "high yield spread",
  ];
  const nonMacroTerms = [
    "earnings release",
    "earnings preview",
    "product launch",
    "cybersecurity event",
    "ceo resignation",
    "merger",
    "acquisition",
  ];
  if (!textIncludesAny(text, macroTerms)) return false;
  if (textIncludesAny(text, nonMacroTerms) && !textIncludesAny(text, ["rates", "inflation", "fed", "labor", "unemployment", "recession", "yield"])) return false;
  return true;
}

function selectFredSeriesForTopic(researchPlan: Record<string, unknown>, rawEventText: string) {
  const text = getFredTopicText(researchPlan, rawEventText);
  const series = new Set<string>();
  const add = (values: string[]) => values.forEach((value) => series.add(value));

  if (textIncludesAny(text, ["fed", "federal reserve", "fomc", "rate decision", "policy rate", "interest rate", "rates"])) {
    add(["FEDFUNDS", "DGS10", "DGS2", "T10Y2Y"]);
  }
  if (textIncludesAny(text, ["bond yield", "bond yields", "treasury", "10-year", "2-year", "yield curve", "inversion", "duration"])) {
    add(["DGS10", "DGS2", "T10Y2Y", "FEDFUNDS"]);
  }
  if (textIncludesAny(text, ["inflation", "cpi", "core cpi", "price index", "prices"])) {
    add(["CPIAUCSL", "CPILFESL", "FEDFUNDS", "DGS10"]);
  }
  if (textIncludesAny(text, ["labor market", "labour market", "unemployment", "payroll", "payrolls", "jobs report", "jobless claims", "initial claims"])) {
    add(["UNRATE", "PAYEMS", "ICSA", "FEDFUNDS"]);
  }
  if (textIncludesAny(text, ["recession", "slowdown", "growth scare", "hard landing", "soft landing"])) {
    add(["T10Y2Y", "UNRATE", "PAYEMS", "NFCI", "BAMLH0A0HYM2"]);
  }
  if (textIncludesAny(text, ["credit spread", "credit spreads", "high yield", "financial conditions", "funding stress", "credit stress", "liquidity"])) {
    add(["BAMLH0A0HYM2", "NFCI", "DGS10", "FEDFUNDS"]);
  }
  if (!series.size && shouldRunFredMacroResearch(researchPlan, rawEventText)) {
    add(["FEDFUNDS", "DGS10", "CPIAUCSL", "UNRATE"]);
  }

  return [...series]
    .filter((seriesId) => Boolean(fredSeriesCatalog[seriesId]))
    .slice(0, 6);
}

function fredWarningForStatus(status: string, seriesId?: string, httpStatus?: number | null) {
  const prefix = seriesId ? `FRED ${seriesId}` : "FRED";
  if (status === "skipped") return "FRED macro research skipped. No macro/rates/inflation/labor/Fed trigger or no FRED_API_KEY was available.";
  if (status === "timeout") return `${prefix} request timed out. Continuing without this macro series.`;
  if (status === "no_results") return `${prefix} returned no usable observations. Continuing without this macro series.`;
  if (httpStatus) return `${prefix} request failed with HTTP ${httpStatus}. Continuing without this macro series.`;
  return `${prefix} request failed. Continuing without this macro series.`;
}

function sanitizeExternalErrorMessage(message: string) {
  return String(message || "")
    .replace(/api_key=[A-Za-z0-9_-]+/gi, "api_key=[redacted]")
    .replace(/[A-Za-z0-9]{24,}/g, "[redacted]")
    .slice(0, 280);
}

function parseFredErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { error_code: "", error_message: "" };
  }
  const record = payload as Record<string, unknown>;
  return {
    error_code: String(record.error_code || record.code || "").trim(),
    error_message: sanitizeExternalErrorMessage(String(record.error_message || record.message || record.error || "").trim()),
  };
}

async function readFredErrorResponse(response: Response) {
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("json")) return parseFredErrorPayload(await response.json());
    return {
      error_code: "",
      error_message: sanitizeExternalErrorMessage(await response.text()),
    };
  } catch (_error) {
    return { error_code: "", error_message: "" };
  }
}

function buildFredObservationParams(args: {
  seriesId: string;
  observationStart: string;
  limit: number;
}) {
  const params: Record<string, string> = {
    series_id: String(args.seriesId || "").trim(),
    file_type: "json",
    sort_order: "desc",
    observation_start: String(args.observationStart || "").trim(),
    limit: String(args.limit || "").trim(),
  };
  return Object.fromEntries(Object.entries(params).filter(([_key, value]) => value));
}

function buildFredObservationsUrl(args: {
  seriesId: string;
  apiKey: string;
  observationStart: string;
  limit: number;
}) {
  const url = new URL(fredObservationsEndpoint);
  const params = buildFredObservationParams(args);
  url.search = new URLSearchParams({
    ...params,
    api_key: args.apiKey,
  }).toString();
  return url.toString();
}

function cleanFredObservations(observations: unknown[]) {
  return observations
    .map((observation: Record<string, unknown>) => {
      const value = Number(observation.value);
      return {
        date: String(observation.date || "").trim(),
        value: Number.isFinite(value) ? value : null,
      };
    })
    .filter((observation) => observation.date && observation.value !== null) as Array<{ date: string; value: number }>;
}

function findObservationAtLeastMonthsBefore(observationsDesc: Array<{ date: string; value: number }>, latestDate: string, months: number) {
  const target = new Date(`${latestDate}T00:00:00.000Z`);
  target.setUTCMonth(target.getUTCMonth() - months);
  const targetTime = target.getTime();
  return observationsDesc.find((observation) => new Date(`${observation.date}T00:00:00.000Z`).getTime() <= targetTime);
}

function summarizeFredSeries(seriesId: string, observationsDesc: Array<{ date: string; value: number }>) {
  const latest = observationsDesc[0];
  const previous = observationsDesc[1];
  const threeMonth = latest ? findObservationAtLeastMonthsBefore(observationsDesc, latest.date, 3) : undefined;
  const twelveMonth = latest ? findObservationAtLeastMonthsBefore(observationsDesc, latest.date, 12) : undefined;
  const change = latest && previous ? latest.value - previous.value : null;
  return {
    series_id: seriesId,
    title: fredSeriesCatalog[seriesId]?.title || seriesId,
    latest_value: latest?.value ?? null,
    latest_date: latest?.date || "",
    previous_value: previous?.value ?? null,
    previous_date: previous?.date || "",
    change_from_previous: change === null ? null : Number(change.toFixed(4)),
    three_month_change: latest && threeMonth ? Number((latest.value - threeMonth.value).toFixed(4)) : null,
    twelve_month_change: latest && twelveMonth ? Number((latest.value - twelveMonth.value).toFixed(4)) : null,
  };
}

function buildFredSeriesExternalResearchItem(args: {
  seriesId: string;
  status: string;
  observationStart: string;
  httpStatus?: number | null;
  errorCode?: string;
  errorMessage?: string;
  warning?: string;
  observations?: Array<{ date: string; value: number }>;
  attempts?: number;
  apiKeyDetected: boolean;
}) {
  const seriesInfo = fredSeriesCatalog[args.seriesId] || { title: args.seriesId, type: "macro", defaultWindowYears: 3, limit: 120 };
  const facts = args.observations?.length
    ? summarizeFredSeries(args.seriesId, args.observations)
    : {
      series_id: args.seriesId,
      title: seriesInfo.title,
      latest_value: null,
      latest_date: "",
      previous_value: null,
      previous_date: "",
      change_from_previous: null,
      three_month_change: null,
      twelve_month_change: null,
    };
  const baseWarning = args.status === "success" ? "" : fredWarningForStatus(args.status, args.seriesId, args.httpStatus ?? null);
  const warning = args.warning || (args.errorMessage ? `${baseWarning} FRED said: ${args.errorMessage}` : baseWarning);
  const parametersSentExcludingApiKey = buildFredObservationParams({
    seriesId: args.seriesId,
    observationStart: args.observationStart,
    limit: seriesInfo.limit,
  });

  return {
    source_name: "FRED",
    source_type: "macro",
    query_or_endpoint: `fred/series/observations:${args.seriesId}`,
    request_summary: {
      api_version: "1",
      endpoint_summary: fredEndpointSummary,
      series_id: args.seriesId,
      title: seriesInfo.title,
      observation_start: args.observationStart,
      limit: seriesInfo.limit,
      file_type: "json",
      api_key_detected: args.apiKeyDetected,
      parameters_sent_excluding_api_key: parametersSentExcludingApiKey,
    },
    response_summary: {
      status: args.status,
      http_status: args.httpStatus ?? null,
      error_code: args.errorCode || "",
      error_message: args.errorMessage || "",
      latest_date: facts.latest_date,
      latest_value: facts.latest_value,
      previous_value: facts.previous_value,
      change_from_previous: facts.change_from_previous,
      warning,
      attempts: args.attempts || 0,
    },
    raw_payload: {
      observations: (args.observations || []).slice(0, 12),
      note: "Limited recent observations only; API key and request URL are not stored.",
    },
    extracted_facts: facts,
    status: args.status,
    warning: warning || null,
    used_in_final_node: args.status === "success",
    data_quality: args.status === "success" ? "high" : "unknown",
  };
}

function buildFredSkippedExternalResearchItem(args: {
  reason: string;
  seriesIds: string[];
  apiKeyDetected: boolean;
}) {
  return {
    source_name: "FRED",
    source_type: "macro",
    query_or_endpoint: "fred/series/observations",
    request_summary: {
      api_version: "1",
      endpoint_summary: fredEndpointSummary,
      selected_series: args.seriesIds,
      api_key_detected: args.apiKeyDetected,
    },
    response_summary: {
      status: "skipped",
      reason: args.reason,
    },
    raw_payload: null,
    extracted_facts: {
      selected_series: args.seriesIds,
      reason: args.reason,
    },
    status: "skipped",
    warning: args.reason,
    used_in_final_node: false,
    data_quality: "unknown",
  };
}

async function fetchFredSeriesObservations(args: {
  seriesId: string;
  apiKey: string;
  skipCache?: boolean;
}) {
  const seriesInfo = fredSeriesCatalog[args.seriesId];
  const observationStart = isoDateYearsAgo(seriesInfo.defaultWindowYears);
  const cacheKey = `${args.seriesId}|${observationStart}`;
  const cached = fredRequestCache.get(cacheKey);
  if (!args.skipCache && cached && cached.expiresAt > Date.now()) {
    return cloneForDebug(cached.result);
  }

  const requestUrl = buildFredObservationsUrl({
    seriesId: args.seriesId,
    apiKey: args.apiKey,
    observationStart,
    limit: seriesInfo.limit,
  });
  const timeoutMs = 4500;
  const maxAttempts = 2;
  let lastHttpStatus: number | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(requestUrl, { signal: controller.signal });
      lastHttpStatus = response.status;
      clearTimeout(timeoutId);

      if (!response.ok) {
        const fredError = await readFredErrorResponse(response);
        if (response.status >= 500 && attempt < maxAttempts) {
          await delay(350);
          continue;
        }
        return buildFredSeriesExternalResearchItem({
          seriesId: args.seriesId,
          status: "failed",
          observationStart,
          httpStatus: response.status,
          errorCode: fredError.error_code,
          errorMessage: fredError.error_message,
          attempts: attempt,
          apiKeyDetected: true,
        });
      }

      const payload = await response.json();
      const observations = cleanFredObservations(Array.isArray(payload.observations) ? payload.observations : []);
      const status = observations.length ? "success" : "no_results";
      const item = buildFredSeriesExternalResearchItem({
        seriesId: args.seriesId,
        status,
        observationStart,
        httpStatus: response.status,
        observations,
        attempts: attempt,
        apiKeyDetected: true,
      });
      fredRequestCache.set(cacheKey, {
        expiresAt: Date.now() + fredCacheTtlMs,
        result: cloneForDebug(item),
      });
      return item;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === "AbortError") {
        return buildFredSeriesExternalResearchItem({
          seriesId: args.seriesId,
          status: "timeout",
          observationStart,
          httpStatus: lastHttpStatus,
          attempts: attempt,
          apiKeyDetected: true,
        });
      }
      if (attempt < maxAttempts) {
        await delay(350);
        continue;
      }
      return buildFredSeriesExternalResearchItem({
        seriesId: args.seriesId,
        status: "failed",
        observationStart,
        httpStatus: lastHttpStatus,
        attempts: attempt,
        apiKeyDetected: true,
      });
    }
  }

  return buildFredSeriesExternalResearchItem({
    seriesId: args.seriesId,
    status: "failed",
    observationStart,
    httpStatus: lastHttpStatus,
    attempts: maxAttempts,
    apiKeyDetected: true,
  });
}

function summarizeFredDiagnostics(items: Record<string, unknown>[], triggered: boolean, apiKeyDetected: boolean) {
  const fredItems = items.filter((item) => String(item.source_name || "") === "FRED");
  const seriesAttempted = uniqueStrings(fredItems.flatMap((item) => {
    const facts = item.extracted_facts as Record<string, unknown> | undefined;
    const selected = Array.isArray(facts?.selected_series) ? facts?.selected_series as string[] : [];
    const seriesId = String(facts?.series_id || "").trim();
    return seriesId ? [seriesId] : selected;
  }).map((seriesId) => String(seriesId || "").trim()).filter(Boolean));
  const seriesSuccessful = fredItems
    .filter((item) => String(item.status || "") === "success")
    .map((item) => String((item.extracted_facts as Record<string, unknown> | undefined)?.series_id || "").trim())
    .filter(Boolean);
  const seriesFailed = fredItems
    .filter((item) => ["failed", "timeout", "no_results"].includes(String(item.status || "")))
    .map((item) => String((item.extracted_facts as Record<string, unknown> | undefined)?.series_id || "").trim())
    .filter(Boolean);
  const warnings = fredItems.map((item) => String(item.warning || "").trim()).filter(Boolean);
  const anyTimeout = fredItems.some((item) => String(item.status || "") === "timeout");
  const anyFailed = fredItems.some((item) => String(item.status || "") === "failed");
  const anyNoResults = fredItems.some((item) => String(item.status || "") === "no_results");
  const anySuccess = seriesSuccessful.length > 0;
  const status = !triggered
    ? "skipped"
    : !apiKeyDetected
      ? "skipped"
      : anySuccess && (seriesFailed.length || anyTimeout || anyFailed || anyNoResults)
        ? "partial_success"
        : anySuccess
          ? "success"
          : anyTimeout
            ? "timeout"
            : (anyFailed || anyNoResults)
              ? "failed"
              : "skipped";

  return {
    attempted: triggered && apiKeyDetected && seriesAttempted.length > 0,
    triggered,
    status,
    api_key_detected: apiKeyDetected,
    endpoint_summary: fredEndpointSummary,
    series_attempted: seriesAttempted,
    series_successful: seriesSuccessful,
    series_failed: seriesFailed,
    warnings: uniqueStrings(warnings),
  };
}

async function collectFredMacroResearch(args: {
  researchPlan: Record<string, unknown>;
  rawEventText: string;
  apiKey?: string;
}) {
  const triggered = shouldRunFredMacroResearch(args.researchPlan, args.rawEventText);
  const seriesIds = triggered ? selectFredSeriesForTopic(args.researchPlan, args.rawEventText) : [];
  const apiKeyDetected = Boolean(args.apiKey);
  const items: Record<string, unknown>[] = [];

  if (!triggered) {
    return {
      items,
      diagnostics: summarizeFredDiagnostics(items, false, apiKeyDetected),
      facts: [],
    };
  }

  if (!apiKeyDetected) {
    items.push(buildFredSkippedExternalResearchItem({
      reason: "FRED_API_KEY is not configured. Continuing without FRED macro support.",
      seriesIds,
      apiKeyDetected,
    }));
    return {
      items,
      diagnostics: summarizeFredDiagnostics(items, true, apiKeyDetected),
      facts: [],
    };
  }

  for (const seriesId of seriesIds) {
    items.push(await fetchFredSeriesObservations({
      seriesId,
      apiKey: args.apiKey || "",
    }));
  }

  return {
    items,
    diagnostics: summarizeFredDiagnostics(items, true, apiKeyDetected),
    facts: items
      .filter((item) => String(item.status || "") === "success")
      .map((item) => item.extracted_facts),
  };
}

async function runFredConnectivityDebug(args: {
  apiKey?: string;
  seriesId?: string;
}) {
  const requestedSeriesId = String(args.seriesId || "DGS10").trim().toUpperCase();
  const seriesId = fredSeriesCatalog[requestedSeriesId] ? requestedSeriesId : "DGS10";
  const apiKeyDetected = Boolean(args.apiKey);
  const seriesInfo = fredSeriesCatalog[seriesId];
  const observationStart = isoDateYearsAgo(seriesInfo.defaultWindowYears);
  const parametersSentExcludingApiKey = buildFredObservationParams({
    seriesId,
    observationStart,
    limit: seriesInfo.limit,
  });

  if (!apiKeyDetected) {
    return {
      ok: false,
      debug_only: true,
      node_created: false,
      external_research_items_created: 0,
      fred_api_key_detected: false,
      series_id: seriesId,
      endpoint_reached: false,
      http_status: null,
      observations_returned: false,
      latest_observation_date: "",
      latest_observation_value: null,
      fred_error_code: "",
      fred_error_message: "FRED_API_KEY is not configured.",
      safe_endpoint_summary: fredEndpointSummary,
      parameters_sent_excluding_api_key: parametersSentExcludingApiKey,
      status: "skipped",
      warning: "FRED connectivity debug skipped because FRED_API_KEY is not configured.",
    };
  }

  const item = await fetchFredSeriesObservations({
    seriesId,
    apiKey: args.apiKey || "",
    skipCache: true,
  });
  const responseSummary = item.response_summary as Record<string, unknown> | undefined;
  const facts = item.extracted_facts as Record<string, unknown> | undefined;
  const httpStatus = Number(responseSummary?.http_status);

  return {
    ok: String(item.status || "") === "success",
    debug_only: true,
    node_created: false,
    external_research_items_created: 0,
    fred_api_key_detected: true,
    series_id: seriesId,
    endpoint_reached: Number.isFinite(httpStatus),
    http_status: Number.isFinite(httpStatus) ? httpStatus : null,
    observations_returned: String(item.status || "") === "success",
    latest_observation_date: facts?.latest_date || "",
    latest_observation_value: facts?.latest_value ?? null,
    fred_error_code: responseSummary?.error_code || "",
    fred_error_message: responseSummary?.error_message || "",
    safe_endpoint_summary: fredEndpointSummary,
    parameters_sent_excluding_api_key: parametersSentExcludingApiKey,
    status: item.status || "failed",
    warning: item.warning || "",
  };
}

async function saveExternalResearchItem(supabase: any, item: Record<string, unknown>, links: {
  nodeId?: string;
  researchRunId?: string;
}) {
  const row = {
    node_id: links.nodeId || null,
    research_run_id: links.researchRunId || null,
    source_name: item.source_name,
    source_type: item.source_type,
    query_or_endpoint: item.query_or_endpoint,
    request_summary: item.request_summary || {},
    response_summary: item.response_summary || {},
    raw_payload: item.raw_payload || null,
    extracted_facts: item.extracted_facts || null,
    status: item.status || "failed",
    warning: item.warning || null,
    used_in_final_node: Boolean(item.used_in_final_node),
    data_quality: item.data_quality || "unknown",
  };

  const { data, error } = await supabase
    .from("external_research_items")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      source_name: row.source_name,
      status: row.status,
      warning: `external_research_items insert failed for ${row.source_name}: ${error.message}`,
    };
  }

  return {
    ok: true,
    id: data?.id || null,
    source_name: row.source_name,
    status: row.status,
    warning: row.warning,
  };
}

async function saveExternalResearchItems(supabase: any, items: Record<string, unknown>[], links: {
  nodeId?: string;
  researchRunId?: string;
}) {
  const results: Record<string, unknown>[] = [];
  for (const item of items) {
    results.push(await saveExternalResearchItem(supabase, item, links));
  }
  return results;
}

function summarizeExternalResearchItems(items: Record<string, unknown>[], saveResults: Record<string, unknown>[]) {
  const sourceNames = uniqueStrings(items.map((item) => String(item.source_name || "").trim()).filter(Boolean));
  const attemptedSources = uniqueStrings(items
    .filter((item) => String(item.status || "") !== "skipped")
    .map((item) => String(item.source_name || "").trim())
    .filter(Boolean));
  const successfulSources = uniqueStrings(items
    .filter((item) => String(item.status || "") === "success")
    .map((item) => String(item.source_name || "").trim())
    .filter(Boolean));
  const failedOrSkippedSources = uniqueStrings(items
    .filter((item) => ["failed", "timeout", "rate_limited", "skipped", "no_results"].includes(String(item.status || "")))
    .map((item) => String(item.source_name || "").trim())
    .filter(Boolean));
  const saveWarnings = saveResults
    .filter((result) => result.ok === false)
    .map((result) => String(result.warning || "").trim())
    .filter(Boolean);
  const sourceWarnings = items
    .map((item) => String(item.warning || "").trim())
    .filter(Boolean);

  return {
    external_research_items_created: saveResults.filter((result) => result.ok === true).length,
    sources_attempted: attemptedSources,
    sources_successful: successfulSources,
    sources_failed_or_skipped: failedOrSkippedSources,
    source_statuses: items.map((item) => ({
      source_name: item.source_name || "",
      source_type: item.source_type || "",
      status: item.status || "",
      data_quality: item.data_quality || "unknown",
      used_in_final_node: Boolean(item.used_in_final_node),
    })),
    warnings: uniqueStrings([...sourceWarnings, ...saveWarnings]),
    sources_considered: sourceNames,
  };
}

function buildResearchFactPack(args: {
  rawEventText: string;
  researchPlan: Record<string, unknown>;
  gdeltQuery: string;
  gdeltResult: Record<string, unknown>;
  fredDiagnostics?: Record<string, unknown>;
  fredFacts?: unknown[];
  candidateAssets: Record<string, unknown>[];
}) {
  const classification = args.researchPlan.event_classification as Record<string, unknown> | undefined;
  const entities = getResearchEntities(args.researchPlan);
  const regions = getDetectedRegions(args.researchPlan);
  const relatedNews = Array.isArray(args.gdeltResult.related_news)
    ? args.gdeltResult.related_news as Record<string, unknown>[]
    : [];
  const sourceDomains = Array.isArray(args.gdeltResult.source_domains)
    ? args.gdeltResult.source_domains as string[]
    : [];
  const gdeltWarnings = Array.isArray(args.gdeltResult.warnings)
    ? args.gdeltResult.warnings as string[]
    : [];
  const gdeltDiagnostics = args.gdeltResult.diagnostics || buildGdeltDiagnostics({
    attempted: false,
    status: "skipped",
    query: args.gdeltQuery,
  });
  const fredDiagnostics = args.fredDiagnostics || summarizeFredDiagnostics([], false, false);
  const fredWarnings = Array.isArray(fredDiagnostics.warnings) ? fredDiagnostics.warnings as string[] : [];
  const missingData = uniqueStrings([
    ...(Array.isArray(args.researchPlan.data_needed_before_strong_conclusion) ? args.researchPlan.data_needed_before_strong_conclusion : []),
    ...(Array.isArray(args.researchPlan.not_known_from_input) ? args.researchPlan.not_known_from_input : []),
    ...collectTransmissionMissingData(args.researchPlan),
    relatedNews.length ? "" : "No recent related GDELT headlines were found for the lightweight query.",
    "Full article text was not fetched in this version.",
  ]);
  const eventStatus = normalizeEventStatus(classification?.event_status || "unknown");
  const eventStatusHint = relatedNews.length >= 3 && sourceDomains.length >= 2
    ? `${eventStatus}; multiple related GDELT headlines found, but headline metadata is not article confirmation`
    : `${eventStatus}; weak, unavailable, or limited GDELT headline signal`;

  return {
    normalized_query: args.gdeltQuery,
    detected_entities: entities,
    detected_regions: regions,
    gdelt_diagnostics: gdeltDiagnostics,
    fred_diagnostics: fredDiagnostics,
    fred_macro_facts: Array.isArray(args.fredFacts) ? args.fredFacts : [],
    event_status_hint: eventStatusHint,
    related_news_count: relatedNews.length,
    related_news_headlines: relatedNews,
    source_domains: sourceDomains,
    research_warnings: uniqueStrings([...gdeltWarnings, ...fredWarnings]),
    missing_data: missingData,
    candidate_assets_from_exposure_map: args.candidateAssets,
  };
}

function summarizeResearchFactPack(factPack: Record<string, unknown>) {
  return {
    normalized_query: factPack.normalized_query || "",
    event_status_hint: factPack.event_status_hint || "",
    gdelt_diagnostics: factPack.gdelt_diagnostics || {},
    fred_diagnostics: factPack.fred_diagnostics || {},
    fred_macro_facts_count: Array.isArray(factPack.fred_macro_facts) ? factPack.fred_macro_facts.length : 0,
    related_news_count: factPack.related_news_count || 0,
    source_domains: Array.isArray(factPack.source_domains) ? factPack.source_domains : [],
    research_warnings: Array.isArray(factPack.research_warnings) ? factPack.research_warnings : [],
    missing_data_count: Array.isArray(factPack.missing_data) ? factPack.missing_data.length : 0,
    candidate_assets_count: Array.isArray(factPack.candidate_assets_from_exposure_map)
      ? factPack.candidate_assets_from_exposure_map.length
      : 0,
  };
}

function mergeCandidateLists(first: Record<string, unknown>[], second: Record<string, unknown>[]) {
  const seen = new Set<string>();
  return [...first, ...second].filter((candidate) => {
    const key = `${candidate.exposure_key || ""}|${candidate.candidate_asset || ""}`.toUpperCase();
    if (!key.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  "TLT", "BND", "IEF", "SHY", "US10Y", "BUND YIELD",
  "BRENT", "WTI", "BRENT CRUDE", "WTI CRUDE", "USO", "GLD", "GOLD",
  "DXY", "EUR/USD", "USD/JPY", "GBP/USD",
  "LMT", "NOC", "RTX", "GD",
  "CCL", "RCL", "NCLH",
  "DAL", "UAL", "AAL", "LUV",
  "EEM", "EWZ", "EWW",
]);

const oilCommodityAssets = new Set(["BRENT", "BRENT CRUDE", "WTI", "WTI CRUDE", "USO"]);
const safeHavenAssets = new Set(["GLD", "GOLD"]);
const currencyAssets = new Set(["DXY", "EUR/USD", "USD/JPY", "GBP/USD"]);
const broadIndexAssets = new Set(["SPY", "QQQ", "DIA", "IWM", "DAX", "SX5E", "EXS1", "EEM", "EWZ", "EWW"]);
const bondRateAssets = new Set(["TLT", "BND", "IEF", "SHY", "US10Y", "BUND YIELD"]);
const defenseAssets = new Set(["LMT", "NOC", "RTX", "GD"]);
const cruiseAssets = new Set(["CCL", "RCL", "NCLH"]);
const airlineAssets = new Set(["DAL", "UAL", "AAL", "LUV"]);
const cyberWatchlistAssets = new Set(["CRWD", "PANW", "ZS", "FTNT", "OKTA", "S"]);
const semiconductorWatchlistAssets = new Set(["NVDA", "ASML", "TSM", "TSMC", "AMD", "AVGO", "INTC"]);
const luxuryWatchlistAssets = new Set(["RACE", "RMS.PA", "MC.PA", "LVMUY", "P911.DE", "POAHY", "TSLA"]);
const paymentsWatchlistAssets = new Set(["V", "MA", "AXP", "PYPL"]);
const indirectWatchlistAssets = new Set([
  ...cyberWatchlistAssets,
  ...semiconductorWatchlistAssets,
  ...luxuryWatchlistAssets,
  ...paymentsWatchlistAssets,
  "AAPL",
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

function getConcreteAffectedAssetRejectionReason(asset: Record<string, unknown>, acceptedTickerEvidence: string[]) {
  const ticker = String(asset.ticker || asset.ticker_or_asset || "").trim().toUpperCase();
  const name = String(asset.name || "").trim().toUpperCase();
  const assetClass = String(asset.asset_class || "other").trim().toLowerCase();
  const looksLikeTicker = /^[A-Z][A-Z0-9.]{0,12}$/.test(ticker);
  const looksLikeCrossAsset = /^[A-Z]{2,5}\/[A-Z]{2,5}$/.test(ticker) || ["US10Y", "BUND YIELD", "BRENT", "WTI", "BRENT CRUDE", "WTI CRUDE"].includes(ticker);
  const accepted = acceptedTickerEvidence.includes(ticker);

  if (!ticker) return "Asset is missing a concrete ticker or instrument label.";
  if (isInvalidAssetLabel(ticker)) return "Invalid placeholder asset labels are not allowed in affected_assets.";
  if (isSectorEtfProxy(ticker)) return "Equity sector ETFs belong in research exposures, not final affected_assets.";
  if (isBroadSectorOrThemeLabel(ticker) || isBroadSectorOrThemeLabel(name)) return "Broad sector or theme labels belong in research exposures, not final affected_assets.";
  if (assetClass === "sector" || assetClass === "etf") return "Affected assets must be concrete instruments, not sector or generic ETF rows.";
  if (name && (name.includes("PRIVATE") || name.includes("NOT DIRECTLY TRADABLE"))) return "Private or not-directly-tradable entities must stay in research/missing-data, not final affected_assets.";
  if (accepted && (looksLikeTicker || looksLikeCrossAsset)) return "";
  if (broadConcreteAffectedAssetSet.has(ticker)) return "";
  if (!looksLikeTicker && !looksLikeCrossAsset) return "Asset label is not a recognized concrete ticker, cross-asset instrument, or approved macro proxy.";
  return "Asset lacks direct ticker evidence or controlled-map support and is not in the concrete affected-asset allowlist.";
}

function isAllowedConcreteAffectedAsset(asset: Record<string, unknown>, acceptedTickerEvidence: string[]) {
  return !getConcreteAffectedAssetRejectionReason(asset, acceptedTickerEvidence);
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

  if (hasConcreteOilChannel(rawEventText.toLowerCase())) {
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

function exposureMatchKeys(exposure: Record<string, unknown>) {
  const text = [
    exposure.theme,
    exposure.sector_or_theme_type,
    exposure.why_relevant,
    exposure.data_needed,
  ].map((value) => String(value || "").toLowerCase()).join(" ");
  const keys = new Set<string>();

  if (textIncludesAny(text, ["defense", "aerospace", "military", "missile", "naval", "surveillance"])) keys.add("defense_aerospace");
  if (textIncludesAny(text, ["cruise", "caribbean travel", "tourism", "travel demand"])) keys.add("cruise_caribbean_travel");
  if (textIncludesAny(text, ["airline", "airlines", "transport", "aviation"])) keys.add("airlines_transport");
  if (textIncludesAny(text, ["safe haven", "safe-haven", "gold", "risk hedge"])) keys.add("safe_havens_gold");
  if (textIncludesAny(text, ["oil", "crude", "energy price", "energy prices", "brent", "wti"])) keys.add("oil_energy_prices");
  if (textIncludesAny(text, ["bond", "bonds", "duration", "interest rate", "rates", "treasury", "yield", "yields"])) keys.add("bonds_duration_rates");
  if (textIncludesAny(text, ["broad equities", "risk sentiment", "risk appetite", "s&p", "nasdaq", "equity market", "stock market"])) keys.add("broad_us_equities_risk");
  if (textIncludesAny(text, ["emerging market", "emerging markets", "latam", "latin america", "brazil", "mexico"])) keys.add("emerging_markets_latam");

  return [...keys];
}

async function getExposureAssetMapCandidates(supabase: any, assetsToResearch: Record<string, unknown>[], eventSign: string) {
  const { data, error } = await supabase
    .from("exposure_asset_map")
    .select("exposure_key, exposure_label, exposure_type, candidate_asset, candidate_name, asset_class, default_direction_escalation, default_direction_deescalation, rationale, region, priority")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error) throw new Error(`Could not load exposure asset map: ${error.message}`);

  const rows = Array.isArray(data) ? data as Record<string, unknown>[] : [];
  const keysByExposure = assetsToResearch.map((exposure) => ({
    exposure,
    keys: exposureMatchKeys(exposure),
  }));
  const seen = new Set<string>();
  const candidates: Record<string, unknown>[] = [];

  for (const row of rows) {
    const key = String(row.exposure_key || "");
    const match = keysByExposure.find((item) => item.keys.includes(key));
    if (!match) continue;
    const candidate = String(row.candidate_asset || "").trim().toUpperCase();
    if (!candidate || isSectorEtfProxy(candidate) || isInvalidAssetLabel(candidate)) continue;
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const defaultDirection = eventSign === "easing"
      ? row.default_direction_deescalation
      : eventSign === "tightening"
        ? row.default_direction_escalation
        : "neutral";
    candidates.push({
      exposure_key: key,
      exposure_theme: match.exposure.theme || row.exposure_label,
      exposure_direction_hint: match.exposure.direction_hint || "",
      candidate_asset: candidate,
      candidate_name: row.candidate_name || candidate,
      asset_class: row.asset_class || "other",
      default_direction: defaultDirection || "neutral",
      rationale: row.rationale || "",
      region: row.region || "",
      priority: row.priority || 50,
    });
  }

  return candidates.slice(0, 24);
}

function normalizeMappedDirection(value: unknown) {
  const direction = String(value || "neutral").trim().toLowerCase();
  if (direction === "strongly positive") return { direction: "positive", strength: "high" };
  if (direction === "strongly negative") return { direction: "negative", strength: "high" };
  const clean = safeDirection(direction);
  return { direction: clean, strength: clean === "neutral" ? "watch" : "medium" };
}

function equivalentAssetKeys(value: unknown) {
  const ticker = String(value || "").trim().toUpperCase();
  if (ticker === "BRENT" || ticker === "BRENT CRUDE") return ["BRENT", "BRENT CRUDE"];
  if (ticker === "WTI" || ticker === "WTI CRUDE") return ["WTI", "WTI CRUDE"];
  if (ticker === "GOLD" || ticker === "GLD") return ["GOLD", "GLD"];
  return [ticker];
}

function hasEquivalentAsset(assets: Record<string, unknown>[], ticker: string) {
  const keys = equivalentAssetKeys(ticker);
  return assets.some((asset) => equivalentAssetKeys(asset.ticker).some((key) => keys.includes(key)));
}

function getFactPackHeadlineText(factPack?: Record<string, unknown>) {
  if (!factPack) return "";
  const headlines = Array.isArray(factPack.related_news_headlines)
    ? factPack.related_news_headlines as Record<string, unknown>[]
    : Array.isArray(factPack.related_news)
      ? factPack.related_news as Record<string, unknown>[]
      : [];
  return headlines
    .map((item) => [item.title, item.domain].filter(Boolean).join(" "))
    .join(" ")
    .toLowerCase();
}

function hasConcreteOilChannel(text: string) {
  const hasOilTerm = textIncludesAny(text, [
    "oil",
    "crude",
    "brent",
    "wti",
    "uso",
    "fuel",
    "energy price",
    "energy prices",
    "energy supply",
    "energy infrastructure",
    "petroleum",
    "lng",
    "gas supply",
  ]);
  const hasConcreteChannel = textIncludesAny(text, [
    "oil supply",
    "crude supply",
    "energy supply",
    "commodity supply",
    "supply disruption",
    "supply shock",
    "production",
    "exports",
    "imports",
    "sanctions",
    "embargo",
    "blockade",
    "tanker",
    "shipping route",
    "trade route",
    "chokepoint",
    "strait",
    "canal",
    "pipeline",
    "refinery",
    "opec",
    "fuel cost",
    "fuel costs",
    "fuel prices",
    "energy security",
    "energy infrastructure",
    "commodity channel",
  ]);
  return hasOilTerm && hasConcreteChannel;
}

function strictChannelGate(args: {
  asset: Record<string, unknown>;
  rawEventText: string;
  researchPlan: Record<string, unknown>;
  researchFactPack?: Record<string, unknown>;
  acceptedTickerEvidence: string[];
}) {
  const ticker = String(args.asset.ticker || args.asset.ticker_or_asset || "").trim().toUpperCase();
  const name = String(args.asset.name || "").trim().toUpperCase();
  const rawAndFactText = `${args.rawEventText} ${getFactPackHeadlineText(args.researchFactPack)}`.toLowerCase();
  const directEvidence = args.acceptedTickerEvidence.includes(ticker)
    || textIncludesAny(rawAndFactText, equivalentAssetKeys(ticker).map((key) => key.toLowerCase()))
    || (name && textIncludesAny(rawAndFactText, [name.toLowerCase()]));

  const hasDefenseChannel = textIncludesAny(rawAndFactText, [
    "defense",
    "military",
    "security escalation",
    "security risk",
    "deployment",
    "deployments",
    "aerospace",
    "missile",
    "naval",
    "surveillance",
    "contractors",
  ]);
  const hasTravelChannel = textIncludesAny(rawAndFactText, [
    "cruise",
    "caribbean travel",
    "tourism",
    "travel demand",
    "booking",
    "bookings",
    "route disruption",
    "route uncertainty",
    "airline",
    "airlines",
    "aviation",
    "transport",
    "operating cost",
    "operating costs",
    "fuel cost",
    "fuel costs",
  ]);
  const hasSafeHavenChannel = textIncludesAny(rawAndFactText, [
    "safe haven",
    "safe-haven",
    "risk-off",
    "risk off",
    "flight to safety",
    "geopolitical fear",
    "geopolitical risk",
    "gold",
  ]);
  const hasBroadRiskChannel = textIncludesAny(rawAndFactText, [
    "risk appetite",
    "risk-off",
    "risk off",
    "broader market",
    "broad market",
    "equities",
    "equity market",
    "stock market",
    "discount-rate",
    "discount rate",
    "financial conditions",
  ]);
  const hasRateChannel = textIncludesAny(rawAndFactText, [
    "bond",
    "bonds",
    "treasury",
    "yield",
    "yields",
    "duration",
    "rates",
    "interest rate",
    "inflation",
    "central bank",
    "fed",
    "ecb",
  ]);
  const hasFxChannel = textIncludesAny(rawAndFactText, [
    "dollar",
    "currency",
    "currencies",
    "fx",
    "dxy",
    "eur/usd",
    "usd/jpy",
  ]) || hasSafeHavenChannel;

  if (oilCommodityAssets.has(ticker)) {
    if (directEvidence || hasConcreteOilChannel(rawAndFactText)) return { allowed: true, reason: "" };
    return {
      allowed: false,
      reason: "Energy assets require verification of sanctions, shipping-route disruption, oil supply, fuel-cost, or commodity-supply impact.",
    };
  }

  if (defenseAssets.has(ticker)) {
    if (directEvidence || hasDefenseChannel) return { allowed: true, reason: "" };
    return { allowed: false, reason: "Defense stocks require a defense, military spending, deployment, or security escalation channel." };
  }

  if (cruiseAssets.has(ticker)) {
    if (directEvidence || hasTravelChannel) return { allowed: true, reason: "" };
    return { allowed: false, reason: "Cruise stocks require a travel, tourism, booking sentiment, or route-disruption channel." };
  }

  if (airlineAssets.has(ticker)) {
    if (directEvidence || hasTravelChannel) return { allowed: true, reason: "" };
    return { allowed: false, reason: "Airline stocks require a travel, route disruption, operating cost, or fuel-cost channel." };
  }

  if (safeHavenAssets.has(ticker)) {
    if (directEvidence || hasSafeHavenChannel) return { allowed: true, reason: "" };
    return { allowed: false, reason: "Safe-haven assets require a risk-off, geopolitical fear, or safe-haven channel." };
  }

  if (currencyAssets.has(ticker)) {
    if (directEvidence || hasFxChannel) return { allowed: true, reason: "" };
    return { allowed: false, reason: "Currency assets require an FX, dollar, risk-off, or safe-haven channel." };
  }

  if (broadIndexAssets.has(ticker)) {
    if (directEvidence || hasBroadRiskChannel) return { allowed: true, reason: "" };
    return { allowed: false, reason: "Broad index assets require a broad risk-sentiment, risk-off, rates, or equity-market channel." };
  }

  if (bondRateAssets.has(ticker)) {
    if (directEvidence || hasRateChannel || hasConcreteOilChannel(rawAndFactText)) return { allowed: true, reason: "" };
    return { allowed: false, reason: "Bond/rate assets require a rates, yields, inflation, duration, or central-bank channel." };
  }

  return { allowed: true, reason: "" };
}

function addCandidateRejectionReason(rejections: Map<string, string>, ticker: string, reason: string) {
  for (const key of equivalentAssetKeys(ticker)) {
    rejections.set(key, reason);
  }
}

function assetChannelKey(asset: Record<string, unknown>) {
  const ticker = String(asset.ticker || asset.ticker_or_asset || "").trim().toUpperCase();
  if (oilCommodityAssets.has(ticker)) return "oil_energy_prices";
  if (safeHavenAssets.has(ticker)) return "safe_havens_gold";
  if (currencyAssets.has(ticker)) return "currency_safe_haven";
  if (broadIndexAssets.has(ticker)) return "broad_risk";
  if (bondRateAssets.has(ticker)) return "bonds_duration_rates";
  if (defenseAssets.has(ticker)) return "defense_aerospace";
  if (cruiseAssets.has(ticker)) return "cruise_caribbean_travel";
  if (airlineAssets.has(ticker)) return "airlines_transport";
  if (cyberWatchlistAssets.has(ticker)) return "cybersecurity_watchlist";
  if (semiconductorWatchlistAssets.has(ticker)) return "semiconductor_supply_chain";
  if (luxuryWatchlistAssets.has(ticker)) return "luxury_consumer_watchlist";
  if (paymentsWatchlistAssets.has(ticker)) return "payments_watchlist";
  return "other";
}

function assetGateLabel(channelKey: string) {
  const labels: Record<string, string> = {
    oil_energy_prices: "Oil / energy commodity channel",
    safe_havens_gold: "Safe-haven / gold channel",
    currency_safe_haven: "USD / FX safe-haven channel",
    broad_risk: "Broad risk-off / equity sentiment channel",
    bonds_duration_rates: "Bonds / rates / duration channel",
    defense_aerospace: "Defense / military security channel",
    cruise_caribbean_travel: "Travel / tourism / cruise channel",
    airlines_transport: "Airlines / transport channel",
    cybersecurity_watchlist: "Cybersecurity watchlist channel",
    semiconductor_supply_chain: "Semiconductor supply-chain watchlist channel",
    luxury_consumer_watchlist: "Luxury / consumer watchlist channel",
    payments_watchlist: "Payments watchlist channel",
    other: "Directly identified asset channel",
  };
  return labels[channelKey] || labels.other;
}

function getTransmissionText(plan: Record<string, unknown>) {
  return getTransmissionChannels(plan)
    .map((channel) => [
      channel.channel,
      channel.mechanism,
      channel.time_horizon,
      ...(Array.isArray(channel.directly_affected_entities) ? channel.directly_affected_entities : []),
      ...(Array.isArray(channel.indirectly_affected_entities_to_research) ? channel.indirectly_affected_entities_to_research : []),
      ...(Array.isArray(channel.missing_data) ? channel.missing_data : []),
    ].filter(Boolean).join(" "))
    .join(" ");
}

function getWatchlistOnlyAssetReason(args: {
  asset: Record<string, unknown>;
  rawEventText: string;
  researchPlan: Record<string, unknown>;
  researchFactPack?: Record<string, unknown>;
  acceptedTickerEvidence: string[];
}) {
  const ticker = String(args.asset.ticker || args.asset.ticker_or_asset || "").trim().toUpperCase();
  if (!indirectWatchlistAssets.has(ticker)) return "";

  const text = [
    args.rawEventText,
    getTransmissionText(args.researchPlan),
    getFactPackHeadlineText(args.researchFactPack),
    args.asset.name,
    args.asset.reason,
    args.asset.uncertainty,
  ].map((value) => String(value || "").toLowerCase()).join(" ");
  const directEvidence = args.acceptedTickerEvidence.includes(ticker) || text.includes(`$${ticker.toLowerCase()}`);

  if (cyberWatchlistAssets.has(ticker)) {
    const hasConcreteCyberChannel = textIncludesAny(text, [
      "verified cyber",
      "cyber attack",
      "cyberattack",
      "incident response",
      "security budget",
      "security spending",
      "breach response",
      "ransomware",
      "security-budget acceleration",
    ]);
    if (hasConcreteCyberChannel && directEvidence) return "";
    return `${ticker} stays watchlist-only unless there is verified cyber escalation, incident-response demand, security-budget acceleration, or company-specific evidence.`;
  }

  if (semiconductorWatchlistAssets.has(ticker) || ticker === "AAPL") {
    const hasConcreteSemiconductorChannel = textIncludesAny(text, [
      "helium",
      "neon",
      "foundry bottleneck",
      "fab bottleneck",
      "chip supply",
      "semiconductor supply",
      "export control",
      "advanced chips",
      "taiwan semiconductor logistics",
      "chip logistics",
      "semiconductor logistics",
      "verified foundry",
    ]);
    if (hasConcreteSemiconductorChannel && directEvidence) return "";
    return `${ticker} stays watchlist-only unless the event creates a verified semiconductor, logistics, export-control, foundry, or company-specific supply/demand channel.`;
  }

  if (luxuryWatchlistAssets.has(ticker)) {
    const hasConcreteLuxuryChannel = textIncludesAny(text, [
      "regional demand weakness",
      "regional sales",
      "order book",
      "margin pressure",
      "logistics disruption",
      "travel retail",
      "store traffic",
      "middle east sales",
      "china demand",
      "luxury demand",
      "verified demand",
    ]);
    if (hasConcreteLuxuryChannel && directEvidence) return "";
    return `${ticker} stays watchlist-only unless there is evidence of regional demand weakness, order-book impact, margin pressure, travel-retail pressure, logistics disruption, or company-specific exposure.`;
  }

  if (paymentsWatchlistAssets.has(ticker)) {
    const hasConcretePaymentsChannel = textIncludesAny(text, [
      "payment network",
      "cross-border volumes",
      "card spending",
      "consumer spending",
      "sanctions payment",
      "transaction volume",
      "interchange",
      "payment volumes",
    ]);
    if (hasConcretePaymentsChannel && directEvidence) return "";
    return `${ticker} stays watchlist-only unless there is a concrete payments-volume, sanctions, cross-border transaction, consumer-spending, or company-specific channel.`;
  }

  return `${ticker} is an indirect large-cap watchlist name and needs a concrete company-specific channel before affected_assets insertion.`;
}

function hasWeakOrConditionalReason(reason: string) {
  const clean = reason.toLowerCase();
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  if (wordCount < 8) return true;
  if (textIncludesAny(clean, ["could be affected", "may be affected", "might be affected", "watch", "monitor only", "if shipping risks increase"])) return true;
  return false;
}

function directionIsUsable(value: unknown) {
  const direction = String(value || "").trim().toLowerCase();
  return ["positive", "negative", "neutral", "mixed", "strongly positive", "strongly negative"].includes(direction);
}

function assetPriority(asset: Record<string, unknown>) {
  const ticker = String(asset.ticker || asset.ticker_or_asset || "").trim().toUpperCase();
  const priority: Record<string, number> = {
    GLD: 95,
    DXY: 88,
    SPY: 90,
    QQQ: 84,
    TLT: 86,
    BND: 78,
    US10Y: 82,
    "BRENT CRUDE": 92,
    BRENT: 90,
    WTI: 88,
    "WTI CRUDE": 88,
    USO: 82,
    LMT: 90,
    NOC: 84,
    RTX: 82,
    GD: 80,
    CCL: 88,
    RCL: 84,
    NCLH: 80,
    DAL: 86,
    UAL: 84,
    AAL: 80,
    LUV: 76,
  };
  const reason = String(asset.reason || "").trim();
  return (priority[ticker] || 50) + Math.min(20, reason.length / 20);
}

function isSystemicMarketEvent(rawEventText: string, researchPlan: Record<string, unknown>) {
  const text = `${rawEventText} ${JSON.stringify(researchPlan.event_classification || {})} ${getTransmissionText(researchPlan)}`.toLowerCase();
  return textIncludesAny(text, [
    "systemic",
    "global",
    "war",
    "strait of hormuz",
    "hormuz",
    "blockade",
    "oil shock",
    "financial crisis",
    "recession",
    "fed rate decision",
    "fomc",
    "inflation surprise",
    "yield curve",
  ]);
}

function affectedAssetDisplayLimit(rawEventText: string, researchPlan: Record<string, unknown>) {
  return isSystemicMarketEvent(rawEventText, researchPlan) ? 8 : 6;
}

function assetCompressionPriority(asset: Record<string, unknown>) {
  const channelPriority: Record<string, number> = {
    oil_energy_prices: 100,
    safe_havens_gold: 96,
    broad_risk: 92,
    currency_safe_haven: 90,
    bonds_duration_rates: 86,
    defense_aerospace: 82,
    airlines_transport: 80,
    cruise_caribbean_travel: 74,
    cybersecurity_watchlist: 50,
    semiconductor_supply_chain: 48,
    luxury_consumer_watchlist: 46,
    payments_watchlist: 44,
    other: 60,
  };
  const strength = String(asset.strength || "").trim().toLowerCase();
  const strengthScore = strength === "high" ? 8 : strength === "medium" ? 4 : 0;
  return (channelPriority[assetChannelKey(asset)] || 50) + strengthScore + Math.min(8, assetPriority(asset) / 20);
}

function runAffectedAssetQualityGate(args: {
  assets: Record<string, unknown>[];
  rawEventText: string;
  researchPlan: Record<string, unknown>;
  researchFactPack?: Record<string, unknown>;
  acceptedTickerEvidence: string[];
}) {
  const accepted: Record<string, unknown>[] = [];
  const rejected: Record<string, unknown>[] = [];
  const deduplicated: Record<string, unknown>[] = [];
  const movedToWatchlist: Record<string, unknown>[] = [];
  const byChannel = new Map<string, Record<string, unknown>[]>();

  for (const asset of args.assets) {
    const ticker = String(asset.ticker || asset.ticker_or_asset || "").trim().toUpperCase();
    const reason = String(asset.reason || "").trim();
    const channelKey = assetChannelKey(asset);
    const channelGate = strictChannelGate({
      asset,
      rawEventText: args.rawEventText,
      researchPlan: args.researchPlan,
      researchFactPack: args.researchFactPack,
      acceptedTickerEvidence: args.acceptedTickerEvidence,
    });

    if (!channelGate.allowed) {
      rejected.push({
        ticker,
        name: asset.name || ticker,
        channel: assetGateLabel(channelKey),
        quality_gate_reason: channelGate.reason,
      });
      continue;
    }

    const watchlistReason = getWatchlistOnlyAssetReason({
      asset,
      rawEventText: args.rawEventText,
      researchPlan: args.researchPlan,
      researchFactPack: args.researchFactPack,
      acceptedTickerEvidence: args.acceptedTickerEvidence,
    });
    if (watchlistReason) {
      movedToWatchlist.push({
        ticker,
        name: asset.name || ticker,
        channel: assetGateLabel(channelKey),
        quality_gate_reason: watchlistReason,
        watchlist_reason: watchlistReason,
      });
      continue;
    }

    if (hasWeakOrConditionalReason(reason)) {
      rejected.push({
        ticker,
        name: asset.name || ticker,
        channel: assetGateLabel(channelKey),
        quality_gate_reason: "Reasoning is too generic, weak, or conditional for affected_assets; keep this as an exposure or missing-data item instead.",
      });
      continue;
    }

    if (!directionIsUsable(asset.direction)) {
      rejected.push({
        ticker,
        name: asset.name || ticker,
        channel: assetGateLabel(channelKey),
        quality_gate_reason: "Direction is missing or not one of the allowed Clarifin direction labels.",
      });
      continue;
    }

    if (String(asset.strength || "").trim().toLowerCase() === "watch") {
      rejected.push({
        ticker,
        name: asset.name || ticker,
        channel: assetGateLabel(channelKey),
        quality_gate_reason: "Asset is only a watch/monitor candidate, not a concrete affected asset.",
      });
      continue;
    }

    const list = byChannel.get(channelKey) || [];
    list.push(asset);
    byChannel.set(channelKey, list);
  }

  const channelLimits: Record<string, number> = {
    oil_energy_prices: 1,
    safe_havens_gold: 1,
    currency_safe_haven: 1,
    broad_risk: 1,
    bonds_duration_rates: 1,
    defense_aerospace: 1,
    cruise_caribbean_travel: 1,
    airlines_transport: 1,
    cybersecurity_watchlist: 1,
    semiconductor_supply_chain: 1,
    luxury_consumer_watchlist: 1,
    payments_watchlist: 1,
    other: 3,
  };

  for (const [channelKey, assets] of byChannel) {
    const sorted = assets.slice().sort((a, b) => assetPriority(b) - assetPriority(a));
    const limit = channelLimits[channelKey] || 1;
    for (const asset of sorted.slice(0, limit)) {
      accepted.push({
        ticker: asset.ticker,
        name: asset.name || asset.ticker,
        channel: assetGateLabel(channelKey),
        quality_gate_reason: "Accepted: clear causal channel, concrete asset, non-watch reasoning, and best representative for this channel.",
      });
    }
    for (const asset of sorted.slice(limit)) {
      deduplicated.push({
        ticker: asset.ticker,
        name: asset.name || asset.ticker,
        channel: assetGateLabel(channelKey),
        quality_gate_reason: "Removed as redundant: another asset is a cleaner representative for the same economic channel.",
      });
    }
  }

  const acceptedTickers = new Set(accepted.map((asset) => String(asset.ticker || "").trim().toUpperCase()));
  const finalAssets = args.assets.filter((asset) => acceptedTickers.has(String(asset.ticker || asset.ticker_or_asset || "").trim().toUpperCase()));

  return {
    final_assets: finalAssets,
    accepted,
    rejected,
    deduplicated,
    moved_to_watchlist: movedToWatchlist,
  };
}

function runFinalConciseNodeCompression(args: {
  assets: Record<string, unknown>[];
  acceptedDiagnostics: Record<string, unknown>[];
  rawEventText: string;
  researchPlan: Record<string, unknown>;
}) {
  const maxFinalAssets = affectedAssetDisplayLimit(args.rawEventText, args.researchPlan);
  const proposedAssets = args.assets.slice().sort((a, b) => assetCompressionPriority(b) - assetCompressionPriority(a));
  const finalAssets = proposedAssets.slice(0, maxFinalAssets);
  const finalAssetKeys = new Set(finalAssets.map((asset) => String(asset.ticker || asset.ticker_or_asset || "").trim().toUpperCase()));
  const finalAccepted = args.acceptedDiagnostics.filter((asset) => finalAssetKeys.has(String(asset.ticker || "").trim().toUpperCase()));
  const removed = proposedAssets.slice(maxFinalAssets).map((asset) => {
    const ticker = String(asset.ticker || asset.ticker_or_asset || "").trim().toUpperCase();
    const reason = `Moved to watchlist by final concise-node compression: the mobile node keeps the strongest ${maxFinalAssets} representative affected assets, and this lower-priority direct link would overload the UI.`;
    return {
      ticker,
      name: asset.name || ticker,
      channel: assetGateLabel(assetChannelKey(asset)),
      compression_reason: reason,
      quality_gate_reason: reason,
      watchlist_reason: reason,
    };
  });
  const warnings = uniqueStrings(removed.map((asset) => String(asset.compression_reason || "").trim()).filter(Boolean));

  return {
    proposed_assets_before_compression: proposedAssets,
    final_assets: finalAssets,
    accepted: finalAccepted,
    removed,
    moved_to_watchlist: removed,
    display_limit: maxFinalAssets,
    warnings,
    summary: `Final app-node compression selected ${finalAssets.length} of ${proposedAssets.length} eligible assets for the mobile node.`,
  };
}

function exposureLooksLikeOilExposure(exposure: Record<string, unknown>) {
  const text = [
    exposure.theme,
    exposure.sector_or_theme_type,
    exposure.why_relevant,
    exposure.data_needed,
  ].map((value) => String(value || "").toLowerCase()).join(" ");
  return textIncludesAny(text, [
    "oil",
    "crude",
    "brent",
    "wti",
    "uso",
    "fuel",
    "energy price",
    "energy prices",
    "energy infrastructure",
    "energy supply",
  ]);
}

function validateResearchExposureForInsert(args: {
  exposure: Record<string, unknown>;
  rawEventText: string;
  researchFactPack?: Record<string, unknown>;
}) {
  const rawAndFactText = `${args.rawEventText} ${getFactPackHeadlineText(args.researchFactPack)}`.toLowerCase();
  if (exposureLooksLikeOilExposure(args.exposure) && !hasConcreteOilChannel(rawAndFactText)) {
    return {
      allowed: false,
      reason: "Oil / energy exposures require a concrete oil supply, sanctions, shipping-route, fuel-cost, commodity-supply, or energy-infrastructure channel.",
    };
  }

  return { allowed: true, reason: "" };
}

function isGenericExposureLabel(exposure: Record<string, unknown>) {
  const theme = String(exposure.theme || "").trim().toLowerCase().replace(/\s+/g, " ");
  const badLabels = new Set([
    "demand",
    "governance",
    "consumer",
    "sector",
    "theme",
    "market",
    "markets",
    "sentiment",
    "investor sentiment",
    "market dynamics",
    "various sectors",
  ]);
  return badLabels.has(theme);
}

function exposureChannelKey(exposure: Record<string, unknown>) {
  const text = [
    exposure.theme,
    exposure.sector_or_theme_type,
    exposure.why_relevant,
    exposure.data_needed,
    ...(Array.isArray(exposure.sector_proxy_tickers) ? exposure.sector_proxy_tickers : []),
  ].map((value) => String(value || "").toLowerCase()).join(" ");

  if (textIncludesAny(text, ["brent", "wti", "oil", "crude", "upstream", "energy producer", "energy producers", "xle"])) return "oil_energy";
  if (textIncludesAny(text, ["tanker", "tankers", "shipping", "freight", "maritime", "strait", "shipping route", "maritime route"])) return "tankers_shipping";
  if (textIncludesAny(text, ["airline", "airlines", "travel", "tourism", "fuel cost", "jet fuel", "xly"])) return "airlines_travel";
  if (textIncludesAny(text, ["defense", "aerospace", "military", "xli"])) return "defense_aerospace";
  if (textIncludesAny(text, ["inflation", "cpi", "price pressure", "consumer price"])) return "inflation_sensitive";
  if (textIncludesAny(text, ["rate-sensitive", "rates", "yields", "duration", "bond", "real estate", "xlre"])) return "rates_duration";
  if (textIncludesAny(text, ["safe haven", "safe-haven", "gold", "risk-off", "dxy", "dollar"])) return "safe_havens_fx";
  if (textIncludesAny(text, ["cyber", "security budget", "incident response"])) return "cybersecurity_watchlist";
  if (textIncludesAny(text, ["semiconductor", "chip", "foundry", "helium", "neon", "xlk"])) return "semiconductor_supply_chain";
  if (textIncludesAny(text, ["luxury", "travel retail", "high-end", "wealth"])) return "luxury_watchlist";
  if (textIncludesAny(text, ["payment", "card spending", "cross-border"])) return "payments_watchlist";

  return String(exposure.theme || exposure.sector_or_theme_type || "other")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "other";
}

function exposurePriority(exposure: Record<string, unknown>) {
  const keyPriority: Record<string, number> = {
    oil_energy: 100,
    tankers_shipping: 96,
    airlines_travel: 92,
    defense_aerospace: 90,
    inflation_sensitive: 86,
    rates_duration: 84,
    safe_havens_fx: 82,
    cybersecurity_watchlist: 58,
    semiconductor_supply_chain: 56,
    luxury_watchlist: 52,
    payments_watchlist: 50,
  };
  const why = String(exposure.why_relevant || "");
  const confidence = normalizeScore(exposure.confidence, 35);
  const hasSectorProxy = Array.isArray(exposure.sector_proxy_tickers) && exposure.sector_proxy_tickers.length ? 4 : 0;
  return (keyPriority[exposureChannelKey(exposure)] || 60) + Math.min(12, confidence / 10) + Math.min(6, why.length / 60) + hasSectorProxy;
}

function compressResearchExposureRows(rows: Record<string, unknown>[]) {
  const inserted: Record<string, unknown>[] = [];
  const removed: Record<string, unknown>[] = [];
  const seenChannels = new Set<string>();
  const sorted = rows.slice().sort((a, b) => exposurePriority(b) - exposurePriority(a));
  const maxExposures = 7;

  for (const row of sorted) {
    const channelKey = exposureChannelKey(row);
    if (isGenericExposureLabel(row)) {
      removed.push({
        ...row,
        exposure_rejection_reason: "Removed by concise-node compression: generic exposure labels such as Demand, Governance, Consumer, Sector, or Theme are not useful mobile cards.",
        compression_stage: "generic_label",
      });
      continue;
    }
    if (seenChannels.has(channelKey)) {
      removed.push({
        ...row,
        exposure_rejection_reason: "Removed by concise-node compression: another exposure is a cleaner representative for the same economic channel.",
        compression_stage: "duplicate_channel",
      });
      continue;
    }
    if (inserted.length >= maxExposures) {
      removed.push({
        ...row,
        exposure_rejection_reason: "Removed by concise-node compression: the mobile node keeps at most 7 focused exposures.",
        compression_stage: "display_limit",
      });
      continue;
    }
    seenChannels.add(channelKey);
    inserted.push(row);
  }

  return { inserted, removed, display_limit: maxExposures };
}

function buildResearchExposureRows(args: {
  nodeId: string;
  assetsToResearch: Record<string, unknown>[];
  rawEventText: string;
  researchFactPack?: Record<string, unknown>;
}) {
  const candidates: Record<string, unknown>[] = [];
  const rejected: Record<string, unknown>[] = [];

  for (const exposure of args.assetsToResearch) {
    const sectorProxyTickers = Array.isArray(exposure.sector_proxy_tickers)
      ? cleanSectorProxyTickers(exposure.sector_proxy_tickers)
      : Array.isArray(exposure.possible_tickers_to_check)
        ? cleanSectorProxyTickers(exposure.possible_tickers_to_check)
        : [];
    const row = {
      node_id: String(args.nodeId),
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

    if (!row.theme && !row.why_relevant && !row.sector_proxy_tickers.length && !row.data_needed) {
      rejected.push({
        ...row,
        exposure_rejection_reason: "Exposure row was empty after normalization.",
        original_exposure: exposure,
      });
      continue;
    }

    const validation = validateResearchExposureForInsert({
      exposure: row,
      rawEventText: args.rawEventText,
      researchFactPack: args.researchFactPack,
    });
    if (!validation.allowed) {
      rejected.push({
        ...row,
        exposure_rejection_reason: validation.reason,
        original_exposure: exposure,
      });
      continue;
    }

    candidates.push(row);
  }

  const compression = compressResearchExposureRows(candidates);

  return {
    inserted: compression.inserted,
    rejected,
    before_compression: candidates,
    removed_by_compression: compression.removed,
    display_limit: compression.display_limit,
  };
}

function buildCandidateRejectionReport(args: {
  candidates: Record<string, unknown>[];
  evaluation: Record<string, unknown>;
  insertedAssets: Record<string, unknown>[];
  finalHardValidationRemovedAssets: Record<string, unknown>[];
  serverRejectedAssets: Record<string, unknown>[];
  qualityGateRejectedAssets: Record<string, unknown>[];
  qualityGateDeduplicatedAssets: Record<string, unknown>[];
  rawEventText: string;
  researchPlan: Record<string, unknown>;
  researchFactPack?: Record<string, unknown>;
  acceptedTickerEvidence: string[];
}) {
  const inserted = args.insertedAssets.map((asset) => ({
    ticker: asset.ticker,
  }));
  const serverRejections = new Map<string, string>();
  for (const item of args.serverRejectedAssets) {
    addCandidateRejectionReason(serverRejections, String(item.ticker || ""), String(item.candidate_rejection_reason || "Server-side channel gate rejected this asset."));
  }
  const finalHardValidationRejections = new Map<string, string>();
  for (const item of args.finalHardValidationRemovedAssets) {
    addCandidateRejectionReason(finalHardValidationRejections, String(item.ticker || ""), String(item.final_hard_validation_reason || "Final hard validation removed this asset."));
  }
  const qualityGateRejections = new Map<string, string>();
  for (const item of [...args.qualityGateRejectedAssets, ...args.qualityGateDeduplicatedAssets]) {
    addCandidateRejectionReason(qualityGateRejections, String(item.ticker || ""), String(item.quality_gate_reason || "Affected Asset Quality Gate rejected this asset."));
  }
  const aiRejected = new Map<string, string>();
  const rejectedAssets = Array.isArray(args.evaluation.rejected_assets)
    ? args.evaluation.rejected_assets as Record<string, unknown>[]
    : [];
  for (const item of rejectedAssets) {
    aiRejected.set(String(item.candidate_asset || "").trim().toUpperCase(), String(item.reason || "Candidate was rejected by model evaluation."));
  }

  return args.candidates
    .filter((candidate) => !hasEquivalentAsset(inserted, String(candidate.candidate_asset || "")))
    .map((candidate) => {
      const ticker = String(candidate.candidate_asset || "").trim().toUpperCase();
      const equivalentServerReason = equivalentAssetKeys(ticker)
        .map((key) => serverRejections.get(key))
        .find(Boolean);
      const candidateGate = strictChannelGate({
        asset: {
          ticker,
          ticker_or_asset: ticker,
          name: candidate.candidate_name || ticker,
          asset_class: candidate.asset_class || "other",
        },
        rawEventText: args.rawEventText,
        researchPlan: args.researchPlan,
        researchFactPack: args.researchFactPack,
        acceptedTickerEvidence: args.acceptedTickerEvidence,
      });
      return {
        candidate_asset: ticker,
        candidate_name: candidate.candidate_name || ticker,
        exposure_key: candidate.exposure_key || "",
        asset_class: candidate.asset_class || "other",
        candidate_rejection_reason: equivalentServerReason
          || equivalentAssetKeys(ticker).map((key) => finalHardValidationRejections.get(key)).find(Boolean)
          || equivalentAssetKeys(ticker).map((key) => qualityGateRejections.get(key)).find(Boolean)
          || (!candidateGate.allowed ? candidateGate.reason : "")
          || aiRejected.get(ticker)
          || "Candidate was considered but not selected because the causal channel was not strong enough or another representative asset already covered the channel.",
      };
    });
}

async function evaluateMappedCandidateAssets(args: {
  apiKey: string;
  model: string;
  rawEventText: string;
  generatedNode: Record<string, unknown>;
  assetsToResearch: Record<string, unknown>[];
  candidates: Record<string, unknown>[];
}) {
  if (!args.candidates.length) {
    return { accepted_assets: [], rejected_assets: [], summary: "No mapped candidates matched the detected exposures." };
  }

  return await callOpenAIJson({
    apiKey: args.apiKey,
    model: args.model,
    temperature: 0.05,
    schemaName: "clarifin_exposure_asset_candidate_evaluation",
    schema: candidateAssetEvaluationSchema,
    messages: [
      {
        role: "system",
        content: [
          "You evaluate controlled candidate affected assets for Clarifin.",
          "You must not invent assets. You may only accept or reject the supplied candidates.",
          "Accept a candidate only if the detected exposure and event mechanism fit the raw event.",
          "Do not accept sector ETFs such as XLE, XLF, XLV, XLP, XLY, XLI, XLK, XLU, XLRE, XLB.",
          "Do not call ordinary stocks or commodity proxies sector ETFs. AAL, DAL, UAL, LUV, LMT, NOC, RTX, GD, CCL, RCL, NCLH are stocks. USO and GLD are commodity proxies.",
          "Prefer broad instruments and clearly linked stocks. For individual stocks, require a concrete sector or business link.",
          "Be selective. Do not accept every peer in a group when two representative assets are enough.",
          "If the raw text explicitly names an exposure group such as defense contractors, cruise operators, airlines, safe-haven assets, or oil prices, and matching controlled candidates exist, accept 1-2 representative candidates unless the mechanism clearly does not fit.",
          "If the raw text explicitly names multiple separate exposure groups, evaluate each group separately. A cruise candidate does not cover an airline channel; a defense candidate does not cover a safe-haven channel.",
          "For an explicitly named group with a fitting mechanism, include at least one representative candidate unless the candidate is too indirect or the mechanism contradicts the event.",
          "Oil assets such as Brent, WTI, or USO require a concrete energy, oil-supply, sanctions, shipping-route, tanker, fuel-cost, or commodity-supply channel. A generic geopolitical escalation or a vague mention that oil prices could be affected is not enough.",
          "If the event direction is clear but unconfirmed, choose the likely direction and explain uncertainty in the reason instead of defaulting to mixed.",
          "Use mixed only when the direction is genuinely unclear or opposing forces are central.",
          "Keep reasons short and specific. No investment advice, no buy/sell/hold language, no performance promises.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          "Evaluate these controlled candidates for this Clarifin node.",
          "",
          "Raw event text:",
          args.rawEventText,
          "",
          "Generated node summary:",
          JSON.stringify({
            title: args.generatedNode.title,
            category: args.generatedNode.category,
            event_type: args.generatedNode.event_type,
            event_status: args.generatedNode.event_status,
            short: args.generatedNode.short,
            causal_chain: args.generatedNode.causal_chain,
          }, null, 2),
          "",
          "Detected exposures:",
          JSON.stringify(args.assetsToResearch, null, 2),
          "",
          "Controlled candidate assets:",
          JSON.stringify(args.candidates, null, 2),
        ].join("\n"),
      },
    ],
  });
}

function mergeMappedAffectedAssets(generatedNode: Record<string, unknown>, evaluation: Record<string, unknown>, candidates: Record<string, unknown>[]) {
  const accepted = Array.isArray(evaluation.accepted_assets) ? evaluation.accepted_assets as Record<string, unknown>[] : [];
  const assets = Array.isArray(generatedNode.affected_assets) ? generatedNode.affected_assets as Record<string, unknown>[] : [];
  const candidateByTicker = new Map(candidates.map((candidate) => [String(candidate.candidate_asset || "").trim().toUpperCase(), candidate]));
  const exposureLimits: Record<string, number> = {
    defense_aerospace: 2,
    cruise_caribbean_travel: 2,
    airlines_transport: 2,
    safe_havens_gold: 1,
    oil_energy_prices: 1,
    bonds_duration_rates: 1,
    broad_us_equities_risk: 1,
    emerging_markets_latam: 1,
  };
  const exposureCounts: Record<string, number> = {};
  let mappedAdded = 0;
  const markChannelCovered = (key: string, tickers: string[]) => {
    if (tickers.some((ticker) => hasEquivalentAsset(assets, ticker))) {
      exposureCounts[key] = exposureLimits[key] || 1;
    }
  };
  markChannelCovered("oil_energy_prices", ["BRENT", "BRENT CRUDE", "WTI", "WTI CRUDE", "USO"]);
  markChannelCovered("safe_havens_gold", ["GLD", "GOLD"]);
  markChannelCovered("bonds_duration_rates", ["TLT", "BND", "US10Y"]);
  markChannelCovered("broad_us_equities_risk", ["SPY", "QQQ", "IWM"]);

  for (const item of accepted) {
    const ticker = String(item.candidate_asset || "").trim().toUpperCase();
    const sourceCandidate = candidateByTicker.get(ticker) || {};
    const exposureKey = String(sourceCandidate.exposure_key || "other");
    const limit = exposureLimits[exposureKey] || 1;
    const assetClass = String(item.asset_class || "other").trim().toLowerCase();
    if (mappedAdded >= 7) break;
    if ((exposureCounts[exposureKey] || 0) >= limit) continue;
    if (!ticker || hasEquivalentAsset(assets, ticker) || isSectorEtfProxy(ticker) || isInvalidAssetLabel(ticker)) continue;
    const normalizedDirection = normalizeMappedDirection(item.direction);
    assets.push({
      ticker,
      ticker_or_asset: ticker,
      name: String(item.candidate_name || ticker).trim(),
      asset_class: assetClassEnum.includes(assetClass) ? assetClass : "other",
      direction: normalizedDirection.direction,
      strength: normalizedDirection.strength,
      reason: String(item.reason || "Mapped from a validated Clarifin exposure channel.").trim(),
      uncertainty: "",
    });
    exposureCounts[exposureKey] = (exposureCounts[exposureKey] || 0) + 1;
    mappedAdded += 1;
  }

  generatedNode.affected_assets = assets;
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
  const classification = researchPlan.event_classification as Record<string, unknown> | undefined;
  const eventType = String(classification?.event_type || "").toLowerCase();
  const eventSign = eventType.includes("de-escalation") || eventType.includes("deescalation")
    ? "easing"
    : eventType.includes("escalation")
      ? "tightening"
      : "unclear";
  const existingChains = Array.isArray(node.causal_chain) ? node.causal_chain as Record<string, unknown>[] : [];
  const sourceChains = existingChains.length ? existingChains : channels.map((channel) => ({
    title: String(channel.channel || "Transmission channel").replace(/_/g, " "),
    event: "Event described in the input",
    explanation: "",
    direction: "neutral",
    time_horizon: String(channel.time_horizon || ""),
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

  const cleanSentence = (value: unknown) => String(value || "")
    .replace(/\bEvent:\s*/gi, "")
    .replace(/\bImpact:\s*/gi, "")
    .replace(/\bMechanism:\s*/gi, "")
    .replace(/\bWatch:\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const sentence = (value: unknown) => {
    const text = cleanSentence(value);
    if (!text) return "";
    return /[.!?]$/.test(text) ? text : `${text}.`;
  };

  const chainDirection = (chain: Record<string, unknown>, fallback: string) => {
    const text = [chain.title, chain.explanation, chain.mechanism, chain.asset_impact, chain.sector_impact]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");
    if (eventSign === "tightening") {
      if (textIncludesAny(text, ["defense", "safe-haven", "safe haven", "gold", "oil", "energy supply", "risk premium"])) return "positive";
      if (textIncludesAny(text, ["travel", "airline", "airlines", "cruise", "consumer spending", "risk appetite"])) return "negative";
    }
    if (eventSign === "easing") {
      if (textIncludesAny(text, ["defense", "safe-haven", "safe haven", "gold", "oil", "energy supply", "risk premium"])) return "negative";
      if (textIncludesAny(text, ["travel", "airline", "airlines", "cruise", "consumer spending", "risk appetite", "bond", "duration"])) return "positive";
    }
    return fallback === "mixed" ? "neutral" : safeDirection(fallback);
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
    const existingExplanation = cleanSentence(chain.explanation);
    let explanation = existingExplanation && !isThinText(existingExplanation)
      ? sentence(existingExplanation)
      : [
        sentence(baseMechanism),
        cleanImpact && cleanImpact.toLowerCase() !== baseMechanism.toLowerCase() ? sentence(cleanImpact) : "",
      ].filter(Boolean).join(" ");
    explanation = explanation
      .replace(/increased risk appetite may lead to shifts in investment towards safe-haven assets/gi, "Reduced risk appetite can push investors toward safe-haven assets")
      .replace(/increased risk appetite may lead to shifts in investment toward safe-haven assets/gi, "Reduced risk appetite can push investors toward safe-haven assets");
    const direction = chainDirection({ ...chain, explanation }, safeDirection(chain.direction || channel.direction || "neutral"));
    const timeHorizon = String(chain.time_horizon || channel.time_horizon || "").trim();

    return {
      title: String(chain.title || channel.channel || "Transmission channel").trim(),
      explanation: explanation || "This channel matters because the event can change expectations for the affected exposure or asset group.",
      direction,
      time_horizon: timeHorizon,
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
          "- Think broadly during research, but label weak, indirect, conditional, or second-order company links as watchlist/missing-data candidates rather than direct affected assets.",
          "- For broad geopolitical shocks, do not research every peer as if it belongs in the app. Prefer representative assets per channel: one commodity/safe-haven/broad-market/rates proxy and one or two directly justified sector/company representatives.",
          "- Ferrari, Hermes, LVMH, Nvidia, ASML, TSMC, CrowdStrike, Palo Alto Networks, Visa, Mastercard, Apple, Tesla, Porsche and similar names require concrete company-specific evidence before they can move beyond watchlist research.",
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
  research_fact_pack: Record<string, unknown>;
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
          "You must not browse the web. You may use the provided Research Fact Pack, which contains lightweight GDELT headline metadata, optional FRED macro observations, and internal exposure-map candidates.",
          "Do not pretend full article research happened. GDELT headlines are supporting context and source-count signals only, not final truth.",
          "FRED observations are official macro time-series data when present, but they are context only; do not overstate causality from a single latest value.",
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
          "- Because this version does not fetch full source URLs or full GDELT articles, source_fact is allowed only for exact user-provided source text, official FRED observations, or lightweight GDELT headline metadata. Never treat a headline as full article confirmation.",
          "- Distinguish raw input claims from FRED macro observations, GDELT supporting headlines, internal candidate assets, and missing/unverified data.",
          "- If related_news_count is low or source_domains are thin, lower confidence and say the event needs verification.",
          "- If multiple related GDELT headlines from different domains appear, you may say related coverage exists, but do not say the event is confirmed unless the raw input itself confirms it.",
          "- Candidate assets from exposure_asset_map are internal candidates only. Include them as affected_assets only if the event mechanism fits.",
          "- The final node must not present inference or unverified claims as confirmed fact.",
          "- Missing information should be explicitly flagged instead of guessed.",
          "",
          "Goldstandard node-quality rules:",
          "- The generator may think broadly, but the mobile app node must display selectively.",
          "- Final affected_assets should usually contain 4 to 8 assets. Do not exceed this unless the event is truly systemic and every asset has a strong direct causal channel.",
          "- Prefer representative, high-conviction assets over full peer groups. Do not insert every relevant company from the research.",
          "- Separate direct affected assets from watchlist names. Weak, plausible, indirect, conditional, or second-order names belong in missing_data, counterarguments, scenarios, or watchlist-style explanations, not affected_assets.",
          "- For defense, airlines, oil, luxury, cybersecurity, semiconductors, and payments, choose the strongest representative names only when the causal channel is concrete.",
          "- CrowdStrike/Palo Alto require verified cyber escalation, incident-response demand, security-budget acceleration, or company-specific evidence.",
          "- Ferrari/Hermes/LVMH/Porsche/Tesla require regional demand weakness, order-book impact, margin pressure, travel-retail pressure, logistics disruption, or company-specific evidence.",
          "- Nvidia/ASML/TSMC/Apple require verified semiconductor, foundry, export-control, logistics, or company-specific supply/demand evidence.",
          "- Visa/Mastercard require a concrete payments-volume, sanctions, cross-border transaction, consumer-spending, or company-specific channel.",
          "- Do not duplicate one economic channel under several labels. Choose the clearest representation for the final app node.",
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
          "- Each causal chain must include title, explanation, direction, and time_horizon. The explanation should be a natural-language analyst paragraph of 1-3 concise sentences.",
          "- Do not write labels such as Event:, Impact:, Mechanism:, or Watch: inside causal-chain text.",
          "- For each causal chain, explain the real transmission mechanism: event -> economic channel -> affected exposure or asset. Avoid long numbered paragraphs.",
          "- If older compatibility fields are present, keep them concise, but put the user-facing writing in explanation.",
          "- assets_to_research is the Exposures layer. Each item must be a sector, theme, economic area, equity sector, or industry group with theme, sector_or_theme_type, why_relevant, sector_proxy_tickers, direction_hint, data_needed, time_horizon, and confidence. Do not use it as a list of concrete affected assets. Equity sector ETFs such as XLE/XLF/XLV/XLP/XLY/XLI/XLK/XLU/XLRE/XLB belong here as sector_proxy_tickers, never in affected_assets.",
          "- For broad macro or geopolitical events, include 4-7 exposure items when economically relevant, including direct, indirect, and delayed channels. Do not stop at the first obvious sector.",
          "- Avoid generic exposure labels such as Demand, Governance, Consumer, Sector, Theme, Investor Sentiment, or Market Dynamics. Use specific exposure titles such as Energy upstream, Tankers and shipping, Airlines and travel, Defense and aerospace, Inflation-sensitive sectors, Rate-sensitive sectors, or Cybersecurity watchlist.",
          "- Exposures must be non-duplicative. Do not show Oil supply risks, Energy companies, Brent crude risk, and Upstream oil as separate cards if they describe the same channel.",
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
          "Select the strongest representative final affected assets for a concise mobile app node; do not list all relevant assets.",
          "",
          "You must return JSON only with node, evidence_map, affected_asset_validation, assets_to_research, quality_gate, missing_data, and warnings.",
          `- ${sourceInstruction}`,
          `- User-provided tickers: ${input.tickers.length ? input.tickers.join(", ") : "none"}`,
          "",
          "Research plan JSON:",
          JSON.stringify(input.research_plan, null, 2),
          "",
          "Research Fact Pack JSON:",
          JSON.stringify(input.research_fact_pack, null, 2),
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
    const fredApiKey = (Deno.env.get("FRED_API_KEY") || "").trim();
    if (body.debug_fred_connectivity === true) {
      return jsonResponse(await runFredConnectivityDebug({
        apiKey: fredApiKey,
        seriesId: body.series_id,
      }));
    }

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

    const eventSign = detectEventSign(rawEventText, researchPlan);
    const preliminaryAssetsToResearch = getAssetsToResearch({ assets_to_research: [] }, researchPlan, rawEventText);
    let candidateAssetsConsidered: Record<string, unknown>[] = [];

    try {
      candidateAssetsConsidered = await getExposureAssetMapCandidates(supabase, preliminaryAssetsToResearch, eventSign);
    } catch (candidateError) {
      warnings.push(`exposure_asset_map candidates were not available for the fact pack: ${candidateError instanceof Error ? candidateError.message : "unknown error"}`);
    }

    const externalResearchItems: Record<string, unknown>[] = [];
    const gdeltResearch = await collectGdeltResearch({
      researchPlan,
      rawEventText,
    });
    externalResearchItems.push(gdeltResearch.externalResearchItem);
    const gdeltQuery = gdeltResearch.gdeltQuery;
    const gdeltResult = gdeltResearch.gdeltResult;
    const fredResearch = await collectFredMacroResearch({
      researchPlan,
      rawEventText,
      apiKey: fredApiKey,
    });
    externalResearchItems.push(...fredResearch.items);
    const researchFactPack = buildResearchFactPack({
      rawEventText,
      researchPlan,
      gdeltQuery,
      gdeltResult,
      fredDiagnostics: fredResearch.diagnostics,
      fredFacts: fredResearch.facts,
      candidateAssets: candidateAssetsConsidered,
    });
    if (Array.isArray(researchFactPack.research_warnings)) {
      warnings.push(...researchFactPack.research_warnings);
    }

    const validatedDraft = await createValidatedDraft({
      raw_event_text: rawEventText,
      source_urls: sourceUrls,
      tickers,
      research_plan: researchPlan,
      research_fact_pack: researchFactPack,
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
    let mappedCandidateEvaluation: Record<string, unknown> = {
      accepted_assets: [],
      rejected_assets: [],
      summary: "Candidate evaluation did not run.",
    };

    try {
      const finalCandidateAssets = await getExposureAssetMapCandidates(supabase, assetsToResearch, eventSign);
      candidateAssetsConsidered = mergeCandidateLists(candidateAssetsConsidered, finalCandidateAssets);
      mappedCandidateEvaluation = await evaluateMappedCandidateAssets({
        apiKey: openAiApiKey,
        model,
        rawEventText,
        generatedNode,
        assetsToResearch,
        candidates: candidateAssetsConsidered,
      });
      mergeMappedAffectedAssets(generatedNode, mappedCandidateEvaluation, candidateAssetsConsidered);
    } catch (candidateError) {
      warnings.push(`exposure_asset_map candidates were not applied: ${candidateError instanceof Error ? candidateError.message : "unknown error"}`);
    }

    const debugAiProposedAssetsBeforeValidation = cloneForDebug(
      Array.isArray(generatedNode.affected_assets) ? generatedNode.affected_assets : [],
    );

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
    const acceptedMappedTickers = Array.isArray(mappedCandidateEvaluation.accepted_assets)
      ? (mappedCandidateEvaluation.accepted_assets as Record<string, unknown>[]).map((asset) => String(asset.candidate_asset || "").trim().toUpperCase()).filter(Boolean)
      : [];
    const directAffectedEvidence = uniqueStrings([...tickers, ...extractCashtags(rawEventText), ...getPlanPublicTickers(researchPlan)]).map((ticker) => ticker.toUpperCase());
    const allowedAffectedEvidence = uniqueStrings([...directAffectedEvidence, ...acceptedMappedTickers]).map((ticker) => ticker.toUpperCase());
    const finalHardValidationRemovedAssets: Record<string, unknown>[] = [];
    const serverRejectedAffectedAssets: Record<string, unknown>[] = [];
    const eligibleAffectedAssets = generatedNode.affected_assets
      .filter((asset: Record<string, unknown>) => {
        const hardValidationReason = getConcreteAffectedAssetRejectionReason(asset, allowedAffectedEvidence);
        if (!hardValidationReason) return true;
        finalHardValidationRemovedAssets.push({
          ...asset,
          final_hard_validation_reason: hardValidationReason,
        });
        return false;
      })
      .filter((asset: Record<string, unknown>) => {
        const gate = strictChannelGate({
          asset,
          rawEventText,
          researchPlan,
          researchFactPack,
          acceptedTickerEvidence: directAffectedEvidence,
        });
        if (gate.allowed) return true;
        serverRejectedAffectedAssets.push({
          ...asset,
          candidate_rejection_reason: gate.reason,
        });
        return false;
      });

    if (finalHardValidationRemovedAssets.length) {
      const hardValidationWarnings = uniqueStrings(finalHardValidationRemovedAssets.map((asset) => String(asset.final_hard_validation_reason || "").trim()).filter(Boolean));
      researchFactPack.research_warnings = uniqueStrings([
        ...(Array.isArray(researchFactPack.research_warnings) ? researchFactPack.research_warnings : []),
        ...hardValidationWarnings,
      ]);
      appendMissingData(validatedDraft, hardValidationWarnings);
      warnings.push(...hardValidationWarnings);
    }

    if (serverRejectedAffectedAssets.length) {
      const strictGateWarnings = uniqueStrings(serverRejectedAffectedAssets.map((asset) => String(asset.candidate_rejection_reason || "").trim()).filter(Boolean));
      researchFactPack.research_warnings = uniqueStrings([
        ...(Array.isArray(researchFactPack.research_warnings) ? researchFactPack.research_warnings : []),
        ...strictGateWarnings,
      ]);
      appendMissingData(validatedDraft, strictGateWarnings);
      warnings.push(...strictGateWarnings);
    }

    const affectedAssetQualityGate = runAffectedAssetQualityGate({
      assets: eligibleAffectedAssets,
      rawEventText,
      researchPlan,
      researchFactPack,
      acceptedTickerEvidence: directAffectedEvidence,
    });
    const conciseAssetCompression = runFinalConciseNodeCompression({
      assets: affectedAssetQualityGate.final_assets,
      acceptedDiagnostics: affectedAssetQualityGate.accepted,
      rawEventText,
      researchPlan,
    });
    const watchlistCandidates = [
      ...affectedAssetQualityGate.moved_to_watchlist,
      ...conciseAssetCompression.moved_to_watchlist,
    ];

    const qualityGateWarnings = uniqueStrings([
      ...affectedAssetQualityGate.rejected,
      ...affectedAssetQualityGate.deduplicated,
      ...affectedAssetQualityGate.moved_to_watchlist,
      ...conciseAssetCompression.removed,
    ].map((asset: Record<string, unknown>) => String(asset.quality_gate_reason || "").trim()).filter(Boolean));

    if (qualityGateWarnings.length) {
      researchFactPack.research_warnings = uniqueStrings([
        ...(Array.isArray(researchFactPack.research_warnings) ? researchFactPack.research_warnings : []),
        ...qualityGateWarnings,
      ]);
      appendMissingData(validatedDraft, qualityGateWarnings);
      warnings.push(...qualityGateWarnings);
    }

    const finalGeneratedAffectedAssets = conciseAssetCompression.final_assets
      .map((asset: Record<string, unknown>) => ({
        ticker: String(asset.ticker || asset.ticker_or_asset || "").trim().toUpperCase(),
        ticker_or_asset: String(asset.ticker || asset.ticker_or_asset || "").trim().toUpperCase(),
        name: asset.name || asset.ticker,
        asset_class: asset.asset_class || "other",
        direction: safeDirection(asset.direction),
        strength: String(asset.strength || "medium").trim().toLowerCase(),
        reason: asset.reason || "",
        uncertainty: asset.uncertainty || "",
      }));
    const affectedAssets = finalGeneratedAffectedAssets.map((asset: Record<string, unknown>) => ({
      node_id: nodeId,
      ticker: asset.ticker,
      name: asset.name,
      direction: asset.direction,
      strength: asset.strength,
      reason: asset.reason,
      asset_class: asset.asset_class,
      uncertainty: asset.uncertainty,
    }));
    const candidateAssetsRejected = buildCandidateRejectionReport({
      candidates: candidateAssetsConsidered,
      evaluation: mappedCandidateEvaluation,
      insertedAssets: affectedAssets,
      finalHardValidationRemovedAssets,
      serverRejectedAssets: serverRejectedAffectedAssets,
      qualityGateRejectedAssets: affectedAssetQualityGate.rejected,
      qualityGateDeduplicatedAssets: [
        ...affectedAssetQualityGate.deduplicated,
        ...affectedAssetQualityGate.moved_to_watchlist,
        ...conciseAssetCompression.removed,
      ],
      rawEventText,
      researchPlan,
      researchFactPack,
      acceptedTickerEvidence: directAffectedEvidence,
    });

    if (affectedAssets.length) {
      const { error: assetsError } = await supabase.from("affected_assets").insert(affectedAssets);
      if (assetsError) throw new Error(`Could not insert affected assets: ${assetsError.message}`);
    }

    generatedNode.affected_assets = finalGeneratedAffectedAssets;

    const researchExposureValidation = buildResearchExposureRows({
      nodeId: String(nodeId),
      assetsToResearch,
      rawEventText,
      researchFactPack,
    });
    const researchExposures = researchExposureValidation.inserted;
    const rejectedResearchExposures = researchExposureValidation.rejected;
    const exposureRowsBeforeCompression = researchExposureValidation.before_compression || [];
    const exposuresRemovedByCompression = researchExposureValidation.removed_by_compression || [];

    if (rejectedResearchExposures.length || exposuresRemovedByCompression.length) {
      const exposureWarnings = uniqueStrings([
        ...rejectedResearchExposures,
        ...exposuresRemovedByCompression,
      ].map((exposure) => String(exposure.exposure_rejection_reason || "").trim()).filter(Boolean));
      researchFactPack.research_warnings = uniqueStrings([
        ...(Array.isArray(researchFactPack.research_warnings) ? researchFactPack.research_warnings : []),
        ...exposureWarnings,
      ]);
      appendMissingData(validatedDraft, exposureWarnings);
      warnings.push(...exposureWarnings);
    }

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

    let researchRunId = "";
    const { data: researchRun, error: researchRunError } = await supabase.from("research_runs").insert({
      node_id: String(nodeId),
      raw_event_text: rawEventText,
      research_plan: researchPlan,
      evidence_map: validatedDraft.evidence_map,
      quality_gate: validatedDraft.quality_gate,
      missing_data: validatedDraft.missing_data,
      assets_to_research: assetsToResearch,
    })
      .select("id")
      .single();

    if (researchRunError) {
      warnings.push(`research_runs was not saved: ${researchRunError.message}`);
    } else {
      researchRunId = String(researchRun?.id || "");
    }

    const externalResearchSaveResults = await saveExternalResearchItems(supabase, externalResearchItems, {
      nodeId: String(nodeId),
      researchRunId,
    });
    const externalResearchSummary = summarizeExternalResearchItems(externalResearchItems, externalResearchSaveResults);
    if (externalResearchSummary.warnings.length) {
      researchFactPack.research_warnings = uniqueStrings([
        ...(Array.isArray(researchFactPack.research_warnings) ? researchFactPack.research_warnings : []),
        ...externalResearchSummary.warnings,
      ]);
      warnings.push(...externalResearchSummary.warnings);
    }

    const { error: factPackError } = await supabase.from("research_fact_packs").insert({
      node_id: String(nodeId),
      raw_event_text: rawEventText,
      normalized_query: researchFactPack.normalized_query,
      detected_entities: researchFactPack.detected_entities,
      detected_regions: researchFactPack.detected_regions,
      related_news_count: researchFactPack.related_news_count,
      related_news: researchFactPack.related_news_headlines,
      source_domains: researchFactPack.source_domains,
      candidate_assets: researchFactPack.candidate_assets_from_exposure_map,
      research_warnings: researchFactPack.research_warnings,
      missing_data: researchFactPack.missing_data,
    });

    if (factPackError) {
      warnings.push(`research_fact_packs was not saved: ${factPackError.message}`);
    }

    const rejectedAssetsWithReasons = [
      ...finalHardValidationRemovedAssets.map((asset) => ({
        stage: "final_hard_validation",
        ticker: asset.ticker || asset.ticker_or_asset || "",
        name: asset.name || asset.ticker || asset.ticker_or_asset || "",
        reason: asset.final_hard_validation_reason || "",
      })),
      ...serverRejectedAffectedAssets.map((asset) => ({
        stage: "channel_gate",
        ticker: asset.ticker || asset.ticker_or_asset || "",
        name: asset.name || asset.ticker || asset.ticker_or_asset || "",
        reason: asset.candidate_rejection_reason || "",
      })),
      ...affectedAssetQualityGate.rejected.map((asset: Record<string, unknown>) => ({
        stage: "quality_gate",
        ticker: asset.ticker || "",
        name: asset.name || asset.ticker || "",
        reason: asset.quality_gate_reason || "",
      })),
      ...affectedAssetQualityGate.deduplicated.map((asset: Record<string, unknown>) => ({
        stage: "deduplicated",
        ticker: asset.ticker || "",
        name: asset.name || asset.ticker || "",
        reason: asset.quality_gate_reason || "",
      })),
      ...affectedAssetQualityGate.moved_to_watchlist.map((asset: Record<string, unknown>) => ({
        stage: "moved_to_watchlist",
        ticker: asset.ticker || "",
        name: asset.name || asset.ticker || "",
        reason: asset.quality_gate_reason || "",
      })),
      ...conciseAssetCompression.removed.map((asset: Record<string, unknown>) => ({
        stage: "concise_node_compression",
        ticker: asset.ticker || "",
        name: asset.name || asset.ticker || "",
        reason: asset.compression_reason || asset.quality_gate_reason || "",
      })),
    ];

    const affectedAssetValidationDiagnostics = {
      final_affected_assets_inserted: affectedAssets,
      debug_ai_proposed_assets_before_validation: debugAiProposedAssetsBeforeValidation,
      proposed_assets_before_compression: conciseAssetCompression.proposed_assets_before_compression,
      final_affected_assets_after_compression: affectedAssets,
      assets_moved_to_watchlist: watchlistCandidates,
      watchlist_candidates: watchlistCandidates,
      assets_rejected_as_indirect_or_weak: [
        ...affectedAssetQualityGate.rejected,
        ...conciseAssetCompression.removed,
      ],
      rejected_by_final_hard_validation: finalHardValidationRemovedAssets,
      rejected_by_channel_gate: serverRejectedAffectedAssets,
      rejected_by_quality_gate: affectedAssetQualityGate.rejected,
      deduplicated: affectedAssetQualityGate.deduplicated,
      concise_node_compression_removed: conciseAssetCompression.removed,
      affected_asset_display_limit: conciseAssetCompression.display_limit,
      app_node_asset_compression: conciseAssetCompression,
      exposures_before_compression: exposureRowsBeforeCompression,
      final_exposures_after_compression: researchExposures,
      exposures_removed_as_generic_or_duplicate: exposuresRemovedByCompression,
    };

    return jsonResponse({
      ok: true,
      node_id: nodeId,
      status: "draft",
      external_research_items_created: externalResearchSummary.external_research_items_created,
      sources_attempted: externalResearchSummary.sources_attempted,
      sources_successful: externalResearchSummary.sources_successful,
      sources_failed_or_skipped: externalResearchSummary.sources_failed_or_skipped,
      external_research_summary: externalResearchSummary,
      generation_layers: {
        research_layer: {
          fact_pack_created: true,
          gdelt_status: (researchFactPack.gdelt_diagnostics as Record<string, unknown> | undefined)?.status || "skipped",
          fred_status: (researchFactPack.fred_diagnostics as Record<string, unknown> | undefined)?.status || "skipped",
          candidate_assets_considered_count: candidateAssetsConsidered.length,
          proposed_assets_before_compression_count: conciseAssetCompression.proposed_assets_before_compression.length,
          proposed_exposures_before_compression_count: exposureRowsBeforeCompression.length,
          watchlist_candidates_count: watchlistCandidates.length,
        },
        app_node_layer: {
          affected_asset_display_limit: conciseAssetCompression.display_limit,
          final_affected_assets_count: affectedAssets.length,
          exposure_display_limit: researchExposureValidation.display_limit,
          final_exposures_count: researchExposures.length,
          compression_summary: conciseAssetCompression.summary,
        },
      },
      research_plan_summary: summarizeResearchPlan(researchPlan),
      research_fact_pack_summary: summarizeResearchFactPack(researchFactPack),
      gdelt_diagnostics: researchFactPack.gdelt_diagnostics,
      gdelt_attempted: Boolean((researchFactPack.gdelt_diagnostics as Record<string, unknown> | undefined)?.attempted),
      gdelt_status: (researchFactPack.gdelt_diagnostics as Record<string, unknown> | undefined)?.status || "skipped",
      gdelt_api_key_notice: gdeltApiKeyNotice,
      gdelt_query: researchFactPack.normalized_query,
      gdelt_endpoint_summary: gdeltEndpointSummary,
      fred_diagnostics: researchFactPack.fred_diagnostics,
      fred_attempted: Boolean((researchFactPack.fred_diagnostics as Record<string, unknown> | undefined)?.attempted),
      fred_status: (researchFactPack.fred_diagnostics as Record<string, unknown> | undefined)?.status || "skipped",
      fred_api_key_detected: Boolean((researchFactPack.fred_diagnostics as Record<string, unknown> | undefined)?.api_key_detected),
      fred_series_attempted: (researchFactPack.fred_diagnostics as Record<string, unknown> | undefined)?.series_attempted || [],
      fred_series_successful: (researchFactPack.fred_diagnostics as Record<string, unknown> | undefined)?.series_successful || [],
      fred_series_failed: (researchFactPack.fred_diagnostics as Record<string, unknown> | undefined)?.series_failed || [],
      related_news_count: researchFactPack.related_news_count,
      related_news_headlines: researchFactPack.related_news_headlines,
      source_domains: researchFactPack.source_domains,
      transmission_channels: getTransmissionChannels(researchPlan),
      assets_to_research: researchExposures,
      final_exposures_inserted: researchExposures,
      exposures_inserted: researchExposures,
      exposures_rejected: rejectedResearchExposures,
      exposures_before_compression: exposureRowsBeforeCompression,
      final_exposures_after_compression: researchExposures,
      exposures_removed_as_generic_or_duplicate: exposuresRemovedByCompression,
      proposed_exposures_before_compression: exposureRowsBeforeCompression,
      debug_assets_to_research_before_exposure_validation: assetsToResearch,
      candidate_assets_considered: candidateAssetsConsidered,
      debug_candidate_asset_evaluation_before_server_gates: mappedCandidateEvaluation,
      candidate_assets_rejected: candidateAssetsRejected,
      rejected_assets_with_reasons: rejectedAssetsWithReasons,
      proposed_assets_before_compression: conciseAssetCompression.proposed_assets_before_compression,
      final_affected_assets_after_compression: affectedAssets,
      assets_moved_to_watchlist: watchlistCandidates,
      watchlist_candidates: watchlistCandidates,
      assets_rejected_as_indirect_or_weak: [
        ...affectedAssetQualityGate.rejected,
        ...conciseAssetCompression.removed,
      ],
      compression_warnings: uniqueStrings([
        ...conciseAssetCompression.warnings,
        ...exposuresRemovedByCompression.map((exposure: Record<string, unknown>) => String(exposure.exposure_rejection_reason || "").trim()).filter(Boolean),
      ]),
      final_hard_validation_removed_assets: finalHardValidationRemovedAssets,
      server_channel_gate_rejected_assets: serverRejectedAffectedAssets,
      affected_asset_quality_gate: {
        accepted: affectedAssetQualityGate.accepted,
        rejected: affectedAssetQualityGate.rejected,
        deduplicated: affectedAssetQualityGate.deduplicated,
        moved_to_watchlist: affectedAssetQualityGate.moved_to_watchlist,
      },
      app_node_compression: {
        affected_assets: conciseAssetCompression,
        exposures: {
          proposed_exposures_before_compression: exposureRowsBeforeCompression,
          final_exposures_after_compression: researchExposures,
          exposures_removed_as_generic_or_duplicate: exposuresRemovedByCompression,
          display_limit: researchExposureValidation.display_limit,
        },
      },
      affected_asset_validation_diagnostics: affectedAssetValidationDiagnostics,
      debug_ai_proposed_assets_before_validation: debugAiProposedAssetsBeforeValidation,
      missing_data: validatedDraft.missing_data,
      quality_gate_summary: summarizeQualityGate(validatedDraft.quality_gate),
      affected_assets_count: affectedAssets.length,
      affected_assets_inserted: affectedAssets,
      warnings: uniqueStrings([...warnings, ...(Array.isArray(validatedDraft.warnings) ? validatedDraft.warnings : [])]),
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




















