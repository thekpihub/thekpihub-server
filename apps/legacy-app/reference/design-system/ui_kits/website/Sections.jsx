const Nav = ({ onMenu }) => (
  <nav className="kh-nav">
    <Logo />
    <ul className="kh-nav-links">
      <li><a href="#intelligence">Intelligence</a></li>
      <li><a href="#how">How It Works</a></li>
      <li><a href="#features">Features</a></li>
      <li><a href="#pricing">Pricing</a></li>
    </ul>
    <div className="kh-nav-right">
      <button className="kh-nav-btn">Get Early Access</button>
    </div>
  </nav>
);

const CredibilityBar = () => (
  <div className="kh-cred">
    <span className="kh-cred-dot" />
    <p>Selected &mdash; India&rsquo;s Top 300 Builders &nbsp;&middot;&nbsp; VibeCon 2025 &nbsp;&middot;&nbsp; YC &times; Anthropic &times; Lightspeed &times; Razorpay</p>
    <span className="kh-cred-dot" />
  </div>
);

const Hero = ({ onCta }) => (
  <section className="kh-hero">
    <div className="kh-hero-grid" />
    <div className="kh-hero-glow" />

    <div className="kh-float-cards">
      <div className="kh-fcard" style={{ top: "22%", left: "5%" }}>
        <KpiCard label="MRR Growth" value="+34.2%" delta="↑ vs last quarter" tone="up" />
      </div>
      <div className="kh-fcard" style={{ top: "28%", right: "5%" }}>
        <KpiCard label="Churn Rate" value="−12.8%" delta="↓ industry avg" tone="down" />
      </div>
      <div className="kh-fcard" style={{ bottom: "26%", left: "7%" }}>
        <KpiCard label="CAC Payback" value="8 months" delta="Best-in-class" />
      </div>
      <div className="kh-fcard" style={{ bottom: "22%", right: "6%" }}>
        <KpiCard label="NPS Score" value="72" delta="↑ Top decile" tone="up" />
      </div>
    </div>

    <div className="kh-hero-content">
      <Badge tone="gold" withDot>AI-Powered SaaS Intelligence Platform</Badge>
      <h1 className="kh-hero-h1">
        <em>Decision-Grade</em> Intelligence.
        <span className="kh-hero-line2">Zero Fluff.</span>
      </h1>
      <p className="kh-hero-sub">
        The KPI Hub synthesizes real-time SaaS industry intelligence into actionable insights —
        so you evaluate faster, decide smarter, and scale with confidence.
      </p>
      <div className="kh-hero-actions">
        <ButtonPrimary onClick={onCta}>Get Early Access</ButtonPrimary>
        <ButtonGhost href="#how">See How It Works →</ButtonGhost>
      </div>
    </div>

    <div className="kh-scroll-hint">
      <div className="kh-scroll-line" />
      Scroll
    </div>
  </section>
);

