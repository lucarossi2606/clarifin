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

const nodeSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "category",
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
    category: { type: "string" },
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
        required: ["ticker", "name", "direction", "strength", "reason", "evidence", "uncertainty"],
        properties: {
          ticker: { type: "string" },
          name: { type: "string" },
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
      required: ["event_type", "event_status", "time_sensitivity", "primary_theme", "secondary_themes"],
      properties: {
        event_type: { type: "string" },
        event_status: { type: "string", enum: ["confirmed", "report", "rumor", "speculation", "scheduled", "unknown"] },
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
        required: ["theme", "why_relevant", "possible_tickers_to_check", "data_needed", "time_horizon"],
        properties: {
          theme: { type: "string" },
          why_relevant: { type: "string" },
          possible_tickers_to_check: { type: "array", items: { type: "string" } },
          data_needed: { type: "string" },
          time_horizon: { type: "string" },
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

function summarizeResearchPlan(plan: Record<string, unknown>) {
  const classification = plan.event_classification as Record<string, unknown> | undefined;
  const entities = plan.entities as Record<string, unknown> | undefined;
  const transmissionChannels = Array.isArray(plan.transmission_channels) ? plan.transmission_channels : [];
  return {
    event_type: classification?.event_type || "",
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

function getAssetsToResearch(validatedDraft: Record<string, unknown>, researchPlan: Record<string, unknown>) {
  const generated = Array.isArray(validatedDraft.assets_to_research)
    ? validatedDraft.assets_to_research as Record<string, unknown>[]
    : [];
  const planAssets = Array.isArray(researchPlan.potentially_affected_assets_to_research)
    ? researchPlan.potentially_affected_assets_to_research as Record<string, unknown>[]
    : [];
  const channelAssets = getTransmissionChannels(researchPlan).map((channel) => ({
    theme: String(channel.channel || "Transmission channel"),
    why_relevant: String(channel.mechanism || ""),
    possible_tickers_to_check: Array.isArray(channel.possible_public_assets_to_check) ? channel.possible_public_assets_to_check : [],
    data_needed: Array.isArray(channel.missing_data) ? channel.missing_data.join("; ") : "",
    time_horizon: String(channel.time_horizon || ""),
  }));

  const normalized = [
    ...generated,
    ...planAssets.map((asset) => ({
      theme: String(asset.asset_or_ticker || "Asset/theme to research"),
      why_relevant: String(asset.why_it_might_matter || ""),
      possible_tickers_to_check: [],
      data_needed: String(asset.evidence_from_input || asset.needs_verification ? "Verify the asset, ticker mapping, exposure and direction before treating it as affected." : ""),
      time_horizon: "",
    })),
    ...channelAssets,
  ].map((item) => ({
    theme: String(item.theme || "").trim(),
    why_relevant: String(item.why_relevant || "").trim(),
    possible_tickers_to_check: Array.isArray(item.possible_tickers_to_check)
      ? uniqueStrings(item.possible_tickers_to_check).filter((ticker) => !isInvalidAssetLabel(ticker))
      : [],
    data_needed: String(item.data_needed || "").trim(),
    time_horizon: String(item.time_horizon || "").trim(),
  })).filter((item) => item.theme || item.why_relevant || item.possible_tickers_to_check.length || item.data_needed);

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

  node.causal_chain = sourceChains.slice(0, 5).map((chain, index) => {
    const channel = channels[index] || {};
    const affectedGroups = uniqueStrings([
      ...(Array.isArray(channel.directly_affected_entities) ? channel.directly_affected_entities : []),
      ...(Array.isArray(channel.indirectly_affected_entities_to_research) ? channel.indirectly_affected_entities_to_research : []),
      String(chain.sector_impact || ""),
    ]).join(", ");
    const possibleAssets = Array.isArray(channel.possible_public_assets_to_check)
      ? uniqueStrings(channel.possible_public_assets_to_check).join(", ")
      : "";
    const missingData = Array.isArray(channel.missing_data)
      ? uniqueStrings(channel.missing_data).join("; ")
      : String(chain.watch || "");
    const timeHorizon = String(channel.time_horizon || "").trim() || "unknown";
    const baseMechanism = String(channel.mechanism || chain.mechanism || "").trim();
    const event = String(chain.event || "Event described in the input").trim();

    return {
      title: String(chain.title || channel.channel || "Transmission channel").trim(),
      event,
      mechanism: [
        `1) Trigger: ${event}`,
        `2) Transmission: ${baseMechanism || "The event changes expectations through the identified channel."}`,
        `3) Affected groups: ${affectedGroups || "asset groups still need to be identified and verified."}`,
        `4) Verification: ${missingData || "confirm the size, duration, and market relevance of the channel."}`,
      ].join(" -> "),
      sector_impact: `Sectors or asset groups affected: ${affectedGroups || "to research"}.`,
      asset_impact: [
        `Possible direction: ${String(chain.asset_impact || "depends on exposure, pricing power, hedging, and duration").trim()}.`,
        possibleAssets ? `Possible tickers to check, not validated affected assets: ${possibleAssets}.` : "",
      ].filter(Boolean).join(" "),
      watch: `Time horizon: ${timeHorizon}. Needs verification: ${missingData || "event duration, exposure, and market pricing."}`,
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
        strength: "Watch",
        reason: [
          `${ticker} appears in the input or was provided by the user, so it can be tracked as a directly mentioned public-market symbol.`,
          marketReaction ? `Evidence: ${marketReaction.evidence}` : "Evidence: the ticker was directly mentioned by the user/input.",
          "Uncertainty: the instrument, exposure, and causal link still require verification before treating it as a strong affected asset.",
        ].join(" "),
      });
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
        "Uncertainty: verify what the instrument holds, whether exposure is direct or indirect, and whether it is investable for the user.",
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
    const name = String(asset.name || "").trim().toLowerCase();
    const isAcceptedTicker = acceptedTickerEvidence.includes(ticker);
    const looksLikeTicker = /^[A-Z][A-Z0-9.]{0,12}$/.test(ticker);
    if (isInvalidAssetLabel(ticker)) return false;
    if (isInvalidAssetLabel(asset.name)) asset.name = ticker;
    if (!looksLikeTicker) return false;
    if (!isAcceptedTicker) return false;
    if (name && (name.includes("private") || name.includes("not directly tradable"))) {
      return false;
    }
    return true;
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
          "- Indirect assets can appear as possible_public_assets_to_check, but they should not become final affected_assets without evidence.",
          "- Transmission channels should help a private investor understand why the event matters beyond a watchlist ticker.",
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
          "The final node should explain the important transmission channels even when some assets remain unverified.",
          "",
          "Evidence mapping rules:",
          "- Classify each important claim as input_fact, source_fact, market_reaction, inference, unverified, or missing.",
          "- Because this version does not fetch source URLs, source_fact is allowed only when the user provided actual source text in raw_event_text.",
          "- The final node must not present inference or unverified claims as confirmed fact.",
          "- Missing information should be explicitly flagged instead of guessed.",
          "",
          "Affected asset validation rules:",
          "- No affected asset without evidence.",
          "- Never create affected_assets with ticker or name UNKNOWN, N/A, none, broad sector names, or placeholder labels.",
          "- Only use affected_assets for concrete public tickers/assets that are directly mentioned, user-provided, or clearly verified inside the input.",
          "- If the event is macro/geopolitical and no concrete ticker is provided, it is acceptable for affected_assets to be an empty array.",
          "- Broad groups such as sectors, commodities, currencies, bonds, transport, producers, insurers, or regional markets belong in causal_chain or assets_to_research unless a concrete ticker is verified.",
          "- A directly mentioned public ticker may be included when the reason clearly states the direct evidence and uncertainty.",
          "- A ticker is evidence-supported when it is directly mentioned with a cashtag, explicitly provided by the user, or tied to a stated market reaction.",
          "- Directly mentioned assets may be included, but direction still needs evidence.",
          "- If a market reaction is mentioned, direction must incorporate it.",
          "- If evidence is weak, use mixed or neutral.",
          "- Do not mark an asset positive just because a strategy sounds exciting.",
          "- Separate immediate market reaction from long-term strategy.",
          "- Private companies must be private_not_directly_tradable.",
          "- Private companies must be kept in research planning and missing data, not inserted as normal public affected_assets unless a direct public ticker is verified.",
          "- ETFs/funds must not be treated as the underlying company.",
          "- If a user-provided ticker looks like an indirect exposure vehicle, ETF, fund, SPV, or proxy, do not treat it as the underlying private company. Treat it as an instrument requiring verification of holdings/exposure. Use evidence_type=user_mentioned_ticker_needs_verification.",
          "- Peers, competitors, suppliers, broad sector ETFs, and luxury peers require an explicit and specific causal chain.",
          "- In reported related-party transactions or merger discussions, a slight positive price move does not erase governance and capital-allocation risk; direction should usually be mixed unless evidence is strong.",
          "",
          "Writing rules:",
          "- No investment advice, no buy/sell/hold recommendations, no performance promises.",
          "- Be specific and conservative.",
          "- why_matters must explain broader investor relevance, not just summarize the article.",
          "- causal_chain is the main value of the node. Use the research_plan transmission_channels to explain how the event can travel across governance, capital allocation, infrastructure, supply chains, demand, commodities, rates, FX, private/public-market links, or other relevant channels.",
          "- For each causal chain, include the event/trigger, a 2-4 step mechanism, sectors or asset groups affected, possible direction, time horizon, and what needs verification. Fit those details into the existing fields: event, mechanism, sector_impact, asset_impact, and watch.",
          "- assets_to_research should hold themes, sector groups, commodity/rate/currency exposures, indirect vehicles, and possible tickers that need verification before becoming affected_assets.",
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
  node.impact = normalizeScore(node.impact, 40);
  node.confidence = normalizeScore(node.confidence, 35);

  node.affected_assets = (Array.isArray(node.affected_assets) ? node.affected_assets : [])
    .map((asset: Record<string, unknown>) => {
      const reason = String(asset.reason || "").trim();
      const evidence = String(asset.evidence || "").trim();
      const uncertainty = String(asset.uncertainty || "").trim();
      const ticker = String(asset.ticker || "").trim().toUpperCase();
      const name = String(asset.name || "").trim();

      return {
        ticker,
        name: isInvalidAssetLabel(name) ? ticker : name,
        direction: safeDirection(asset.direction),
        strength: String(asset.strength || "Watch").trim(),
        reason: [
          reason,
          evidence ? `Evidence: ${evidence}` : "",
          uncertainty ? `Uncertainty: ${uncertainty}` : "",
        ].filter(Boolean).join(" "),
      };
    })
    .filter((asset: Record<string, string>) => asset.ticker && asset.reason && !isInvalidAssetLabel(asset.ticker) && !isInvalidAssetLabel(asset.name));

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

    const validatedDraft = await createValidatedDraft({
      raw_event_text: rawEventText,
      source_urls: sourceUrls,
      tickers,
      research_plan: researchPlan,
      apiKey: openAiApiKey,
      model,
    });

    const generatedNode = normalizeGeneratedNode(validatedDraft, sourceUrls);
    applyConservativeGuardrails({
      generatedNode,
      validatedDraft,
      researchPlan,
      rawEventText,
      tickers,
    });
    const assetsToResearch = getAssetsToResearch(validatedDraft, researchPlan);

    const { data: node, error: nodeError } = await supabase
      .from("nodes")
      .insert({
        title: generatedNode.title,
        category: generatedNode.category,
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
    const affectedAssets = generatedNode.affected_assets.map((asset: Record<string, unknown>) => ({
      node_id: nodeId,
      ticker: asset.ticker,
      name: asset.name,
      direction: asset.direction,
      strength: asset.strength,
      reason: asset.reason,
    }));

    if (affectedAssets.length) {
      const { error: assetsError } = await supabase.from("affected_assets").insert(affectedAssets);
      if (assetsError) throw new Error(`Could not insert affected assets: ${assetsError.message}`);
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
