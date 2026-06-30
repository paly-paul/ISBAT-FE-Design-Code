'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { NewStreamModal } from '@/components/modals/academic/NewStreamModal'
import { EditStreamModal } from '@/components/modals/academic/EditStreamModal'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const rows = [
    { streamCode: 'SE',   streamName: 'Software Engineering' },
    { streamCode: 'DS',   streamName: 'Data Science' },
    { streamCode: 'NET',  streamName: 'Networking & Cybersecurity' },
    { streamCode: 'FIN',  streamName: 'Financial Management' },
    { streamCode: 'MKT',  streamName: 'Marketing Management' },
    { streamCode: 'MECH', streamName: 'Mechanical Engineering' },
  ]

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Specialization Master</div>
            <div className="pg-sub">Manage academic specialization streams</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-stream-modal')}>
            <i className="lni lni-plus"></i> Add Stream
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-certificate"></i></span> Specialization Streams</div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Stream Code</th>
                  <th>Stream Name</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                  : null}
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openModal('edit-stream-modal')}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono font-bold">{r.streamCode}</td>
                    <td><strong>{r.streamName}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewStreamModal  isOpen={openModals.has('new-stream-modal')}  onClose={() => closeModal('new-stream-modal')}  showToast={showToast} />
      <EditStreamModal isOpen={openModals.has('edit-stream-modal')} onClose={() => closeModal('edit-stream-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
