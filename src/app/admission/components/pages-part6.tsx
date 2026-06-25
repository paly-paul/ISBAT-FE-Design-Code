'use client'
import { PageProps } from '../page'

/* ── mock data ──────────────────────────────────────────────── */
const ENQUIRY_ROWS = [
  { ref: 'ENQ-26-0047', name: 'Kamya Brian',    phone: '+256 701 234 567', email: 'bkamya@gmail.com',    prog: 'BSCS',  channel: 'Walk-in',   date: '2026-06-22', status: 'Pending' },
  { ref: 'ENQ-26-0046', name: 'Nambi Doreen',   phone: '+256 772 345 678', email: 'dnambi@yahoo.com',    prog: 'BBA',   channel: 'Phone',     date: '2026-06-21', status: 'Converted' },
  { ref: 'ENQ-26-0045', name: 'Waiswa Patrick', phone: '+256 780 456 789', email: 'pwaiswa@outlook.com', prog: 'BSIT',  channel: 'Online',    date: '2026-06-20', status: 'Pending' },
  { ref: 'ENQ-26-0044', name: 'Atim Connie',    phone: '+256 704 567 890', email: 'catim@gmail.com',     prog: 'MBA',   channel: 'Kiosk',     date: '2026-06-19', status: 'Converted' },
  { ref: 'ENQ-26-0043', name: 'Ssali Brian',    phone: '+256 756 678 901', email: 'bssali@gmail.com',    prog: 'BSCS',  channel: 'Walk-in',   date: '2026-06-18', status: 'Pending' },
]

const STATS = [
  { label: 'Total Enquiries', value: 47, icon: 'lni-users',         color: 'text-b500' },
  { label: 'Converted',       value: 23, icon: 'lni-checkmark',     color: 'text-clr-green' },
  { label: 'Pending Follow-up', value: 11, icon: 'lni-timer',       color: 'text-clr-amber' },
  { label: 'ODL Specific',    value: 8,  icon: 'lni-world',         color: 'text-clr-purple' },
]

