// Shared small components + role data for both directions

const ISBAT_ROLES = [
  { id: "vc",   label: "Vice Chancellor",              dest: "Executive Overview",  accent: "#1F55C7" },
  { id: "ar",   label: "Academic Registrar",           dest: "Admissions & Records", accent: "#2E6BE6" },
  { id: "dir",  label: "Director Academics",           dest: "Academic Operations", accent: "#2E6BE6" },
  { id: "dean", label: "Dean",                         dest: "Faculty Dashboard",   accent: "#2EA862" },
  { id: "lec",  label: "Lecturer",                     dest: "My Classes",          accent: "#2EA862" },
  { id: "ara",  label: "Asst. Registrar — Admission",  dest: "Admissions Queue",    accent: "#E68A2E" },
  { id: "ars",  label: "Asst. Registrar — Assessments",dest: "Assessments Hub",     accent: "#E68A2E" },
  { id: "sac",  label: "Student Admission Counselor",  dest: "Counselor Pipeline",  accent: "#D9A51E" },
  { id: "ssup", label: "Student Support",              dest: "Support Tickets",     accent: "#6B7386" },
  { id: "ssvc", label: "Student Service",              dest: "Service Desk",        accent: "#6B7386" },
];

// Tiny SVG icons
const Icon = ({ name, size = 16, color = "currentColor", stroke = 1.75 }) => {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none",
              stroke: color, strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "user":   return <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>;
    case "lock":   return <svg {...p}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
    case "mail":   return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></svg>;
    case "phone":  return <svg {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>;
    case "arrow":  return <svg {...p}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case "back":   return <svg {...p}><path d="M19 12H5M11 5l-7 7 7 7"/></svg>;
    case "check":  return <svg {...p}><path d="M5 12l4 4L19 6"/></svg>;
    case "alert":  return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16v.5"/></svg>;
    case "shield": return <svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/></svg>;
    case "grad":   return <svg {...p}><path d="M2 9l10-4 10 4-10 4L2 9z"/><path d="M6 11v4c0 2 3 3 6 3s6-1 6-3v-4"/></svg>;
    case "brief":  return <svg {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>;
    case "eye":    return <svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>;
    case "eyeoff": return <svg {...p}><path d="M3 3l18 18"/><path d="M10.6 6.1A10.9 10.9 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.3 3.9"/><path d="M6.5 6.5C4 8.3 2 12 2 12s3.5 6 10 6c1.4 0 2.7-.3 3.9-.7"/></svg>;
    case "caps":   return <svg {...p}><path d="M12 4l7 8h-4v6h-6v-6H5l7-8z"/></svg>;
    case "refresh":return <svg {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>;
    case "clock":  return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "doc":    return <svg {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>;
    case "sparkle":return <svg {...p}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z"/></svg>;
    default: return null;
  }
};

// Policy footer shared across both directions
function PolicyFooter({ tone = "light" }) {
  const color = tone === "dark" ? "rgba(255,255,255,.7)" : "var(--isb-muted)";
  const linkColor = tone === "dark" ? "rgba(255,255,255,.85)" : "var(--isb-ink-2)";
  return (
    <div style={{ fontSize: 11, color, lineHeight: 1.6 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
        <a href="#" style={{ color: linkColor, textDecoration: "none", borderBottom: `1px dotted ${color}` }}>IT Policy</a>
        <a href="#" style={{ color: linkColor, textDecoration: "none", borderBottom: `1px dotted ${color}` }}>Privacy Policy</a>
        <a href="#" style={{ color: linkColor, textDecoration: "none", borderBottom: `1px dotted ${color}` }}>Data Security</a>
        <a href="#" style={{ color: linkColor, textDecoration: "none", borderBottom: `1px dotted ${color}` }}>Data Processing Consent</a>
      </div>
      <div style={{ marginTop: 8 }}>
        Support · <a href="mailto:itsupport@isbatuniversity.ac.ug" style={{ color: linkColor }}>itsupport@isbatuniversity.ac.ug</a>
        {" · "}
        <span className="nums">+256 414 532 500</span>
      </div>
    </div>
  );
}

// Live stats rotator for direction A hero
function LiveStatsRotator({ intervalMs = 3200 }) {
  const STATS = [
    { big: "14,208",  label: "Students enrolled this intake",    trend: "+6.2% vs last intake" },
    { big: "142",     label: "Applications being vetted today",  trend: "Spring 2026 · 20261"  },
    { big: "36",      label: "Active academic programmes",       trend: "12 undergraduate · 24 graduate" },
    { big: "418",     label: "Faculty & teaching staff online",  trend: "Last 24 hours" },
    { big: "98.4%",   label: "Registrations completed on time",  trend: "Records · Spring 2026"  },
  ];
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % STATS.length), intervalMs);
    return () => clearInterval(t);
  }, []);
  const s = STATS[i];
  return (
    <div style={{ color: "#fff" }}>
      <div style={{ fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", opacity: .65, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <span className="pulse" style={{ width: 6, height: 6, borderRadius: 99, background: "#7FE3AD", display: "inline-block" }} />
        Live · Spring 2026 Intake
      </div>
      <div key={i} className="fade-up nums" style={{ fontFamily: "var(--font-serif)", fontSize: 72, lineHeight: 1, fontWeight: 500, letterSpacing: "-0.02em" }}>
        {s.big}
      </div>
      <div key={`l${i}`} className="fade-up" style={{ fontSize: 15, opacity: .9, marginTop: 12, maxWidth: 340 }}>
        {s.label}
      </div>
      <div key={`t${i}`} className="fade-up" style={{ fontSize: 12, opacity: .55, marginTop: 6 }}>
        {s.trend}
      </div>
      {/* Dots */}
      <div style={{ display: "flex", gap: 5, marginTop: 34 }}>
        {STATS.map((_, idx) => (
          <div key={idx} style={{
            width: idx === i ? 22 : 6, height: 3, borderRadius: 3,
            background: idx === i ? "#fff" : "rgba(255,255,255,.3)",
            transition: "all .4s"
          }} />
        ))}
      </div>
    </div>
  );
}

// Mini stepper used in forgot-password and first-time setup
function Stepper({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--isb-muted)" }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: i <= current ? "var(--isb-ink)" : "var(--isb-muted)",
            fontWeight: i === current ? 600 : 400
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 99,
              display: "grid", placeContent: "center", fontSize: 10,
              background: i < current ? "var(--isb-blue)" : i === current ? "var(--isb-ink)" : "var(--isb-paper)",
              color: i <= current ? "#fff" : "var(--isb-muted)",
              border: i > current ? "1px solid var(--isb-line)" : "none",
            }}>{i < current ? "✓" : i + 1}</div>
            {s}
          </div>
          {i < steps.length - 1 && <div style={{ width: 18, height: 1, background: "var(--isb-line)" }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

Object.assign(window, { ISBAT_ROLES, Icon, PolicyFooter, LiveStatsRotator, Stepper });
