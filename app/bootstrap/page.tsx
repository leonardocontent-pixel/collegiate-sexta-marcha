import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { bootstrapSignup } from './actions'

export const dynamic = 'force-dynamic'

export default async function BootstrapPage({ searchParams }: { searchParams: Promise<{error?:string;sent?:string}> }) {
  const p = await searchParams
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  // Se o usuário já criou a conta e a sessão existe, nunca deixamos a operação
  // parada nesta tela: admin vai ao dashboard; primeiro usuário ainda não promovido
  // segue automaticamente para a etapa de promoção.
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active')
      .eq('id', userId)
      .maybeSingle()

    if (profile?.role === 'admin' && profile.active !== false) redirect('/dashboard')
    if (profile?.active !== false) redirect('/bootstrap/promote')
  }

  return <div className="login-page">
    <section className="login-art"><div className="login-copy"><div className="eyebrow">PRIMEIRO ACESSO // COMANDO</div><h1>Ativar<br/>Operação</h1><p>Crie o primeiro administrador do painel.</p></div></section>
    <section className="login-panel"><form className="login-box" action={bootstrapSignup}>
      <Image className="brand" src="/logo-collegiate-white.png" width={316} height={160} alt="Collegiate Vendas"/>
      <h2>Configuração inicial</h2><p>Use esta tela apenas para criar o primeiro administrador. Depois disso, novos usuários são convidados pela área Gestão.</p>
      <div className="field"><label>Nome completo</label><input name="full_name" required/></div>
      <div className="field"><label>E-mail</label><input name="email" type="email" required/></div>
      <div className="field"><label>Senha</label><input name="password" type="password" minLength={8} required/></div>
      <button className="primary-btn wide">Criar administrador →</button>
      {p.sent&&<div className="form-msg">Conta criada. Confirme o e-mail para concluir a ativação.</div>}
      {p.error&&<div className="form-msg">{p.error}</div>}
    </form></section>
  </div>
}
