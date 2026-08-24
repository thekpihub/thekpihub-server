#!/usr/bin/env python3
"""
patch_auditor.py — Wires Anthropic Claude AI into auditor.html
Run from repo root: python3 patch_auditor.py
Uses anthropic-dangerous-allow-browser header — no backend needed.
"""

AI_SCRIPT = """
<script>
// ============================================================
//  KPI AUDITOR — CLAUDE AI ENGINE (Anthropic)
//  Direct browser call via anthropic-dangerous-allow-browser
// ============================================================

const KEY_STORAGE = 'kpihub_anthropic_key';
const getKey  = () => localStorage.getItem(KEY_STORAGE) || '';
const saveKey = k  => localStorage.setItem(KEY_STORAGE, k);

function ensureApiKey() {
  if (getKey()) return true;
  const key = prompt(
    'KPI Hub AI Engine\\n\\n' +
    'Enter your Anthropic API key to enable AI-powered audits.\\n' +
    'Get one free at: console.anthropic.com\\n\\n' +
    'Your key is saved locally in this browser only.'
  );
  if (key && key.trim().startsWith('sk-ant-')) {
    saveKey(key.trim());
    return true;
  }
  alert('Invalid key. Anthropic keys start with sk-ant-\\nGet yours at console.anthropic.com');
  return false;
}

function collectInputs() {
  const v = (...ids) => {
    for (const id of ids) {
      const el = document.getElementById(id) || document.querySelector('[name="'+id+'"]');
      if (el && el.value) return el.value;
    }
    return 'N/A';
  };
  const selects = document.querySelectorAll('select');
  return {
    stage:       selects[0]?.value || 'Bootstrapped',
    vertical:    selects[1]?.value || 'B2B SaaS',
    mrr:         v('mrr','input-mrr'),
    mrrLast:     v('mrr-last','mrr_last','mrr-last-month'),
    arr:         v('arr','input-arr'),
    nrr:         v('nrr','input-nrr'),
    churn:       v('churn','input-churn'),
    customers:   v('customers','total-customers'),
    cac:         v('cac','input-cac'),
    ltv:         v('ltv','input-ltv'),
    payback:     v('payback','cac-payback'),
    dauMau:      v('dau-mau','dau_mau','dauMau'),
    nps:         v('nps','input-nps'),
    grossMargin: v('gross-margin','gross_margin','grossMargin'),
  };
}

function buildPrompt(d) {
  return `You are a world-class SaaS KPI analyst. Audit this company's KPI health.

INPUTS:
Stage: ${d.stage} | Vertical: ${d.vertical}
MRR: ${d.mrr} | MRR Last Month: ${d.mrrLast} | ARR: ${d.arr}
NRR: ${d.nrr}% | Churn: ${d.churn}% | Customers: ${d.customers}
CAC: ${d.cac} | LTV: ${d.ltv} | Payback: ${d.payback} months
DAU/MAU: ${d.dauMau}% | NPS: ${d.nps} | Gross Margin: ${d.grossMargin}%

Reply ONLY in valid JSON (no markdown, no extra text):
{
  "health_score": <integer 0-100>,
  "health_label": "<Excellent|Healthy|At Risk|Critical>",
  "verdict": "<2 concise sentences>",
  "metrics": [
    {"name":"MRR Growth","value":"<calc or N/A>","status":"<green|yellow|red>","insight":"<1 sentence>"},
    {"name":"Monthly Churn","value":"<val>%","status":"<green|yellow|red>","insight":"<1 sentence>"},
    {"name":"LTV:CAC Ratio","value":"<calc or N/A>","status":"<green|yellow|red>","insight":"<1 sentence>"},
    {"name":"CAC Payback","value":"<val> mo","status":"<green|yellow|red>","insight":"<1 sentence>"},
    {"name":"NRR","value":"<val>%","status":"<green|yellow|red>","insight":"<1 sentence>"},
    {"name":"Gross Margin","value":"<val>%","status":"<green|yellow|red>","insight":"<1 sentence>"},
    {"name":"DAU/MAU","value":"<val>%","status":"<green|yellow|red>","insight":"<1 sentence>"},
    {"name":"NPS Score","value":"<val>","status":"<green|yellow|red>","insight":"<1 sentence>"}
  ],
  "cohort_rank": "<Top 10%|Top 25%|Median|Bottom 25%>",
  "cohort_insight": "<1 sentence vs ${d.stage} ${d.vertical} peers>",
  "top_risks": [
    {"title":"<risk>","severity":"<High|Medium|Low>","action":"<specific fix>"},
    {"title":"<risk>","severity":"<High|Medium|Low>","action":"<specific fix>"},
    {"title":"<risk>","severity":"<High|Medium|Low>","action":"<specific fix>"}
  ],
  "quick_wins": ["<win 1>","<win 2>","<win 3>"]
}`;
}

async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getKey(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      localStorage.removeItem(KEY_STORAGE);
      throw new Error('Invalid API key. Reload and try again.');
    }
    throw new Error(err.error?.message || 'API error ' + res.status);
  }
  const data = await res.json();
  return data.content[0].text;
}

function setLoading(on) {
  const btn = document.getElementById('audit-btn');
  const ld  = document.getElementById('audit-loading');
  if (btn) { btn.disabled = on; btn.style.opacity = on ? '.5' : '1';
             btn.textContent = on ? '⟳  Analysing KPIs...' : '🔍 Run Full KPI Audit'; }
  if (ld)  ld.style.display = on ? 'block' : 'none';
}

function renderResults(r) {
  const set = (id, html) => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = html; el.style.display = 'block'; }
  };

  set('audit-score', `
    <div style="text-align:center;padding:2.5rem 1rem;background:rgba(255,255,255,.03);border:1px solid rgba(233,161,35,.2);border-radius:12px;margin-bottom:1.5rem">
      <div style="font-size:5rem;font-weight:800;color:#4CAF80;font-family:'Cormorant Garamond',serif;line-height:1">${r.health_score}</div>
      <div style="font-size:.9rem;color:#E9A123;letter-spacing:.25em;text-transform:uppercase;margin:.5rem 0">KPI Health Score · ${r.health_label}</div>
      <div style="color:#EAEDF5;opacity:.7;font-size:.92rem;max-width:520px;margin:1rem auto 0;line-height:1.6">${r.verdict}</div>
    </div>`);

  set('audit-metrics', `
    <h3 style="color:#E9A123;font-size:.78rem;text-transform:uppercase;letter-spacing:.2em;margin-bottom:1rem;font-family:Syne,sans-serif">Metric Breakdown</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:.7rem">
      ${r.metrics.map(m=>`
        <div style="background:rgba(255,255,255,.04);border:1px solid rgba(233,161,35,.1);border-left:3px solid #4CAF80;border-radius:8px;padding:1rem 1.1rem">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem">
            <span style="color:#EAEDF5;font-size:.78rem;opacity:.6;text-transform:uppercase;letter-spacing:.07em">${m.name}</span>
            <span style="color:#4CAF80;font-weight:700;font-size:1rem;font-family:'Cormorant Garamond',serif">${m.value}</span>
          </div>
          <div style="color:#EAEDF5;font-size:.78rem;opacity:.5;line-height:1.45">${m.insight}</div>
        </div>`).join('')}
    </div>`);
}

async function runAudit() {
  if (!ensureApiKey()) return;
  setLoading(true);
  try {
    const raw    = await callClaude(buildPrompt(collectInputs()));
    const clean  = raw.replace(/\`\`\`json|\`\`\`/g, '').trim();
    renderResults(JSON.parse(clean));
  } catch(err) {
    alert('Error: ' + err.message);
    console.error(err);
  } finally {
    setLoading(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('button[onclick*="audit"]') || 
              [...document.querySelectorAll('button')].find(b => b.textContent.toLowerCase().includes('audit'));
  if (btn) { btn.id = 'audit-btn'; btn.onclick = null; btn.addEventListener('click', runAudit); }

  const wrap = document.querySelector('main') || document.body;
  ['audit-score','audit-metrics','audit-cohort','audit-risks','audit-wins'].forEach(id => {
    if (!document.getElementById(id)) {
      const d = Object.assign(document.createElement('div'), { id });
      d.style.cssText = 'display:none;margin-top:1.5rem';
      wrap.appendChild(d);
    }
  });
});
</script>
"""

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'kpihub_anthropic_key' in content:
        print(f"  ⏭️  {filepath} — Claude AI already present")
        return False

    if '</body>' not in content:
        print(f"  ❌ {filepath} — no </body> tag")
        return False

    content = content.replace('</body>', AI_SCRIPT + '\n</body>', 1)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✅ {filepath}")
    return True

if __name__ == '__main__':
    import os
    print("=" * 60)
    print("  KPI Hub — Claude AI Engine Patcher")
    print("  Target: auditor.html (KPI Analyzer)")
    print("=" * 60 + "\n")

    target = 'auditor.html'
    if not os.path.exists(target):
        print(f"  [ERROR] {target} not found")
    else:
        ok = patch_file(target)
        if ok:
            print("\n✅ Claude AI successfully wired into auditor.html\n")
