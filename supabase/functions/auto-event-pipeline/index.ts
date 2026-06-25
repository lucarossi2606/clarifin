import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-review-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const gdeltDocApiEndpoint = "https://api.gdeltproject.org/api/v2/doc/doc";
const fmpStableEndpoint = "https://financialmodelingprep.com/stable";
const fmpEarningsCalendarEndpoint = `${fmpStableEndpoint}/earnings-calendar`;
const maxCandidatesPerRun = 25;
const maxFmpEarningsCandidates = 20;
const maxFmpEarningsEnrichmentCandidates = 20;
const maxGdeltCandidates = 5;
const maxNodesGeneratedPerRun = 3;
const importantEarningsTickers = new Set([
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "GOOG", "META", "TSLA", "AVGO", "AMD",
  "JPM", "BAC", "GS", "MS", "V", "MA", "NFLX", "ADBE", "CRM", "COST", "WMT",
  "NKE", "FDX", "CCL", "DAL", "LMT", "RTX", "XOM", "CVX",
]);
const topEventEarningsTickers = new Set([
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "GOOG", "META", "TSLA", "JPM",
]);

const allowedActions = new Set([
  "list_candidates",
  "collect_candidates",
  "generate_from_candidates",
  "generate_candidate",
  "publish_candidate_node",
  "ignore_candidate",
  "archive_candidate",
  "run_once",
]);

