'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'

const PIPELINE = [
  { label: 'App. Payment',  status: 'done',   note: '23 paid' },
  { label: 'App. Filing',   status: 'done',   note: '20 filed' },
  { label: 'Vetting',       status: 'active', note: '5 pending' },
  { label: 'Reg. Payment',  status: '',       note: '$250 check' },
  { label: 'Registration',  status: '',       note: "Registrar's Desk" },
  { label: 'Active Student', status: '',      note: 'T_Student' },
]

const RECENT_APPS = [
  { ref: 'ADM-26-0023', name: 'Aisha Nakamya',   src: 'Direct',  prog: 'BSCS',  type: 'Full-time', fee: 'Paid',    stage: 'Vetting' },
  { ref: 'ADM-26-0022', name: 'Brian Ochieng',    src: 'CRM',     prog: 'BBA',   type: 'Full-time', fee: 'Paid',    stage: 'Filing' },
  { ref: 'ADM-26-0021', name: 'Clara Mbabazi',    src: 'Online',  prog: 'BSIT',  type: 'Weekend',   fee: 'Paid',    stage: 'Vetting' },
  { ref: 'ADM-26-0020', name: 'David Ssempijja',  src: 'ODel',    prog: 'MBA',   type: 'ODL',       fee: 'Pending', stage: 'Payment' },
  { ref: 'ADM-26-0019', name: 'Esther Namutebi',  src: 'Direct',  prog: 'BSCS',  type: 'Full-time', fee: 'Paid',    stage: 'Admitted' },
]

const VETTING_QUEUE = [
  { name: 'Aisha Nakamya',  prog: 'BSCS', time: '2 hrs ago' },
  { name: 'Clara Mbabazi',  prog: 'BSIT', time: '3 hrs ago' },
  { name: 'James Okello',   prog: 'BBA',  time: '5 hrs ago' },
  { name: 'Fatuma Ssali',   prog: 'BSCS', time: '1 day ago' },
  { name: 'George Mukasa',  prog: 'MBA',  time: '1 day ago' },
]

const READY_REG = [
  { name: 'Esther Namutebi', prog: 'BSCS', time: 'Today' },
  { name: 'Hassan Kato',     prog: 'BBA',  time: 'Yesterday' },
  { name: 'Irene Atim',      prog: 'BSIT', time: '2 days ago' },
]

const DONUT_DATA = [
  { label: 'Direct', value: 9, pct: 39, color: '#2d448f' },
  { label: 'CRM',    value: 6, pct: 26, color: '#3b82f6' },
  { label: 'ODel',   value: 4, pct: 17, color: '#d97706' },
  { label: 'Online', value: 4, pct: 17, color: '#059669' },
]

function donutSegments() {
  const total = DONUT_DATA.reduce((s, d) => s + d.value, 0)
  const R = 45, C = 2 * Math.PI * R
  let offset = 0
  return DONUT_DATA.map(d => {
    const len = (d.value / total) * C
    const gap = 2
    const seg = { ...d, dashArray: `${len - gap} ${C - len + gap}`, dashOffset: -offset }
    offset += len
    return seg
  })
}

