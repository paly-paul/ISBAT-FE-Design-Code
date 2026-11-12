// The Applicant Profile page loads everything from
// GET /admissions/vetting/applications/{applicationGuid}, so the link only
// carries the guid.
export function applicantProfileHref(applicationGuid: string): string {
  return `/admission/applicant-profile?${new URLSearchParams({ applicationGuid }).toString()}`
}
