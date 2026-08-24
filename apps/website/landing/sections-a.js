/* global React */
// Section 2: Problem   ·   Section 3: Platform intro   ·   Section 4: Persona tabs w/ dashboards

// ---------- Section 2: Problem ----------
function SectionProblem() {
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section--alt lp-section-host",
    "data-section": "problem",
    "data-screen-label": "\xA72 Problem"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA72 \xB7 Problem \xB7 Agitate \xB7 no fluff, no buttons"), /*#__PURE__*/React.createElement("div", {
    className: "lp-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto max-w-3xl text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-eyebrow"
  }, "Why The KPI Hub Exists"), /*#__PURE__*/React.createElement("h2", {
    className: "lp-h2 mt-4"
  }, "Every business is drowning in data.", /*#__PURE__*/React.createElement("br", null), "Almost none of it is ", /*#__PURE__*/React.createElement("em", null, "actionable.")), /*#__PURE__*/React.createElement("div", {
    className: "mt-10 space-y-3 text-lg leading-relaxed text-ink-2"
  }, /*#__PURE__*/React.createElement("p", null, "Your executives are waiting on reports that take days to compile."), /*#__PURE__*/React.createElement("p", null, "Your managers are chasing updates across five tools and three spreadsheets."), /*#__PURE__*/React.createElement("p", null, "Your employees don't know where they actually stand until review day."), /*#__PURE__*/React.createElement("p", null, "Your analysts are building dashboards nobody reads."), /*#__PURE__*/React.createElement("p", {
    className: "pt-3 text-ink"
  }, "The data exists. The problem is it was never connected, never intelligent, and never built around the people who need it most.")), /*#__PURE__*/React.createElement("span", {
    className: "mt-8 inline-block font-display text-2xl italic text-gold"
  }, "That ends here."))));
}

// ---------- Section 3: Platform intro ----------
function SectionPlatform() {
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section-host",
    "data-section": "platform",
    "data-screen-label": "\xA73 Platform"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA73 \xB7 Platform intro \xB7 Category definition"), /*#__PURE__*/React.createElement("div", {
    className: "lp-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-platform-text"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-eyebrow"
  }, "What Is TheKPIHub"), /*#__PURE__*/React.createElement("h2", {
    className: "lp-h2 mt-4"
  }, "One Platform. Four ", /*#__PURE__*/React.createElement("em", null, "Intelligent"), " Worlds.", /*#__PURE__*/React.createElement("br", null), "Built for ", /*#__PURE__*/React.createElement("em", null, "every role"), " in your organization."), /*#__PURE__*/React.createElement("p", {
    className: "lp-lead mt-6"
  }, "TheKPIHub is not a reporting tool. It's not a BI dashboard. It's not another analytics add-on."), /*#__PURE__*/React.createElement("p", {
    className: "lp-lead mt-4"
  }, "It is a live, automated SaaS intelligence platform that knows who you are the moment you log in \u2014 and builds your entire performance universe around you. Whether you're running the company, managing a team, hitting your own targets, or engineering the data layer \u2014 TheKPIHub speaks your language, surfaces your metrics, and automates the intelligence work you've been doing manually for years."), /*#__PURE__*/React.createElement("span", {
    className: "mt-6 inline-block font-head text-sm uppercase tracking-wide text-gold/90"
  }, "\u2726 Register once \xB7 Log in \xB7 Your world is already waiting")), /*#__PURE__*/React.createElement("div", {
    className: "lp-platform-visual"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-orbit"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-orbit-ring lp-orbit-ring--2"
  }), /*#__PURE__*/React.createElement("div", {
    className: "lp-orbit-ring lp-orbit-ring--1"
  }), /*#__PURE__*/React.createElement("div", {
    className: "lp-orbit-core"
  }, "The", /*#__PURE__*/React.createElement("br", null), "KPI", /*#__PURE__*/React.createElement("br", null), "Hub"), /*#__PURE__*/React.createElement("div", {
    className: "lp-orbit-node lp-orbit-node--n"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-orbit-dot"
  }), "Executive"), /*#__PURE__*/React.createElement("div", {
    className: "lp-orbit-node lp-orbit-node--e"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-orbit-dot"
  }), "Manager"), /*#__PURE__*/React.createElement("div", {
    className: "lp-orbit-node lp-orbit-node--s"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-orbit-dot"
  }), "Contributor"), /*#__PURE__*/React.createElement("div", {
    className: "lp-orbit-node lp-orbit-node--w"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-orbit-dot"
  }), "Analyst"))))));
}

// ---------- Section 4: Persona dashboard mockups ----------

