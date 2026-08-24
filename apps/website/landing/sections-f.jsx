/* global React */
// Founder section + Email capture CTA strip

function SectionFounder() {
  return (
    <section className="lp-section lp-section-host" data-section="founder" data-screen-label="§9½ Founder">
      <div className="lp-annot">§9½ · Founder · Origin story · Trust by face</div>
      <div className="lp-section-inner">
        <div className="lp-founder">
          <div className="lp-founder-portrait" aria-hidden="true">HS</div>
          <div>
            <span className="lp-section-eyebrow">Built by an operator, not an agency</span>
            <div className="lp-founder-quote">
              "I spent ten years watching teams drown in dashboards no one read. The KPI Hub is the platform I wish I'd had — <em>decision-grade intelligence,</em> zero fluff."
            </div>
            <div className="lp-founder-attr">
              <strong>Himanshu Sharma</strong> · Founder &amp; CEO · TheKPIHub.com
            </div>
            <div className="lp-founder-tags">
              <span className="lp-founder-tag">Top 300 India Builder · VibeCon 2025</span>
              <span className="lp-founder-tag">Ex-Cloud Engineer</span>
              <span className="lp-founder-tag">Made in Delhi</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionCapture({ ctaGoal = 'free' }) {
  const labels = {
    free: 'Get Started',
    waitlist: 'Join Waitlist',
    demo: 'Request Demo',
  };
  return (
    <section className="lp-section lp-section--alt lp-section-host" data-section="capture" data-screen-label="§9¾ Capture">
      <div className="lp-annot">§9¾ · Email capture · low-friction conversion</div>
      <div className="lp-section-inner" style={{ textAlign: 'center', maxWidth: 720 }}>
        <span className="lp-section-eyebrow" style={{ justifyContent: 'center' }}>Stay close to the launch</span>
        <h2 className="lp-section-title" style={{ marginBottom: 18 }}>
          One email. <em>No noise.</em>
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-2)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.6 }}>
          Get the next product release, the next benchmark drop, the next intelligence dispatch — direct from the build.
        </p>
        <form className="lp-capture" onSubmit={(e) => e.preventDefault()}>
          <input className="lp-capture-input" type="email" placeholder="you@company.com" required />
          <button className="lp-capture-btn" type="submit">{labels[ctaGoal] || labels.free}</button>
        </form>
        <div className="lp-capture-note">No spam · unsubscribe in one click · we never share your address</div>
      </div>
    </section>
  );
}

Object.assign(window, { SectionFounder, SectionCapture });
