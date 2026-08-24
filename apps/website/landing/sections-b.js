/* global React */
// Section 5: 6 feature blocks (alternating) · Section 6: Social proof

const {
  useEffect: useEffectFB,
  useState: useStateFB
} = React;

// ---------- Feature mock visualisations ----------

function PulseMock() {
  const [t, setT] = useStateFB(0);
  useEffectFB(() => {
    let raf;
    const start = performance.now();
    const tick = n => {
      setT(n - start);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const W = 360,
    H = 140,
    seg = 60;
  const pts = [];
  for (let k = 0; k <= seg; k++) {
    const x = k / seg * W;
    const y = H / 2 + Math.sin(x * 0.04 + t * 0.003) * 22 + Math.sin(x * 0.015 + t * 0.0014) * 12;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const dotK = Math.sin(t * 0.0009) * 0.5 + 0.5;
  const dotX = Math.round(dotK * W * 100) / 100;
  const dotY = Math.round((H / 2 + Math.sin(dotX * 0.04 + t * 0.003) * 22 + Math.sin(dotX * 0.015 + t * 0.0014) * 12) * 100) / 100;
  return /*#__PURE__*/React.createElement("div", {
    className: "lp-mock"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-pulse-mock-bg"
  }), /*#__PURE__*/React.createElement("div", {
    className: "lp-mock-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-mock-title"
  }, "KPI Pulse Engine"), /*#__PURE__*/React.createElement("span", {
    className: "lp-mock-status"
  }, "\u25CF live \xB7 4.2 Hz")), /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "none",
    style: {
      width: '100%',
      height: 140,
      position: 'relative',
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("polyline", {
    className: "lp-pulse-mock-line",
    points: pts.join(' ')
  }), /*#__PURE__*/React.createElement("circle", {
    className: "lp-pulse-mock-dot",
    cx: dotX,
    cy: dotY,
    r: "4"
  })), /*#__PURE__*/React.createElement("div", {
    className: "lp-pulse-mock-rows"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-pulse-mini"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-pulse-mini-lbl"
  }, "MRR"), /*#__PURE__*/React.createElement("div", {
    className: "lp-pulse-mini-val lp-pulse-mini-val--up"
  }, "\u2191 12.4%")), /*#__PURE__*/React.createElement("div", {
    className: "lp-pulse-mini"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-pulse-mini-lbl"
  }, "NRR"), /*#__PURE__*/React.createElement("div", {
    className: "lp-pulse-mini-val lp-pulse-mini-val--up"
  }, "\u2191 3.1pp")), /*#__PURE__*/React.createElement("div", {
    className: "lp-pulse-mini"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-pulse-mini-lbl"
  }, "Churn"), /*#__PURE__*/React.createElement("div", {
    className: "lp-pulse-mini-val lp-pulse-mini-val--down"
  }, "\u2191 0.4pp"))));
}
function RoleRevealMock() {
  const roles = ['Executive', 'Manager', 'Contributor', 'Analyst'];
  const [active, setActive] = useStateFB(2);
  useEffectFB(() => {
    const id = setInterval(() => setActive(a => (a + 1) % 4), 1800);
    return () => clearInterval(id);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "lp-mock"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-mock-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-mock-title"
  }, "Reading session \xB7 Priya M."), /*#__PURE__*/React.createElement("span", {
    className: "lp-mock-status"
  }, "\u25CF matching role")), /*#__PURE__*/React.createElement("div", {
    className: "lp-reveal-stack"
  }, roles.map((r, i) => {
    const isActive = i === active;
    const offset = i * 56;
    return /*#__PURE__*/React.createElement("div", {
      key: r,
      className: `lp-reveal-card ${isActive ? 'lp-reveal-card--active' : ''}`,
      style: {
        top: offset,
        transform: isActive ? 'scale(1.02)' : `scale(${0.98 - Math.abs(i - active) * 0.015})`,
        opacity: isActive ? 1 : 0.55,
        zIndex: isActive ? 2 : 1
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "lp-reveal-role"
    }, "Candidate \xB7 Dashboard"), /*#__PURE__*/React.createElement("div", {
      className: "lp-reveal-name"
    }, r)), /*#__PURE__*/React.createElement("span", {
      className: "lp-reveal-check"
    }, isActive ? '✓' : ''));
  })));
}
function DispatchMock() {
  const reports = [{
    title: 'Weekly Performance Digest',
    meta: 'to · 14 leads · Mon 08:00',
    stamp: 'scheduled',
    active: false
  }, {
    title: 'Board Pack — Q2 Interim',
    meta: 'to · 6 members · auto-compiled',
    stamp: 'ready',
    active: true
  }, {
    title: 'Daily Team Briefing',
    meta: 'to · team APAC · daily 09:30',
    stamp: 'sent · 2m ago',
    active: false
  }, {
    title: 'Investor Update · Aug',
    meta: 'to · 38 investors · drafted',
    stamp: 'drafting',
    active: false
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "lp-mock"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-mock-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-mock-title"
  }, "Intelligence Dispatch Queue"), /*#__PURE__*/React.createElement("span", {
    className: "lp-mock-status"
  }, "\u25CF auto-running")), /*#__PURE__*/React.createElement("div", {
    className: "lp-dispatch"
  }, reports.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `lp-dispatch-row ${r.active ? 'lp-dispatch-row--active' : ''}`
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lp-dispatch-title"
  }, r.title), /*#__PURE__*/React.createElement("div", {
    className: "lp-dispatch-meta"
  }, r.meta)), /*#__PURE__*/React.createElement("span", {
    className: "lp-dispatch-stamp"
  }, r.stamp)))));
}
function AnomalyMock() {
  const W = 360,
    H = 170,
    seg = 40;
  const pts = [];
  let drop = -1;
  for (let k = 0; k <= seg; k++) {
    const x = k / seg * W;
    const base = H - 40 - Math.sin(k * 0.25) * 8 - k * 1.6;
    let y = base;
    if (k >= 28 && k <= 36) {
      // sharp dip
      const p = (k - 28) / 8;
      y = base + Math.sin(p * Math.PI) * 52;
      if (k === 32) drop = k;
    }
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const dropX = Math.round(32 / seg * W * 100) / 100;
  const dropY = Math.round((H - 40 - Math.sin(32 * 0.25) * 8 - 32 * 1.6 + 52) * 100) / 100;
  return /*#__PURE__*/React.createElement("div", {
    className: "lp-mock"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-mock-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-mock-title"
  }, "Anomaly \xB7 MRR_cohort_3"), /*#__PURE__*/React.createElement("span", {
    className: "lp-mock-status"
  }, "\u25CF \u03C3 2.8 \xB7 flagged 41s ago")), /*#__PURE__*/React.createElement("div", {
    className: "lp-anom-plot"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "none",
    style: {
      width: '100%',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("polyline", {
    points: pts.join(' '),
    fill: "none",
    stroke: "var(--gold)",
    strokeWidth: "1.6",
    style: {
      filter: 'drop-shadow(0 0 6px var(--gold))'
    }
  }), /*#__PURE__*/React.createElement("circle", {
    cx: dropX,
    cy: dropY,
    r: "5",
    fill: "var(--red)",
    style: {
      filter: 'drop-shadow(0 0 10px var(--red))'
    }
  }), /*#__PURE__*/React.createElement("line", {
    x1: dropX,
    y1: dropY - 8,
    x2: dropX,
    y2: 10,
    stroke: "var(--red)",
    strokeDasharray: "2 3",
    strokeWidth: "1",
    opacity: "0.5"
  })), /*#__PURE__*/React.createElement("div", {
    className: "lp-anom-label"
  }, "Anomaly detected")), /*#__PURE__*/React.createElement("div", {
    className: "lp-anom-trace"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-anom-trace-cause"
  }, "likely cause \xB7 ", /*#__PURE__*/React.createElement("em", null, "coupon_expiry"), " (71% of variance)"), /*#__PURE__*/React.createElement("span", {
    className: "lp-anom-trace-score"
  }, "0.71")), /*#__PURE__*/React.createElement("div", {
    className: "lp-anom-trace"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-anom-trace-cause"
  }, "likely cause \xB7 ", /*#__PURE__*/React.createElement("em", null, "onboarding_drop"), " (23% correlated)"), /*#__PURE__*/React.createElement("span", {
    className: "lp-anom-trace-score"
  }, "0.54")));
}
function DnaMock() {
  const axes = [{
    label: 'Velocity',
    pct: 88,
    val: '88'
  }, {
    label: 'Consistency',
    pct: 72,
    val: '72'
  }, {
    label: 'KPI Hit',
    pct: 94,
    val: '94'
  }, {
    label: 'Peer Bench',
    pct: 81,
    val: '81'
  }];
  const score = 87;
  const R = 64;
  const C = 2 * Math.PI * R;
  const pct = score / 100;
  return /*#__PURE__*/React.createElement("div", {
    className: "lp-mock"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-mock-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-mock-title"
  }, "Performance DNA \xB7 Priya M."), /*#__PURE__*/React.createElement("span", {
    className: "lp-mock-status"
  }, "\u25CF refreshed today")), /*#__PURE__*/React.createElement("div", {
    className: "lp-dna"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-dna-ring"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "160",
    height: "160",
    viewBox: "0 0 160 160"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "80",
    cy: "80",
    r: R,
    stroke: "var(--border)",
    strokeWidth: "6",
    fill: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "80",
    cy: "80",
    r: R,
    stroke: "var(--gold)",
    strokeWidth: "6",
    fill: "none",
    strokeLinecap: "round",
    strokeDasharray: `${C * pct} ${C}`,
    style: {
      filter: 'drop-shadow(0 0 10px var(--gold))'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "lp-dna-score-num"
  }, /*#__PURE__*/React.createElement("strong", null, score), /*#__PURE__*/React.createElement("span", null, "DNA Score"))), /*#__PURE__*/React.createElement("div", {
    className: "lp-dna-axes"
  }, axes.map(a => /*#__PURE__*/React.createElement("div", {
    className: "lp-dna-axis",
    key: a.label
  }, /*#__PURE__*/React.createElement("span", null, a.label), /*#__PURE__*/React.createElement("span", {
    className: "lp-dna-bar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-dna-bar-fill",
    style: {
      width: `${a.pct}%`
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "lp-dna-axis-v"
  }, a.val))))));
}
function WorkflowMock() {
  return /*#__PURE__*/React.createElement("div", {
    className: "lp-mock"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-mock-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-mock-title"
  }, "Automation \xB7 new_workflow"), /*#__PURE__*/React.createElement("span", {
    className: "lp-mock-status"
  }, "\u25CF no code")), /*#__PURE__*/React.createElement("div", {
    className: "lp-wf"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-wf-node"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-wf-tag"
  }, "if"), /*#__PURE__*/React.createElement("span", {
    className: "lp-wf-body"
  }, "Pipeline coverage < 2\xD7 quota")), /*#__PURE__*/React.createElement("span", {
    className: "lp-wf-arrow"
  }, "\u2502", /*#__PURE__*/React.createElement("br", null), "\u25BC"), /*#__PURE__*/React.createElement("div", {
    className: "lp-wf-node"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-wf-tag lp-wf-tag--then"
  }, "then"), /*#__PURE__*/React.createElement("span", {
    className: "lp-wf-body"
  }, "Alert region lead \xB7 Slack #deals")), /*#__PURE__*/React.createElement("span", {
    className: "lp-wf-arrow"
  }, "\u2502", /*#__PURE__*/React.createElement("br", null), "\u25BC"), /*#__PURE__*/React.createElement("div", {
    className: "lp-wf-node"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-wf-tag lp-wf-tag--and"
  }, "and"), /*#__PURE__*/React.createElement("span", {
    className: "lp-wf-body"
  }, "Assign pipeline-review task \xB7 48h")), /*#__PURE__*/React.createElement("span", {
    className: "lp-wf-arrow"
  }, "\u2502", /*#__PURE__*/React.createElement("br", null), "\u25BC"), /*#__PURE__*/React.createElement("div", {
    className: "lp-wf-node"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-wf-tag lp-wf-tag--then"
  }, "then"), /*#__PURE__*/React.createElement("span", {
    className: "lp-wf-body"
  }, "Update weekly digest with status"))));
}

