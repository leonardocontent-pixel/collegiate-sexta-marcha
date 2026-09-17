'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'

export async function bootstrapSignup(formData: FormData) {
  const full_name = String(formData.get('full_name') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')

  if (!full_name || !email || password.length < 8) {
    redirect('/bootstrap?error=Preencha%20nome,%20e-mail%20e%20uma%20senha%20de%20pelo%20menos%208%20caracteres.')
  }

  const supabase = await createClient()
  const site = getSiteUrl()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
      emailRedirectTo: `${site}/auth/callback?next=/bootstrap/promote`,
    },
  })

  if (error) redirect(`/bootstrap?error=${encodeURIComponent(error.message)}`)

  // Quando o projeto está com confirmação automática, signUp normalmente devolve
  // uma sessão. Nesse caso concluímos o bootstrap imediatamente.
  if (data.session) redirect('/bootstrap/promote')

  // Alguns projetos podem confirmar o usuário imediatamente sem devolver a sessão
  // no signUp. Tentamos autenticar com a senha recém-criada antes de pedir que o
  // usuário confirme o e-mail. Se a confirmação realmente for obrigatória, esta
  // tentativa apenas falha e seguimos para a mensagem de confirmação.
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (!signInError && signInData.session) redirect('/bootstrap/promote')

  redirect('/bootstrap?sent=1')
}
