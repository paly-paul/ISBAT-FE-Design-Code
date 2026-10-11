import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getBatchSummary, BatchSummaryItem, BatchSummaryListResult } from '@/lib/api/academic/batchSummary'

const BATCH_SUMMARY_KEY = ['batchSummary']

// GET /academic/batch-summary has no paging (get-batch-summary.md: only
// ?campusGuid=, returns the full list) — so this fetches every batch for the
// campus once and the page slices it. That keeps paging instant and lets the
// stat tiles total the whole set, not just the visible page. The large
// pageSize only matters if the endpoint ever starts honouring paging.
const FETCH_ALL_PAGE_SIZE = 10000

export function useBatchSummary(campusGuid: string | null) {
  return useQuery<BatchSummaryListResult>({
    queryKey: [...BATCH_SUMMARY_KEY, campusGuid ?? ''],
    queryFn: () => getBatchSummary(campusGuid, 1, FETCH_ALL_PAGE_SIZE),
    // Keep the previous campus's table up while the next one loads.
    placeholderData: keepPreviousData,
  })
}

export type { BatchSummaryItem }
