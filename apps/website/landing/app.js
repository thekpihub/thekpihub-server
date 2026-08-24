/* global React, ReactDOM, Hero, SectionTicker, SectionProblem, SectionPlatform, SectionPersonas, SectionMetricStrip, SectionFeatures, SectionPipeline, SectionProof, SectionCompare, SectionHow, SectionIntegrations, SectionPricing, SectionFaq, SectionFounder, SectionCapture, SectionClose, SectionFooter */

function App() {
  const heroVariant = "direct";
  const ctaGoal = "audit";
  React.useEffect(() => {
    const els = document.querySelectorAll('.lp-section-host');
    els.forEach(el => el.classList.add('lp-reveal'));
    const hero = document.querySelector('.lp-section-host[data-section="hero"]');
    hero?.classList.add('is-visible');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('is-visible');
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -10% 0px'
    });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  const onCtaClick = target => {
    if (target === 'primary') {
      window.location.href = '/get-audit.html';
      return;
    }
    if (target === 'secondary') {
      window.location.href = '/auditor.html';
      return;
    }
    document.getElementById('close-section')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Hero, {
    variant: heroVariant,
    ctaGoal: ctaGoal,
    onCtaClick: onCtaClick
  }), /*#__PURE__*/React.createElement(SectionTicker, null), /*#__PURE__*/React.createElement(SectionProblem, null), /*#__PURE__*/React.createElement(SectionPlatform, null), /*#__PURE__*/React.createElement(SectionPersonas, null), /*#__PURE__*/React.createElement(SectionMetricStrip, null), /*#__PURE__*/React.createElement(SectionFeatures, null), /*#__PURE__*/React.createElement(SectionPipeline, null), /*#__PURE__*/React.createElement(SectionProof, null), /*#__PURE__*/React.createElement(SectionCompare, null), /*#__PURE__*/React.createElement(SectionHow, null), /*#__PURE__*/React.createElement(SectionIntegrations, null), /*#__PURE__*/React.createElement(SectionPricing, null), /*#__PURE__*/React.createElement(SectionFaq, null), /*#__PURE__*/React.createElement(SectionFounder, null), /*#__PURE__*/React.createElement(SectionCapture, {
    ctaGoal: ctaGoal
  }), /*#__PURE__*/React.createElement("div", {
    id: "close-section"
  }), /*#__PURE__*/React.createElement(SectionClose, {
    ctaGoal: ctaGoal,
    onCtaClick: onCtaClick
  }), /*#__PURE__*/React.createElement(SectionFooter, null));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));