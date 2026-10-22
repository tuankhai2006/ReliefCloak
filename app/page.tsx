'use client'
import Link from 'next/link'
import { useTide, MOCK } from '@/lib/tide'

const STEPS = [
  { who: 'Field Worker', what: 'Tạo claim, STK/CCCD được mã hóa ngay trên trình duyệt', href: '/claim/new' },
  { who: 'Chủ quỹ + Auditor', what: 'Cùng duyệt claim. Không ai thấy STK', href: '/claims' },
  { who: 'Officer', what: 'Đủ chữ ký mới mở khóa được STK và giải ngân', href: '/disburse' },
  { who: 'Người quyên góp', what: 'Xem ai đã duyệt, tiền đi đâu', href: '/public' },
]

export default function HomePage() {
  const { user } = useTide()
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold">ReliefCloak</h1>
        <p className="mt-2 text-slate-600">
          Tiền cứu trợ chỉ được giải ngân khi Tình nguyện viên, Chủ quỹ và Kiểm toán cùng ký. Không admin nào có thể
          một mình đọc hay chuyển hướng tiền.
        </p>
        <p className="mt-2 text-sm">
          {user ? (
            <>Đang đăng nhập: <b>{user.name}</b> ({user.roles.filter((r) => !r.startsWith('_') && !r.startsWith('default')).join(', ')})</>
          ) : MOCK ? (
            'Chọn vai ở góc phải để bắt đầu (mock mode).'
          ) : (
            'Đăng nhập để bắt đầu.'
          )}
        </p>
      </section>
      <ol className="grid gap-3 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.href}>
            <Link href={s.href} className="block rounded-lg border bg-white p-4 hover:border-blue-400">
              <div className="text-xs text-slate-500">Bước {i + 1}</div>
              <div className="font-semibold">{s.who}</div>
              <div className="text-sm text-slate-600">{s.what}</div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
