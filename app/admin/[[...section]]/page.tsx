import { notFound } from 'next/navigation'
import AdminConsole from '@/components/admin/AdminConsole'
export default async function AdminPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section = [] } = await params
  const view = section[0] || 'overview'
  if (section.length > 1 || !['overview', 'reports', 'campaigns', 'disbursements', 'audit'].includes(view)) notFound()
  return <AdminConsole view={view} />
}
