// config.example.js — copy this file to config.js and fill in real values.
// config.js is gitignored and must NEVER be committed to the repository.
//
// WHERE TO FIND EACH VALUE:
//   supabase.url      — Supabase dashboard → Project Settings → API → Project URL
//   supabase.anonKey  — Supabase dashboard → Project Settings → API → anon/public key
//   stripe.publishableKey — Stripe dashboard → Developers → API keys → Publishable key (pk_live_... or pk_test_...)
//   stripe.prices.*   — Stripe dashboard → Product catalog → select a product → copy the Price ID (price_...)
//   app.*             — Set to your deployment domain (e.g. https://thekpihub.com)

const CONFIG = {
  supabase: {
    url: 'https://YOUR_PROJECT_ID.supabase.co',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  },
  stripe: {
    publishableKey: 'pk_live_YOUR_STRIPE_PUBLISHABLE_KEY',
    prices: {
      starter: 'price_YOUR_STARTER_PRICE_ID',
      growth: 'price_YOUR_GROWTH_PRICE_ID',
      enterprise: 'price_YOUR_ENTERPRISE_PRICE_ID'
    }
  },
  app: {
    url: 'https://thekpihub.com',
    loginUrl: '/login.html',
    upgradeUrl: '/upgrade.html',
    dashboardUrl: '/dashboard.html'
  }
};
