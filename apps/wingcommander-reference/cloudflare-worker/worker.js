/**
 * Ditto Wingman — Cloudflare Worker API Proxy
 *
 * Deploy steps:
 * 1. Go to dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Paste this entire file
 * 3. Click Deploy
 * 4. Go to Settings → Variables → Add: ANTHROPIC_API_KEY = your key
 * 5. Copy the Worker URL (e.g. https://ditto-proxy.YOUR-NAME.workers.dev)
 * 6. In all 8 weapon HTML files, replace YOUR_CLOUDFLARE_WORKER_URL_HERE
 *    with your Worker URL
 *
 * Your API key is NEVER exposed to users. All requests go through this proxy.
 */

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: cors });
    }

    if (!env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in Worker env vars' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const body = await request.text();

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body,
      });

      const data = await resp.text();
      return new Response(data, {
        status: resp.status,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
  },
};
