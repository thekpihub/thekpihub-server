import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Check } from "lucide-react";
import { useAuthStore } from "@/store";

const GOLD = "#E9A123";
const TEAL = "#00C9A7";
const BG   = "#06071A";
const CARD = "#0D0F2B";
const BORD = "rgba(233,161,35,0.15)";

// ── Animated KPI pulse background ────────────────────────────────────────────

function PulseBg() {
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef  = useRef<SVGCircleElement>(null);
  const path2   = useRef<SVGPathElement>(null);

  useEffect(() => {
    let frame: number;
    let t = 0;
    const pts: [number, number][] = [
      [0,220],[80,190],[160,215],[240,155],[320,175],
      [400,125],[480,165],[560,85],[640,135],[720,65],
      [800,105],[880,145],[960,95],[1040,115],[1120,75],
      [1200,100],[1280,135],[1360,90],[1440,115],
    ];
    const pts2: [number, number][] = [
      [0,260],[100,240],[200,270],[300,220],[400,250],
      [500,200],[600,230],[700,180],[800,210],[900,170],
      [1000,200],[1100,175],[1200,205],[1300,185],[1440,210],
    ];
    const toD = (points: [number,number][], offset: number) =>
      points.reduce((acc, [x, y], i) => {
        const ay = y + Math.sin(t * 0.9 + i * 0.55 + offset) * 14;
        if (i === 0) return `M ${x} ${ay}`;
        const [px, py] = points[i - 1];
        const apy = py + Math.sin(t * 0.9 + (i-1) * 0.55 + offset) * 14;
        const cpx = (px + x) / 2;
        return `${acc} C ${cpx} ${apy}, ${cpx} ${ay}, ${x} ${ay}`;
      }, "");

    const tick = () => {
      t += 0.007;
      if (pathRef.current) pathRef.current.setAttribute("d", toD(pts, 0));
      if (path2.current)   path2.current.setAttribute("d", toD(pts2, Math.PI));
      if (dotRef.current) {
        const last = pts[pts.length - 1];
        const y = last[1] + Math.sin(t * 0.9 + (pts.length - 1) * 0.55) * 14;
        dotRef.current.setAttribute("cx", String(last[0]));
        dotRef.current.setAttribute("cy", String(y));
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:`linear-gradient(rgba(233,161,35,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(233,161,35,0.04) 1px,transparent 1px)`,
        backgroundSize:"40px 40px",
      }} />
      <div style={{
        position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)",
        width:900, height:700,
        background:`radial-gradient(ellipse,rgba(233,161,35,0.14) 0%,rgba(0,201,167,0.06) 38%,transparent 70%)`,
        filter:"blur(48px)", pointerEvents:"none",
      }} />
      <svg viewBox="0 0 1440 400" style={{ position:"absolute", bottom:0, width:"100%", height:"58%" }} preserveAspectRatio="none">
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <path ref={path2} fill="none" stroke={TEAL} strokeWidth="1" filter="url(#glow)" opacity="0.3" />
        <path ref={pathRef} fill="none" stroke={GOLD} strokeWidth="1.6" filter="url(#glow)" opacity="0.55" />
        <circle ref={dotRef} r="5" fill={GOLD} filter="url(#glow)" />
      </svg>
    </div>
  );
}

// ── Persona data ──────────────────────────────────────────────────────────────

