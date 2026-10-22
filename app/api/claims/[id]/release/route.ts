import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'LEGACY_PAYOUT_DISABLED', replacement: '/api/admin/disbursements' }, { status: 410 })
}
