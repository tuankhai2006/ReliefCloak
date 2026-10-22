export interface CommunityReport {
  id: string
  region: string
  description: string
  createdBy: string
  createdAt: string
}

export interface CommunityPost {
  id: string
  reportId: string
  title: string
  region: string
  content: string
  publishedAt: string
}
