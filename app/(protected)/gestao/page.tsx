import { createClient } from '@/lib/supabase/server'
import { getRegisteredExecutives } from '@/lib/data'
import { OperatorCard } from '@/components/operator-card'

export const dynamic='force-dynamic'

export default async function SquadPage({searchParams}:{searchParams:Promise<{team?:string}>}){
  const params=await searchParams
  const supabase=await createClient()
  const [operators,{data:teams}]=await Promise.all([
    getRegisteredExecutives(),
    supabase.from('teams').select('id,name,slug').eq('active',true).order('name'),
  ])
  const filtered=(operators||[]).filter((o:any)=>!params.team||o.team_name===params.team)
  return <div className="content max"><div className="page-kicker">OPERAÇÃO RESULTADO // EXECUTIVOS CADASTRADOS</div><h1 className="page-title">Esquadrão</h1><p className="page-sub">Aqui aparecem somente usuários ativos com perfil Executivo de Vendas. Ranking e VGV consideram exclusivamente vendas aprovadas.</p>
    <div className="section-head"><h2>Squads da <b>Operação</b></h2><div className="line"/><div className="meta">filtre os executivos</div></div><div className="toolbar"><div className="filters"><a className={!params.team?'primary-btn':'ghost-btn'} href="/esquadrao">Todos</a>{(teams||[]).map((t:any)=><a key={t.id} className="ghost-btn" href={`/esquadrao?team=${encodeURIComponent(t.name)}`}>{t.name}</a>)}</div></div>
    <div className="squad-grid">{filtered.map((op:any,index:number)=><OperatorCard key={op.id} op={op} index={index} />)}</div>
    {!filtered.length&&<div className="empty-warroom">Nenhum executivo cadastrado neste squad.</div>}
  </div>
}
