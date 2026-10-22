// Ảnh minh họa đóng gói sẵn (xem public/photos/ATTRIBUTION.md). Không phải ảnh thật của sự kiện.
// Report của người dân chọn từ danh sách này. Ảnh của chiến dịch vẫn theo allowlist trong reliefService.
export const PUBLIC_IMAGES = [
  '/photos/flood-1.svg',
  '/photos/flood-2.svg',
  '/photos/rescue-boat.svg',
  '/photos/relief-supplies.svg',
  '/photos/clean-water.svg',
  '/photos/rebuild.svg',
] as const

export const NEEDS = ['food', 'water', 'shelter', 'medical', 'rescue', 'other'] as const
export type Need = (typeof NEEDS)[number]
export const URGENCIES = ['STANDARD', 'URGENT'] as const
