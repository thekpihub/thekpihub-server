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
    <section className="section lp-section-host" data-section="how" data-screen-label="§7 How">
      <div className="lp-annot">§7 · How it works · 4-step · Kill the "but how" objection</div>
      <div className="section-inner">
        <div className="section-head">
          <div>
            <span className="eyebrow">Up and running in minutes</span>
            <h2>Register. Log in.<br/>Your intelligence platform is <em>already built.</em></h2>
          </div>
          <p className="section-head-sub">
            No onboarding specialist. No 6-week implementation. No professional-services quote. The platform is built the moment you arrive.
          </p>
        </div>

        <div className="lp-how">
          {steps.map((s) => (
            <div className="lp-how-step" key={s.n}>
              <div className="lp-how-num">{s.n}</div>
              <div className="lp-how-title">{s.title}</div>
              <p className="lp-how-body">{s.body}</p>
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
      name: 'Starter',
      for: 'For small teams getting started.',
      tag: 'Pricing — TBD at launch',
      pop: false,
      cta: 'Start Free',
      feats: [
        'Up to 5 seats · 1 organization',
        'All 4 role-intelligent dashboards',
        'KPI Pulse Engine™ · live tracking',
        'Automated weekly digests',
        'Community support',
      ],
    },
    {
      name: 'Growth',
      for: 'For scaling teams who run on performance.',
      tag: 'Pricing — TBD at launch',
      pop: true,
      cta: 'Start Growth Trial',
      feats: [
        'Up to 50 seats · multi-team',
        'Everything in Starter, plus:',
        'Anomaly Root-Cause Engine™',
        'Performance DNA Score™',
        'Automated Intelligence Dispatch',
        'Priority email + chat support',
      ],
    },
    {
      name: 'Enterprise',
      for: 'For organizations that need the full intelligence infrastructure.',
      tag: 'Pricing — custom · contact sales',
      pop: false,
      cta: 'Talk to Sales',
      feats: [
        'Unlimited seats · SSO · audit logs',
        'Everything in Growth, plus:',
        'Automation Workflow Builder™',
        'Custom KPI formula APIs',
        'Dedicated intelligence architect',
        'SLAs · procurement · security review',
      ],
    },
  ];
  return (
    <section className="section alt lp-section-host" data-section="pricing" data-screen-label="§8 Pricing">
      <div className="lp-annot">§8 · Pricing · 3 tiers · Growth highlighted</div>
      <div className="section-inner">
        <div className="section-head">
          <div>
            <span className="eyebrow">Simple pricing. Serious intelligence.</span>
            <h2>Every plan comes with the full<br/>intelligence engine. You just <em>scale the seats.</em></h2>
          </div>
          <p className="section-head-sub">
            No feature-fencing. No upgrade-to-unlock. Every Performance DNA score, every Pulse metric, every automation — available from the first login.
          </p>
        </div>

        <div className="lp-price">
          {tiers.map((t) => (
            <div key={t.name} className={`lp-price-card ${t.pop ? 'lp-price-card--pop' : ''}`}>
              {t.pop && <span className="lp-price-flag">Most Popular</span>}
              <div className="lp-price-name">{t.name}</div>
              <div className="lp-price-for">{t.for}</div>
              <div className="lp-price-tag">{t.tag}</div>
              <ul className="lp-price-list">
                {t.feats.map((f, i) => (
                  <li key={i}><span className="lp-price-check">✦</span>{f}</li>
                ))}
              </ul>
              <button className="lp-price-btn">{t.cta}</button>
            </div>
          ))}
        </div>

        <div className="lp-price-notes">
          <span>No hidden fees</span>
          <span>Cancel anytime</span>
          <span>Full platform access from day one</span>
        </div>
      </div>
    </section>
  );
}

function SectionClose({ ctaGoal = 'free', onCtaClick }) {
  const labels = {
    free: 'Create Your Free Account →',
    waitlist: 'Claim Your Early Access →',
    demo: 'Book a Demo →',
  };
  return (
    <section className="section lp-section-host" data-section="close" data-screen-label="§9 Close" style={{ position: 'relative' }}>
      <div className="lp-annot">§9 · Final CTA · Conviction close · single action</div>
      <div className="hero-glow" style={{ opacity: 0.6 }} />
      <div className="section-inner" style={{ position: 'relative', zIndex: 1 }}>
        <div className="lp-close">
          <h2 className="lp-close-title">
            Your competitors are still building <em>spreadsheets.</em><br/>
            You could be running <em>intelligence.</em>
          </h2>
          <p className="lp-close-sub">
            TheKPIHub.com is live. Your dashboard is waiting.<br/>
            The only thing missing is you.
          </p>
          <div className="lp-close-btn-wrap">
            <button className="btn-primary" onClick={() => onCtaClick && onCtaClick('close')} style={{ fontSize: '0.82rem', padding: '16px 36px' }}>
              {labels[ctaGoal] || labels.free}
            </button>
          </div>
          <div className="lp-close-note">
            <span>No credit card</span>
            <span>No setup fee</span>
            <span>No complexity</span>
            <span>Just performance intelligence — from the moment you log in</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionFooter() {
  const cols = [
    { title: 'Product',  items: ['Features', 'Dashboards', 'Pricing', 'Roadmap'] },
    { title: 'Company',  items: ['About', 'Blog', 'Careers', 'Press'] },
    { title: 'Support',  items: ['Documentation', 'Help Center', 'Contact'] },
    { title: 'Legal',    items: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
  ];
  return (
    <footer className="footer lp-section-host" data-section="footer" data-screen-label="§10 Footer">
      <div className="lp-annot">§10 · Footer · Dark, minimal, 4 columns</div>
      <div className="footer-inner">
        <div className="lp-foot-cols">
          <div>
            <div className="logo" style={{ marginBottom: 18 }}>
              <div className="logo-dot" />
              <div className="logo-text">The<span>KPI</span>Hub</div>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-3)', lineHeight: 1.7, maxWidth: 300 }}>
              Intelligence for every layer of your organization. Made with ☕ in Delhi, India.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 18 }}>
                {c.title}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {c.items.map((i) => (
                  <li key={i}>
                    <a href="#" style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: 'var(--text-2)', textDecoration: 'none' }}>{i}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 56, paddingTop: 28, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.86rem', color: 'var(--text-3)' }}>
            TheKPIHub.com — <span style={{ color: 'var(--text-2)' }}>Intelligence for Every Layer of Your Organization.</span>
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-3)', letterSpacing: '0.04em' }}>
            © 2025 The KPI HUB. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { SectionHow, SectionPricing, SectionClose, SectionFooter });
