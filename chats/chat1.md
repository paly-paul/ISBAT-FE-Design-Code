# University ERP Login Flow

_Started 2026-04-23 08:12 UTC_

---

## User

Create a Login flow for a University ERP application, below are the various user roles.

Existing application URL: {https://erp.isbatuniversity.ac.ug}

Business User Roles:{
Vice Chancellor
Academic Registrar
Director Academics
Dean
Lecturer
Assistant Registrar Admission
Assistant Registrar Assessments
Student Admission Counselor
Student Support
Student Service}

Students have a different login url for login:{
https://erp.isbatuniversity.ac.ug/frmStudentLogin.aspx}

an inspiration for design theme is attached as image

## Assistant

I'll design a login flow for the ISBAT University ERP. Let me first look at the inspiration image to understand the aesthetic, then ask a few quick clarifying questions.

_[tool: view_image]_

Good — I have the aesthetic reference. The dashboard has a clean left-sidebar layout, blue primary (`#2E6BE6`-ish), warm neutrals, serif headlines paired with a clean sans, orange/green/yellow status accents, and a rounded square "IS" logo mark. I'll carry that DNA into the login.

Let me ask a few focused questions before I build.

_[tool: questions_v2]_

## User

Questions answered:
- scope: Staff login (business roles), Student login (separate URL), Role selector / landing page before login, Forgot password / reset, Two-factor (OTP) step, First-time password setup, Session expired / re-auth, Post-login role-based redirect preview, Decide for me
- entry_model: One shared landing → user chooses Staff or Student
- credential: Staff ID + password
- student_credential: Student ID + password
- role_awareness: No — role is derived from credentials, keep it clean
- variations: 2 directions to compare
- vibe: 0, 3, 1
- imagery: Live rotating stats (students enrolled, programs, etc.)
- micro_interactions: Decide for me
- tweaks: Decide for me
- extras: Include a support email id and number and links for IT policy and privacy policy and data security policy and consent for processing data.

## Assistant

_[tool: update_todos]_

I'll build this now. Two directions: **Direction A** — editorial split-screen with brand blue hero + live stats (matches vibe 0/1); **Direction B** — centered card on warm canvas with a subtle brand-mark bloom (matches vibe 3). Both use the same DNA as the dashboard: blue `#2E6BE6`, warm off-white `#F6F4EF`, serif headlines, "IS" mark.

Let me pull in the design canvas scaffold and start building.

_[tool: copy_starter_component]_

Now let me build the shared styles and the two direction components. I'll split them into separate JSX files.

_[tool: write_file]_

_[tool: write_file]_

Now Direction A — editorial split-screen.

_[tool: write_file]_

I'll snip the initial exploration and continue building Direction B.

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

Now let me build the main canvas HTML that ties it all together.

_[tool: read_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Built the ISBAT ERP login flow as a design canvas with **2 directions × 8 screens** each, all clickable.

**Direction A — Editorial split.** Brand-blue hero panel with a live-stats rotator (students enrolled, applications vetted, programmes active, faculty online, completion rate) on the left, form on the right. Matches the dashboard's serif-headline + warm-neutral + orange-accent DNA.

**Direction B — Warm canvas, centered card.** Paper-white stage with a subtle blue bloom + orange glint, a single floating card carries the form. Quieter, more "website" in feel.

**Screens in each:** Portal chooser → Staff sign-in → Student sign-in → Two-factor OTP → Forgot password (3 steps) → First-time setup (3 steps) → Session expired → Role-based redirect preview (cycle through all 10 roles).

**Interactions live:** password show/hide, Caps Lock warning, trust-device checkbox, loading spinner, OTP auto-advance digits, stepper, inline password strength, requirement checklist, method chooser (email/SMS).

**Support + policy** baked into every screen: itsupport@isbatuniversity.ac.ug, +256 414 532 500, and links for IT Policy / Privacy / Data Security / Data Processing Consent.

**Tweaks** (toolbar toggle): Accent color — Blue / Teal / Plum — persisted.

Click any artboard's ↗ to focus fullscreen and walk the flow.

## User

Save as standalone HTML: ISBAT ERP Login Flow.html

## Assistant

_[tool: snip]_

_[tool: read_file]_

No external resources referenced in code strings — all assets are HTML attributes (link, script src) that the bundler handles directly. I'll make a copy, add the thumbnail template, and run the bundler.

_[tool: copy_files]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: super_inline_html]_

_[tool: snip]_

_[tool: show_html]_

_[tool: snip]_

_[tool: show_html]_

_[tool: snip]_

_[tool: get_webview_logs]_

_[tool: snip]_

_[tool: present_fs_item_for_download]_

Your standalone file is ready — one self-contained HTML that works offline, no dependencies.

## User

why do we need role-based redirect?

## Assistant

_[tool: snip]_

Good question — it's worth being honest about.

**You don't strictly need it as a user-facing screen.** In a real production login, after authentication the app just drops the user onto their home dashboard instantly — usually with a brief spinner or skeleton, often invisible. The role-to-destination mapping happens silently on the server.

**I included it in the prototype for two reasons:**

1. **You asked for it in scope** — you picked "Post-login role-based redirect preview" when I ran questions.
2. **It's useful as a design artifact, not a real screen** — with 10 different business roles, the redirect screen doubles as documentation of *where each role lands after login*. A stakeholder or developer can open that artboard and see the full Role → Destination map (VC → Executive Overview, Lecturer → My Classes, Asst. Registrar Admission → Admissions Queue, etc.). It's specification disguised as UI.

**If this is going to production, my recommendation:**
- **Drop it as a visible screen.** Redirect should be instant (<300ms). Showing a "signing you in…" card actually *adds* perceived latency.
- **Keep the role→destination map** but move it into your handoff docs or Confluence, not the UI.
- **Or** keep a *very brief* version (200–400ms spinner with "Hello, Rebecca") only if your auth round-trip is genuinely slow and you need to fill the gap — otherwise it's theatre.

Want me to remove it from the flow, or repurpose it into a docs-style "Role routing reference" artboard outside the login flow itself?

## User

if i have to handoff only 7 screens from Direction A to claude code what should i do

## Assistant

_[tool: snip]_

Here's what I'd do — clean handoff, no Direction B, no role-redirect screen, just the 7 Direction A screens plus everything a developer needs to build them.

**Step 1 — Decide which 7.** You'd drop the role-based redirect preview (the one we just discussed). That leaves:
1. Portal chooser
2. Staff sign-in
3. Student sign-in
4. Two-factor (OTP)
5. Forgot password
6. First-time setup
7. Session expired

**Step 2 — Make a Direction A-only version.** I can fork the file and strip out Direction B + the redirect artboard, so the handoff package contains only what's being built. This avoids Claude Code being confused by two directions.

**Step 3 — Run the "Handoff to Claude Code" export.** This produces a developer-ready bundle: the cleaned HTML, all referenced components/styles, a short spec describing each screen's states and interactions, and the routing between them. Claude Code can consume that directly and scaffold the real app.

**Step 4 — Add a handoff spec** I should also write a short `HANDOFF.md` alongside the bundle listing for each screen:
- Auth endpoint / payload shape
- Success + failure states
- Validation rules (Staff ID regex, password policy)
- Where OTP codes come from (email/SMS provider)
- Session timeout value (30 min)
- Which roles go to which destinations (even though the redirect screen is gone, the map still matters)

**Want me to do it now?** I can:
- (a) Fork the file to a clean "Direction A — Handoff" version with exactly those 7 screens, then
- (b) Generate the HANDOFF.md spec, then
- (c) You invoke the Handoff to Claude Code skill on that file.

Say the word and I'll build (a) and (b).

## User

yes please do

## Assistant

_[tool: snip]_

I'll build the Direction A-only handoff version with 7 screens and a HANDOFF.md spec.

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

Done — Direction A-only handoff file is live with 7 screens, plus `HANDOFF.md` alongside it covering routes, endpoints, validation, role→destination map, states, accessibility, and what's intentionally out of scope.

**Next step for you:** open the Handoff to Claude Code skill on `ISBAT ERP Login Flow — Direction A Handoff.html`. It'll bundle the HTML + `components/*` + `styles/shared.css` + `HANDOFF.md` into a package Claude Code can build from directly.

_[tool: snip]_

Ready when you are.