// ---------- Feature block ----------

function FeatureBlock({
  num,
  name,
  tm,
  claim,
  body,
  flip,
  Mock,
  annot
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "lp-section-host grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, annot), /*#__PURE__*/React.createElement("div", {
    className: flip ? 'lg:order-2' : ''
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-mono text-xs font-semibold uppercase tracking-[0.16em] text-gold/80"
  }, num), /*#__PURE__*/React.createElement("h3", {
    className: "mt-3 font-display text-2xl font-bold text-ink sm:text-[2rem]"
  }, name, /*#__PURE__*/React.createElement("sup", {
    className: "ml-0.5 align-super text-sm text-gold"
  }, tm)), /*#__PURE__*/React.createElement("div", {
    className: "mt-2 font-head text-lg text-ink"
  }, claim), /*#__PURE__*/React.createElement("p", {
    className: "mt-4 text-lg leading-relaxed text-ink-2"
  }, body)), /*#__PURE__*/React.createElement("div", {
    className: flip ? 'lg:order-1' : ''
  }, /*#__PURE__*/React.createElement(Mock, null)));
}
function SectionFeatures() {
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section-host",
    "data-section": "features",
    "data-screen-label": "\xA75 Features"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA75 \xB7 Features \xB7 Alternating L/R \xB7 Micro-UI per feature"), /*#__PURE__*/React.createElement("div", {
    className: "lp-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid gap-6 lg:grid-cols-[1fr_minmax(0,30rem)] lg:items-end"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "lp-eyebrow"
  }, "What others haven't built"), /*#__PURE__*/React.createElement("h2", {
    className: "lp-h2 mt-4"
  }, "We didn't improve what existed.", /*#__PURE__*/React.createElement("br", null), "We built ", /*#__PURE__*/React.createElement("em", null, "what didn't."))), /*#__PURE__*/React.createElement("p", {
    className: "lp-lead"
  }, "Six category-creating features. Six reasons the market's giants are already behind. Everything here is live, shipping, and running in production.")), /*#__PURE__*/React.createElement("div", {
    className: "mt-8 divide-y divide-line"
  }, /*#__PURE__*/React.createElement(FeatureBlock, {
    num: "FEATURE \xB7 01",
    name: "KPI Pulse Engine",
    tm: "\u2122",
    claim: "Real-time organisational heartbeat monitoring",
    body: "Every KPI across every team, tracked live \u2014 with deviation scoring, trend velocity, and automated escalation routing. Not a static report. A living signal.",
    Mock: PulseMock,
    annot: "Feature #1 \xB7 Live data proof \xB7 motion in mock"
  }), /*#__PURE__*/React.createElement(FeatureBlock, {
    num: "FEATURE \xB7 02",
    name: "Role-Reveal Dashboards",
    tm: "\u2122",
    claim: "Your world unlocks when you log in",
    body: "No generic dashboards. The platform reads your role, your team, your targets \u2014 and constructs your intelligence environment automatically. First login to full context in under 60 seconds.",
    flip: true,
    Mock: RoleRevealMock,
    annot: "Feature #2 \xB7 Flip layout \xB7 Decision moment visualised"
  }), /*#__PURE__*/React.createElement(FeatureBlock, {
    num: "FEATURE \xB7 03",
    name: "Automated Intelligence Dispatch",
    tm: "\u2122",
    claim: "Reports that write and send themselves",
    body: "Weekly summaries, monthly board packs, daily team briefings \u2014 written, formatted, and delivered automatically. No analyst required. No manual compiling. Ever.",
    Mock: DispatchMock,
    annot: "Feature #3 \xB7 Queue UI \xB7 ready-stamp = proof"
  }), /*#__PURE__*/React.createElement(FeatureBlock, {
    num: "FEATURE \xB7 04",
    name: "Anomaly Root-Cause Engine",
    tm: "\u2122",
    claim: "Not just what broke \u2014 but why",
    body: "When a KPI drops, the platform doesn't just flag it. It traces back through correlated variables, surfaces the likely cause, and suggests the corrective action \u2014 before you even ask.",
    flip: true,
    Mock: AnomalyMock,
    annot: "Feature #4 \xB7 Visual drop + trace rows"
  }), /*#__PURE__*/React.createElement(FeatureBlock, {
    num: "FEATURE \xB7 05",
    name: "Performance DNA Score",
    tm: "\u2122",
    claim: "A living profile for every contributor",
    body: "A dynamic, multi-dimensional score built from KPI history, consistency, improvement velocity, and peer benchmarking. More honest than a rating. More actionable than a review.",
    Mock: DnaMock,
    annot: "Feature #5 \xB7 Radial score + axis bars"
  }), /*#__PURE__*/React.createElement(FeatureBlock, {
    num: "FEATURE \xB7 06",
    name: "Automation Workflow Builder",
    tm: "\u2122",
    claim: "If this KPI, then that action \u2014 no code required",
    body: "Build intelligent automation pipelines visually. When a metric hits a threshold \u2014 trigger an alert, assign a task, update a report, notify a stakeholder. Automation that runs the operations layer for you.",
    flip: true,
    Mock: WorkflowMock,
    annot: "Feature #6 \xB7 Vertical if/then/and nodes"
  }))));
}

