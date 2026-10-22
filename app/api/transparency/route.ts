import { NextResponse } from 'next/server'
import { transparency } from '@/services/reliefService'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export function GET() { return NextResponse.json(transparency()) }
