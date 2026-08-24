/* global React */
// Section 7: How it works · Section 8: Pricing · Section 9: Final CTA · Section 10: Footer

function SectionHow() {
  const steps = [
    { n: '1', title: 'Create Your Account', body: 'Register at TheKPIHub.com. Select your role. Set your organization context.' },
    { n: '2', title: 'Your Dashboard Activates', body: 'The platform constructs your role-intelligent command center automatically. No setup wizard. No configuration maze.' },
    { n: '3', title: 'Connect Your KPIs', body: 'Input your targets, import your data, or let your team populate their own metrics. The platform maps everything in real time.' },
    { n: '4', title: 'Intelligence Takes Over', body: 'Automated reports dispatch. Anomalies get flagged. Performance scores update live. You stop managing data — and start making decisions.' },
  ];
  return (
    <section className="lp-section lp-section-host" data-section="how" data-screen-label="§7 How">
      <div className="lp-annot">§7 · How it works · 4-step · Kill the "but how" objection</div>
      <div className="lp-shell">
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,30rem)] lg:items-end">
          <div>
            <span className="lp-eyebrow">Up and running in minutes</span>
            <h2 className="lp-h2 mt-4">Register. Log in.<br/>Your intelligence platform is <em>already built.</em></h2>
          </div>
          <p className="lp-lead">
            No onboarding specialist. No 6-week implementation. No professional-services quote. The platform is built the moment you arrive.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div className="lp-card" key={s.n}>
              <div className="flex h-10 w-10 items-center justify-center rounded-pill border border-gold/30 bg-gold-soft font-display text-lg font-bold text-gold">{s.n}</div>
              <div className="mt-4 font-head text-lg font-semibold text-ink">{s.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionPricing() {
  const tiers = [
    {
      name: 'KPI Audit Lite',
      for: 'For founders and operators who want a clear picture of their KPIs.',
      tag: '₹2,999 · one-time',
      pop: true,
      badge: 'Start Here',
      cta: 'Get My Audit',
      href: 'get-audit.html',
      feats: [
        'Comprehensive KPI audit report',
        'Competitive benchmarking analysis',
        'Growth lever identification',
        'Remediation roadmap (30-page)',
        '1:1 60-min remediation call',
      ],
    },
    {
      name: 'Growth',
      for: 'Ongoing KPI tracking & monthly intelligence for growing teams.',
      tag: '₹5,999 / mo · coming Q3 2026',
      pop: false,
      cta: 'Express Interest',
      href: 'get-audit.html',
      feats: [
        'Monthly KPI intelligence feed',
        'Ongoing benchmarking updates',
        'AI synthesis reports',
        'Slack integration',
        'Quarterly strategy calls',
        'Priority support',
      ],
    },
    {
      name: 'Enterprise',
      for: 'White-glove intelligence for scale-ups & PE/VC-backed companies.',
      tag: 'Custom pricing · contact sales',
      pop: false,
      cta: 'Contact Us',
      href: 'contact.html',
      feats: [
        'Everything in Growth, plus:',
        'White-label reports',
        'Full API access',
        'Dedicated success manager',
        'Custom integrations',
        'SLA guarantees',
      ],
    },
  ];
  return (
    <section className="lp-section lp-section--alt lp-section-host" data-section="pricing" data-screen-label="§8 Pricing">
      <div className="lp-annot">§8 · Pricing · 3 tiers · Growth highlighted</div>
      <div className="lp-shell">
        <div className="mx-auto max-w-3xl text-center">
          <span className="lp-eyebrow">Simple pricing. Serious intelligence.</span>
          <h2 className="lp-h2 mt-4">One audit, priced once. <em>No retainer, no lock-in.</em></h2>
          <p className="lp-lead mx-auto mt-5 max-w-2xl">
            The ₹2,999 KPI Audit is live today — it is the only plan you can buy right now. Growth and Enterprise are still being built; register interest and you&rsquo;ll hear first.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.name} className={`relative flex h-full flex-col rounded-lg border bg-card/80 p-7 ${t.pop ? 'border-gold/60 shadow-gold-glow lg:-mt-2 lg:mb-2' : 'border-line'}`}>
              {t.badge && <span className="absolute -top-3 left-7 rounded-pill bg-gold px-3 py-1 font-head text-xs font-bold uppercase tracking-wide text-bg">{t.badge}</span>}
              <div className="font-display text-2xl font-bold text-ink">{t.name}</div>
              <div className="mt-1 text-sm text-ink-2">{t.for}</div>
              <div className="mt-3 font-mono text-xs uppercase tracking-wide text-gold/80">{t.tag}</div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-ink-2">
                {t.feats.map((f, i) => (
                  <li key={i} className="flex gap-2.5"><span className="text-gold">&#10022;</span><span>{f}</span></li>
                ))}
              </ul>
              <a href={t.href} className={`mt-7 w-full ${t.pop ? 'lp-btn-primary' : 'lp-btn-ghost'}`}>{t.cta}</a>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ink-3">
          <span>48-hour turnaround</span><span>No retainer, no lock-in</span><span>Money-back guarantee on the audit</span>
        </div>
      </div>
    </section>
  );
}

