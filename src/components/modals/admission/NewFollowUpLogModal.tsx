'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../shared/SuccessPopup'
import { FailurePopup } from '../shared/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import DatePicker from '@/components/DatePicker'
import { EnquiryFollowUpInput } from '@/lib/api/admission/enquiryFollowUp'
import { useSearchEmployeesInfinite } from '@/hooks/employee/useEmployees'
import { flattenUniquePages } from '@/lib/pagination'
import { useFollowUpStatuses } from '@/hooks/config/useFollowUpStatuses'
import { useFollowUpModes } from '@/hooks/admission/useFollowUpModes'
import { useEnquiryStatuses } from '@/hooks/config/useEnquiryStatuses'
import { useInterestLevels } from '@/hooks/admission/useInterestLevels'
import { useEnquiryFollowUpsInfinite } from '@/hooks/admission/useEnquiryFollowUps'

interface NewFollowUpLogModalProps extends ModalProps {
  createFollowUp: {
    mutate: (input: EnquiryFollowUpInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

const ENQUIRY_PICKER_PAGE_SIZE = 20

// Enquiry picker — scroll-to-load-more (via useEnquiryFollowUpsInfinite)
// instead of a SearchSelect over a capped 1000-row snapshot. The picker
// stores and submits the selected enquiry's real GUID. Reuses SearchSelect's
// own CSS classes (.ss-trigger, .ss-opts, etc.) for a matching look without
// duplicating its styles. The search box here only filters what's already
// loaded, client-side.
function EnquiryPicker({ value, onChange, enabled, hasError }: { value: string; onChange: (v: string) => void; enabled: boolean; hasError?: boolean }) {
  const [open, setOpen] = useState(false)
  const [filterText, setFilterText] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } = useEnquiryFollowUpsInfinite(ENQUIRY_PICKER_PAGE_SIZE, enabled)

  const allItems = data?.pages.flatMap(p => p.items) ?? []
  const selected = value ? allItems.find(item => item.enquiryGuid === value) : undefined

  const term = filterText.trim().toLowerCase()
  const filtered = allItems
    .map((item, absIndex) => ({ item, absIndex }))
    .filter(({ item }) => !term || `${item.enquiryCode} ${item.studentName}`.toLowerCase().includes(term))

  // Same scrollTop > 0 guard the other infinite-scroll dropdowns in this app
  // use — a plain distance-to-bottom check alone fires spuriously on a short
  // list right after a new page loads, even with no user interaction.
  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    if (!hasNextPage || isFetchingNextPage) return
    const el = e.currentTarget
    if (el.scrollTop > 0 && el.scrollHeight - el.scrollTop - el.clientHeight < 48) fetchNextPage()
  }

  function pick(enquiryGuid: string) {
    onChange(enquiryGuid)
    setOpen(false)
    setFilterText('')
  }

  return (
    <div style={{ position: 'relative' }} ref={boxRef}>
      <button
        type="button"
        className="ctrl ss-trigger"
        onClick={() => setOpen(o => !o)}
        style={hasError ? { borderColor: 'var(--red)' } : undefined}
      >
        <span className={`ss-label${!selected ? ' ss-placeholder' : ''}`}>
          {selected ? `${selected.enquiryCode} — ${selected.studentName}` : '— select an enquiry —'}
        </span>
        <i className="lni lni-chevron-down ss-chevron" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
      </button>
      {open && (
        <div
          className="ss-drop mt-1"
          style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30 }}
        >
          <div className="ss-search">
            <input
              className="ctrl"
              style={{ fontSize: 12, height: 28, padding: '4px 8px' }}
              placeholder="Search loaded enquiries…"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="ss-opts" style={{ maxHeight: 200 }} onScroll={handleScroll}>
            {isFetching && allItems.length === 0 ? (
              <div className="ss-no-match">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="ss-no-match">
                {term ? 'No matches among loaded enquiries — keep scrolling to load more.' : 'No enquiries found.'}
              </div>
            ) : (
              <>
                {filtered.map(({ item, absIndex }) => (
                  <div
                    key={item.enquiryGuid}
                    className={`col-filter-opt${value === item.enquiryGuid ? ' fil-active' : ''}`}
                    onClick={() => pick(item.enquiryGuid)}
                  >
                    {item.enquiryCode} — {item.studentName}
                  </div>
                ))}
                {isFetchingNextPage && <div className="ss-no-match">Loading more…</div>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// The API checks follow-up dates against today's *UTC* date
// (post-enquiry-followup.md) — not the local one, which in Uganda (UTC+3) is
// a day ahead between midnight and 03:00.
function todayUtcYmd() {
  return new Date().toISOString().slice(0, 10)
}

const REMARKS_MAX = 300

export function NewFollowUpLogModal({ isOpen, onClose, showToast, createFollowUp }: NewFollowUpLogModalProps) {
  const { data: followUpStatuses = [] } = useFollowUpStatuses(isOpen)
  const { data: followUpModes = [] }   = useFollowUpModes(isOpen)
  const { data: enquiryStatuses = [] } = useEnquiryStatuses(isOpen)
  const { data: interestLevels = [] }  = useInterestLevels(isOpen)

  const [employeeSearch, setEmployeeSearch] = useState('')
  const [committedEmployeeSearch, setCommittedEmployeeSearch] = useState('')
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setCommittedEmployeeSearch(employeeSearch.trim()), 300)
    return () => clearTimeout(timer)
  }, [employeeSearch])
  const employeeQuery = useSearchEmployeesInfinite(committedEmployeeSearch, 20, isOpen && employeePickerOpen)
  const employees = useMemo(
    () => flattenUniquePages(employeeQuery.data?.pages ?? [], e => e.employeeGuid),
    [employeeQuery.data],
  )

  const advisorOptions      = employees.map(e => ({ value: e.employeeGuid, label: e.empName }))
  const followUpStatusOptions = followUpStatuses.map(s => ({ value: s.followUpStatusGuid, label: s.followUpStatusName }))
  const followUpModeOptions   = followUpModes.map(m => ({ value: m.followUpModeGuid, label: m.followUpModeName }))
  const enquiryStatusOptions  = enquiryStatuses.map(s => ({ value: s.enquiryStatusGuid, label: s.enquiryStatusName }))
  const interestLevelOptions  = interestLevels.map(l => ({ value: l.interestLevelGuid, label: l.interestLevelName }))

  const [saved, setSaved]     = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [enquiryGuid, setEnquiryGuid]               = useState('')
  const [advisorGuid, setAdvisorGuid]               = useState('')
  const [followUpStatusGuid, setFollowUpStatusGuid] = useState('')
  const [followUpModeGuid, setFollowUpModeGuid]     = useState('')
  const [enquiryStatusGuid, setEnquiryStatusGuid]   = useState('')
  const [interestLevelGuid, setInterestLevelGuid]   = useState('')
  const [nextFollowDate, setNextFollowDate]         = useState('')
  const [remarks, setRemarks]                       = useState('')
  const [errors, setErrors]                         = useState<Record<string, string>>({})

  if (!isOpen) return null

  // Follow-up date isn't a choice — the API only accepts today.
  const today = todayUtcYmd()
  const todayLabel = new Date(`${today}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  function handleClose() {
    setSaved(false); setFailure(null)
    setEnquiryGuid(''); setAdvisorGuid('')
    setFollowUpStatusGuid(''); setFollowUpModeGuid(''); setEnquiryStatusGuid(''); setInterestLevelGuid('')
    setNextFollowDate(''); setRemarks(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!enquiryGuid || enquiryGuid === '0' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(enquiryGuid)) {
      e.enquiryIdx = 'Please select a valid Enquiry'
    }
    if (!advisorGuid)        e.advisorGuid = 'Please select an Advisor'
    if (!followUpStatusGuid) e.followUpStatusGuid = 'Please select a Follow-up Status'
    if (!followUpModeGuid)   e.followUpModeGuid = 'Please select a Follow-up Mode'
    if (!enquiryStatusGuid)  e.enquiryStatusGuid = 'Please select an Enquiry Status'
    if (nextFollowDate && nextFollowDate < today) e.nextFollowDate = 'Next follow-up date must be today or a future date'
    if (!remarks.trim())     e.remarks = 'Remarks are required'
    else if (remarks.trim().length > REMARKS_MAX) e.remarks = `Remarks can be at most ${REMARKS_MAX} characters`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    createFollowUp.mutate(
      {
        enquiryGuid,
        advisorGuid,
        followUpDate: `${today}T00:00:00`,
        followUpStatusGuid,
        followUpModeGuid,
        enquiryStatusGuid,
        interestLevelGuid: interestLevelGuid || null,
        nextFollowDate: nextFollowDate ? `${nextFollowDate}T00:00:00` : null,
        remarks: remarks.trim(),
      },
      {
        onSuccess: () => { setSaved(true); showToast('Follow-up logged successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to log follow-up. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Follow-up Logged!" subtitle="The follow-up has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Log Follow-up" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-followup-log-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-phone"></i> Log Follow-up</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="g2">
          <div className="fg" style={{ gridColumn: 'span 2' }}>
            <div className="lbl">Enquiry <span className="req">*</span></div>
            <EnquiryPicker value={enquiryGuid} onChange={setEnquiryGuid} enabled={isOpen} hasError={!!errors.enquiryIdx} />
            {errors.enquiryIdx && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.enquiryIdx}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Advisor <span className="req">*</span></div>
            <SearchSelect
              placeholder="— select —"
              options={advisorOptions}
              value={advisorGuid}
              onChange={setAdvisorGuid}
              onSearch={setEmployeeSearch}
              onOpenChange={setEmployeePickerOpen}
              isLoading={employeeQuery.isLoading}
              hasNextPage={employeeQuery.hasNextPage}
              isFetchingNextPage={employeeQuery.isFetchingNextPage}
              onLoadMore={() => employeeQuery.fetchNextPage()}
            />
            {errors.advisorGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.advisorGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Follow-up Date</div>
            {/* Locked to today — same read-only lock style as the current-intake fields. */}
            <div className="inp-wrap">
              <i className="lni lni-lock-alt inp-icon"></i>
              <input className="ctrl" value={todayLabel} readOnly tabIndex={-1} style={{ cursor: 'default', fontWeight: 600 }} title="A follow-up is always logged for today" />
            </div>
          </div>
          <div className="fg">
            <div className="lbl">Follow-up Status <span className="req">*</span></div>
            <SearchSelect placeholder="— select —" options={followUpStatusOptions} value={followUpStatusGuid} onChange={setFollowUpStatusGuid} />
            {errors.followUpStatusGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.followUpStatusGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Follow-up Mode <span className="req">*</span></div>
            <SearchSelect placeholder="— select —" options={followUpModeOptions} value={followUpModeGuid} onChange={setFollowUpModeGuid} />
            {errors.followUpModeGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.followUpModeGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Enquiry Status <span className="req">*</span></div>
            <SearchSelect placeholder="— select —" options={enquiryStatusOptions} value={enquiryStatusGuid} onChange={setEnquiryStatusGuid} />
            {errors.enquiryStatusGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.enquiryStatusGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Interest Level</div>
            <SearchSelect placeholder="— optional —" options={interestLevelOptions} value={interestLevelGuid} onChange={setInterestLevelGuid} />
          </div>
          <div className="fg">
            <div className="lbl">Next Follow-up Date</div>
            <DatePicker value={nextFollowDate} onChange={setNextFollowDate} hasError={!!errors.nextFollowDate} />
            {errors.nextFollowDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.nextFollowDate}</p>}
          </div>
          <div className="fg" style={{ gridColumn: 'span 2' }}>
            <div className="lbl">Remarks <span className="req">*</span> <span className="text-g400" style={{ fontWeight: 400 }}>({remarks.trim().length}/{REMARKS_MAX})</span></div>
            <textarea className="ctrl" rows={3} maxLength={REMARKS_MAX} placeholder="e.g. Called student, interested in Diploma program." value={remarks} onChange={e => setRemarks(e.target.value)} />
            {errors.remarks && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.remarks}</p>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={createFollowUp.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {createFollowUp.isPending ? 'Saving…' : 'Save Follow-up'}
          </button>
        </div>
      </div>
    </div>
  )
}
