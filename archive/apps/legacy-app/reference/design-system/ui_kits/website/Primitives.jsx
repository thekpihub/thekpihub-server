// Core reusable components for The KPI Hub marketing site UI kit.
// Uses classes from ../../colors_and_type.css + kit.css

const Logo = ({ inverted = false }) => (
  <div className="kh-logo" data-inverted={inverted ? 'true' : 'false'}>
    <span className="kh-logo-dot" />
    <span>The <span className="kh-logo-accent">KPI</span> Hub</span>
  </div>
);

const Eyebrow = ({ children, centered }) => (
  <div className={"kh-eyebrow" + (centered ? " kh-eyebrow--c" : "")}>{children}</div>
);

const Badge = ({ children, tone = "gold", withDot }) => (
  <span className={`kh-badge kh-badge--${tone}`}>
    {withDot && <span className="kh-badge-dot" />}
    {children}
  </span>
);

const ButtonPrimary = ({ children, onClick, href }) => {
  const cls = "kh-btn kh-btn--primary";
  return href
    ? <a className={cls} href={href} onClick={onClick}>{children}</a>
    : <button className={cls} onClick={onClick}>{children}</button>;
};

const ButtonGhost = ({ children, onClick, href }) => {
  const cls = "kh-btn kh-btn--ghost";
  return href
    ? <a className={cls} href={href} onClick={onClick}>{children}</a>
    : <button className={cls} onClick={onClick}>{children}</button>;
};

const KpiCard = ({ label, value, delta, tone = "neutral" }) => (
  <div className="kh-kpi-card">
    <div className="kh-kpi-label">{label}</div>
    <div className={`kh-kpi-value kh-kpi-value--${tone}`}>{value}</div>
    {delta && <div className="kh-kpi-delta">{delta}</div>}
  </div>
);

const Icon = ({ name, size = 22 }) => (
  <i
    data-lucide={name}
    style={{
      width: size, height: size,
      stroke: "#E9A123", strokeWidth: 1.5,
      fill: "none", display: "block",
    }}
  />
);

const FeatureCard = ({ icon, title, body }) => (
  <div className="kh-feat-card">
    <div className="kh-feat-icon-tile"><Icon name={icon} size={22} /></div>
    <h3 className="kh-feat-title">{title}</h3>
    <p className="kh-feat-body">{body}</p>
  </div>
);

const Step = ({ num, title, body }) => (
  <div className="kh-step">
    <div className="kh-step-num">{num}</div>
    <h3 className="kh-step-title">{title}</h3>
    <p className="kh-step-text">{body}</p>
  </div>
);

const StatCell = ({ value, label }) => (
  <div className="kh-stat">
    <div className="kh-stat-val">{value}</div>
    <div className="kh-stat-lbl">{label}</div>
  </div>
);

Object.assign(window, {
  Logo, Eyebrow, Badge, ButtonPrimary, ButtonGhost,
  KpiCard, Icon, FeatureCard, Step, StatCell,
});
