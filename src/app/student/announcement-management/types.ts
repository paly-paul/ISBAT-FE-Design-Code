// Page-local types — no backend endpoint exists for Announcement Management
// yet, so there's no lib/api/student/*.ts client to own this shape (unlike
// Event Management's confirmed academic-service.students.events.* contract).
// Replace with a real API type once the backend deploys it.
export type AttachmentType = 'image' | 'pdf'

export interface AnnouncementItem {
  announcementGuid: string
  subject: string
  programGuid: string | null
  programName: string | null
  visibleUpto: string // yyyy-mm-dd
  body: string // rich HTML, see RichTextEditor
  // Object URL (see URL.createObjectURL) held only in this tab's memory —
  // there's no backend to upload to yet, so nothing here survives a reload.
  // Replace with a real uploaded-file URL once the API exists.
  attachmentUrl: string | null
  attachmentName: string | null
  attachmentType: AttachmentType | null
}

export type AnnouncementInput = Omit<AnnouncementItem, 'announcementGuid'>
