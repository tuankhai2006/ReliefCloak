'use client'
// Gọi API JSON kèm danh tính hiện tại (authFetch). Server trả lỗi dạng { error: CODE }.
import { useCallback, useEffect, useState } from 'react'
import { useTide } from './tide'

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message)
  }
}

// "CAMPAIGN_NOT_OPEN", "INVALID_amountVnd"… là mã; câu tiếng Việt cũ thì không.
const codeOf = (error: unknown) => (typeof error === 'string' && /^[A-Z][A-Za-z_]*$/.test(error) ? error : undefined)

export function useApiCall() {
  const { authFetch } = useTide()
  return useCallback(
    async <T,>(url: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> => {
      const res = await authFetch(url, { method, cache: 'no-store', ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new ApiError(data.error ?? `HTTP ${res.status}`, res.status, data.code ?? codeOf(data.error))
      return data as T
    },
    [authFetch],
  )
}

// Tải dữ liệu khi vào trang / đổi người dùng. reload() để tải lại sau khi thao tác.
export function useApi<T>(url: string | null) {
  const { user } = useTide()
  const call = useApiCall()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    if (!url) return
    setLoading(true)
    try {
      setData(await call<T>(url))
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError('NETWORK', 0, 'NETWORK'))
    } finally {
      setLoading(false)
    }
  }, [url, call])
  useEffect(() => {
    setData(null)
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, user?.id])
  return { data, error, loading, reload }
}
