'use client'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { SearchSelect } from '@/components/SearchSelect'

export default function HallTicketPrintPage() {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Hall Ticket Print</div>
          <div className="pg-sub">Bulk print by programme / semester / term · Individual or batch print</div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 md:items-end mb-4">
          <div className="flex-1">
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Programme</label>
            <SearchSelect
                options={[
                  'BSc Computer Science',
                  'BBA',
                  'BMIT'
                ]}
                className="w-full"
              />
          </div>
          <div className="flex-1">
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Semester</label>
            <SearchSelect
                options={[
                  'Semester 1'
                ]}
                className="w-full"
              />
          </div>
          <div className="flex-1">
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Term</label>
            <SearchSelect
                options={[
                  'Term 1',
                  'Term 2'
                ]}
                className="w-full"
              />
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
