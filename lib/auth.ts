import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AppRole = 'admin' | 'manager' | 'executive'

export async function getViewer() {
  const supabase = await createClient()
  const { data: claimsData, error } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (error || !claims?.sub) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, active, team_id, operator_id')
    .eq('id', claims.sub)
    .single()

  if (!profile || profile.active === false) return null
  return {
    id: String(claims.sub),
    email: typeof claims.email === 'string' ? claims.email : '',
    profile: profile as {
      id: string
      full_name: string | null
      role: AppRole
      active: boolean
      team_id: string | null
      operator_id: string | null
    },
  }
}

export async function requireViewer() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login')
  return viewer
}

export async function requireRole(roles: AppRole[]) {
  const viewer = await requireViewer()
  if (!roles.includes(viewer.profile.role)) redirect('/dashboard')
  return viewer
}
