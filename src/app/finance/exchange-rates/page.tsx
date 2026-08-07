'use client'
import { useMemo, useState } from 'react'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import DatePicker from '@/components/DatePicker'

interface RateEntry { date: string; ugx: number; kes: number; setBy: string }

const YESTERDAY_UGX = 3720
const YESTERDAY_KES = 131.20

const INITIAL_HISTORY: RateEntry[] = [
  { date: '09/05/2026', ugx: 3750, kes: 130.50, setBy: 'Accounts Officer' },
  { date: '08/05/2026', ugx: 3720, kes: 131.20, setBy: 'Accounts Officer' },
  { date: '07/05/2026', ugx: 3745, kes: 130.80, setBy: 'Finance Admin' },
  { date: '06/05/2026', ugx: 3710, kes: 131.50, setBy: 'Accounts Officer' },
  { date: '05/05/2026', ugx: 3700, kes: 132.00, setBy: 'Accounts Officer' },
  { date: '04/05/2026', ugx: 3695, kes: 131.90, setBy: 'Finance Admin' },
  { date: '03/05/2026', ugx: 3680, kes: 132.20, setBy: 'Accounts Officer' },
]

// yyyy-mm-dd (input value) -> dd/MM/yyyy (table display), same convention
// used for the rate history rows above.
function toTableDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function Delta({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous
  const pct = previous ? (diff / previous) * 100 : 0
  if (Math.abs(diff) < 0.005) return <div className="text-muted" style={{ fontSize: 11 }}>No change</div>
  const up = diff > 0
  return (
    <div className={up ? 'text-green' : 'text-red'} style={{ fontSize: 11 }}>
      {up ? '↑' : '↓'} {up ? '+' : ''}{diff.toFixed(2)} ({up ? '+' : ''}{pct.toFixed(1)}%)
    </div>
  )
}

export default function Page() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const [rateDate, setRateDate] = useState('2026-05-09')
  const [ugxRate, setUgxRate] = useState('3750')
  const [kesRate, setKesRate] = useState('130.50')
  const [history, setHistory] = useState<RateEntry[]>(INITIAL_HISTORY)

  const ugxNum = parseFloat(ugxRate) || 0
  const kesNum = parseFloat(kesRate) || 0

  const sortedHistory = useMemo(() => [...history].sort((a, b) => b.date.localeCompare(a.date)), [history])

  function handleFetch() {
    showToast('Rates fetched from Bank of Uganda feed.', 'success')
  }

  function handleSave() {
    if (!rateDate) { showToast('Rate date is required.', 'warn'); return }
    if (!ugxRate || ugxNum <= 0) { showToast('Enter a valid UGX rate.', 'warn'); return }
    if (!kesRate || kesNum <= 0) { showToast('Enter a valid KES rate.', 'warn'); return }

    const displayDate = toTableDate(rateDate)
    setHistory(prev => {
      const existing = prev.find(r => r.date === displayDate)
      if (existing) {
        return prev.map(r => r.date === displayDate ? { ...r, ugx: ugxNum, kes: kesNum, setBy: 'You' } : r)
      }
      return [{ date: displayDate, ugx: ugxNum, kes: kesNum, setBy: 'You' }, ...prev]
    })
    showToast("Today's exchange rates saved.", 'success')
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Exchange Rate Management</div>
            <div className="pg-sub">Set daily rates for USD / UGX / KES · Applied to all pending conversions</div>
          </div>
          <button className="btn btn-primary" onClick={handleSave}><i className="lni lni-save"></i> Save Today&apos;s Rates</button>
        </div>

        <div className="g2">
          <div className="card">
            <div className="card-hdr">
              <div className="card-title"><span className="ctitle-icon"><i className="lni lni-world"></i></span> Set Today&apos;s Exchange Rates</div>
              <span className="badge badge-blue"><span className="bdot"></span>Live</span>
            </div>

            <div className="fg mb-[14px]">
              <div className="lbl">Rate Date <span className="req">*</span></div>
              <DatePicker value={rateDate} onChange={setRateDate} />
            </div>

            <div className="sec-divider">Currency Rates (Base: USD)</div>

            <div className="flex flex-col gap-[14px]">
              <div className="flex items-center gap-3 flex-wrap p-[14px] border border-[1.5px] border-g200 rounded-[var(--rsm)] bg-surface">
                <span className="badge badge-gold" style={{ fontSize: 14, padding: '8px 12px' }}>USD</span>
                <div className="flex-1" style={{ minWidth: 160 }}>
                  <div className="lbl">Base Currency (Fixed)</div>
                  <div className="font-mono font-extrabold text-blue" style={{ fontSize: 22 }}>1.000000</div>
                </div>
                <div className="text-g400" style={{ fontSize: 11 }}>Reference base</div>
              </div>

              <div className="flex items-center gap-3 flex-wrap p-[14px] border border-[1.5px] border-b200 rounded-[var(--rsm)] bg-b50">
                <span className="badge badge-gold" style={{ fontSize: 14, padding: '8px 12px' }}>UGX</span>
                <div className="flex-1" style={{ minWidth: 160 }}>
                  <div className="lbl">Uganda Shillings per 1 USD <span className="req">*</span></div>
                  <input className="rate-big-input" type="number" step="0.01" value={ugxRate} onChange={e => setUgxRate(e.target.value)} />
                </div>
                <div className="text-right">
                  <div className="text-g400" style={{ fontSize: 10.5 }}>Yesterday</div>
                  <div className="font-bold text-g500">{YESTERDAY_UGX.toLocaleString()}</div>
                  <Delta current={ugxNum} previous={YESTERDAY_UGX} />
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap p-[14px] border border-[1.5px] border-g200 rounded-[var(--rsm)] bg-surface">
                <span className="badge badge-gold" style={{ fontSize: 14, padding: '8px 12px' }}>KES</span>
                <div className="flex-1" style={{ minWidth: 160 }}>
                  <div className="lbl">Kenya Shillings per 1 USD <span className="req">*</span></div>
                  <input className="rate-big-input" type="number" step="0.01" value={kesRate} onChange={e => setKesRate(e.target.value)} />
                </div>
                <div className="text-right">
                  <div className="text-g400" style={{ fontSize: 10.5 }}>Yesterday</div>
                  <div className="font-bold text-g500">{YESTERDAY_KES.toFixed(2)}</div>
                  <Delta current={kesNum} previous={YESTERDAY_KES} />
                </div>
              </div>
            </div>

            <div className="flex gap-[10px] mt-4 flex-wrap">
              <button className="btn btn-neu flex-1 justify-center" onClick={handleFetch}>
                <i className="lni lni-cloud-download"></i> Fetch from Provider
              </button>
              <button className="btn btn-primary btn-lg flex-1 justify-center" onClick={handleSave}>
                <i className="lni lni-save"></i> Save Rates
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-hdr">
              <div className="card-title"><span className="ctitle-icon"><i className="lni lni-bar-chart"></i></span> Rate History — Last 7 Days</div>
            </div>
            <ScrollTable>
              <table>
                <thead><tr><th>Date</th><th>UGX / USD</th><th>KES / USD</th><th>Set By</th></tr></thead>
                <tbody>
                  {sortedHistory.map((r, i) => (
                    <tr key={r.date}>
                      <td className={i === 0 ? 'font-bold' : ''}>{r.date}</td>
                      <td className={i === 0 ? 'text-green font-bold' : ''}>{r.ugx.toLocaleString()}</td>
                      <td>{r.kes.toFixed(2)}</td>
                      <td className="text-muted">{r.setBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
          </div>
        </div>
      </div>
      <Toast toast={toast} />
    </>
  )
}