function ConvBar({ from, to, pct, level }: { from: string; to: string; pct: number; level: string }) {
  const color = level === 'high' ? 'text-clr-green' : 'text-clr-red'
  return (
    <div className="conv-item">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-g600">{from} → {to}</span>
        <span className={`text-xs font-semibold ${color}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-g100 overflow-hidden">
        <svg className="h-2 w-full" preserveAspectRatio="none">
          <rect x="0" y="0" width={`${pct}%`} height="100%" rx="4"
            className={level === 'high' ? 'fill-clr-green' : 'fill-clr-red'} />
        </svg>
      </div>
    </div>
  )
}

function stageBadge(stage: string) {
  const map: Record<string, string> = { Vetting: 'badge-amber', Filing: 'badge-blue', Payment: 'badge-red', Admitted: 'badge-green' }
  return map[stage] || 'badge-grey'
}

function srcBadge(src: string) {
  const map: Record<string, string> = { Direct: 'badge-blue', CRM: 'badge-purple', Online: 'badge-green', ODel: 'badge-amber' }
  return map[src] || 'badge-grey'
}

export default function DashboardPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const segments = donutSegments()

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  return (
    <div id="page-dashboard">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Admission Dashboard</h1>
          <p className="text-sm text-g500 mt-0.5">Spring 2026 (20261) · Real-time overview of the admission pipeline</p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/admission/payment')}>
          <i className="lni lni-plus" /> New Application
        </button>
      </div>

      <div className="pipeline mb-6">
        {PIPELINE.map((step, i) => (
          <div key={step.label} className={`pip-step ${step.status}`}>
            <div className="pip-circle">{i + 1}</div>
            <span className="text-xs font-medium mt-1">{step.label}</span>
            <span className="text-[10px] text-g400 mt-0.5">{step.note}</span>
            {i < PIPELINE.length - 1 && <div className={`pip-line ${step.status === 'done' ? 'done' : ''}`} />}
          </div>
        ))}
      </div>

      <div className="stats-row mb-6">
        <div className="stat-card">
          <span className="text-sm text-g500">Total Applicants</span>
          <span className="text-2xl font-bold text-g900">23</span>
          <span className="text-xs text-clr-green">↑ 18% vs last intake</span>
        </div>
        <div className="stat-card">
          <span className="text-sm text-g500">Awaiting Vetting</span>
          <span className="text-2xl font-bold text-clr-amber">5</span>
          <span className="text-xs text-clr-amber">Needs attention</span>
        </div>
        <div className="stat-card">
          <span className="text-sm text-g500">Provisionally Admitted</span>
          <span className="text-2xl font-bold text-clr-green">14</span>
          <span className="text-xs text-clr-green">↑ 6 this week</span>
        </div>
        <div className="stat-card">
          <span className="text-sm text-g500">Fully Registered</span>
          <span className="text-2xl font-bold text-clr-gold">4</span>
          <span className="text-xs text-clr-gold">↑ 2 this week</span>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-g900">Admission Progress — Spring 2026 (20261)</h2>
            <p className="text-xs text-g400 mt-0.5">Pipeline analytics and source breakdown</p>
          </div>
          <span className="badge-green text-xs px-2 py-0.5 rounded-full font-medium">Live</span>
        </div>
        <div className="adm-chart-grid">
          <div className="adm-chart-col">
            <h3 className="adm-chart-title">Application Source Mix</h3>
            <p className="adm-chart-sub">Where applicants are coming from</p>
            <div className="donut-wrap">
              <div className="donut-svg-wrap">
                <svg viewBox="0 0 120 120" className="donut">
                  {segments.map(seg => (
                    <circle key={seg.label} className="donut-seg" cx="60" cy="60" r="45" fill="none"
                      stroke={seg.color} strokeWidth="18" strokeDasharray={seg.dashArray} strokeDashoffset={seg.dashOffset} />
                  ))}
                </svg>
                <span className="donut-center-num">23</span>
                <span className="donut-center-lbl">Total</span>
              </div>
              <div className="donut-legend">
                {DONUT_DATA.map(d => (
                  <div key={d.label} className="donut-legend-item">
                    <span className="donut-swatch"><svg width="10" height="10"><circle cx="5" cy="5" r="5" fill={d.color} /></svg></span>
                    <span className="donut-legend-lbl">{d.label}</span>
                    <span className="donut-legend-val">{d.value}</span>
                    <span className="donut-legend-pct">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="donut-metrics">
              <div className="donut-metric"><span className="donut-metric-lbl">Counsellor-driven</span><span className="donut-metric-val">65%</span><span className="donut-metric-sub">Direct + CRM</span></div>
              <div className="donut-metric"><span className="donut-metric-lbl">Self-service</span><span className="donut-metric-val">35%</span><span className="donut-metric-sub">Online + ODel</span></div>
              <div className="donut-metric"><span className="donut-metric-lbl">Top source</span><span className="donut-metric-val">Direct</span><span className="donut-metric-sub">9 applicants</span></div>
            </div>
          </div>
          <div className="adm-chart-col">
            <h3 className="adm-chart-title">Stage-to-Stage Conversion</h3>
            <p className="adm-chart-sub">How applicants move through the pipeline</p>
            <div className="conv-list">
              <ConvBar from="Enquiry" to="App. Payment" pct={38} level="low" />
              <ConvBar from="App. Payment" to="Filing" pct={87} level="high" />
              <ConvBar from="Filing" to="Vetting" pct={90} level="high" />
              <ConvBar from="Vetting" to="Reg. Payment" pct={89} level="high" />
              <ConvBar from="Reg. Payment" to="Active Student" pct={88} level="high" />
            </div>
            <div className="mt-4 p-3 rounded-lg bg-g50 border border-g200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-g500">Overall Enquiry → Active Student</span>
                <span className="text-sm font-bold text-g900">23%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-base font-semibold text-g900 mb-4">Recent Applications</h2>
        <ScrollTable>
          <table>
            <thead>
              <tr className="border-b border-g200 text-left text-xs text-g500 uppercase tracking-wider">
                <th style={{ width: 48 }}></th>
                <th className="pb-2 pr-4 font-medium">Ref No.</th>
                <th className="pb-2 pr-4 font-medium">Applicant Name</th>
                <th className="pb-2 pr-4 font-medium">Source</th>
                <th className="pb-2 pr-4 font-medium">Programme</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 pr-4 font-medium">App. Fee</th>
                <th className="pb-2 pr-4 font-medium">Stage</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_APPS.map(app => (
                <tr key={app.ref} className="border-b border-g100 hover:bg-g50 transition-colors">
                  <td><ActionMenu><button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/applicants')}><i className="lni lni-eye" /> View</button></ActionMenu></td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-b600">{app.ref}</td>
                  <td className="py-2.5 pr-4 text-g800 font-medium">{app.name}</td>
                  <td className="py-2.5 pr-4"><span className={`badge ${srcBadge(app.src)}`}>{app.src}</span></td>
                  <td className="py-2.5 pr-4 text-g700">{app.prog}</td>
                  <td className="py-2.5 pr-4 text-g600">{app.type}</td>
                  <td className="py-2.5 pr-4"><span className={app.fee === 'Paid' ? 'text-clr-green text-xs font-medium' : 'text-clr-red text-xs font-medium'}>{app.fee}</span></td>
                  <td className="py-2.5 pr-4"><span className={`badge ${stageBadge(app.stage)}`}>{app.stage}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      </div>

      <div className="g2">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-g900">Vetting Queue (5)</h2>
            <button className="text-xs text-b500 hover:text-b700 font-medium" onClick={() => router.push('/admission/vetting')}>Open →</button>
          </div>
          <div className="timeline">
            {VETTING_QUEUE.map(item => (
              <div key={item.name} className="tl-item">
                <div className="tl-dot pending" />
                <div className="tl-content">
                  <span className="text-sm font-medium text-g800">{item.name}</span>
                  <span className="text-xs text-g400">{item.prog} · {item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-g900">Ready to Register (3)</h2>
            <button className="text-xs text-b500 hover:text-b700 font-medium" onClick={() => router.push('/admission/registration')}>Open →</button>
          </div>
          <div className="timeline">
            {READY_REG.map(item => (
              <div key={item.name} className="tl-item">
                <div className="tl-dot done" />
                <div className="tl-content">
                  <span className="text-sm font-medium text-g800">{item.name}</span>
                  <span className="text-xs text-g400">{item.prog} · {item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  )
}
