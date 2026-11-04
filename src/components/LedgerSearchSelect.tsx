'use client'
import { useEffect, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { useLedgersInfinite } from '@/hooks/finance/useLedgers'
import { flattenUniquePages } from '@/lib/pagination'

const LEDGER_PAGE_SIZE = 20

interface Props {
  value: string
  onChange: (ledgerGuid: string) => void
  // Ledgers already on the form, so a saved pick still shows its name before
  // the page holding it has loaded.
  fallbackOptions?: { value: string; label: string }[]
}

// Ledger picker that loads a page at a time as the list is scrolled. Every
// instance shares one cached query, so a form with many fee rows still makes
// each page's request once.
export function LedgerSearchSelect({ value, onChange, fallbackOptions = [] }: Props) {
  const query = useLedgersInfinite(LEDGER_PAGE_SIZE)
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = query
  const loaded = flattenUniquePages(query.data?.pages ?? [], l => l.ledgerGuid)
    .map(l => ({ value: l.ledgerGuid, label: l.ledgerName }))

  // GET /finance/ledgers has no search param and SearchSelect filters what's
  // loaded, so searching pulls in the remaining pages to search all of them.
  // Stops on a failed page: scrolling or retyping is what tries again.
  const [search, setSearch] = useState('')
  useEffect(() => {
    if (search.trim() && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) fetchNextPage()
  }, [search, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])

  return (
    <SearchSelect
      placeholder="— Select Ledger —"
      options={[...loaded, ...fallbackOptions]}
      value={value}
      onChange={onChange}
      onSearch={setSearch}
      isLoading={query.isLoading}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={() => fetchNextPage()}
    />
  )
}
