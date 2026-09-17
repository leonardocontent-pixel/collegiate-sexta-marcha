'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'

export async function login(formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const next = String(formData.get('next') || '/dashboard')
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect(`/login?error=${encodeURIComponent('E-mail ou senha inválidos.')}&next=${encodeURIComponent(next)}`)
  redirect(next.startsWith('/') ? next : '/dashboard')
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  const next = String(formData.get('next') || '/dashboard')
  const supabase = await createClient()
  const site = getSiteUrl()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${site}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`)
  redirect(`/login?sent=1&next=${encodeURIComponent(next)}`)
}
