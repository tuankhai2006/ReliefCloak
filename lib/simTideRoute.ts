// Route helper for the SIMULATED TideCloak endpoints. They only exist in mock mode.
import { NextResponse } from 'next/server'
import { getSessionUser, MOCK, type SessionUser } from './auth'
import { SimTideError } from './simTide'

const notFound = () => NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

function errorJson(err: unknown) {
  if (err instanceof SimTideError) return NextResponse.json({ error: err.message }, { status: err.status })
  if (err instanceof SyntaxError) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  console.error(err)
  return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
}

export async function simPublic(fn: () => unknown | Promise<unknown>) {
  if (!MOCK) return notFound()
  try {
    return NextResponse.json(await fn())
  } catch (err) {
    return errorJson(err)
  }
}

export async function simWithUser(req: Request, fn: (user: SessionUser) => unknown | Promise<unknown>) {
  if (!MOCK) return notFound()
  try {
    const user = await getSessionUser(req)
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    return NextResponse.json(await fn(user))
  } catch (err) {
    return errorJson(err)
  }
}
