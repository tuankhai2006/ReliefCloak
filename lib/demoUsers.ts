// A fixed local demonstration directory, not an authentication mechanism.
export const DEMO_USERS = [
  { id: 'resident-1', name: 'An (Người dân)', roles: ['appUser'] },
  { id: 'resident-2', name: 'Bình (Người dân)', roles: ['appUser'] },
  { id: 'fw-1', name: 'Lan (Field Worker)', roles: ['field_worker', '_tide_payout.selfencrypt'] },
  { id: 'org-1', name: 'Minh (Chủ quỹ)', roles: ['org_admin'] },
  { id: 'aud-1', name: 'Hà (Auditor)', roles: ['auditor'] },
  { id: 'off-1', name: 'Tuấn (Officer)', roles: ['disburser', '_tide_payout.selfdecrypt'] },
]
