import { headers } from 'next/headers'

export type DeviceType = 'mobile' | 'desktop'

/**
 * Reads the x-device-type header injected by middleware.
 * Safe to call only in Server Components and Route Handlers.
 */
export async function getDeviceType(): Promise<DeviceType> {
  const headersList = await headers()
  const value = headersList.get('x-device-type')
  return value === 'mobile' ? 'mobile' : 'desktop'
}

export async function isMobileDevice(): Promise<boolean> {
  return (await getDeviceType()) === 'mobile'
}
