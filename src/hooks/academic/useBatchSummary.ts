import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getBatches, type Batch, type BatchListResult } from '@/lib/api/academic/batch'

const BATCH_SUMMARY_KEY = ['batchSummary']

// GET /batch-summary was removed in MR !341; its rows (head count, batch
// in-charge, programme code, semCode) now come from GET /batches. Fetches
// every batch for the campus + intake in one call and the page slices it,
// which keeps paging instant and lets the stat tiles total the whole set,
// not just the visible page. pageSize is sent explicitly — the endpoint
// defaults to 20.
const FETCH_ALL_PAGE_SIZE = 10000

// intakeGuid null = the current admission intake (the endpoint's default).
export function useBatchSummary(campusGuid: string | null, intakeGuid: string | null) {
  return useQuery<BatchListResult>({
    queryKey: [...BATCH_SUMMARY_KEY, campusGuid ?? '', intakeGuid ?? ''],
    queryFn: () => getBatches(1, FETCH_ALL_PAGE_SIZE, '', { campusGuid, intakeGuid }),
    // Keep the previous filter's table up while the next one loads.
    placeholderData: keepPreviousData,
  })
}

export type { Batch }
