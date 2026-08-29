'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { Toast } from '@/components/Toast'

// Split out of the old combined "Category Masters" page (student/masters/)
// per request — this half owns Service Category Master only (the ticketing
// workflow's categories). Still has no backend contract at all — page-local
// mock state, unchanged from the combined page.
interface CategoryRow { id: number; name: string; note: string }

const INITIAL_SERVICE_CATEGORIES: CategoryRow[] = [
  { id: 1, name: 'Finance', note: 'Finance Team' },
  { id: 2, name: 'Assessment', note: 'Exam Office' },
  { id: 3, name: 'Academic', note: 'Academic Registrar' },
  { id: 4, name: 'Infrastructure', note: 'Facilities Team' },
]

export default function Page() {
  const [serviceCats, setServiceCats] = useState(INITIAL_SERVICE_CATEGORIES)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  const [addServiceOpen, setAddServiceOpen] = useState(false)
  const [serviceName, setServiceName] = useState('')
  const [serviceNote, setServiceNote] = useState('')

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openAddService() { setAddServiceOpen(true); setServiceName(''); setServiceNote('') }

  function saveServiceCategory() {
    const row: CategoryRow = { id: Date.now(), name: serviceName.trim() || 'Untitled Category', note: serviceNote.trim() }
    setServiceCats(prev => [...prev, row])
    showToast('Category added', 'ok')
    setAddServiceOpen(false)
  }

  function removeServiceCategory(id: number) {
    setServiceCats(prev => prev.filter(c => c.id !== id))
    showToast('Category removed', 'ok')
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr"><div><div className="pg-title">Service Category Master</div><div className="pg-sub">Student Services ticketing category configuration</div></div></div>
        <div className="card">
          <div className="card-hdr"><div className="card-title"><i className="lni lni-ticket"></i> Service Category Master</div><button className="btn btn-primary btn-sm" onClick={openAddService}><i className="lni lni-plus"></i> Add</button></div>
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
                        <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => removeServiceCategory(c.id)}><i className="lni lni-trash-can"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>

      {addServiceOpen && (
        <div className="modal-overlay open" onClick={() => setAddServiceOpen(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">Add Category</div><button className="modal-close" onClick={() => setAddServiceOpen(false)}>✕</button></div>
            <div>
              <div className="fg"><label className="lbl">Name <span className="req">*</span></label><input className="ctrl" placeholder="Category name" value={serviceName} onChange={e => setServiceName(e.target.value)} /></div>
              <div className="fg"><label className="lbl">Routes To</label><input className="ctrl" placeholder="e.g. Finance Team" value={serviceNote} onChange={e => setServiceNote(e.target.value)} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-neu" onClick={() => setAddServiceOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={saveServiceCategory}>Save</button></div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}
