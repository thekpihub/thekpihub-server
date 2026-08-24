/* global React, ReactDOM, Hero, SectionTicker, SectionProblem, SectionPlatform, SectionPersonas, SectionMetricStrip, SectionFeatures, SectionPipeline, SectionProof, SectionCompare, SectionHow, SectionIntegrations, SectionPricing, SectionFaq, SectionFounder, SectionCapture, SectionClose, SectionFooter */

function App() {
  const heroVariant = "direct";
  const ctaGoal = "audit";

  React.useEffect(() => {
    const els = document.querySelectorAll('.lp-section-host');
    els.forEach(el => el.classList.add('lp-reveal'));
    const hero = document.querySelector('.lp-section-host[data-section="hero"]');
    hero?.classList.add('is-visible');

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible'); });
    }, { threshold: 0.05, rootMargin: '0px 0px -10% 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const onCtaClick = (target) => {
    if (target === 'primary') {
      window.location.href = '/get-audit.html';
      return;
    }

    if (target === 'secondary') {
      window.location.href = '/auditor.html';
      return;
    }

    document.getElementById('close-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Hero variant={heroVariant} ctaGoal={ctaGoal} onCtaClick={onCtaClick} />
      <SectionTicker />
      <SectionProblem />
      <SectionPlatform />
      <SectionPersonas />
      <SectionMetricStrip />
      <SectionFeatures />
      <SectionPipeline />
      <SectionProof />
      <SectionCompare />
      <SectionHow />
      <SectionIntegrations />
      <SectionPricing />
      <SectionFaq />
      <SectionFounder />
      <SectionCapture ctaGoal={ctaGoal} />
      <div id="close-section" />
      <SectionClose ctaGoal={ctaGoal} onCtaClick={onCtaClick} />
      <SectionFooter />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
