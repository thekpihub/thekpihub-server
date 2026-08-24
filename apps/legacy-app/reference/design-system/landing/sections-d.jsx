/* global React */
// Additional landing sections: Ticker · Metric Strip · Comparison Table · Integrations · FAQ

const { useState: useStateD, useEffect: useEffectD, useRef: useRefD } = React;

// ---------- Ticker bar ----------
function SectionTicker() {
  const items = [
    'KPI Pulse Engine™',
    'Role-Reveal Dashboards™',
    'Anomaly Root-Cause',
    'Performance DNA Score™',
    'Automated Dispatch',
    'Workflow Builder',
    'Live Production Platform',
    'Built in Delhi',
  ];
  // Duplicate for seamless loop
  const loop = [...items, ...items];
  return (
    <div className="lp-ticker" aria-hidden="true">
      <div className="lp-ticker-track">
        {loop.map((label, i) => (
          <span className="lp-ticker-item" key={i}>{label}</span>
        ))}
      </div>
    </div>
  );
}

// ---------- Metric strip (numeric proof) ----------
function SectionMetricStrip() {
  const metrics = [
    { num: '40', sup: '+', lbl: 'Data Sources Wired',     sub: 'SaaS funding · benchmarks · launches · ARR signals' },
    { num: '6',  sup: '',  lbl: 'KPI Categories Tracked', sub: 'Growth · revenue · ops · talent · product · finance' },
    { num: '<60', sup: 's', lbl: 'First Login to Context', sub: 'Role detected · dashboard composed · ready' },
    { num: '5',  sup: '',  lbl: 'AI Engine Pipeline',     sub: 'Harvest · Synthesize · Verify · Deliver · Learn' },
  ];
  return (
    <section className="lp-section lp-section-host" data-section="metrics" data-screen-label="§4½ Metric Strip">
      <div className="lp-annot">§4½ · Numeric proof · between personas and features</div>
      <div className="lp-section-inner">
        <div className="lp-metric-strip">
          {metrics.map((m, i) => (
            <div className="lp-metric" key={i}>
              <div className="lp-metric-num">
                {m.num}{m.sup && <sup>{m.sup}</sup>}
              </div>
              <div className="lp-metric-lbl">{m.lbl}</div>
              <div className="lp-metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Comparison table ----------
function SectionCompare() {
  const rows = [
    ['Role-aware dashboards on first login', 'Generic dashboard',           'Generic dashboard',         <span className="lp-compare-check">✓ Auto-built</span>],
    ['Automated narrative reports',          <span className="lp-compare-miss">—</span>, <span className="lp-compare-partial">Manual templates</span>, <span className="lp-compare-check">✓ Daily / weekly</span>],
    ['Anomaly root-cause tracing',           <span className="lp-compare-miss">—</span>, <span className="lp-compare-miss">—</span>, <span className="lp-compare-check">✓ ML-correlated</span>],
    ['Per-contributor DNA score',            <span className="lp-compare-miss">—</span>, <span className="lp-compare-miss">—</span>, <span className="lp-compare-check">✓ Living profile</span>],
    ['No-code automation triggers',          <span className="lp-compare-partial">Limited</span>, <span className="lp-compare-partial">Pro tier only</span>, <span className="lp-compare-check">✓ Every plan</span>],
    ['Setup time',                           '6–12 weeks',                  '2–6 weeks',                 <span className="lp-compare-check">Under 60 seconds</span>],
  ];
  return (
    <section className="lp-section lp-section--alt lp-section-host" data-section="compare" data-screen-label="§6½ Compare">
      <div className="lp-annot">§6½ · Compare · Adversarial · "category-creating"</div>
      <div className="lp-section-inner">
        <div className="lp-section-head">
          <div className="lp-section-head-left">
            <span className="lp-section-eyebrow">How we're different</span>
            <h2 className="lp-section-title">
              Other tools report what <em>happened.</em><br/>
              We tell you what to <em>do about it.</em>
            </h2>
          </div>
          <p className="lp-section-kicker">
            BI dashboards, OKR trackers, and analytics suites stop at the chart. The KPI Hub starts there — and runs the decision cycle for you.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="lp-compare">
            <thead>
              <tr>
                <th></th>
                <th>Legacy BI</th>
                <th>OKR Trackers</th>
                <th className="lp-compare-hub">The KPI Hub</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td>{r[2]}</td>
                  <td className="lp-compare-hub">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ---------- Integrations grid ----------
function SectionIntegrations() {
  const items = [
    { mark: 'Sf',  name: 'Salesforce' },
    { mark: 'Hb',  name: 'HubSpot' },
    { mark: 'St',  name: 'Stripe' },
    { mark: 'Sl',  name: 'Slack' },
    { mark: 'No',  name: 'Notion' },
    { mark: 'Li',  name: 'Linear' },
    { mark: 'Sn',  name: 'Snowflake' },
    { mark: 'Bq',  name: 'BigQuery' },
    { mark: 'Ga',  name: 'GA4' },
    { mark: 'Mp',  name: 'Mixpanel' },
    { mark: 'Sg',  name: 'Segment' },
    { mark: 'Gs',  name: 'Sheets' },
  ];
  return (
    <section className="lp-section lp-section-host" data-section="integrations" data-screen-label="§7½ Integrations">
      <div className="lp-annot">§7½ · Integrations · "wired in"</div>
      <div className="lp-section-inner">
        <div className="lp-section-head">
          <div className="lp-section-head-left">
            <span className="lp-section-eyebrow">40+ Sources Wired</span>
            <h2 className="lp-section-title">
              Plug into the <em>tools you already run.</em>
            </h2>
          </div>
          <p className="lp-section-kicker">
            Native connectors for the SaaS stack you actually use. CRM, billing, product analytics, BI warehouses, and the messaging surfaces your team lives in.
          </p>
        </div>

        <div className="lp-integrations">
          {items.map((it) => (
            <div className="lp-integration" key={it.name}>
              <div className="lp-integration-mark">{it.mark}</div>
              <div className="lp-integration-name">{it.name}</div>
            </div>
          ))}
        </div>
        <div className="lp-integrations-more">
          + <strong>28 more</strong> · custom REST · webhooks · SQL warehouse direct
        </div>
      </div>
    </section>
  );
}

// ---------- FAQ ----------
function FaqItem({ q, a, expanded, onToggle }) {
  const aRef = useRefD(null);
  return (
    <div className="lp-faq-item" aria-expanded={expanded ? 'true' : 'false'}>
      <button className="lp-faq-q" onClick={onToggle} aria-expanded={expanded}>
        <span>{q}</span>
        <span className="lp-faq-icon" aria-hidden="true">+</span>
      </button>
      <div className="lp-faq-a" ref={aRef}>
        {Array.isArray(a) ? a.map((p, i) => <p key={i}>{p}</p>) : <p>{a}</p>}
      </div>
    </div>
  );
}

function SectionFaq() {
  const [open, setOpen] = useStateD(0);
  const faqs = [
    {
      q: 'How is this different from a BI tool like Looker or Tableau?',
      a: 'BI tools answer "what happened." The KPI Hub answers "what should we do, and who needs to know." Every dashboard is role-built on first login, every anomaly is traced to its likely cause, and every weekly report writes itself. You don\'t build dashboards — the platform builds them around you.',
    },
    {
      q: 'Do I need an analyst to set this up?',
      a: 'No. Register, select your role, and the platform composes your intelligence environment in under 60 seconds. Connect your data sources from a curated list of 40+ integrations or push targets manually. There is no implementation phase.',
    },
    {
      q: 'What does the AI actually do?',
      a: [
        'A 5-engine pipeline runs daily: Harvest pulls signals from your stack and external sources, Synthesize correlates them, Verify checks each claim against grounded data, Deliver routes the output to the right role, and Learn improves the next pass.',
        'Concretely: anomaly detection on every KPI, root-cause tracing across correlated metrics, and ready-to-send executive summaries — all without prompting.',
      ],
    },
    {
      q: 'How is my data handled?',
      a: 'Your KPI data stays in your warehouse — we hold the orchestration layer, not the raw rows. SOC 2 controls in motion · GDPR-compliant by design · SSO and audit logs available on Enterprise.',
    },
    {
      q: 'Can I customize KPIs and reports?',
      a: 'Yes. The Analyst dashboard ships with a formula builder for custom KPIs, and the Workflow Builder turns any threshold into a multi-step action — alerts, tasks, dispatches. Both are no-code.',
    },
    {
      q: 'Is there a free trial?',
      a: 'Starter is free forever for small teams. Growth includes a 14-day full-feature trial with no credit card. Enterprise pilots run 30 days with a dedicated intelligence architect.',
    },
  ];
  return (
    <section className="lp-section lp-section-host" data-section="faq" data-screen-label="§8½ FAQ">
      <div className="lp-annot">§8½ · FAQ · Objection-handling · single-open accordion</div>
      <div className="lp-section-inner">
        <div className="lp-section-head">
          <div className="lp-section-head-left">
            <span className="lp-section-eyebrow">Questions, answered</span>
            <h2 className="lp-section-title">
              The things <em>everyone asks</em> first.
            </h2>
          </div>
          <p className="lp-section-kicker">
            If you've evaluated SaaS analytics before, you've seen the marketing noise. These are the answers without it.
          </p>
        </div>

        <div className="lp-faq">
          {faqs.map((f, i) => (
            <FaqItem
              key={i}
              q={f.q}
              a={f.a}
              expanded={open === i}
              onToggle={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { SectionTicker, SectionMetricStrip, SectionCompare, SectionIntegrations, SectionFaq });
