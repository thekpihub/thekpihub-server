/* global React */
// Additional landing sections: Ticker · Metric Strip · Comparison Table · Integrations · FAQ

const {
  useState: useStateD,
  useEffect: useEffectD,
  useRef: useRefD
} = React;

// ---------- Ticker bar ----------
function SectionTicker() {
  const items = ['KPI Pulse Engine™', 'Role-Reveal Dashboards™', 'Anomaly Root-Cause', 'Performance DNA Score™', 'Automated Dispatch', 'Workflow Builder', 'Live Production Platform', 'Built in Delhi'];
  // Duplicate for seamless loop
  const loop = [...items, ...items];
  return /*#__PURE__*/React.createElement("div", {
    className: "lp-ticker",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-ticker-track"
  }, loop.map((label, i) => /*#__PURE__*/React.createElement("span", {
    className: "lp-ticker-item",
    key: i
  }, label))));
}

// ---------- Metric strip (numeric proof) ----------
function SectionMetricStrip() {
  const metrics = [{
    num: '40',
    sup: '+',
    lbl: 'Data Sources Wired',
    sub: 'SaaS funding · benchmarks · launches · ARR signals'
  }, {
    num: '6',
    sup: '',
    lbl: 'KPI Categories Tracked',
    sub: 'Growth · revenue · ops · talent · product · finance'
  }, {
    num: '<60',
    sup: 's',
    lbl: 'First Login to Context',
    sub: 'Role detected · dashboard composed · ready'
  }, {
    num: '5',
    sup: '',
    lbl: 'AI Engine Pipeline',
    sub: 'Harvest · Synthesize · Verify · Deliver · Learn'
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section-host",
    "data-section": "metrics",
    "data-screen-label": "\xA74\xBD Metric Strip"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA74\xBD \xB7 Numeric proof \xB7 between personas and features"), /*#__PURE__*/React.createElement("div", {
    className: "lp-section-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-metric-strip"
  }, metrics.map((m, i) => /*#__PURE__*/React.createElement("div", {
    className: "lp-metric",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-metric-num"
  }, m.num, m.sup && /*#__PURE__*/React.createElement("sup", null, m.sup)), /*#__PURE__*/React.createElement("div", {
    className: "lp-metric-lbl"
  }, m.lbl), /*#__PURE__*/React.createElement("div", {
    className: "lp-metric-sub"
  }, m.sub))))));
}

