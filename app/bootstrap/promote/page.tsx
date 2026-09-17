import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function PromoteFirstAdmin(){
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const id = claimsData?.claims?.sub
  if(!id) redirect('/login?error=Faça%20login%20para%20concluir%20a%20ativação')

  const { error } = await supabase
    .from('profiles')
    .update({ role:'admin', active:true, updated_at:new Date().toISOString() })
    .eq('id', id)

  if (error) redirect(`/bootstrap?error=${encodeURIComponent(`Falha ao promover o primeiro administrador: ${error.message}`)}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', id)
    .single()

  if (profile?.role !== 'admin' || profile.active === false) {
    redirect('/bootstrap?error=Conta%20criada,%20mas%20a%20promoção%20para%20administrador%20não%20foi%20concluída.')
  }

  redirect('/dashboard')
}
