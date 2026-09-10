# Environment

Environment files must be created locally from examples. Do not commit real
values.

Observed variable groups:

- Supabase: project URL and anon key.
- Stripe: publishable key and price IDs.
- AI providers: OpenAI, Anthropic, Gemini, Perplexity.
- Analytics and ads: GA measurement ID, AdSense ID.
- Site URL configuration.
- Razorpay keys in the `thekpihub_1554` reference repo only.

Component examples:

- `apps/website/.env.example`
- `apps/platform/.env.example`
- `archive/apps/legacy-app/backend/.env.example`
- `apps/wingcommander-reference/backend/.env.example`
- `apps/wingcommander-reference/frontend/.env.example`

The live website also documents a generated `config.js` file. Use
`apps/website/config.example.js` or `apps/website/config.js.template`; never
commit the real `config.js`.

