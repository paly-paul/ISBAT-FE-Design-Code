'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { Toast } from '@/components/Toast'

// Ported from isbat_student_module.html's Category Masters page. No backend
// contract exists for either master — page-local mock state only, mutated
// client-side (no persistence beyond the session).
interface CategoryRow { id: number; name: string; note: string }

const INITIAL_SERVICE_CATEGORIES: CategoryRow[] = [
  { id: 1, name: 'Finance', note: 'Finance Team' },
  { id: 2, name: 'Assessment', note: 'Exam Office' },
  { id: 3, name: 'Academic', note: 'Academic Registrar' },
  { id: 4, name: 'Infrastructure', note: 'Facilities Team' },
]

const INITIAL_STUDENT_CATEGORIES: CategoryRow[] = [
  { id: 1, name: 'Local Student', note: 'Local fee structure' },
  { id: 2, name: 'International', note: "Int'l fee structure" },
  { id: 3, name: 'Sponsored (HESFB)', note: 'Bypasses fee checks' },
  { id: 4, name: 'Refugee', note: 'Special discount' },
  { id: 5, name: 'UCAM', note: 'Partner institution' },
]

type Target = 'service' | 'student'

export default function Page() {
  const [serviceCats, setServiceCats] = useState(INITIAL_SERVICE_CATEGORIES)
  const [studentCats, setStudentCats] = useState(INITIAL_STUDENT_CATEGORIES)
  const [addTarget, setAddTarget] = useState<Target | null>(null)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openAdd(target: Target) { setAddTarget(target); setName(''); setNote('') }

  function saveCategory() {
    if (!name.trim() || !addTarget) return
    const row: CategoryRow = { id: Date.now(), name: name.trim(), note: note.trim() }
    if (addTarget === 'service') setServiceCats(prev => [...prev, row])
    else setStudentCats(prev => [...prev, row])
    showToast('Category added', 'ok')
    setAddTarget(null)
  }

  function removeCategory(target: Target, id: number) {
    if (target === 'service') setServiceCats(prev => prev.filter(c => c.id !== id))
    else setStudentCats(prev => prev.filter(c => c.id !== id))
    showToast('Category removed', 'ok')
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr"><div><div className="pg-title">Category Masters</div><div className="pg-sub">Service and Student Category configuration</div></div></div>
        <div className="g2">
          <div className="card">
            <div className="card-hdr"><div className="card-title"><i className="lni lni-ticket"></i> Service Category Master</div><button className="btn btn-primary btn-sm" onClick={() => openAdd('service')}><i className="lni lni-plus"></i> Add</button></div>
            <ScrollTable>
              <table>
                <thead><tr><th>Category</th><th>Routes To</th><th style={{ width: 90 }}></th></tr></thead>
                <tbody>
                  {serviceCats.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td className="text-muted">{c.note}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn-icon"><i className="lni lni-pencil-alt"></i></button>
                          <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => removeCategory('service', c.id)}><i className="lni lni-trash-can"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
          </div>
          <div className="card">
            <div className="card-hdr"><div className="card-title"><i className="lni lni-users"></i> Student Category Master</div><button className="btn btn-primary btn-sm" onClick={() => openAdd('student')}><i className="lni lni-plus"></i> Add</button></div>
            <ScrollTable>
              <table>
                <thead><tr><th>Category</th><th>Fee Impact</th><th style={{ width: 90 }}></th></tr></thead>
                <tbody>
                  {studentCats.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td className="text-muted">{c.note}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn-icon"><i className="lni lni-pencil-alt"></i></button>
                          <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => removeCategory('student', c.id)}><i className="lni lni-trash-can"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
          </div>
        </div>
      </div>

      {addTarget && (
        <div className="modal-overlay open" onClick={() => setAddTarget(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Add Category</div><button className="modal-close" onClick={() => setAddTarget(null)}>✕</button></div>
            <div>
              <div className="fg"><label className="lbl">Name <span className="req">*</span></label><input className="ctrl" placeholder="Category name" value={name} onChange={e => setName(e.target.value)} /></div>
              <div className="fg"><label className="lbl">{addTarget === 'service' ? 'Routes To' : 'Fee Impact'}</label><input className="ctrl" placeholder={addTarget === 'service' ? 'e.g. Finance Team' : 'e.g. Local fee structure'} value={note} onChange={e => setNote(e.target.value)} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-neu" onClick={() => setAddTarget(null)}>Cancel</button><button className="btn btn-primary" disabled={!name.trim()} onClick={saveCategory}>Save</button></div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}
