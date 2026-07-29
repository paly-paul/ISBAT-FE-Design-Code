'use client'

interface PaginationProps {
  page: number
  totalPages: number
  totalCount: number
  itemLabel?: string
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, totalCount, itemLabel = 'results', onPageChange }: PaginationProps) {
  if (totalCount === 0) return null
  return (
    <div className="flex items-center justify-between mt-3" style={{ fontSize: 12.5, color: 'var(--g500)' }}>
      <span>Page {page} of {totalPages} · {totalCount.toLocaleString()} {itemLabel}</span>
      <div className="flex gap-2">
        <button className="btn btn-neu btn-sm" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
          <i className="lni lni-chevron-left" /> Previous
        </button>
        <button className="btn btn-neu btn-sm" disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
          Next <i className="lni lni-chevron-right" />
        </button>
      </div>
    </div>
  )
}
