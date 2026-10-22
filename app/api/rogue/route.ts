// Đóng vai "admin DB gian lận": sửa thẳng database, bỏ qua mọi luật của service.
// Mục đích demo: dù DB bị sửa, STK vẫn không giải mã được và không có lệnh chi hợp lệ.
import { NextResponse } from 'next/server'
import { claimRepo } from '@/models/db'
import type { Claim } from '@/models/claim'

type Attack = 'set-paid' | 'swap-account' | 'fake-claim' | 'reset'

export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_TIDE_MOCK !== 'true' || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Công cụ sửa DB chỉ dành cho demo mock cục bộ' }, { status: 403 })
  }
  const { attack, claimId } = (await req.json()) as { attack: Attack; claimId?: string }
  const target = claimId ? claimRepo.get(claimId) : claimRepo.all()[0]

  switch (attack) {
    case 'set-paid': {
      if (!target) break
      claimRepo.update({ ...target, status: 'PAID', paidAt: new Date().toISOString(), paidBy: 'rogue-admin' })
      return NextResponse.json({ ok: true, claimId: target.id, message: `Đã sửa ${target.id} thành PAID trong DB` })
    }
    case 'swap-account': {
      if (!target) break
      // Thay ciphertext bằng STK của kẻ gian (dạng plaintext, hoặc ciphertext bị chỉnh sửa)
      const tampered = target.encryptedBankAccount.slice(0, -6) + 'HACKED'
      claimRepo.update({ ...target, encryptedBankAccount: tampered })
      return NextResponse.json({ ok: true, claimId: target.id, message: `Đã ghi đè STK của ${target.id}` })
    }
    case 'fake-claim': {
      const fake: Claim = {
        id: 'c-fake-' + Date.now(),
        victimName: 'Nguyễn Văn Ma',
        region: 'Phong Điền, Huế',
        amount: 50000000,
        gps: '0, 0',
        photoUrl: '/photos/flood-1.svg',
        description: 'Claim được chèn thẳng vào DB',
        createdBy: 'rogue-admin',
        createdByName: 'rogue-admin',
        createdAt: new Date().toISOString(),
        encryptedBankAccount: '9999888877776666',
        encryptedNationalId: '000000000000',
        approvals: [
          { userId: 'rogue', userName: 'rogue', role: 'org_admin', at: new Date().toISOString() },
          { userId: 'rogue', userName: 'rogue', role: 'auditor', at: new Date().toISOString() },
        ],
        status: 'APPROVED',
      }
      claimRepo.insert(fake)
      return NextResponse.json({ ok: true, claimId: fake.id, message: 'Đã chèn claim ma đã "duyệt sẵn"' })
    }
    case 'reset':
      claimRepo.reset()
      return NextResponse.json({ ok: true, message: 'Đã khôi phục DB mẫu' })
  }
  return NextResponse.json({ ok: false, message: 'Không có claim để tấn công' }, { status: 400 })
}
