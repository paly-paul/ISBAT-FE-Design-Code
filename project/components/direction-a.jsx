// Direction A — "Editorial split": brand-blue hero with live stats on left, form on right.
// Screens: landing, staff, student, forgot (3 steps), otp, first-time setup (3 steps), expired, redirect preview

const { Icon, PolicyFooter, LiveStatsRotator, Stepper, ISBAT_ROLES } = window;

// --- Hero panel (left) ---
function HeroA({ accent = "#2E6BE6" }) {
  return (
    <div style={{
      position: "relative", height: "100%",
      background: `linear-gradient(170deg, ${accent} 0%, #1A3C94 100%)`,
      padding: "48px 56px", display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* subtle pattern */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: .08 }} preserveAspectRatio="none">
        <defs>
          <pattern id="grid-a" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0v28" fill="none" stroke="#fff" strokeWidth=".5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-a)"/>
      </svg>
      {/* orange accent stripe */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "#E68A2E" }} />

      {/* Top row */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, color: "#fff" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fff", color: accent,
                      display: "grid", placeContent: "center", fontFamily: "var(--font-serif)",
                      fontWeight: 600, fontSize: 16, letterSpacing: "-0.02em" }}>IS</div>
        <div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 500 }}>ISBAT University</div>
          <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", opacity: .7 }}>Enterprise Resource Portal</div>
        </div>
      </div>

      {/* Headline */}
      <div style={{ position: "relative", marginTop: 56, color: "#fff" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 40, lineHeight: 1.1, fontWeight: 500, letterSpacing: "-0.02em", maxWidth: 420 }}>
          One portal for the work of the university.
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.55, opacity: .78, marginTop: 16, maxWidth: 380 }}>
          Admissions, academics, assessments and student services — coordinated in real time for faculty, staff and students.
        </div>
      </div>

      {/* Stats */}
      <div style={{ position: "relative", marginTop: "auto", paddingTop: 32 }}>
        <LiveStatsRotator />
      </div>

      {/* footer */}
      <div style={{ position: "relative", marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.15)" }}>
        <PolicyFooter tone="dark" />
      </div>
    </div>
  );
}

