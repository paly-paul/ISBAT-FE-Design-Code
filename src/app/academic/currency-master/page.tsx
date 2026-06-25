'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'
import { EmptyState } from '@/components/EmptyState'
import { NewCurrencyModal } from '@/components/modals/NewCurrencyModal'
import { EditCurrencyModal } from '@/components/modals/EditCurrencyModal'

function StatusBadge({ status }: { status: string }) {
  if (status === 'Active')
    return <span className="badge-green">{status}</span>
  return <span className="badge-grey">{status}</span>
}

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters]       = useState<Record<string, string[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => {
    function closeFilter(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('th')) setOpenFilter(null)
    }
    document.addEventListener('click', closeFilter)
    return () => document.removeEventListener('click', closeFilter)
  }, [])

  const rows = [
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh',  rate: '1.00',     status: 'Active'   },
    { code: 'USD', name: 'US Dollar',         symbol: '$',    rate: '3,720.00', status: 'Active'   },
    { code: 'EUR', name: 'Euro',              symbol: '€',    rate: '4,050.00', status: 'Active'   },
    { code: 'GBP', name: 'British Pound',     symbol: '£',    rate: '4,680.00', status: 'Active'   },
    { code: 'KES', name: 'Kenyan Shilling',   symbol: 'KSh',  rate: '28.50',    status: 'Inactive' },
  ]

  const filteredRows = rows.filter(r =>
    Object.entries(filters).every(([k, v]) => !v.length || v.includes(String((r as Record<string, unknown>)[k])))
  )

  function fth(label: string, col: string, opts: string[]) {
    return (
      <FilterTh
        label={label}
        opts={opts}
        isOpen={openFilter === col}
        activeFilter={filters[col] ?? []}
        onToggle={e => { e.stopPropagation(); setOpenFilter(p => p === col ? null : col) }}
        onSelect={vals => { setFilters(f => ({ ...f, [col]: vals })); setOpenFilter(null) }}
        onClear={() => { setFilters(f => ({ ...f, [col]: [] })); setOpenFilter(null) }}
        onClose={() => setOpenFilter(null)}
      />
    )
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Currency Master</div>
            <div className="pg-sub">Configure accepted currencies and exchange rates</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-currency-modal')}>
            <i className="lni lni-plus"></i> Add Currency
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-dollar"></i></span> Currencies</div>
          </div>
          <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Code</th>
                  <th>Symbol</th>
                  {fth('Currency Name', 'name', ['Ugandan Shilling', 'US Dollar', 'Euro', 'British Pound', 'Kenyan Shilling'])}
                  <th>Rate to UGX</th>
                  {fth('Status', 'status', ['Active', 'Inactive'])}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={Object.values(filters).some(v => v.length > 0)} onClearFilters={() => setFilters({})} />
                  : null}
                {filteredRows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openModal('edit-currency-modal')}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono font-bold">{r.code}</td>
                    <td className="font-mono">{r.symbol}</td>
                    <td><strong>{r.name}</strong></td>
                    <td className="font-mono">{r.rate}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewCurrencyModal  isOpen={openModals.has('new-currency-modal')}  onClose={() => closeModal('new-currency-modal')}  showToast={showToast} />
      <EditCurrencyModal isOpen={openModals.has('edit-currency-modal')} onClose={() => closeModal('edit-currency-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