const PERSONAS = [
  {
    num:"01", role:"CMO", title:"Chief Marketing Officer", forLabel:"For CMOs",
    headline:"Know which campaigns", highlight:"move the needle",
    body:"Stop guessing which channels drive revenue. Wingman connects your marketing KPIs, detects anomalies in real time, and drafts executive briefs before your Monday standup.",
    kpis:[
      {label:"CAC",   value:"$142",  delta:"−18%",  up:true},
      {label:"LTV/CAC",value:"4.2×", delta:"+0.8",  up:true},
      {label:"MQL→SQL",value:"34%",  delta:"−3pp",  up:false},
    ],
    alert:{ok:false, msg:"Email CTR dropped 22% in Campaign #14 — anomaly flagged"},
    prompt:"Summarise this week's CAC movement and draft a brief for the exec team.",
  },
  {
    num:"02", role:"CFO", title:"Chief Financial Officer", forLabel:"For CFOs",
    headline:"Real-time", highlight:"financial intelligence",
    body:"From burn rate to EBITDA variance, Wingman surfaces the numbers that matter and explains the 'why' behind every swing — in plain language, not pivot tables.",
    kpis:[
      {label:"Burn",   value:"$84K", delta:"on plan", up:true},
      {label:"Runway", value:"18mo", delta:"+2mo",    up:true},
      {label:"EBITDA", value:"−12%", delta:"vs bgt",  up:false},
    ],
    alert:{ok:true, msg:"Q3 variance within tolerance. Board report draft ready."},
    prompt:"Compare Q3 actuals vs budget and highlight the top 3 variances.",
  },
  {
    num:"03", role:"Sales", title:"Sales Director", forLabel:"For Sales Leaders",
    headline:"Pipeline clarity that", highlight:"closes deals",
    body:"Track rep performance, forecast accuracy, and deal velocity in one view. Wingman flags at-risk deals and auto-generates weekly pipeline narratives for your CRO.",
    kpis:[
      {label:"Pipeline",value:"$2.1M", delta:"+$340K", up:true},
      {label:"Win Rate",value:"28%",   delta:"+4pp",   up:true},
      {label:"Avg Cycle",value:"42d",  delta:"+6d",    up:false},
    ],
    alert:{ok:false, msg:"3 deals stalled >30 days — follow-up sequence suggested"},
    prompt:"Which deals are most at risk this quarter and what should we do?",
  },
  {
    num:"04", role:"Ops", title:"Operations Manager", forLabel:"For Ops",
    headline:"Efficiency metrics,", highlight:"automatically explained",
    body:"Monitor SLAs, utilisation, and process efficiency across every team. When something crosses a threshold, Wingman traces the root cause and proposes a fix.",
    kpis:[
      {label:"SLA Met",  value:"96.4%", delta:"−0.8pp", up:false},
      {label:"Utilisation",value:"78%", delta:"+3pp",   up:true},
      {label:"Incidents",value:"7",     delta:"+2",     up:false},
    ],
    alert:{ok:false, msg:"SLA breach risk: ticket queue up 34% since Tuesday"},
    prompt:"What's causing the SLA dip and what actions should I take today?",
  },
];

