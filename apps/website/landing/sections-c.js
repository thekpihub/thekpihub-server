/* global React */
// Section 7: How it works · Section 8: Pricing · Section 9: Final CTA · Section 10: Footer

function SectionHow() {
  const steps = [{
    n: '1',
    title: 'Create Your Account',
    body: 'Register at TheKPIHub.com. Select your role. Set your organization context.'
  }, {
    n: '2',
    title: 'Your Dashboard Activates',
    body: 'The platform constructs your role-intelligent command center automatically. No setup wizard. No configuration maze.'
  }, {
    n: '3',
    title: 'Connect Your KPIs',
    body: 'Input your targets, import your data, or let your team populate their own metrics. The platform maps everything in real time.'
  }, {
    n: '4',
    title: 'Intelligence Takes Over',
    body: 'Automated reports dispatch. Anomalies get flagged. Performance scores update live. You stop managing data — and start making decisions.'
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section-host",
    "data-section": "how",
    "data-screen-label": "\xA77 How"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA77 \xB7 How it works \xB7 4-step \xB7 Kill the \"but how\" objection"), /*#__PURE__*/React.createElement("div", {
    className: "lp-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid gap-6 lg:grid-cols-[1fr_minmax(0,30rem)] lg:items-end"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "lp-eyebrow"
  }, "Up and running in minutes"), /*#__PURE__*/React.createElement("h2", {
    className: "lp-h2 mt-4"
  }, "Register. Log in.", /*#__PURE__*/React.createElement("br", null), "Your intelligence platform is ", /*#__PURE__*/React.createElement("em", null, "already built."))), /*#__PURE__*/React.createElement("p", {
    className: "lp-lead"
  }, "No onboarding specialist. No 6-week implementation. No professional-services quote. The platform is built the moment you arrive.")), /*#__PURE__*/React.createElement("div", {
    className: "mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
  }, steps.map(s => /*#__PURE__*/React.createElement("div", {
    className: "lp-card",
    key: s.n
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex h-10 w-10 items-center justify-center rounded-pill border border-gold/30 bg-gold-soft font-display text-lg font-bold text-gold"
  }, s.n), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 font-head text-lg font-semibold text-ink"
  }, s.title), /*#__PURE__*/React.createElement("p", {
    className: "mt-2 text-sm leading-relaxed text-ink-2"
  }, s.body))))));
}
function SectionPricing() {
  const tiers = [{
    name: 'KPI Audit Lite',
    for: 'For founders and operators who want a clear picture of their KPIs.',
    tag: '₹2,999 · one-time',
    pop: true,
    badge: 'Start Here',
    cta: 'Get My Audit',
    href: 'get-audit.html',
    feats: ['Comprehensive KPI audit report', 'Competitive benchmarking analysis', 'Growth lever identification', 'Remediation roadmap (30-page)', '1:1 60-min remediation call']
  }, {
    name: 'Growth',
    for: 'Ongoing KPI tracking & monthly intelligence for growing teams.',
    tag: '₹5,999 / mo',
    pop: false,
    cta: 'Upgrade to Growth →',
    href: 'upgrade.html',
    feats: ['Monthly KPI intelligence feed', 'Ongoing benchmarking updates', 'AI synthesis reports', 'Slack integration', 'Quarterly strategy calls', 'Priority support']
  }, {
    name: 'Enterprise',
    for: 'White-glove intelligence for scale-ups & PE/VC-backed companies.',
    tag: 'Custom pricing · contact sales',
    pop: false,
    cta: 'Contact Us',
    href: 'contact.html',
    feats: ['Everything in Growth, plus:', 'White-label reports', 'Full API access', 'Dedicated success manager', 'Custom integrations', 'SLA guarantees']
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section--alt lp-section-host",
    "data-section": "pricing",
    "data-screen-label": "\xA78 Pricing"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA78 \xB7 Pricing \xB7 3 tiers \xB7 Growth highlighted"), /*#__PURE__*/React.createElement("div", {
    className: "lp-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto max-w-3xl text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-eyebrow"
  }, "Simple pricing. Serious intelligence."), /*#__PURE__*/React.createElement("h2", {
    className: "lp-h2 mt-4"
  }, "One audit, priced once. ", /*#__PURE__*/React.createElement("em", null, "No retainer, no lock-in.")), /*#__PURE__*/React.createElement("p", {
    className: "lp-lead mx-auto mt-5 max-w-2xl"
  }, "The \u20B92,999 KPI Audit and the \u20B95,999/mo Growth plan are both live today. Enterprise is custom pricing \u2014 reach out and we\u2019ll talk through your needs.")), /*#__PURE__*/React.createElement("div", {
    className: "mt-12 grid items-start gap-6 lg:grid-cols-3"
  }, tiers.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.name,
    className: `relative flex h-full flex-col rounded-lg border bg-card/80 p-7 ${t.pop ? 'border-gold/60 shadow-gold-glow lg:-mt-2 lg:mb-2' : 'border-line'}`
  }, t.badge && /*#__PURE__*/React.createElement("span", {
    className: "absolute -top-3 left-7 rounded-pill bg-gold px-3 py-1 font-head text-xs font-bold uppercase tracking-wide text-bg"
  }, t.badge), /*#__PURE__*/React.createElement("div", {
    className: "font-display text-2xl font-bold text-ink"
  }, t.name), /*#__PURE__*/React.createElement("div", {
    className: "mt-1 text-sm text-ink-2"
  }, t.for), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 font-mono text-xs uppercase tracking-wide text-gold/80"
  }, t.tag), /*#__PURE__*/React.createElement("ul", {
    className: "mt-6 flex-1 space-y-3 text-sm text-ink-2"
  }, t.feats.map((f, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    className: "flex gap-2.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-gold"
  }, "\u2726"), /*#__PURE__*/React.createElement("span", null, f)))), /*#__PURE__*/React.createElement("a", {
    href: t.href,
    className: `mt-7 w-full ${t.pop ? 'lp-btn-primary' : 'lp-btn-ghost'}`
  }, t.cta)))), /*#__PURE__*/React.createElement("div", {
    className: "mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ink-3"
  }, /*#__PURE__*/React.createElement("span", null, "48-hour turnaround"), /*#__PURE__*/React.createElement("span", null, "No retainer, no lock-in"), /*#__PURE__*/React.createElement("span", null, "Money-back guarantee on the audit"))));
}
function SectionClose({
  ctaGoal = 'free',
  onCtaClick
}) {
  const labels = {
    audit: 'Get My KPI Audit → ₹2,999',
    free: 'Create Your Free Account →',
    waitlist: 'Claim Your Early Access →',
    demo: 'Book a Demo →'
  };
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section-host relative overflow-hidden",
    "data-section": "close",
    "data-screen-label": "\xA79 Close"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA79 \xB7 Final CTA \xB7 Conviction close \xB7 single action"), /*#__PURE__*/React.createElement("div", {
    className: "hero-glow",
    style: {
      opacity: 0.6
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "lp-shell relative z-[1]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto max-w-3xl text-center"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-display text-[clamp(2rem,4.4vw,3.4rem)] font-bold leading-tight tracking-[-0.02em] text-ink [&_em]:italic [&_em]:text-gold"
  }, "Your competitors are still building ", /*#__PURE__*/React.createElement("em", null, "spreadsheets."), /*#__PURE__*/React.createElement("br", null), "You could be running ", /*#__PURE__*/React.createElement("em", null, "intelligence.")), /*#__PURE__*/React.createElement("p", {
    className: "mt-6 text-lg leading-relaxed text-ink-2"
  }, "TheKPIHub.com is live. Your dashboard is waiting.", /*#__PURE__*/React.createElement("br", null), "The only thing missing is you."), /*#__PURE__*/React.createElement("div", {
    className: "mt-9 flex justify-center"
  }, /*#__PURE__*/React.createElement("button", {
    className: "lp-btn-primary px-9 py-4 text-base",
    onClick: () => onCtaClick && onCtaClick('primary')
  }, labels[ctaGoal] || labels.free)), /*#__PURE__*/React.createElement("div", {
    className: "mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-ink-3"
  }, /*#__PURE__*/React.createElement("span", null, "No credit card"), /*#__PURE__*/React.createElement("span", null, "No setup fee"), /*#__PURE__*/React.createElement("span", null, "No complexity"), /*#__PURE__*/React.createElement("span", null, "Just performance intelligence \u2014 from the moment you log in")))));
}
function SectionFooter() {
  // Every href below is a page that returns 200 on production (verified 2026-08-15).
  // Do not add a link here before the destination is live — a 404 is worse than no link.
  const cols = [{
    title: 'Product',
    items: [{
      label: 'Platform',
      href: '#platform'
    }, {
      label: 'Roles',
      href: '#personas'
    }, {
      label: 'Features',
      href: '#features'
    }, {
      label: 'Pricing',
      href: 'pricing.html'
    }, {
      label: 'Dashboard',
      href: 'dashboard.html'
    }, {
      label: 'Integrations',
      href: 'account/integrations.html'
    }]
  }, {
    title: 'Intelligence',
    items: [{
      label: 'Signal Feed',
      href: 'intelligence.html'
    }, {
      label: 'KPI Benchmarks',
      href: 'benchmarks.html'
    }, {
      label: 'India Benchmarks',
      href: 'india-benchmarks.html'
    }, {
      label: 'SaaS Directory',
      href: 'directory.html'
    }, {
      label: 'Blog',
      href: 'blog.html'
    }]
  }, {
    title: 'Free Tools',
    items: [{
      label: 'KPI Auditor',
      href: 'auditor.html'
    }, {
      label: 'Idea Validator',
      href: 'validator.html'
    }, {
      label: 'Stack Scorer',
      href: 'stack-scorer.html'
    }, {
      label: 'Cohort Benchmarking',
      href: 'cohort.html'
    }, {
      label: 'Narrative Engine',
      href: 'narrative.html'
    }, {
      label: 'Freedom Dashboard',
      href: 'freedom.html'
    }, {
      label: "Today's Directive",
      href: 'today.html'
    }]
  }, {
    title: 'Company',
    items: [{
      label: 'About',
      href: 'about.html'
    }, {
      label: 'Contact',
      href: 'contact.html'
    }, {
      label: 'Updates',
      href: 'updates.html'
    }, {
      label: 'Create account',
      href: 'register.html'
    }, {
      label: 'Get a KPI audit',
      href: 'get-audit.html'
    }, {
      label: 'Site map',
      href: 'sitemap.html'
    }]
  }];
  const legal = [{
    label: 'Privacy Policy',
    href: 'privacy.html'
  }, {
    label: 'Terms of Service',
    href: 'terms.html'
  }, {
    label: 'Cookie Policy',
    href: 'cookies.html'
  }];
  return /*#__PURE__*/React.createElement("footer", {
    className: "footer lp-section-host border-t border-line py-16",
    "data-section": "footer",
    "data-screen-label": "\xA710 Footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA710 \xB7 Footer \xB7 Dark, minimal, 4 columns"), /*#__PURE__*/React.createElement("div", {
    className: "lp-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid gap-10 sm:grid-cols-2 lg:grid-cols-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "logo mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "logo-dot"
  }), /*#__PURE__*/React.createElement("div", {
    className: "logo-text"
  }, "The", /*#__PURE__*/React.createElement("span", null, "KPI"), "Hub")), /*#__PURE__*/React.createElement("p", {
    className: "max-w-xs text-sm leading-relaxed text-ink-3"
  }, "Intelligence for every layer of your organization. Made with \u2615 in Delhi, India.")), cols.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.title
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-4 font-head text-xs font-bold uppercase tracking-[0.14em] text-gold"
  }, c.title), /*#__PURE__*/React.createElement("ul", {
    className: "flex flex-col gap-2.5"
  }, c.items.map(i => /*#__PURE__*/React.createElement("li", {
    key: i.href
  }, /*#__PURE__*/React.createElement("a", {
    href: i.href,
    className: "text-sm text-ink-2 transition-colors hover:text-gold"
  }, i.label))))))), /*#__PURE__*/React.createElement("div", {
    className: "mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-7"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-ink-3"
  }, "TheKPIHub.com \u2014 ", /*#__PURE__*/React.createElement("span", {
    className: "text-ink-2"
  }, "Intelligence for Every Layer of Your Organization.")), /*#__PURE__*/React.createElement("span", {
    className: "flex flex-wrap items-center gap-4"
  }, legal.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.href,
    href: l.href,
    className: "text-xs text-ink-3 transition-colors hover:text-gold"
  }, l.label)), /*#__PURE__*/React.createElement("span", {
    className: "font-mono text-xs tracking-wide text-ink-3"
  }, "\xA9 2026 The KPI HUB. All rights reserved.")))));
}
Object.assign(window, {
  SectionHow,
  SectionPricing,
  SectionClose,
  SectionFooter
});