// ---------- Comparison table ----------
function SectionCompare() {
  const rows = [['Role-aware dashboards on first login', 'Generic dashboard', 'Generic dashboard', /*#__PURE__*/React.createElement("span", {
    className: "lp-compare-check"
  }, "\u2713 Auto-built")], ['Automated narrative reports', /*#__PURE__*/React.createElement("span", {
    className: "lp-compare-miss"
  }, "\u2014"), /*#__PURE__*/React.createElement("span", {
    className: "lp-compare-partial"
  }, "Manual templates"), /*#__PURE__*/React.createElement("span", {
    className: "lp-compare-check"
  }, "\u2713 Daily / weekly")], ['Anomaly root-cause tracing', /*#__PURE__*/React.createElement("span", {
    className: "lp-compare-miss"
  }, "\u2014"), /*#__PURE__*/React.createElement("span", {
    className: "lp-compare-miss"
  }, "\u2014"), /*#__PURE__*/React.createElement("span", {
    className: "lp-compare-check"
  }, "\u2713 ML-correlated")], ['Per-contributor DNA score', /*#__PURE__*/React.createElement("span", {
    className: "lp-compare-miss"
  }, "\u2014"), /*#__PURE__*/React.createElement("span", {
    className: "lp-compare-miss"
  }, "\u2014"), /*#__PURE__*/React.createElement("span", {
    className: "lp-compare-check"
  }, "\u2713 Living profile")], ['No-code automation triggers', /*#__PURE__*/React.createElement("span", {
    className: "lp-compare-partial"
  }, "Limited"), /*#__PURE__*/React.createElement("span", {
    className: "lp-compare-partial"
  }, "Pro tier only"), /*#__PURE__*/React.createElement("span", {
    className: "lp-compare-check"
  }, "\u2713 Every plan")], ['Setup time', '6–12 weeks', '2–6 weeks', /*#__PURE__*/React.createElement("span", {
    className: "lp-compare-check"
  }, "Under 60 seconds")]];
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section--alt lp-section-host",
    "data-section": "compare",
    "data-screen-label": "\xA76\xBD Compare"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA76\xBD \xB7 Compare \xB7 Adversarial \xB7 \"category-creating\""), /*#__PURE__*/React.createElement("div", {
    className: "lp-section-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-section-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-section-head-left"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-section-eyebrow"
  }, "How we're different"), /*#__PURE__*/React.createElement("h2", {
    className: "lp-section-title"
  }, "Other tools report what ", /*#__PURE__*/React.createElement("em", null, "happened."), /*#__PURE__*/React.createElement("br", null), "We tell you what to ", /*#__PURE__*/React.createElement("em", null, "do about it."))), /*#__PURE__*/React.createElement("p", {
    className: "lp-section-kicker"
  }, "BI dashboards, OKR trackers, and analytics suites stop at the chart. The KPI Hub starts there \u2014 and runs the decision cycle for you.")), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "lp-compare"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null), /*#__PURE__*/React.createElement("th", null, "Legacy BI"), /*#__PURE__*/React.createElement("th", null, "OKR Trackers"), /*#__PURE__*/React.createElement("th", {
    className: "lp-compare-hub"
  }, "The KPI Hub"))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", null, r[0]), /*#__PURE__*/React.createElement("td", null, r[1]), /*#__PURE__*/React.createElement("td", null, r[2]), /*#__PURE__*/React.createElement("td", {
    className: "lp-compare-hub"
  }, r[3]))))))));
}

// ---------- Integrations grid ----------
function SectionIntegrations() {
  const items = [{
    mark: 'Sf',
    name: 'Salesforce'
  }, {
    mark: 'Hb',
    name: 'HubSpot'
  }, {
    mark: 'St',
    name: 'Stripe'
  }, {
    mark: 'Sl',
    name: 'Slack'
  }, {
    mark: 'No',
    name: 'Notion'
  }, {
    mark: 'Li',
    name: 'Linear'
  }, {
    mark: 'Sn',
    name: 'Snowflake'
  }, {
    mark: 'Bq',
    name: 'BigQuery'
  }, {
    mark: 'Ga',
    name: 'GA4'
  }, {
    mark: 'Mp',
    name: 'Mixpanel'
  }, {
    mark: 'Sg',
    name: 'Segment'
  }, {
    mark: 'Gs',
    name: 'Sheets'
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section-host",
    "data-section": "integrations",
    "data-screen-label": "\xA77\xBD Integrations"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA77\xBD \xB7 Integrations \xB7 \"wired in\""), /*#__PURE__*/React.createElement("div", {
    className: "lp-section-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-section-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-section-head-left"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-section-eyebrow"
  }, "40+ Sources Wired"), /*#__PURE__*/React.createElement("h2", {
    className: "lp-section-title"
  }, "Plug into the ", /*#__PURE__*/React.createElement("em", null, "tools you already run."))), /*#__PURE__*/React.createElement("p", {
    className: "lp-section-kicker"
  }, "Native connectors for the SaaS stack you actually use. CRM, billing, product analytics, BI warehouses, and the messaging surfaces your team lives in.")), /*#__PURE__*/React.createElement("div", {
    className: "lp-integrations"
  }, items.map(it => /*#__PURE__*/React.createElement("div", {
    className: "lp-integration",
    key: it.name
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-integration-mark"
  }, it.mark), /*#__PURE__*/React.createElement("div", {
    className: "lp-integration-name"
  }, it.name)))), /*#__PURE__*/React.createElement("div", {
    className: "lp-integrations-more"
  }, "+ ", /*#__PURE__*/React.createElement("strong", null, "28 more"), " \xB7 custom REST \xB7 webhooks \xB7 SQL warehouse direct")));
}

