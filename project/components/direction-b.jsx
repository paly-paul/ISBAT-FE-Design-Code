// Direction B — "Warm canvas, centered card": paper-white background, floating card, subtle brand bloom.
// Same 8 screens as Direction A, different visual system.

const { Icon, PolicyFooter, Stepper, ISBAT_ROLES } = window;

// Background bloom
function CanvasB({ children }) {
  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      background: "var(--isb-paper)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Blue bloom */}
      <div style={{
        position: "absolute", left: "50%", top: "-20%", transform: "translateX(-50%)",
        width: 900, height: 900, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(46,107,230,0.18) 0%, rgba(46,107,230,0) 60%)",
        pointerEvents: "none",
      }} />
      {/* Orange glint */}
      <div style={{
        position: "absolute", right: "5%", bottom: "-10%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(230,138,46,0.12) 0%, rgba(230,138,46,0) 60%)",
        pointerEvents: "none",
      }} />
      {/* Top bar */}
      <div style={{ position: "relative", padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="isb-logo">IS</div>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, fontWeight: 500 }}>ISBAT University <span style={{ color: "var(--isb-blue)" }}>— ERP</span></div>
            <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--isb-muted)" }}>Enterprise Portal</div>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--isb-muted)" }}>
          Need help? <a href="mailto:itsupport@isbatuniversity.ac.ug" className="isb-link">itsupport@isbatuniversity.ac.ug</a> · <span className="nums">+256 414 532 500</span>
        </div>
      </div>

      {/* Content — centered */}
      <div style={{ position: "relative", flex: 1, display: "grid", placeItems: "center", padding: "20px 40px" }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{ position: "relative", padding: "20px 40px", borderTop: "1px solid var(--isb-line-2)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)" }}>
        <div style={{ fontSize: 11, color: "var(--isb-muted)" }}>© 2026 ISBAT University · Kampala, Uganda</div>
        <PolicyFooter tone="light" />
      </div>
    </div>
  );
}

