import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { getMyProfile, putMyPhoto, type MyProfile } from '@/lib/api/users/profile'
import { changePassword, getSignInActivity, type SignInActivityPage } from '@/lib/auth'

export const MY_PROFILE_KEY = ['users', 'employees', 'me'] as const
export const SIGN_IN_ACTIVITY_KEY = ['users', 'auth', 'sign-in-activity'] as const
// The list scrolls inside its card, so a page can be longer than what fits.
const SIGN_IN_PAGE_SIZE = 10

// GET /users/auth/sign-in-activity, a page at a time for "Show more".
// No retry: a failure is shown once on the card.
export function useSignInActivity(enabled = true) {
  return useInfiniteQuery({
    queryKey: SIGN_IN_ACTIVITY_KEY,
    queryFn: ({ pageParam }) => getSignInActivity(pageParam, SIGN_IN_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: last => (last.pageNumber * last.pageSize < last.totalCount ? last.pageNumber + 1 : undefined),
    retry: false,
    enabled,
  })
}

// "Show less": drops every page after the first from the cache, so the list
// goes back to its first 10 rows without another request.
export function useCollapseSignInActivity() {
  const qc = useQueryClient()
  return () => qc.setQueryData<InfiniteData<SignInActivityPage, number>>(SIGN_IN_ACTIVITY_KEY, old =>
    old && old.pages.length > 1 ? { pages: old.pages.slice(0, 1), pageParams: old.pageParams.slice(0, 1) } : old)
}

// A password change adds a sign-in row for this device and marks every other
// session signed out, so the activity list is refetched afterwards.
export function useChangePassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => changePassword(currentPassword, newPassword),
    onSuccess: () => qc.invalidateQueries({ queryKey: SIGN_IN_ACTIVITY_KEY }),
  })
}

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
