import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { brl } from '@/lib/format'
import { getRegisteredExecutives } from '@/lib/data'

export const dynamic='force-dynamic'

export default async function SquadPage({searchParams}:{searchParams:Promise<{team?:string}>}){
  const params=await searchParams
  const supabase=await createClient()
  const [operators,{data:teams}]=await Promise.all([
    getRegisteredExecutives(),
    supabase.from('teams').select('id,name,slug').eq('active',true).order('name'),
  ])
  const filtered=(operators||[]).filter((o:any)=>!params.team||o.team_name===params.team)
  return <div className="content max"><div className="page-kicker">COLLEGIATE VENDAS // EXECUTIVOS CADASTRADOS</div><h1 className="page-title">Esquadrão</h1><p className="page-sub">Aqui aparecem somente usuários ativos com perfil Executivo de Vendas. Ranking e VGV consideram exclusivamente vendas aprovadas.</p>
    <div className="section-head"><h2>Squads da <b>Operação</b></h2><div className="line"/><div className="meta">filtre os executivos</div></div><div className="toolbar"><div className="filters"><a className={!params.team?'primary-btn':'ghost-btn'} href="/esquadrao">Todos</a>{(teams||[]).map((t:any)=><a key={t.id} className="ghost-btn" href={`/esquadrao?team=${encodeURIComponent(t.name)}`}>{t.name}</a>)}</div></div>
    <div className="squad-grid">{filtered.map((op:any,index:number)=><article className={`operator-card ${index===0?'leader-card':''}`} key={op.id}><div className="operator-img"><Image src={op.avatar_url||`/assets/operator-${(index%6)+1}.webp`} fill sizes="25vw" alt={op.full_name}/><div className="operator-rank">P{String(index+1).padStart(2,'0')}</div><div className="operator-online"/></div><div className="operator-body"><div className="operator-call">{op.codename}</div><div className="operator-name">{op.full_name}</div><div className="operator-role">{op.title} · {op.team_name||'SEM SQUAD'}</div><div className="operator-stats"><div><strong>{brl(op.vgv)}</strong><small>VGV aprovado</small></div><div><strong>{op.sales_count}</strong><small>vendas</small></div></div>{Number(op.pending_count)>0&&<div className="pending-mini">{op.pending_count} aguardando aprovação</div>}</div></article>)}</div>
    {!filtered.length&&<div className="empty-warroom">Nenhum executivo cadastrado neste squad.</div>}
  </div>
}
