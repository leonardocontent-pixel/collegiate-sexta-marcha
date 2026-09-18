import Image from 'next/image'
import { login, sendMagicLink } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string; sent?: string }> }) {
  const params = await searchParams
  return (
    <div className="login-page">
      <section className="login-art">
        <div className="login-copy">
          <div className="eyebrow">MENFE // OPERAÇÃO ATIVA</div>
          <h1>Operação<br/>Resultado</h1>
          <p>Quem executa, vende. Pessoas, processos, vendas e crescimento no mesmo campo de batalha.</p>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-box">
          <Image className="brand" src="/logo-menfe-white.png" width={316} height={160} alt="Menfe" />
          <h2>Acesse sua conta</h2>
          <p>Entre no centro de operações para acompanhar metas, registrar vendas, configurar seu loadout e comandar o esquadrão comercial.</p>
          <input type="hidden" name="next" value={params.next || '/dashboard'} />
          <div className="field"><label>E-mail</label><input type="email" name="email" required autoComplete="email" placeholder="seuemail@menfe.com" /></div>
          <div className="field"><label>Senha</label><input type="password" name="password" autoComplete="current-password" placeholder="••••••••" /></div>
          <button className="primary-btn wide" formAction={login}>Entrar na operação →</button>
          <button className="ghost-btn wide" style={{marginTop:8}} formAction={sendMagicLink}>Receber link de acesso por e-mail</button>
          {params.sent && <div className="form-msg">Link enviado. Confira seu e-mail.</div>}
          {params.error && <div className="form-msg">{params.error}</div>}
        </form>
      </section>
    </div>
  )
}
