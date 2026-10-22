'use client'
import Link from 'next/link'
import { useTide, MOCK } from '@/lib/tide'

const STEPS = [
  { who: 'Người dân', what: 'Gửi report riêng tư về tình hình và nhu cầu cứu trợ', href: '/reports' },
  { who: 'Bảng tin', what: 'Chỉ admin biên tập và đăng thông tin công khai', href: '/posts' },
  { who: 'Field Worker', what: 'Tạo claim, STK/CCCD được mã hóa ngay trên trình duyệt', href: '/claim/new' },
  { who: 'Chủ quỹ + Auditor', what: 'Cùng duyệt claim. Không ai thấy STK', href: '/claims' },
  { who: 'Officer', what: 'Thử luồng giải ngân mô phỏng sau khi duyệt', href: '/disburse' },
  { who: 'Người quyên góp', what: 'Xem ai đã duyệt, tiền đi đâu', href: '/public' },
]

export default function HomePage() {
  const { user } = useTide()
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold">ReliefCloak</h1>
        <p className="mt-2 text-slate-600">
          Người dân báo cáo nhu cầu, admin đăng tin và các bên cùng xem xét hồ sơ cứu trợ.
          Đăng bài không cấp quyền giải ngân. Bản hiện tại mô phỏng việc chi tiền;
          phê duyệt trong ứng dụng chưa phải chữ ký Tide cho từng giao dịch.
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
