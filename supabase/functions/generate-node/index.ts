import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
      minItems: 1,
      maxItems: 8,
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

function safeDirection(value: unknown) {
  const direction = String(value || "mixed").toLowerCase();
  if (["positive", "negative", "mixed", "neutral"].includes(direction)) return direction;
  return "mixed";
}

async function createClarifinNodeWithOpenAI(input: {
  raw_event_text: string;
  source_urls: string[];
  tickers: string[];
}) {
  const openAiApiKey = requireEnv("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
  const sourceInstruction = input.source_urls.length
    ? `Use only these source URLs as source labels: ${input.source_urls.join(", ")}`
    : `No source URL was provided. Set sources exactly to ["User provided event text"].`;
  const tickerInstruction = input.tickers.length
    ? `The user mentioned these tickers. Consider them, but include them only if plausibly affected: ${input.tickers.join(", ")}`
    : "No tickers were provided. Include only plausibly affected assets.";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: [
            "You create Clarifin macro/market event drafts as structured JSON.",
            "Clarifin must not merely summarize news. Clarifin maps events into causal chains: what happened, why it matters, how the first-order market effect can transmit into second-order sector effects, which assets may be affected, the likely time horizon, what could prove the thesis wrong, and what users should watch next.",
            "",
            "Always think in this structure before writing the JSON:",
            "1. What happened?",
            "2. Why does it matter?",
            "3. What is the first-order market effect?",
            "4. What are second-order sector effects?",
            "5. Which companies/assets may be affected?",
            "6. What is the time horizon?",
            "7. What could prove this wrong?",
            "8. What should users watch next?",
            "",
            "Rules:",
            "- No investment advice.",
            "- No buy/sell/hold recommendations.",
            "- No performance promises.",
            "- Always include uncertainty.",
            "- Always include counterarguments.",
            "- Prefer clear titles understandable for non-experts.",
            "- Do not invent precise facts, numbers, dates, sources, or named details if they are not provided.",
            "- If sources are missing, set sources to exactly [\"User provided event text\"].",
            "- Confidence must be lower if the input is vague, incomplete, weakly sourced, or ambiguous.",
            "- Impact must be lower if the event is not clearly market-moving.",
            "- Generate only plausible affected assets and explain the mechanism, not a prediction.",
            "",
            "Strict affected-asset rules:",
            "- Do not invent affected assets.",
            "- Include an affected asset only if it was explicitly provided as a ticker by the user, directly mentioned in the raw event text, or has a clearly explained causal link from the event.",
            "- Do not mark an asset positive just because a company announced something strategically interesting.",
            "- Distinguish strategic long-term relevance, immediate market reaction, investor concern, and uncertainty.",
            "- If the raw event text mentions a stock-price reaction, that reaction must anchor the direction.",
            "- Example: if Ferrari stock fell after an EV announcement, RACE should be negative or mixed, not positive, unless the text gives strong contrary evidence.",
            "- If evidence is weak, use direction = mixed or neutral.",
            "- Do not include luxury peers like LVMH unless the source text explicitly discusses luxury-sector read-throughs or you can explain a concrete mechanism.",
            "- Avoid generic phrases such as 'could attract new customers', 'may shift market dynamics', or 'stronger brand position' unless backed by specific evidence.",
            "- Each affected asset must include ticker, direction, strength, reason, evidence, and uncertainty.",
            "- The reason must explain the causal mechanism and must mention whether the direction reflects immediate market reaction, investor concern, long-term strategy, or uncertainty.",
            "",
            "Missing-data rule:",
            "- If important information is missing, say so in the node. Example: Missing data: no verified market reaction, no management guidance, no margin details.",
            "- Put missing data in why_matters, causal_chain watch fields, counterarguments, or affected-asset uncertainty where relevant.",
            "",
            "Internal quality check before returning JSON:",
            "- Are all affected assets justified by user tickers, direct mention, or a concrete causal link?",
            "- Is each direction supported by evidence in the raw text?",
            "- Did you incorporate any stated stock-price reaction?",
            "- Are generic statements replaced with specific reasoning?",
            "- Are missing data points flagged instead of guessed?",
            "",
            "Built-in Clarifin causal playbook. Use as guidance, not as automatic truth:",
            "- Inflation hotter than expected: inflation up -> rate-cut expectations down -> yields up -> dollar stronger -> growth stocks and real estate pressured -> banks mixed depending on credit quality.",
            "- Oil supply shock: oil prices up -> inflation pressure up -> airlines/chemicals pressured -> energy producers benefit -> central banks have less room to cut.",
            "- AI capex rise: semiconductors benefit -> power/cooling/data center suppliers benefit -> cloud margins questioned -> Big Tech needs monetization proof.",
            "- China consumption weak: luxury demand pressured -> European luxury stocks affected -> global cyclicals may weaken -> defensive sectors may look relatively stronger.",
            "- Fed hawkish: yields up -> long-duration assets pressured -> dollar stronger -> emerging markets and gold may react."
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            "Create one Clarifin node draft from this event.",
            "",
            "Rules:",
            "- Generate JSON only.",
            "- Keep explanations concise.",
            "- Prefer simple titles like: US inflation comes in hotter than expected; Fed keeps rates higher for longer; NVIDIA earnings beat expectations.",
            "- Impact and confidence are 0-100 scores.",
            "- If the event is unclear or weakly sourced, lower confidence.",
            "- Affected assets must be plausible and may be positive, negative, mixed, or neutral.",
            "- For each affected asset, include reason, evidence, and uncertainty.",
            "- Include only assets that are provided as user tickers, directly mentioned, or connected by a concrete causal mechanism.",
            "- If a stock-price reaction is described, use it when setting direction.",
            "- If evidence is weak or mixed, direction must be mixed or neutral.",
            "- Avoid broad peer read-throughs unless the raw text supports them directly.",
            "- Do not include any buy/sell recommendation.",
            `- ${sourceInstruction}`,
            `- ${tickerInstruction}`,
            "",
            "Raw event text:",
            input.raw_event_text,
          ].join("\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "clarifin_node_draft",
          strict: true,
          schema: nodeSchema,
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
  if (message?.refusal) {
    throw new Error(`OpenAI refused the request: ${message.refusal}`);
  }

  const content = message?.content;
  if (!content) throw new Error("OpenAI returned no content.");

  const generated = JSON.parse(content);
  generated.impact = clampScore(generated.impact, 50);
  generated.confidence = clampScore(generated.confidence, 40);
  generated.affected_assets = (generated.affected_assets || []).map((asset: Record<string, unknown>) => {
    const reason = String(asset.reason || "").trim();
    const evidence = String(asset.evidence || "").trim();
    const uncertainty = String(asset.uncertainty || "").trim();

    return {
      ticker: String(asset.ticker || "").trim().toUpperCase(),
      name: String(asset.name || "").trim(),
      direction: safeDirection(asset.direction),
      strength: String(asset.strength || "Watch").trim(),
      reason: [
        reason,
        evidence ? `Evidence: ${evidence}` : "",
        uncertainty ? `Uncertainty: ${uncertainty}` : "",
      ].filter(Boolean).join(" "),
    };
  }).filter((asset: Record<string, string>) => asset.ticker && asset.reason);

  generated.sources = input.source_urls.length ? input.source_urls : ["User provided event text"];
  return generated;
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

    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const generated = await createClarifinNodeWithOpenAI({
      raw_event_text: rawEventText,
      source_urls: sourceUrls,
      tickers,
    });

    const { data: node, error: nodeError } = await supabase
      .from("nodes")
      .insert({
        title: generated.title,
        category: generated.category,
        short: generated.short,
        impact: generated.impact,
        confidence: generated.confidence,
        timestamp: new Date().toISOString(),
        region: generated.region,
        status: "draft",
      })
      .select("id")
      .single();

    if (nodeError) throw new Error(`Could not insert node draft: ${nodeError.message}`);

    const nodeId = node.id;
    const affectedAssets = generated.affected_assets.map((asset: Record<string, unknown>) => ({
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
      why_matters: generated.why_matters,
      causal_chain: generated.causal_chain,
      scenarios: generated.scenarios,
      counterarguments: generated.counterarguments,
      sources: generated.sources,
    });

    if (detailsError) throw new Error(`Could not insert node details: ${detailsError.message}`);

    return jsonResponse({
      node_id: nodeId,
      status: "draft",
      generated,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});