// Right panel wrapper
function PanelA({ children, headline, eyebrow }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100%", background: "#fff" }}>
      <HeroA />
      <div style={{ padding: "56px 64px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: 24, right: 32, fontSize: 11, color: "var(--isb-muted)" }}>
          Need help? <a href="mailto:itsupport@isbatuniversity.ac.ug" className="isb-link">itsupport@isbatuniversity.ac.ug</a>
        </div>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {eyebrow && <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--isb-blue)", marginBottom: 10, fontWeight: 500 }}>{eyebrow}</div>}
          {headline && (
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", margin: "0 0 8px", color: "var(--isb-ink)" }}>
              {headline}
            </h1>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------- Screens ----------

function LandingA({ onPick }) {
  return (
    <PanelA eyebrow="Sign in" headline="Welcome to ISBAT ERP.">
      <p style={{ color: "var(--isb-muted)", fontSize: 14, margin: "0 0 32px", lineHeight: 1.55 }}>
        Choose your portal. Staff and faculty sign in to the administrative ERP; students use the student portal.
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        <PortalCard
          onClick={() => onPick("staff")}
          icon="brief"
          title="Staff & Faculty"
          sub="For Registrars, Deans, Lecturers, Counselors and Support"
          meta="erp.isbatuniversity.ac.ug"
          accent="var(--isb-blue)"
        />
        <PortalCard
          onClick={() => onPick("student")}
          icon="grad"
          title="Students"
          sub="Fee status, timetables, grades, registration and services"
          meta="erp.isbatuniversity.ac.ug/frmStudentLogin"
          accent="#2EA862"
        />
      </div>
      <div style={{ marginTop: 28, fontSize: 12, color: "var(--isb-muted)", display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="shield" size={14} color="var(--isb-muted)" />
        Secure sign-in · Your session is encrypted end-to-end.
      </div>
    </PanelA>
  );
}

function PortalCard({ icon, title, sub, meta, accent, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        all: "unset", cursor: "pointer",
        display: "grid", gridTemplateColumns: "44px 1fr auto", alignItems: "center", gap: 16,
        padding: "18px 20px", borderRadius: 10,
        border: `1px solid ${hover ? accent : "var(--isb-line)"}`,
        background: hover ? "#fff" : "var(--isb-paper-2)",
        boxShadow: hover ? `0 6px 20px rgba(14,22,40,.06), 0 0 0 3px ${accent}18` : "none",
        transition: "all .18s",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: `${accent}15`,
        color: accent, display: "grid", placeContent: "center"
      }}>
        <Icon name={icon} size={22} color={accent} stroke={1.6} />
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 500, color: "var(--isb-ink)" }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "var(--isb-muted)", marginTop: 2 }}>{sub}</div>
        <div style={{ fontSize: 10.5, color: "var(--isb-muted)", fontFamily: "var(--font-mono)", marginTop: 6, opacity: .7 }}>{meta}</div>
      </div>
      <Icon name="arrow" size={18} color={accent} />
    </button>
  );
}

function StaffLoginA({ onSubmit, onBack, onForgot }) {
  const [staffId, setStaffId] = React.useState("AR-2019-0042");
  const [pw, setPw] = React.useState("••••••••••");
  const [show, setShow] = React.useState(false);
  const [caps, setCaps] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  const handle = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onSubmit && onSubmit({ staffId }); }, 900);
  };

  return (
    <PanelA eyebrow="Staff & Faculty" headline="Sign in to ERP.">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 12 }}>
        <button onClick={onBack} className="isb-btn link" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon name="back" size={13} /> All portals
        </button>
      </div>

      <form onSubmit={handle}>
        <div className="isb-field">
          <label className="isb-label">Staff ID</label>
          <input
            className="isb-input"
            value={staffId}
            onChange={e => setStaffId(e.target.value)}
            placeholder="e.g. AR-2019-0042"
            autoComplete="username"
          />
          <div className="hint">Format: ROLE-YYYY-NNNN · Case-sensitive</div>
        </div>

        <div className="isb-field">
          <label className="isb-label" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Password</span>
            <button type="button" onClick={onForgot} className="isb-btn link" style={{ fontSize: 11 }}>Forgot password?</button>
          </label>
          <div className="isb-pw-wrap">
            <input
              className="isb-input"
              type={show ? "text" : "password"}
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyUp={e => setCaps(e.getModifierState && e.getModifierState("CapsLock"))}
              style={{ paddingRight: 62 }}
              autoComplete="current-password"
            />
            <button type="button" className="toggle" onClick={() => setShow(s => !s)}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {caps && (
            <div className="err"><Icon name="caps" size={12} color="var(--isb-red)" /> Caps Lock is on</div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 0 22px" }}>
          <label className="isb-check">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            Trust this device for 30 days
          </label>
        </div>

        <button type="submit" className="isb-btn primary full" disabled={loading}>
          {loading ? <><span className="spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: 99, display: "inline-block" }}/> Verifying credentials…</>
                   : <>Continue <Icon name="arrow" size={15} color="#fff" /></>}
        </button>

        <div className="isb-divider">Single sign-on</div>
        <button type="button" className="isb-btn ghost full">
          <svg width="14" height="14" viewBox="0 0 23 23"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M12 1h10v10H12z"/><path fill="#00A4EF" d="M1 12h10v10H1z"/><path fill="#FFB900" d="M12 12h10v10H12z"/></svg>
          Continue with ISBAT Microsoft 365
        </button>
      </form>

      <div style={{ marginTop: 28, padding: 14, background: "var(--isb-paper-2)", border: "1px solid var(--isb-line-2)", borderRadius: 8, fontSize: 11.5, color: "var(--isb-muted)", lineHeight: 1.55 }}>
        By signing in you consent to ISBAT's processing of your data for ERP operations. See our <a href="#" className="isb-link">Data Processing Consent</a> and <a href="#" className="isb-link">Privacy Policy</a>.
      </div>
    </PanelA>
  );
}

