# thekpihub-website
The KPI Hub - SaaS Intelligence Platform

## Local setup / Deployment

Five pages (`login.html`, `register.html`, `dashboard.html`, `upgrade.html`, `upgrade-success.html`) depend on a `config.js` file that is **not committed to this repo** because it contains live API keys.

**Before running or deploying the site:**

1. Copy the example file:
   ```bash
   cp config.example.js config.js
   ```
2. Open `config.js` and fill in the four groups of values:
   - **Supabase** — Project URL and anon key from Supabase dashboard → Project Settings → API
   - **Stripe publishable key** — from Stripe dashboard → Developers → API keys
   - **Stripe price IDs** — one per plan (starter / growth / enterprise) from Stripe dashboard → Product catalog
   - **App URLs** — set `url` to your deployment domain; the other three can stay as relative paths
3. Never commit `config.js` — it is gitignored.