function Sparkline({
  points,
  stroke = 'var(--gold)'
}) {
  // points: array of y-values 0..1; returns an SVG sparkline
  const W = 220,
    H = 36;
  const step = W / (points.length - 1);
  const path = points.map((v, i) => {
    const x = i * step;
    const y = H - v * H;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const area = `${path} L${W},${H} L0,${H} Z`;
  return /*#__PURE__*/React.createElement("svg", {
    className: "lp-spark",
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "none"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "lp-spark-grad",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: stroke,
    stopOpacity: "0.35"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: stroke,
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("path", {
    className: "lp-spark-area",
    d: area,
    fill: "url(#lp-spark-grad)"
  }), /*#__PURE__*/React.createElement("path", {
    className: "lp-spark-line",
    d: path,
    stroke: stroke
  }));
}
function ExecutiveDash() {
  return /*#__PURE__*/React.createElement("div", {
    className: "lp-dash"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-chrome"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-dash-chrome-title"
  }, "Executive \xB7 Health Score"), /*#__PURE__*/React.createElement("span", {
    className: "lp-dash-chrome-status"
  }, "Live")), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-row lp-dash-row--3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-lbl"
  }, "Health"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-val lp-dash-kpi-val--gold"
  }, "92"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-delta lp-dash-kpi-delta--up"
  }, "\u2191 4 this wk")), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-lbl"
  }, "MRR"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-val"
  }, "$847K"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-delta lp-dash-kpi-delta--up"
  }, "\u2191 12.4%")), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-lbl"
  }, "Burn"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-val"
  }, "$214K"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-delta lp-dash-kpi-delta--up"
  }, "\u2193 8.1%"))), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi",
    style: {
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-lbl"
  }, "Revenue \u2014 30 day"), /*#__PURE__*/React.createElement(Sparkline, {
    points: [0.25, 0.32, 0.28, 0.42, 0.48, 0.55, 0.51, 0.62, 0.68, 0.74, 0.72, 0.81]
  })), /*#__PURE__*/React.createElement("div", {
    className: "lp-alert"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-alert-icon"
  }, "!"), /*#__PURE__*/React.createElement("span", {
    className: "lp-alert-txt"
  }, /*#__PURE__*/React.createElement("strong", null, "AI-Prioritized Alert."), " Sales pipeline coverage dropped 22% in APAC \u2014 3 likely causes surfaced.")), /*#__PURE__*/React.createElement("div", {
    className: "lp-alert lp-alert--ok"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-alert-icon"
  }, "\u2713"), /*#__PURE__*/React.createElement("span", {
    className: "lp-alert-txt"
  }, /*#__PURE__*/React.createElement("strong", null, "Board pack ready."), " Auto-compiled from 14 KPIs. One-click dispatch.")));
}
function ManagerDash() {
  const team = [{
    name: 'Priya M.',
    pct: 94,
    val: '142%'
  }, {
    name: 'Adit R.',
    pct: 88,
    val: '118%'
  }, {
    name: 'Nora K.',
    pct: 72,
    val: '96%'
  }, {
    name: 'Ben O.',
    pct: 61,
    val: '81%'
  }, {
    name: 'Wei L.',
    pct: 42,
    val: '54%'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "lp-dash"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-chrome"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-dash-chrome-title"
  }, "Manager \xB7 Team Performance"), /*#__PURE__*/React.createElement("span", {
    className: "lp-dash-chrome-status"
  }, "Live")), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-row lp-dash-row--3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-lbl"
  }, "Team Avg"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-val lp-dash-kpi-val--gold"
  }, "104%"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-delta lp-dash-kpi-delta--up"
  }, "\u2191 11 pts")), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-lbl"
  }, "Sprint"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-val"
  }, "7 / 9"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-delta"
  }, "2 at risk")), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-lbl"
  }, "Quota"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-val lp-dash-kpi-val--teal"
  }, "83%"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-delta lp-dash-kpi-delta--up"
  }, "on track"))), /*#__PURE__*/React.createElement("div", {
    className: "lp-lb"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-lb-head"
  }, /*#__PURE__*/React.createElement("span", null, "Leaderboard \xB7 Q2"), /*#__PURE__*/React.createElement("span", null, "Attainment")), team.map((t, i) => /*#__PURE__*/React.createElement("div", {
    className: "lp-lb-row",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-lb-rank"
  }, String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("span", {
    className: "lp-lb-name"
  }, t.name), /*#__PURE__*/React.createElement("span", {
    className: "lp-lb-bar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-lb-bar-fill",
    style: {
      width: `${t.pct}%`
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "lp-lb-val"
  }, t.val)))), /*#__PURE__*/React.createElement("div", {
    className: "lp-alert"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-alert-icon"
  }, "!"), /*#__PURE__*/React.createElement("span", {
    className: "lp-alert-txt"
  }, /*#__PURE__*/React.createElement("strong", null, "Underperformance alert."), " Wei L. \xB7 3 weeks below target. Auto-drafted 1-on-1 agenda ready.")));
}
function ContributorDash() {
  return /*#__PURE__*/React.createElement("div", {
    className: "lp-dash"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-chrome"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-dash-chrome-title"
  }, "Contributor \xB7 Priya M."), /*#__PURE__*/React.createElement("span", {
    className: "lp-dash-chrome-status"
  }, "Updated 2m ago")), /*#__PURE__*/React.createElement("div", {
    className: "lp-ring-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-ring"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "82",
    height: "82",
    viewBox: "0 0 82 82",
    style: {
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    className: "lp-ring-track",
    cx: "41",
    cy: "41",
    r: "34"
  }), /*#__PURE__*/React.createElement("circle", {
    className: "lp-ring-fill",
    cx: "41",
    cy: "41",
    r: "34",
    strokeDasharray: `${0.94 * 2 * Math.PI * 34} ${2 * Math.PI * 34}`
  })), /*#__PURE__*/React.createElement("div", {
    className: "lp-ring-num"
  }, "94")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-ring-meta-lbl"
  }, "Attainment"), /*#__PURE__*/React.createElement("div", {
    className: "lp-ring-meta-val"
  }, "142%"), /*#__PURE__*/React.createElement("div", {
    className: "lp-ring-meta-sub"
  }, "\u2191 #2 of 48 \xB7 top 5% peer group"))), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-row lp-dash-row--2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-lbl"
  }, "Calls"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-val"
  }, "47"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-delta lp-dash-kpi-delta--up"
  }, "\u2191 12% vs peer avg")), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-lbl"
  }, "Pipeline"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-val lp-dash-kpi-val--gold"
  }, "$312K"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-delta lp-dash-kpi-delta--up"
  }, "\u2191 18%"))), /*#__PURE__*/React.createElement("div", {
    className: "lp-alert lp-alert--ok"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-alert-icon"
  }, "\u2605"), /*#__PURE__*/React.createElement("span", {
    className: "lp-alert-txt"
  }, /*#__PURE__*/React.createElement("strong", null, "Milestone hit."), " 140% quota \u2014 personal best. Celebrate; your manager has been notified.")));
}
function AnalystDash() {
  return /*#__PURE__*/React.createElement("div", {
    className: "lp-dash"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-chrome"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-dash-chrome-title"
  }, "Analyst \xB7 Intelligence Pipeline"), /*#__PURE__*/React.createElement("span", {
    className: "lp-dash-chrome-status"
  }, "Running")), /*#__PURE__*/React.createElement("div", {
    className: "lp-pipe"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "lp-pipe-tag"
  }, "def"), " kpi ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--text)'
    }
  }, "pipeline_velocity"), " ="), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: 14
    }
  }, "(opps_created \xD7 win_rate) / avg_cycle_days")), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-row lp-dash-row--2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-lbl"
  }, "Formula"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-val"
  }, "17"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-delta"
  }, "custom KPIs")), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-lbl"
  }, "Sources"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-val"
  }, "6"), /*#__PURE__*/React.createElement("div", {
    className: "lp-dash-kpi-delta lp-dash-kpi-delta--up"
  }, "all synced"))), /*#__PURE__*/React.createElement("div", {
    className: "lp-pipe"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "lp-pipe-tag"
  }, "anomaly"), " MRR_cohort_3:\xA0", /*#__PURE__*/React.createElement("span", {
    className: "lp-pipe-ok"
  }, "flagged"), " \xB7 \u03C3 2.8"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-3)',
      marginTop: 2
    }
  }, "root cause candidates: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--gold)'
    }
  }, "coupon_expiry (0.71)"), ", ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--gold)'
    }
  }, "onboarding_drop (0.54)"))), /*#__PURE__*/React.createElement("div", {
    className: "lp-pipe"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "lp-pipe-tag"
  }, "pipeline"), " daily_intel_dispatch"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-3)',
      marginTop: 2
    }
  }, "harvest \u25B8 synthesize \u25B8 verify \u25B8 ", /*#__PURE__*/React.createElement("span", {
    className: "lp-pipe-ok"
  }, "delivered \xB7 09:00 IST"))));
}
const PERSONAS = [{
  key: 'exec',
  num: '01',
  title: 'The Executive',
  tabFor: 'Founders · CEOs · Owners',
  forLabel: 'For Founders, CEOs & Business Owners',
  headline: /*#__PURE__*/React.createElement(React.Fragment, null, "Your company, on ", /*#__PURE__*/React.createElement("em", null, "one screen.")),
  body: 'See the entire business in one screen. AI-prioritized alerts. Automated board-ready reports. From macro health score to micro root cause — in a single click.',
  link: 'See Executive Dashboard',
  href: 'dashboard.html',
  Dash: ExecutiveDash
}, {
  key: 'mgr',
  num: '02',
  title: 'The Manager',
  tabFor: 'Team Leads · Ops Directors',
  forLabel: 'For Team Leads, Department Heads & Operations Directors',
  headline: /*#__PURE__*/React.createElement(React.Fragment, null, "Run every ", /*#__PURE__*/React.createElement("em", null, "1-on-1"), " from one panel."),
  body: 'Real-time team KPI leaderboards. Automated underperformance alerts. Sprint tracking. Run every 1-on-1 review from a single intelligent panel.',
  link: 'See Manager Dashboard',
  href: 'dashboard.html',
  Dash: ManagerDash
}, {
  key: 'contrib',
  num: '03',
  title: 'The Contributor',
  tabFor: 'Employees · Sales · Analysts',
  forLabel: 'For Employees, Sales Reps, Analysts & Individual Performers',
  headline: /*#__PURE__*/React.createElement(React.Fragment, null, "Know where you stand \u2014 ", /*#__PURE__*/React.createElement("em", null, "before anyone tells you.")),
  body: 'Your personal KPI scorecard. Daily progress. Peer benchmarking. Milestone celebrations. Know exactly where you stand — before anyone tells you.',
  link: 'See Contributor Dashboard',
  href: 'dashboard.html',
  Dash: ContributorDash
}, {
  key: 'anal',
  num: '04',
  title: 'The Analyst',
  tabFor: 'BI · Data Ops · Strategy',
  forLabel: 'For BI Professionals, Data Ops & Strategy Consultants',
  headline: /*#__PURE__*/React.createElement(React.Fragment, null, "The most powerful ", /*#__PURE__*/React.createElement("em", null, "analytical layer"), " ever shipped in a KPI tool."),
  body: 'Custom KPI formula builders. Multi-source data import. Anomaly detection. Automated intelligence pipelines. The most powerful analytical layer ever built into a KPI platform.',
  link: 'See Analyst Dashboard',
  href: 'dashboard.html',
  Dash: AnalystDash
}];
function SectionPersonas() {
  const [active, setActive] = React.useState(0);
  const P = PERSONAS[active];
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section--alt lp-section-host",
    "data-section": "personas",
    "data-screen-label": "\xA74 Personas"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA74 \xB7 4 personas \xB7 Tabbed \xB7 Live dashboard preview"), /*#__PURE__*/React.createElement("div", {
    className: "lp-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid gap-6 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-end"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "lp-eyebrow"
  }, "Built for every layer"), /*#__PURE__*/React.createElement("h2", {
    className: "lp-h2 mt-4"
  }, "Your role. Your ", /*#__PURE__*/React.createElement("em", null, "dashboard."), /*#__PURE__*/React.createElement("br", null), "Your intelligence.")), /*#__PURE__*/React.createElement("p", {
    className: "lp-lead"
  }, "The platform reads your role, your team, your targets \u2014 and constructs your intelligence environment automatically. First login to full context in under 60 seconds.")), /*#__PURE__*/React.createElement("div", {
    className: "lp-persona-tabs",
    role: "tablist"
  }, PERSONAS.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: p.key,
    className: "lp-persona-tab",
    role: "tab",
    "aria-selected": active === i,
    onClick: () => setActive(i)
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-persona-tab-num"
  }, p.num), /*#__PURE__*/React.createElement("span", {
    className: "lp-persona-tab-title"
  }, p.title), /*#__PURE__*/React.createElement("span", {
    className: "lp-persona-tab-for"
  }, p.tabFor)))), /*#__PURE__*/React.createElement("div", {
    className: "lp-persona-body mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-persona-copy"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-head text-xs font-semibold uppercase tracking-[0.16em] text-ink-3"
  }, P.forLabel), /*#__PURE__*/React.createElement("h3", {
    className: "mt-3 font-display text-2xl font-bold leading-tight text-ink sm:text-3xl [&_em]:italic [&_em]:text-gold"
  }, P.headline), /*#__PURE__*/React.createElement("p", {
    className: "mt-4 text-lg leading-relaxed text-ink-2"
  }, P.body), /*#__PURE__*/React.createElement("a", {
    className: "mt-6 inline-flex items-center gap-1.5 font-head font-semibold text-gold transition-colors hover:text-gold/80",
    href: P.href
  }, P.link, " \u2192")), /*#__PURE__*/React.createElement(P.Dash, null))));
}
Object.assign(window, {
  SectionProblem,
  SectionPlatform,
  SectionPersonas,
  Sparkline
});