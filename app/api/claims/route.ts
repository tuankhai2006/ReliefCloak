import { NextResponse } from 'next/server'
import { withUser } from '@/lib/auth'
import { createClaim, listClaims } from '@/services/claimService'

// Công khai: trang /public cũng dùng. Chỉ có ciphertext nên không lộ STK/CCCD.
export async function GET() {
  return NextResponse.json(listClaims())
}

export async function POST(req: Request) {
  const body = await req.json()
  return withUser(req, (user) => createClaim(user, body))
}
