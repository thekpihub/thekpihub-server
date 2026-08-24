/* global React */
// Hero - Section 1. Two variants: editorial (default) and data-first.

// Animated KPI-pulse background. Uses SVG polyline that shifts its points on a timer,
// so we do not load any animation library.
function PulseBackground() {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = now => {
      setT(now - start);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const W = 1600;
  const H = 600;
  const segments = 80;
  const lines = [0, 1, 2].map(i => {
    const amp = 24 + i * 8;
    const phase = t * (0.0005 + i * 0.0002);
    const freq = 0.012 + i * 0.004;
    const yOffset = 180 + i * 110;
    const pts = [];
    for (let k = 0; k <= segments; k++) {
      const x = k / segments * W;
      const y = yOffset + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 0.3 + phase * 1.7) * (amp * 0.3);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  });
  const dotK = Math.sin(t * 0.0008) * 0.5 + 0.5;
  const dotX = Math.round(dotK * W * 100) / 100;
  const dotY = Math.round((180 + Math.sin(dotX * 0.012 + t * 0.0005) * 24 + Math.sin(dotX * 0.0036 + t * 0.00085) * 7) * 100) / 100;
  return /*#__PURE__*/React.createElement("div", {
    className: "lp-pulse-bg",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "lp-pulse-svg",
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "none"
  }, /*#__PURE__*/React.createElement("polyline", {
    className: "lp-pulse-line",
    points: lines[0]
  }), /*#__PURE__*/React.createElement("polyline", {
    className: "lp-pulse-line lp-pulse-line--teal",
    points: lines[1],
    style: {
      opacity: 0.55
    }
  }), /*#__PURE__*/React.createElement("polyline", {
    className: "lp-pulse-line",
    points: lines[2],
    style: {
      opacity: 0.35
    }
  }), /*#__PURE__*/React.createElement("circle", {
    className: "lp-pulse-dot",
    cx: dotX,
    cy: dotY,
    r: "5"
  })));
}
function FloatKpi({
  label,
  value,
  delta,
  trend,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fcard",
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "fcard-lbl"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "fcard-val"
  }, value), /*#__PURE__*/React.createElement("div", {
    className: `fcard-chg ${trend === 'up' ? 'up' : trend === 'down' ? 'down' : ''}`
  }, trend === 'up' ? 'up' : trend === 'down' ? 'down' : 'flat', " ", delta));
}
function Hero({
  variant = 'editorial',
  ctaGoal = 'free',
  onCtaClick
}) {
  const goals = {
    free: {
      primary: 'Get My KPI Audit ->',
      secondary: 'Try the free 60-sec auditor'
    },
    waitlist: {
      primary: 'Get My KPI Audit ->',
      secondary: 'Try the free 60-sec auditor'
    },
    demo: {
      primary: 'Get My KPI Audit ->',
      secondary: 'Try the free 60-sec auditor'
    }
  };
  const {
    primary,
    secondary
  } = goals[ctaGoal] || goals.free;
  return /*#__PURE__*/React.createElement("section", {
    className: "hero lp-section-host",
    "data-section": "hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-grid"
  }), /*#__PURE__*/React.createElement("div", {
    className: "hero-glow"
  }), /*#__PURE__*/React.createElement(PulseBackground, null), /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "Section 1 - Hero - 48-hour audit offer"), /*#__PURE__*/React.createElement("div", {
    className: "hero-inner relative z-[2] flex flex-col items-center text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-eyebrow mb-6 inline-flex items-center rounded-pill border border-gold/25 bg-gold-soft px-4 py-1.5"
  }, "KPI Audit Lite for founders"), /*#__PURE__*/React.createElement("h1", {
    className: "font-display font-extrabold tracking-[-0.03em] leading-[1.04] text-ink text-[clamp(2.6rem,6.5vw,5.6rem)] max-w-[16ch]"
  }, "Find the ", /*#__PURE__*/React.createElement("em", {
    className: "italic text-gold not-prose"
  }, "revenue leaks"), /*#__PURE__*/React.createElement("br", null), "hiding in your numbers", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("em", {
    className: "italic text-gold"
  }, "in 48 hours.")), /*#__PURE__*/React.createElement("p", {
    className: "hero-sub mt-7 max-w-[54ch] text-balance text-lg leading-relaxed text-ink-2 sm:text-xl"
  }, "We audit your metrics, benchmark your tool stack, and hand you a founder-ready growth dashboard. Decision-grade intelligence, zero fluff."), /*#__PURE__*/React.createElement("div", {
    className: "hero-cta mt-9 flex flex-col items-center gap-3 sm:flex-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "lp-btn-primary",
    onClick: () => onCtaClick && onCtaClick('primary')
  }, primary), /*#__PURE__*/React.createElement("button", {
    className: "lp-btn-ghost",
    onClick: () => onCtaClick && onCtaClick('secondary')
  }, secondary)), /*#__PURE__*/React.createElement("div", {
    className: "lp-trust-bar mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-3"
  }, ['Live production platform', 'Built for Indian founders and agencies', 'Delivered in 48 hours', 'No retainer required'].map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    className: "inline-flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-gold"
  }, "\u2605"), " ", t)))), variant === 'data' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(FloatKpi, {
    label: "MRR",
    value: "$847K",
    delta: "+12.4%",
    trend: "up",
    style: {
      position: 'absolute',
      top: '22%',
      left: '8%',
      zIndex: 3,
      animation: 'float 6s ease-in-out infinite'
    }
  }), /*#__PURE__*/React.createElement(FloatKpi, {
    label: "NRR",
    value: "127%",
    delta: "+3.1 pp",
    trend: "up",
    style: {
      position: 'absolute',
      top: '60%',
      right: '7%',
      zIndex: 3,
      animation: 'float 7s ease-in-out infinite 0.6s'
    }
  }), /*#__PURE__*/React.createElement(FloatKpi, {
    label: "Churn",
    value: "1.8%",
    delta: "-0.4 pp",
    trend: "up",
    style: {
      position: 'absolute',
      top: '34%',
      right: '14%',
      zIndex: 3,
      animation: 'float 5.5s ease-in-out infinite 1.2s'
    }
  })));
}
Object.assign(window, {
  Hero,
  PulseBackground
});