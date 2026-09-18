import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { brl } from '@/lib/format'
import { getOperatorRoster } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function SquadPage({ searchParams }: { searchParams: Promise<{ team?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const [operators, { data: teams }] = await Promise.all([
    getOperatorRoster(),
    supabase.from('teams').select('id,name,slug').eq('active', true).order('name'),
  ])
  const filtered = (operators || []).filter((o:any) => !params.team || o.team_name === params.team)
  return <div className="content max">
    <div className="page-kicker">COLLEGIATE VENDAS // FORÇA DE CAMPO</div>
    <h1 className="page-title">Esquadrão</h1>
    <p className="page-sub">Visão geral dos operadores, divisão por time e desempenho acumulado dentro da operação ativa.</p>

    <div className="section-head"><h2>Times da <b>Operação</b></h2><div className="line"/><div className="meta">filtre o esquadrão</div></div>
    <div className="toolbar"><div className="filters">
      <a className={!params.team ? 'primary-btn' : 'ghost-btn'} href="/esquadrao">Todos</a>
      {(teams || []).map((t:any)=><a key={t.id} className="ghost-btn" href={`/esquadrao?team=${encodeURIComponent(t.name)}`}>{t.name}</a>)}
    </div></div>

    <div className="squad-grid">
      {filtered.map((op:any,index:number)=>{
        const avatar=op.avatar_url || `/assets/operator-${(index%6)+1}.webp`
        return <article className="operator-card" key={op.id}>
          <div className="operator-img"><Image src={avatar} fill sizes="25vw" alt={op.full_name}/><div className="operator-rank">P{String(index+1).padStart(2,'0')}</div><div className="operator-online"/></div>
          <div className="operator-body"><div className="operator-call">{op.codename}</div><div className="operator-name">{op.full_name}</div><div className="operator-role">{op.title} · {op.team_name || 'SEM TIME'}</div><div className="operator-stats"><div><strong>{brl(op.vgv)}</strong><small>VGV</small></div><div><strong>{op.sales_count}</strong><small>vendas</small></div></div></div>
        </article>
      })}
    </div>
    <div className="squad-banner"><div><h3>Unidos somos <span>mais fortes</span></h3><p>disciplina · foco · resultado</p></div></div>
  </div>
}
