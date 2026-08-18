'use client'

export default function QuestionBankUploadPage() {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Question Bank Upload</div>
          <div className="pg-sub">Upload descriptive questions (DQ) via Excel template · Min. 4 questions required per subject</div>
        </div>
        <div className="pg-actions">
          <button className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-[var(--neu-sm)] hover:bg-slate-50 transition-colors flex items-center gap-1.5">
            <i className="lni lni-download"></i> Download Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Side: Upload Form */}
        <div className="bg-white border-[1.5px] border-slate-200 rounded-[14px] shadow-[3px_3px_8px_#c8d4e0,-3px_-3px_8px_#ffffff] p-5">
          <div className="text-[13.5px] font-bold text-slate-900 mb-4">Upload Questions</div>
          
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Subject</label>
              <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                <option>CSE 1212 – Data Structures</option>
                <option>CSE 1301 – Algorithms</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Assessment Type</label>
              <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                <option>Coursework (DQ)</option>
                <option>Class Test (MCQ/SA)</option>
                <option>University Examination</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Term</label>
              <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                <option>Term 1</option>
                <option>Term 2</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Question Type</label>
              <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                <option>DQ – Descriptive Question</option>
                <option>MCQ – Multiple Choice</option>
                <option>SA – Short Answer</option>
              </select>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-7 text-center mb-4 cursor-pointer transition-colors hover:border-purple-400 group bg-slate-50">
            <div className="text-[28px] mb-2 text-slate-800 group-hover:text-purple-600 transition-colors"><i className="lni lni-paperclip"></i></div>
            <div className="text-[13px] font-semibold text-slate-900">Drop Excel file here or click to browse</div>
            <div className="text-[11px] text-slate-500 mt-1">.xlsx format · Uses common template for all exam types</div>
          </div>

          <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-md p-3 flex gap-3 text-[12.5px] text-[#1e40af] mb-4 items-start">
            <div className="mt-0.5 text-[#2563eb]"><i className="lni lni-information"></i></div>
            <div>System validates: minimum 4 questions per upload. Questions will be randomised — 2 drawn per student.</div>
          </div>

          <button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium text-[13px] px-4 py-2 rounded-md transition-colors shadow-sm">
            Import Questions
          </button>
        </div>

        {/* Right Side: Pending Uploads & Alerts */}
        <div className="bg-white border-[1.5px] border-slate-200 rounded-[14px] shadow-[3px_3px_8px_#c8d4e0,-3px_-3px_8px_#ffffff] flex flex-col">
          <div className="p-5 flex gap-2 items-center">
            <div className="text-[13.5px] font-bold text-slate-900">Pending Uploads</div>
            <span className="badge badge-red ml-1">3 overdue</span>
          </div>
          
          <div className="border-b border-slate-100 overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap" style={{ fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200" style={{ fontSize: '10px' }}>FACULTY</th>
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200" style={{ fontSize: '10px' }}>SUBJECT</th>
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200" style={{ fontSize: '10px' }}>DEADLINE</th>
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 text-center" style={{ fontSize: '10px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-5 py-3.5 border-b border-slate-100 text-slate-700">Tom Kizito</td>
                  <td className="px-5 py-3.5 border-b border-slate-100 font-mono text-[var(--blue)] font-medium">CSE 1212</td>
                  <td className="px-5 py-3.5 border-b border-slate-100 text-red-500 font-medium text-[12px]"><span className="flex items-center gap-1">5 Nov <i className="lni lni-warning text-[10px]"></i></span></td>
                  <td className="px-5 py-3.5 border-b border-slate-100 text-center">
                    <button className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-[11px] font-semibold hover:bg-red-100 transition-colors">Remind</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 border-b border-slate-100 text-slate-700">Joseph Ayuma</td>
                  <td className="px-5 py-3.5 border-b border-slate-100 font-mono text-[var(--blue)] font-medium">BIO 2201</td>
                  <td className="px-5 py-3.5 border-b border-slate-100 text-red-500 font-medium text-[12px]"><span className="flex items-center gap-1">6 Nov <i className="lni lni-warning text-[10px]"></i></span></td>
                  <td className="px-5 py-3.5 border-b border-slate-100 text-center">
                    <button className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-[11px] font-semibold hover:bg-red-100 transition-colors">Remind</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 border-b-0 border-slate-100 text-slate-700">Mary Nakato</td>
                  <td className="px-5 py-3.5 border-b-0 border-slate-100 font-mono text-[var(--blue)] font-medium">ACC 3101</td>
                  <td className="px-5 py-3.5 border-b-0 border-slate-100 text-amber-500 font-medium text-[12px]">10 Nov</td>
                  <td className="px-5 py-3.5 border-b-0 border-slate-100 text-center">
                    <button className="bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-[11px] font-semibold hover:bg-slate-100 transition-colors shadow-sm">Remind</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-5 pt-4">
            <div className="text-[13.5px] font-bold text-slate-900 mb-3">Uploaded Questions — CSE 1212</div>
            <div className="bg-[#fef2f2] border border-[#fecaca] rounded-md p-3 flex gap-3 text-[12.5px] text-[#b91c1c] items-start">
              <div className="mt-0.5 text-[#dc2626]"><i className="lni lni-warning"></i></div>
              <div>No questions uploaded yet. CW launch is blocked until at least 4 DQ questions are available.</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
