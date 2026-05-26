import { headers } from 'next/headers'
import dynamic from 'next/dynamic'

const DesktopAcademicDashboard = dynamic(
  () =>
    import('@/components/desktop/DesktopAcademicDashboard').then(
      (m) => m.DesktopAcademicDashboard,
    ),
  { ssr: true },
)

const MobileAcademicDashboard = dynamic(
  () =>
    import('@/components/mobile/MobileAcademicDashboard').then(
      (m) => m.MobileAcademicDashboard,
    ),
  { ssr: true },
)

export default async function AcademicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const deviceType = headersList.get('x-device-type') ?? 'desktop'
  const isMobile = deviceType === 'mobile'

  if (isMobile) {
    return <MobileAcademicDashboard>{children}</MobileAcademicDashboard>
  }

  return <DesktopAcademicDashboard>{children}</DesktopAcademicDashboard>
}