type CandidateInput = {
  source_name: string;
  source_type: string;
  title: string;
  summary: string;
  raw_event_text: string;
  category?: string;
  region?: string;
  detected_entities?: Record<string, unknown>;
  candidate_assets?: string[];
  candidate_sources?: Record<string, unknown>[];
  source_url?: string;
  source_payload?: Record<string, unknown>;
  why_it_matters?: string;
  display_bucket?: string;
  event_type?: string;
  market_importance_score?: number;
  earnings_date?: string;
  company_name?: string;
  eps_estimate?: number | null;
  revenue_estimate?: number | null;
  fiscal_date_ending?: string | null;
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

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required Supabase secret: ${name}`);
  return value;
}

function optionalEnv(name: string) {
  return (Deno.env.get(name) || "").trim();
}

function validateReviewToken(req: Request) {
  const configuredToken = requireEnv("REVIEW_ADMIN_TOKEN");
  const providedToken = (req.headers.get("x-review-admin-token") || "").trim();
  return Boolean(providedToken) && providedToken === configuredToken;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDateForApi(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
  }).formatToParts(date);
  const offsetLabel = parts.find((part) => part.type === "timeZoneName")?.value || "GMT+0";
  const match = offsetLabel.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "+" ? 1 : -1;
  return sign * ((Number(match[2] || 0) * 60) + Number(match[3] || 0));
}

function viennaDateTimeToUtcIso(dateString: string, hour = 22, minute = 0) {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return "";
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offsetMinutes = parseTimeZoneOffsetMinutes(utcGuess, "Europe/Vienna");
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0) - offsetMinutes * 60_000).toISOString();
}

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.map((value) => cleanString(value)).filter(Boolean))];
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeCandidateText(value: unknown) {
  return cleanString(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s$./-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDisplayBucket(value: unknown) {
  const normalized = cleanString(value).toLowerCase();
  return ["top", "upcoming", "watchlist_later"].includes(normalized) ? normalized : "top";
}

function isEarningsInput(input: CandidateInput | Record<string, unknown>) {
  return cleanString(input.event_type).toLowerCase() === "earnings"
    || cleanString(input.category).toLowerCase() === "earnings";
}

function getEarningsDate(row: Record<string, unknown>) {
  const date = cleanString(row.date || row.dateTime || row.datetime || row.earnings_date);
  const match = date.match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0] || "";
}

function parseEarningsEventTime(row: Record<string, unknown>) {
  const fullDateTime = cleanString(row.dateTime || row.datetime);
  if (fullDateTime) {
    const parsed = new Date(fullDateTime);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  const date = getEarningsDate(row);
  if (!date) return "";
  const timeLabel = cleanString(row.time || row.hour).toLowerCase();
  const clockMatch = timeLabel.match(/^(\d{1,2}):(\d{2})/);
  if (clockMatch) return viennaDateTimeToUtcIso(date, Number(clockMatch[1]), Number(clockMatch[2]));
  if (["bmo", "before market open"].includes(timeLabel)) return viennaDateTimeToUtcIso(date, 13, 0);
  if (["dmh", "during market hours"].includes(timeLabel)) return viennaDateTimeToUtcIso(date, 16, 0);
  return viennaDateTimeToUtcIso(date, 22, 0);
}

function daysUntilDate(dateString: string) {
  const date = new Date(`${dateString}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return 999;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

function classifyCandidateCategory(text: string) {
  const normalized = normalizeCandidateText(text);
  if (/(earnings|eps|revenue|guidance|quarterly results)/.test(normalized)) return "Earnings";
  if (/(fed|ecb|central bank|cpi|inflation|jobs|payrolls|unemployment|rates|yields)/.test(normalized)) return "Macro";
  if (/(oil|crude|lng|gas|energy|eia|hormuz|tanker|shipping)/.test(normalized)) return "Energy";
  if (/(iran|middle east|war|sanctions|geopolitical|military|conflict)/.test(normalized)) return "Geopolitics";
  if (/(crypto|bitcoin|ethereum|stablecoin|coinbase|binance|defi)/.test(normalized)) return "Crypto";
  if (/(antitrust|regulation|regulator|lawsuit|court)/.test(normalized)) return "Regulation";
  return "Markets";
}

function detectCandidateEntities(text: string) {
  const normalized = cleanString(text);
  const tickers = uniqueStrings(Array.from(normalized.matchAll(/\$?([A-Z]{1,5}(?:\.[A-Z]{1,3})?)\b/g)).map((match) => match[1]))
    .filter((ticker) => !["THE", "AND", "FOR", "WITH", "FROM", "NEXT", "API", "FMP", "GDELT", "USD", "EPS"].includes(ticker))
    .slice(0, 10);
  const lower = normalized.toLowerCase();
  const regions = uniqueStrings([
    lower.includes("united states") || lower.includes("u.s.") || lower.includes("fed") ? "US" : "",
    lower.includes("europe") || lower.includes("eurozone") || lower.includes("ecb") ? "EU" : "",
    lower.includes("iran") || lower.includes("middle east") || lower.includes("hormuz") ? "Middle East" : "",
    lower.includes("china") ? "China" : "",
  ]);
  return {
    tickers,
    regions,
    keywords: uniqueStrings([
      lower.includes("earnings") ? "earnings" : "",
      lower.includes("inflation") || lower.includes("cpi") ? "inflation" : "",
      lower.includes("oil") || lower.includes("crude") ? "oil" : "",
      lower.includes("hormuz") ? "hormuz" : "",
      lower.includes("cyber") ? "cyber" : "",
      lower.includes("crypto") || lower.includes("bitcoin") ? "crypto" : "",
    ]),
  };
}

function candidateRegion(input: CandidateInput, entities: Record<string, unknown>) {
  if (input.region) return input.region;
  const regions = Array.isArray(entities.regions) ? entities.regions : [];
  if (regions.includes("US")) return "us";
  if (regions.includes("EU")) return "eu";
  if (regions.includes("Middle East")) return "global";
  return "global";
}

function scoreEventCandidate(input: CandidateInput) {
  const text = normalizeCandidateText(`${input.title} ${input.summary} ${input.raw_event_text}`);
  const entities = detectCandidateEntities(input.raw_event_text);
  const tickerCount = Array.isArray(entities.tickers) ? entities.tickers.length : 0;
  const sectorTerms = ["oil", "rates", "inflation", "earnings", "defense", "airlines", "shipping", "crypto", "semiconductor", "banks"]
    .filter((term) => text.includes(term)).length;

  if (isEarningsInput(input)) {
    const symbol = uniqueStrings(input.candidate_assets || (Array.isArray(entities.tickers) ? entities.tickers : []))[0] || "";
    const marketImportance = clampScore(Number(input.market_importance_score || 0));
    const daysAway = daysUntilDate(cleanString(input.earnings_date));
    const hasEstimates = input.eps_estimate !== null || input.revenue_estimate !== null || /(eps estimate|revenue estimate)/.test(text);
    const topBucket = normalizeDisplayBucket(input.display_bucket) === "top";
    const relevance = clampScore(
      24
      + Math.round(marketImportance * 0.48)
      + (topEventEarningsTickers.has(symbol) ? 10 : 0)
      + (hasEstimates ? 5 : 0)
      + (topBucket ? 8 : 0),
    );
    const urgency = clampScore(
      daysAway <= 1 ? 88
        : daysAway <= 3 ? 76
          : daysAway <= 7 ? 64
            : 45,
    );
    const confidence = clampScore(64 + (input.source_name === "FMP" ? 18 : 0) + (hasEstimates ? 5 : 0));
    const total = clampScore((marketImportance * 0.42) + (urgency * 0.24) + (confidence * 0.22) + (relevance * 0.12));
    return {
      relevance_score: relevance,
      urgency_score: urgency,
      confidence_score: confidence,
      total_score: total,
    };
  }

  let relevance = 38 + Math.min(18, tickerCount * 4) + Math.min(18, sectorTerms * 4);
  if (/(market|investor|shares|yields|oil|rates|earnings|guidance|inflation|supply|demand)/.test(text)) relevance += 18;
  if (/(direct impact|shipping|chokepoint|central bank|large cap|megacap|guidance)/.test(text)) relevance += 8;

  let urgency = 32;
  if (/(breaking|escalat|shock|surge|plunge|immediate|unsafe|war-risk|attack)/.test(text)) urgency += 28;
  if (/(today|tomorrow|this week|next week|earnings|calendar|scheduled|reports on)/.test(text)) urgency += 22;
  if (/(fed|ecb|cpi|payrolls|central bank|hormuz|sanctions)/.test(text)) urgency += 14;

  let confidence = 42;
  if (input.source_name === "FMP") confidence += 22;
  if (input.source_name === "GDELT") confidence += 8;
  if (input.source_type === "calendar") confidence += 12;
  if (/(reported|reportedly|could|may|unconfirmed|watching whether)/.test(text)) confidence -= 10;
  if (Array.isArray(input.candidate_sources) && input.candidate_sources.length > 1) confidence += 8;

  relevance = clampScore(relevance);
  urgency = clampScore(urgency);
  confidence = clampScore(confidence);
  const total = clampScore((relevance * 0.45) + (urgency * 0.30) + (confidence * 0.25));
  return {
    relevance_score: relevance,
    urgency_score: urgency,
    confidence_score: confidence,
    total_score: total,
  };
}

function buildCandidateRow(input: CandidateInput) {
  const entities = input.detected_entities || detectCandidateEntities(input.raw_event_text);
  const category = input.category || classifyCandidateCategory(`${input.title} ${input.raw_event_text}`);
  const eventType = input.event_type || (category.toLowerCase() === "earnings" ? "earnings" : input.source_type);
  const displayBucket = normalizeDisplayBucket(input.display_bucket || (eventType === "earnings" ? "upcoming" : "top"));
  const scores = scoreEventCandidate({ ...input, category, detected_entities: entities });
  return {
    source_name: input.source_name,
    source_type: input.source_type,
    title: input.title,
    summary: input.summary,
    raw_event_text: input.raw_event_text,
    category,
    region: candidateRegion(input, entities),
    detected_entities: entities,
    candidate_assets: input.candidate_assets || (Array.isArray(entities.tickers) ? entities.tickers : []),
    candidate_sources: input.candidate_sources || [{
      source_name: input.source_name,
      source_type: input.source_type,
      source_url: input.source_url || "",
    }],
    display_bucket: displayBucket,
    event_type: eventType,
    market_importance_score: input.market_importance_score ?? null,
    earnings_date: input.earnings_date || null,
    company_name: input.company_name || null,
    eps_estimate: input.eps_estimate ?? null,
    revenue_estimate: input.revenue_estimate ?? null,
    fiscal_date_ending: input.fiscal_date_ending || null,
    source_url: input.source_url || null,
    source_payload: input.source_payload || null,
    why_it_matters: input.why_it_matters || input.summary,
    ...scores,
  };
}

function similarityScore(first: string, second: string) {
  const a = new Set(normalizeCandidateText(first).split(" ").filter((word) => word.length > 3));
  const b = new Set(normalizeCandidateText(second).split(" ").filter((word) => word.length > 3));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((word) => b.has(word)).length;
  return intersection / Math.max(a.size, b.size);
}

async function detectDuplicateCandidate(supabase: any, row: Record<string, unknown>) {
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const { data: candidates, error } = await supabase
    .from("event_candidates")
    .select("id,title,raw_event_text,category,region,status,total_score")
    .gte("created_at", since)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(`Candidate duplicate lookup failed: ${error.message}`);

  const title = cleanString(row.title);
  const raw = cleanString(row.raw_event_text);
  const duplicate = (candidates || []).find((candidate: Record<string, unknown>) => {
    const sameCategory = cleanString(candidate.category) === cleanString(row.category);
    const titleSimilarity = similarityScore(title, cleanString(candidate.title));
    const rawSimilarity = similarityScore(raw, cleanString(candidate.raw_event_text));
    return sameCategory && (titleSimilarity >= 0.72 || rawSimilarity >= 0.70);
  });
  if (duplicate) return { type: "candidate", id: duplicate.id };

  const { data: nodes, error: nodeError } = await supabase
    .from("nodes")
    .select("id,title,short,status,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(60);
  if (nodeError) return null;
  const duplicateNode = (nodes || []).find((node: Record<string, unknown>) => (
    similarityScore(title, cleanString(node.title)) >= 0.72
    || similarityScore(raw, `${node.title || ""} ${node.short || ""}`) >= 0.70
  ));
  if (duplicateNode) return { type: "node", id: duplicateNode.id };
  return null;
}

function primaryCandidateTicker(row: Record<string, unknown>) {
  const assets = Array.isArray(row.candidate_assets) ? row.candidate_assets : [];
  return cleanString(assets[0] || (row.source_payload as Record<string, unknown> | undefined)?.symbol).toUpperCase();
}

async function findExistingEarningsCandidate(supabase: any, row: Record<string, unknown>) {
  const ticker = primaryCandidateTicker(row);
  const earningsDate = cleanString(row.earnings_date);
  if (!ticker || !earningsDate) return null;
  const { data, error } = await supabase
    .from("event_candidates")
    .select("id,status,candidate_assets,title,related_node_id,auto_generation_attempted,auto_generation_status,auto_published")
    .eq("event_type", "earnings")
    .eq("earnings_date", earningsDate)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw new Error(`Earnings candidate duplicate lookup failed: ${error.message}`);
  return (data || []).find((candidate: Record<string, unknown>) => {
    const assets = Array.isArray(candidate.candidate_assets) ? candidate.candidate_assets.map((item) => cleanString(item).toUpperCase()) : [];
    return assets.includes(ticker) || cleanString(candidate.title).toUpperCase().startsWith(`${ticker} `);
  }) || null;
}

async function createEventCandidate(supabase: any, input: CandidateInput) {
  const row = buildCandidateRow(input);
  if (isEarningsInput(row)) {
    const existing = await findExistingEarningsCandidate(supabase, row);
    if (existing) {
      const { data, error } = await supabase
        .from("event_candidates")
        .update(row)
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw new Error(`Could not update earnings event candidate: ${error.message}`);
      return { candidate: data, duplicate: { type: "earnings_candidate", id: existing.id }, updated: true };
    }
  }
  const duplicate = await detectDuplicateCandidate(supabase, row);
  const insertRow = duplicate
    ? {
      ...row,
      status: "duplicate",
      duplicate_of_candidate_id: duplicate.type === "candidate" ? duplicate.id : null,
      related_node_id: duplicate.type === "node" ? duplicate.id : null,
    }
    : row;

  const { data, error } = await supabase
    .from("event_candidates")
    .insert(insertRow)
    .select("*")
    .single();
  if (error) throw new Error(`Could not create event candidate: ${error.message}`);
  return { candidate: data, duplicate, updated: false };
}

async function updateEventCandidateStatus(supabase: any, candidateId: string, patch: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("event_candidates")
    .update(patch)
    .eq("id", candidateId)
    .select("*")
    .single();
  if (error) throw new Error(`Could not update event candidate: ${error.message}`);
  return data;
}

async function fetchFmpStableRows(endpoint: string, apiKey: string, params: Record<string, string>, timeoutMs = 3500) {
  const url = new URL(`${fmpStableEndpoint}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  url.searchParams.set("apikey", apiKey);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return { rows: [] as Record<string, unknown>[], warning: `FMP ${endpoint} unavailable: HTTP ${response.status}.` };
    const payload = await response.json();
    const rows = Array.isArray(payload)
      ? payload as Record<string, unknown>[]
      : payload && typeof payload === "object"
        ? [payload as Record<string, unknown>]
        : [];
    return { rows, warning: "" };
  } catch (_error) {
    return { rows: [] as Record<string, unknown>[], warning: `FMP ${endpoint} failed or timed out.` };
  }
}

async function fetchFmpEarningsEnrichment(symbol: string, apiKey: string) {
  const [profileResult, quoteResult] = await Promise.all([
    fetchFmpStableRows("profile", apiKey, { symbol }),
    fetchFmpStableRows("quote", apiKey, { symbol }),
  ]);
  return {
    profile: profileResult.rows[0] || {},
    quote: quoteResult.rows[0] || {},
    warnings: uniqueStrings([profileResult.warning, quoteResult.warning]),
  };
}

function getEarningsSymbol(row: Record<string, unknown>) {
  return cleanString(row.symbol || row.ticker).toUpperCase();
}

function getCompanyName(row: Record<string, unknown>, enrichment?: Record<string, Record<string, unknown>>) {
  return cleanString(
    row.company
    || row.companyName
    || row.name
    || enrichment?.profile?.companyName
    || enrichment?.profile?.company_name
    || enrichment?.profile?.name,
  );
}

function getEpsEstimate(row: Record<string, unknown>) {
  return toOptionalNumber(row.epsEstimated ?? row.eps_estimate ?? row.epsEstimate ?? row.estimatedEps ?? row.eps);
}

function getRevenueEstimate(row: Record<string, unknown>) {
  return toOptionalNumber(row.revenueEstimated ?? row.revenue_estimate ?? row.revenueEstimate ?? row.estimatedRevenue ?? row.revenue);
}

function getFiscalDateEnding(row: Record<string, unknown>) {
  return cleanString(row.fiscalDateEnding || row.fiscal_date_ending);
}

function getEnrichedMarketCap(enrichment?: Record<string, Record<string, unknown>>) {
  return toOptionalNumber(
    enrichment?.quote?.marketCap
    ?? enrichment?.quote?.mktCap
    ?? enrichment?.profile?.mktCap
    ?? enrichment?.profile?.marketCap,
  ) || 0;
}

function marketCapImportancePoints(marketCap: number) {
  if (marketCap >= 2_000_000_000_000) return 45;
  if (marketCap >= 1_000_000_000_000) return 41;
  if (marketCap >= 500_000_000_000) return 36;
  if (marketCap >= 250_000_000_000) return 31;
  if (marketCap >= 100_000_000_000) return 25;
  if (marketCap >= 50_000_000_000) return 18;
  if (marketCap >= 10_000_000_000) return 10;
  return 0;
}

function preliminaryEarningsPriority(row: Record<string, unknown>) {
  const symbol = getEarningsSymbol(row);
  const daysAway = daysUntilDate(getEarningsDate(row));
  const hasEstimates = getEpsEstimate(row) !== null || getRevenueEstimate(row) !== null;
  return (
    (topEventEarningsTickers.has(symbol) ? 50 : 0)
    + (importantEarningsTickers.has(symbol) ? 25 : 0)
    + (hasEstimates ? 8 : 0)
    + (daysAway <= 1 ? 12 : daysAway <= 3 ? 8 : daysAway <= 7 ? 4 : 0)
  );
}

function earningsMarketImportance(row: Record<string, unknown>, enrichment?: Record<string, Record<string, unknown>>) {
  const symbol = getEarningsSymbol(row);
  const marketCap = getEnrichedMarketCap(enrichment);
  const hasEstimates = getEpsEstimate(row) !== null || getRevenueEstimate(row) !== null;
  const sector = cleanString(enrichment?.profile?.sector).toLowerCase();
  const sectorBonus = /(technology|communication|financial|energy|healthcare|consumer)/.test(sector) ? 4 : 0;
  return clampScore(
    28
    + marketCapImportancePoints(marketCap)
    + (topEventEarningsTickers.has(symbol) ? 18 : 0)
    + (importantEarningsTickers.has(symbol) ? 8 : 0)
    + (hasEstimates ? 4 : 0)
    + sectorBonus,
  );
}

function shouldElevateEarningsToTop(row: Record<string, unknown>, marketImportance: number) {
  const symbol = getEarningsSymbol(row);
  const daysAway = daysUntilDate(getEarningsDate(row));
  if (daysAway > 2) return false;
  return topEventEarningsTickers.has(symbol) || marketImportance >= 94;
}

function summarizeEarningsCandidate(input: CandidateInput) {
  return {
    ticker: input.candidate_assets?.[0] || "",
    company_name: input.company_name || "",
    earnings_date: input.earnings_date || "",
    display_bucket: input.display_bucket || "upcoming",
    market_importance_score: input.market_importance_score || 0,
  };
}

async function fetchFmpEarningsCandidates(apiKey: string) {
  if (!apiKey) {
    return {
      candidates: [] as CandidateInput[],
      status: "skipped",
      warning: "FMP_API_KEY not configured.",
      diagnostics: {
        fmp_earnings_raw_count: 0,
        fmp_earnings_candidates_considered: 0,
        fmp_earnings_candidates_skipped: 0,
        top_earnings_candidates: [],
        upcoming_earnings_candidates: [],
        earnings_skipped_reasons: ["FMP_API_KEY not configured."],
      },
    };
  }
  const today = new Date();
  const params = new URLSearchParams({
    from: formatDateForApi(today),
    to: formatDateForApi(addDays(today, 7)),
    apikey: apiKey,
  });
  const response = await fetch(`${fmpEarningsCalendarEndpoint}?${params.toString()}`);
  if (!response.ok) {
    return {
      candidates: [] as CandidateInput[],
      status: "failed",
      warning: `FMP earnings calendar unavailable: HTTP ${response.status}.`,
      diagnostics: {
        fmp_earnings_raw_count: 0,
        fmp_earnings_candidates_considered: 0,
        fmp_earnings_candidates_skipped: 0,
        top_earnings_candidates: [],
        upcoming_earnings_candidates: [],
        earnings_skipped_reasons: [`FMP earnings calendar unavailable: HTTP ${response.status}.`],
      },
    };
  }
  const rows = await response.json();
  const rawRows = Array.isArray(rows) ? rows as Record<string, unknown>[] : [];
  const skippedReasons: string[] = [];
  const validRows = rawRows.filter((row) => {
    const symbol = getEarningsSymbol(row);
    const date = getEarningsDate(row);
    if (!symbol) {
      skippedReasons.push("Earnings row skipped: missing ticker.");
      return false;
    }
    if (!date) {
      skippedReasons.push(`Earnings row skipped for ${symbol}: missing earnings date.`);
      return false;
    }
    return true;
  });
  const rankedRows = validRows
    .sort((a, b) => {
      const scoreDiff = preliminaryEarningsPriority(b) - preliminaryEarningsPriority(a);
      if (scoreDiff !== 0) return scoreDiff;
      return getEarningsDate(a).localeCompare(getEarningsDate(b));
    });
  if (rankedRows.length > maxFmpEarningsCandidates) {
    skippedReasons.push(`${rankedRows.length - maxFmpEarningsCandidates} lower-priority earnings rows skipped by max ${maxFmpEarningsCandidates} cap.`);
  }
  const earningsRows = rankedRows.slice(0, maxFmpEarningsCandidates);
  const enrichments = new Map<string, Record<string, Record<string, unknown>>>();
  const enrichmentWarnings: string[] = [];
  for (const row of earningsRows.slice(0, maxFmpEarningsEnrichmentCandidates)) {
    const symbol = getEarningsSymbol(row);
    const enrichment = await fetchFmpEarningsEnrichment(symbol, apiKey);
    enrichments.set(symbol, { profile: enrichment.profile, quote: enrichment.quote });
    enrichmentWarnings.push(...enrichment.warnings);
  }
  const candidates = earningsRows
    .map((row): CandidateInput => {
      const symbol = getEarningsSymbol(row);
      const enrichment = enrichments.get(symbol);
      const date = getEarningsDate(row);
      const eps = getEpsEstimate(row);
      const revenue = getRevenueEstimate(row);
      const companyName = getCompanyName(row, enrichment) || symbol;
      const marketImportance = earningsMarketImportance(row, enrichment);
      const displayBucket = shouldElevateEarningsToTop(row, marketImportance) ? "top" : "upcoming";
      const summary = `${companyName} (${symbol}) reports earnings${date ? ` on ${date}` : ""}. Watch EPS, revenue, guidance, margins, and sector read-throughs.`;
      return {
        source_name: "FMP",
        source_type: "earnings",
        title: `${symbol} earnings coming up`,
        summary,
        raw_event_text: [
          summary,
          eps !== null ? `EPS estimate: ${eps}.` : "",
          revenue !== null ? `Revenue estimate: ${revenue}.` : "",
          `Market importance score: ${marketImportance}.`,
          displayBucket === "top"
            ? "This is a high-importance earnings event that may be eligible for a Top Event if generation safeguards pass."
            : "This is a scheduled earnings event and should stay in Upcoming unless an editor manually promotes it.",
          "The market question is whether results or guidance create a direct company impact and sector read-through.",
        ].filter(Boolean).join(" "),
        category: "earnings",
        region: cleanString(enrichment?.profile?.country).toLowerCase().includes("netherlands") ? "eu" : "us",
        detected_entities: { tickers: [symbol], regions: ["US"], keywords: ["earnings"] },
        candidate_assets: [symbol],
        candidate_sources: [{ source_name: "FMP", source_type: "earnings_calendar", date }],
        source_payload: {
          calendar: row,
          enrichment: {
            profile: enrichment?.profile || {},
            quote: enrichment?.quote || {},
          },
        },
        why_it_matters: displayBucket === "top"
          ? `${symbol} is market-relevant enough that its earnings may affect the stock directly and create broader sector or index read-throughs.`
          : `${symbol} earnings are relevant as a scheduled upcoming event, but do not become a Top Event unless results, guidance, market cap, or editor judgment justify it.`,
        display_bucket: displayBucket,
        event_type: "earnings",
        market_importance_score: marketImportance,
        earnings_date: date,
        company_name: companyName,
        eps_estimate: eps,
        revenue_estimate: revenue,
        fiscal_date_ending: getFiscalDateEnding(row) || null,
      };
    });
  const topCandidates = candidates.filter((candidate) => candidate.display_bucket === "top").map(summarizeEarningsCandidate);
  const upcomingCandidates = candidates.filter((candidate) => candidate.display_bucket !== "top").map(summarizeEarningsCandidate);
  return {
    candidates,
    status: candidates.length ? "success" : "no_results",
    warning: uniqueStrings(enrichmentWarnings).join(" "),
    diagnostics: {
      fmp_earnings_raw_count: rawRows.length,
      fmp_earnings_candidates_considered: validRows.length,
      fmp_earnings_candidates_skipped: skippedReasons.length,
      top_earnings_candidates: topCandidates,
      upcoming_earnings_candidates: upcomingCandidates,
      earnings_skipped_reasons: uniqueStrings(skippedReasons),
    },
  };
}

function upcomingEarningsRow(input: CandidateInput) {
  const calendar = (input.source_payload?.calendar && typeof input.source_payload.calendar === "object")
    ? input.source_payload.calendar as Record<string, unknown>
    : input.source_payload || {};
  const ticker = cleanString(input.candidate_assets?.[0]).toUpperCase();
  const eventTime = parseEarningsEventTime(calendar) || (input.earnings_date ? viennaDateTimeToUtcIso(input.earnings_date) : "");
  if (!ticker || !eventTime) return null;
  return {
    title: `${ticker} earnings`,
    category: "Earnings",
    region: input.region || "us",
    event_time: eventTime,
    importance: clampScore(Number(input.market_importance_score || 50)),
    source: "Financial Modeling Prep",
    source_url: null,
    tickers: [ticker],
    status: "published",
    company_name: input.company_name || null,
    event_type: "earnings",
    country: input.region === "eu" ? "EU" : "US",
    expected_value: null,
    previous_value: null,
    actual_value: null,
    eps_estimate: input.eps_estimate ?? null,
    revenue_estimate: input.revenue_estimate ?? null,
    fiscal_date_ending: input.fiscal_date_ending || null,
    data_quality: "api_calendar",
  };
}

function availableUpcomingFactualFields(event: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  for (const key of [
    "company_name",
    "event_type",
    "country",
    "expected_value",
    "previous_value",
    "actual_value",
    "eps_estimate",
    "revenue_estimate",
    "fiscal_date_ending",
    "data_quality",
    "importance",
    "tickers",
  ]) {
    const value = event[key];
    if (value !== undefined && value !== null && value !== "") update[key] = value;
  }
  return update;
}

async function upsertUpcomingEarningsEvent(supabase: any, input: CandidateInput) {
  const event = upcomingEarningsRow(input);
  if (!event) return { action: "skipped", reason: "missing ticker or event_time" };
  const { data: existingRows, error: existingError } = await supabase
    .from("upcoming_events")
    .select("id")
    .eq("title", event.title)
    .eq("event_time", event.event_time)
    .limit(1);
  if (existingError) throw new Error(`Upcoming earnings lookup failed: ${existingError.message}`);

  if (existingRows && existingRows.length > 0) {
    const { data, error } = await supabase
      .from("upcoming_events")
      .update(availableUpcomingFactualFields(event))
      .eq("id", existingRows[0].id)
      .select("id,title,event_time")
      .single();
    if (error) throw new Error(`Upcoming earnings update failed: ${error.message}`);
    return { action: "updated", row: data };
  }

  const { data, error } = await supabase
    .from("upcoming_events")
    .insert(event)
    .select("id,title,event_time")
    .single();
  if (error) throw new Error(`Upcoming earnings insert failed: ${error.message}`);
  return { action: "inserted", row: data };
}

function gdeltCandidateQueries() {
  return [
    {
      topic: "Strait of Hormuz shipping risk",
      query: `"Strait of Hormuz" (shipping OR tanker OR oil OR LNG OR "war risk")`,
      category: "Geopolitics",
      region: "global",
    },
    {
      topic: "Iran Middle East escalation",
      query: `Iran "Middle East" (escalation OR sanctions OR missiles OR military)`,
      category: "Geopolitics",
      region: "global",
    },
    {
      topic: "Cyber conflict escalation",
      query: `"cyber attack" (critical infrastructure OR state-linked OR escalation)`,
      category: "Technology",
      region: "global",
    },
    {
      topic: "Supply chain disruption",
      query: `"supply chain disruption" (shipping OR ports OR semiconductors OR energy)`,
      category: "Markets",
      region: "global",
    },
    {
      topic: "Central bank policy shock",
      query: `("central bank" OR Fed OR ECB) ("policy shock" OR surprise OR inflation)`,
      category: "Macro",
      region: "global",
    },
  ];
}

async function fetchGdeltCandidates() {
  const candidates: CandidateInput[] = [];
  const warnings: string[] = [];
  for (const item of gdeltCandidateQueries().slice(0, maxGdeltCandidates)) {
    const url = new URL(gdeltDocApiEndpoint);
    url.search = new URLSearchParams({
      query: item.query,
      mode: "artlist",
      format: "json",
      maxrecords: "5",
      sort: "hybridrel",
      timespan: "24h",
    }).toString();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const response = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) {
        warnings.push(`GDELT ${item.topic} unavailable: HTTP ${response.status}.`);
        continue;
      }
      const body = await response.json();
      const articles = Array.isArray(body.articles) ? body.articles : [];
      if (articles.length < 2) continue;
      const titles = articles.map((article) => cleanString(article.title)).filter(Boolean).slice(0, 4);
      candidates.push({
        source_name: "GDELT",
        source_type: "news_metadata",
        title: item.topic,
        summary: `GDELT headline metadata found ${articles.length} related headlines. Treat this as awareness metadata, not confirmed article research.`,
        raw_event_text: [
          `${item.topic}: related headline metadata suggests this theme may matter for markets.`,
          `Query: ${item.query}.`,
          titles.length ? `Representative headlines: ${titles.join(" | ")}.` : "",
          "The market question is whether the theme creates a direct causal market channel or remains watchlist-only.",
        ].filter(Boolean).join(" "),
        category: item.category,
        region: item.region,
        detected_entities: detectCandidateEntities(`${item.topic} ${titles.join(" ")}`),
        candidate_assets: [],
        candidate_sources: articles.map((article) => ({
          source_name: "GDELT",
          title: article.title || "",
          url: article.url || "",
          domain: article.domain || "",
        })).slice(0, 5),
        source_payload: { query: item.query, headline_count: articles.length },
        why_it_matters: "If confirmed by stronger sources or market reaction, this theme could affect risk premia, sector positioning, commodities, rates, or company-specific channels.",
      });
    } catch (error) {
      warnings.push(`GDELT ${item.topic} failed or timed out.`);
    }
  }
  return { candidates, status: candidates.length ? "success" : "no_results", warning: warnings.join(" ") };
}

async function collectCandidates(supabase: any) {
  const fmpApiKey = optionalEnv("FMP_API_KEY");
  const sourcesAttempted: string[] = [];
  const sourcesSuccessful: string[] = [];
  const sourcesFailedOrSkipped: string[] = [];
  const warnings: string[] = [];
  const created: Record<string, unknown>[] = [];
  const duplicates: Record<string, unknown>[] = [];
  const updated: Record<string, unknown>[] = [];
  const skipped: Record<string, unknown>[] = [];
  const errors: string[] = [];
  const fmpEarningsDiagnostics: Record<string, unknown> = {
    fmp_earnings_raw_count: 0,
    fmp_earnings_candidates_considered: 0,
    fmp_earnings_candidates_created: 0,
    fmp_earnings_candidates_skipped: 0,
    fmp_earnings_candidates_deduplicated: 0,
    top_earnings_candidates: [],
    upcoming_earnings_candidates: [],
    earnings_skipped_reasons: [],
    upcoming_events_inserted: 0,
    upcoming_events_updated: 0,
  };

  const collectors = [
    { source: "FMP", run: () => fetchFmpEarningsCandidates(fmpApiKey) },
    { source: "GDELT", run: fetchGdeltCandidates },
  ];

  for (const collector of collectors) {
    sourcesAttempted.push(collector.source);
    try {
      const result = await collector.run();
      if (result.status === "success") sourcesSuccessful.push(collector.source);
      else sourcesFailedOrSkipped.push(collector.source);
      if (result.warning) warnings.push(result.warning);
      const diagnostics = (result as Record<string, unknown>).diagnostics;
      if (collector.source === "FMP" && diagnostics && typeof diagnostics === "object") {
        Object.assign(fmpEarningsDiagnostics, diagnostics);
      }

      const availableSlots = Math.max(0, maxCandidatesPerRun - created.length - duplicates.length - updated.length);
      const inputsToSave = result.candidates.slice(0, availableSlots);
      for (const input of result.candidates.slice(availableSlots)) {
        skipped.push({ title: input.title, source_name: input.source_name, reason: "candidate_run_cap" });
      }
      for (const input of inputsToSave) {
        const saved = await createEventCandidate(supabase, input);
        if (saved.updated) updated.push(saved.candidate);
        else if (saved.duplicate) duplicates.push(saved.candidate);
        else created.push(saved.candidate);
        if (isEarningsInput(input)) {
          try {
            const upcomingResult = await upsertUpcomingEarningsEvent(supabase, input);
            if (upcomingResult.action === "inserted") {
              fmpEarningsDiagnostics.upcoming_events_inserted = Number(fmpEarningsDiagnostics.upcoming_events_inserted || 0) + 1;
            } else if (upcomingResult.action === "updated") {
              fmpEarningsDiagnostics.upcoming_events_updated = Number(fmpEarningsDiagnostics.upcoming_events_updated || 0) + 1;
            } else {
              skipped.push({ title: input.title, source_name: input.source_name, reason: (upcomingResult as Record<string, unknown>).reason || "upcoming_event_skipped" });
            }
          } catch (upcomingError) {
            warnings.push(`Upcoming earnings sync skipped for ${input.title}: ${upcomingError instanceof Error ? upcomingError.message : "unknown error"}`);
          }
        }
      }
    } catch (error) {
      sourcesFailedOrSkipped.push(collector.source);
      errors.push(error instanceof Error ? error.message : `${collector.source} failed.`);
    }
  }

  const isEarningsRow = (row: Record<string, unknown>) => cleanString(row.event_type).toLowerCase() === "earnings"
    || cleanString(row.category).toLowerCase() === "earnings";
  fmpEarningsDiagnostics.fmp_earnings_candidates_created = created.filter(isEarningsRow).length;
  fmpEarningsDiagnostics.fmp_earnings_candidates_deduplicated = updated.filter(isEarningsRow).length + duplicates.filter(isEarningsRow).length;
  fmpEarningsDiagnostics.fmp_earnings_candidates_skipped = Number(fmpEarningsDiagnostics.fmp_earnings_candidates_skipped || 0)
    + skipped.filter(isEarningsRow).length;

  return {
    candidates_created: created,
    candidates_duplicates: duplicates,
    candidates_updated: updated,
    candidates_skipped: skipped,
    sources_attempted: uniqueStrings(sourcesAttempted),
    sources_successful: uniqueStrings(sourcesSuccessful),
    sources_failed_or_skipped: uniqueStrings(sourcesFailedOrSkipped),
    warnings: uniqueStrings(warnings),
    errors,
    fmp_earnings_diagnostics: fmpEarningsDiagnostics,
  };
}

async function listCandidates(supabase: any) {
  const { data, error } = await supabase
    .from("event_candidates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Could not list event candidates: ${error.message}`);
  return {
    ok: true,
    action: "list_candidates",
    candidates: data || [],
  };
}

function hasFatalGenerationWarnings(response: Record<string, unknown>) {
  const warnings = Array.isArray(response.warnings) ? response.warnings.map((item) => cleanString(item).toLowerCase()) : [];
  return warnings.some((warning) => /(could not insert|fatal|unknown asset|invalid placeholder|not saved:)/.test(warning));
}

function generatedNodeQuality(response: Record<string, unknown>, candidate: Record<string, unknown>) {
  const direct = Array.isArray(response.direct_impact)
    ? response.direct_impact
    : Array.isArray(response.affected_assets_inserted)
      ? response.affected_assets_inserted
      : [];
  const indirect = Array.isArray(response.indirect_impact) ? response.indirect_impact : [];
  const exposures = Array.isArray(response.final_exposures_inserted)
    ? response.final_exposures_inserted
    : Array.isArray(response.exposures_inserted)
      ? response.exposures_inserted
      : [];
  const chains = Array.isArray((response.generated as Record<string, unknown> | undefined)?.causal_chain)
    ? (response.generated as Record<string, unknown>).causal_chain as unknown[]
    : [];
  const title = cleanString((response.generated as Record<string, unknown> | undefined)?.title || response.title);
  const why = cleanString((response.generated as Record<string, unknown> | undefined)?.why_matters || response.why_matters);
  const totalScore = Number(candidate.total_score || 0);
  const relevance = Number(candidate.relevance_score || 0);
  const confidence = Number(candidate.confidence_score || 0);
  const noUnknownAssets = !JSON.stringify(direct).toUpperCase().includes("UNKNOWN");
  const directWithinLimit = direct.length >= 2 && direct.length <= 8;
  const indirectWithinLimit = indirect.length <= 6;
  const hasSupportLayer = exposures.length >= 1 || indirect.length >= 1;
  const factPackExists = Boolean((response.research_fact_pack_summary as Record<string, unknown> | undefined)?.normalized_query || response.external_data_observations_in_fact_pack);
  const publishingSafety = response.publishing_safety as Record<string, unknown> | undefined;
  const publishSafetyPassed = !response.publish_blocked && (!publishingSafety || publishingSafety.passed !== false);
  const passed = totalScore >= 70
    && relevance >= 65
    && confidence >= 50
    && Boolean(response.ok)
    && Boolean(title)
    && Boolean(why || cleanString((response.generated as Record<string, unknown> | undefined)?.short))
    && directWithinLimit
    && hasSupportLayer
    && indirectWithinLimit
    && noUnknownAssets
    && chains.length >= 1
    && factPackExists
    && publishSafetyPassed
    && !hasFatalGenerationWarnings(response);
  const reasons = [
    totalScore >= 70 ? "" : "total_score below 70",
    relevance >= 65 ? "" : "relevance_score below 65",
    confidence >= 50 ? "" : "confidence_score below 50",
    directWithinLimit ? "" : "Direct Impact count below 2 or outside limit",
    hasSupportLayer ? "" : "No exposure or indirect impact",
    indirectWithinLimit ? "" : "Indirect Impact exceeds limit",
    noUnknownAssets ? "" : "UNKNOWN asset detected",
    chains.length >= 1 ? "" : "No meaningful causal chain",
    factPackExists ? "" : "Research Fact Pack not confirmed",
    publishSafetyPassed ? "" : `Generator publishing safety failed: ${Array.isArray(publishingSafety?.reasons) ? (publishingSafety?.reasons as unknown[]).join("; ") : "publish_blocked=true"}`,
    hasFatalGenerationWarnings(response) ? "Fatal/severe generation warning" : "",
  ].filter(Boolean);
  return {
    passed,
    reasons,
    direct_impact_count: direct.length,
    indirect_impact_count: indirect.length,
    exposure_count: exposures.length,
  };
}

async function callGenerateNode(candidate: Record<string, unknown>, serviceRoleKey: string, supabaseUrl: string) {
  const payload = {
    raw_event_text: candidate.raw_event_text,
    source_urls: uniqueStrings([candidate.source_url]),
    tickers: Array.isArray(candidate.candidate_assets) ? candidate.candidate_assets : [],
  };
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-node`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) {
    throw new Error(body.error || `generate-node failed: HTTP ${response.status}`);
  }
  return body as Record<string, unknown>;
}

async function autoPublishGeneratedNode(supabase: any, candidate: Record<string, unknown>, generation: Record<string, unknown>) {
  const nodeId = cleanString(generation.node_id);
  const quality = generatedNodeQuality(generation, candidate);
  if (!nodeId) return { ...quality, auto_published: false, reason: "generate-node did not return node_id." };
  if (!quality.passed) return { ...quality, auto_published: false, reason: quality.reasons.join("; ") };

  const reason = "Auto-published: candidate met score thresholds and generated node passed Direct Impact, exposure, warning, and fact-pack safeguards.";
  const { data, error } = await supabase
    .from("nodes")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", nodeId)
    .eq("status", "draft")
    .select("id,status");
  if (error) {
    return { ...quality, auto_published: false, reason: `Auto-publish update failed: ${error.message}` };
  }
  if (!data || !data.length) {
    return { ...quality, auto_published: false, reason: "Auto-publish skipped because the generated node was not in draft status." };
  }
  return { ...quality, auto_published: true, reason };
}

function isGenericExposureTheme(value: unknown) {
  const theme = cleanString(value).toLowerCase().replace(/\s+/g, " ");
  return new Set([
    "demand",
    "governance",
    "policy",
    "regional policy",
    "consumer",
    "consumer spending",
    "sector",
    "theme",
    "market",
    "market impact",
    "markets",
    "sentiment",
    "investor sentiment",
    "market dynamics",
    "regional dynamics",
    "regional security dynamics",
    "various sectors",
  ]).has(theme);
}

function textLooksGenericForPublish(value: unknown) {
  const text = cleanString(value).toLowerCase();
  if (!text) return true;
  if (text.split(/\s+/).filter(Boolean).length < 16) return true;
  return [
    "could lead to reduced military tensions",
    "potentially stabilizing the region",
    "impacting various sectors",
    "may influence policy",
    "market impact",
  ].some((term) => text.includes(term));
}

async function validateExistingNodePublishQuality(supabase: any, nodeId: string) {
  const [
    assetsResult,
    exposuresResult,
    detailsResult,
  ] = await Promise.all([
    supabase.from("affected_assets").select("*").eq("node_id", nodeId),
    supabase.from("node_research_exposures").select("*").eq("node_id", nodeId),
    supabase.from("node_details").select("*").eq("node_id", nodeId),
  ]);
  if (assetsResult.error) throw new Error(`affected_assets lookup failed: ${assetsResult.error.message}`);
  if (exposuresResult.error) throw new Error(`node_research_exposures lookup failed: ${exposuresResult.error.message}`);
  if (detailsResult.error) throw new Error(`node_details lookup failed: ${detailsResult.error.message}`);

  const affectedAssets = assetsResult.data || [];
  const exposures = exposuresResult.data || [];
  const detail = (detailsResult.data || [])[0] || {};
  const chains = Array.isArray(detail.causal_chain) ? detail.causal_chain : [];
  const genericExposures = exposures.filter((exposure: Record<string, unknown>) => isGenericExposureTheme(exposure.theme));
  const reasons = [
    affectedAssets.length ? "" : "Direct Impact is empty after validation.",
    exposures.length ? "" : "No app-facing research exposures survived validation.",
    genericExposures.length ? `Generic exposure labels cannot be published: ${genericExposures.map((row: Record<string, unknown>) => cleanString(row.theme)).join(", ")}.` : "",
    textLooksGenericForPublish(detail.why_matters) ? "Why it matters is missing or generic." : "",
    chains.length ? "" : "No causal chains survived generation.",
  ].filter(Boolean);

  return {
    passed: reasons.length === 0,
    reasons,
    direct_impact_count: affectedAssets.length,
    exposure_count: exposures.length,
    causal_chain_count: chains.length,
  };
}

async function promoteCandidateToNode(supabase: any, candidate: Record<string, unknown>, serviceRoleKey: string, supabaseUrl: string, allowAutoPublish: boolean) {
  await updateEventCandidateStatus(supabase, cleanString(candidate.id), {
    status: "selected_for_generation",
    auto_generation_attempted: true,
    auto_generation_status: "running",
    auto_generation_error: null,
  });

  try {
    const generation = await callGenerateNode(candidate, serviceRoleKey, supabaseUrl);
    const nodeId = cleanString(generation.node_id);
    const publishResult = allowAutoPublish
      ? await autoPublishGeneratedNode(supabase, candidate, generation)
      : { ...generatedNodeQuality(generation, candidate), auto_published: false, reason: "Auto-publish disabled for this action." };
    const status = publishResult.auto_published ? "published" : "generated";
    await updateEventCandidateStatus(supabase, cleanString(candidate.id), {
      status,
      related_node_id: nodeId || null,
      auto_generation_status: "success",
      auto_generation_error: null,
      auto_published: Boolean(publishResult.auto_published),
      auto_publish_reason: publishResult.reason,
    });
    return {
      node_id: nodeId,
      title: (generation.generated as Record<string, unknown> | undefined)?.title || candidate.title,
      status: publishResult.auto_published ? "published" : "draft",
      direct_impact_count: publishResult.direct_impact_count,
      indirect_impact_count: publishResult.indirect_impact_count,
      exposure_count: publishResult.exposure_count,
      auto_published: Boolean(publishResult.auto_published),
      auto_publish_reason: publishResult.auto_published ? publishResult.reason : "",
      reason_left_draft: publishResult.auto_published ? "" : publishResult.reason,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error.";
    await updateEventCandidateStatus(supabase, cleanString(candidate.id), {
      status: "failed",
      auto_generation_status: "failed",
      auto_generation_error: message,
      auto_published: false,
      auto_publish_reason: null,
    });
    throw error;
  }
}

async function generateFromCandidates(supabase: any, serviceRoleKey: string, supabaseUrl: string, candidateId?: string, allowAutoPublish = true) {
  let query = supabase
    .from("event_candidates")
    .select("*")
    .in("status", ["candidate", "selected_for_generation", "generated"])
    .eq("display_bucket", "top")
    .gte("total_score", 70)
    .order("total_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(maxNodesGeneratedPerRun);
  if (candidateId) query = supabase.from("event_candidates").select("*").eq("id", candidateId).limit(1);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load candidates for generation: ${error.message}`);
  const candidates = data || [];
  const selected = candidates
    .filter((candidate: Record<string, unknown>) => candidateId || (
      Number(candidate.total_score || 0) >= 70
      && Number(candidate.relevance_score || 0) >= 65
      && Number(candidate.confidence_score || 0) >= 50
      && cleanString(candidate.display_bucket || "top") === "top"
      && !candidate.related_node_id
    ))
    .slice(0, candidateId ? 1 : maxNodesGeneratedPerRun);

  const summaries: Record<string, unknown>[] = [];
  const errors: string[] = [];
  for (const candidate of selected) {
    try {
      summaries.push(await promoteCandidateToNode(supabase, candidate, serviceRoleKey, supabaseUrl, allowAutoPublish));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Candidate generation failed.");
    }
  }

  return {
    candidates_selected_for_generation: selected,
    nodes_generated: summaries,
    nodes_auto_published: summaries.filter((item) => item.auto_published),
    nodes_left_as_draft: summaries.filter((item) => !item.auto_published),
    generated_nodes_summary: summaries,
    errors,
  };
}

async function publishCandidateNode(supabase: any, candidateId: string) {
  const { data: candidate, error } = await supabase
    .from("event_candidates")
    .select("*")
    .eq("id", candidateId)
    .single();
  if (error) throw new Error(`Candidate lookup failed: ${error.message}`);
  const nodeId = cleanString(candidate.related_node_id);
  if (!nodeId) throw new Error("Candidate does not have a generated node yet.");
  const quality = await validateExistingNodePublishQuality(supabase, nodeId);
  if (!quality.passed) {
    return { ok: false, candidate, node_id: nodeId, publish_blocked: true, reason: `Draft failed publish quality gate: ${quality.reasons.join("; ")}`, quality };
  }
  const reason = "Manually published from Candidate Queue.";
  const { data: updatedNodes, error: nodeError } = await supabase
    .from("nodes")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", nodeId)
    .eq("status", "draft")
    .select("id,status");
  if (nodeError) throw new Error(`Node publish failed: ${nodeError.message}`);
  if (!updatedNodes || !updatedNodes.length) {
    throw new Error("No draft node was published. The node may already be published, archived, missing, or not generated as draft.");
  }
  const updated = await updateEventCandidateStatus(supabase, candidateId, {
    status: "published",
    auto_published: false,
    auto_publish_reason: reason,
  });
  return { ok: true, candidate: updated, node_id: nodeId, reason };
}

async function runOnce(supabase: any, serviceRoleKey: string, supabaseUrl: string) {
  const collection = await collectCandidates(supabase);
  const generation = await generateFromCandidates(supabase, serviceRoleKey, supabaseUrl, undefined, true);
  const fmpDiagnostics = collection.fmp_earnings_diagnostics as Record<string, unknown>;
  return {
    ok: true,
    action: "run_once",
    candidates_created: collection.candidates_created.length,
    candidates_updated: collection.candidates_updated.length,
    candidates_duplicates: collection.candidates_duplicates.length,
    candidates_skipped: collection.candidates_skipped.length,
    candidates_selected_for_generation: generation.candidates_selected_for_generation.length,
    nodes_generated: generation.nodes_generated.length,
    nodes_auto_published: generation.nodes_auto_published.length,
    nodes_left_as_draft: generation.nodes_left_as_draft.length,
    candidates_ignored_or_archived: 0,
    sources_attempted: collection.sources_attempted,
    sources_successful: collection.sources_successful,
    sources_failed_or_skipped: collection.sources_failed_or_skipped,
    warnings: uniqueStrings(collection.warnings),
    errors: [...collection.errors, ...generation.errors],
    generated_nodes_summary: generation.generated_nodes_summary,
    fmp_earnings_raw_count: fmpDiagnostics.fmp_earnings_raw_count || 0,
    fmp_earnings_candidates_considered: fmpDiagnostics.fmp_earnings_candidates_considered || 0,
    fmp_earnings_candidates_created: fmpDiagnostics.fmp_earnings_candidates_created || 0,
    fmp_earnings_candidates_skipped: fmpDiagnostics.fmp_earnings_candidates_skipped || 0,
    fmp_earnings_candidates_deduplicated: fmpDiagnostics.fmp_earnings_candidates_deduplicated || 0,
    top_earnings_candidates: fmpDiagnostics.top_earnings_candidates || [],
    upcoming_earnings_candidates: fmpDiagnostics.upcoming_earnings_candidates || [],
    earnings_skipped_reasons: fmpDiagnostics.earnings_skipped_reasons || [],
    upcoming_events_inserted: fmpDiagnostics.upcoming_events_inserted || 0,
    upcoming_events_updated: fmpDiagnostics.upcoming_events_updated || 0,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Use POST for auto-event-pipeline." }, 405);

  try {
    if (!validateReviewToken(req)) return jsonResponse({ ok: false, error: "Unauthorized review token." }, 401);
    const body = await req.json();
    const action = cleanString(body.action);
    if (!allowedActions.has(action)) return jsonResponse({ ok: false, error: "Invalid action." }, 400);

    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    if (action === "list_candidates") return jsonResponse(await listCandidates(supabase));
    if (action === "collect_candidates") {
      const result = await collectCandidates(supabase);
      return jsonResponse({
        ok: true,
        action,
        candidates_created: result.candidates_created.length,
        candidates_updated: result.candidates_updated.length,
        candidates_duplicates: result.candidates_duplicates.length,
        candidates_skipped: result.candidates_skipped.length,
        candidates_created_rows: result.candidates_created,
        candidates_updated_rows: result.candidates_updated,
        candidates_duplicate_rows: result.candidates_duplicates,
        candidates_skipped_rows: result.candidates_skipped,
        sources_attempted: result.sources_attempted,
        sources_successful: result.sources_successful,
        sources_failed_or_skipped: result.sources_failed_or_skipped,
        warnings: result.warnings,
        errors: result.errors,
        fmp_earnings_raw_count: result.fmp_earnings_diagnostics.fmp_earnings_raw_count || 0,
        fmp_earnings_candidates_considered: result.fmp_earnings_diagnostics.fmp_earnings_candidates_considered || 0,
        fmp_earnings_candidates_created: result.fmp_earnings_diagnostics.fmp_earnings_candidates_created || 0,
        fmp_earnings_candidates_skipped: result.fmp_earnings_diagnostics.fmp_earnings_candidates_skipped || 0,
        fmp_earnings_candidates_deduplicated: result.fmp_earnings_diagnostics.fmp_earnings_candidates_deduplicated || 0,
        top_earnings_candidates: result.fmp_earnings_diagnostics.top_earnings_candidates || [],
        upcoming_earnings_candidates: result.fmp_earnings_diagnostics.upcoming_earnings_candidates || [],
        earnings_skipped_reasons: result.fmp_earnings_diagnostics.earnings_skipped_reasons || [],
      });
    }
    if (action === "generate_from_candidates") return jsonResponse({
      ok: true,
      action,
      ...(await generateFromCandidates(supabase, serviceRoleKey, supabaseUrl, undefined, true)),
    });
    if (action === "generate_candidate") {
      const candidateId = cleanString(body.candidate_id);
      if (!candidateId) return jsonResponse({ ok: false, error: "candidate_id is required." }, 400);
      return jsonResponse({
        ok: true,
        action,
        ...(await generateFromCandidates(supabase, serviceRoleKey, supabaseUrl, candidateId, false)),
      });
    }
    if (action === "publish_candidate_node") {
      const candidateId = cleanString(body.candidate_id);
      if (!candidateId) return jsonResponse({ ok: false, error: "candidate_id is required." }, 400);
      return jsonResponse(await publishCandidateNode(supabase, candidateId));
    }
    if (action === "ignore_candidate" || action === "archive_candidate") {
      const candidateId = cleanString(body.candidate_id);
      if (!candidateId) return jsonResponse({ ok: false, error: "candidate_id is required." }, 400);
      const status = action === "ignore_candidate" ? "ignored" : "archived";
      return jsonResponse({
        ok: true,
        action,
        candidate: await updateEventCandidateStatus(supabase, candidateId, { status }),
      });
    }
    if (action === "run_once") return jsonResponse(await runOnce(supabase, serviceRoleKey, supabaseUrl));
    return jsonResponse({ ok: false, error: "Unhandled action." }, 400);
  } catch (error) {
    console.error(error);
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown auto-event-pipeline error.",
    }, 500);
  }
});
