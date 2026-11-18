export interface PaginatedItems<T> {
  items: T[]
  totalCount: number
  pageNumber?: number
  pageSize?: number
}

export function getNextPageParam<T extends PaginatedItems<unknown>>(
  lastPage: T,
  allPages: T[],
): number | undefined {
  const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0)
  if (lastPage.items.length === 0) return undefined

  // Some endpoints return totalCount for the current response rather than
  // the complete filtered dataset. A full page is therefore the reliable
  // signal that another page may exist; an extra empty request is preferable
  // to hiding every result after the first page.
  const pageSize = lastPage.pageSize ?? lastPage.items.length
  if (lastPage.items.length < pageSize) return undefined
  if (lastPage.totalCount > loaded && lastPage.items.length > 0) return allPages.length + 1
  if (lastPage.totalCount <= loaded && lastPage.totalCount !== lastPage.items.length) return undefined
  return allPages.length + 1
}

// Presents an unpaged dropdown endpoint (one call, server-side ?search=) as
// the paged fetchPage InfiniteSearchSelect expects: everything on page 1, and
// a pageSize no result can fill, so getNextPageParam never asks for page 2.
export function dropdownAsPage<T>(fetchAll: (search: string) => Promise<T[]>) {
  return (page: number, _pageSize: number, search: string): Promise<PaginatedItems<T>> =>
    page > 1
      ? Promise.resolve({ items: [], totalCount: 0 })
      : fetchAll(search).then(items => ({ items, totalCount: items.length, pageNumber: 1, pageSize: Number.MAX_SAFE_INTEGER }))
}

export function flattenUniquePages<T>(
  pages: Array<{ items: T[] }>,
  getKey: (item: T) => string,
): T[] {
  const unique = new Map<string, T>()
  pages.forEach(page => page.items.forEach(item => unique.set(getKey(item), item)))
  return [...unique.values()]
}