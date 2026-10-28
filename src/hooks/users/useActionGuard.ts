import { useCallback } from 'react'
import { usePagePermissions } from './usePagePermissions'

// The one rule for menu-permission-gated actions (print, export, approve…):
// the button stays visible, and when the current page's /me/menu
// permissions don't grant the action, clicking shows an error toast instead
// of running it. Reads the same permissions as usePagePermissions, so it
// works on any page, and in any modal opened from one.
//
//   const guard = useActionGuard(showToast)
//   <button onClick={() => guard('print', () => window.print(), 'receipts')}>
//
// `subject` finishes the sentence: "You don't have permission to print
// receipts." Leave it out for "…to print this."

type ShowToast = (msg: string, type?: string) => void

export function permissionDeniedMessage(action: string, subject = 'this') {
  return `You don’t have permission to ${action} ${subject}. Ask an administrator to grant it.`
}

export function useActionGuard(showToast: ShowToast) {
  const permissions = usePagePermissions()
  return useCallback(
    (action: string, run: () => void, subject?: string) => {
      if (!permissions[action]) {
        showToast(permissionDeniedMessage(action, subject), 'error')
        return
      }
      run()
    },
    [permissions, showToast],
  )
}