// ---------- FAQ ----------
function FaqItem({
  q,
  a,
  expanded,
  onToggle
}) {
  const aRef = useRefD(null);
  return /*#__PURE__*/React.createElement("div", {
    className: "lp-faq-item",
    "aria-expanded": expanded ? 'true' : 'false'
  }, /*#__PURE__*/React.createElement("button", {
    className: "lp-faq-q",
    onClick: onToggle,
    "aria-expanded": expanded
  }, /*#__PURE__*/React.createElement("span", null, q), /*#__PURE__*/React.createElement("span", {
    className: "lp-faq-icon",
    "aria-hidden": "true"
  }, "+")), /*#__PURE__*/React.createElement("div", {
    className: "lp-faq-a",
    ref: aRef
  }, Array.isArray(a) ? a.map((p, i) => /*#__PURE__*/React.createElement("p", {
    key: i
  }, p)) : /*#__PURE__*/React.createElement("p", null, a)));
}
function SectionFaq() {
  const [open, setOpen] = useStateD(0);
  const faqs = [{
    q: 'How is this different from a BI tool like Looker or Tableau?',
    a: 'BI tools answer "what happened." The KPI Hub answers "what should we do, and who needs to know." Every dashboard is role-built on first login, every anomaly is traced to its likely cause, and every weekly report writes itself. You don\'t build dashboards — the platform builds them around you.'
  }, {
    q: 'Do I need an analyst to set this up?',
    a: 'No. Register, select your role, and the platform composes your intelligence environment in under 60 seconds. Connect your data sources from a curated list of 40+ integrations or push targets manually. There is no implementation phase.'
  }, {
    q: 'What does the AI actually do?',
    a: ['A 5-engine pipeline runs daily: Harvest pulls signals from your stack and external sources, Synthesize correlates them, Verify checks each claim against grounded data, Deliver routes the output to the right role, and Learn improves the next pass.', 'Concretely: anomaly detection on every KPI, root-cause tracing across correlated metrics, and ready-to-send executive summaries — all without prompting.']
  }, {
    q: 'How is my data handled?',
    a: 'Your KPI data stays in your warehouse — we hold the orchestration layer, not the raw rows. SOC 2 controls in motion · GDPR-compliant by design · SSO and audit logs available on Enterprise.'
  }, {
    q: 'Can I customize KPIs and reports?',
    a: 'Yes. The Analyst dashboard ships with a formula builder for custom KPIs, and the Workflow Builder turns any threshold into a multi-step action — alerts, tasks, dispatches. Both are no-code.'
  }, {
    q: 'Is there a free trial?',
    a: 'No trial on the Growth subscription (₹5,999/mo, live now) — but the ₹2,999 KPI Audit is one-time, delivered in 48 hours, and covered by the guarantee: if you don’t find at least one fix worth more than the fee, I’ll refund it. A great low-risk way to try things out before subscribing to Growth.'
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section-host",
    "data-section": "faq",
    "data-screen-label": "\xA78\xBD FAQ"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA78\xBD \xB7 FAQ \xB7 Objection-handling \xB7 single-open accordion"), /*#__PURE__*/React.createElement("div", {
    className: "lp-section-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-section-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-section-head-left"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-section-eyebrow"
  }, "Questions, answered"), /*#__PURE__*/React.createElement("h2", {
    className: "lp-section-title"
  }, "The things ", /*#__PURE__*/React.createElement("em", null, "everyone asks"), " first.")), /*#__PURE__*/React.createElement("p", {
    className: "lp-section-kicker"
  }, "If you've evaluated SaaS analytics before, you've seen the marketing noise. These are the answers without it.")), /*#__PURE__*/React.createElement("div", {
    className: "lp-faq"
  }, faqs.map((f, i) => /*#__PURE__*/React.createElement(FaqItem, {
    key: i,
    q: f.q,
    a: f.a,
    expanded: open === i,
    onToggle: () => setOpen(open === i ? -1 : i)
  })))));
}
Object.assign(window, {
  SectionTicker,
  SectionMetricStrip,
  SectionCompare,
  SectionIntegrations,
  SectionFaq
});