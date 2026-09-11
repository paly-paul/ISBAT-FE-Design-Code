import { useQuery } from '@tanstack/react-query'
import { getBatchSummary, BatchSummaryItem, BatchSummaryListResult } from '@/lib/api/academic/batchSummary'

const BATCH_SUMMARY_KEY = ['batchSummary']

// Refetches on the campus filter plus the page window — the real endpoint is
// now expected to handle the pagination itself instead of the UI slicing an
// already-fetched array.
export function useBatchSummary(campusGuid: string | null, pageNumber = 1, pageSize = 10) {
  return useQuery<BatchSummaryListResult>({
    queryKey: [...BATCH_SUMMARY_KEY, campusGuid ?? '', pageNumber, pageSize],
    queryFn: () => getBatchSummary(campusGuid, pageNumber, pageSize),
  })
}

export type { BatchSummaryItem }
