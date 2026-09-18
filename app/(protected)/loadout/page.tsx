import LoadoutConfigurator from '@/components/loadout-configurator'
import { requireViewer } from '@/lib/auth'
import { getLoadoutProfile } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function LoadoutPage(){
  const viewer=await requireViewer()
  const {profile,loadouts,teams,avatarUrl}=await getLoadoutProfile(viewer.id)
  return <div className="content max"><div className="page-kicker">OPERADOR // CONFIGURAÇÃO</div><h1 className="page-title">Meu Loadout</h1><p className="page-sub">Escolha a classe, monte o visual tático, defina o codinome e enquadre seu rosto para criar um avatar estilo mini crack com acabamento mais visual e interativo.</p><LoadoutConfigurator userId={viewer.id} initialProfile={profile} dbLoadouts={loadouts} teams={teams} initialAvatarUrl={avatarUrl}/></div>
}
