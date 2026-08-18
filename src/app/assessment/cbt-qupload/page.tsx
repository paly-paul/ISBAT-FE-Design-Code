'use client'

export default function CbtQuestionUploadPage() {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">CBT Question Upload</div>
          <div className="pg-sub">Upload questions per section · Section A (Easy/1m) · B (Medium/2m) · C (Difficult/3m) · Total: 50 marks</div>
        </div>
        <div className="pg-actions">
          <button className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-[var(--neu-sm)] hover:bg-slate-50 transition-colors flex items-center gap-1.5">
            <i className="lni lni-download"></i> Download Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        
        {/* Section A */}
        <div className="bg-white border-[1.5px] border-slate-200 rounded-[14px] shadow-[3px_3px_8px_#c8d4e0,-3px_-3px_8px_#ffffff] p-5 border-t-[4px] border-t-[#10b981] flex flex-col justify-between">
          <div>
            <div className="text-[13.5px] font-bold text-[#059669] mb-1">Section A — Easy</div>
            <div className="text-[24px] font-bold text-slate-900 mb-2 tracking-tight">1 mark each</div>
          </div>
          <div className="text-[12px] text-slate-500 leading-snug">
            10 questions answered (mandatory) · Prepare 15–20 in bank · MCQ format
          </div>
        </div>

        {/* Section B */}
        <div className="bg-white border-[1.5px] border-slate-200 rounded-[14px] shadow-[3px_3px_8px_#c8d4e0,-3px_-3px_8px_#ffffff] p-5 border-t-[4px] border-t-[#f59e0b] flex flex-col justify-between">
          <div>
            <div className="text-[13.5px] font-bold text-[#d97706] mb-1">Section B — Medium</div>
            <div className="text-[24px] font-bold text-slate-900 mb-2 tracking-tight">2 marks each</div>
          </div>
          <div className="text-[12px] text-slate-500 leading-snug">
            Answer any 10 from bank · Short answer format
          </div>
        </div>

        {/* Section C */}
        <div className="bg-white border-[1.5px] border-slate-200 rounded-[14px] shadow-[3px_3px_8px_#c8d4e0,-3px_-3px_8px_#ffffff] p-5 border-t-[4px] border-t-[#ef4444] flex flex-col justify-between">
          <div>
            <div className="text-[13.5px] font-bold text-[#dc2626] mb-1">Section C — Difficult</div>
            <div className="text-[24px] font-bold text-slate-900 mb-2 tracking-tight">3 marks each</div>
          </div>
          <div className="text-[12px] text-slate-500 leading-snug">
            Answer any 5 from bank · Problem-solving format
          </div>
        </div>

      </div>

      <div className="bg-white border-[1.5px] border-slate-200 rounded-[14px] shadow-[3px_3px_8px_#c8d4e0,-3px_-3px_8px_#ffffff] p-6">
        
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center mb-5 cursor-pointer transition-colors hover:border-purple-400 group bg-slate-50">
          <div className="text-[32px] mb-3 text-slate-800 group-hover:text-purple-600 transition-colors"><i className="lni lni-paperclip"></i></div>
          <div className="text-[14px] font-bold text-slate-900 mb-1">Drop Excel file here · Common template for all exam types</div>
          <div className="text-[12px] text-slate-500">Specify section (A/B/C) and marks per question in the template</div>
        </div>

        <button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium text-[13px] px-5 py-2.5 rounded-md transition-colors shadow-sm">
          Import Questions
        </button>

      </div>
    </div>
  )
}
