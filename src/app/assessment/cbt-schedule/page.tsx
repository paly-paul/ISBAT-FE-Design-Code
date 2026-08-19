'use client'
import { SearchSelect } from '@/components/SearchSelect'
import { TableSearch } from '@/components/TableSearch'
import DatePicker from '@/components/DatePicker'
import { Toast } from '@/components/Toast'
import { useState } from 'react'

export default function CbtSchedulePage() {
  const [startDate, setStartDate] = useState('')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{msg: string, type: string} | null>(null)

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">CBT Schedule</div>
          <div className="pg-sub">Configure class test windows · 60-minute server-timed sessions</div>
        </div>
        <div className="pg-actions">
          <button className="btn btn-primary btn-sm flex items-center gap-1.5" onClick={() => showToast('CBT Scheduled successfully')}>
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

          <div className="flex-1 min-w-[200px]">
            <label className="text-[12.5px] font-semibold text-slate-700 block mb-1.5">Start Date & Time</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <DatePicker value={startDate} onChange={setStartDate} />
              </div>
              <div className="w-[110px]">
                <input type="time" className="ctrl w-full" />
              </div>
            </div>
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
      <Toast toast={toast} />
    </div>
  )
}
