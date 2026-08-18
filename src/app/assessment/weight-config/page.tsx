'use client'
import { useState } from 'react'

export default function WeightConfigPage() {
  const [model, setModel] = useState('std')
  const [rawScore, setRawScore] = useState('')

  const raw = parseFloat(rawScore)
  const weightage = model === 'std' ? 15 : 20
  const prorated = !isNaN(raw) && raw >= 0 && raw <= 25 
    ? ((raw / 25) * weightage).toFixed(1) 
    : '—'

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Weight Configuration</div>
          <div className="pg-sub">Define assessment weightage per programme type — auto-applies 30/70 or 40/60 model</div>
        </div>
        <div className="pg-actions">
          <button className="btn btn-neu btn-sm"><i className="lni lni-download"></i> Export Config</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Selector */}
        <div className="bg-white border-[1.5px] border-slate-200 rounded-[14px] p-5 shadow-[3px_3px_8px_#c8d4e0,-3px_-3px_8px_#ffffff]">
          <div className="text-[13px] font-semibold text-slate-900 mb-4">Assessment Model Selector</div>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Programme</label>
              <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                <option>— Select Programme —</option>
                <option>BMIT – BSc Medical IT (Engineering)</option>
                <option>BSc Computer Engineering</option>
                <option>BMLT – BSc Med Lab Technology</option>
                <option>BSc Computer Science</option>
                <option>BBA – Business Administration</option>
                <option>BSc Information Technology</option>
                <option>MSc Computer Science</option>
              </select>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Session</label>
                <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                  <option>2024/25 Semester 1</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Course Unit</label>
                <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                  <option>CSE 1212 - Data Structures</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Configured Programmes List */}
        <div className="bg-white border-[1.5px] border-slate-200 rounded-[14px] p-5 shadow-[3px_3px_8px_#c8d4e0,-3px_-3px_8px_#ffffff]">
          <div className="text-[13px] font-semibold text-slate-900 mb-4">Configured Programmes</div>
          
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse" style={{ fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th className="font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200" style={{ padding: '10px 8px', fontSize: '10px' }}>PROGRAMME</th>
                  <th className="font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200" style={{ padding: '10px 8px', fontSize: '10px' }}>MODEL</th>
                  <th className="font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 text-center" style={{ padding: '10px 8px', fontSize: '10px' }}>CW</th>
                  <th className="font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 text-center" style={{ padding: '10px 8px', fontSize: '10px' }}>CBT</th>
                  <th className="font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 text-center" style={{ padding: '10px 8px', fontSize: '10px' }}>UE</th>
                  <th className="font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 text-center" style={{ padding: '10px 8px', fontSize: '10px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="border-b border-slate-200 text-slate-700" style={{ padding: '10px 8px' }}>
                    <div style={{ minWidth: '100px', whiteSpace: 'normal', lineHeight: '1.3' }}>BSc Computer Science</div>
                  </td>
                  <td className="border-b border-slate-200 text-slate-700" style={{ padding: '10px 8px' }}>Standard</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>15m</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>15m</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>70m</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}><span className="badge badge-green">Active</span></td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="border-b border-slate-200 text-slate-700" style={{ padding: '10px 8px' }}>BBA</td>
                  <td className="border-b border-slate-200 text-slate-700" style={{ padding: '10px 8px' }}>Standard</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>15m</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>15m</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>70m</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}><span className="badge badge-green">Active</span></td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="border-b border-slate-200 text-slate-700" style={{ padding: '10px 8px' }}>BMIT</td>
                  <td className="border-b border-slate-200 text-slate-700" style={{ padding: '10px 8px' }}>Engineering</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>20m</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>20m</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>60m</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}><span className="badge badge-green">Active</span></td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="border-b border-slate-200 text-slate-700" style={{ padding: '10px 8px' }}>BMLT</td>
                  <td className="border-b border-slate-200 text-slate-700" style={{ padding: '10px 8px' }}>Engineering</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>20m</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>20m</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>60m</td>
                  <td className="border-b border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}><span className="badge badge-green">Active</span></td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="border-b-0 border-slate-200 text-slate-700" style={{ padding: '10px 8px' }}>
                    <div style={{ minWidth: '100px', whiteSpace: 'normal', lineHeight: '1.3' }}>MSc Computer Science</div>
                  </td>
                  <td className="border-b-0 border-slate-200 text-slate-700" style={{ padding: '10px 8px' }}>Standard</td>
                  <td className="border-b-0 border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>15m</td>
                  <td className="border-b-0 border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>15m</td>
                  <td className="border-b-0 border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}>70m</td>
                  <td className="border-b-0 border-slate-200 text-slate-700 text-center" style={{ padding: '10px 8px' }}><span className="badge badge-green">Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Proration Calculator */}
      <div className="bg-white border-[1.5px] border-slate-200 rounded-[14px] p-5 shadow-[3px_3px_8px_#c8d4e0,-3px_-3px_8px_#ffffff]">
        <div className="text-[13px] font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <span className="text-[16px]">📐</span> Live Proration Calculator
        </div>
        
        <div className="text-[13px] text-slate-500 mb-4">
          Enter raw scores to see prorated values instantly. All coursework is issued universally out of 25 marks.
        </div>
        
        <div className="flex items-end gap-4 flex-wrap">
          <div style={{ maxWidth: 160, flex: 1 }}>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Model</label>
            <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }} value={model} onChange={e => setModel(e.target.value)}>
              <option value="std">Standard (15m)</option>
              <option value="eng">Engineering (20m)</option>
            </select>
          </div>
          <div style={{ maxWidth: 120, flex: 1 }}>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Raw Score (/25)</label>
            <input type="number" className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-md text-[13px] text-slate-900 bg-white focus:outline-none focus:border-purple-600" placeholder="0–25" max={25} min={0} value={rawScore} onChange={e => setRawScore(e.target.value)} />
          </div>
          <div style={{ maxWidth: 140, flex: 1 }}>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Prorated Mark</label>
            <div style={{ padding: '7px 12px', background: '#eef2ff', border: '1px solid #c4b5fd', borderRadius: '8px', fontSize: '18px', fontWeight: 700, color: '#4c1d95', textAlign: 'center' }}>
              {prorated}
            </div>
          </div>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Formula</label>
            <div style={{ padding: '8px 12px', background: '#f0f4f8', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
              (raw / 25) × weightage
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