// ---------- Section 6: Social proof ----------

function SectionProof() {
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section--alt lp-section-host",
    "data-section": "proof",
    "data-screen-label": "\xA76 Proof"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA76 \xB7 Proof \xB7 Founder guarantee pull-quote + terms bar"), /*#__PURE__*/React.createElement("div", {
    className: "lp-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto max-w-3xl text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-eyebrow"
  }, "Instead of a testimonial"), /*#__PURE__*/React.createElement("div", {
    className: "mt-6 font-display text-6xl leading-none text-gold/40"
  }, "\u201C"), /*#__PURE__*/React.createElement("blockquote", {
    className: "mt-2 font-display text-[clamp(1.6rem,3vw,2.6rem)] font-medium leading-snug text-ink"
  }, "If you don\u2019t find at least one fix worth more than the fee, ", /*#__PURE__*/React.createElement("em", {
    className: "italic text-gold"
  }, "I\u2019ll refund it"), "."), /*#__PURE__*/React.createElement("span", {
    className: "mt-5 block font-head text-sm uppercase tracking-wide text-ink-3"
  }, "Ashu \xB7 Founder, The KPI Hub \xB7 Delhi")), /*#__PURE__*/React.createElement("div", {
    className: "mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
  }, ['48-Hour Turnaround', '₹2,999 · One-Time', 'No Retainer, No Lock-In', 'Money-Back Guarantee'].map(t => /*#__PURE__*/React.createElement("div", {
    key: t,
    className: "flex items-center gap-2.5 rounded-md border border-line bg-card/60 px-4 py-3 text-sm text-ink-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-gold"
  }, "\u2726"), /*#__PURE__*/React.createElement("span", null, t))))));
}
Object.assign(window, {
  SectionFeatures,
  SectionProof
});