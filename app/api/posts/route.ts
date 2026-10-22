import { NextResponse } from 'next/server'
import { withUser } from '@/lib/auth'
import { publicPosts, publishPost } from '@/services/communityService'
export const dynamic = 'force-dynamic'
export function GET() { return NextResponse.json(publicPosts()) }
export async function POST(req: Request) {
  return withUser(req, async user => publishPost(user, await req.json()))
}
