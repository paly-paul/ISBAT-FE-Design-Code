'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { Pagination } from '@/components/Pagination'
import { useRejectedApplicationsSearch } from '@/hooks/academic/useRefundSearch'
import { RefundLedgerPicker, initialsFor } from './shared'
import { mockSearchRejected } from './mockData'

// Category 1 — applications rejected by the registrar
// (get-rejected-applications.md). One candidate selected at a time: click a
// search result row to load its own unrefunded main-ledger lines and refund
// against one of them via RefundLedgerPicker.

const PAGE_SIZE = 20

interface RejectedTabProps {
  showToast: (msg: string, type?: string) => void
  permissionsCreate: boolean
  onRefunded: (rows: [string, string][]) => void
  useMock?: boolean
}

export function RejectedTab({ showToast, permissionsCreate, onRefunded, useMock = false }: RejectedTabProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<{ applicationGuid: string; studentGuid: string | null; name: string; appRefNo: string; email: string | null; phone: string | null } | null>(null)

  const { data, isLoading: isLoadingReal, isError } = useRejectedApplicationsSearch({ search, page, pageSize: PAGE_SIZE }, !useMock)
  const mockItems = useMock ? mockSearchRejected(search) : []
  const items = useMock ? mockItems : (data?.items ?? [])
  const totalCount = useMock ? mockItems.length : (data?.totalCount ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const isLoading = useMock ? false : isLoadingReal

  function handleSearchChange(v: string) {
    setSearch(v)
    setPage(1)
    setSelected(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-search-alt"></i></span> Search Rejected Applications</div>
        </div>
        <div className="fg" style={{ marginBottom: 0 }}>
          <div className="lbl">Applicant Name, AppRefNo, Email, or Phone</div>
          <div className="inp-wrap">
            <span className="inp-icon"><i className="lni lni-search-alt"></i></span>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. APP20241/145 or Ashfa Maryam"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="text-g400 text-center" style={{ padding: 24, fontSize: 12.5 }}>Searching…</div>
        ) : isError ? (
          <div className="text-clr-red text-center" style={{ padding: 24, fontSize: 12.5 }}><i className="lni lni-warning"></i> Search failed. Please try again.</div>
        ) : items.length === 0 ? (
          <div className="text-g400 text-center" style={{ padding: 24, fontSize: 12.5 }}>No rejected applications found.</div>
        ) : (
          <>
            <ScrollTable className="no-sticky-col">
              <table>
                <thead><tr><th>Applicant</th><th>AppRefNo</th><th>Email</th><th>Phone</th><th></th></tr></thead>
                <tbody>
                  {items.map(a => (
                    <tr
                      key={a.applicationGuid}
                      className={`cursor-pointer${selected?.applicationGuid === a.applicationGuid ? ' bg-b50' : ''}`}
                      onClick={() => setSelected({ applicationGuid: a.applicationGuid, studentGuid: a.studentGuid, name: a.applicantName, appRefNo: a.appRefNo, email: a.email, phone: a.phone })}
                    >
                      <td className="font-bold">{a.applicantName}</td>
                      <td>{a.appRefNo}</td>
                      <td>{a.email || '—'}</td>
                      <td>{a.phone || '—'}</td>
                      <td>{selected?.applicationGuid === a.applicationGuid && <span className="badge badge-blue">Selected</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
            <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="applications" onPageChange={setPage} />
          </>
        )}
      </div>

      {selected && (
        <>
          {/* Full-width hero card, promoted out of a 2-column split
              (2026-09-15) — same move as Payment Console's Semester Payment
              tab (its own pc-hero used to be the left column's own top
              section, now a standalone card above the rest of the body). */}
          <div className="card p-0 overflow-hidden">
            <div className="pc-hero">
              <div className="pc-hero-top">
                <div className="pc-hero-avatar">{initialsFor(selected.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="pc-hero-name truncate">{selected.name}</div>
                  <div className="pc-hero-sub truncate">Rejected by Registrar</div>
                  <span className="pc-hero-badge"><i className="lni lni-bookmark"></i> {selected.appRefNo}</span>
                </div>
              </div>
              <div className="pc-hero-facts">
                <div className="pc-hero-fact"><span className="pc-hero-fact-lbl">Email</span><span className="pc-hero-fact-val" title={selected.email ?? '—'}>{selected.email ?? '—'}</span></div>
                <div className="pc-hero-fact"><span className="pc-hero-fact-lbl">Phone</span><span className="pc-hero-fact-val" title={selected.phone ?? '—'}>{selected.phone ?? '—'}</span></div>
              </div>
            </div>
          </div>

          <RefundLedgerPicker
            key={selected.applicationGuid}
            applicationGuid={selected.applicationGuid}
            studentGuid={selected.studentGuid}
            showToast={showToast}
            permissionsCreate={permissionsCreate}
            onRefunded={onRefunded}
            useMock={useMock}
          />
        </>
      )}
    </div>
  )
}