function PersonaDash({ p }: { p: typeof PERSONAS[0] }) {
  return (
    <div style={{ background:CARD, border:`1px solid ${BORD}`, borderRadius:12, padding:18, display:"flex", flexDirection:"column", gap:14, minHeight:340 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:12, borderBottom:`1px solid ${BORD}` }}>
        <span style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)" }}>
          {p.forLabel} · KPI Hub Dashboard
        </span>
        <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:TEAL, display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:TEAL, display:"inline-block" }} /> LIVE
        </span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
        {p.kpis.map(k => (
          <div key={k.label} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${BORD}`, borderRadius:8, padding:"10px 12px" }}>
            <div style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.56rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)" }}>{k.label}</div>
            <div style={{ fontFamily:"Figtree,sans-serif", fontSize:"1.4rem", fontWeight:700, color:k.up?GOLD:"#FF6B6B", marginTop:4, lineHeight:1 }}>{k.value}</div>
            <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.6rem", color:k.up?TEAL:"#FF6B6B", marginTop:4 }}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div style={{ background:p.alert.ok?"rgba(0,201,167,0.06)":"rgba(255,107,107,0.06)", border:`1px solid ${p.alert.ok?"rgba(0,201,167,0.25)":"rgba(255,107,107,0.25)"}`, borderRadius:8, padding:"10px 12px", display:"flex", gap:10, alignItems:"flex-start" }}>
        <div style={{ width:22, height:22, borderRadius:"50%", background:p.alert.ok?"rgba(0,201,167,0.15)":"rgba(255,107,107,0.15)", color:p.alert.ok?TEAL:"#FF6B6B", display:"grid", placeItems:"center", fontFamily:"Figtree,sans-serif", fontSize:"0.7rem", fontWeight:800, flexShrink:0 }}>
          {p.alert.ok ? "✓" : "!"}
        </div>
        <div style={{ fontFamily:"Inter,sans-serif", fontSize:"0.78rem", color:"rgba(255,255,255,0.55)", lineHeight:1.45 }}>
          <strong style={{ color:"rgba(255,255,255,0.9)" }}>Wingman: </strong>{p.alert.msg}
        </div>
      </div>

      <div style={{ marginTop:"auto", background:"rgba(233,161,35,0.04)", border:`1px solid rgba(233,161,35,0.14)`, borderRadius:8, padding:"8px 12px", fontFamily:"JetBrains Mono,monospace", fontSize:"0.7rem", color:GOLD, lineHeight:1.6 }}>
        <span style={{ color:"rgba(255,255,255,0.3)" }}>You › </span>"{p.prompt}"
      </div>
    </div>
  );
}

// ── Feature mocks ─────────────────────────────────────────────────────────────

function PulseMock() {
  const ref = useRef<SVGPathElement>(null);
  useEffect(() => {
    let t = 0; let frame: number;
    const pts: [number,number][] = [[0,50],[40,42],[80,55],[120,30],[160,45],[200,20],[240,38],[280,15],[320,30]];
    const tick = () => {
      t += 0.012;
      const d = pts.reduce((acc,[x,y],i) => {
        const ay = y + Math.sin(t + i * 0.7) * 8;
        if (i===0) return `M ${x} ${ay}`;
        const [px,py] = pts[i-1]; const apy = py + Math.sin(t+(i-1)*0.7)*8;
        return `${acc} C ${(px+x)/2} ${apy}, ${(px+x)/2} ${ay}, ${x} ${ay}`;
      },"");
      if (ref.current) ref.current.setAttribute("d", d);
      frame = requestAnimationFrame(tick);
    };
    tick(); return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div style={{ background:CARD, border:`1px solid ${BORD}`, borderRadius:12, padding:22, minHeight:260 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <span style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)" }}>Pulse Engine</span>
        <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:GOLD }}>WATCHING 24 KPIs</span>
      </div>
      <svg viewBox="0 0 320 80" style={{ width:"100%", height:80, overflow:"visible" }}>
        <defs><filter id="pg"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <path ref={ref} fill="none" stroke={GOLD} strokeWidth="1.8" filter="url(#pg)" />
      </svg>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginTop:14 }}>
        {[{l:"Revenue",v:"$84.2K",up:true},{l:"Churn",v:"2.1%",up:false},{l:"NPS",v:"67",up:true}].map(m => (
          <div key={m.l} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${BORD}`, borderRadius:6, padding:8 }}>
            <div style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.56rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)" }}>{m.l}</div>
            <div style={{ fontFamily:"Figtree,sans-serif", fontSize:"1rem", fontWeight:700, color:m.up?GOLD:"#FF6B6B", marginTop:2 }}>{m.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnomalyMock() {
  return (
    <div style={{ background:CARD, border:`1px solid ${BORD}`, borderRadius:12, padding:22, minHeight:260 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
        <span style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)" }}>Anomaly Detection</span>
        <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:"#FF6B6B" }}>2 ALERTS</span>
      </div>
      <svg viewBox="0 0 320 120" style={{ width:"100%", height:120 }}>
        <defs><filter id="ag"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <polyline points="0,90 40,85 80,88 120,82 160,84 200,60 240,30 280,35 320,32" fill="none" stroke={GOLD} strokeWidth="1.6" filter="url(#ag)" opacity="0.7"/>
        <line x1="190" y1="0" x2="190" y2="120" stroke="#FF6B6B" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"/>
        <circle cx="200" cy="60" r="6" fill="#FF6B6B" filter="url(#ag)"/>
        <rect x="205" y="44" width="110" height="28" rx="5" fill={CARD} stroke="rgba(255,107,107,0.35)" strokeWidth="1"/>
        <text x="212" y="60" fontFamily="Figtree,sans-serif" fontSize="9" fontWeight="700" fill="#FF6B6B">Anomaly detected</text>
        <text x="212" y="72" fontFamily="JetBrains Mono,monospace" fontSize="7" fill="rgba(255,255,255,0.4)">−22% vs 30d avg</text>
      </svg>
      {[{cause:"Paid search spend cut",score:"0.91"},{cause:"Seasonal demand shift",score:"0.74"}].map(r => (
        <div key={r.cause} style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8, padding:"8px 10px", background:"rgba(255,255,255,0.03)", border:`1px solid ${BORD}`, borderRadius:6, marginTop:8 }}>
          <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.68rem", color:"rgba(255,255,255,0.5)" }}>
            <span style={{ color:GOLD }}>›</span> {r.cause}
          </span>
          <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.68rem", color:GOLD, fontWeight:600 }}>{r.score}</span>
        </div>
      ))}
    </div>
  );
}

