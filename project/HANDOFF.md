# ISBAT ERP — Login Flow Handoff Spec (Direction A)

This package contains the 7 screens to build for the ISBAT University ERP login flow. The visual reference is `ISBAT ERP Login Flow — Direction A Handoff.html`. Shared styles live in `styles/shared.css`; components in `components/direction-a.jsx` and `components/shared-bits.jsx`.

## Routes & URLs

| Screen | Route | Notes |
|---|---|---|
| 01 Portal chooser | `/login` | Landing for all users |
| 02 Staff sign-in | `/login/staff` | Primary staff/faculty entry |
| 03 Student sign-in | `/frmStudentLogin.aspx` | Preserve legacy URL |
| 04 Two-factor (OTP) | `/login/otp` | Required after staff password step |
| 05 Forgot password | `/login/forgot` | 3-step flow (identify → verify → new pw) |
| 06 First-time setup | `/login/activate?token=…` | Link sent by HR/IT on account creation |
| 07 Session expired | `/login/expired` | Triggered by interceptor on 401 after idle |

## Design tokens (already in `styles/shared.css`)

| Token | Value |
|---|---|
| `--isb-blue` | `#2E6BE6` |
| `--isb-orange` | `#E68A2E` |
| `--isb-green` | `#2EA862` |
| `--isb-paper` | `#F6F4EF` |
| `--isb-ink` | `#0E1628` |
| Serif | Source Serif 4 |
| Sans | Inter Tight |
| Mono | JetBrains Mono |

## Auth endpoints (proposed)

```
POST /api/auth/staff/login       { staffId, password, trustDevice }
  → 200 { requiresOtp: true, otpChannel: "email"|"sms", maskedTarget }
  → 401 { code: "bad_credentials" | "account_locked" | "must_activate" }

POST /api/auth/student/login     { studentId, password }
  → 200 { sessionId, role: "student", redirect }
  → 401 { code: "bad_credentials" }

POST /api/auth/otp/verify        { challengeId, code }
  → 200 { sessionId, role, redirect }
  → 401 { code: "invalid_code" | "expired_code" }

POST /api/auth/forgot/start      { staffId, channel: "email"|"sms" }
POST /api/auth/forgot/verify     { challengeId, code }
POST /api/auth/forgot/reset      { resetToken, newPassword }

POST /api/auth/activate/confirm  { activationToken } → returns prefilled profile
POST /api/auth/activate/setup    { activationToken, password, otpChannel, consent }
```

## Validation rules

- **Staff ID:** `^[A-Z]{2,4}-\d{4}-\d{4}$` (e.g. `AR-2019-0042`). Case-sensitive on the role prefix.
- **Student ID:** `^ISB/\d{4}/[A-Z]{2,6}/\d{4}$` (e.g. `ISB/2024/BSCS/0142`).
- **Password policy:** ≥10 chars, ≥1 number, ≥1 symbol, not used in last 5 passwords.
- **OTP:** 6 digits, 10-minute TTL, max 5 attempts, resend cooldown 30s.
- **Session:** 30-minute sliding idle timeout. Hard max 8h.

## Role → post-login destination

| Role | Destination route |
|---|---|
| Vice Chancellor | `/executive` |
| Academic Registrar | `/admissions` |
| Director Academics | `/academic-ops` |
| Dean | `/faculty` |
| Lecturer | `/my-classes` |
| Asst. Registrar — Admission | `/admissions/queue` |
| Asst. Registrar — Assessments | `/assessments` |
| Student Admission Counselor | `/counselor` |
| Student Support | `/support/tickets` |
| Student Service | `/service-desk` |
| Student | `/student` |

## States to implement per screen

- **Loading:** disable submit, show inline spinner on primary button.
- **Error:** inline field errors for validation; top-of-card banner for server errors.
- **Caps Lock:** live indicator below password field (already wired in reference).
- **Empty:** submit disabled until all required fields have values.
- **Success:** brief success state then route-change (no dedicated "welcome" screen).

## Micro-interactions (already in reference)

- Password show/hide toggle
- OTP digits auto-advance on input; backspace steps back
- Inline password strength meter
- Stepper component for multi-step flows (forgot, first-time setup)
- "Trust this device for 30 days" checkbox

## Accessibility

- All inputs labelled (no placeholder-only labels)
- Focus ring visible on interactive elements (4px `--isb-blue-050` halo)
- OTP inputs have `inputmode="numeric"` and numeric-only filtering
- Hit targets ≥44px
- Keyboard: Enter submits; Escape returns to previous step in multi-step flows
- Color contrast: body text ≥4.5:1; interactive ≥3:1

## Compliance & footer

Every screen must include links to **IT Policy**, **Privacy Policy**, **Data Security Policy**, and **Data Processing Consent**. Support contact on every screen:
- `itsupport@isbatuniversity.ac.ug`
- `+256 414 532 500`

Students additionally see: `studentsupport@isbatuniversity.ac.ug`.

## SSO

Microsoft 365 (Azure AD) via OIDC. Staff only. Button labeled "Continue with ISBAT Microsoft 365" next to the password form.

## Out of scope

- Role-based redirect **screen** — do redirect silently server-side. The role→route map above is the spec.
- Remember-me as "keep me logged in" — use "Trust this device" (skips 2FA for 30 days, not a longer session).
- Password recovery via security questions — not included in this iteration.
