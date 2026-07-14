'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { NewStreamModal } from '@/components/modals/academic/NewStreamModal'
import { EditStreamModal } from '@/components/modals/academic/EditStreamModal'
import { useStreams, useCreateStream, useUpdateStream, Stream } from '@/hooks/config/useStreams'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingStream, setEditingStream] = useState<Stream | null>(null)

  const { data: rows = [], isLoading } = useStreams()
  const createStream = useCreateStream()
  const updateStream = useUpdateStream()

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(stream: Stream) {
    setEditingStream(stream)
    openModal('edit-stream-modal')
  }

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
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : rows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}>
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
      <NewStreamModal
        isOpen={openModals.has('new-stream-modal')}
        onClose={() => closeModal('new-stream-modal')}
        showToast={showToast}
        createStream={createStream}
      />
      <EditStreamModal
        isOpen={openModals.has('edit-stream-modal')}
        onClose={() => closeModal('edit-stream-modal')}
        showToast={showToast}
        stream={editingStream}
        updateStream={updateStream}
      />
      <Toast toast={toast} />
    </>
  )
}