function StudentLoginA({ onSubmit, onBack, onForgot }) {
  const [id, setId] = React.useState("ISB/2024/BSCS/0142");
  const [pw, setPw] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handle = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onSubmit && onSubmit(); }, 900);
  };

  return (
    <PanelA eyebrow="Students" headline="Student Portal sign-in.">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 12 }}>
        <button onClick={onBack} className="isb-btn link" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon name="back" size={13} /> All portals
        </button>
        <span style={{ color: "var(--isb-line)" }}>·</span>
        <span className="isb-chip" style={{ background: "#E4F4EB", color: "#1D6B3E" }}>/frmStudentLogin.aspx</span>
      </div>

      <form onSubmit={handle}>
        <div className="isb-field">
          <label className="isb-label">Student ID</label>
          <input className="isb-input" value={id} onChange={e => setId(e.target.value)} placeholder="ISB/YYYY/PROG/NNNN" />
          <div className="hint">Printed on your admission letter and ID card.</div>
        </div>

        <div className="isb-field">
          <label className="isb-label" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Password</span>
            <button type="button" onClick={onForgot} className="isb-btn link" style={{ fontSize: 11 }}>Forgot password?</button>
          </label>
          <div className="isb-pw-wrap">
            <input className="isb-input" type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} placeholder="Enter password" style={{ paddingRight: 62 }} />
            <button type="button" className="toggle" onClick={() => setShow(s => !s)}>{show ? "Hide" : "Show"}</button>
          </div>
        </div>

        <button type="submit" className="isb-btn primary full" style={{ background: "#2EA862", boxShadow: "0 2px 4px rgba(46,168,98,.25)", marginTop: 12 }} disabled={loading}>
          {loading ? "Signing in…" : <>Sign in to Student Portal <Icon name="arrow" size={15} color="#fff" /></>}
        </button>

        <div style={{ marginTop: 16, fontSize: 12.5, color: "var(--isb-muted)", textAlign: "center" }}>
          First time signing in? <a href="#" className="isb-link">Activate your student account</a>
        </div>
      </form>

      <div style={{ marginTop: 28, padding: 14, background: "var(--isb-paper-2)", border: "1px solid var(--isb-line-2)", borderRadius: 8, fontSize: 11.5, color: "var(--isb-muted)" }}>
        Having trouble? Email <a href="mailto:studentsupport@isbatuniversity.ac.ug" className="isb-link">studentsupport@isbatuniversity.ac.ug</a> or call <span className="nums">+256 414 532 500</span>.
      </div>
    </PanelA>
  );
}

function ForgotA({ onBack }) {
  const [step, setStep] = React.useState(0);
  const [method, setMethod] = React.useState("email");
  return (
    <PanelA eyebrow="Reset password" headline="We'll get you back in.">
      <div style={{ marginBottom: 22 }}>
        <Stepper steps={["Identify", "Verify", "New password"]} current={step} />
      </div>

      {step === 0 && (
        <>
          <p style={{ color: "var(--isb-muted)", fontSize: 13.5, margin: "0 0 18px", lineHeight: 1.55 }}>
            Enter your Staff ID to receive a one-time code. We'll send it to the contact on file.
          </p>
          <div className="isb-field">
            <label className="isb-label">Staff ID</label>
            <input className="isb-input" defaultValue="AR-2019-0042" />
          </div>
          <div className="isb-field">
            <label className="isb-label">Send code via</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <MethodPill icon="mail" label="Email" sub="m******@isbat.ac.ug" active={method === "email"} onClick={() => setMethod("email")} />
              <MethodPill icon="phone" label="SMS" sub="+256 ***** 4821" active={method === "sms"} onClick={() => setMethod("sms")} />
            </div>
          </div>
          <button className="isb-btn primary full" onClick={() => setStep(1)}>Send code <Icon name="arrow" size={15} color="#fff" /></button>
        </>
      )}

      {step === 1 && (
        <>
          <p style={{ color: "var(--isb-muted)", fontSize: 13.5, margin: "0 0 18px", lineHeight: 1.55 }}>
            We sent a 6-digit code to {method === "email" ? "m******@isbat.ac.ug" : "+256 ***** 4821"}. It expires in 10 minutes.
          </p>
          <OtpInput />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 0 22px", fontSize: 12, color: "var(--isb-muted)" }}>
            <span><Icon name="clock" size={12} /> Expires in <span className="nums">09:42</span></span>
            <button className="isb-btn link" style={{ fontSize: 12 }}>Resend code</button>
          </div>
          <button className="isb-btn primary full" onClick={() => setStep(2)}>Verify <Icon name="arrow" size={15} color="#fff" /></button>
        </>
      )}

      {step === 2 && (
        <>
          <p style={{ color: "var(--isb-muted)", fontSize: 13.5, margin: "0 0 18px", lineHeight: 1.55 }}>
            Create a new password. Must be at least 10 characters with a number and a symbol.
          </p>
          <div className="isb-field">
            <label className="isb-label">New password</label>
            <input className="isb-input" type="password" defaultValue="••••••••••••" />
            <StrengthBar level={3} />
          </div>
          <div className="isb-field">
            <label className="isb-label">Confirm new password</label>
            <input className="isb-input" type="password" defaultValue="••••••••••••" />
          </div>
          <button className="isb-btn primary full" onClick={onBack}>Update password <Icon name="check" size={15} color="#fff" /></button>
        </>
      )}

      <div style={{ marginTop: 22, textAlign: "center" }}>
        <button className="isb-btn link" onClick={onBack} style={{ fontSize: 12.5 }}>
          <Icon name="back" size={12} /> Back to sign in
        </button>
      </div>
    </PanelA>
  );
}

