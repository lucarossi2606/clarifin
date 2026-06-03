import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-review-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const gdeltDocApiEndpoint = "https://api.gdeltproject.org/api/v2/doc/doc";
const fmpEarningsCalendarEndpoint = "https://financialmodelingprep.com/stable/earnings-calendar";
const maxCandidatesPerRun = 15;
const maxFmpEarningsCandidates = 10;
const maxGdeltCandidates = 5;
const maxNodesGeneratedPerRun = 3;
const importantEarningsTickers = new Set([
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "GOOG", "META", "TSLA", "AVGO", "AMD",
  "JPM", "BAC", "GS", "MS", "V", "MA", "NFLX", "ADBE", "CRM", "COST", "WMT",
  "NKE", "FDX", "CCL", "DAL", "LMT", "RTX", "XOM", "CVX",
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

function cleanString(value: unknown) {
  return String(value || "").trim();
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

async function createEventCandidate(supabase: any, input: CandidateInput) {
  const row = buildCandidateRow(input);
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
  return { candidate: data, duplicate };
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

async function fetchFmpEarningsCandidates(apiKey: string) {
  if (!apiKey) return { candidates: [] as CandidateInput[], status: "skipped", warning: "FMP_API_KEY not configured." };
  const today = new Date();
  const params = new URLSearchParams({
    from: formatDateForApi(today),
    to: formatDateForApi(addDays(today, 7)),
    apikey: apiKey,
  });
  const response = await fetch(`${fmpEarningsCalendarEndpoint}?${params.toString()}`);
  if (!response.ok) return { candidates: [] as CandidateInput[], status: "failed", warning: `FMP earnings calendar unavailable: HTTP ${response.status}.` };
  const rows = await response.json();
  const earningsRows = (Array.isArray(rows) ? rows : [])
    .filter((row) => cleanString(row.symbol))
    .sort((a, b) => {
      const aImportant = importantEarningsTickers.has(cleanString(a.symbol).toUpperCase()) ? 0 : 1;
      const bImportant = importantEarningsTickers.has(cleanString(b.symbol).toUpperCase()) ? 0 : 1;
      return aImportant - bImportant || cleanString(a.date).localeCompare(cleanString(b.date));
    })
    .slice(0, maxFmpEarningsCandidates);

  return {
    candidates: earningsRows.map((row): CandidateInput => {
      const symbol = cleanString(row.symbol).toUpperCase();
      const date = cleanString(row.date);
      const eps = row.epsEstimated ?? row.eps_estimate ?? row.epsEstimate ?? null;
      const revenue = row.revenueEstimated ?? row.revenue_estimate ?? row.revenueEstimate ?? null;
      const summary = `${symbol} reports earnings${date ? ` on ${date}` : ""}. Watch EPS, revenue, guidance, margins, and sector read-throughs.`;
      return {
        source_name: "FMP",
        source_type: "calendar",
        title: `${symbol} earnings coming up`,
        summary,
        raw_event_text: [
          summary,
          eps !== null ? `EPS estimate: ${eps}.` : "",
          revenue !== null ? `Revenue estimate: ${revenue}.` : "",
          "The market question is whether results or guidance create a direct company impact and sector read-through.",
        ].filter(Boolean).join(" "),
        category: "Earnings",
        region: "us",
        detected_entities: { tickers: [symbol], regions: ["US"], keywords: ["earnings"] },
        candidate_assets: [symbol],
        candidate_sources: [{ source_name: "FMP", source_type: "earnings_calendar", date }],
        source_payload: row,
        why_it_matters: `${symbol} earnings can move the stock directly and create read-throughs for peers, suppliers, customers, or the broader sector if guidance changes expectations.`,
      };
    }),
    status: "success",
    warning: "",
  };
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
  const errors: string[] = [];

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

      for (const input of result.candidates.slice(0, maxCandidatesPerRun - created.length - duplicates.length)) {
        const saved = await createEventCandidate(supabase, input);
        if (saved.duplicate) duplicates.push(saved.candidate);
        else created.push(saved.candidate);
      }
    } catch (error) {
      sourcesFailedOrSkipped.push(collector.source);
      errors.push(error instanceof Error ? error.message : `${collector.source} failed.`);
    }
  }

  return {
    candidates_created: created,
    candidates_duplicates: duplicates,
    sources_attempted: uniqueStrings(sourcesAttempted),
    sources_successful: uniqueStrings(sourcesSuccessful),
    sources_failed_or_skipped: uniqueStrings(sourcesFailedOrSkipped),
    warnings: uniqueStrings(warnings),
    errors,
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
  return {
    ok: true,
    action: "run_once",
    candidates_created: collection.candidates_created.length,
    candidates_updated: 0,
    candidates_duplicates: collection.candidates_duplicates.length,
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
        candidates_duplicates: result.candidates_duplicates.length,
        candidates_created_rows: result.candidates_created,
        candidates_duplicate_rows: result.candidates_duplicates,
        sources_attempted: result.sources_attempted,
        sources_successful: result.sources_successful,
        sources_failed_or_skipped: result.sources_failed_or_skipped,
        warnings: result.warnings,
        errors: result.errors,
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
        ...(await generateFromCandidates(supabase, serviceRoleKey, supabaseUrl, candidateId, true)),
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
