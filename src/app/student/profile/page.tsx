'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import { ActionMenu } from '@/components/ActionMenu'
import { StudentLookup } from '@/components/student/StudentLookup'
import { useStudent } from '@/hooks/student/useStudents'
import { StudentDto } from '@/lib/api/student/student'
import { useIdCard, useIssueOrRenewIdCard, useUpdateIdCardDates, getIdCardQrImageUrl, currentCardIssue } from '@/hooks/student/useIdCards'
import { useSponsorDetails, useSponsorCategories, useAssignSponsorCategory } from '@/hooks/student/useSponsor'
import { formatDate } from '@/lib/date'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Ported from isbat_student_module.html's Student Profile page. Identity/
// academic fields (name, programme, semester, batch, status) come from the
// real GET /api/v1/students/:guid (useStudent) once a student is loaded via
// StudentLookup. The ID Card tab is now wired to the real students/id-cards/*
// endpoints (see students/id-cards/*.md), and the Sponsor field to
// students/sponsor-assignment; the discount fields already ride along on
// useStudent's response, so they're just displayed, not re-fetched. Fee
// structure/learning mode display and the communication dispatch audit log
// still have no backend contract — page-local mock state only, same
// "UI-first prototype" convention as Finance's Payment Collection pages.
// The old barcode/ESSL-device and photo-upload UI had no backing endpoint at
// all (id-cards has no such fields) — commented out below rather than
// removed, in favour of the real QR-image endpoint. The Live Card Preview
// now also carries the full printed-card field set (card no./print date,
// batch, joining/expiry, embedded QR) instead of just name/programme/regno —
// Batch Time and Nationality have no field on any student/id-card response
// yet, shown as placeholders. Card History (the issue/renewal timeline) has
// been dropped from this tab entirely, per request.
const PROFICIENCY_TABS = [
  { id: 'info', label: 'Profile Info', icon: 'lni-user' },
  { id: 'idcard', label: 'ID Card', icon: 'lni-credit-cards' },
  { id: 'comms', label: 'Communication & Access', icon: 'lni-envelope' },
] as const
type TabId = typeof PROFICIENCY_TABS[number]['id']

interface AuditEntry { id: number; action: string; detail: string; dot: 'email' | 'whatsapp' | 'update' }

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function isValidEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
function isValidPhone(v: string) { return /^\+\d[\d\s]{6,14}$/.test(v.trim()) }

// calcType is documented ("1" = Amount, "2" = Percentage) on the
// student-discounts assign/update endpoints; StudentDetailDto carries the
// same field for whatever discount is already resolved onto the student.
function formatDiscount(detail: { discountStatus: string | null; calcType: string | null; amtPer: number | null } | undefined) {
  if (!detail?.discountStatus || detail.discountStatus === 'Cancelled' || detail.discountStatus === 'CancelledImmediate') return 'None'
  const kind = detail.calcType === '2' ? '%' : detail.calcType === '1' ? 'Amt' : ''
  return detail.amtPer != null ? `${detail.amtPer}${kind}` : detail.discountStatus
}

