'use client'
import { useEffect, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { useProcBank, useProcBanksInfinite } from '@/hooks/finance/useProcBanks'
import { ProcBank, STATUS_VALUES } from '@/lib/api/finance/procBank'
import { flattenUniquePages } from '@/lib/pagination'

const PROC_BANK_PAGE_SIZE = 20
// The list has no status filter, so a page can hold few active banks. Below
// this many options the dropdown can't scroll, and scrolling is what loads more.
const MIN_SCROLLABLE_OPTIONS = 8

interface Props {
  value: string
  onChange: (procBankGuid: string) => void
  disabled?: boolean
  placeholder?: string
  showAccountCode?: boolean
}

// Active bank-account picker that loads a page at a time as the list is
// scrolled. The value is a ProcBank guid, not a generic Banks master row.
export function ProcBankSearchSelect({ value, onChange, disabled, placeholder = 'Select bank', showAccountCode = false }: Props) {
  const query = useProcBanksInfinite(PROC_BANK_PAGE_SIZE)
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = query
  const toOption = (b: ProcBank) => ({ value: b.procBankGuid, label: showAccountCode ? `${b.bankName} — ${b.accountCode}` : b.bankName })
  const options = flattenUniquePages(query.data?.pages ?? [], b => b.procBankGuid)
    .filter(b => b.status === STATUS_VALUES.Active)
    .map(toOption)

  // A record's existing bank may be on a page not loaded yet, or no longer
  // active, so look it up to keep its name showing.
  const selectedMissing = !!value && !query.isLoading && !options.some(o => o.value === value)
  const { data: selectedBank } = useProcBank(value || null, selectedMissing)
  if (selectedMissing && selectedBank) options.unshift(toOption(selectedBank))

  // SearchSelect filters only what's loaded, so searching pulls in the rest to
  // search all of it. Stops on a failed page: scrolling or retyping tries again.
  const [search, setSearch] = useState('')
  const needsMore = !!search.trim() || options.length < MIN_SCROLLABLE_OPTIONS
  useEffect(() => {
    if (needsMore && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) fetchNextPage()
  }, [needsMore, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])

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