function ReportMock() {
  return (
    <div style={{ background:CARD, border:`1px solid ${BORD}`, borderRadius:12, padding:22, minHeight:260 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
        <span style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)" }}>AI Report Writer</span>
        <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:TEAL }}>DRAFT READY</span>
      </div>
      {[
        {t:"Weekly Executive Digest",m:"CMO · 2 pages · auto-generated",active:true},
        {t:"Q3 Variance Analysis",m:"CFO · 4 pages · auto-generated",active:false},
        {t:"Pipeline Health Report",m:"Sales Director · 3 pages",active:false},
      ].map(r => (
        <div key={r.t} style={{ display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:14, padding:"10px 12px", background:r.active?"rgba(233,161,35,0.05)":"rgba(255,255,255,0.02)", border:`1px solid ${r.active?BORD:"rgba(255,255,255,0.06)"}`, borderRadius:8, marginBottom:8 }}>
          <div>
            <div style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.82rem", fontWeight:700, color:r.active?"#fff":"rgba(255,255,255,0.6)" }}>{r.t}</div>
            <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:"rgba(255,255,255,0.3)", marginTop:2 }}>{r.m}</div>
          </div>
          <span style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"4px 10px", background:r.active?"rgba(233,161,35,0.15)":"rgba(0,201,167,0.08)", border:`1px solid ${r.active?BORD:"rgba(0,201,167,0.2)"}`, borderRadius:100, color:r.active?GOLD:TEAL }}>
            {r.active ? "Generating" : "Ready"}
          </span>
        </div>
      ))}
    </div>
  );
}

function WorkflowMock() {
  return (
    <div style={{ background:CARD, border:`1px solid ${BORD}`, borderRadius:12, padding:22, minHeight:260 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
        <span style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)" }}>Smart Workflows</span>
        <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:TEAL }}>3 ACTIVE</span>
      </div>
      {[
        {tag:"WHEN",color:GOLD,bg:"rgba(233,161,35,0.1)",border:BORD, text:"Churn rate exceeds 3%"},
        {tag:"THEN",color:TEAL,bg:"rgba(0,201,167,0.08)",border:"rgba(0,201,167,0.2)", text:"Notify Slack #retention + create Jira ticket"},
        {tag:"AND",color:"rgba(255,255,255,0.35)",bg:"rgba(255,255,255,0.03)",border:"rgba(255,255,255,0.08)", text:"Draft retention playbook via Wingman AI"},
      ].map((n,i) => (
        <div key={i}>
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:n.bg, border:`1px solid ${n.border}`, borderRadius:8, marginBottom:6 }}>
            <span style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"4px 10px", borderRadius:100, background:n.bg, border:`1px solid ${n.border}`, color:n.color, flexShrink:0 }}>{n.tag}</span>
            <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.78rem", color:"rgba(255,255,255,0.75)" }}>{n.text}</span>
          </div>
          {i < 2 && <div style={{ marginLeft:28, marginBottom:6, color:"rgba(255,255,255,0.2)", fontFamily:"JetBrains Mono,monospace", fontSize:"1rem", lineHeight:0.6 }}>↓</div>}
        </div>
      ))}
    </div>
  );
}

const FEATURE_MOCKS = [PulseMock, AnomalyMock, ReportMock, WorkflowMock];

const FEATURES = [
  { num:"01", name:"Pulse Engine",      claim:"Live KPI monitoring",       flip:false,
    body:"Every metric on your dashboard is watched in real time. The Pulse Engine continuously scans for deviations, trend reversals, and threshold breaches — no manual checking required." },
  { num:"02", name:"Anomaly Detection", claim:"AI spots what you miss",    flip:true,
    body:"Statistical models trained on your historical data identify anomalies the moment they appear. Each alert comes with a plain-English explanation and a suggested action." },
  { num:"03", name:"AI Report Writer",  claim:"Narratives, not spreadsheets", flip:false,
    body:"Turn raw KPI data into board-ready reports in seconds. Wingman drafts executive summaries, variance analyses, and weekly digests in your brand's tone and format." },
  { num:"04", name:"Smart Workflows",   claim:"Automate your metric ops",  flip:true,
    body:"Set trigger-based workflows: when a KPI crosses a threshold, automatically notify stakeholders, update a Notion doc, or create a Jira ticket. No code required." },
];

