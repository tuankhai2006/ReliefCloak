'use client'
// Dịch lỗi API theo mã sang ngôn ngữ đang chọn.
import { useT } from './i18n'
import { ApiError } from './useApi'
import { apiErrorMsg } from '@/messages/donations'

type Key = keyof typeof apiErrorMsg

export function useApiErrorText() {
  const t = useT(apiErrorMsg)
  return (err: unknown): string => {
    if (!(err instanceof ApiError)) return t('NETWORK')
    if (err.status === 401) return t('UNAUTHORIZED')
    if (err.status === 404) return t('NOT_FOUND')
    const code = err.code ?? ''
    if (code in apiErrorMsg) return t(code as Key)
    if (code.startsWith('INVALID_')) return t('VALIDATION')
    if (err.status === 403) return t('FORBIDDEN')
    return err.status ? err.message : t('NETWORK')
  }
}
