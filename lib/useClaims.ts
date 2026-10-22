'use client'
import { useCallback, useEffect, useState } from 'react'
import type { Claim } from '@/models/claim'

export function useClaims() {
  const [claims, setClaims] = useState<Claim[]>([])
  const reload = useCallback(async () => {
    const res = await fetch('/api/claims', { cache: 'no-store' })
    setClaims(await res.json())
  }, [])
  useEffect(() => {
    reload()
  }, [reload])
  return { claims, reload }
}
