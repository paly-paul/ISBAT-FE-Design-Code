'use client'
import { Suspense, useLayoutEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatDate } from '@/lib/date'
import { useVettingApplicationDetail } from '@/hooks/admission/useVetting'
import { documentTitle, genderText, orDash } from '@/lib/admission/applicantDisplay'
import { DocumentPreviewModal } from '@/components/modals/shared/DocumentPreviewModal'
import { QualificationCard } from '@/components/admission/QualificationCard'

// Read-only profile opened from "View Full Profile" (Vetting Desk review, View
// Applicant, Complete Registration). Everything comes from
// GET /admissions/vetting/applications/{applicationGuid}
// (get-vetting-application-detail.md): the applicant's details plus their
// qualifications and documents. The link only carries the guid.

type Tab = 'personal' | 'application' | 'qualification' | 'documents'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'personal',     label: 'Personal Information', icon: 'lni-user-4' },
  { id: 'application',  label: 'Application Details',  icon: 'lni-clipboard' },
  { id: 'qualification', label: 'Qualification',       icon: 'lni-graduation' },
  { id: 'documents',    label: 'Documents',            icon: 'lni-folder-2' },
]

function ReadOnly({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div className="fg"><label className="lbl">{label}</label><input className={`ctrl${mono ? ' font-mono' : ''}`} readOnly value={value} /></div>
}

function PageState({ icon, title, sub, spin }: { icon: string; title: string; sub?: string; spin?: boolean }) {
  return (
    <div className="card">
      <div className="rpt-empty" role="status" style={{ padding: '40px 0' }}>
        <i className={`lni ${icon}${spin ? ' spin' : ''}`} aria-hidden="true" />
        <div className="rpt-empty-title">{title}</div>
        {sub && <div className="text-sm text-g500">{sub}</div>}
      </div>
    </div>
  )
}

function ApplicantProfileContent() {
  const searchParams = useSearchParams()
  const applicationGuid = searchParams.get('applicationGuid')
  const { data: detail, isLoading, isError, error } = useVettingApplicationDetail(applicationGuid, !!applicationGuid)

  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null)
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement>>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  // The tab bar only mounts once the record has loaded, so re-measure then too.
  useLayoutEffect(() => {
    const el = tabRefs.current[activeTab]
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeTab, detail])

  const header = (
    <div className="pg-hdr">
      <div>
        <div className="pg-title">Applicant Profile</div>
        <div className="pg-sub">Read-only view &middot; captured during Application Filing</div>
      </div>
    </div>
  )

  if (!applicationGuid) {
    return <div id="page-applicant-profile">{header}<PageState icon="lni-user" title="No applicant selected" sub="Open this page from View Full Profile on an application." /></div>
  }
  if (isLoading) {
    return <div id="page-applicant-profile">{header}<PageState icon="lni-spinner-arrow" spin title="Loading applicant profile…" /></div>
  }
  if (isError || !detail) {
    return <div id="page-applicant-profile">{header}<PageState icon="lni-warning" title="Couldn’t load this applicant" sub={(error as Error | null)?.message || 'Please try again later.'} /></div>
  }

  const firstName = orDash(detail.firstName)
  const lastName = orDash(detail.lastName)
  const fullName = [detail.firstName, detail.lastName].map(v => orDash(v)).filter(v => v !== '—').join(' ') || '—'
  const initials = fullName !== '—' ? fullName.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase() : '—'
  const intake = orDash(String(detail.intakeName || detail.intakeCode || detail.intake || ''))
  const admissionType = orDash(detail.admissionType)
  const uploadedDocs = detail.documents.filter(d => d.uploaded).length
  const withProof = detail.qualifications.filter(q => q.proofUrl).length

  return (
    <div id="page-applicant-profile">
      {header}

      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center rounded-full font-bold text-white shrink-0" style={{ width: 64, height: 64, background: 'var(--b500)', fontSize: 22 }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-lg text-g900">{fullName}</div>
            <div className="text-sm text-g500">{orDash(detail.programName)}{admissionType !== '—' && ` · ${admissionType}`}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {orDash(detail.appRefNo) !== '—' && <span className="badge badge-blue font-mono">{detail.appRefNo}</span>}
            {orDash(detail.campusName) !== '—' && <span className="badge badge-grey">{detail.campusName}</span>}
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="tab-bar">
          {TABS.map(t => (
            <button
              key={t.id}
              ref={el => { if (el) tabRefs.current[t.id] = el }}
              className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <i className={`lni ${t.icon}`} /> {t.label}
            </button>
          ))}
          <span className="tab-indicator" style={{ left: indicator.left, width: indicator.width }} />
        </div>

        <div key={activeTab} className="p-5 tab-panel-in">
          {activeTab === 'personal' && (
            <div className="g3">
              <ReadOnly label="First Name" value={firstName} />
              <ReadOnly label="Last Name" value={lastName} />
              <ReadOnly label="Date of Birth" value={detail.dob ? formatDate(detail.dob) : '—'} />
              <ReadOnly label="Gender" value={genderText(detail.gender) || '—'} />
              <ReadOnly label="Nationality" value={orDash(detail.nationality)} />
              <ReadOnly label="Country" value={orDash(detail.countryName)} />
              <ReadOnly label="National ID" value={orDash(detail.nationalId)} />
              <ReadOnly label="Phone" value={orDash(detail.phone)} />
              <ReadOnly label="Email" value={orDash(detail.emailId)} />
            </div>
          )}

          {activeTab === 'application' && (
            <div className="g3">
              <ReadOnly label="App. Ref" value={orDash(detail.appRefNo)} mono />
              <ReadOnly label="Admission Type" value={admissionType} />
              <ReadOnly label="Programme" value={orDash(detail.programName)} />
              <ReadOnly label="Intake" value={intake} />
              <ReadOnly label="Campus" value={orDash(detail.campusName)} />
              <ReadOnly label="Submitted" value={detail.submittedDate ? formatDate(detail.submittedDate) : '—'} />
            </div>
          )}

          {activeTab === 'qualification' && (
            detail.qualifications.length === 0 ? (
              <p className="text-sm text-g500">No qualifications submitted yet.</p>
            ) : (
              <>
                <p className="text-sm text-g500 mb-3">{withProof} of {detail.qualifications.length} with proof</p>
                <div className="vd-list">
                  {detail.qualifications.map((q, i) => (
                    <QualificationCard key={q.applicationQualGuid} q={q} index={i} onViewProof={(url, title) => setPreview({ url, title })} />
                  ))}
                </div>
              </>
            )
          )}

          {activeTab === 'documents' && (
            detail.documents.length === 0 ? (
              <p className="text-sm text-g500">No documents required for this application.</p>
            ) : (
              <>
                <p className="text-sm text-g500 mb-3">{uploadedDocs} of {detail.documents.length} uploaded</p>
                <div className="vd-list">
                  {detail.documents.map(doc => (
                    <div key={doc.documentType} className={`vd-doc${doc.uploaded ? '' : ' missing'}`}>
                      <span className="vd-doc-icon"><i className={`lni ${doc.uploaded ? 'lni-folder' : 'lni-question-circle'}`} aria-hidden="true" /></span>
                      <div className="vd-doc-body">
                        <div className="vd-doc-name">{documentTitle(doc.documentType)}</div>
                        <div className="vd-doc-sub">{doc.uploaded ? 'Uploaded' : 'Missing'}</div>
                      </div>
                      {doc.uploaded && doc.url && (
                        <button type="button" className="btn btn-neu btn-sm" onClick={() => setPreview({ url: doc.url!, title: documentTitle(doc.documentType) })} aria-label={`View ${documentTitle(doc.documentType)}`}>
                          <i className="lni lni-eye" aria-hidden="true" /> View
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )
          )}
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={!!preview}
        onClose={() => setPreview(null)}
        url={preview?.url ?? null}
        title={preview?.title}
      />
    </div>
  )
}

export default function ApplicantProfilePage() {
  return (
    <Suspense>
      <ApplicantProfileContent />
    </Suspense>
  )
}
