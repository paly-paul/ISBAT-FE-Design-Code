'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeeStructureModal } from '@/components/modals/FeeStructureModal'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'

type FeeRecord = {
  id: number
  feeCode: string
  description: string
  programme: string
}

const MOCK_FEES: FeeRecord[] = [
  { id: 1, feeCode: 'FS-LOCAL-001', description: 'BSc. IT Local Students Fee Structure 2026',          programme: 'BSc. Information Technology'    },
  { id: 2, feeCode: 'FS-INTL-001',  description: 'BSc. IT International Students Fee Structure 2026', programme: 'BSc. Information Technology'    },
  { id: 3, feeCode: 'FS-MBA-001',   description: 'MBA Full-Time Fee Structure 2024',                   programme: 'Master of Business Administration' },
  { id: 4, feeCode: 'FS-LOCAL-002', description: 'BSc. CS Local Students Fee Structure 2026',          programme: 'BSc. Computer Science'           },
  { id: 5, feeCode: 'FS-INTL-002',  description: 'BSc. CS International Students Fee Structure 2026', programme: 'BSc. Computer Science'           },
  { id: 6, feeCode: 'FS-ODL-001',   description: 'ODL Programme Fee Structure 2026',                   programme: 'ODL — Bachelor of Commerce'      },
]

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [records, setRecords] = useState<FeeRecord[]>(MOCK_FEES)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function deleteRecord(id: number) {
    setRecords(prev => prev.filter(r => r.id !== id))
    showToast('Fee structure removed.', '')
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Programme Fee Structure</div>
            <div className="pg-sub">Define and manage fee structures per programme · Set fee items, priorities and base currency</div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-neu" onClick={() => showToast('Fee structure duplicated for next intake.', 'success')}>
              <i className="lni lni-files"></i> Clone Last Year
            </button>
            <button className="btn btn-primary" onClick={() => openModal('new-fee-structure-modal')}>
              <i className="lni lni-plus"></i> New Fee Structure
            </button>
          </div>
        </div>

        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Fee Code</th>
                <th>Description</th>
                <th>Programme</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>
                    <ActionMenu>
                      <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-structure-modal')}><i className="lni lni-pencil"></i> Edit</button>
                      <button className="btn btn-neu btn-sm" onClick={() => deleteRecord(r.id)}><i className="lni lni-trash-can"></i> Delete</button>
                    </ActionMenu>
                  </td>
                  <td><span className="font-mono text-[var(--b700)] font-semibold">{r.feeCode}</span></td>
                  <td>{r.description}</td>
                  <td>{r.programme}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      </div>

      <FeeStructureModal isOpen={openModals.has('new-fee-structure-modal')} onClose={() => closeModal('new-fee-structure-modal')} showToast={showToast} nav={nav} />
      <Toast toast={toast} />
    </>
  )
}
