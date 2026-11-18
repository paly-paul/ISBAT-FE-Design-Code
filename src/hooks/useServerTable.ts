'use client'
import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { PaginatedItems } from '@/lib/pagination'

// A master table paged and searched on the server: only `pageSize` rows are
// ever fetched, for the page on screen.
//
// The list endpoints take a single `search` term, so the search box and a
// header column filter share it — whichever was used last wins, and using
// one clears the other:
//  - search box: applied once it's at least `minSearch` characters, after a
//    300 ms pause in typing
//  - header filter (setFilter): applied immediately, whatever its length
//
// queryKey should start with the entity's own key (e.g. CAMPUSES_KEY), so the
// create/update/delete mutations' invalidations refresh the table.
export function useServerTable<T>({ queryKey, fetchPage, pageSize = 10, minSearch = 2, enabled = true }: {
  queryKey: readonly unknown[]
  fetchPage: (page: number, pageSize: number, search: string) => Promise<PaginatedItems<T>>
  pageSize?: number
  minSearch?: number
  enabled?: boolean
}) {
  const [search, setSearchText] = useState('')
  const [filter, setFilterState] = useState<{ column: string; value: string } | null>(null)
  const [page, setPage] = useState(1)

  const typed = search.trim().length >= minSearch ? search.trim() : ''
  const [debounced, setDebounced] = useState(typed)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(typed), 300)
    return () => clearTimeout(t)
  }, [typed])

  const term = filter ? filter.value : debounced
  const query = useQuery({
    queryKey: [...queryKey, 'server-table', page, pageSize, term],
    queryFn: () => fetchPage(page, pageSize, term),
    placeholderData: keepPreviousData,
    enabled,
  })

  const items = query.data?.items ?? []
  const totalCount = query.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // A delete can leave the current page past the end — step back to the last one.
  useEffect(() => {
    if (!query.isPlaceholderData && page > totalPages) setPage(totalPages)
  }, [page, totalPages, query.isPlaceholderData])

  function setSearch(value: string) {
    setSearchText(value)
    setFilterState(null)
    setPage(1)
  }

  function setFilter(column: string, value: string | null) {
    setFilterState(value ? { column, value } : null)
    setSearchText('')
    setDebounced('')
    setPage(1)
  }

  return {
    items,
    totalCount,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    // The active header filter, if any ({ column, value }).
    filter,
    setFilter,
    // The term the current rows were fetched for ('' = everything).
    term,
    isLoading: query.isLoading,
    // Typing has moved past what's on screen, or a new term's page is still loading.
    searchPending: typed !== debounced || (query.isFetching && query.isPlaceholderData),
  }
}
