'use client'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'

export default function HallTicketPrintPage() {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Hall Ticket Print</div>
          <div className="pg-sub">Bulk print by programme / semester / term · Individual or batch print</div>
        </div>
      </div>

      <div className="bg-white border-[1.5px] border-slate-200 rounded-[14px] shadow-[3px_3px_8px_#c8d4e0,-3px_-3px_8px_#ffffff] p-5 mb-5">
        <div className="flex gap-4 items-end mb-4">
          <div className="flex-1">
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Programme</label>
            <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
              <option>BSc Computer Science</option>
              <option>BBA</option>
              <option>BMIT</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Semester</label>
            <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
              <option>Semester 1</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Term</label>
            <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
              <option>Term 1</option>
              <option>Term 2</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium text-[13px] px-5 py-2.5 rounded-md transition-colors shadow-sm flex items-center gap-2 h-[38.5px]">
              <i className="lni lni-printer"></i> Print All (2 Ready)
            </button>
          </div>
        </div>

        <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-md p-3 flex gap-3 text-[12.5px] text-[#3b82f6] items-start">
          <div className="mt-0.5 text-[#2563eb]"><i className="lni lni-information"></i></div>
          <div>Only students with issued hall tickets appear in the print batch. Hall ticket includes: course schedule, invigilator sign-off space, and notes section.</div>
        </div>
      </div>

      <div className="card">
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Reg. No.</th>
                <th>Student</th>
                <th>Issued</th>
                <th>Subjects</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-printer"></i> Preview & Print</button>
                  </ActionMenu>
                </td>
                <td><span className="font-bold text-[var(--blue)] font-mono">BCS/2024/0017</span></td>
                <td className="text-slate-800">Emmanuel Okello</td>
                <td className="text-slate-500 font-mono text-[12px]">08 Nov</td>
                <td className="font-semibold text-slate-700">3</td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-printer"></i> Preview & Print</button>
                  </ActionMenu>
                </td>
                <td><span className="font-bold text-[var(--blue)] font-mono">BCS/2024/0058</span></td>
                <td className="text-slate-800">David Ssemwogerere</td>
                <td className="text-slate-500 font-mono text-[12px]">08 Nov</td>
                <td className="font-semibold text-slate-700">3</td>
              </tr>
            </tbody>
          </table>
        </ScrollTable>
      </div>

    </div>
  )
}
