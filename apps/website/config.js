// config.js — Production configuration for The KPI Hub website
// This file contains public API credentials only
// NEVER commit this file — it is gitignored

const CONFIG = Object.freeze({
  supabase: Object.freeze({
    url: 'https://eeuwkislidznpgdbvvbo.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldXdraXNsaWR6bnBnZGJ2dmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTI5MTUzNTAsImV4cCI6MTk5ODQ5MTM1MH0.TkNKWGJFYmdXVkVNUkxObzdhOFV6NDJVL0phRUtqMmk'
  }),
  stripe: Object.freeze({
    publishableKey: 'pk_live_YOUR_STRIPE_PUBLISHABLE_KEY',
    prices: Object.freeze({
      starter: 'price_YOUR_STARTER_PRICE_ID',
      growth: 'price_YOUR_GROWTH_PRICE_ID',
      enterprise: 'price_YOUR_ENTERPRISE_PRICE_ID'
    })
  }),
  app: Object.freeze({
    url: 'https://thekpihub.com',
    loginUrl: '/login.html',
    upgradeUrl: '/upgrade.html',
    dashboardUrl: '/dashboard.html'
  })
});
