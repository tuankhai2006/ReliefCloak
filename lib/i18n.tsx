'use client'
// K2: song ngữ Việt–Anh. Mặc định tiếng Việt; lựa chọn lưu trong localStorage và giữ qua điều hướng.
// Bản dịch tách theo tính năng (thư mục messages/): mỗi key khai báo vi + en cạnh nhau để không sót.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { LocalizedText as Bilingual } from '@/models/relief'

export type Lang = 'vi' | 'en'
export const LANGS: Lang[] = ['vi', 'en']
// Dùng chung khóa với khu quản trị (AdminConsole) để chọn ngôn ngữ một lần.
const STORAGE_KEY = 'relief-language'

type Messages = Record<string, Bilingual>
export const defineMessages = <M extends Messages>(messages: M) => messages

interface LangApi {
  lang: Lang
  setLang: (lang: Lang) => void
}

const Ctx = createContext<LangApi>({ lang: 'vi', setLang: () => {} })

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('vi')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'vi' || saved === 'en') setLangState(saved)
    } catch {}
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }, [])

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)

// t('key', { n: 3 }) thay {n} trong chuỗi.
export function useT<M extends Messages>(messages: M) {
  const { lang } = useLang()
  return useCallback(
    (key: keyof M, vars?: Record<string, string | number>) => {
      let s = messages[key][lang]
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
      return s
    },
    [messages, lang],
  )
}

// Chọn bản dịch của nội dung song ngữ do admin viết (campaign). Thiếu bản dịch thì dùng bản còn lại.
export function useBilingual() {
  const { lang } = useLang()
  return useCallback((value: Bilingual) => value[lang] || value[lang === 'vi' ? 'en' : 'vi'], [lang])
}

export function useFormat() {
  const { lang } = useLang()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  return {
    vnd: (n: number) => n.toLocaleString(locale) + ' ₫',
    date: (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'),
    dateTime: (iso: string | null) => (iso ? new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : '—'),
    number: (n: number) => n.toLocaleString(locale),
  }
}
