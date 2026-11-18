import { apiGet } from './client'
import type { PaginatedItems } from '@/lib/pagination'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// One page of a master list endpoint that takes ?page=&pageSize=&search=
// (the Config masters — e.g. get-campuses.md, get-followup-modes.md: `page`
// is 1-based, `search` a contains-match, omitted when blank). The envelope's
// data is normally { items, totalCount }; a bare array is tolerated and
// treated as the whole result.
//
// mock: in NEXT_PUBLIC_AUTH_MOCK mode, the page is cut from these rows
// instead, searched on text(row).
export function getPagedList<T>(
  path: string,
  page: number,
  pageSize: number,
  search = '',
  mock?: { rows: T[]; text: (row: T) => string },
): Promise<PaginatedItems<T>> {
  const q = search.trim()
  if (MOCK_AUTH && mock) {
    const hits = q ? mock.rows.filter(r => mock.text(r).toLowerCase().includes(q.toLowerCase())) : mock.rows
    const start = (page - 1) * pageSize
    return Promise.resolve({ items: hits.slice(start, start + pageSize), totalCount: hits.length, pageNumber: page, pageSize })
  }
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (q) params.set('search', q)
  return apiGet<unknown>(`${path}?${params.toString()}`).then(data => {
    if (Array.isArray(data)) return { items: data as T[], totalCount: data.length, pageNumber: page, pageSize }
    const d = (data ?? {}) as { items?: T[]; totalCount?: number }
    const items = d.items ?? []
    return { items, totalCount: d.totalCount ?? items.length, pageNumber: page, pageSize }
  })
}
