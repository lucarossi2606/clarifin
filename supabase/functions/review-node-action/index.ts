import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-review-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedActions = new Set(["list_drafts", "publish", "archive"]);

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

function validateReviewToken(req: Request) {
  const configuredToken = requireEnv("REVIEW_ADMIN_TOKEN");
  const providedToken = (req.headers.get("x-review-admin-token") || "").trim();
  return Boolean(providedToken) && providedToken === configuredToken;
}

function nodeIdsFromRows(rows: Record<string, unknown>[]) {
  return rows
    .map((row) => String(row.id || "").trim())
    .filter(Boolean);
}

async function loadRowsByNodeIds(supabase: any, tableName: string, nodeIds: string[], select = "*") {
  if (!nodeIds.length) return [];
  const { data, error } = await supabase
    .from(tableName)
    .select(select)
    .in("node_id", nodeIds);
  if (error) throw new Error(`${tableName} lookup failed: ${error.message}`);
  return data || [];
}

function groupByNodeId(rows: Record<string, unknown>[]) {
  return rows.reduce((groups: Record<string, Record<string, unknown>[]>, row) => {
    const nodeId = String(row.node_id || "").trim();
    if (!nodeId) return groups;
    if (!groups[nodeId]) groups[nodeId] = [];
    groups[nodeId].push(row);
    return groups;
  }, {});
}

async function listDrafts(supabase: any) {
  const { data: nodeRows, error: nodeError } = await supabase
    .from("nodes")
    .select("*")
    .eq("status", "draft")
    .order("created_at", { ascending: false });
  if (nodeError) throw new Error(`Draft nodes lookup failed: ${nodeError.message}`);

  const nodes = nodeRows || [];
  const nodeIds = nodeIdsFromRows(nodes);
  const [
    affectedAssets,
    nodeDetails,
    indirectImpacts,
    researchExposures,
    researchFactPacks,
  ] = await Promise.all([
    loadRowsByNodeIds(supabase, "affected_assets", nodeIds),
    loadRowsByNodeIds(supabase, "node_details", nodeIds),
    loadRowsByNodeIds(supabase, "node_indirect_impacts", nodeIds),
    loadRowsByNodeIds(supabase, "node_research_exposures", nodeIds),
    loadRowsByNodeIds(supabase, "research_fact_packs", nodeIds, "node_id,external_data_observations,missing_data,research_warnings"),
  ]);

  const assetsByNode = groupByNodeId(affectedAssets);
  const detailsByNode = groupByNodeId(nodeDetails);
  const indirectByNode = groupByNodeId(indirectImpacts);
  const exposuresByNode = groupByNodeId(researchExposures);
  const factPacksByNode = groupByNodeId(researchFactPacks);

  return {
    ok: true,
    action: "list_drafts",
    draft_count: nodes.length,
    drafts: nodes.map((node: Record<string, unknown>) => {
      const nodeId = String(node.id || "");
      return {
        node,
        affected_assets: assetsByNode[nodeId] || [],
        node_details: detailsByNode[nodeId] || [],
        node_indirect_impacts: indirectByNode[nodeId] || [],
        node_research_exposures: exposuresByNode[nodeId] || [],
        research_fact_packs: factPacksByNode[nodeId] || [],
      };
    }),
  };
}

async function updateDraftStatus(supabase: any, nodeId: string, nextStatus: "published" | "archived") {
  const { data, error } = await supabase
    .from("nodes")
    .update({ status: nextStatus })
    .eq("id", nodeId)
    .eq("status", "draft")
    .select("*");
  if (error) throw new Error(`Draft status update failed: ${error.message}`);
  if (!data || !data.length) {
    return jsonResponse({
      ok: false,
      error: "No draft node was updated. The node may not exist, may not be draft, or may already have been reviewed.",
    }, 409);
  }
  return jsonResponse({
    ok: true,
    action: nextStatus === "published" ? "publish" : "archive",
    node: data[0],
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Use POST for review-node-action." }, 405);

  try {
    if (!validateReviewToken(req)) {
      return jsonResponse({ ok: false, error: "Unauthorized review token." }, 401);
    }

    const body = await req.json();
    const action = String(body.action || "").trim();
    if (!allowedActions.has(action)) {
      return jsonResponse({ ok: false, error: "Invalid action. Use list_drafts, publish, or archive." }, 400);
    }

    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    if (action === "list_drafts") {
      return jsonResponse(await listDrafts(supabase));
    }

    const nodeId = String(body.node_id || "").trim();
    if (!nodeId) return jsonResponse({ ok: false, error: "node_id is required for publish/archive." }, 400);

    if (action === "publish") return updateDraftStatus(supabase, nodeId, "published");
    if (action === "archive") return updateDraftStatus(supabase, nodeId, "archived");

    return jsonResponse({ ok: false, error: "Unhandled action." }, 400);
  } catch (error) {
    console.error(error);
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown review-node-action error.",
    }, 500);
  }
});
