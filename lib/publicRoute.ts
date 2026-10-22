// Bọc route công khai (không cần đăng nhập): bắt ServiceError thành { error }.
import { NextResponse } from 'next/server'
import { ServiceError } from '@/services/claimService'

export function publicJson(fn: () => unknown): NextResponse {
  try {
    return NextResponse.json(fn())
  } catch (err) {
    if (err instanceof ServiceError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error(err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