function MethodPill({ icon, label, sub, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      all: "unset", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
      border: active ? "1px solid var(--isb-blue)" : "1px solid var(--isb-line)",
      background: active ? "var(--isb-blue-050)" : "#fff",
      borderRadius: 8, transition: "all .15s",
    }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: active ? "var(--isb-blue)" : "var(--isb-paper)", color: active ? "#fff" : "var(--isb-muted)", display: "grid", placeContent: "center" }}>
        <Icon name={icon} size={14} color="currentColor" />
      </div>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--isb-ink)" }}>{label}</div>
        <div style={{ fontSize: 10.5, color: "var(--isb-muted)", fontFamily: "var(--font-mono)" }}>{sub}</div>
      </div>
    </button>
  );
}

function StrengthBar({ level = 2 }) {
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["#C84848", "#D9A51E", "#2EA862", "#2EA862"];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= level ? colors[level] : "var(--isb-line)" }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: "var(--isb-muted)", marginTop: 6, display: "flex", justifyContent: "space-between" }}>
        <span>Password strength</span>
        <span style={{ color: colors[level], fontWeight: 500 }}>{labels[level]}</span>
      </div>
    </div>
  );
}

function OtpInput() {
  const [vals, setVals] = React.useState(["2","9","4","","",""]);
  const refs = React.useRef([]);
  const set = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const n = [...vals]; n[i] = v; setVals(n);
    if (v && i < 5) refs.current[i+1]?.focus();
  };
  return (
    <div className="isb-otp">
      {vals.map((v, i) => (
        <input key={i} ref={el => refs.current[i] = el} value={v} onChange={e => set(i, e.target.value)} maxLength={1} inputMode="numeric" />
      ))}
    </div>
  );
}

function OtpStepA({ onBack, onNext }) {
  return (
    <PanelA eyebrow="Two-factor authentication" headline="Verify it's you.">
      <p style={{ color: "var(--isb-muted)", fontSize: 13.5, margin: "0 0 24px", lineHeight: 1.55 }}>
        We've sent a 6-digit code to <b style={{ color: "var(--isb-ink)" }}>m******@isbat.ac.ug</b>.
        Enter it below to continue.
      </p>
      <OtpInput />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "22px 0", fontSize: 12, color: "var(--isb-muted)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icon name="clock" size={12} /> Code expires in <span className="nums" style={{ color: "var(--isb-ink)", fontWeight: 500 }}>09:42</span>
        </span>
        <button className="isb-btn link" style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon name="refresh" size={12} /> Resend
        </button>
      </div>
      <button className="isb-btn primary full" onClick={onNext}>Verify and continue <Icon name="arrow" size={15} color="#fff" /></button>
      <div style={{ marginTop: 18, fontSize: 12, color: "var(--isb-muted)", textAlign: "center" }}>
        Can't access your email? <a href="#" className="isb-link">Use recovery method</a>
      </div>

      <div style={{ marginTop: 22, textAlign: "center" }}>
        <button className="isb-btn link" onClick={onBack} style={{ fontSize: 12.5 }}>
          <Icon name="back" size={12} /> Use a different account
        </button>
      </div>
    </PanelA>
  );
}