function SectionClose({ ctaGoal = 'free', onCtaClick }) {
  const labels = {
    audit: 'Get My KPI Audit → ₹2,999',
    free: 'Create Your Free Account →',
    waitlist: 'Claim Your Early Access →',
    demo: 'Book a Demo →',
  };
  return (
    <section className="lp-section lp-section-host relative overflow-hidden" data-section="close" data-screen-label="§9 Close">
      <div className="lp-annot">§9 · Final CTA · Conviction close · single action</div>
      <div className="hero-glow" style={{ opacity: 0.6 }} />
      <div className="lp-shell relative z-[1]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] font-bold leading-tight tracking-[-0.02em] text-ink [&_em]:italic [&_em]:text-gold">
            Your competitors are still building <em>spreadsheets.</em><br/>
            You could be running <em>intelligence.</em>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-2">
            TheKPIHub.com is live. Your dashboard is waiting.<br/>
            The only thing missing is you.
          </p>
          <div className="mt-9 flex justify-center">
            <button className="lp-btn-primary px-9 py-4 text-base" onClick={() => onCtaClick && onCtaClick('primary')}>
              {labels[ctaGoal] || labels.free}
            </button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-ink-3">
            <span>No credit card</span><span>No setup fee</span><span>No complexity</span>
            <span>Just performance intelligence — from the moment you log in</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionFooter() {
  // Every href below is a page that returns 200 on production (verified 2026-08-15).
  // Do not add a link here before the destination is live — a 404 is worse than no link.
  const cols = [
    { title: 'Product', items: [
      { label: 'Platform',     href: '#platform' },
      { label: 'Roles',        href: '#personas' },
      { label: 'Features',     href: '#features' },
      { label: 'Pricing',      href: 'pricing.html' },
      { label: 'Dashboard',    href: 'dashboard.html' },
      { label: 'Integrations', href: 'account/integrations.html' },
    ] },
    { title: 'Intelligence', items: [
      { label: 'Signal Feed',      href: 'intelligence.html' },
      { label: 'KPI Benchmarks',   href: 'benchmarks.html' },
      { label: 'India Benchmarks', href: 'india-benchmarks.html' },
      { label: 'SaaS Directory',   href: 'directory.html' },
      { label: 'Blog',             href: 'blog.html' },
    ] },
    { title: 'Free Tools', items: [
      { label: 'KPI Auditor',         href: 'auditor.html' },
      { label: 'Idea Validator',      href: 'validator.html' },
      { label: 'Stack Scorer',        href: 'stack-scorer.html' },
      { label: 'Cohort Benchmarking', href: 'cohort.html' },
      { label: 'Narrative Engine',    href: 'narrative.html' },
      { label: 'Freedom Dashboard',   href: 'freedom.html' },
      { label: "Today's Directive",   href: 'today.html' },
    ] },
    { title: 'Company', items: [
      { label: 'About',           href: 'about.html' },
      { label: 'Contact',         href: 'contact.html' },
      { label: 'Updates',         href: 'updates.html' },
      { label: 'Create account',  href: 'register.html' },
      { label: 'Get a KPI audit', href: 'get-audit.html' },
      { label: 'Site map',        href: 'sitemap.html' },
    ] },
  ];
  const legal = [
    { label: 'Privacy Policy',   href: 'privacy.html' },
    { label: 'Terms of Service', href: 'terms.html' },
    { label: 'Cookie Policy',    href: 'cookies.html' },
  ];
  return (
    <footer className="footer lp-section-host border-t border-line py-16" data-section="footer" data-screen-label="§10 Footer">
      <div className="lp-annot">§10 · Footer · Dark, minimal, 4 columns</div>
      <div className="lp-shell">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="logo mb-4">
              <div className="logo-dot" />
              <div className="logo-text">The<span>KPI</span>Hub</div>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-ink-3">
              Intelligence for every layer of your organization. Made with ☕ in Delhi, India.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="mb-4 font-head text-xs font-bold uppercase tracking-[0.14em] text-gold">{c.title}</div>
              <ul className="flex flex-col gap-2.5">
                {c.items.map((i) => (
                  <li key={i.href}>
                    <a href={i.href} className="text-sm text-ink-2 transition-colors hover:text-gold">{i.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-7">
          <span className="text-sm text-ink-3">
            TheKPIHub.com — <span className="text-ink-2">Intelligence for Every Layer of Your Organization.</span>
          </span>
          <span className="flex flex-wrap items-center gap-4">
            {legal.map((l) => (
              <a key={l.href} href={l.href} className="text-xs text-ink-3 transition-colors hover:text-gold">{l.label}</a>
            ))}
            <span className="font-mono text-xs tracking-wide text-ink-3">© 2026 The KPI HUB. All rights reserved.</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { SectionHow, SectionPricing, SectionClose, SectionFooter });
