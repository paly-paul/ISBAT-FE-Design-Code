'use client'
import { SearchSelect } from '@/components/SearchSelect'

export default function CbtSchedulePage() {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">CBT Schedule</div>
          <div className="pg-sub">Configure class test windows · 60-minute server-timed sessions</div>
        </div>
        <div className="pg-actions">
          <button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium text-[12.5px] px-4 py-2 rounded-md transition-colors shadow-sm flex items-center gap-1.5">
            + Schedule CBT
          </button>
        </div>
      </div>

      <div className="card">
        
        <div className="flex flex-col md:flex-row gap-5 mb-5">
          <div className="w-full md:w-auto" style={{ flex: 1.5 }}>
            <label className="text-[12.5px] font-semibold text-slate-700 block mb-1.5">Subject</label>
            <SearchSelect
                options={[
                  'CSE 1212 — Data Structures'
                ]}
                className="w-full"
              />
          </div>
          
          <div className="flex-1">
            <label className="text-[12.5px] font-semibold text-slate-700 block mb-1.5">Duration (mins)</label>
            <input type="number" defaultValue="60" className="ctrl w-full" />
          </div>

          <div className="flex-1">
            <label className="text-[12.5px] font-semibold text-slate-700 block mb-1.5">Start Date & Time</label>
            <input type="datetime-local" className="ctrl w-full" />
          </div>

          <div className="flex-1">
            <label className="text-[12.5px] font-semibold text-slate-700 block mb-1.5">Publish Status</label>
            <SearchSelect
                options={[
                  'Published to Student',
                  'Hidden'
                ]}
                className="w-full"
              />
          </div>
        </div>

        <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-md p-3 flex gap-3 text-[12.5px] text-[#3b82f6] items-start">
          <div className="mt-0.5 text-[#2563eb]"><i className="lni lni-information"></i></div>
          <div>Timing is controlled server-side. Balance time is saved to database on every student action (Save Next, Previous, Submit, Window Close) to handle connectivity interruptions.</div>
        </div>

      </div>
    </div>
  )
}
