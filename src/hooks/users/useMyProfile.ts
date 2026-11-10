import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMyProfile, putMyPhoto, type MyProfile } from '@/lib/api/users/profile'

export const MY_PROFILE_KEY = ['users', 'employees', 'me'] as const

export function useMyProfile() {
  return useQuery({ queryKey: MY_PROFILE_KEY, queryFn: getMyProfile })
}

// Writes the returned photoUrl into the cached profile, so the profile page
// and the header avatar (both read useMyProfile) update without a refetch.
export function useUpdateMyPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: putMyPhoto,
    onSuccess: ({ photoUrl }) => {
      qc.setQueryData<MyProfile>(MY_PROFILE_KEY, old => (old ? { ...old, photoUrl } : old))
    },
  })
}