/* ── shared form template ───────────────────────────────────── */
function EnquiryFormTemplate({
  title, subtitle, backTarget, nav, showToast,
}: {
  title: string
  subtitle: string
  backTarget: string
  nav: (id: string) => void
  showToast: (msg: string, type?: string) => void
}) {
  return (
    <div id="page-enquiry-form">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">{title}</h1>
          <p className="text-sm text-g500 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => nav(backTarget)}>
            <i className="lni lni-arrow-left" /> Enquiry List
          </button>
        </div>
      </div>

      <div className="card max-w-3xl">
        <div className="g2">
          <label className="lbl">First Name <span className="text-clr-red">*</span></label>
          <input className="ctrl" placeholder="e.g. Brian" />
        </div>
        <div className="g2">
          <label className="lbl">Last Name <span className="text-clr-red">*</span></label>
          <input className="ctrl" placeholder="e.g. Kamya" />
        </div>
        <div className="g2">
          <label className="lbl">Phone <span className="text-clr-red">*</span></label>
          <input className="ctrl" placeholder="+256 7XX XXX XXX" />
        </div>
        <div className="g2">
          <label className="lbl">Email</label>
          <input className="ctrl" type="email" placeholder="candidate@example.com" />
        </div>
        <div className="g2">
          <label className="lbl">Enquiry Channel</label>
          <select className="ctrl">
            <option value="">— select —</option>
            <option>Walk-in</option>
            <option>Phone</option>
            <option>Online</option>
            <option>Kiosk</option>
          </select>
        </div>
        <div className="g2">
          <label className="lbl">Programme Interest</label>
          <select className="ctrl">
            <option value="">— select —</option>
            <option>BSCS — Computer Science</option>
            <option>BBA — Business Administration</option>
            <option>BSIT — Information Technology</option>
            <option>MBA — Master of Business Admin</option>
          </select>
        </div>
        <div className="g2">
          <label className="lbl">Preferred Intake</label>
          <select className="ctrl">
            <option value="">— select —</option>
            <option>Spring 2026</option>
            <option>Fall 2026</option>
            <option>Spring 2027</option>
          </select>
        </div>
        <div className="g2">
          <label className="lbl">Preferred Study Mode</label>
          <select className="ctrl">
            <option value="">— select —</option>
            <option>Full-time</option>
            <option>Weekend</option>
            <option>Evening</option>
            <option>ODL</option>
          </select>
        </div>
        <div className="fg">
          <label className="lbl">Enquiry Notes</label>
          <textarea className="ctrl" rows={3} placeholder="Additional notes about the enquiry..." />
        </div>

        <div className="sec-divider" />

        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => nav('enquiry-list')}>Cancel</button>
          <button className="btn btn-primary" onClick={() => showToast('Enquiry saved successfully.', 'success')}>
            Save Enquiry
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── channel badge helper ───────────────────────────────────── */
function channelBadge(ch: string) {
  const map: Record<string, string> = {
    'Walk-in': 'badge-blue',
    Phone:     'badge-purple',
    Online:    'badge-green',
    Kiosk:     'badge-amber',
  }
  return map[ch] || 'badge-grey'
}

/* ── EnquiryFormPage ────────────────────────────────────────── */
export function EnquiryFormPage({ nav, showToast }: PageProps) {
  return (
    <EnquiryFormTemplate
      title="New Enquiry"
      subtitle="Information Desk — capture walk-in, phone & online enquiries"
      backTarget="enquiry-list"
      nav={nav}
      showToast={showToast}
    />
  )
}

/* ── EnquiryListPage ────────────────────────────────────────── */
export function EnquiryListPage({ nav, openModal }: PageProps) {
  return (
    <div id="page-enquiry-list">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Enquiry List</h1>
          <p className="text-sm text-g500 mt-0.5">
            All enquiries across channels — walk-in, phone, online & kiosk
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => nav('dashboard')}>
            <i className="lni lni-arrow-left" /> Back
          </button>
          <button className="btn btn-primary" onClick={() => openModal('enquiry-form-modal')}>
            <i className="lni lni-plus" /> New Enquiry
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        {STATS.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <i className={`lni ${s.icon} ${s.color}`} />
              <span className="text-sm text-g500">{s.label}</span>
            </div>
            <p className="text-2xl font-semibold text-g900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-g800">Enquiry Register — 2026</h2>
          <div className="flex gap-2">
            <input className="ctrl w-52" placeholder="Search enquiries..." />
            <select className="ctrl w-36">
              <option value="">All Channels</option>
              <option>Walk-in</option>
              <option>Phone</option>
              <option>Online</option>
              <option>Kiosk</option>
            </select>
            <button className="btn btn-ghost">
              <i className="lni lni-download" /> Export
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Enq. Ref</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Programme Interest</th>
                <th>Channel</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ENQUIRY_ROWS.map((r) => (
                <tr key={r.ref}>
                  <td className="font-mono text-sm">{r.ref}</td>
                  <td>{r.name}</td>
                  <td className="text-sm text-g600">{r.phone}</td>
                  <td className="text-sm text-g600">{r.email}</td>
                  <td>{r.prog}</td>
                  <td><span className={channelBadge(r.channel)}>{r.channel}</span></td>
                  <td className="text-sm text-g600">{r.date}</td>
                  <td>
                    <span className={r.status === 'Converted' ? 'badge-green' : 'badge-amber'}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'Converted' ? (
                      <span className="badge-green">Done</span>
                    ) : (
                      <button className="btn btn-xs btn-primary" onClick={() => nav('payment')}>
                        Convert
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ── OnlineEnquiryPage ──────────────────────────────────────── */
export function OnlineEnquiryPage({ nav, showToast }: PageProps) {
  return (
    <EnquiryFormTemplate
      title="Online Enquiry Form"
      subtitle="Captured via the public website portal — auto-submitted by the candidate"
      backTarget="enquiry-list"
      nav={nav}
      showToast={showToast}
    />
  )
}

/* ── KioskEnquiryPage ───────────────────────────────────────── */
export function KioskEnquiryPage({ nav, showToast }: PageProps) {
  return (
    <EnquiryFormTemplate
      title="Self-Service Kiosk Enquiry"
      subtitle="Captured at the campus self-service kiosk — candidate-entered"
      backTarget="enquiry-list"
      nav={nav}
      showToast={showToast}
    />
  )
}

/* ── OnDeskEnquiryPage ──────────────────────────────────────── */
export function OnDeskEnquiryPage({ nav, showToast }: PageProps) {
  return (
    <EnquiryFormTemplate
      title="On-Desk Enquiry Form"
      subtitle="Information Desk — captured by staff during walk-in / phone conversation"
      backTarget="enquiry-list"
      nav={nav}
      showToast={showToast}
    />
  )
}
