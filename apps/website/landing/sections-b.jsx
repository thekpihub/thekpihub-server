/* global React */
// Section 5: 6 feature blocks (alternating) · Section 6: Social proof

const { useEffect: useEffectFB, useState: useStateFB } = React;

// ---------- Feature mock visualisations ----------

function PulseMock() {
  const [t, setT] = useStateFB(0);
  useEffectFB(() => {
    let raf; const start = performance.now();
    const tick = (n) => { setT(n - start); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const W = 360, H = 140, seg = 60;
  const pts = [];
  for (let k = 0; k <= seg; k++) {
    const x = (k / seg) * W;
    const y = H / 2 + Math.sin(x * 0.04 + t * 0.003) * 22 + Math.sin(x * 0.015 + t * 0.0014) * 12;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const dotK = (Math.sin(t * 0.0009) * 0.5 + 0.5);
  const dotX = Math.round(dotK * W * 100) / 100;
  const dotY = Math.round((H / 2 + Math.sin(dotX * 0.04 + t * 0.003) * 22 + Math.sin(dotX * 0.015 + t * 0.0014) * 12) * 100) / 100;

  return (
    <div className="lp-mock">
      <div className="lp-pulse-mock-bg" />
      <div className="lp-mock-head">
        <span className="lp-mock-title">KPI Pulse Engine</span>
        <span className="lp-mock-status">● live · 4.2 Hz</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 140, position: 'relative', zIndex: 1 }}>
        <polyline className="lp-pulse-mock-line" points={pts.join(' ')} />
        <circle className="lp-pulse-mock-dot" cx={dotX} cy={dotY} r="4" />
      </svg>
      <div className="lp-pulse-mock-rows">
        <div className="lp-pulse-mini"><div className="lp-pulse-mini-lbl">MRR</div><div className="lp-pulse-mini-val lp-pulse-mini-val--up">↑ 12.4%</div></div>
        <div className="lp-pulse-mini"><div className="lp-pulse-mini-lbl">NRR</div><div className="lp-pulse-mini-val lp-pulse-mini-val--up">↑ 3.1pp</div></div>
        <div className="lp-pulse-mini"><div className="lp-pulse-mini-lbl">Churn</div><div className="lp-pulse-mini-val lp-pulse-mini-val--down">↑ 0.4pp</div></div>
      </div>
    </div>
  );
}

function RoleRevealMock() {
  const roles = ['Executive', 'Manager', 'Contributor', 'Analyst'];
  const [active, setActive] = useStateFB(2);
  useEffectFB(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % 4), 1800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="lp-mock">
      <div className="lp-mock-head">
        <span className="lp-mock-title">Reading session · Priya M.</span>
        <span className="lp-mock-status">● matching role</span>
      </div>
      <div className="lp-reveal-stack">
        {roles.map((r, i) => {
          const isActive = i === active;
          const offset = i * 56;
          return (
            <div
              key={r}
              className={`lp-reveal-card ${isActive ? 'lp-reveal-card--active' : ''}`}
              style={{
                top: offset,
                transform: isActive ? 'scale(1.02)' : `scale(${0.98 - Math.abs(i - active) * 0.015})`,
                opacity: isActive ? 1 : 0.55,
                zIndex: isActive ? 2 : 1,
              }}
            >
              <div>
                <div className="lp-reveal-role">Candidate · Dashboard</div>
                <div className="lp-reveal-name">{r}</div>
              </div>
              <span className="lp-reveal-check">{isActive ? '✓' : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DispatchMock() {
  const reports = [
    { title: 'Weekly Performance Digest', meta: 'to · 14 leads · Mon 08:00',   stamp: 'scheduled', active: false },
    { title: 'Board Pack — Q2 Interim',   meta: 'to · 6 members · auto-compiled', stamp: 'ready', active: true },
    { title: 'Daily Team Briefing',        meta: 'to · team APAC · daily 09:30',  stamp: 'sent · 2m ago', active: false },
    { title: 'Investor Update · Aug',       meta: 'to · 38 investors · drafted',   stamp: 'drafting', active: false },
  ];
  return (
    <div className="lp-mock">
      <div className="lp-mock-head">
        <span className="lp-mock-title">Intelligence Dispatch Queue</span>
        <span className="lp-mock-status">● auto-running</span>
      </div>
      <div className="lp-dispatch">
        {reports.map((r, i) => (
          <div key={i} className={`lp-dispatch-row ${r.active ? 'lp-dispatch-row--active' : ''}`}>
            <div>
              <div className="lp-dispatch-title">{r.title}</div>
              <div className="lp-dispatch-meta">{r.meta}</div>
            </div>
            <span className="lp-dispatch-stamp">{r.stamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnomalyMock() {
  const W = 360, H = 170, seg = 40;
  const pts = [];
  let drop = -1;
  for (let k = 0; k <= seg; k++) {
    const x = (k / seg) * W;
    const base = H - 40 - Math.sin(k * 0.25) * 8 - k * 1.6;
    let y = base;
    if (k >= 28 && k <= 36) { // sharp dip
      const p = (k - 28) / 8;
      y = base + Math.sin(p * Math.PI) * 52;
      if (k === 32) drop = k;
    }
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const dropX = Math.round((32 / seg) * W * 100) / 100;
  const dropY = Math.round((H - 40 - Math.sin(32 * 0.25) * 8 - 32 * 1.6 + 52) * 100) / 100;

  return (
    <div className="lp-mock">
      <div className="lp-mock-head">
        <span className="lp-mock-title">Anomaly · MRR_cohort_3</span>
        <span className="lp-mock-status">● σ 2.8 · flagged 41s ago</span>
      </div>
      <div className="lp-anom-plot">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <polyline points={pts.join(' ')} fill="none" stroke="var(--gold)" strokeWidth="1.6"
                    style={{ filter: 'drop-shadow(0 0 6px var(--gold))' }} />
          <circle cx={dropX} cy={dropY} r="5" fill="var(--red)"
                  style={{ filter: 'drop-shadow(0 0 10px var(--red))' }} />
          <line x1={dropX} y1={dropY - 8} x2={dropX} y2={10} stroke="var(--red)" strokeDasharray="2 3" strokeWidth="1" opacity="0.5" />
        </svg>
        <div className="lp-anom-label">Anomaly detected</div>
      </div>
      <div className="lp-anom-trace">
        <span className="lp-anom-trace-cause">
          likely cause · <em>coupon_expiry</em> (71% of variance)
        </span>
        <span className="lp-anom-trace-score">0.71</span>
      </div>
      <div className="lp-anom-trace">
        <span className="lp-anom-trace-cause">
          likely cause · <em>onboarding_drop</em> (23% correlated)
        </span>
        <span className="lp-anom-trace-score">0.54</span>
      </div>
    </div>
  );
}

function DnaMock() {
  const axes = [
    { label: 'Velocity',    pct: 88, val: '88' },
    { label: 'Consistency', pct: 72, val: '72' },
    { label: 'KPI Hit',     pct: 94, val: '94' },
    { label: 'Peer Bench',  pct: 81, val: '81' },
  ];
  const score = 87;
  const R = 64;
  const C = 2 * Math.PI * R;
  const pct = score / 100;

  return (
    <div className="lp-mock">
      <div className="lp-mock-head">
        <span className="lp-mock-title">Performance DNA · Priya M.</span>
        <span className="lp-mock-status">● refreshed today</span>
      </div>
      <div className="lp-dna">
        <div className="lp-dna-ring">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={R} stroke="var(--border)" strokeWidth="6" fill="none" />
            <circle cx="80" cy="80" r={R} stroke="var(--gold)" strokeWidth="6" fill="none" strokeLinecap="round"
                    strokeDasharray={`${C * pct} ${C}`}
                    style={{ filter: 'drop-shadow(0 0 10px var(--gold))' }} />
          </svg>
          <div className="lp-dna-score-num"><strong>{score}</strong><span>DNA Score</span></div>
        </div>
        <div className="lp-dna-axes">
          {axes.map((a) => (
            <div className="lp-dna-axis" key={a.label}>
              <span>{a.label}</span>
              <span className="lp-dna-bar"><span className="lp-dna-bar-fill" style={{ width: `${a.pct}%` }} /></span>
              <span className="lp-dna-axis-v">{a.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkflowMock() {
  return (
    <div className="lp-mock">
      <div className="lp-mock-head">
        <span className="lp-mock-title">Automation · new_workflow</span>
        <span className="lp-mock-status">● no code</span>
      </div>
      <div className="lp-wf">
        <div className="lp-wf-node">
          <span className="lp-wf-tag">if</span>
          <span className="lp-wf-body">Pipeline coverage &lt; 2× quota</span>
        </div>
        <span className="lp-wf-arrow">│<br/>▼</span>
        <div className="lp-wf-node">
          <span className="lp-wf-tag lp-wf-tag--then">then</span>
          <span className="lp-wf-body">Alert region lead · Slack #deals</span>
        </div>
        <span className="lp-wf-arrow">│<br/>▼</span>
        <div className="lp-wf-node">
          <span className="lp-wf-tag lp-wf-tag--and">and</span>
          <span className="lp-wf-body">Assign pipeline-review task · 48h</span>
        </div>
        <span className="lp-wf-arrow">│<br/>▼</span>
        <div className="lp-wf-node">
          <span className="lp-wf-tag lp-wf-tag--then">then</span>
          <span className="lp-wf-body">Update weekly digest with status</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Feature block ----------

function FeatureBlock({ num, name, tm, claim, body, flip, Mock, annot }) {
  return (
    <div className="lp-section-host grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16">
      <div className="lp-annot">{annot}</div>
      <div className={flip ? 'lg:order-2' : ''}>
        <div className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-gold/80">{num}</div>
        <h3 className="mt-3 font-display text-2xl font-bold text-ink sm:text-[2rem]">{name}<sup className="ml-0.5 align-super text-sm text-gold">{tm}</sup></h3>
        <div className="mt-2 font-head text-lg text-ink">{claim}</div>
        <p className="mt-4 text-lg leading-relaxed text-ink-2">{body}</p>
      </div>
      <div className={flip ? 'lg:order-1' : ''}><Mock /></div>
    </div>
  );
}

function SectionFeatures() {
  return (
    <section className="lp-section lp-section-host" data-section="features" data-screen-label="§5 Features">
      <div className="lp-annot">§5 · Features · Alternating L/R · Micro-UI per feature</div>
      <div className="lp-shell">
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,30rem)] lg:items-end">
          <div>
            <span className="lp-eyebrow">What others haven't built</span>
            <h2 className="lp-h2 mt-4">We didn't improve what existed.<br/>We built <em>what didn't.</em></h2>
          </div>
          <p className="lp-lead">
            Six category-creating features. Six reasons the market's giants are already behind. Everything here is live, shipping, and running in production.
          </p>
        </div>

        <div className="mt-8 divide-y divide-line">
          <FeatureBlock
            num="FEATURE · 01"
            name="KPI Pulse Engine"
            tm="™"
            claim="Real-time organisational heartbeat monitoring"
            body="Every KPI across every team, tracked live — with deviation scoring, trend velocity, and automated escalation routing. Not a static report. A living signal."
            Mock={PulseMock}
            annot="Feature #1 · Live data proof · motion in mock"
          />
          <FeatureBlock
            num="FEATURE · 02"
            name="Role-Reveal Dashboards"
            tm="™"
            claim="Your world unlocks when you log in"
            body="No generic dashboards. The platform reads your role, your team, your targets — and constructs your intelligence environment automatically. First login to full context in under 60 seconds."
            flip
            Mock={RoleRevealMock}
            annot="Feature #2 · Flip layout · Decision moment visualised"
          />
          <FeatureBlock
            num="FEATURE · 03"
            name="Automated Intelligence Dispatch"
            tm="™"
            claim="Reports that write and send themselves"
            body="Weekly summaries, monthly board packs, daily team briefings — written, formatted, and delivered automatically. No analyst required. No manual compiling. Ever."
            Mock={DispatchMock}
            annot="Feature #3 · Queue UI · ready-stamp = proof"
          />
          <FeatureBlock
            num="FEATURE · 04"
            name="Anomaly Root-Cause Engine"
            tm="™"
            claim="Not just what broke — but why"
            body="When a KPI drops, the platform doesn't just flag it. It traces back through correlated variables, surfaces the likely cause, and suggests the corrective action — before you even ask."
            flip
            Mock={AnomalyMock}
            annot="Feature #4 · Visual drop + trace rows"
          />
          <FeatureBlock
            num="FEATURE · 05"
            name="Performance DNA Score"
            tm="™"
            claim="A living profile for every contributor"
            body="A dynamic, multi-dimensional score built from KPI history, consistency, improvement velocity, and peer benchmarking. More honest than a rating. More actionable than a review."
            Mock={DnaMock}
            annot="Feature #5 · Radial score + axis bars"
          />
          <FeatureBlock
            num="FEATURE · 06"
            name="Automation Workflow Builder"
            tm="™"
            claim="If this KPI, then that action — no code required"
            body="Build intelligent automation pipelines visually. When a metric hits a threshold — trigger an alert, assign a task, update a report, notify a stakeholder. Automation that runs the operations layer for you."
            flip
            Mock={WorkflowMock}
            annot="Feature #6 · Vertical if/then/and nodes"
          />
        </div>
      </div>
    </section>
  );
}

// ---------- Section 6: Social proof ----------

function SectionProof() {
  return (
    <section className="lp-section lp-section--alt lp-section-host" data-section="proof" data-screen-label="§6 Proof">
      <div className="lp-annot">§6 · Proof · Founder guarantee pull-quote + terms bar</div>
      <div className="lp-shell">
        <div className="mx-auto max-w-3xl text-center">
          <span className="lp-eyebrow">Instead of a testimonial</span>
          <div className="mt-6 font-display text-6xl leading-none text-gold/40">&ldquo;</div>
          <blockquote className="mt-2 font-display text-[clamp(1.6rem,3vw,2.6rem)] font-medium leading-snug text-ink">
            If you don&rsquo;t find at least one fix worth more than the fee, <em className="italic text-gold">I&rsquo;ll refund it</em>.
          </blockquote>
          <span className="mt-5 block font-head text-sm uppercase tracking-wide text-ink-3">Ashu · Founder, The KPI Hub · Delhi</span>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {['48-Hour Turnaround', '₹2,999 · One-Time', 'No Retainer, No Lock-In', 'Money-Back Guarantee'].map((t) => (
            <div key={t} className="flex items-center gap-2.5 rounded-md border border-line bg-card/60 px-4 py-3 text-sm text-ink-2">
              <span className="text-gold">&#10022;</span><span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { SectionFeatures, SectionProof });
