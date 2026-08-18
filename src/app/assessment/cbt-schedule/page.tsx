'use client'

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

      <div className="bg-white border-[1.5px] border-slate-200 rounded-[14px] shadow-[3px_3px_8px_#c8d4e0,-3px_-3px_8px_#ffffff] p-6 mb-6">
        
        <div className="flex gap-5 mb-5">
          <div className="flex-[1.5]">
            <label className="text-[12.5px] font-semibold text-slate-700 block mb-1.5">Subject</label>
            <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none pr-8" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
              <option>CSE 1212 – Data Structures</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="text-[12.5px] font-semibold text-slate-700 block mb-1.5">Duration (mins)</label>
            <input type="number" defaultValue="60" className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600" />
          </div>

          <div className="flex-1">
            <label className="text-[12.5px] font-semibold text-slate-700 block mb-1.5">Start Date & Time</label>
            <input type="datetime-local" className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600" />
          </div>

          <div className="flex-1">
            <label className="text-[12.5px] font-semibold text-slate-700 block mb-1.5">Publish Status</label>
            <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none pr-8" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
              <option>Published to Student</option>
              <option>Hidden</option>
            </select>
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
