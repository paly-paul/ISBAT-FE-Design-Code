'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'
import { EmptyState } from '@/components/EmptyState'
import { NewCountryModal } from '@/components/modals/academic/NewCountryModal'
import { EditCountryModal } from '@/components/modals/academic/EditCountryModal'

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
    { countryCode: 'UGA', countryName: 'Uganda',         nationality: 'Ugandan',        defaultCountry: 1, countryPrefix: '+256' },
    { countryCode: 'KEN', countryName: 'Kenya',           nationality: 'Kenyan',         defaultCountry: 0, countryPrefix: '+254' },
    { countryCode: 'TZA', countryName: 'Tanzania',        nationality: 'Tanzanian',      defaultCountry: 0, countryPrefix: '+255' },
    { countryCode: 'RWA', countryName: 'Rwanda',          nationality: 'Rwandan',        defaultCountry: 0, countryPrefix: '+250' },
    { countryCode: 'SSD', countryName: 'South Sudan',     nationality: 'South Sudanese', defaultCountry: 0, countryPrefix: '+211' },
    { countryCode: 'COD', countryName: 'DR Congo',        nationality: 'Congolese',      defaultCountry: 0, countryPrefix: '+243' },
    { countryCode: 'GBR', countryName: 'United Kingdom',  nationality: 'British',        defaultCountry: 0, countryPrefix: '+44'  },
    { countryCode: 'IND', countryName: 'India',           nationality: 'Indian',         defaultCountry: 0, countryPrefix: '+91'  },
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
            <div className="pg-title">Country Master</div>
            <div className="pg-sub">Manage countries for student nationality and address records</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-country-modal')}>
            <i className="lni lni-plus"></i> Add Country
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-world"></i></span> Countries</div>
          </div>
          <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Country Code</th>
                  <th>Country Name</th>
                  {fth('Nationality', 'nationality', ['Ugandan', 'Kenyan', 'Tanzanian', 'Rwandan', 'South Sudanese', 'Congolese', 'British', 'Indian'])}
                  <th>Dial Prefix</th>
                  <th>Default</th>
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
                        <button className="btn btn-neu btn-sm" onClick={() => openModal('edit-country-modal')}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono font-bold">{r.countryCode}</td>
                    <td><strong>{r.countryName}</strong></td>
                    <td>{r.nationality}</td>
                    <td className="font-mono">{r.countryPrefix}</td>
                    <td>
                      {r.defaultCountry === 1
                        ? <span className="badge badge-green">Default</span>
                        : <span className="badge-grey">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewCountryModal  isOpen={openModals.has('new-country-modal')}  onClose={() => closeModal('new-country-modal')}  showToast={showToast} />
      <EditCountryModal isOpen={openModals.has('edit-country-modal')} onClose={() => closeModal('edit-country-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
