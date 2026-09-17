import AppShell from '@/components/app-shell'
import { requireViewer } from '@/lib/auth'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer()
  return <AppShell viewer={{ fullName: viewer.profile.full_name || viewer.email || 'Operador', role: viewer.profile.role }}>{children}</AppShell>
}
