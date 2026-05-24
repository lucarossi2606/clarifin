# Clarifin AI Draft Generator Setup

This adds a small AI generator for Clarifin node drafts.

What it does:

- Takes raw event text from `generate.html`.
- Sends it to the Supabase Edge Function `generate-node`.
- The Edge Function calls OpenAI using the secret `OPENAI_API_KEY`.
- The Edge Function saves the generated node as `status = draft`.
- Drafts are not published automatically.

## 1. Add the OpenAI secret in Supabase

In Supabase:

1. Open your project.
2. Go to `Project Settings`.
3. Open `Edge Functions`.
4. Add this secret:

```txt
OPENAI_API_KEY=your_openai_api_key_here
```

Do not paste this key into `index.html` or `generate.html`.

## 2. Deploy the Edge Function

From the folder that contains the `supabase` folder, run:

```bash
supabase functions deploy generate-node
```

The function is configured in `supabase/config.toml` with:

```toml
[functions.generate-node]
verify_jwt = false
```

That keeps this prototype simple while there is no login system yet.

## 3. Upload `generate.html`

Upload `generate.html` next to your existing `index.html` on GitHub Pages.

Then open:

```txt
https://YOUR-GITHUB-PAGES-URL/generate.html
```

## 4. Review drafts

After generating a draft, open Supabase Table Editor and check:

- `nodes` where `status = draft`
- `affected_assets`
- `node_details`

When you are happy with a draft, manually change the node status from `draft` to `published`.

The main Clarifin app only loads `published` nodes, so generated drafts will not appear until you publish them.
