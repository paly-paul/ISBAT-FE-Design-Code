'use client'
import { useEffect, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { useProcBanksInfinite } from '@/hooks/finance/useProcBanks'
import { STATUS_VALUES } from '@/lib/api/finance/procBank'
import { flattenUniquePages } from '@/lib/pagination'

const PROC_BANK_PAGE_SIZE = 20

interface Props {
  value: string
  onChange: (procBankGuid: string) => void
  disabled?: boolean
  placeholder?: string
}

// Active bank-account picker that loads a page at a time as the list is
// scrolled. The value is a ProcBank guid, not a generic Banks master row.
export function ProcBankSearchSelect({ value, onChange, disabled, placeholder = 'Select bank' }: Props) {
  const query = useProcBanksInfinite(PROC_BANK_PAGE_SIZE)
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = query
  const options = flattenUniquePages(query.data?.pages ?? [], b => b.procBankGuid)
    .filter(b => b.status === STATUS_VALUES.Active)
    .map(b => ({ value: b.procBankGuid, label: b.bankName }))

  // SearchSelect filters only what's loaded, so searching pulls in the rest to
  // search all of it. Stops on a failed page: scrolling or retyping tries again.
  const [search, setSearch] = useState('')
  useEffect(() => {
    if (search.trim() && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) fetchNextPage()
  }, [search, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])

  return (
    <SearchSelect
      placeholder={placeholder}
      options={options}
      value={value}
      onChange={onChange}
      onSearch={setSearch}
      disabled={disabled}
      isLoading={query.isLoading}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={() => fetchNextPage()}
    />
  )
}
