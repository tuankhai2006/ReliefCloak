export interface CommunityReport {
  id: string
  region: string
  description: string
  createdBy: string
  createdAt: string
  status?: import('./relief').ReportStatus
  feedback?: string
  reviewedBy?: string
  reviewedAt?: string
  needs?: string
  urgency?: 'STANDARD' | 'URGENT'
  image?: string
}

export interface CommunityPost {
  id: string
  reportId: string
  title: string
  region: string
  content: string
  publishedAt: string
}