function CardB({ children, width = 440, tagline, eyebrow, headline, sub, backFn }) {
  return (
    <div style={{
      width, background: "#fff", borderRadius: 14,
      border: "1px solid var(--isb-line-2)",
      boxShadow: "0 1px 2px rgba(14,22,40,.04), 0 8px 28px rgba(14,22,40,.06)",
      padding: "36px 36px 32px", position: "relative",
    }}>
      {tagline && (
        <div style={{ position: "absolute", top: -11, left: 24, background: "#fff", padding: "2px 10px", borderRadius: 99, border: "1px solid var(--isb-line)", fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--isb-blue)", fontWeight: 500 }}>
          {tagline}
        </div>
      )}
      {backFn && (
        <button onClick={backFn} className="isb-btn link" style={{ fontSize: 12, marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon name="back" size={12} /> Back
        </button>
      )}
      {eyebrow && <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--isb-blue)", marginBottom: 8, fontWeight: 500 }}>{eyebrow}</div>}
      {headline && (
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
          {headline}
        </h1>
      )}
      {sub && <p style={{ color: "var(--isb-muted)", fontSize: 13.5, margin: "0 0 24px", lineHeight: 1.55 }}>{sub}</p>}
      {children}
    </div>
  );
}

function LandingB({ onPick }) {
  return (
    <CanvasB>
      <div style={{ width: 620, textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--isb-blue)", marginBottom: 16, fontWeight: 500 }}>Sign in</div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 44, fontWeight: 500, letterSpacing: "-0.025em", margin: "0 0 14px", lineHeight: 1.1 }}>
          One portal for the work<br/>of the university.
        </h1>
        <p style={{ color: "var(--isb-muted)", fontSize: 14.5, margin: "0 0 36px", lineHeight: 1.55 }}>
          Choose your portal to continue.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <PortalCardB onClick={() => onPick("staff")}
            icon="brief" title="Staff & Faculty"
            sub="Registrars · Deans · Lecturers · Counselors"
            accent="var(--isb-blue)" />
          <PortalCardB onClick={() => onPick("student")}
            icon="grad" title="Students"
            sub="Fees · Timetables · Grades · Services"
            accent="#2EA862" />
        </div>

        <div style={{ marginTop: 28, fontSize: 12, color: "var(--isb-muted)", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icon name="shield" size={14} color="var(--isb-muted)" />
          Encrypted sign-in · Compliant with ISBAT Data Policy
        </div>
      </div>
    </CanvasB>
  );
}

function PortalCardB({ icon, title, sub, accent, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        all: "unset", cursor: "pointer", textAlign: "left",
        background: "#fff", borderRadius: 12,
        border: `1px solid ${hover ? accent : "var(--isb-line-2)"}`,
        padding: "24px 22px 22px", position: "relative",
        boxShadow: hover ? `0 8px 24px rgba(14,22,40,.08), 0 0 0 3px ${accent}15` : "0 1px 2px rgba(14,22,40,.04)",
        transition: "all .2s",
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}15`, color: accent, display: "grid", placeContent: "center", marginBottom: 14 }}>
        <Icon name={icon} size={22} color={accent} stroke={1.6} />
      </div>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 19, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "var(--isb-muted)", marginTop: 4 }}>{sub}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, fontSize: 12, color: accent, fontWeight: 500 }}>
        Continue <Icon name="arrow" size={13} color={accent} />
      </div>
    </button>
  );
}

function StaffLoginB({ onBack, onForgot, onSubmit }) {
  const [pw, setPw] = React.useState("•••••••••");
  const [show, setShow] = React.useState(false);
  const [caps, setCaps] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const handle = e => { e.preventDefault(); setLoading(true); setTimeout(() => { setLoading(false); onSubmit(); }, 900); };
  return (
    <CanvasB>
      <CardB tagline="Staff & Faculty" headline="Sign in to ERP" sub="Use your ISBAT Staff ID and password." backFn={onBack}>
        <form onSubmit={handle}>
          <div className="isb-field">
            <label className="isb-label">Staff ID</label>
            <input className="isb-input" defaultValue="AR-2019-0042" autoComplete="username" />
            <div className="hint">Format: ROLE-YYYY-NNNN</div>
          </div>
          <div className="isb-field">
            <label className="isb-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Password</span>
              <button type="button" onClick={onForgot} className="isb-btn link" style={{ fontSize: 11 }}>Forgot?</button>
            </label>
            <div className="isb-pw-wrap">
              <input className="isb-input" type={show ? "text" : "password"} value={pw}
                onChange={e => setPw(e.target.value)}
                onKeyUp={e => setCaps(e.getModifierState && e.getModifierState("CapsLock"))}
                style={{ paddingRight: 62 }} />
              <button type="button" className="toggle" onClick={() => setShow(s => !s)}>{show ? "Hide" : "Show"}</button>
            </div>
            {caps && <div className="err"><Icon name="caps" size={12} color="var(--isb-red)" /> Caps Lock is on</div>}
          </div>
          <label className="isb-check" style={{ marginTop: 4 }}>
            <input type="checkbox" defaultChecked />
            Trust this device for 30 days
          </label>
          <button type="submit" className="isb-btn primary full" style={{ marginTop: 20 }} disabled={loading}>
            {loading ? <><span className="spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: 99 }} /> Verifying…</>
                     : <>Continue <Icon name="arrow" size={15} color="#fff" /></>}
          </button>
          <div className="isb-divider">Or</div>
          <button type="button" className="isb-btn ghost full">
            <svg width="14" height="14" viewBox="0 0 23 23"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M12 1h10v10H12z"/><path fill="#00A4EF" d="M1 12h10v10H1z"/><path fill="#FFB900" d="M12 12h10v10H12z"/></svg>
            Continue with Microsoft 365
          </button>
        </form>
        <div style={{ marginTop: 22, fontSize: 11.5, color: "var(--isb-muted)", lineHeight: 1.55, textAlign: "center" }}>
          By signing in you agree to ISBAT's <a href="#" className="isb-link">Data Processing Consent</a>.
        </div>
      </CardB>
    </CanvasB>
  );
}

function StudentLoginB({ onBack, onForgot, onSubmit }) {
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const handle = e => { e.preventDefault(); setLoading(true); setTimeout(() => { setLoading(false); onSubmit(); }, 900); };
  return (
    <CanvasB>
      <CardB tagline="Students" headline="Student Portal" sub="Sign in with your Student ID and password." backFn={onBack}>
        <form onSubmit={handle}>
          <div className="isb-field">
            <label className="isb-label">Student ID</label>
            <input className="isb-input" defaultValue="ISB/2024/BSCS/0142" />
            <div className="hint">Printed on your admission letter and ID card.</div>
          </div>
          <div className="isb-field">
            <label className="isb-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Password</span>
              <button type="button" onClick={onForgot} className="isb-btn link" style={{ fontSize: 11 }}>Forgot?</button>
            </label>
            <div className="isb-pw-wrap">
              <input className="isb-input" type={show ? "text" : "password"} defaultValue="••••••••" style={{ paddingRight: 62 }} />
              <button type="button" className="toggle" onClick={() => setShow(s => !s)}>{show ? "Hide" : "Show"}</button>
            </div>
          </div>
          <button type="submit" className="isb-btn primary full" style={{ background: "#2EA862", marginTop: 16, boxShadow: "0 2px 4px rgba(46,168,98,.25)" }} disabled={loading}>
            {loading ? "Signing in…" : <>Sign in <Icon name="arrow" size={15} color="#fff" /></>}
          </button>
          <div style={{ marginTop: 14, fontSize: 12, color: "var(--isb-muted)", textAlign: "center" }}>
            First time? <a href="#" className="isb-link">Activate your account</a>
          </div>
        </form>
        <div style={{ marginTop: 20, padding: 12, background: "var(--isb-paper-2)", border: "1px solid var(--isb-line-2)", borderRadius: 8, fontSize: 11.5, color: "var(--isb-muted)", textAlign: "center" }}>
          Student support: <a href="mailto:studentsupport@isbatuniversity.ac.ug" className="isb-link">studentsupport@isbatuniversity.ac.ug</a>
        </div>
      </CardB>
    </CanvasB>
  );
}

function OtpStepB({ onBack, onNext }) {
  const [vals, setVals] = React.useState(["2","9","4","","",""]);
  const refs = React.useRef([]);
  const set = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const n = [...vals]; n[i] = v; setVals(n);
    if (v && i < 5) refs.current[i+1]?.focus();
  };
  return (
    <CanvasB>
      <CardB tagline="Two-factor" headline="Verify it's you" sub="We've sent a 6-digit code to m******@isbat.ac.ug" backFn={onBack}>
        <div className="isb-otp" style={{ justifyContent: "center", marginTop: 4 }}>
          {vals.map((v, i) => (
            <input key={i} ref={el => refs.current[i] = el} value={v} onChange={e => set(i, e.target.value)} maxLength={1} inputMode="numeric" />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "22px 0", fontSize: 12, color: "var(--isb-muted)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="clock" size={12} /> Expires in <span className="nums" style={{ color: "var(--isb-ink)", fontWeight: 500 }}>09:42</span>
          </span>
          <button className="isb-btn link" style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="refresh" size={12} /> Resend</button>
        </div>
        <button className="isb-btn primary full" onClick={onNext}>Verify and continue <Icon name="arrow" size={15} color="#fff" /></button>
        <div style={{ marginTop: 16, fontSize: 12, color: "var(--isb-muted)", textAlign: "center" }}>
          Can't access your email? <a href="#" className="isb-link">Use recovery method</a>
        </div>
      </CardB>
    </CanvasB>
  );
}

function ForgotB({ onBack }) {
  const [step, setStep] = React.useState(0);
  return (
    <CanvasB>
      <CardB tagline="Reset password" headline="We'll get you back in" sub="Follow the steps to set a new password." backFn={onBack} width={460}>
        <div style={{ marginBottom: 22 }}>
          <Stepper steps={["Identify", "Verify", "New password"]} current={step} />
        </div>
        {step === 0 && (
          <>
            <div className="isb-field">
              <label className="isb-label">Staff ID</label>
              <input className="isb-input" defaultValue="AR-2019-0042" />
            </div>
            <div className="isb-field">
              <label className="isb-label">Send code via</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <MiniMethod icon="mail" label="Email" sub="m******@isbat.ac.ug" active />
                <MiniMethod icon="phone" label="SMS" sub="+256 ***** 4821" />
              </div>
            </div>
            <button className="isb-btn primary full" onClick={() => setStep(1)}>Send code <Icon name="arrow" size={15} color="#fff" /></button>
          </>
        )}
        {step === 1 && (
          <>
            <p style={{ color: "var(--isb-muted)", fontSize: 13, margin: "0 0 14px" }}>Enter the 6-digit code we sent.</p>
            <OtpRow />
            <button className="isb-btn primary full" style={{ marginTop: 20 }} onClick={() => setStep(2)}>Verify <Icon name="arrow" size={15} color="#fff" /></button>
          </>
        )}
        {step === 2 && (
          <>
            <div className="isb-field">
              <label className="isb-label">New password</label>
              <input className="isb-input" type="password" defaultValue="••••••••••••" />
              <StrengthRow level={3} />
            </div>
            <div className="isb-field">
              <label className="isb-label">Confirm new password</label>
              <input className="isb-input" type="password" defaultValue="••••••••••••" />
            </div>
            <button className="isb-btn primary full" onClick={onBack}>Update password <Icon name="check" size={15} color="#fff" /></button>
          </>
        )}
      </CardB>
    </CanvasB>
  );
}

function MiniMethod({ icon, label, sub, active }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
      border: active ? "1px solid var(--isb-blue)" : "1px solid var(--isb-line)",
      background: active ? "var(--isb-blue-050)" : "#fff",
      borderRadius: 8, cursor: "pointer",
    }}>
      <Icon name={icon} size={14} color={active ? "var(--isb-blue)" : "var(--isb-muted)"} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 10.5, color: "var(--isb-muted)", fontFamily: "var(--font-mono)" }}>{sub}</div>
      </div>
    </div>
  );
}

function OtpRow() {
  const [vals, setVals] = React.useState(["2","9","4","1","",""]);
  const refs = React.useRef([]);
  const set = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const n = [...vals]; n[i] = v; setVals(n);
    if (v && i < 5) refs.current[i+1]?.focus();
  };
  return (
    <div className="isb-otp" style={{ justifyContent: "center" }}>
      {vals.map((v, i) => (
        <input key={i} ref={el => refs.current[i] = el} value={v} onChange={e => set(i, e.target.value)} maxLength={1} inputMode="numeric" style={{ width: 42, height: 50, fontSize: 19 }} />
      ))}
    </div>
  );
}

function StrengthRow({ level = 2 }) {
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
        <span>Strength</span><span style={{ color: colors[level], fontWeight: 500 }}>{labels[level]}</span>
      </div>
    </div>
  );
}

function FirstTimeB({ onBack }) {
  const [step, setStep] = React.useState(0);
  return (
    <CanvasB>
      <CardB tagline="First-time sign-in" headline="Welcome to ISBAT" sub="Let's secure your account in 3 quick steps." backFn={onBack} width={460}>
        <div style={{ marginBottom: 22 }}>
          <Stepper steps={["Confirm", "Password", "Two-factor"]} current={step} />
        </div>
        {step === 0 && (
          <>
            <div style={{ padding: 14, background: "var(--isb-blue-050)", border: "1px solid #D8E4FC", borderRadius: 8, fontSize: 12.5, color: "var(--isb-blue-700)", marginBottom: 18, display: "flex", gap: 10 }}>
              <Icon name="sparkle" size={16} color="var(--isb-blue)" />
              <div>Your account was created on <b>22 Apr 2026</b>. Please confirm your details.</div>
            </div>
            <DetailRowB label="Full name" value="Muwanguzi Rebecca Nakato" />
            <DetailRowB label="Role" value="Asst. Registrar — Admission" />
            <DetailRowB label="Staff ID" value="ARA-2026-0108" mono />
            <DetailRowB label="Email" value="r.muwanguzi@isbat.ac.ug" last />
            <button className="isb-btn primary full" style={{ marginTop: 18 }} onClick={() => setStep(1)}>These are correct <Icon name="arrow" size={15} color="#fff" /></button>
          </>
        )}
        {step === 1 && (
          <>
            <div className="isb-field">
              <label className="isb-label">New password</label>
              <input className="isb-input" type="password" defaultValue="••••••••••••" />
              <StrengthRow level={2} />
            </div>
            <div className="isb-field">
              <label className="isb-label">Confirm password</label>
              <input className="isb-input" type="password" defaultValue="••••••••••••" />
            </div>
            <div style={{ padding: 10, fontSize: 11.5, color: "var(--isb-muted)", background: "var(--isb-paper-2)", border: "1px solid var(--isb-line-2)", borderRadius: 6, display: "grid", gap: 4 }}>
              <CheckB ok>At least 10 characters</CheckB>
              <CheckB ok>Contains a number</CheckB>
              <CheckB>Contains a symbol</CheckB>
            </div>
            <button className="isb-btn primary full" style={{ marginTop: 14 }} onClick={() => setStep(2)}>Continue <Icon name="arrow" size={15} color="#fff" /></button>
          </>
        )}
        {step === 2 && (
          <>
            <p style={{ color: "var(--isb-muted)", fontSize: 13, margin: "0 0 14px" }}>Choose where to receive verification codes.</p>
            <MiniMethod icon="mail" label="r.muwanguzi@isbat.ac.ug" sub="Primary email" active />
            <div style={{ height: 10 }} />
            <MiniMethod icon="phone" label="+256 772 448 219" sub="Add SMS backup" />
            <label className="isb-check" style={{ marginTop: 18 }}>
              <input type="checkbox" defaultChecked />
              I agree to the <a href="#" className="isb-link" style={{ marginLeft: 4 }}>Data Processing Consent</a>
            </label>
            <button className="isb-btn primary full" style={{ marginTop: 20 }} onClick={onBack}>Finish setup <Icon name="check" size={15} color="#fff" /></button>
          </>
        )}
      </CardB>
    </CanvasB>
  );
}

function DetailRowB({ label, value, mono, last }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", padding: "9px 0", borderBottom: last ? "none" : "1px solid var(--isb-line-2)", fontSize: 13 }}>
      <div style={{ color: "var(--isb-muted)", fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: "var(--isb-ink)", fontWeight: 500, fontFamily: mono ? "var(--font-mono)" : undefined, fontSize: mono ? 12.5 : 13.5 }}>{value}</div>
    </div>
  );
}

function CheckB({ ok, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: ok ? "var(--isb-green)" : "var(--isb-muted)" }}>
      <div style={{ width: 14, height: 14, borderRadius: 99, display: "grid", placeContent: "center", background: ok ? "var(--isb-green)" : "transparent", border: ok ? "none" : "1.5px solid var(--isb-line)" }}>
        {ok && <Icon name="check" size={9} color="#fff" stroke={3} />}
      </div>
      {children}
    </div>
  );
}

function ExpiredB({ onBack }) {
  return (
    <CanvasB>
      <CardB tagline="Session" headline="Session expired" sub="You were signed out after 30 minutes of inactivity." backFn={onBack}>
        <div style={{ padding: 16, background: "#FFF6EA", border: "1px solid #F3DDB7", borderRadius: 10, marginBottom: 18, display: "flex", gap: 12 }}>
          <Icon name="clock" size={18} color="#B87914" />
          <div style={{ fontSize: 12.5, color: "#7A4B11", lineHeight: 1.55 }}>
            For the security of student and university records, we automatically sign you out after inactivity.
          </div>
        </div>
        <div style={{ padding: 14, background: "var(--isb-paper-2)", border: "1px solid var(--isb-line-2)", borderRadius: 8, marginBottom: 16, display: "grid", gridTemplateColumns: "32px 1fr", gap: 10, alignItems: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: 99, background: "var(--isb-blue)", color: "#fff", display: "grid", placeContent: "center", fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 13 }}>RM</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Rebecca Muwanguzi</div>
            <div style={{ fontSize: 11.5, color: "var(--isb-muted)" }}>Asst. Registrar · Signed out 14:32</div>
          </div>
        </div>
        <div className="isb-field">
          <label className="isb-label">Enter your password to resume</label>
          <div className="isb-pw-wrap">
            <input className="isb-input" type="password" defaultValue="••••••••••••" style={{ paddingRight: 62 }} />
            <button type="button" className="toggle">Show</button>
          </div>
        </div>
        <button className="isb-btn primary full" onClick={onBack}>Resume session <Icon name="arrow" size={15} color="#fff" /></button>
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button className="isb-btn link" onClick={onBack} style={{ fontSize: 12.5 }}>Sign in as someone else</button>
        </div>
      </CardB>
    </CanvasB>
  );
}

function RedirectB({ onBack, roleIdx, onCycle }) {
  const role = ISBAT_ROLES[roleIdx];
  const initials = role.label.split(" ").map(w => w[0]).filter((_,i,a)=>i<2).join("");
  return (
    <CanvasB>
      <CardB tagline="Welcome" headline="Signing you in…" sub="We're taking you to the right place." width={480}>
        <div style={{ padding: 22, background: "linear-gradient(180deg, var(--isb-paper-2) 0%, #fff 100%)", border: "1px solid var(--isb-line-2)", borderRadius: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, background: role.accent, color: "#fff", display: "grid", placeContent: "center", fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 500 }}>{initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--isb-muted)" }}>Signed in as</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 500 }}>{role.label}</div>
              <div style={{ fontSize: 11.5, color: "var(--isb-muted)", marginTop: 2 }}>Spring 2026 · 20261</div>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: "10px 12px", background: "#fff", border: "1px solid var(--isb-line)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <div className="spin" style={{ width: 12, height: 12, border: "2px solid var(--isb-line)", borderTopColor: role.accent, borderRadius: 99 }} />
            <div style={{ fontSize: 12.5 }}>Redirecting to <b>{role.dest}</b>…</div>
          </div>
        </div>
        <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--isb-muted)", marginBottom: 8 }}>Preview other roles</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, maxHeight: 180, overflow: "auto" }}>
          {ISBAT_ROLES.map((r, i) => (
            <button key={r.id} onClick={() => onCycle(i)} style={{
              all: "unset", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6,
              background: i === roleIdx ? "var(--isb-blue-050)" : "transparent",
              fontSize: 11.5, color: "var(--isb-ink)",
            }}>
              <div style={{ width: 5, height: 5, borderRadius: 99, background: r.accent }} />
              <span style={{ fontWeight: i === roleIdx ? 500 : 400 }}>{r.label}</span>
            </button>
          ))}
        </div>
      </CardB>
    </CanvasB>
  );
}

function DirectionB({ screen, setScreen, roleIdx, setRoleIdx }) {
  return (
    <div className="isb-screen">
      {screen === "landing" && <LandingB onPick={k => setScreen(k === "staff" ? "staff" : "student")} />}
      {screen === "staff"   && <StaffLoginB onBack={() => setScreen("landing")} onForgot={() => setScreen("forgot")} onSubmit={() => setScreen("otp")} />}
      {screen === "student" && <StudentLoginB onBack={() => setScreen("landing")} onForgot={() => setScreen("forgot")} onSubmit={() => setScreen("redirect")} />}
      {screen === "forgot"  && <ForgotB onBack={() => setScreen("staff")} />}
      {screen === "otp"     && <OtpStepB onBack={() => setScreen("staff")} onNext={() => setScreen("redirect")} />}
      {screen === "setup"   && <FirstTimeB onBack={() => setScreen("staff")} />}
      {screen === "expired" && <ExpiredB onBack={() => setScreen("staff")} />}
      {screen === "redirect"&& <RedirectB onBack={() => setScreen("landing")} roleIdx={roleIdx} onCycle={setRoleIdx} />}
    </div>
  );
}

Object.assign(window, { DirectionB });