// ── Section header helper ─────────────────────────────────────────────────────

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:GOLD, display:"inline-flex", alignItems:"center", gap:12, marginBottom:20 }}>
      <span style={{ width:28, height:2, background:GOLD, display:"inline-block" }} />{label}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activePersona, setActivePersona] = useState(0);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY       = useTransform(scrollY, [0, 400], [0, -60]);

  const openWingman = () => { if (user) navigate("/dashboard"); else window.location.href = "https://thekpihub.com/pricing"; };

  return (
    <div style={{ minHeight:"100vh", background:BG, overflowX:"hidden", color:"#E8E9F0" }}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, borderBottom:`1px solid ${BORD}`, background:"rgba(6,7,26,0.88)", backdropFilter:"blur(14px)", height:56 }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px", height:"100%", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <a href="https://thekpihub.com" style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.76rem", fontWeight:700, color:"rgba(255,255,255,0.38)", textDecoration:"none", letterSpacing:"0.1em", textTransform:"uppercase" }}>The KPI Hub</a>
            <span style={{ color:BORD, fontSize:"1.1rem", lineHeight:1 }}>/</span>
            <span style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.9rem", fontWeight:800, color:GOLD, letterSpacing:"0.02em" }}>AI Wingman</span>
          </div>
          <div style={{ display:"flex", gap:28 }} className="hidden md:flex">
            {[["Features","#features"],["How it works","#how-it-works"],["Pricing","#pricing"]].map(([l,h]) => (
              <a key={l} href={h} style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.8rem", fontWeight:600, color:"rgba(255,255,255,0.42)", textDecoration:"none", letterSpacing:"0.06em" }}>{l}</a>
            ))}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            {user
              ? <button onClick={() => navigate("/dashboard")} style={{ padding:"8px 20px", background:GOLD, color:BG, border:"none", borderRadius:7, fontFamily:"Figtree,sans-serif", fontSize:"0.76rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer" }}>Open Wingman</button>
              : <>
                  <button onClick={() => navigate("/auth")} style={{ padding:"8px 16px", background:"transparent", border:`1px solid ${BORD}`, color:"rgba(255,255,255,0.55)", borderRadius:7, fontFamily:"Figtree,sans-serif", fontSize:"0.76rem", fontWeight:600, cursor:"pointer" }}>Sign in</button>
                  <button onClick={openWingman} style={{ padding:"8px 20px", background:GOLD, color:BG, border:"none", borderRadius:7, fontFamily:"Figtree,sans-serif", fontSize:"0.76rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer" }}>Get Premium</button>
                </>
            }
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.section style={{ opacity:heroOpacity, y:heroY, position:"relative", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"120px 24px 100px", overflow:"hidden" }}>
        <PulseBg />
        <div style={{ position:"relative", zIndex:2, maxWidth:800 }}>
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"10px 20px", border:`1px solid rgba(233,161,35,0.28)`, background:"rgba(233,161,35,0.06)", borderRadius:100, marginBottom:36, fontFamily:"Figtree,sans-serif", fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:GOLD }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:GOLD, boxShadow:`0 0 12px ${GOLD}` }} />
              Exclusive to KPI Hub Premium Members
            </div>
            <h1 style={{ fontFamily:"Figtree,sans-serif", fontSize:"clamp(2.8rem,6vw,5.2rem)", fontWeight:800, lineHeight:1.06, letterSpacing:"-0.025em", marginBottom:24, color:"#fff" }}>
              Your KPIs,{" "}
              <em style={{ fontStyle:"italic", color:GOLD, textShadow:`0 0 40px rgba(233,161,35,0.35)` }}>understood</em>
              {" "}by AI
            </h1>
            <p style={{ fontFamily:"Inter,sans-serif", fontSize:"1.15rem", fontWeight:300, color:"rgba(255,255,255,0.5)", lineHeight:1.65, maxWidth:600, margin:"0 auto 44px" }}>
              Ditto Wingman is the AI agent built into The KPI Hub. It monitors your metrics, detects anomalies, writes executive reports, and answers any question about your data — in plain language.
            </p>
            <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
              <button onClick={openWingman} style={{ padding:"14px 32px", background:GOLD, color:BG, border:"none", borderRadius:8, fontFamily:"Figtree,sans-serif", fontSize:"0.82rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                Upgrade to Premium <ArrowRight size={16} />
              </button>
              {user && (
                <button onClick={() => navigate("/dashboard")} style={{ padding:"14px 28px", background:"transparent", border:`1px solid ${BORD}`, color:"rgba(255,255,255,0.65)", borderRadius:8, fontFamily:"Figtree,sans-serif", fontSize:"0.82rem", fontWeight:600, cursor:"pointer" }}>
                  Open Wingman
                </button>
              )}
            </div>
            <div style={{ marginTop:48, display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"12px 28px", fontFamily:"Figtree,sans-serif", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(255,255,255,0.28)" }}>
              {["Powered by Claude Opus 4.7","Part of thekpihub.com","No extra setup","Included in Premium"].map(t => (
                <span key={t} style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
                  <span style={{ color:GOLD }}>✦</span> {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
        <div style={{ position:"absolute", bottom:32, left:"50%", transform:"translateX(-50%)", color:"rgba(255,255,255,0.2)" }} className="animate-bounce">
          <ChevronDown size={20} />
        </div>
      </motion.section>

      {/* ── Persona tabs ─────────────────────────────────────────────────── */}
      <section id="features" style={{ padding:"100px 24px", background:"rgba(13,15,43,0.55)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <SectionEyebrow label="Built for your role" />
          <h2 style={{ fontFamily:"Figtree,sans-serif", fontSize:"clamp(2rem,4vw,3.2rem)", fontWeight:700, letterSpacing:"-0.025em", lineHeight:1.1, marginBottom:40 }}>
            Every KPI Hub role gets a{" "}
            <em style={{ fontStyle:"italic", color:GOLD }}>dedicated</em> view
          </h2>

          <div style={{ display:"flex", gap:2, background:BORD, border:`1px solid ${BORD}`, borderRadius:12, overflow:"hidden", marginBottom:32 }}>
            {PERSONAS.map((p, i) => (
              <button key={i} onClick={() => setActivePersona(i)} style={{ flex:1, padding:"18px 12px", background:activePersona===i?BG:"rgba(13,15,43,0.8)", border:"none", textAlign:"left", cursor:"pointer", display:"flex", flexDirection:"column", gap:4, boxShadow:activePersona===i?`inset 0 2px 0 ${GOLD}`:"none", transition:"all 0.25s", color:"inherit" }}>
                <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.6rem", color:"rgba(255,255,255,0.28)", letterSpacing:"0.08em" }}>{p.num}</span>
                <span style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.82rem", fontWeight:700, color:activePersona===i?GOLD:"rgba(255,255,255,0.75)", letterSpacing:"0.02em" }}>{p.role}</span>
                <span style={{ fontFamily:"Inter,sans-serif", fontSize:"0.7rem", color:"rgba(255,255,255,0.28)" }}>{p.forLabel}</span>
              </button>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.3fr", gap:48, alignItems:"center" }} className="lp-persona-grid">
            <div>
              <span style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:GOLD, display:"block", marginBottom:14 }}>
                {PERSONAS[activePersona].forLabel}
              </span>
              <h3 style={{ fontFamily:"Figtree,sans-serif", fontSize:"clamp(1.6rem,3vw,2.2rem)", fontWeight:700, letterSpacing:"-0.02em", lineHeight:1.15, marginBottom:16 }}>
                {PERSONAS[activePersona].headline}{" "}
                <em style={{ fontStyle:"italic", color:GOLD }}>{PERSONAS[activePersona].highlight}</em>
              </h3>
              <p style={{ fontFamily:"Inter,sans-serif", fontSize:"1rem", lineHeight:1.8, color:"rgba(255,255,255,0.48)", marginBottom:28 }}>
                {PERSONAS[activePersona].body}
              </p>
              <a href="https://thekpihub.com/pricing" style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.76rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:GOLD, borderBottom:`1px solid ${GOLD}`, paddingBottom:4, display:"inline-flex", alignItems:"center", gap:8, textDecoration:"none" }}>
                Get access <ArrowRight size={14} />
              </a>
            </div>
            <motion.div key={activePersona} initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.3 }}>
              <PersonaDash p={PERSONAS[activePersona]} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Feature blocks ────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding:"100px 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <SectionEyebrow label="What Wingman does" />
          <h2 style={{ fontFamily:"Figtree,sans-serif", fontSize:"clamp(2rem,4vw,3.2rem)", fontWeight:700, letterSpacing:"-0.025em", lineHeight:1.1, marginBottom:56 }}>
            Four engines, one{" "}
            <em style={{ fontStyle:"italic", color:GOLD }}>intelligent</em> platform
          </h2>

          {FEATURES.map((feat, i) => {
            const Mock = FEATURE_MOCKS[i];
            return (
              <motion.div key={feat.num} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:0.1 }}
                style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center", padding:"64px 0", borderTop:i===0?"none":`1px solid ${BORD}` }}>
                <div style={{ order:feat.flip?2:1 }}>
                  <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.66rem", color:"rgba(255,255,255,0.22)", letterSpacing:"0.1em", marginBottom:10 }}>{feat.num}</div>
                  <h3 style={{ fontFamily:"Figtree,sans-serif", fontSize:"clamp(1.8rem,3vw,2.4rem)", fontWeight:700, letterSpacing:"-0.02em", lineHeight:1.1, marginBottom:10 }}>
                    <em style={{ fontStyle:"italic", color:GOLD }}>{feat.name}</em>
                  </h3>
                  <div style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.8rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:GOLD, marginBottom:18 }}>{feat.claim}</div>
                  <p style={{ fontFamily:"Inter,sans-serif", fontSize:"1rem", lineHeight:1.8, color:"rgba(255,255,255,0.48)", maxWidth:420 }}>{feat.body}</p>
                </div>
                <div style={{ order:feat.flip?1:2 }}><Mock /></div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding:"100px 24px", background:"rgba(13,15,43,0.55)" }}>
        <div style={{ maxWidth:1000, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <SectionEyebrow label="Pricing" />
            <h2 style={{ fontFamily:"Figtree,sans-serif", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:700, letterSpacing:"-0.025em", lineHeight:1.1, marginBottom:16 }}>
              Included with{" "}
              <em style={{ fontStyle:"italic", color:GOLD }}>thekpihub.com</em> Premium
            </h2>
            <p style={{ fontFamily:"Inter,sans-serif", fontSize:"1rem", color:"rgba(255,255,255,0.42)", maxWidth:500, margin:"0 auto" }}>
              Ditto Wingman is not a separate product — it's built into your KPI Hub subscription. No extra sign-up, no extra fee.
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, alignItems:"stretch" }}>
            {[
              { name:"Starter",   forText:"For small teams",          price:"Included", period:"in KPI Hub Starter",       pop:false,
                features:["5 KPI dashboards","Weekly AI digest","Anomaly alerts (email)","Basic report writer"] },
              { name:"Premium",   forText:"The full Wingman experience", price:"From $49", period:"/month on thekpihub.com", pop:true,
                features:["Unlimited dashboards","Real-time Pulse Engine","AI anomaly detection","Auto-generated reports","4 role-based persona views","Slack & Notion integrations"] },
              { name:"Enterprise", forText:"For large orgs",          price:"Custom",   period:"contact us",               pop:false,
                features:["Everything in Premium","SSO / SAML","Custom data connectors","Dedicated AI instance","SLA guarantee","White-label option"] },
            ].map(plan => (
              <motion.div key={plan.name} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                style={{ background:plan.pop?`linear-gradient(180deg,rgba(233,161,35,0.08),${CARD} 40%)`:CARD, border:`1px solid ${plan.pop?"rgba(233,161,35,0.35)":BORD}`, borderRadius:14, padding:"36px 28px", display:"flex", flexDirection:"column", gap:18, position:"relative" }}>
                {plan.pop && (
                  <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", padding:"6px 16px", borderRadius:100, background:GOLD, color:BG, fontFamily:"Figtree,sans-serif", fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
                    Most Popular
                  </div>
                )}
                <div style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.8rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:GOLD }}>{plan.name}</div>
                <div style={{ fontFamily:"Figtree,sans-serif", fontSize:"1.3rem", fontWeight:700, letterSpacing:"-0.01em", lineHeight:1.2, color:"#fff", minHeight:"2.6em" }}>{plan.forText}</div>
                <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.7rem", color:"rgba(255,255,255,0.3)", padding:"8px 12px", background:"rgba(255,255,255,0.03)", border:`1px dashed ${BORD}`, borderRadius:6 }}>
                  {plan.price} <span style={{ opacity:0.6 }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display:"flex", gap:10, alignItems:"flex-start", fontFamily:"Inter,sans-serif", fontSize:"0.88rem", color:"rgba(255,255,255,0.52)", lineHeight:1.5 }}>
                      <Check size={14} style={{ color:GOLD, flexShrink:0, marginTop:2 }} /> {f}
                    </li>
                  ))}
                </ul>
                <a href="https://thekpihub.com/pricing" style={{ marginTop:"auto", textAlign:"center", padding:"14px 24px", borderRadius:8, fontFamily:"Figtree,sans-serif", fontSize:"0.76rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", background:plan.pop?GOLD:"transparent", color:plan.pop?BG:"rgba(255,255,255,0.65)", border:`1px solid ${plan.pop?GOLD:BORD}`, textDecoration:"none", display:"block" }}>
                  {plan.pop ? "Get Premium on KPI Hub" : "Learn more →"}
                </a>
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign:"center", marginTop:32, display:"flex", justifyContent:"center", flexWrap:"wrap", gap:"12px 28px", fontFamily:"Figtree,sans-serif", fontSize:"0.66rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(255,255,255,0.28)" }}>
            {["No separate sign-up","Cancel anytime","Instant access after upgrade","14-day free trial"].map(n => (
              <span key={n} style={{ display:"inline-flex", alignItems:"center", gap:8 }}><span style={{ color:GOLD }}>✦</span> {n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section style={{ padding:"100px 24px" }}>
        <div style={{ maxWidth:860, margin:"0 auto", textAlign:"center" }}>
          <h2 style={{ fontFamily:"Figtree,sans-serif", fontSize:"clamp(2.4rem,5vw,4rem)", fontWeight:700, lineHeight:1.08, letterSpacing:"-0.025em", marginBottom:24, color:"#fff" }}>
            Stop reading dashboards.<br />
            Start <em style={{ fontStyle:"italic", color:GOLD }}>understanding</em> them.
          </h2>
          <p style={{ fontFamily:"Inter,sans-serif", fontSize:"1.05rem", color:"rgba(255,255,255,0.42)", lineHeight:1.7, maxWidth:500, margin:"0 auto 44px" }}>
            Upgrade to The KPI Hub Premium and get instant access to Ditto Wingman — the AI that turns your metrics into decisions.
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:14, flexWrap:"wrap" }}>
            <a href="https://thekpihub.com/pricing" style={{ padding:"14px 32px", background:GOLD, color:BG, borderRadius:8, fontFamily:"Figtree,sans-serif", fontSize:"0.82rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:8 }}>
              Upgrade on thekpihub.com <ArrowRight size={16} />
            </a>
            {user && (
              <button onClick={() => navigate("/dashboard")} style={{ padding:"14px 28px", background:"transparent", border:`1px solid ${BORD}`, color:"rgba(255,255,255,0.6)", borderRadius:8, fontFamily:"Figtree,sans-serif", fontSize:"0.82rem", fontWeight:600, cursor:"pointer" }}>
                Open Wingman now
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop:`1px solid ${BORD}`, padding:"56px 24px 32px", background:BG }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.2fr repeat(3,1fr)", gap:40, marginBottom:48 }} className="lp-foot-cols">
            <div>
              <div style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.96rem", fontWeight:800, letterSpacing:"0.04em", color:"#fff", display:"inline-flex", alignItems:"center", gap:6, marginBottom:14 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:GOLD, boxShadow:`0 0 10px ${GOLD}` }} />The KPI Hub
              </div>
              <p style={{ fontFamily:"Inter,sans-serif", fontSize:"0.86rem", color:"rgba(255,255,255,0.38)", lineHeight:1.6, maxWidth:260 }}>
                Ditto Wingman is the AI intelligence layer built into The KPI Hub — the performance analytics platform for modern teams.
              </p>
            </div>
            {[
              { title:"Product",  links:[["Features","#features"],["How it works","#how-it-works"],["Pricing","#pricing"],["GitHub","https://github.com/nitro0dust-pixel/ditto-wingman"]] },
              { title:"Company",  links:[["thekpihub.com","https://thekpihub.com"],["Blog","https://thekpihub.com/blog"],["Contact","https://thekpihub.com/contact"]] },
              { title:"Legal",    links:[["Privacy","https://thekpihub.com/privacy"],["Terms","https://thekpihub.com/terms"]] },
            ].map(col => (
              <div key={col.title}>
                <h5 style={{ fontFamily:"Figtree,sans-serif", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:GOLD, marginBottom:18 }}>{col.title}</h5>
                <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:10 }}>
                  {col.links.map(([label, href]) => (
                    <li key={label}><a href={href} style={{ fontFamily:"Inter,sans-serif", fontSize:"0.86rem", color:"rgba(255,255,255,0.38)", textDecoration:"none" }}>{label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop:`1px solid ${BORD}`, paddingTop:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, fontFamily:"JetBrains Mono,monospace", fontSize:"0.7rem", color:"rgba(255,255,255,0.24)" }}>
            <span>© 2025 The KPI Hub. Ditto Wingman is a KPI Hub product.</span>
            <span>Powered by Claude Opus 4.7 · <span style={{ color:GOLD }}>agent.thekpihub.com</span></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
