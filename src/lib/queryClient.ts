import { QueryClient } from '@tanstack/react-query'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,         // 1 minute
        gcTime: 5 * 60 * 1000,        // 5 minutes
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  })
}
