import Image from 'next/image'
import { bootstrapSignup } from './actions'

export default async function BootstrapPage({ searchParams }: { searchParams: Promise<{error?:string;sent?:string}> }) {
  const p = await searchParams
  return <div className="login-page">
    <section className="login-art"><div className="login-copy"><div className="eyebrow">PRIMEIRO ACESSO // COMANDO</div><h1>Ativar<br/>Operação</h1><p>Crie o primeiro administrador da Operação Resultado.</p></div></section>
    <section className="login-panel"><form className="login-box" action={bootstrapSignup}>
      <Image className="brand" src="/logo-menfe-white.png" width={316} height={160} alt="Menfe"/>
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