function FirstTimeA({ onBack }) {
  const [step, setStep] = React.useState(0);
  return (
    <PanelA eyebrow="Welcome, first-time sign-in" headline="Secure your account.">
      <div style={{ marginBottom: 22 }}>
        <Stepper steps={["Confirm details", "Set password", "Two-factor"]} current={step} />
      </div>

      {step === 0 && (
        <>
          <div style={{ padding: 14, background: "var(--isb-blue-050)", border: "1px solid #D8E4FC", borderRadius: 8, fontSize: 12.5, color: "var(--isb-blue-700)", marginBottom: 18, display: "flex", gap: 10 }}>
            <Icon name="sparkle" size={16} color="var(--isb-blue)" />
            <div>Your account was created by HR/IT on <b>22 Apr 2026</b>. Please confirm your details and set up your password.</div>
          </div>
          <DetailRow label="Full name" value="Muwanguzi Rebecca Nakato" />
          <DetailRow label="Role" value="Asst. Registrar — Admission" />
          <DetailRow label="Staff ID" value="ARA-2026-0108" mono />
          <DetailRow label="Email on file" value="r.muwanguzi@isbat.ac.ug" />
          <DetailRow label="Department" value="Admissions & Records" last />
          <button className="isb-btn primary full" style={{ marginTop: 18 }} onClick={() => setStep(1)}>
            These details are correct <Icon name="arrow" size={15} color="#fff" />
          </button>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--isb-muted)", textAlign: "center" }}>
            Something wrong? <a href="#" className="isb-link">Contact HR</a>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <p style={{ color: "var(--isb-muted)", fontSize: 13.5, margin: "0 0 18px", lineHeight: 1.55 }}>
            Choose a strong password. At least 10 characters, 1 number and 1 symbol.
          </p>
          <div className="isb-field">
            <label className="isb-label">New password</label>
            <input className="isb-input" type="password" defaultValue="••••••••••••" />
            <StrengthBar level={2} />
          </div>
          <div className="isb-field">
            <label className="isb-label">Confirm password</label>
            <input className="isb-input" type="password" defaultValue="••••••••••••" />
          </div>
          <div style={{ padding: 10, fontSize: 11.5, color: "var(--isb-muted)", background: "var(--isb-paper-2)", border: "1px solid var(--isb-line-2)", borderRadius: 6 }}>
            <div style={{ display: "grid", gap: 4 }}>
              <Check ok>At least 10 characters</Check>
              <Check ok>Contains a number</Check>
              <Check>Contains a symbol (! @ # $ %)</Check>
              <Check ok>Not used in the last 5 passwords</Check>
            </div>
          </div>
          <button className="isb-btn primary full" style={{ marginTop: 14 }} onClick={() => setStep(2)}>Continue <Icon name="arrow" size={15} color="#fff" /></button>
        </>
      )}

      {step === 2 && (
        <>
          <p style={{ color: "var(--isb-muted)", fontSize: 13.5, margin: "0 0 18px", lineHeight: 1.55 }}>
            Choose where we send your sign-in verification codes.
          </p>
          <MethodPill icon="mail" label="r.muwanguzi@isbat.ac.ug" sub="Primary email" active onClick={() => {}} />
          <div style={{ height: 10 }} />
          <MethodPill icon="phone" label="+256 772 448 219" sub="Add SMS backup" onClick={() => {}} />
          <label className="isb-check" style={{ marginTop: 20 }}>
            <input type="checkbox" defaultChecked />
            I agree to the <a href="#" className="isb-link" style={{ marginLeft: 4 }}>Data Processing Consent</a>
          </label>
          <button className="isb-btn primary full" style={{ marginTop: 22 }} onClick={onBack}>Finish setup <Icon name="check" size={15} color="#fff" /></button>
        </>
      )}
    </PanelA>
  );
}

function DetailRow({ label, value, mono, last }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", padding: "10px 0", borderBottom: last ? "none" : "1px solid var(--isb-line-2)", fontSize: 13 }}>
      <div style={{ color: "var(--isb-muted)", fontSize: 11.5, letterSpacing: ".04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: "var(--isb-ink)", fontWeight: 500, fontFamily: mono ? "var(--font-mono)" : undefined, fontSize: mono ? 12.5 : 13.5 }}>{value}</div>
    </div>
  );
}

function Check({ ok, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: ok ? "var(--isb-green)" : "var(--isb-muted)" }}>
      <div style={{ width: 14, height: 14, borderRadius: 99, display: "grid", placeContent: "center", background: ok ? "var(--isb-green)" : "transparent", border: ok ? "none" : "1.5px solid var(--isb-line)" }}>
        {ok && <Icon name="check" size={9} color="#fff" stroke={3} />}
      </div>
      {children}
    </div>
  );
}

