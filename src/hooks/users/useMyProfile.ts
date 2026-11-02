import { useQuery } from '@tanstack/react-query'
import { getMyProfile } from '@/lib/api/users/profile'

export const MY_PROFILE_KEY = ['users', 'employees', 'me'] as const

export function useMyProfile() {
  return useQuery({ queryKey: MY_PROFILE_KEY, queryFn: getMyProfile })
}
