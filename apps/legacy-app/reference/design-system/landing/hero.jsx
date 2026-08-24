/* global React */
// Hero — Section 1. Two variants: editorial (default) and data-first.

const { useEffect, useRef, useState } = React;

// Animated KPI-pulse background. Uses SVG polyline that shifts its points on a timer,
// so we don't load any animation library.
function PulseBackground() {
  const [t, setT] = React.useState(0);
  useEffect(() => {
    let raf; const start = performance.now();
    const tick = (now) => { setT(now - start); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // build three stacked, slowly-shifting sine waves
  const W = 1600, H = 600, segments = 80;
  const lines = [0, 1, 2].map((i) => {
    const amp = 24 + i * 8;
    const phase = t * (0.0005 + i * 0.0002);
    const freq = 0.012 + i * 0.004;
    const yOffset = 180 + i * 110;
    const pts = [];
    for (let k = 0; k <= segments; k++) {
      const x = (k / segments) * W;
      const y = yOffset + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 0.3 + phase * 1.7) * (amp * 0.3);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  });

  // pulse dot position — rides the top wave
  const dotK = (Math.sin(t * 0.0008) * 0.5 + 0.5);
  const dotX = dotK * W;
  const dotY = 180 + Math.sin(dotX * 0.012 + t * 0.0005) * 24 + Math.sin(dotX * 0.0036 + t * 0.00085) * 7;

  return (
    <div className="lp-pulse-bg" aria-hidden="true">
      <svg className="lp-pulse-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <polyline className="lp-pulse-line" points={lines[0]} />
        <polyline className="lp-pulse-line lp-pulse-line--teal" points={lines[1]} style={{ opacity: 0.55 }} />
        <polyline className="lp-pulse-line" points={lines[2]} style={{ opacity: 0.35 }} />
        <circle className="lp-pulse-dot" cx={dotX} cy={dotY} r="5" />
      </svg>
    </div>
  );
}

// Small KPI card (floating over hero, data-first variant only)
function FloatKpi({ label, value, delta, trend, style }) {
  return (
    <div className="fcard" style={style}>
      <div className="fcard-lbl">{label}</div>
      <div className="fcard-val">{value}</div>
      <div className={`fcard-chg ${trend === 'up' ? 'up' : trend === 'down' ? 'down' : ''}`}>
        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '●'} {delta}
      </div>
    </div>
  );
}

function Hero({ variant = 'editorial', ctaGoal = 'free', onCtaClick }) {
  // Resolve CTA labels per goal
  const goals = {
    free:     { primary: 'Start Free — No Card Required', secondary: 'See It In Action →' },
    waitlist: { primary: 'Get Early Access →',            secondary: 'See It In Action →' },
    demo:     { primary: 'Book a Demo →',                 secondary: 'Start Free Instead' },
  };
  const { primary, secondary } = goals[ctaGoal] || goals.free;

  return (
    <section className="hero lp-section-host" data-section="hero">
      <div className="hero-grid" />
      <div className="hero-glow" />
      <PulseBackground />

      <div className="lp-annot">§1 · Hero · Stop-the-scroll · ≤5s promise</div>

      <div className="hero-inner" style={{ position: 'relative', zIndex: 2 }}>
        <span className="eyebrow">AI-Powered KPI Intelligence</span>

        {variant === 'editorial' ? (
          <h1>
            The <em>Intelligence Layer</em><br/>
            Your Business<br/>
            Has Been <em>Missing.</em>
          </h1>
        ) : (
          <h1>
            The <em>Intelligence Layer</em> Your Business Has Been Missing.
          </h1>
        )}

        <p className="hero-sub">
          Every metric. Every team. Every decision. One platform that thinks <em style={{ fontStyle: 'italic', color: 'var(--text)' }}>with you</em> — not just for you.
          The world's first fully automated KPI intelligence platform, built for every layer of your organization.
        </p>

        <div className="hero-cta">
          <button className="btn-primary" onClick={() => onCtaClick && onCtaClick('primary')}>{primary}</button>
          <button className="btn-ghost"   onClick={() => onCtaClick && onCtaClick('secondary')}>{secondary}</button>
        </div>

        <div className="lp-trust-bar">
          <span className="lp-trust-item"><span className="lp-trust-star">✦</span> Live Production Platform</span>
          <span className="lp-trust-item"><span className="lp-trust-star">✦</span> 4 Role-Intelligent Dashboards</span>
          <span className="lp-trust-item"><span className="lp-trust-star">✦</span> Automated Intelligence</span>
          <span className="lp-trust-item"><span className="lp-trust-star">✦</span> Zero Setup Complexity</span>
        </div>
      </div>

      {variant === 'data' && (
        <>
          <FloatKpi label="MRR"  value="$847K"  delta="+12.4%" trend="up"
                    style={{ position: 'absolute', top: '22%', left: '8%', zIndex: 3, animation: 'float 6s ease-in-out infinite' }} />
          <FloatKpi label="NRR"  value="127%"   delta="+3.1 pp" trend="up"
                    style={{ position: 'absolute', top: '60%', right: '7%', zIndex: 3, animation: 'float 7s ease-in-out infinite 0.6s' }} />
          <FloatKpi label="Churn" value="1.8%" delta="-0.4 pp" trend="up"
                    style={{ position: 'absolute', top: '34%', right: '14%', zIndex: 3, animation: 'float 5.5s ease-in-out infinite 1.2s' }} />
        </>
      )}
    </section>
  );
}

// Export to window for other scripts
Object.assign(window, { Hero, PulseBackground });
