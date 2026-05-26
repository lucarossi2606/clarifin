# Sync Upcoming Events Setup

This project now has a Supabase Edge Function:

```
supabase/functions/sync-upcoming-events/index.ts
```

It syncs selected earnings-calendar events from Financial Modeling Prep into the `upcoming_events` table.

## Secrets To Add

Run these from the project folder:

```bash
supabase secrets set FMP_API_KEY=your_fmp_api_key_here
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

`SUPABASE_URL` is normally available in Supabase Edge Functions. If your function says it is missing, add it too:

```bash
supabase secrets set SUPABASE_URL=https://omoansqramrgtpecsudh.supabase.co
```

Never put `FMP_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in `index.html`.

## Deploy

```bash
supabase functions deploy sync-upcoming-events
```

## Test

After deploying, run:

```bash
supabase functions invoke sync-upcoming-events --method POST
```

Or with curl:

```bash
curl -X POST "https://omoansqramrgtpecsudh.supabase.co/functions/v1/sync-upcoming-events" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_OR_FUNCTION_TOKEN"
```

## What It Does

- Fetches the next 30 days of FMP earnings calendar events.
- Keeps only these tickers:
  AAPL, MSFT, NVDA, AMZN, META, GOOGL, TSLA, JPM, GS, NFLX, ASML, TSM, RACE, LVMUY.
- Converts them into `upcoming_events` rows.
- Inserts only new rows.
- Skips duplicates with the same `title` and `event_time`.
- Saves rows with `status = "published"` so `index.html` can load them.
