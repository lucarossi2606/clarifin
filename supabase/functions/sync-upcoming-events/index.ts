import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const IMPORTANT_TICKERS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "META",
  "GOOGL",
  "TSLA",
  "JPM",
  "GS",
  "NFLX",
  "ASML",
  "TSM",
  "RACE",
  "LVMUY",
  "ADBE",
  "COST",
  "NKE",
  "FDX",
  "CCL",
  "DOCU",
  "AVGO",
  "ORCL",
  "CRM",
  "NOW",
  "INTU",
  "AMD",
  "INTC",
  "MU",
  "QCOM",
  "TXN",
  "BAC",
  "MS",
  "C",
  "WFC",
  "BLK",
  "V",
  "MA",
  "PYPL",
  "WMT",
  "HD",
  "LOW",
  "TGT",
  "MCD",
  "SBUX",
  "LLY",
  "NVO",
  "UNH",
  "JNJ",
  "PFE",
  "MRK",
  "XOM",
  "CVX",
  "CAT",
  "DE",
  "BA",
  "GE",
  "SAP",
];

const EUROPE_TICKERS = new Set(["ASML", "SAP", "RACE", "LVMUY"]);

const IMPORTANCE_BY_TICKER: Record<string, number> = {
  NVDA: 98,
  AAPL: 96,
  MSFT: 96,
  AVGO: 96,
  TSLA: 95,
  AMZN: 94,
  META: 93,
  GOOGL: 93,
  ASML: 92,
  TSM: 92,
  AMD: 92,
  ORCL: 91,
  CRM: 91,
  NOW: 91,
  JPM: 90,
  COST: 90,
  LLY: 90,
  NVO: 90,
  NFLX: 89,
  ADBE: 89,
  INTU: 89,
  GS: 88,
  MS: 88,
  BAC: 88,
  C: 87,
  WFC: 87,
  BLK: 87,
  V: 87,
  MA: 87,
  WMT: 87,
  XOM: 87,
  CVX: 87,
  BA: 87,
  GE: 87,
  INTC: 86,
  MU: 86,
  QCOM: 86,
  TXN: 86,
  HD: 86,
  UNH: 86,
  JNJ: 86,
  MRK: 86,
  CAT: 86,
  DE: 86,
  RACE: 86,
  SAP: 86,
  LVMUY: 85,
  NKE: 85,
  FDX: 85,
  PYPL: 85,
  LOW: 85,
  TGT: 85,
  MCD: 85,
  SBUX: 85,
  PFE: 85,
  DOCU: 85,
  CCL: 85,
};

type FmpEarningsEvent = {
  symbol?: string;
  date?: string;
  time?: string;
  hour?: string;
  dateTime?: string;
  datetime?: string;
  company?: string;
  companyName?: string;
  name?: string;
};

type UpcomingEventInsert = {
  title: string;
  category: string;
  region: string;
  event_time: string;
  importance: number;
  source: string;
  source_url: null;
  tickers: string[];
  status: string;
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

function formatDateForApi(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Vienna",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
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
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  return sign * (hours * 60 + minutes);
}

function viennaDateTimeToUtcIso(dateString: string, hour = 22, minute = 0) {
  // Build a Europe/Vienna local time and convert it to the UTC ISO value Supabase stores.
  const [year, month, day] = dateString.split("-").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offsetMinutes = parseTimeZoneOffsetMinutes(utcGuess, "Europe/Vienna");
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0) - offsetMinutes * 60_000).toISOString();
}

function cleanTicker(value: unknown) {
  return String(value || "").trim().toUpperCase();
}

function getTickerImportance(ticker: string) {
  return IMPORTANCE_BY_TICKER[ticker] ?? 85;
}

function getTickerRegion(ticker: string) {
  return EUROPE_TICKERS.has(ticker) ? "eu" : "us";
}

function getEventDate(event: FmpEarningsEvent) {
  const date = String(event.date || event.dateTime || event.datetime || "").trim();
  const match = date.match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0] || "";
}

function parseApiDateTime(event: FmpEarningsEvent) {
  // If FMP returns a full date-time, use it directly.
  const fullDateTime = String(event.dateTime || event.datetime || "").trim();
  if (fullDateTime) {
    const parsed = new Date(fullDateTime);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const date = getEventDate(event);
  if (!date) return "";

  // Some earnings APIs use labels like bmo/amc instead of an exact clock time.
  const timeLabel = String(event.time || event.hour || "").trim().toLowerCase();
  const clockMatch = timeLabel.match(/^(\d{1,2}):(\d{2})/);
  if (clockMatch) {
    return viennaDateTimeToUtcIso(date, Number(clockMatch[1]), Number(clockMatch[2]));
  }

  if (["bmo", "before market open"].includes(timeLabel)) return viennaDateTimeToUtcIso(date, 13, 0);
  if (["dmh", "during market hours"].includes(timeLabel)) return viennaDateTimeToUtcIso(date, 16, 0);

  // Default required by Clarifin: date at 22:00 Europe/Vienna.
  return viennaDateTimeToUtcIso(date, 22, 0);
}

async function fetchFmpEarningsCalendar(apiKey: string, from: string, to: string) {
  // FMP earnings calendar endpoint supports from/to date filters.
  const url = new URL("https://financialmodelingprep.com/stable/earnings-calendar");
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`FMP request failed: ${response.status} ${details}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("FMP returned an unexpected response shape.");
  return data as FmpEarningsEvent[];
}

function convertFmpEvent(event: FmpEarningsEvent): UpcomingEventInsert | null {
  const ticker = cleanTicker(event.symbol);
  if (!IMPORTANT_TICKERS.includes(ticker)) return null;

  const eventTime = parseApiDateTime(event);
  if (!eventTime) return null;

  return {
    title: `${ticker} earnings`,
    category: "Earnings",
    region: getTickerRegion(ticker),
    event_time: eventTime,
    importance: getTickerImportance(ticker),
    source: "Financial Modeling Prep",
    source_url: null,
    tickers: [ticker],
    status: "published",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Use POST to run this sync." }, 405);
  }

  try {
    const fmpApiKey = requireEnv("FMP_API_KEY");
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    // The service role key is used only inside this server-side Edge Function.
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const today = new Date();
    const from = formatDateForApi(today);
    const to = formatDateForApi(addDays(today, 30));

    const fmpEvents = await fetchFmpEarningsCalendar(fmpApiKey, from, to);
    const convertedEvents = fmpEvents
      .map(convertFmpEvent)
      .filter((event): event is UpcomingEventInsert => Boolean(event))
      .sort((a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime());

    const inserted = [];
    const skipped = [];

    for (const event of convertedEvents) {
      // Duplicate rule: same title and same event_time means this event is already synced.
      const { data: existingRows, error: existingError } = await supabase
        .from("upcoming_events")
        .select("id")
        .eq("title", event.title)
        .eq("event_time", event.event_time)
        .limit(1);

      if (existingError) throw existingError;

      if (existingRows && existingRows.length > 0) {
        skipped.push({ title: event.title, event_time: event.event_time, reason: "duplicate" });
        continue;
      }

      const { data: insertedRow, error: insertError } = await supabase
        .from("upcoming_events")
        .insert(event)
        .select("id,title,event_time")
        .single();

      if (insertError) throw insertError;
      inserted.push(insertedRow);
    }

    return jsonResponse({
      ok: true,
      provider: "Financial Modeling Prep",
      date_range: { from, to },
      fetched_count: fmpEvents.length,
      matched_count: convertedEvents.length,
      inserted_count: inserted.length,
      skipped_duplicate_count: skipped.length,
      inserted,
      skipped,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});
