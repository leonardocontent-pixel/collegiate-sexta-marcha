import Link from 'next/link'
import { brl, pct } from '@/lib/format'
import LiveRefresh from '@/components/live-refresh'
import { OperatorCard, OperatorScene, SalesMarks, classLabel } from '@/components/operator-card'

const levels=[
  {name:'Meta',threshold:2500000,reward:'Kart',tone:'bronze',code:'Frag',badge:'/assets/badge-meta-grenade.png',weapon:'Granada de impacto'},
  {name:'Super',threshold:3500000,reward:'P2',tone:'silver',code:'Breach',badge:'/assets/badge-super-c4.png',weapon:'Carga C4'},
  {name:'Hiper',threshold:5000000,reward:'P3 + Óculos',tone:'gold',code:'Strike',badge:'/assets/badge-hiper-missile.png',weapon:'Míssil guiado'},
  {name:'Suprema',threshold:7000000,reward:'Turbinada',tone:'elite',code:'Omega',badge:'/assets/badge-suprema-nuke.png',weapon:'Bomba atômica'},
]

const DUST_PARTICLES = [
  { x: '6%', y: '12%', size: 3, duration: 16, delay: -2 },
  { x: '14%', y: '70%', size: 5, duration: 22, delay: -9 },
  { x: '20%', y: '30%', size: 2, duration: 14, delay: -5 },
  { x: '27%', y: '82%', size: 4, duration: 18, delay: -7 },
  { x: '36%', y: '20%', size: 3, duration: 15, delay: -4 },
  { x: '44%', y: '60%', size: 6, duration: 25, delay: -8 },
  { x: '53%', y: '10%', size: 2, duration: 13, delay: -6 },
  { x: '61%', y: '76%', size: 4, duration: 21, delay: -10 },
  { x: '69%', y: '28%', size: 3, duration: 19, delay: -3 },
  { x: '76%', y: '52%', size: 5, duration: 24, delay: -12 },
  { x: '84%', y: '14%', size: 2, duration: 12, delay: -1 },
  { x: '91%', y: '66%', size: 4, duration: 17, delay: -11 },
  { x: '11%', y: '48%', size: 3, duration: 20, delay: -15 },
  { x: '32%', y: '42%', size: 2, duration: 11, delay: -13 },
  { x: '58%', y: '38%', size: 3, duration: 18, delay: -14 },
  { x: '88%', y: '40%', size: 2, duration: 16, delay: -16 },
]

