'use client'
import { useState } from 'react'
import { useStudents } from '@/hooks/student/useStudents'
import { StudentDto } from '@/lib/api/student/student'

interface StudentLookupProps {
  onLoad: (student: StudentDto) => void
  onClear: () => void
  loaded: boolean
  placeholder?: string
  hint?: string
}

// Shared "Student Lookup" widget used by Profile, Batch Transfer, Programme
// Transfer, Learning Mode, and Intake Transfer — ported from the
// isbat_student_module.html mockup's .lookup-shell, but backed by the real
// student list (useStudents) instead of a hardcoded sample. Typing searches
// live (same real ?searchTerm= endpoint as Student Master's own search box);
// "Load Student" takes the top match.
export function StudentLookup({ onLoad, onClear, loaded, placeholder, hint }: StudentLookupProps) {
  const [term, setTerm] = useState('')
  const trimmed = term.trim()
  const { data, isFetching } = useStudents(1, 8, { searchTerm: trimmed || undefined })
  const matches = trimmed ? (data?.items ?? []) : []

  function handleLoad() {
    if (matches.length === 0) return
    onLoad(matches[0])
  }

  function handleClear() {
    setTerm('')
    onClear()
  }

  return (
    <div className="lookup-shell">
      <div className="lookup-label"><i className="lni lni-search-alt"></i> Student Lookup</div>
      <div className="lookup-row">
        <div className="lookup-wrap">
          <i className="lni lni-search-alt lookup-icon"></i>
          <input
            className="lookup-inp"
            value={term}
            onChange={e => setTerm(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleLoad() }}
            placeholder={placeholder ?? 'Student ID, name, or registration number…'}
          />
        </div>
        <button className="btn btn-primary" onClick={handleLoad} disabled={matches.length === 0 && !isFetching}>
          <i className="lni lni-user"></i> Load Student
        </button>
        {loaded && <button className="btn btn-neu" onClick={handleClear}><i className="lni lni-close"></i> Clear</button>}
      </div>
      {trimmed && matches.length > 0 && (
        <div className="lookup-hint"><i className="lni lni-checkmark-circle" style={{ color: 'var(--green)' }}></i> {matches.length} match{matches.length !== 1 ? 'es' : ''} — top result: {matches[0].studentName} ({matches[0].studentNum})</div>
      )}
      {trimmed && !isFetching && matches.length === 0 && (
        <div className="lookup-hint"><i className="lni lni-warning" style={{ color: 'var(--amber)' }}></i> No students found for &quot;{trimmed}&quot;</div>
      )}
      {hint && !trimmed && <div className="lookup-hint"><i className="lni lni-information" style={{ color: 'var(--b700)' }}></i> {hint}</div>}
    </div>
  )
}
