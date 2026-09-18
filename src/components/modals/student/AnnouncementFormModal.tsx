'use client'
import { useEffect, useRef, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../shared/SuccessPopup'
import DatePicker from '@/components/DatePicker'
import { SearchSelect } from '@/components/SearchSelect'
import { RichTextEditor, isHtmlEmpty } from '@/components/RichTextEditor'
import { useProgramDropdown } from '@/hooks/academic/useProgramMaster'
import { AnnouncementInput, AnnouncementItem, AttachmentType } from '@/app/student/announcement-management/types'

const SUBJECT_MAX = 150
const ATTACHMENT_ACCEPT = 'image/*,.pdf'
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024 // 10MB — an arbitrary client-side cap, no backend to enforce one yet

interface Attachment { url: string; name: string; type: AttachmentType }

// No backend endpoint exists for Announcement Management yet (unlike Event
// Management's confirmed academic-service.students.events.* contract) — the
// page holds everything in local state and hands this modal a plain
// onSubmit callback rather than a react-query mutation. Swap this for the
// mutation-object pattern (see EventFormModal) once the API is deployed.
interface AnnouncementFormModalProps extends ModalProps {
  mode: 'new' | 'edit'
  initial: AnnouncementItem | null
  onSubmit: (input: AnnouncementInput) => void
}

export function AnnouncementFormModal({ isOpen, onClose, showToast, mode, initial, onSubmit }: AnnouncementFormModalProps) {
  const isEdit = mode === 'edit'
  const { data: programs = [], isLoading: programsLoading } = useProgramDropdown(undefined, isOpen)

  const [subject, setSubject] = useState('')
  const [programGuid, setProgramGuid] = useState('')
  const [visibleUpto, setVisibleUpto] = useState('')
  const [body, setBody] = useState('')
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [saved, setSaved]   = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Tracks object URLs this form created (vs. one carried over from `initial`
  // on edit) so they can be revoked on replace/remove/close without
  // revoking a URL a saved row is still using elsewhere on the page.
  const ownedUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    if (isEdit && initial) {
      setSubject(initial.subject)
      setProgramGuid(initial.programGuid ?? '')
      setVisibleUpto(initial.visibleUpto)
      setBody(initial.body)
      setAttachment(
        initial.attachmentUrl && initial.attachmentType
          ? { url: initial.attachmentUrl, name: initial.attachmentName ?? 'Attachment', type: initial.attachmentType }
          : null,
      )
    } else if (!isEdit) {
      setSubject(''); setProgramGuid(''); setVisibleUpto(''); setBody(''); setAttachment(null)
    }
    ownedUrlRef.current = null
    setErrors({})
  }, [isOpen, isEdit, initial])

  if (!isOpen) return null

  function revokeOwnedUrl() {
    if (ownedUrlRef.current) {
      URL.revokeObjectURL(ownedUrlRef.current)
      ownedUrlRef.current = null
    }
  }

  function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_ATTACHMENT_BYTES) {
      showToast('Attachment must be 10MB or smaller', 'error')
      return
    }
    const type: AttachmentType | null = file.type === 'application/pdf' ? 'pdf' : file.type.startsWith('image/') ? 'image' : null
    if (!type) {
      showToast('Only images and PDFs are supported', 'error')
      return
    }
    revokeOwnedUrl()
    const url = URL.createObjectURL(file)
    ownedUrlRef.current = url
    setAttachment({ url, name: file.name, type })
  }

  function removeAttachment() {
    revokeOwnedUrl()
    setAttachment(null)
  }

  function handleClose() {
    setSaved(false)
    revokeOwnedUrl()
    setSubject(''); setProgramGuid(''); setVisibleUpto(''); setBody(''); setAttachment(null); setErrors({})
    onClose()
  }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!subject.trim()) e.subject = 'Subject is required'
    else if (subject.trim().length > SUBJECT_MAX) e.subject = `Subject must be ${SUBJECT_MAX} characters or fewer`
    if (!visibleUpto) e.visibleUpto = 'Visible Upto is required'
    if (isHtmlEmpty(body)) e.body = 'Announcement is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const selectedProgram = programs.find(p => p.programGuid === programGuid)
    onSubmit({
      subject: subject.trim(),
      programGuid: programGuid || null,
      programName: selectedProgram?.programName ?? null,
      visibleUpto,
      body,
      attachmentUrl: attachment?.url ?? null,
      attachmentName: attachment?.name ?? null,
      attachmentType: attachment?.type ?? null,
    })
    // The saved row now owns this object URL (if any was created this
    // session) — handleClose must no longer revoke it once the popup closes.
    ownedUrlRef.current = null
    setSaved(true)
    showToast(isEdit ? 'Announcement updated successfully' : 'Announcement added successfully')
  }

  const programOptions = [
    { value: '', label: 'All Programmes' },
    ...programs.map(p => ({ value: p.programGuid, label: `${p.programCode} — ${p.programName}` })),
  ]

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup
            title={isEdit ? 'Announcement Updated!' : 'Announcement Added!'}
            subtitle={isEdit ? 'Your changes have been saved successfully.' : 'The new announcement has been saved successfully.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id={isEdit ? 'edit-announcement-modal' : 'new-announcement-modal'}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className={`lni ${isEdit ? 'lni-pencil' : 'lni-bullhorn'}`}></i> {isEdit ? 'Edit Announcement' : 'Add Announcement'}</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Subject <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Board Chairman's Message"
              maxLength={SUBJECT_MAX}
              value={subject}
              onChange={e => { setSubject(e.target.value); clearError('subject') }}
              style={errors.subject ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.subject && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.subject}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Visible Upto <span className="req">*</span></div>
            <DatePicker value={visibleUpto} onChange={v => { setVisibleUpto(v); clearError('visibleUpto') }} hasError={!!errors.visibleUpto} />
            {errors.visibleUpto && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.visibleUpto}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">Programme</div>
            <SearchSelect
              placeholder="All Programmes"
              value={programGuid}
              onChange={setProgramGuid}
              options={programOptions}
              isLoading={programsLoading}
            />
          </div>
          <div className="fg span2">
            <div className="lbl">Announcement <span className="req">*</span></div>
            <RichTextEditor value={body} onChange={v => { setBody(v); clearError('body') }} placeholder="Type the announcement here…" minHeight={180} />
            {errors.body && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.body}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">Attachment (image or PDF, optional)</div>
            {attachment ? (
              <div className="flex items-center gap-2" style={{ padding: '8px 12px', border: '1px solid var(--g200)', borderRadius: 'var(--rsm)' }}>
                <i className={`lni ${attachment.type === 'image' ? 'lni-image' : 'lni-files'}`} style={{ color: 'var(--g500)' }}></i>
                <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.name}</span>
                <button type="button" className="btn btn-neu btn-sm" onClick={() => fileInputRef.current?.click()}>Replace</button>
                <button type="button" className="btn btn-neu btn-sm" onClick={removeAttachment}><i className="lni lni-trash-can"></i></button>
              </div>
            ) : (
              <button type="button" className="btn btn-neu" onClick={() => fileInputRef.current?.click()}>
                <i className="lni lni-paperclip"></i> Choose file…
              </button>
            )}
            <input ref={fileInputRef} type="file" accept={ATTACHMENT_ACCEPT} onChange={handleAttachmentChange} style={{ display: 'none' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {isEdit ? 'Update Announcement' : 'Add Announcement'}
          </button>
        </div>
      </div>
    </div>
  )
}
