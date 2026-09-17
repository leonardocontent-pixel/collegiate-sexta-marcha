import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/dashboard'
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next.startsWith('/') ? next : '/dashboard', req.url))
  }
  return NextResponse.redirect(new URL('/login?error=Falha%20ao%20confirmar%20acesso', req.url))
}
