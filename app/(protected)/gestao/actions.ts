'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getViewer } from '@/lib/auth'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Chave administrativa do Supabase não configurada no servidor. Configure SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY na Vercel.')
  }
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

async function requireAdminAction() {
  const viewer = await getViewer()
  if (!viewer || viewer.profile.role !== 'admin') throw new Error('Apenas administradores podem gerenciar senhas e criar usuários.')
  return viewer
}

export async function createManagedUser(input: {
  fullName: string
  email: string
  password: string
  role: 'admin' | 'manager' | 'executive'
  teamId: string | null
}) {
  try {
    await requireAdminAction()
    const fullName = String(input.fullName || '').trim()
    const email = String(input.email || '').trim().toLowerCase()
    const password = String(input.password || '')
    const role = input.role || 'executive'
    const teamId = input.teamId || null
    if (!fullName || !email) return { ok: false, error: 'Informe nome e e-mail.' }
    if (password.length < 8) return { ok: false, error: 'A senha inicial deve ter pelo menos 8 caracteres.' }

    const admin = getAdminClient()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (error) return { ok: false, error: error.message }
    if (!data.user) return { ok: false, error: 'O Supabase não retornou o usuário criado.' }

    const { error: profileError } = await admin.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      email,
      role,
      team_id: teamId,
      active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id).catch(() => undefined)
      return { ok: false, error: `Usuário não concluído: ${profileError.message}` }
    }

    return { ok: true, userId: data.user.id }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Falha ao criar usuário.' }
  }
}

export async function resetManagedUserPassword(input: { userId: string; password: string }) {
  try {
    await requireAdminAction()
    const userId = String(input.userId || '')
    const password = String(input.password || '')
    if (!userId) return { ok: false, error: 'Usuário inválido.' }
    if (password.length < 8) return { ok: false, error: 'A nova senha deve ter pelo menos 8 caracteres.' }
    const admin = getAdminClient()
    const { error } = await admin.auth.admin.updateUserById(userId, { password, email_confirm: true })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Falha ao redefinir senha.' }
  }
}
