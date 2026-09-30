'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import { StudentLookup } from '@/components/student/StudentLookup'
import { BaselinePanel } from '@/components/student/BaselinePanel'
import { StudentDto, normalizeStudentDetail } from '@/lib/api/student/student'
import { useStudent } from '@/hooks/student/useStudents'
// import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import {
  useLearningModeOptions,
  useStudentLearningModeDetail,
  useCreateLearningModeRequest,
  usePendingLearningModeRequestForStudent,
} from '@/hooks/student/useLearningMode'

// Ported from isbat_student_module.html's Learning Mode page, then rewired
// to the real students/learning-mode/*.md endpoints (2026-08-31). The
// campus-wide roster report that used to sit below the edit view moved to
// its own page, /student/learning-mode-report (2026-09-29). Only 3 real modes
// exist (Campus/Blended/Online).
//
// Mode changes go through approval (2026-09-30): this page only raises the
// request (mode + remarks + optional document); /student/learning-mode-
// approval lists pending requests and applies the change on approve. See
// learningModeRequests.ts for why requests are browser-local for now.

// useSearchParams() requires a Suspense boundary above it (Next.js App
// Router) — see the wrapping default export at the bottom of this file,
// same split Student Profile uses for the same reason.
function LearningModeContent() {
  // Permission checks disabled for now — every action is allowed. Restore the
  // line below (and the import above) to gate actions by the menu permissions again.
  // const permissions = usePagePermissions()
  const permissions = { add: true, edit: true, delete: true }
  const router = useRouter()
  const searchParams = useSearchParams()
  // Student Profile's action menu links here as
  // /student/learning-mode?studentGuid=<guid> instead of requiring a second
  // StudentLookup search for the student already open there — same
  // deep-link convention Student Master's own "View" action uses to reach
  // Profile itself.
  const studentGuidParam = searchParams.get('studentGuid')
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const [student, setStudent] = useState<StudentDto | null>(null)
  // Deep-link fetch: only run if the page opened with a ?studentGuid= param
  // and we haven't already seeded the student state (e.g. from StudentLookup).
  const { data: guidLoadedStudent } = useStudent(studentGuidParam, !student && !!studentGuidParam)
  useEffect(() => {
    if (!student && studentGuidParam && guidLoadedStudent) setStudent(normalizeStudentDetail(guidLoadedStudent, studentGuidParam))
  }, [student, studentGuidParam, guidLoadedStudent])

  const { data: detail, isLoading: isDetailLoading } = useStudentLearningModeDetail(student?.studentGuid ?? null)
  const { data: options = [] } = useLearningModeOptions()
  const { data: pendingRequest } = usePendingLearningModeRequestForStudent(student?.studentGuid ?? null)
  const createRequest = useCreateLearningModeRequest()

  const [selectedMode, setSelectedMode] = useState('')
  const [remarks, setRemarks] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  // Bumped to remount the file input — the only way to clear its value.
  const [fileInputKey, setFileInputKey] = useState(0)

  // Once the detail loads for a newly-picked student, seed the picker with
  // their current mode (falls back to nothing selected if they've never had
  // one set — learningMode comes back null in that case).
  useEffect(() => {
    setSelectedMode(detail?.learningMode != null ? String(detail.learningMode) : '')
  }, [detail?.studentGuid, detail?.learningMode])

  const currentModeLabel = String(detail?.learningModeLabel ?? (detail as any)?.learningMode ?? (student as any)?.learningMode ?? 'Not set')
  const programmeLabel = detail?.programName ?? (detail as any)?.programme ?? student?.programName ?? (student as any)?.programme ?? null
  const semesterLabel = detail?.semesterName ?? (detail as any)?.semester ?? student?.semesterName ?? (student as any)?.semester ?? null
  const isPending = !!pendingRequest

  function resetForm() {
    setRemarks(''); setDocFile(null); setFileInputKey(k => k + 1)
  }

  function handleLoad(s: StudentDto) { setStudent(s); resetForm() }
  function handleClear() {
    setStudent(null); setSelectedMode(''); resetForm()
    // Drop ?studentGuid= so the effect above doesn't immediately reload the
    // same student right back in — same reasoning as Profile's own clear.
    if (studentGuidParam) router.replace('/student/learning-mode')
  }

  function handleSubmit() {
    if (!permissions.edit || !student) return
    if (!selectedMode) { showToast('Please select a learning mode.', 'warn'); return }
    if (detail?.learningMode != null && String(detail.learningMode) === selectedMode) { showToast('The student is already in this learning mode.', 'warn'); return }
    if (!remarks.trim()) { showToast('Remarks are required.', 'warn'); return }
    createRequest.mutate(
      {
        studentGuid: student.studentGuid,
        studentName: detail?.studentName ?? student.studentName,
        studentRegNo: detail?.studentRegNo ?? student.studentRegNo ?? null,
        programName: programmeLabel,
        semesterName: semesterLabel,
        currentModeLabel,
        requestedMode: Number(selectedMode),
        requestedModeLabel: options.find(o => String(o.value) === selectedMode)?.label ?? selectedMode,
        remarks: remarks.trim(),
        document: docFile,
      },
      {
        onSuccess: () => { resetForm(); showToast('Mode change submitted for approval.', 'ok') },
        onError: (error: Error) => showToast(error.message || 'Could not submit the request.', 'error'),
      },
    )
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Learning Mode</div><div className="pg-sub">Request a change to a student&apos;s learning mode</div></div>
          <Link className="btn btn-neu" href="/student/learning-mode-approval"><i className="lni lni-checkmark-circle"></i> Approvals</Link>
        </div>

        <StudentLookup onLoad={handleLoad} onClear={handleClear} loaded={!!student} />

        {!student ? (
          <div className="empty">
            <div className="empty-icon"><i className="lni lni-display"></i></div>
            <div className="empty-title">No Student Loaded</div>
            <div className="empty-sub">Search for a student to request a learning mode change.</div>
          </div>
        ) : isDetailLoading ? (
          <div className="text-g400 text-center" style={{ padding: 24 }}>Loading learning mode…</div>
        ) : (
          <>
            <BaselinePanel
              label="Current Enrollment (Read-Only)"
              items={[
                { label: 'Student', value: detail?.studentName ?? student.studentName },
                { label: 'Programme', value: programmeLabel ?? '—' },
                { label: 'Semester', value: semesterLabel ?? '—' },
                { label: 'Current Mode', value: currentModeLabel },
              ]}
            />
            <div className="card">
              <div className="card-hdr"><div className="card-title"><i className="lni lni-display"></i> Update Learning Mode</div></div>
              {isPending && (
                <div className="info-box mb-3">
                  <i className="lni lni-hourglass" style={{ color: 'var(--amber)', fontSize: 15, flexShrink: 0 }}></i>
                  <div style={{ fontSize: 12.5 }}>
                    A change to <strong>{pendingRequest.requestedModeLabel}</strong> is awaiting approval. It must be approved or rejected before a new request can be raised.{' '}
                    <Link href={`/student/learning-mode-approval?requestGuid=${pendingRequest.requestGuid}`} style={{ color: 'var(--b700)', fontWeight: 600 }}>Review it →</Link>
                  </div>
                </div>
              )}
              <div className="fg"><label className="lbl">Learning Mode <span className="req">*</span></label>
                <SearchSelect
                  placeholder="— Select mode —"
                  options={options.map(o => ({ value: String(o.value), label: o.label }))}
                  value={selectedMode}
                  onChange={setSelectedMode}
                  disabled={isPending}
                />
              </div>
              <div className="fg">
                <label className="lbl">Remarks <span className="req">*</span></label>
                <textarea className="ctrl" rows={3} placeholder="Reason for changing the learning mode…" value={remarks} onChange={e => setRemarks(e.target.value)} disabled={isPending} />
              </div>
              <div className="fg">
                <label className="lbl">Supporting Document</label>
                <input key={fileInputKey} className="ctrl" type="file" accept=".pdf,image/*" onChange={e => setDocFile(e.target.files?.[0] ?? null)} disabled={isPending} />
                <div style={{ fontSize: 11.5, color: 'var(--g500)', marginTop: 4 }}>Optional — PDF or image, e.g. an approval letter or medical note.</div>
              </div>
              <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-neu" onClick={handleClear}>Cancel</button>
                <button className="btn btn-primary" disabled={isPending || createRequest.isPending || !permissions.edit} onClick={handleSubmit}>
                  <i className="lni lni-telegram-original"></i> {createRequest.isPending ? 'Submitting…' : 'Submit for Approval'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <Toast toast={toast} />
    </>
  )
}

export default function Page() {
  return (
    <Suspense>
      <LearningModeContent />
    </Suspense>
  )
}
