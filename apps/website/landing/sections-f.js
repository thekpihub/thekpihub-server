/* global React */
// Founder section + Email capture CTA strip

function SectionFounder() {
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section-host",
    "data-section": "founder",
    "data-screen-label": "\xA79\xBD Founder"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA79\xBD \xB7 Founder \xB7 Origin story \xB7 Trust by face"), /*#__PURE__*/React.createElement("div", {
    className: "lp-section-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-founder"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-founder-portrait",
    "aria-hidden": "true"
  }, "HS"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "lp-section-eyebrow"
  }, "Built by an operator, not an agency"), /*#__PURE__*/React.createElement("div", {
    className: "lp-founder-quote"
  }, "\"I spent ten years watching teams drown in dashboards no one read. The KPI Hub is the platform I wish I'd had \u2014 ", /*#__PURE__*/React.createElement("em", null, "decision-grade intelligence,"), " zero fluff.\""), /*#__PURE__*/React.createElement("div", {
    className: "lp-founder-attr"
  }, /*#__PURE__*/React.createElement("strong", null, "Himanshu Sharma"), " \xB7 Founder & CEO \xB7 TheKPIHub.com"), /*#__PURE__*/React.createElement("div", {
    className: "lp-founder-tags"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-founder-tag"
  }, "Top 300 India Builder \xB7 VibeCon 2025"), /*#__PURE__*/React.createElement("span", {
    className: "lp-founder-tag"
  }, "Ex-Cloud Engineer"), /*#__PURE__*/React.createElement("span", {
    className: "lp-founder-tag"
  }, "Made in Delhi"))))));
}
function SectionCapture({
  ctaGoal = 'free'
}) {
  const labels = {
    free: 'Get Started',
    waitlist: 'Join Waitlist',
    demo: 'Request Demo'
  };
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section--alt lp-section-host",
    "data-section": "capture",
    "data-screen-label": "\xA79\xBE Capture"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA79\xBE \xB7 Email capture \xB7 low-friction conversion"), /*#__PURE__*/React.createElement("div", {
    className: "lp-section-inner",
    style: {
      textAlign: 'center',
      maxWidth: 720
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-section-eyebrow",
    style: {
      justifyContent: 'center'
    }
  }, "Stay close to the launch"), /*#__PURE__*/React.createElement("h2", {
    className: "lp-section-title",
    style: {
      marginBottom: 18
    }
  }, "One email. ", /*#__PURE__*/React.createElement("em", null, "No noise.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: '1rem',
      color: 'var(--text-2)',
      maxWidth: 520,
      margin: '0 auto 32px',
      lineHeight: 1.6
    }
  }, "Get the next product release, the next benchmark drop, the next intelligence dispatch \u2014 direct from the build."), /*#__PURE__*/React.createElement("form", {
    className: "lp-capture",
    onSubmit: e => e.preventDefault()
  }, /*#__PURE__*/React.createElement("input", {
    className: "lp-capture-input",
    type: "email",
    placeholder: "you@company.com",
    required: true
  }), /*#__PURE__*/React.createElement("button", {
    className: "lp-capture-btn",
    type: "submit"
  }, labels[ctaGoal] || labels.free)), /*#__PURE__*/React.createElement("div", {
    className: "lp-capture-note"
  }, "No spam \xB7 unsubscribe in one click \xB7 we never share your address")));
}
Object.assign(window, {
  SectionFounder,
  SectionCapture
});