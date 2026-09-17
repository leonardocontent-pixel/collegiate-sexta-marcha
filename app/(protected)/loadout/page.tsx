import LoadoutConfigurator from '@/components/loadout-configurator'
import { requireViewer } from '@/lib/auth'
import { getLoadoutProfile } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function LoadoutPage(){
  const viewer=await requireViewer()
  const {profile,loadouts,avatarUrl}=await getLoadoutProfile(viewer.id)
  return <div className="content max"><div className="page-kicker">OPERADOR // CONFIGURAÇÃO</div><h1 className="page-title">Meu Loadout</h1><p className="page-sub">Escolha uma das quatro configurações, envie sua foto e ajuste o corte para criar o avatar militar com a identidade da operação.</p><LoadoutConfigurator userId={viewer.id} initialProfile={profile} dbLoadouts={loadouts} initialAvatarUrl={avatarUrl}/></div>
}
