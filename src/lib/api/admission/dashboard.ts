import { apiGet } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// GET /api/v1/admissions/dashboard (admission/dashboard/get-admission-dashboard.md).
// The current admission intake unless intakeGuid is passed. Every percent is
// already calculated (rounded to 1 decimal, 0–100, not a 0–1 fraction), so
// the page shows them as-is instead of recomputing from counts or funnel.
// An intake with no data is a 200 with every count at 0; no current
// admission intake is a 400 "No active admission intake found."

// source: 1 Direct (Walk-in), 2 CRM (Merito), 3 ODel Online App,
// 4 Online Enquiry, 5 Other. name is the display label.
export interface AdmissionSourceMixEntry {
  source: number
  name: string
  count: number
  percent: number
}

export interface AdmissionSourceMix {
  totalApplicants: number
  // Always Direct, CRM, ODel, Online Enquiry; Other only when it has applicants.
  sources: AdmissionSourceMixEntry[]
  counsellorDrivenPercent: number
  selfServicePercent: number
  // null when there are no applicants
  topSource: { source: number; name: string; count: number } | null
}

// fromStage/toStage: 1 Enquiry, 2 App. Payment, 3 App. Filing, 4 Vetting,
// 5 Reg. Payment, 6 Active Student.
export interface AdmissionConversionStep {
  fromStage: number
  toStage: number
  fromCount: number
  toCount: number
  remaining: number
  percent: number
}

export interface AdmissionConversion {
  // Always 5 steps, in pipeline order
  steps: AdmissionConversionStep[]
  enquiryCount: number
  activeStudentCount: number
  overallPercent: number
}

// enquiries, funnel and rejectedCount are also returned but this page
// doesn't use them.
export interface AdmissionDashboard {
  intakeGuid: string
  intakeCode: number
  intakeName: string | null
  sourceMix: AdmissionSourceMix
  conversion: AdmissionConversion
}

const mockDashboard: AdmissionDashboard = {
  intakeGuid: 'intake-mock-1',
  intakeCode: 20271,
  intakeName: 'Spring 2027',
  sourceMix: {
    totalApplicants: 752,
    sources: [
      { source: 1, name: 'Direct (Walk-in)', count: 708, percent: 94.1 },
      { source: 2, name: 'CRM (Merito)', count: 0, percent: 0 },
      { source: 3, name: 'ODel Online App', count: 40, percent: 5.3 },
      { source: 4, name: 'Online Enquiry', count: 3, percent: 0.4 },
      { source: 5, name: 'Other', count: 1, percent: 0.1 },
    ],
    counsellorDrivenPercent: 94.1,
    selfServicePercent: 5.7,
    topSource: { source: 1, name: 'Direct (Walk-in)', count: 708 },
  },
  conversion: {
    steps: [
      { fromStage: 1, toStage: 2, fromCount: 783, toCount: 752, remaining: 31, percent: 96 },
      { fromStage: 2, toStage: 3, fromCount: 752, toCount: 752, remaining: 0, percent: 100 },
      { fromStage: 3, toStage: 4, fromCount: 752, toCount: 730, remaining: 22, percent: 97.1 },
      { fromStage: 4, toStage: 5, fromCount: 730, toCount: 707, remaining: 23, percent: 96.8 },
      { fromStage: 5, toStage: 6, fromCount: 707, toCount: 691, remaining: 16, percent: 97.7 },
    ],
    enquiryCount: 783,
    activeStudentCount: 691,
    overallPercent: 88.3,
  },
}

export function getAdmissionDashboard(intakeGuid?: string): Promise<AdmissionDashboard> {
  if (MOCK_AUTH) return Promise.resolve(mockDashboard)
  const qs = intakeGuid ? `?intakeGuid=${encodeURIComponent(intakeGuid)}` : ''
  return apiGet<AdmissionDashboard>(`/api/v1/admissions/dashboard${qs}`)
}
