'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { TtImportModal } from '@/components/TtImportModal'
import { AddSlotModal } from '@/components/AddSlotModal'
import { RoomMgmtModal } from '@/components/RoomMgmtModal'
import { Toast } from '@/components/Toast'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Timetable Management</div>
            <div className="pg-sub">Module 4 · Drag-and-drop scheduling · Dual clash prevention (Faculty + Room) · Immediate publish to Student Portal and Faculty view</div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-neu btn-sm" onClick={() => openModal('room-mgmt-modal')}><i className="lni lni-apartment"></i> Manage Rooms</button>
            <button className="btn btn-neu btn-sm" onClick={() => openModal('tt-import-modal')}><i className="lni lni-download"></i> Import Excel</button>
            <button className="btn btn-primary" onClick={() => showToast('Publishing timetable...', 'success')}><i className="lni lni-volume-high"></i> Publish — Students &amp; Faculty</button>
          </div>
        </div>

        <div className="g2 mb-[14px]">
          <div className="danger-box flex-col items-start gap-1">
            <span className="font-bold text-[12.5px]"><i className="lni lni-volume-high"></i> Dual Clash Prevention (Hard Block)</span>
            <span className="text-xs">The system checks <strong>both</strong> conditions simultaneously on every slot entry:</span>
            <div className="flex gap-2 flex-wrap mt-[2px]">
              <span className="bg-[var(--red-bg)] border border-[var(--red-bd)] rounded p-[3px_8px] text-[11.5px] font-semibold"><i className="lni lni-user"></i> Faculty Clash — teacher already allocated elsewhere at same time</span>
              <span className="bg-[var(--red-bg)] border border-[var(--red-bd)] rounded p-[3px_8px] text-[11.5px] font-semibold"><i className="lni lni-apartment"></i> Room Clash — room already occupied by any class at exact same slot</span>
            </div>
            <span className="text-[11.5px] mt-[2px]">If either clash is detected → <strong>entry is blocked with an error message</strong>. No override permitted.</span>
          </div>
          <div className="info-box flex-col items-start gap-1">
            <span className="font-bold text-[12.5px]"><i className="lni lni-volume-high"></i> Publish Rules</span>
            <span className="text-xs">Once published, the schedule is <strong>immediately visible</strong> on both the Student Portal and the Lecturer&apos;s view — no delay.</span>
            <span className="text-xs mt-[2px]">Subjects with a <strong>Repetition Tag</strong> (set in Course Master) allow multiple batches to be combined into a single slot — system provides a combine option when a tag match is detected.</span>
          </div>
        </div>

        <div className="card mb-[14px] p-4">
          <div className="g4">
            <div className="fg"><div className="lbl">Batch <span className="req">*</span></div>
              <select className="ctrl" id="tt-batch" onChange={() => showToast('Rendering timetable...', 'info')}>
                <option value="BSC-IT-S1-D">BSC-IT-S26-DA · BSc. IT Sem 1 Day A</option>
                <option value="BBA-S3-D">BBA-S26-DA · BBA Sem 3 Day A</option>
                <option value="MBA-S1-E">MBA-S26-EA · MBA Sem 1 Evening A</option>
                <option value="BENG-CIV-S2-D">BEng-CIV-S26-DA · Civil Sem 2 Day A</option>
              </select>
            </div>
            <div className="fg"><div className="lbl">Intake</div>
              <select className="ctrl"><option>Spring 2026 (20261)</option></select>
            </div>
            <div className="fg"><div className="lbl">Room Filter</div>
              <select className="ctrl" id="tt-room-filter" onChange={() => showToast('Filtering rooms...', 'info')}>
                <option value="">All Rooms</option>
                <option value="LR-01">LR-01 (cap. 60)</option>
                <option value="LR-02">LR-02 (cap. 60)</option>
                <option value="Lab-A">Lab-A Linux (cap. 40)</option>
                <option value="Lab-B">Lab-B General (cap. 40)</option>
              </select>
            </div>
            <div className="fg"><div className="lbl">View</div>
              <div className="tgl-group">
                <button className="tgl-btn tgl-active" onClick={() => showToast('Week view', 'info')}><i className="lni lni-calendar"></i> Week</button>
                <button className="tgl-btn" onClick={() => showToast('List view', 'info')}><i className="lni lni-clipboard"></i> List</button>
              </div>
            </div>
          </div>
        </div>

        <div id="tt-conflict-banner" className="danger-box hidden mb-[14px]">
          <i className="lni lni-volume-high"></i> <span id="tt-conflict-msg">Conflict detected — entry blocked.</span>
        </div>

        <div className="card" id="tt-week-view">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-calendar"></i></span> Weekly Schedule — <span id="tt-batch-label">BSC-IT-S26-DA</span></div>
            <div className="flex gap-2">
              <span className="badge badge-green" id="tt-status-badge"><i className="lni lni-checkmark"></i> No Conflicts</span>
              <button className="btn btn-neu btn-sm" onClick={() => openModal('add-slot-modal')}><i className="lni lni-plus"></i> Add Slot</button>
            </div>
          </div>
          <div className="info-box mb-[10px] p-[8px_12px]">
            <i className="lni lni-pointer"></i> <span className="text-xs"><strong>Drag-and-drop:</strong> Drag any slot to a new day/time cell. The system will immediately check for faculty and room clashes before confirming the move. Click any empty cell to add a new slot.</span>
          </div>
          <div className="overflow-x-auto">
            <div className="tt-grid" id="tt-grid-container"></div>
          </div>
          <div className="mt-[14px] flex gap-2 flex-wrap items-center">
            <span className="text-[11px] text-g500 font-semibold">Legend:</span>
            <span className="bg-b50 border border-[var(--b200)] rounded p-[3px_8px] text-[11px]">Theory</span>
            <span className="bg-[var(--green-bg)] border border-[var(--green-bd)] rounded p-[3px_8px] text-[11px]">Practical</span>
            <span className="bg-[var(--amber-bg)] border border-[var(--amber-bd)] rounded p-[3px_8px] text-[11px]">Tutorial</span>
            <span className="bg-[var(--purple-bg)] border border-[var(--purple-bd)] rounded p-[3px_8px] text-[11px]">CBT/Lab</span>
            <span className="bg-[var(--cyan-bg)] border border-[#bae6fd] rounded p-[3px_8px] text-[11px]"><i className="lni lni-reload"></i> Combined Batch</span>
            <span className="bg-[var(--red-bg)] border border-[var(--red-bd)] rounded p-[3px_8px] text-[11px]"><i className="lni lni-checkmark-circle"></i> Conflict (blocked)</span>
          </div>
        </div>

        <div className="card hidden" id="tt-list-view">
          <div className="card-hdr"><div className="card-title"><span className="ctitle-icon"><i className="lni lni-clipboard"></i></span> List View — Schedule</div></div>
          <ScrollTable>
            <table id="tt-list-table">
              <thead><tr><th>Day</th><th>Time</th><th>Course Unit</th><th>Type</th><th>Room</th><th>Capacity</th><th>Faculty</th><th>Combined Batch?</th><th>Action</th></tr></thead>
              <tbody id="tt-list-body"></tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <TtImportModal isOpen={openModals.has('tt-import-modal')} onClose={() => closeModal('tt-import-modal')} showToast={showToast} />
      <AddSlotModal isOpen={openModals.has('add-slot-modal')} onClose={() => closeModal('add-slot-modal')} showToast={showToast} />
      <RoomMgmtModal isOpen={openModals.has('room-mgmt-modal')} onClose={() => closeModal('room-mgmt-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