export default function DashboardView({data}:{data:any}){
  const {campaign,summary,operators,feed}=data
  const target=Number(campaign.target_vgv||7000000),confirmed=Number(summary.confirmed_vgv||0),progress=Math.min(100,target?confirmed/target*100:0)
  const top3=operators.slice(0,3),mvp=top3[0]
  return <div className="content max warroom-dashboard">
    <div className="dust-field" aria-hidden="true">{DUST_PARTICLES.map((p,index)=><span key={index} className="dust-particle" style={{left:p.x,top:p.y,width:`${p.size}px`,height:`${p.size}px`,animationDuration:`${p.duration}s`,animationDelay:`${p.delay}s`}}/> )}</div>
    <div className="warroom-livebar"><div><span>OPERAÇÃO RESULTADO</span><small>painel de guerra comercial · resultados aprovados</small></div><LiveRefresh/></div>

    <section className="hero animated-hero"><div className="hero-scan"/><div className="hero-content"><div className="kicker">FORÇA DE VENDAS · RESULTADOS REAIS</div><h1>Operação<br/><span>Resultado</span></h1><p>{campaign.subtitle||'Quem executa, vende. Pessoas, processos, vendas e crescimento juntos por um único objetivo: acelerar resultados.'}</p><div className="hero-actions"><Link className="primary-btn" href="/vendas">Registrar venda →</Link><Link className="ghost-btn" href="/loadout">Configurar loadout</Link></div></div><div className="mission-strip"><div className="label">MISSÃO ATIVA</div><strong>Quem executa, vende.</strong><p>Meta da temporada: {brl(target)} · Vigência até {new Date(campaign.end_date+'T12:00:00').toLocaleDateString('pt-BR')}</p></div></section>

    <div className="section-head top-three-head"><h2>Top 3 da <b>Operação</b></h2><div className="line"/><div className="meta">ranking somente de executivos cadastrados</div></div>
    {operators.length?<div className="top-three-grid">
      {mvp&&<article className="mvp-card"><div className="mvp-aura"/><div className="mvp-rank">1º</div><div className="mvp-crown">MVP</div><div className="mvp-image"><OperatorScene op={mvp} variant="mvp"/></div><div className="mvp-copy"><div className="mvp-squad">{mvp.team_name||'SEM SQUAD'} · {classLabel(mvp)}</div><h3>{mvp.codename||mvp.full_name}</h3><strong>{mvp.full_name}</strong><div className="mvp-vgv">{brl(mvp.vgv)}</div><div className="mvp-sales">{mvp.sales_count||0} vendas aprovadas</div><SalesMarks salesCount={mvp.sales_count||0} /></div></article>}
      {top3.slice(1).map((op:any,index:number)=><article className="podium-card" key={op.id}><div className="podium-rank">{index+2}º</div><div className="podium-image"><OperatorScene op={op} variant="podium"/></div><div className="podium-copy"><span>{op.team_name||'SEM SQUAD'} · {classLabel(op)}</span><h3>{op.codename||op.full_name}</h3><strong>{op.full_name}</strong><b>{brl(op.vgv)}</b><small>{op.sales_count||0} vendas</small><SalesMarks salesCount={op.sales_count||0} compact /></div></article>)}
    </div>:<div className="empty-warroom">Nenhum executivo cadastrado ainda. Cadastre os executivos em Gestão para iniciar o ranking em tempo real.</div>}

    <div className="section-head"><h2>Metas e <b>Insígnias</b></h2><div className="line"/><div className="meta">um objetivo · quatro condecorações</div></div>
    <div className="badge-level-grid">{levels.map((level,index)=>{const done=confirmed>=level.threshold;const current=!done&&(index===0||confirmed>=levels[index-1].threshold);return <div className={`badge-level ${level.tone} ${done?'done':''} ${current?'current':''}`} key={level.name}><div className="insignia"><img src={level.badge} alt={`Insígnia ${level.name}`} /></div><div><div className="level-name">{level.name}</div><div className="level-reward">{brl(level.threshold)} · {level.reward}</div><div className="level-weapon">{level.code} // {level.weapon}</div><div className="level-status">{done?'✓ INSÍGNIA CONQUISTADA':current?'OBJETIVO ATUAL':'BLOQUEADA'}</div></div></div>})}</div>

    <div className="section-head" id="briefing"><h2>Briefing da <b>Operação</b></h2><div className="line"/><div className="meta">dados aprovados em tempo real</div></div>
    <div className="stat-grid"><div className="stat-card"><div className="label">VGV aprovado</div><div className="value">{brl(summary.confirmed_vgv)}</div><div className="hint">{summary.approved_sales||0} vendas aprovadas</div></div><div className="stat-card amber"><div className="label">Aguardando aprovação</div><div className="value">{brl(summary.pending_vgv)}</div><div className="hint">{summary.pending_sales||0} envios pendentes</div></div><div className="stat-card"><div className="label">VGV em operação</div><div className="value">{brl(summary.total_vgv)}</div><div className="hint">aprovado + pendente</div></div><div className="stat-card"><div className="label">Executivos cadastrados</div><div className="value">{summary.active_executives||operators.length}</div><div className="hint">somente perfis Executivo ativos</div></div></div>
    <div className="progress-card war-progress"><div className="progress-row"><span>AVANÇO → META SUPREMA</span><span>{brl(confirmed)} / {brl(target)} · {pct(progress)}</span></div><div className="progress-track"><div className="progress-fill animated-progress" style={{width:`${progress}%`}}/></div></div>

    <div className="warroom-columns">
      <section><div className="section-head"><h2>Esquadrão <b>Completo</b></h2><div className="line"/><div className="meta">{operators.length} executivos</div></div><div className="squad-grid compact-squad">{operators.map((op:any,index:number)=><OperatorCard key={op.id} op={op} index={index} showPending={false} />)}</div></section>
      <aside className="live-feed-panel"><div className="section-head"><h2>Feed <b>Ao Vivo</b></h2><div className="line"/></div><div className="live-feed-list">{(feed||[]).map((item:any)=><div className={`feed-item ${item.approval_status}`} key={item.id}><span className="feed-dot"/><div><strong>{item.profiles?.full_name||'Executivo'}</strong><small>{item.approval_status==='approved'?'venda aprovada':item.approval_status==='pending'?'venda aguardando aprovação':'registro rejeitado'} · {item.development}</small></div><b>{brl(item.vgv)}</b></div>)}{!(feed||[]).length&&<div className="feed-empty">As novas vendas aparecerão aqui assim que forem enviadas.</div>}</div></aside>
    </div>

    <div className="warroom-ticker"><span>QUEM EXECUTA, VENDE</span><i/> <span>PESSOAS · PROCESSOS · VENDAS</span><i/> <span>CRESCIMENTO EM TEMPO REAL</span><i/> <span>MENFE</span></div>
  </div>
}
