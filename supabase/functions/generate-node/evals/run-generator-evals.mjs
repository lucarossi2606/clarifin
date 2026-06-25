#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateFixtureOutput, validateFixtureContract } from "./quality-checks.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultFixturesDir = path.join(__dirname, "fixtures");

function parseArgs(argv) {
  const args = {
    fixturesDir: defaultFixturesDir,
    url: process.env.CLARIFIN_GENERATOR_EVAL_URL || "",
    contractOnly: false,
    timeoutMs: Number(process.env.CLARIFIN_GENERATOR_EVAL_TIMEOUT_MS || 120000)
  };

  for (const arg of argv) {
    if (arg === "--contract-only") args.contractOnly = true;
    else if (arg.startsWith("--url=")) args.url = arg.slice("--url=".length);
    else if (arg.startsWith("--fixtures-dir=")) args.fixturesDir = path.resolve(arg.slice("--fixtures-dir=".length));
    else if (arg.startsWith("--timeout-ms=")) args.timeoutMs = Number(arg.slice("--timeout-ms=".length));
  }

  return args;
}

async function loadFixtures(fixturesDir) {
  const entries = await readdir(fixturesDir, { withFileTypes: true });
  const fixtureFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(fixturesDir, entry.name))
    .sort();

  const fixtures = [];
  for (const file of fixtureFiles) {
    const raw = await readFile(file, "utf8");
    fixtures.push({
      file,
      data: JSON.parse(raw)
    });
  }
  return fixtures;
}

function buildHeaders() {
  const headers = {
    "Content-Type": "application/json"
  };
  const evalKey = process.env.CLARIFIN_GENERATOR_EVAL_KEY || process.env.SUPABASE_ANON_KEY || "";
  const reviewToken = process.env.CLARIFIN_REVIEW_ADMIN_TOKEN || "";
  if (evalKey) {
    headers.apikey = evalKey;
    headers.Authorization = `Bearer ${evalKey}`;
  }
  if (reviewToken) {
    headers["x-review-admin-token"] = reviewToken;
  }
  return headers;
}

async function callGeneratorDryRun(url, fixture, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: buildHeaders(),
      signal: controller.signal,
      body: JSON.stringify({
        ...fixture.input,
        dry_run: true,
        eval_mode: true,
        eval_fixture: fixture.name
      })
    });
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { ok: false, error: text };
    }
    if (!response.ok) {
      return {
        ok: false,
        error: `Generator returned HTTP ${response.status}`,
        body
      };
    }
    return {
      ok: true,
      body
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown fetch error",
      body: null
    };
  } finally {
    clearTimeout(timeout);
  }
}

function printCheckFailures(result) {
  for (const check of result.checks.filter((item) => !item.passed && !item.skipped)) {
    console.log(`    - ${check.name}: ${check.reason}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fixtures = await loadFixtures(args.fixturesDir);
  const shouldCallGenerator = Boolean(args.url) && !args.contractOnly;

  console.log(`Clarifin generator evals`);
  console.log(`Fixtures: ${fixtures.length}`);
  console.log(shouldCallGenerator
    ? `Mode: generator dry-run (${args.url})`
    : "Mode: fixture contract only (set CLARIFIN_GENERATOR_EVAL_URL or pass --url to run generator dry-runs)");

  let failed = 0;
  let skippedGenerator = 0;

  for (const fixtureEntry of fixtures) {
    const fixture = fixtureEntry.data;
    const contract = validateFixtureContract(fixture);
    if (!contract.passed) {
      failed += 1;
      console.log(`FAIL ${fixtureEntry.file}`);
      for (const error of contract.errors) console.log(`    - ${error}`);
      continue;
    }

    if (!shouldCallGenerator) {
      skippedGenerator += 1;
      console.log(`PASS ${fixture.name} fixture contract`);
      console.log(`SKIP ${fixture.name} generator dry-run`);
      continue;
    }

    const generated = await callGeneratorDryRun(args.url, fixture, args.timeoutMs);
    if (!generated.ok) {
      failed += 1;
      console.log(`FAIL ${fixture.name} generator call`);
      console.log(`    - ${generated.error}`);
      if (generated.body?.error) console.log(`    - ${generated.body.error}`);
      continue;
    }

    const result = evaluateFixtureOutput(fixture, generated.body);
    if (result.passed) {
      console.log(`PASS ${fixture.name}`);
      console.log(`    direct=${result.summary.direct_impact_count} indirect=${result.summary.indirect_impact_count} exposures=${result.summary.exposures_count} publish_blocked=${result.summary.publish_blocked}`);
    } else {
      failed += 1;
      console.log(`FAIL ${fixture.name}`);
      console.log(`    direct=${result.summary.direct_impact_count} indirect=${result.summary.indirect_impact_count} exposures=${result.summary.exposures_count} publish_blocked=${result.summary.publish_blocked}`);
      printCheckFailures(result);
    }
  }

  if (skippedGenerator) {
    console.log(`Generator dry-runs skipped for ${skippedGenerator} fixture(s). This local run did not create DB rows.`);
  }

  if (failed) {
    console.log(`Result: ${failed} failed`);
    process.exit(1);
  }

  console.log("Result: all evaluated checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

