'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { NewCurrencyModal } from '@/components/modals/finance/NewCurrencyModal'
import { EditCurrencyModal } from '@/components/modals/finance/EditCurrencyModal'
import { useCurrencies, useCreateCurrency, useUpdateCurrency, Currency } from '@/hooks/finance/useCurrencies'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const [search, setSearch] = useState('')

  const { data: rows = [], isLoading } = useCurrencies()
  const createCurrency = useCreateCurrency()
  const updateCurrency = useUpdateCurrency()

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(currency: Currency) {
    setEditingCurrency(currency)
    openModal('edit-currency-modal')
  }

  const filteredRows = rows.filter(r =>
    !search.trim() || `${r.currencyCode} ${r.currencyName}`.toLowerCase().includes(search.trim().toLowerCase())
  )

  const searchMatches = search.trim()
    ? rows.filter(r => `${r.currencyCode} ${r.currencyName}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
    : []

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Currency Master</div>
            <div className="pg-sub">Configure system currencies and set the default</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-currency-modal')}>
              <i className="lni lni-plus"></i> Add Currency
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-dollar"></i></span> Currencies</div>
            <TableSearch
              className="w-56"
              placeholder="Search by code or name…"
              value={search}
              onChange={setSearch}
              results={searchMatches.map(r => ({ id: String(r.intCurrency), primary: r.currencyCode, secondary: r.currencyName }))}
            />
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Currency Code</th>
                  <th>Currency Name</th>
                  <th>Default</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : filteredRows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={!!search} onClearFilters={() => setSearch('')} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.intCurrency}>
                    <td>
                      {permissions.edit && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}>
                            <i className="lni lni-pencil"></i> Edit
                          </button>
                        </ActionMenu>
                      )}
                    </td>
                    <td className="font-mono font-bold">{r.currencyCode}</td>
                    <td><strong>{r.currencyName}</strong></td>
                    <td>
                      {r.isDefault === 1
                        ? <span className="badge badge-green">Default</span>
                        : <span className="badge-grey">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="currencies" onPageChange={setPage} />
        </div>
      </div>
      <NewCurrencyModal
        isOpen={openModals.has('new-currency-modal')}
        onClose={() => closeModal('new-currency-modal')}
        showToast={showToast}
        createCurrency={createCurrency}
      />
      <EditCurrencyModal
        isOpen={openModals.has('edit-currency-modal')}
        onClose={() => closeModal('edit-currency-modal')}
        showToast={showToast}
        currency={editingCurrency}
        updateCurrency={updateCurrency}
      />
      <Toast toast={toast} />
    </>
  )
}
