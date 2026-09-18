import AccountSecurity from '@/components/account-security'
import { requireViewer } from '@/lib/auth'

export const dynamic='force-dynamic'

export default async function AccountPage(){
  const viewer=await requireViewer()
  return <div className="content max">
    <div className="page-kicker">OPERADOR // CONTA E SEGURANÇA</div>
    <h1 className="page-title">Minha Conta</h1>
    <p className="page-sub">Gerencie suas credenciais pessoais. A senha alterada aqui passa a funcionar diretamente na tela de login.</p>
    <AccountSecurity fullName={viewer.profile.full_name||'Operador'} email={viewer.email||''} role={viewer.profile.role}/>
  </div>
}
