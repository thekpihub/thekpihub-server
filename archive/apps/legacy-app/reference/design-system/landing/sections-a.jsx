/* global React */
// Section 2: Problem   ·   Section 3: Platform intro   ·   Section 4: Persona tabs w/ dashboards

const { useState } = React;

// ---------- Section 2: Problem ----------
function SectionProblem() {
  return (
    <section className="section alt lp-section-host" data-section="problem" data-screen-label="§2 Problem">
      <div className="lp-annot">§2 · Problem · Agitate · no fluff, no buttons</div>
      <div className="section-inner">
        <div className="lp-problem">
          <div className="section-head" style={{ justifyContent: 'center' }}>
            <div>
              <span className="eyebrow" style={{ marginBottom: 16 }}>Why The KPI Hub Exists</span>
              <h2 style={{ textAlign: 'center' }}>
                Every business is drowning in data.<br/>
                Almost none of it is <em>actionable.</em>
              </h2>
            </div>
          </div>
          <div className="lp-problem-body">
            <p>Your executives are waiting on reports that take days to compile.</p>
            <p>Your managers are chasing updates across five tools and three spreadsheets.</p>
            <p>Your employees don't know where they actually stand until review day.</p>
            <p>Your analysts are building dashboards nobody reads.</p>
            <p style={{ marginTop: 22, color: 'var(--text)' }}>
              The data exists. The problem is it was never connected, never intelligent, and never built around the people who need it most.
            </p>
            <span className="lp-final">That ends here.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Section 3: Platform intro ----------
function SectionPlatform() {
  return (
    <section className="section lp-section-host" data-section="platform" data-screen-label="§3 Platform">
      <div className="lp-annot">§3 · Platform intro · Category definition</div>
      <div className="section-inner">
        <div className="lp-platform">
          <div className="lp-platform-text">
            <span className="eyebrow">What Is TheKPIHub</span>
            <h2>
              One Platform. Four <em>Intelligent</em> Worlds.<br/>
              Built for <em>every role</em> in your organization.
            </h2>
            <p className="lp-body">
              TheKPIHub is not a reporting tool. It's not a BI dashboard. It's not another analytics add-on.
            </p>
            <p className="lp-body">
              It is a live, automated SaaS intelligence platform that knows who you are the moment you log in — and builds your entire performance universe around you.
              Whether you're running the company, managing a team, hitting your own targets, or engineering the data layer — TheKPIHub speaks your language,
              surfaces your metrics, and automates the intelligence work you've been doing manually for years.
            </p>
            <span className="lp-sublabel">✦ Register once · Log in · Your world is already waiting</span>
          </div>

          <div className="lp-platform-visual">
            <div className="lp-orbit">
              <div className="lp-orbit-ring lp-orbit-ring--2" />
              <div className="lp-orbit-ring lp-orbit-ring--1" />
              <div className="lp-orbit-core">The<br/>KPI<br/>Hub</div>
              <div className="lp-orbit-node lp-orbit-node--n"><span className="lp-orbit-dot" />Executive</div>
              <div className="lp-orbit-node lp-orbit-node--e"><span className="lp-orbit-dot" />Manager</div>
              <div className="lp-orbit-node lp-orbit-node--s"><span className="lp-orbit-dot" />Contributor</div>
              <div className="lp-orbit-node lp-orbit-node--w"><span className="lp-orbit-dot" />Analyst</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Section 4: Persona dashboard mockups ----------

function Sparkline({ points, stroke = 'var(--gold)' }) {
  // points: array of y-values 0..1; returns an SVG sparkline
  const W = 220, H = 36;
  const step = W / (points.length - 1);
  const path = points.map((v, i) => {
    const x = i * step;
    const y = H - v * H;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const area = `${path} L${W},${H} L0,${H} Z`;
  return (
    <svg className="lp-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lp-spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="lp-spark-area" d={area} fill="url(#lp-spark-grad)" />
      <path className="lp-spark-line" d={path} stroke={stroke} />
    </svg>
  );
}

function ExecutiveDash() {
  return (
    <div className="lp-dash">
      <div className="lp-dash-chrome">
        <span className="lp-dash-chrome-title">Executive · Health Score</span>
        <span className="lp-dash-chrome-status">Live</span>
      </div>
      <div className="lp-dash-row lp-dash-row--3">
        <div className="lp-dash-kpi">
          <div className="lp-dash-kpi-lbl">Health</div>
          <div className="lp-dash-kpi-val lp-dash-kpi-val--gold">92</div>
          <div className="lp-dash-kpi-delta lp-dash-kpi-delta--up">↑ 4 this wk</div>
        </div>
        <div className="lp-dash-kpi">
          <div className="lp-dash-kpi-lbl">MRR</div>
          <div className="lp-dash-kpi-val">$847K</div>
          <div className="lp-dash-kpi-delta lp-dash-kpi-delta--up">↑ 12.4%</div>
        </div>
        <div className="lp-dash-kpi">
          <div className="lp-dash-kpi-lbl">Burn</div>
          <div className="lp-dash-kpi-val">$214K</div>
          <div className="lp-dash-kpi-delta lp-dash-kpi-delta--up">↓ 8.1%</div>
        </div>
      </div>
      <div className="lp-dash-kpi" style={{ padding: '14px 16px' }}>
        <div className="lp-dash-kpi-lbl">Revenue — 30 day</div>
        <Sparkline points={[0.25, 0.32, 0.28, 0.42, 0.48, 0.55, 0.51, 0.62, 0.68, 0.74, 0.72, 0.81]} />
      </div>
      <div className="lp-alert">
        <span className="lp-alert-icon">!</span>
        <span className="lp-alert-txt">
          <strong>AI-Prioritized Alert.</strong> Sales pipeline coverage dropped 22% in APAC — 3 likely causes surfaced.
        </span>
      </div>
      <div className="lp-alert lp-alert--ok">
        <span className="lp-alert-icon">✓</span>
        <span className="lp-alert-txt">
          <strong>Board pack ready.</strong> Auto-compiled from 14 KPIs. One-click dispatch.
        </span>
      </div>
    </div>
  );
}

function ManagerDash() {
  const team = [
    { name: 'Priya M.',   pct: 94, val: '142%' },
    { name: 'Adit R.',    pct: 88, val: '118%' },
    { name: 'Nora K.',    pct: 72, val: '96%' },
    { name: 'Ben O.',     pct: 61, val: '81%' },
    { name: 'Wei L.',     pct: 42, val: '54%' },
  ];
  return (
    <div className="lp-dash">
      <div className="lp-dash-chrome">
        <span className="lp-dash-chrome-title">Manager · Team Performance</span>
        <span className="lp-dash-chrome-status">Live</span>
      </div>
      <div className="lp-dash-row lp-dash-row--3">
        <div className="lp-dash-kpi">
          <div className="lp-dash-kpi-lbl">Team Avg</div>
          <div className="lp-dash-kpi-val lp-dash-kpi-val--gold">104%</div>
          <div className="lp-dash-kpi-delta lp-dash-kpi-delta--up">↑ 11 pts</div>
        </div>
        <div className="lp-dash-kpi">
          <div className="lp-dash-kpi-lbl">Sprint</div>
          <div className="lp-dash-kpi-val">7 / 9</div>
          <div className="lp-dash-kpi-delta">2 at risk</div>
        </div>
        <div className="lp-dash-kpi">
          <div className="lp-dash-kpi-lbl">Quota</div>
          <div className="lp-dash-kpi-val lp-dash-kpi-val--teal">83%</div>
          <div className="lp-dash-kpi-delta lp-dash-kpi-delta--up">on track</div>
        </div>
      </div>
      <div className="lp-lb">
        <div className="lp-lb-head"><span>Leaderboard · Q2</span><span>Attainment</span></div>
        {team.map((t, i) => (
          <div className="lp-lb-row" key={i}>
            <span className="lp-lb-rank">{String(i + 1).padStart(2, '0')}</span>
            <span className="lp-lb-name">{t.name}</span>
            <span className="lp-lb-bar"><span className="lp-lb-bar-fill" style={{ width: `${t.pct}%` }} /></span>
            <span className="lp-lb-val">{t.val}</span>
          </div>
        ))}
      </div>
      <div className="lp-alert">
        <span className="lp-alert-icon">!</span>
        <span className="lp-alert-txt">
          <strong>Underperformance alert.</strong> Wei L. · 3 weeks below target. Auto-drafted 1-on-1 agenda ready.
        </span>
      </div>
    </div>
  );
}

function ContributorDash() {
  return (
    <div className="lp-dash">
      <div className="lp-dash-chrome">
        <span className="lp-dash-chrome-title">Contributor · Priya M.</span>
        <span className="lp-dash-chrome-status">Updated 2m ago</span>
      </div>
      <div className="lp-ring-wrap">
        <div className="lp-ring">
          <svg width="82" height="82" viewBox="0 0 82 82" style={{ transform: 'rotate(-90deg)' }}>
            <circle className="lp-ring-track" cx="41" cy="41" r="34" />
            <circle className="lp-ring-fill" cx="41" cy="41" r="34"
                    strokeDasharray={`${0.94 * 2 * Math.PI * 34} ${2 * Math.PI * 34}`} />
          </svg>
          <div className="lp-ring-num">94</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="lp-ring-meta-lbl">Attainment</div>
          <div className="lp-ring-meta-val">142%</div>
          <div className="lp-ring-meta-sub">↑ #2 of 48 · top 5% peer group</div>
        </div>
      </div>
      <div className="lp-dash-row lp-dash-row--2">
        <div className="lp-dash-kpi">
          <div className="lp-dash-kpi-lbl">Calls</div>
          <div className="lp-dash-kpi-val">47</div>
          <div className="lp-dash-kpi-delta lp-dash-kpi-delta--up">↑ 12% vs peer avg</div>
        </div>
        <div className="lp-dash-kpi">
          <div className="lp-dash-kpi-lbl">Pipeline</div>
          <div className="lp-dash-kpi-val lp-dash-kpi-val--gold">$312K</div>
          <div className="lp-dash-kpi-delta lp-dash-kpi-delta--up">↑ 18%</div>
        </div>
      </div>
      <div className="lp-alert lp-alert--ok">
        <span className="lp-alert-icon">★</span>
        <span className="lp-alert-txt">
          <strong>Milestone hit.</strong> 140% quota — personal best. Celebrate; your manager has been notified.
        </span>
      </div>
    </div>
  );
}

function AnalystDash() {
  return (
    <div className="lp-dash">
      <div className="lp-dash-chrome">
        <span className="lp-dash-chrome-title">Analyst · Intelligence Pipeline</span>
        <span className="lp-dash-chrome-status">Running</span>
      </div>
      <div className="lp-pipe">
        <div><span className="lp-pipe-tag">def</span> kpi <strong style={{color:'var(--text)'}}>pipeline_velocity</strong> =</div>
        <div style={{ paddingLeft: 14 }}>(opps_created × win_rate) / avg_cycle_days</div>
      </div>
      <div className="lp-dash-row lp-dash-row--2">
        <div className="lp-dash-kpi">
          <div className="lp-dash-kpi-lbl">Formula</div>
          <div className="lp-dash-kpi-val">17</div>
          <div className="lp-dash-kpi-delta">custom KPIs</div>
        </div>
        <div className="lp-dash-kpi">
          <div className="lp-dash-kpi-lbl">Sources</div>
          <div className="lp-dash-kpi-val">6</div>
          <div className="lp-dash-kpi-delta lp-dash-kpi-delta--up">all synced</div>
        </div>
      </div>
      <div className="lp-pipe">
        <div>
          <span className="lp-pipe-tag">anomaly</span> MRR_cohort_3:&nbsp;
          <span className="lp-pipe-ok">flagged</span> · σ 2.8
        </div>
        <div style={{ color: 'var(--text-3)', marginTop: 2 }}>
          root cause candidates: <span style={{ color: 'var(--gold)' }}>coupon_expiry (0.71)</span>, <span style={{ color: 'var(--gold)' }}>onboarding_drop (0.54)</span>
        </div>
      </div>
      <div className="lp-pipe">
        <div><span className="lp-pipe-tag">pipeline</span> daily_intel_dispatch</div>
        <div style={{ color: 'var(--text-3)', marginTop: 2 }}>
          harvest ▸ synthesize ▸ verify ▸ <span className="lp-pipe-ok">delivered · 09:00 IST</span>
        </div>
      </div>
    </div>
  );
}

const PERSONAS = [
  {
    key: 'exec',
    num: '01',
    title: 'The Executive',
    tabFor: 'Founders · CEOs · Owners',
    forLabel: 'For Founders, CEOs & Business Owners',
    headline: <>Your company, on <em>one screen.</em></>,
    body: 'See the entire business in one screen. AI-prioritized alerts. Automated board-ready reports. From macro health score to micro root cause — in a single click.',
    link: 'See Executive Dashboard',
    Dash: ExecutiveDash,
  },
  {
    key: 'mgr',
    num: '02',
    title: 'The Manager',
    tabFor: 'Team Leads · Ops Directors',
    forLabel: 'For Team Leads, Department Heads & Operations Directors',
    headline: <>Run every <em>1-on-1</em> from one panel.</>,
    body: 'Real-time team KPI leaderboards. Automated underperformance alerts. Sprint tracking. Run every 1-on-1 review from a single intelligent panel.',
    link: 'See Manager Dashboard',
    Dash: ManagerDash,
  },
  {
    key: 'contrib',
    num: '03',
    title: 'The Contributor',
    tabFor: 'Employees · Sales · Analysts',
    forLabel: 'For Employees, Sales Reps, Analysts & Individual Performers',
    headline: <>Know where you stand — <em>before anyone tells you.</em></>,
    body: 'Your personal KPI scorecard. Daily progress. Peer benchmarking. Milestone celebrations. Know exactly where you stand — before anyone tells you.',
    link: 'See Contributor Dashboard',
    Dash: ContributorDash,
  },
  {
    key: 'anal',
    num: '04',
    title: 'The Analyst',
    tabFor: 'BI · Data Ops · Strategy',
    forLabel: 'For BI Professionals, Data Ops & Strategy Consultants',
    headline: <>The most powerful <em>analytical layer</em> ever shipped in a KPI tool.</>,
    body: 'Custom KPI formula builders. Multi-source data import. Anomaly detection. Automated intelligence pipelines. The most powerful analytical layer ever built into a KPI platform.',
    link: 'See Analyst Dashboard',
    Dash: AnalystDash,
  },
];

function SectionPersonas() {
  const [active, setActive] = useState(0);
  const P = PERSONAS[active];
  return (
    <section className="section alt lp-section-host" data-section="personas" data-screen-label="§4 Personas">
      <div className="lp-annot">§4 · 4 personas · Tabbed · Live dashboard preview</div>
      <div className="section-inner">
        <div className="section-head">
          <div>
            <span className="eyebrow">Built for every layer</span>
            <h2>Your role. Your <em>dashboard.</em><br/>Your intelligence.</h2>
          </div>
          <p className="section-head-sub">
            The platform reads your role, your team, your targets — and constructs your intelligence environment automatically. First login to full context in under 60 seconds.
          </p>
        </div>

        <div className="lp-persona-tabs" role="tablist">
          {PERSONAS.map((p, i) => (
            <button
              key={p.key}
              className="lp-persona-tab"
              role="tab"
              aria-selected={active === i}
              onClick={() => setActive(i)}
            >
              <span className="lp-persona-tab-num">{p.num}</span>
              <span className="lp-persona-tab-title">{p.title}</span>
              <span className="lp-persona-tab-for">{p.tabFor}</span>
            </button>
          ))}
        </div>

        <div className="lp-persona-body">
          <div className="lp-persona-copy">
            <span className="lp-persona-copy-for">{P.forLabel}</span>
            <h3>{P.headline}</h3>
            <p className="lp-persona-copy-body">{P.body}</p>
            <a className="lp-persona-link" href="#">{P.link}</a>
          </div>
          <P.Dash />
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { SectionProblem, SectionPlatform, SectionPersonas, Sparkline });