function SessionExpiredA({ onBack }) {
  return (
    <PanelA eyebrow="Session" headline="Your session has expired.">
      <div style={{ padding: 18, background: "#FFF6EA", border: "1px solid #F3DDB7", borderRadius: 10, fontSize: 13, color: "#7A4B11", marginBottom: 22, display: "flex", gap: 12 }}>
        <Icon name="clock" size={20} color="#B87914" />
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Signed out for inactivity</div>
          You were inactive for 30 minutes. For the security of student and university records, we automatically signed you out.
        </div>
      </div>
      <div style={{ padding: 14, background: "var(--isb-paper-2)", border: "1px solid var(--isb-line-2)", borderRadius: 8, marginBottom: 18 }}>
        <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--isb-muted)", marginBottom: 10 }}>Last active session</div>
        <div style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 10, alignItems: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: 99, background: "var(--isb-blue)", color: "#fff", display: "grid", placeContent: "center", fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 13 }}>RM</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Rebecca Muwanguzi</div>
            <div style={{ fontSize: 11.5, color: "var(--isb-muted)" }}>Asst. Registrar · Started 14:02 · Expired 14:32</div>
          </div>
        </div>
      </div>

      <div className="isb-field">
        <label className="isb-label">Continue as Rebecca — enter your password</label>
        <div className="isb-pw-wrap">
          <input className="isb-input" type="password" defaultValue="••••••••••••" style={{ paddingRight: 62 }} />
          <button type="button" className="toggle">Show</button>
        </div>
      </div>
      <button className="isb-btn primary full" onClick={onBack}>Resume session <Icon name="arrow" size={15} color="#fff" /></button>
      <div style={{ marginTop: 14, textAlign: "center" }}>
        <button className="isb-btn link" onClick={onBack} style={{ fontSize: 12.5 }}>Sign in as someone else</button>
      </div>
    </PanelA>
  );
}

function RedirectPreviewA({ onBack, roleIdx, onCycle }) {
  const role = ISBAT_ROLES[roleIdx];
  return (
    <PanelA eyebrow="Welcome back" headline={`Hello, ${role.label.split(" ")[0] === "Asst." ? "Rebecca" : "Dr. Akello"}.`}>
      <div style={{ padding: 20, background: "var(--isb-paper-2)", border: "1px solid var(--isb-line-2)", borderRadius: 12, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: role.accent, color: "#fff", display: "grid", placeContent: "center", fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500 }}>
            {role.label.split(" ").map(w => w[0]).filter((_,i,a)=>i<2).join("")}
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--isb-muted)" }}>Signed in as</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 500 }}>{role.label}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fff", border: "1px solid var(--isb-line)", borderRadius: 8 }}>
          <div className="spin" style={{ width: 14, height: 14, border: "2px solid var(--isb-line)", borderTopColor: role.accent, borderRadius: 99 }} />
          <div style={{ fontSize: 13 }}>Redirecting to <b style={{ color: "var(--isb-ink)" }}>{role.dest}</b>…</div>
        </div>
      </div>
      <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--isb-muted)", marginBottom: 10 }}>Role → Destination map</div>
      <div style={{ display: "grid", gap: 2, maxHeight: 240, overflow: "auto", padding: 4, border: "1px solid var(--isb-line-2)", borderRadius: 8 }}>
        {ISBAT_ROLES.map((r, i) => (
          <button key={r.id} onClick={() => onCycle(i)} style={{
            all: "unset", cursor: "pointer",
            display: "grid", gridTemplateColumns: "6px 1fr auto", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: 6,
            background: i === roleIdx ? "var(--isb-blue-050)" : "transparent",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: 99, background: r.accent }} />
            <div style={{ fontSize: 12.5, color: "var(--isb-ink)", fontWeight: i === roleIdx ? 500 : 400 }}>{r.label}</div>
            <div style={{ fontSize: 11, color: "var(--isb-muted)", fontFamily: "var(--font-mono)" }}>→ {r.dest}</div>
          </button>
        ))}
      </div>
    </PanelA>
  );
}

// Direction A router
function DirectionA({ screen, setScreen, roleIdx, setRoleIdx }) {
  return (
    <div className="isb-screen">
      {screen === "landing" && <LandingA onPick={k => setScreen(k === "staff" ? "staff" : "student")} />}
      {screen === "staff"   && <StaffLoginA onBack={() => setScreen("landing")} onForgot={() => setScreen("forgot")} onSubmit={() => setScreen("otp")} />}
      {screen === "student" && <StudentLoginA onBack={() => setScreen("landing")} onForgot={() => setScreen("forgot")} onSubmit={() => setScreen("redirect")} />}
      {screen === "forgot"  && <ForgotA onBack={() => setScreen("staff")} />}
      {screen === "otp"     && <OtpStepA onBack={() => setScreen("staff")} onNext={() => setScreen("redirect")} />}
      {screen === "setup"   && <FirstTimeA onBack={() => setScreen("staff")} />}
      {screen === "expired" && <SessionExpiredA onBack={() => setScreen("staff")} />}
      {screen === "redirect"&& <RedirectPreviewA onBack={() => setScreen("landing")} roleIdx={roleIdx} onCycle={setRoleIdx} />}
    </div>
  );
}

Object.assign(window, { DirectionA });
