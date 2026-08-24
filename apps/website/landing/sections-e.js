/* global React */
// Section: 5-Engine AI Pipeline (Harvest → Synthesize → Verify → Deliver → Learn)

const {
  useState: useStateE,
  useEffect: useEffectE
} = React;
function SectionPipeline() {
  const stages = [{
    code: '01',
    name: 'Harvest',
    sub: 'Sources',
    body: '40+ wired sources scanned daily. Funding rounds, product launches, benchmark shifts, your stack signals.',
    icon: '◉'
  }, {
    code: '02',
    name: 'Synthesize',
    sub: 'Correlate',
    body: 'Claude-powered correlation across cross-source signals. Weak ties become strong ones. Patterns surface.',
    icon: '✦'
  }, {
    code: '03',
    name: 'Verify',
    sub: 'Ground',
    body: 'Every claim checked against grounded data. SerpAPI cross-reference. Hallucination gate.',
    icon: '✓'
  }, {
    code: '04',
    name: 'Deliver',
    sub: 'Route',
    body: 'Routed to the right role at the right cadence. Email, Slack, dashboard, briefing — your channel.',
    icon: '→'
  }, {
    code: '05',
    name: 'Learn',
    sub: 'Improve',
    body: 'Engagement signals retrain priority weights. Tomorrow\'s pass is sharper than today\'s.',
    icon: '↻'
  }];
  const [active, setActive] = useStateE(0);
  useEffectE(() => {
    const id = setInterval(() => setActive(a => (a + 1) % stages.length), 2400);
    return () => clearInterval(id);
  }, []);
  return /*#__PURE__*/React.createElement("section", {
    className: "lp-section lp-section--alt lp-section-host",
    "data-section": "pipeline",
    "data-screen-label": "\xA75\xBD Pipeline"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-annot"
  }, "\xA75\xBD \xB7 5-Engine AI Pipeline \xB7 Brand IP"), /*#__PURE__*/React.createElement("div", {
    className: "lp-section-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-section-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-section-head-left"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lp-section-eyebrow"
  }, "The intelligence engine"), /*#__PURE__*/React.createElement("h2", {
    className: "lp-section-title"
  }, "From raw data to ", /*#__PURE__*/React.createElement("em", null, "ready decisions"), /*#__PURE__*/React.createElement("br", null), "in five engines.")), /*#__PURE__*/React.createElement("p", {
    className: "lp-section-kicker"
  }, "Not a \"feature\". The reason every dashboard, every alert, every dispatch arrives decision-grade. Running daily on Claude + SerpAPI.")), /*#__PURE__*/React.createElement("div", {
    className: "lp-pipeline"
  }, stages.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s.code,
    className: `lp-pipeline-step ${i === active ? 'is-active' : ''}`,
    onMouseEnter: () => setActive(i)
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-pipeline-glyph",
    "aria-hidden": "true"
  }, s.icon), /*#__PURE__*/React.createElement("div", {
    className: "lp-pipeline-code"
  }, s.code, " \xB7 ", s.sub), /*#__PURE__*/React.createElement("div", {
    className: "lp-pipeline-name"
  }, s.name), /*#__PURE__*/React.createElement("p", {
    className: "lp-pipeline-body"
  }, s.body), i < stages.length - 1 && /*#__PURE__*/React.createElement("div", {
    className: "lp-pipeline-bar",
    "aria-hidden": "true"
  }))))));
}
Object.assign(window, {
  SectionPipeline
});