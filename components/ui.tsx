'use client'
// K1: bộ component giao diện dùng chung (trắng + xanh lá, cam cho mức khẩn cấp).
import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { useT } from '@/lib/i18n'
import { useApiErrorText } from '@/lib/apiError'
import { common, type CommonKey } from '@/messages/common'

const TONE = {
  gray: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-100 text-amber-800',
  orange: 'bg-orange-100 text-orange-800',
  blue: 'bg-sky-100 text-sky-800',
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-700',
} as const
export type Tone = keyof typeof TONE

const STATUS_TONE: Record<string, Tone> = {
  NEW: 'amber', VERIFYING: 'blue', ACCEPTED: 'green', REJECTED: 'red',
  DRAFT: 'gray', PUBLISHED: 'green', CLOSED: 'gray',
  PENDING_AUDIT: 'amber', APPROVED: 'blue', PAID_SIMULATED: 'green',
  LOW: 'gray', MEDIUM: 'amber', HIGH: 'orange', CRITICAL: 'red', STANDARD: 'gray', URGENT: 'orange',
}

export function Badge({ status, children, tone }: { status?: string; children?: ReactNode; tone?: Tone }) {
  const t = useT(common)
  const label = status && status in common ? t(status as CommonKey) : status
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[tone ?? STATUS_TONE[status ?? ''] ?? 'gray']}`}>
      {children ?? label}
    </span>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</section>
}

const BUTTON = {
  primary: 'bg-emerald-700 text-white hover:bg-emerald-800',
  danger: 'bg-white text-red-700 border border-red-300 hover:bg-red-50',
  ghost: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  urgent: 'bg-orange-600 text-white hover:bg-orange-700',
}
const SIZE = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' }
const buttonClass = (variant: keyof typeof BUTTON, size: keyof typeof SIZE) =>
  `inline-flex items-center justify-center gap-1.5 rounded-lg font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON[variant]} ${SIZE[size]}`

type Variant = { variant?: keyof typeof BUTTON; size?: keyof typeof SIZE }

export function Button({ variant = 'primary', size = 'sm', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & Variant) {
  return <button {...props} className={`${buttonClass(variant, size)} ${className}`} />
}

export function ButtonLink({ variant = 'primary', size = 'md', className = '', href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & Variant & { href: string }) {
  return <Link href={href} {...props} className={`${buttonClass(variant, size)} ${className}`} />
}

export const inputClass =
  'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  )
}

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'error' | 'success' | 'warn'; children: ReactNode }) {
  if (!children) return null
  const style = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warn: 'border-orange-200 bg-orange-50 text-orange-900',
  }[kind]
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${style}`}>
      {children}
    </div>
  )
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
      <p>{children}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function Loading({ label }: { label?: string }) {
  const t = useT(common)
  return (
    <div role="status" className="flex items-center gap-2 p-4 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" aria-hidden />
      {label ?? t('loading')}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useT(common)
  const text = useApiErrorText()
  return (
    <Notice kind="error">
      <span>{error ? text(error) : t('loadError')}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-2 font-medium underline">
          {t('retry')}
        </button>
      )}
    </Notice>
  )
}

export function Stat({ label, value, tone = 'text-slate-900', hint }: { label: string; value: ReactNode; tone?: string; hint?: string }) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold sm:text-2xl ${tone}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </Card>
  )
}

export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-2.5 w-full overflow-hidden rounded-full bg-emerald-100"
      >
        <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-xs text-slate-500">{pct}%</div>
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-slate-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function SimulatedTag() {
  const t = useT(common)
  return <Badge tone="orange">{t('simulated')}</Badge>
}