export default function Page() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [student, setStudent] = useState<StudentDto | null>(null)
  const [tab, setTab] = useState<TabId>('info')

  const { data: detail } = useStudent(student?.studentGuid ?? null, !!student)

  // Real ID-card record — GET /students/id-cards/{studentGuid}. Resolves to
  // null when the student has no card yet (404 not_found is the common case,
  // not an error — see getIdCardDetails).
  const { data: card } = useIdCard(student?.studentGuid ?? null, !!student)
  const issueOrRenewIdCard = useIssueOrRenewIdCard()
  const updateIdCardDates = useUpdateIdCardDates(student?.studentGuid ?? null)

  // Real sponsor assignment — GET .../sponsor-details, resolves to null when
  // unassigned. `error` here is NOT "no assignment" (that's a null `data`,
  // handled server-side as 404) — a real 401 has been observed live
  // (2026-08-25): "You are not authorized to view sponsor details for
  // students in this campus", despite the docs saying no fine-grained
  // permission exists. Surfaced as "Restricted" below rather than silently
  // reading as "Unassigned", which would misleadingly invite editing.
  const { data: sponsorDetail, error: sponsorError } = useSponsorDetails(student?.studentGuid ?? null, !!student)
  const sponsorRestricted = !!sponsorError
  const { data: sponsorCategoriesPage } = useSponsorCategories()
  const assignSponsorCategory = useAssignSponsorCategory()
  const [editingSponsor, setEditingSponsor] = useState(false)
  const [sponsorChoice, setSponsorChoice] = useState('')

  // Personal-info edit form — seeded from the loaded record, editable but
  // not wired to any save endpoint (none confirmed for this workflow).
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState('Female')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // ID-card date fields — seeded from the real card record below (or left
  // blank for a first-time issue); joiningDate/expiryDate are the only
  // fields the backend actually stores (see students/id-cards/*.md).
  const [joiningDate, setJoiningDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cardRemarks, setCardRemarks] = useState('')

  // Communications mock state — no backend contract for this workflow.
  const [stuEmail, setStuEmail] = useState('')
  const [stuPhone, setStuPhone] = useState('')
  const [parEmail, setParEmail] = useState('parent.sarah@gmail.com')
  const [parPhone, setParPhone] = useState('+256 772 987 654')
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])

  // Old barcode/ESSL/photo-upload state — no backend contract (the id-cards
  // API has no such fields). Commented out rather than removed; re-enable if
  // a real endpoint shows up for these later.
  // const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  // const [barcode, setBarcode] = useState('')

  // The most recent cardHistory entry is the "current" card — there's no
  // separate current-card field on the real response (see idCards.ts).
  const currentCard = currentCardIssue(card)

  useEffect(() => {
    if (currentCard) {
      setJoiningDate(currentCard.joiningDate?.slice(0, 10) ?? '')
      setExpiryDate(currentCard.expiryDate?.slice(0, 10) ?? '')
    } else {
      setJoiningDate('')
      setExpiryDate('')
      setCardRemarks('')
    }
  }, [currentCard])

  useEffect(() => {
    setSponsorChoice(sponsorDetail?.sponsorCategoryGuid ?? '')
    setEditingSponsor(false)
  }, [sponsorDetail])

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => {
    if (!student) return
    const parts = student.studentName.trim().split(/\s+/)
    const derivedEmail = `${student.studentNum.toLowerCase().replace(/[^a-z0-9]/g, '.')}@isbat.ac.ug`
    setFirstName(parts[0] ?? '')
    setLastName(parts.slice(1).join(' '))
    setStuEmail(derivedEmail)
    setEmail(derivedEmail)
    setStuPhone('+256 701 234 567')
    setPhone('+256 701 234 567')
    // Same seed audit log as the mockup — illustrative dispatch/update
    // history, not real events (there's no backend for this workflow at
    // all), just re-pointed at whichever student is actually loaded.
    setAuditLog([
      { id: 1, action: 'Student credentials dispatched via Email', detail: `To: ${derivedEmail} · Admin: Registrar · Aug 19, 2026 10:33 AM`, dot: 'email' },
      { id: 2, action: 'Parent credentials dispatched via WhatsApp', detail: 'To: +256 772 987 654 · Admin: Registrar · Aug 15, 2026 2:10 PM', dot: 'whatsapp' },
      { id: 3, action: 'Student email address updated', detail: `Old: ${parts[0]?.toLowerCase() ?? 'student'}.n@gmail.com → New: ${derivedEmail} · Admin: IT Admin · Jul 2, 2026`, dot: 'update' },
      { id: 4, action: 'Parent credentials dispatched via Email', detail: 'To: parent.sarah@gmail.com · Admin: Registrar · Jan 20, 2024 9:00 AM', dot: 'email' },
    ])
    setTab('info')
  }, [student])

  function handleLoad(s: StudentDto) { setStudent(s); showToast(`${s.studentName} profile loaded`, 'ok') }
  function handleClear() { setStudent(null) }

  function dispatch(who: 'student' | 'parent', channel: 'email' | 'whatsapp') {
    const clbl = channel === 'email' ? 'Email' : 'WhatsApp'
    const wlbl = who === 'student' ? 'Student' : 'Parent'
    showToast(`${wlbl} credentials dispatched via ${clbl}`, 'ok')
    setAuditLog(prev => [
      { id: Date.now(), action: `${wlbl} credentials dispatched via ${clbl}`, detail: `Admin: Student Registrar · ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, dot: channel },
      ...prev,
    ])
  }

  // Photo upload had no backing field on the real id-cards API — commented
  // out along with its JSX rather than removed (see the state comment above).
  // function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
  //   const file = e.target.files?.[0]
  //   if (!file) return
  //   const reader = new FileReader()
  //   reader.onload = ev => { setPhotoUrl(ev.target?.result as string); showToast('Photo uploaded', 'ok') }
  //   reader.readAsDataURL(file)
  // }

  function handleSaveCard() {
    if (!student) return
    if (currentCard) {
      updateIdCardDates.mutate(
        { cardIssueId: currentCard.cardIssueId, payload: { joiningDate, expiryDate } },
        { onSuccess: () => showToast('Card dates updated', 'ok'), onError: () => showToast('Could not update card dates', 'err') },
      )
    } else {
      issueOrRenewIdCard.mutate(
        { studentGuid: student.studentGuid, joiningDate: joiningDate || null, expiryDate: expiryDate || null, remarks: cardRemarks || null, isRenewal: false },
        { onSuccess: () => showToast('ID card issued', 'ok'), onError: () => showToast('Could not issue ID card', 'err') },
      )
    }
  }

  function handleRenewCard() {
    if (!student) return
    issueOrRenewIdCard.mutate(
      { studentGuid: student.studentGuid, joiningDate: joiningDate || null, expiryDate: expiryDate || null, remarks: cardRemarks || null, isRenewal: true },
      { onSuccess: () => showToast('Card renewed', 'ok'), onError: () => showToast('Could not renew card', 'err') },
    )
  }

  function handleSaveSponsor() {
    if (!student || !sponsorChoice) return
    assignSponsorCategory.mutate(
      { studentGuid: student.studentGuid, sponsorCategoryGuid: sponsorChoice },
      { onSuccess: () => showToast('Sponsor category updated', 'ok'), onError: () => showToast('Could not update sponsor category', 'err') },
    )
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Student Profile</div><div className="pg-sub">Search a student or navigate from Student Master to view and edit their profile</div></div>
        </div>

        <StudentLookup
          onLoad={handleLoad}
          onClear={handleClear}
          loaded={!!student}
          hint="Once loaded, all tabs populate at once — including ID card management and credential dispatch."
        />

        {!student && (
          <div className="empty">
            <div className="empty-icon"><i className="lni lni-user"></i></div>
            <div className="empty-title">No Student Selected</div>
            <div className="empty-sub">Search above to load a student. All tabs load simultaneously once a student is found.</div>
          </div>
        )}

        {student && (
          <>
            <div className="stu-banner">
              <div className="stu-banner-top">
                <div className="stu-av">{initials(student.studentName)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="stu-banner-name">{student.studentName}</div>
                  <div className="stu-banner-id">{student.studentNum} · {student.studentRegNo}</div>
                  <div className="stu-banner-pills">
                    <span className="stu-pill">{detail?.studActive === 1 ? '✓ Active' : detail ? '⚠ Inactive' : '…'}</span>
                    <span className="stu-pill"><i className="lni lni-graduation"></i> {student.programName || '—'}</span>
                    <span className="stu-pill"><i className="lni lni-grid-alt"></i> {student.batchCode || '—'}</span>
                    <span className="stu-pill"><i className="lni lni-calendar"></i> {student.semesterName || '—'}</span>
                    <span className="stu-pill"><i className="lni lni-display"></i> Campus</span>
                  </div>
                </div>
                {/* Batch/Programme Transfer, Learning Mode, Intake Transfer — tucked
                    behind a single three-dot menu instead of four always-visible
                    buttons, same ActionMenu component the table rows elsewhere in
                    this app use for their own row actions. */}
                <ActionMenu tooltip="Student Actions">
                  <button className="btn btn-neu btn-sm" onClick={() => router.push('/student/batch-transfer')}><i className="lni lni-transfer"></i> Batch Transfer</button>
                  <button className="btn btn-neu btn-sm" onClick={() => router.push('/student/prog-transfer')}><i className="lni lni-graduation"></i> Prog. Transfer</button>
                  <button className="btn btn-neu btn-sm" onClick={() => router.push('/student/learning-mode')}><i className="lni lni-display"></i> Learning Mode</button>
                  <button className="btn btn-neu btn-sm" onClick={() => router.push('/student/intake-transfer')}><i className="lni lni-calendar"></i> Intake Transfer</button>
                </ActionMenu>
              </div>
              <div className="stu-meta-row">
                {/* Fee Structure / Learning Mode still have no backend contract — left as
                    illustrative placeholders, same as before. */}
                <div className="stu-meta-item"><div className="stu-meta-lbl">Fee Structure</div><div className="stu-meta-val">Local</div></div>
                <div className="stu-meta-item">
                  <div className="stu-meta-lbl">Sponsor</div>
                  {sponsorRestricted ? (
                    <div className="stu-meta-val" title="You are not authorized to view sponsor details for students in this campus">
                      Restricted
                    </div>
                  ) : editingSponsor ? (
                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                      <SearchSelect
                        options={(sponsorCategoriesPage?.items ?? []).map(c => c.category)}
                        value={(sponsorCategoriesPage?.items ?? []).find(c => c.sponsorCategoryGuid === sponsorChoice)?.category ?? ''}
                        onChange={label => {
                          const found = sponsorCategoriesPage?.items.find(c => c.category === label)
                          setSponsorChoice(found?.sponsorCategoryGuid ?? '')
                        }}
                      />
                      <button className="btn-icon" title="Save" onClick={handleSaveSponsor}><i className="lni lni-checkmark"></i></button>
                      <button className="btn-icon" title="Cancel" onClick={() => setEditingSponsor(false)}><i className="lni lni-close"></i></button>
                    </div>
                  ) : (
                    <div className="stu-meta-val" style={{ cursor: 'pointer' }} onClick={() => setEditingSponsor(true)} title="Click to change sponsor category">
                      {sponsorDetail?.category ?? 'Unassigned'} <i className="lni lni-pencil-alt" style={{ fontSize: 10 }}></i>
                    </div>
                  )}
                </div>
                <div className="stu-meta-item"><div className="stu-meta-lbl">Discount</div><div className="stu-meta-val">{formatDiscount(detail)}</div></div>
                <div className="stu-meta-item"><div className="stu-meta-lbl">Learning Mode</div><div className="stu-meta-val">Campus</div></div>
                <div className="stu-meta-item"><div className="stu-meta-lbl">Registration No.</div><div className="stu-meta-val">{student.studentRegNo}</div></div>
                <div className="stu-meta-item"><div className="stu-meta-lbl">Status</div><div className="stu-meta-val">{detail?.regStatusName || '—'}</div></div>
              </div>
            </div>

            <div className="ptabs">
              {PROFICIENCY_TABS.map(t => (
                <button key={t.id} className={`ptab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                  <i className={`lni ${t.icon}`}></i> {t.label}
                </button>
              ))}
            </div>

            {tab === 'info' && (
              <div>
                <div className="card">
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-pencil-alt"></i> Personal Information</div><span className="badge badge-grey">Editable</span></div>
                  <div className="g3">
                    <div className="fg"><label className="lbl">First Name <span className="req">*</span></label><input className="ctrl" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                    <div className="fg"><label className="lbl">Last Name <span className="req">*</span></label><input className="ctrl" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
                    <div className="fg"><label className="lbl">Gender <span className="req">*</span></label><SearchSelect options={['Female', 'Male', 'Other']} value={gender} onChange={setGender} /></div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-graduation"></i> Academic Details</div><span className="badge badge-grey">Read-only</span></div>
                  <div className="g3">
                    <div className="fg"><label className="lbl">Student No.</label><input className="ctrl" readOnly value={student.studentNum} /></div>
                    <div className="fg"><label className="lbl">Registration No.</label><input className="ctrl" readOnly value={student.studentRegNo} /></div>
                    <div className="fg"><label className="lbl">Programme</label><input className="ctrl" readOnly value={student.programName || '—'} /></div>
                    <div className="fg"><label className="lbl">Current Batch</label><input className="ctrl" readOnly value={student.batchCode || '—'} /></div>
                    <div className="fg"><label className="lbl">Current Semester</label><input className="ctrl" readOnly value={student.semesterName || '—'} /></div>
                    <div className="fg"><label className="lbl">Status</label><input className="ctrl" readOnly value={detail?.regStatusName || (detail?.studActive === 1 ? 'Active' : '—')} style={{ color: 'var(--green)', fontWeight: 700 }} /></div>
                  </div>
                  <div className="info-box"><i className="lni lni-information" style={{ color: 'var(--b700)', fontSize: 15, flexShrink: 0 }}></i><div style={{ fontSize: 12 }}>To change Batch, Programme, Learning Mode, or Intake — use the quick-action buttons in the banner above or navigate via the Operations section in the sidebar.</div></div>
                </div>
                <div className="card">
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-home"></i> Contact</div></div>
                  <div className="g3">
                    <div className="fg"><label className="lbl">Primary Email <span className="req">*</span></label><input className="ctrl" value={email} onChange={e => setEmail(e.target.value)} /></div>
                    <div className="fg"><label className="lbl">Mobile / WhatsApp <span className="req">*</span></label><input className="ctrl" value={phone} onChange={e => setPhone(e.target.value)} /></div>
                  </div>
                </div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginBottom: 20 }}>
                  <button className="btn btn-neu">Discard</button>
                  <button className="btn btn-primary" onClick={() => showToast('Profile saved', 'ok')}><i className="lni lni-save"></i> Save Profile</button>
                </div>
              </div>
            )}

            {tab === 'idcard' && (
              <div className="g2">
                <div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-hdr">
                      <div className="card-title"><i className="lni lni-credit-cards"></i> Card Details</div>
                      <span className={`badge ${currentCard ? 'badge-green' : 'badge-grey'}`}>{currentCard ? 'Issued' : 'Not issued yet'}</span>
                    </div>
                    {/* Photo upload had no field on the real id-cards API (issue/renew
                        only takes studentGuid/joiningDate/expiryDate/remarks/isRenewal)
                        — commented out rather than removed. The preview below falls
                        back to a placeholder icon with no photo, same as always. */}
                    {/* <div>
                      <label className="lbl">Photo</label>
                      <label className="photo-zone">
                        <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                        <i className="lni lni-image"></i><span>Upload</span>
                      </label>
                      <div style={{ fontSize: 10.5, color: 'var(--g500)', marginTop: 6, textAlign: 'center' }}>JPG/PNG · Max 2MB</div>
                    </div> */}
                    <div className="fg"><label className="lbl">Name on Card</label><input className="ctrl" value={student.studentName} readOnly /></div>
                    <div className="fg"><label className="lbl">Student ID</label><input className="ctrl" value={student.studentNum} readOnly /></div>
                    <div className="fg"><label className="lbl">Programme</label><input className="ctrl" value={student.programName || '—'} readOnly /></div>
                    <div className="g2">
                      <div className="fg"><label className="lbl">Joining Date</label><input className="ctrl" type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} /></div>
                      <div className="fg"><label className="lbl">Expiry Date</label><input className="ctrl" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} /></div>
                    </div>
                    {!currentCard && (
                      <div className="fg"><label className="lbl">Remarks</label><textarea className="ctrl" rows={2} value={cardRemarks} onChange={e => setCardRemarks(e.target.value)} placeholder="Optional — only recorded on first issue" /></div>
                    )}
                    <div className="flex gap-2" style={{ marginTop: 8 }}>
                      {currentCard ? (
                        <>
                          <button className="btn btn-neu btn-sm" onClick={handleRenewCard} disabled={issueOrRenewIdCard.isPending}><i className="lni lni-reload"></i> Renew</button>
                          <button className="btn btn-primary btn-sm" onClick={handleSaveCard} disabled={updateIdCardDates.isPending}><i className="lni lni-save"></i> Save Dates</button>
                        </>
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={handleSaveCard} disabled={issueOrRenewIdCard.isPending}><i className="lni lni-save"></i> Issue Card</button>
                      )}
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-hdr"><div className="card-title"><i className="lni lni-qr-code"></i> QR Verification</div></div>
                    {/* Replaces the old free-text "Physical Barcode" + ESSL device list —
                        neither had a backing field on the real API. The QR endpoint
                        (GET /students/id-cards/{studentGuid}/qr-image) just encodes the
                        bare studentGuid, unsigned — it's not a substitute for the ESSL
                        device workflow, only for the barcode's own verification role. */}
                    {MOCK_AUTH ? (
                      <div className="empty" style={{ padding: 20 }}>
                        <div className="empty-sub">QR preview needs a live backend — not available in mock mode.</div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <img src={getIdCardQrImageUrl(student.studentGuid)} alt="ID card QR code" style={{ width: 160, height: 160 }} />
                        <div style={{ fontSize: 11, color: 'var(--g500)', marginTop: 6 }}>Scans to this student's GUID — verify via the scan-result endpoint, not the image alone.</div>
                      </div>
                    )}
                    {/* <div className="fg">
                      <label className="lbl">ESSL Device Registration</label>
                      <div className="chklist">
                        <div className="chk pass"><i className="lni lni-checkmark-circle chk-icon" style={{ color: 'var(--green)' }}></i><span className="chk-text">Device F22-01 · Main Gate</span><span className="chk-status">Enrolled</span></div>
                        <div className="chk pend"><i className="lni lni-alarm-clock chk-icon" style={{ color: 'var(--amber)' }}></i><span className="chk-text">Device F22-02 · Library</span><span className="chk-status">Pending</span></div>
                        <div className="chk fail"><i className="lni lni-close chk-icon" style={{ color: 'var(--red)' }}></i><span className="chk-text">Device F22-03 · Lab Block</span><span className="chk-status">Not Enrolled</span></div>
                      </div>
                    </div>
                    <div className="flex gap-2" style={{ marginTop: 8 }}>
                      <button className="btn btn-neu btn-sm"><i className="lni lni-reload"></i> Sync Devices</button>
                    </div> */}
                  </div>
                </div>
                <div>
                  <div className="card">
                    <div className="card-hdr"><div className="card-title"><i className="lni lni-eye"></i> Live Card Preview</div><span className="badge badge-blue">Preview</span></div>
                    <div className="id-preview">
                      <div className="id-logo">ISBAT UNIVERSITY · KAMPALA</div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div className="id-photo"><i className="lni lni-user"></i></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="id-name">{student.studentName}</div>
                          <div className="id-prog">{student.programName || '—'} · {student.semesterName || '—'}</div>
                          <div className="id-num">{student.studentRegNo}</div>
                        </div>
                        {/* QR box needs a white backing plate — the code itself is dark-on-
                            transparent PNG and won't scan against the card's dark gradient. */}
                        <div style={{ background: '#fff', borderRadius: 8, padding: 4, flexShrink: 0, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {MOCK_AUTH ? (
                            <i className="lni lni-qr-code" style={{ color: '#1e1b4b', fontSize: 26 }}></i>
                          ) : (
                            <img src={getIdCardQrImageUrl(student.studentGuid)} alt="ID card QR code" style={{ width: '100%', height: '100%', display: 'block' }} />
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 10px', marginTop: 12, fontSize: 10.5 }}>
                        <div><span style={{ color: 'rgba(255,255,255,.55)' }}>Card No.</span> {currentCard?.issueCode || '—'}</div>
                        <div><span style={{ color: 'rgba(255,255,255,.55)' }}>Batch</span> {student.batchCode || '—'}</div>
                        {/* Batch Time / Nationality have no field anywhere on the wire yet
                            (not on StudentDto/StudentDetailDto, not on the id-cards DTO) —
                            shown as placeholders rather than invented, same "flag the gap"
                            convention as the commented-out photo-upload/ESSL UI above. */}
                        <div><span style={{ color: 'rgba(255,255,255,.55)' }}>Batch Time</span> —</div>
                        <div><span style={{ color: 'rgba(255,255,255,.55)' }}>Nationality</span> —</div>
                        <div><span style={{ color: 'rgba(255,255,255,.55)' }}>Joining</span> {joiningDate ? formatDate(joiningDate) : '—'}</div>
                        <div><span style={{ color: 'rgba(255,255,255,.55)' }}>Expiry</span> {expiryDate ? formatDate(expiryDate) : '—'}</div>
                      </div>
                      <div className="id-bar" style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'inherit', letterSpacing: 'normal', textTransform: 'none' }}>
                        <span>REG NO {student.studentRegNo}</span>
                        <span>PRINTED {currentCard?.issueDate ? formatDate(currentCard.issueDate) : '—'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2" style={{ justifyContent: 'center', marginTop: 12 }}>
                      <button className="btn btn-neu btn-sm"><i className="lni lni-download"></i> Download</button>
                      <button className="btn btn-primary btn-sm"><i className="lni lni-printer"></i> Print</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'comms' && (
              <div>
                <div className="dcard">
                  <div className="dcard-hdr stu">
                    <div className="dcard-title"><i className="lni lni-user"></i> Student Profile</div>
                    <div className="flex gap-2" style={{ alignItems: 'center' }}><span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>Login ID:</span><span className="dcard-id">{student.studentNum}</span></div>
                  </div>
                  <div className="dcard-body">
                    <div className="dcard-grid">
                      <div className="fg">
                        <label className="lbl">Student Email <span className="req">*</span></label>
                        <input className="ctrl" value={stuEmail} onChange={e => setStuEmail(e.target.value)} />
                        <div className={`field-hint ${isValidEmail(stuEmail) ? 'ok' : 'err'}`}>{isValidEmail(stuEmail) ? '✓ Valid email format' : '✗ Invalid email format'}</div>
                      </div>
                      <div className="fg">
                        <label className="lbl">WhatsApp / Mobile <span className="req">*</span></label>
                        <input className="ctrl" value={stuPhone} onChange={e => setStuPhone(e.target.value)} />
                        <div className={`field-hint ${isValidPhone(stuPhone) ? 'ok' : 'err'}`}>{isValidPhone(stuPhone) ? '✓ Valid international format' : '✗ Use format e.g. +256 701 234 567'}</div>
                      </div>
                    </div>
                    <div className="dcard-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => dispatch('student', 'email')}><i className="lni lni-envelope"></i> Send Credentials via Email</button>
                      <button className="btn btn-success btn-sm" onClick={() => dispatch('student', 'whatsapp')}><i className="lni lni-whatsapp"></i> Send via WhatsApp</button>
                      <button className="btn btn-neu btn-sm ml-auto" onClick={() => showToast('Student contact saved', 'ok')}><i className="lni lni-save"></i> Save</button>
                    </div>
                  </div>
                </div>
                <div className="dcard">
                  <div className="dcard-hdr par">
                    <div className="dcard-title"><i className="lni lni-users"></i> Parent / Guardian Profile</div>
                    <div className="flex gap-2" style={{ alignItems: 'center' }}><span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>Auto-generated Login ID:</span><span className="dcard-id">{student.studentNum}_P</span></div>
                  </div>
                  <div className="dcard-body">
                    <div className="purple-box" style={{ marginBottom: 14, background: '#f0fdf4', borderColor: 'var(--green-bd)' }}>
                      <i className="lni lni-information" style={{ color: 'var(--green)', fontSize: 15, flexShrink: 0, marginTop: 1 }}></i>
                      <div style={{ fontSize: 12 }}>Parent login ID is auto-generated by appending <code style={{ background: 'rgba(0,0,0,.06)', padding: '1px 5px', borderRadius: 3 }}>_P</code> to the Student ID. A separate password token is generated on first credential dispatch.</div>
                    </div>
                    <div className="dcard-grid">
                      <div className="fg">
                        <label className="lbl">Parent Email <span className="req">*</span></label>
                        <input className="ctrl" value={parEmail} onChange={e => setParEmail(e.target.value)} />
                        <div className={`field-hint ${isValidEmail(parEmail) ? 'ok' : 'err'}`}>{isValidEmail(parEmail) ? '✓ Valid email format' : '✗ Invalid email format'}</div>
                      </div>
                      <div className="fg">
                        <label className="lbl">Parent WhatsApp / Mobile <span className="req">*</span></label>
                        <input className="ctrl" value={parPhone} onChange={e => setParPhone(e.target.value)} />
                        <div className={`field-hint ${isValidPhone(parPhone) ? 'ok' : 'err'}`}>{isValidPhone(parPhone) ? '✓ Valid international format' : '✗ Use format e.g. +256 701 234 567'}</div>
                      </div>
                    </div>
                    <div className="dcard-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => dispatch('parent', 'email')}><i className="lni lni-envelope"></i> Send Parent Credentials via Email</button>
                      <button className="btn btn-success btn-sm" onClick={() => dispatch('parent', 'whatsapp')}><i className="lni lni-whatsapp"></i> Send Parent via WhatsApp</button>
                      <button className="btn btn-neu btn-sm ml-auto" onClick={() => showToast('Parent contact saved', 'ok')}><i className="lni lni-save"></i> Save</button>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-shield"></i> Security &amp; Dispatch Audit Log</div><span className="badge badge-grey">Last {auditLog.length} events</span></div>
                  {auditLog.map(row => (
                    <div className="audit-row" key={row.id}>
                      <div className={`audit-dot ${row.dot}`}></div>
                      <div><div className="audit-action">{row.action}</div><div className="audit-detail">{row.detail}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Toast toast={toast} />
    </>
  )
}