const Ticker = () => {
  const items = [
    "SaaS Analytics", "Revenue Intelligence", "Churn Prediction",
    "Product Metrics", "Growth KPIs", "Market Benchmarks",
    "AI Synthesis", "Decision Intelligence", "Pipeline Analytics",
  ];
  const doubled = [...items, ...items];
  return (
    <div className="kh-ticker">
      <div className="kh-ticker-track">
        {doubled.map((t, i) => (
          <span className="kh-ticker-item" key={i}>
            {t} <span className="kh-ticker-sep">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const ValueProps = () => (
  <section className="kh-section kh-section--alt" id="intelligence">
    <div className="kh-wrap">
      <Eyebrow>Why The KPI Hub</Eyebrow>
      <h2 className="kh-s-title">Intelligence that actually<br />moves the needle</h2>
      <div className="kh-v-grid">
        <FeatureCard icon="brain"  title="AI-Synthesized Insights" body="Our Claude-powered engine scans thousands of SaaS data sources daily, distilling signal from noise into clear, actionable intelligence." />
        <FeatureCard icon="target" title="Precision SaaS Matching" body="Our matching engine evaluates 200+ criteria to surface exactly the SaaS solutions built for your specific business context." />
        <FeatureCard icon="zap"    title="Real-Time Benchmarks"    body="Track industry KPIs, compare against peer cohorts, and get alerted when benchmark shifts create competitive opportunities." />
      </div>
    </div>
  </section>
);

const HowItWorks = () => (
  <section className="kh-section" id="how">
    <div className="kh-wrap">
      <div className="kh-hiw-header">
        <div>
          <Eyebrow>The Process</Eyebrow>
          <h2 className="kh-s-title">From raw data to<br />ready decisions</h2>
        </div>
        <p className="kh-s-sub">A 3-engine intelligence pipeline that runs 24/7 — so you don't have to.</p>
      </div>
      <div className="kh-steps">
        <Step num="01" title="Harvest"    body="Our Python engine continuously pulls from thousands of SaaS data sources — RSS feeds, X signals, financial news, market data — in real time." />
        <Step num="02" title="Synthesize" body="AI models process and cross-verify every data point using our SerpAPI verification matrix — stripping noise into structured intelligence." />
        <Step num="03" title="Deliver"    body="Clean, decision-ready insights tailored to your vertical and business context. No dashboards to dig through. Just signal." />
      </div>
    </div>
  </section>
);

const Features = () => (
  <section className="kh-section kh-section--alt" id="features">
    <div className="kh-wrap">
      <div className="kh-feat-header">
        <div>
          <Eyebrow>Platform Features</Eyebrow>
          <h2 className="kh-s-title">Built for the modern<br />SaaS professional</h2>
        </div>
        <p className="kh-s-sub">Every feature is engineered around one goal: faster, better decisions.</p>
      </div>
      <div className="kh-feat-grid">
        <FeatureCard icon="bar-chart-2" title="KPI Intelligence Feed" body="Daily AI-curated briefings on the metrics that matter most in your SaaS vertical. Always fresh, always verified." />
        <FeatureCard icon="search"      title="SaaS Discovery Engine" body="Search and evaluate SaaS tools with AI-powered context. See real usage patterns, integration strengths, competitive gaps." />
        <FeatureCard icon="trending-up" title="Benchmark Tracker"     body="Compare your metrics against industry standards and peer cohorts. Know where you're leading and where you're leaving money." />
        <FeatureCard icon="bot"         title="AI Research Assistant"  body="Ask any question about SaaS tools, vendors, or KPIs and get a verified, sourced answer in seconds — not hours." />
        <FeatureCard icon="bell"        title="Smart Alert System"     body="Set intelligent alerts on market moves, pricing changes, competitor activity, or KPI shifts that actually affect you." />
        <FeatureCard icon="lightbulb"   title="Decision Reports"       body="Auto-generated evaluation reports for any SaaS tool you're considering. All the research done. Zero fluff." />
      </div>
    </div>
  </section>
);

const Stats = () => (
  <section className="kh-section kh-section--tight">
    <div className="kh-wrap">
      <div className="kh-stats-grid">
        <StatCell value="40+"     label="Data Sources Wired" />
        <StatCell value="6"       label="KPI Categories Tracked" />
        <StatCell value="24/7"    label="Automated Intelligence" />
        <StatCell value="Top 300" label="India Builder · VibeCon 2025" />
      </div>
    </div>
  </section>
);

const CtaBlock = ({ submitted, email, onEmail, onSubmit }) => (
  <section className="kh-cta" id="waitlist">
    <div className="kh-cta-glow" />
    <div className="kh-wrap">
      <Eyebrow centered>Early Access</Eyebrow>
      <h2 className="kh-cta-title">Be first to get<br /><em>decision-grade</em> intelligence</h2>
      <p className="kh-cta-sub">Join the waitlist and get priority access when we launch. No spam — just the signal that matters.</p>
      {submitted ? (
        <div className="kh-success">✓ You're on the list. We'll be in touch.</div>
      ) : (
        <form className="kh-email-form" onSubmit={onSubmit}>
          <input className="kh-email-in" type="email" placeholder="Enter your work email" value={email} onChange={e => onEmail(e.target.value)} required />
          <button className="kh-email-btn" type="submit">Join Waitlist →</button>
        </form>
      )}
      <p className="kh-email-note">No spam. Unsubscribe anytime. Your data stays yours.</p>
    </div>
  </section>
);

const Footer = () => (
  <footer className="kh-footer">
    <div className="kh-wrap">
      <div className="kh-foot-top">
        <div className="kh-foot-brand">
          <Logo />
          <p className="kh-foot-tag">Decision-Grade Intelligence for the modern SaaS professional.</p>
        </div>
        <div className="kh-foot-group">
          <h4>Platform</h4>
          <ul><li><a href="#">Intelligence Feed</a></li><li><a href="#">SaaS Discovery</a></li><li><a href="#">Benchmarks</a></li><li><a href="#">Decision Reports</a></li></ul>
        </div>
        <div className="kh-foot-group">
          <h4>Company</h4>
          <ul><li><a href="#">About</a></li><li><a href="#">Blog</a></li><li><a href="#">Careers</a></li><li><a href="#">Contact</a></li></ul>
        </div>
        <div className="kh-foot-group">
          <h4>Legal</h4>
          <ul><li><a href="#">Privacy</a></li><li><a href="#">Terms</a></li><li><a href="#">Cookies</a></li></ul>
        </div>
      </div>
      <div className="kh-foot-bottom">
        <p className="kh-foot-copy">© 2026 The KPI Hub. All rights reserved.</p>
        <p className="kh-foot-made">Made with ☕ in Delhi, India</p>
      </div>
    </div>
  </footer>
);

Object.assign(window, {
  Nav, CredibilityBar, Hero, Ticker, ValueProps, HowItWorks,
  Features, Stats, CtaBlock, Footer,
});
