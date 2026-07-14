'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { NewCurrencyModal } from '@/components/modals/academic/NewCurrencyModal'
import { EditCurrencyModal } from '@/components/modals/academic/EditCurrencyModal'
import { useCurrencies, useCreateCurrency, useUpdateCurrency, Currency } from '@/hooks/config/useCurrencies'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)

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

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Currency Master</div>
            <div className="pg-sub">Configure system currencies and set the default</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-currency-modal')}>
            <i className="lni lni-plus"></i> Add Currency
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-dollar"></i></span> Currencies</div>
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
                  : rows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                      </ActionMenu>
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
