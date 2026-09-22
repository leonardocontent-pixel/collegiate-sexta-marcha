import DashboardView from '@/components/dashboard-view'
import { requireViewer } from '@/lib/auth'
import { getDashboardData } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const viewer = await requireViewer()
  const data = await getDashboardData(viewer.id)
  return <DashboardView data={data} />
}
