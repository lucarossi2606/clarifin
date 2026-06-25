# Clarifin Generator Evals

Run from the project root:

```bash
npm run eval:generator
```

Without `CLARIFIN_GENERATOR_EVAL_URL`, the command validates fixture contracts only. It does not call the generator, does not call the network, and does not create DB rows.

To evaluate real generator output, run the Edge Function locally or use a safe deployed eval endpoint that contains the `dry_run` changes, then run:

```bash
CLARIFIN_GENERATOR_EVAL_URL=http://127.0.0.1:54321/functions/v1/generate-node npm run eval:generator
```

Optional headers:

```bash
CLARIFIN_GENERATOR_EVAL_KEY=your_anon_or_eval_key
CLARIFIN_REVIEW_ADMIN_TOKEN=your_review_token
```

The runner sends:

```json
{
  "dry_run": true,
  "eval_mode": true,
  "eval_fixture": "fixture_name"
}
```

The generator must return diagnostics and app-facing sections, but must not insert rows in dry-run mode.

