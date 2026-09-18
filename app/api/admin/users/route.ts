import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getViewer } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function cleanEnv(value?: string) {
  if (!value) return ''
  let cleaned = value.trim()
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim()
  }
  return cleaned
}

function maskKey(key: string) {
  if (!key) return 'ausente'
  if (key.startsWith('sb_secret_')) return `sb_secret_…${key.slice(-5)}`
  if (key.startsWith('sb_publishable_')) return `sb_publishable_…${key.slice(-5)}`
  if (key.startsWith('eyJ')) return `JWT…${key.slice(-5)}`
  return `${key.slice(0, 6)}…${key.slice(-5)}`
}

function projectRef(url: string) {
  try {
    return new URL(url).hostname.split('.')[0] || 'desconhecido'
  } catch {
    return 'URL inválida'
  }
}

function buildAdminClient(url: string, key: string) {
  return createAdminClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'menfe-operacao-resultado-admin',
      },
    },
  })
}

/**
 * IMPORTANT:
 * Do not manually probe sb_secret_ keys using Authorization: Bearer <sb_secret_...>.
 * Modern Supabase secret keys are API keys, not JWTs.
 * Let supabase-js perform the Admin Auth request using the supported key flow.
 */
async function resolveAdminClient() {
  const url = cleanEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL
  ).replace(/\/+$/, '')

  if (!url) {
    throw new Error('URL do Supabase não encontrada no servidor.')
  }

  const candidates = [
    { name: 'SUPABASE_SECRET_KEY', value: cleanEnv(process.env.SUPABASE_SECRET_KEY) },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) },
  ].filter(item => item.value)

  if (!candidates.length) {
    throw new Error(
      'Nenhuma chave administrativa do Supabase foi encontrada. Configure SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY no servidor.'
    )
  }

  const diagnostics: string[] = []

  for (const candidate of candidates) {
    const key = candidate.value

    if (key.startsWith('sb_publishable_')) {
      diagnostics.push(`${candidate.name}=${maskKey(key)} é uma chave pública e não serve para criar usuários.`)
      continue
    }

    const admin = buildAdminClient(url, key)

    // Validate through the official Admin Auth SDK instead of a custom Bearer probe.
    const test = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })

    if (!test.error) {
      return admin
    }

    diagnostics.push(
      `${candidate.name}=${maskKey(key)} não foi aceita pelo Auth Admin (${test.error.message}).`
    )
  }

  throw new Error(
    `Nenhuma chave administrativa válida foi aceita pelo projeto ${projectRef(url)}. ${diagnostics.join(' ')}`
  )
}

async function requireAdmin() {
  const viewer = await getViewer()
  if (!viewer) {
    return { ok: false as const, status: 401, error: 'Sessão expirada. Entre novamente.' }
  }
  if (viewer.profile.role !== 'admin') {
    return {
      ok: false as const,
      status: 403,
      error: 'Apenas administradores podem criar usuários ou redefinir senhas.',
    }
  }
  return { ok: true as const, viewer }
}

function normalizeError(message: string) {
  const text = (message || '').toLowerCase()
  if (text.includes('already') || text.includes('registered') || text.includes('exists')) {
    return 'Este e-mail já possui um usuário cadastrado.'
  }
  if (text.includes('password')) return `Erro de senha: ${message}`
  if (text.includes('invalid api key')) {
    return 'A chave administrativa configurada no servidor não foi aceita pelo Supabase.'
  }
  return message || 'Falha ao processar o usuário.'
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdmin()
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const fullName = String(body.fullName || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const role = ['admin', 'manager', 'executive'].includes(body.role)
      ? body.role
      : 'executive'
    const teamId = body.teamId ? String(body.teamId) : null

    if (!fullName) {
      return NextResponse.json({ ok: false, error: 'Informe o nome do usuário.' }, { status: 400 })
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Informe um e-mail válido.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: 'A senha inicial deve ter pelo menos 8 caracteres.' },
        { status: 400 }
      )
    }

    const admin = await resolveAdminClient()

    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (created.error) {
      return NextResponse.json(
        { ok: false, error: normalizeError(created.error.message) },
        { status: 400 }
      )
    }

    if (!created.data.user) {
      return NextResponse.json(
        { ok: false, error: 'O Supabase não retornou o usuário criado.' },
        { status: 500 }
      )
    }

    const userId = created.data.user.id
    const profile = await admin.from('profiles').upsert(
      {
        id: userId,
        full_name: fullName,
        email,
        role,
        team_id: teamId,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    if (profile.error) {
      try {
        await admin.auth.admin.deleteUser(userId)
      } catch {}
      return NextResponse.json(
        {
          ok: false,
          error: `O acesso foi criado, mas o perfil não pôde ser concluído: ${profile.error.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, userId })
  } catch (error: any) {
    console.error('[admin/users POST]', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Falha interna ao criar usuário.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const access = await requireAdmin()
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const userId = String(body.userId || '')
    const password = String(body.password || '')

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Usuário inválido.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: 'A nova senha deve ter pelo menos 8 caracteres.' },
        { status: 400 }
      )
    }

    const admin = await resolveAdminClient()
    const updated = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    })

    if (updated.error) {
      return NextResponse.json(
        { ok: false, error: normalizeError(updated.error.message) },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[admin/users PATCH]', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Falha interna ao redefinir senha.' },
      { status: 500 }
    )
  }
}
