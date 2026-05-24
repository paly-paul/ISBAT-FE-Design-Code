import { headers } from 'next/headers'

export type DeviceType = 'mobile' | 'desktop'

/**
 * Reads the x-device-type header injected by middleware.
 * Safe to call only in Server Components and Route Handlers.
 */
export function getDeviceType(): DeviceType {
  const headersList = headers()
  const value = headersList.get('x-device-type')
  return value === 'mobile' ? 'mobile' : 'desktop'
}

export function isMobileDevice(): boolean {
  return getDeviceType() === 'mobile'
}
