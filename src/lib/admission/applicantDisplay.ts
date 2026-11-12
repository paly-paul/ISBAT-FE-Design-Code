// Display helpers for GET /admissions/vetting/applications/{guid}, shared by
// the Vetting Desk review modal and the Applicant Profile page.

// A friendlier label than the raw documentType string from the wire
// ("NationalId" → "National ID").
export const DOCUMENT_LABELS: Record<string, string> = {
  NationalId: 'National ID',
  Passport: 'Passport',
  Visa: 'Visa',
  Photo: 'Passport Photo',
}

export function documentTitle(type: string): string {
  return DOCUMENT_LABELS[type] ?? type
}

// The API sends either the label ("Male") or the backend code — 0 = Male,
// 1 = Female, 2 = Other. Codes used to be shown raw ("0", "1").
const GENDER_LABELS = ['Male', 'Female', 'Other']
export function genderText(g: number | string | null | undefined): string {
  if (g == null || g === '') return ''
  const code = typeof g === 'number' ? g : /^\d+$/.test(g.trim()) ? +g : null
  return code != null ? (GENDER_LABELS[code] ?? String(g)) : String(g).trim()
}

// Display value for an optional text field: "—" for null, blank, or the
// literal string "null" some admission endpoints send.
export function orDash(value: string | null | undefined): string {
  const v = value?.trim()
  return v && v.toLowerCase() !== 'null' ? v : '—'
}
