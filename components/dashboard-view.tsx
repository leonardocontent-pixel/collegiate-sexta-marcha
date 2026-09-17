import Image from 'next/image'
import Link from 'next/link'
import { brl, pct } from '@/lib/format'

const levels = [
  {name:'Meta', threshold:2500000, reward:'Kart', tag:'Cumprido'},
  {name:'Super', threshold:3500000, reward:'P2', tag:'Cumprido'},
  {name:'Hiper', threshold:5000000, reward:'P3 + Óculos', tag:'Cumprido'},
  {name:'Suprema', threshold:7000000, reward:'Turbinada', tag:'Objetivo atual'},
]

export default function DashboardView({ data }: { data:any }) {
  const { campaign, summary, operators } = data
  const target = Number(campaign.target_vgv || 7000000)
  const confirmed = Number(summary.confirmed_vgv || 0)
  const progress = Math.min(100, target ? confirmed / target * 100 : 0)

  return (
    <div className="content max">
      <section className="hero">
        <div className="hero-content">
          <div className="kicker">FORÇA DE VENDAS · RESULTADOS REAIS</div>
          <h1>Operação<br/><span>Sexta Marcha</span></h1>
          <p>{campaign.subtitle || 'Disciplina. Estratégia. Execução. Juntos por um único objetivo: acelerar resultados.'}</p>
          <div className="hero-actions"><Link className="primary-btn" href="#briefing">Ver missão ativa →</Link><Link className="ghost-btn" href="/loadout">Configurar loadout</Link></div>
        </div>
        <div className="mission-strip"><div className="label">MISSÃO ATIVA</div><strong>Bater o recorde e conquistar novos territórios.</strong><p>Meta da temporada: {brl(target)} · Vigência até {new Date(campaign.end_date).toLocaleDateString('pt-BR')}</p></div>
      </section>

      <div className="section-head"><h2>Níveis da <b>Operação</b></h2><div className="line"/><div className="meta">um objetivo · quatro marcos</div></div>
      <div className="level-grid">
        {levels.map((l,i) => {
          const done = confirmed >= l.threshold
          const active = !done && (i === 0 || confirmed >= levels[i-1].threshold) || l.name === 'Suprema'
          return <div className={`level-card ${done?'done':''} ${active&&!done?'active':''}`} key={l.name}>
            <div className="level-index">0{i+1}</div><div className="level-name">{l.name}</div><div className="level-reward">{brl(l.threshold)} · {l.reward}</div><div className="level-status">{done?'✓ Cumprido':l.tag}</div>
          </div>
        })}
      </div>

      <div className="section-head" id="briefing"><h2>Briefing da <b>Operação</b></h2><div className="line"/><div className="meta">dados em tempo real</div></div>
      <div className="stat-grid">
        <div className="stat-card"><div className="label">VGV confirmado</div><div className="value">{brl(summary.confirmed_vgv)}</div><div className="hint">{summary.signed_contracts} contratos assinados</div></div>
        <div className="stat-card amber"><div className="label">Aguardando confirmação</div><div className="value">{brl(summary.pending_vgv)}</div><div className="hint">não avança a meta</div></div>
        <div className="stat-card"><div className="label">VGV total</div><div className="value">{brl(summary.total_vgv)}</div><div className="hint">{summary.total_sales} vendas · {summary.total_units} unidades</div></div>
        <div className="stat-card"><div className="label">Operadores em campo</div><div className="value">{summary.active_operators}</div><div className="hint">{summary.decorated_operators} condecorados</div></div>
      </div>
      <div className="progress-card"><div className="progress-row"><span>AVANÇO → META SUPREMA</span><span>{brl(confirmed)} / {brl(target)} · {pct(progress)}</span></div><div className="progress-track"><div className="progress-fill" style={{width:`${progress}%`}}/></div></div>

      <div className="section-head"><h2>Seu <b>Esquadrão</b></h2><div className="line"/><div className="meta">operadores em campo</div></div>
      <div className="squad-grid">
        {operators.slice(0,8).map((op:any, index:number) => <article className="operator-card" key={op.id || op.full_name}>
          <div className="operator-img"><Image src={op.avatar_url || `/assets/operator-${(index%6)+1}.webp`} alt={op.full_name} fill sizes="(max-width: 800px) 50vw, 25vw"/><div className="operator-rank">P{String(index+1).padStart(2,'0')}</div><div className="operator-online"/></div>
          <div className="operator-body"><div className="operator-call">{op.codename || 'OPERADOR'}</div><div className="operator-name">{op.full_name}</div><div className="operator-role">{op.title || op.role || 'Executivo de Vendas'} · {op.team_name || 'ALFA'}</div><div className="operator-stats"><div><strong>{brl(op.vgv)}</strong><small>VGV</small></div><div><strong>{op.sales_count || 0}</strong><small>vendas</small></div></div></div>
        </article>)}
      </div>
      <div className="squad-banner"><div><h3>Unidos somos <span>mais fortes</span></h3><p>Collegiate vendas · pessoas · estratégia · grandes conquistas</p></div></div>
    </div>
  )
}
