import Link from 'next/link'
import { brl, pct } from '@/lib/format'
import LiveRefresh from '@/components/live-refresh'

const levels=[
  {name:'Meta',threshold:2500000,reward:'Kart',tone:'bronze',glyph:'I'},
  {name:'Super',threshold:3500000,reward:'P2',tone:'silver',glyph:'II'},
  {name:'Hiper',threshold:5000000,reward:'P3 + Óculos',tone:'gold',glyph:'III'},
  {name:'Suprema',threshold:7000000,reward:'Turbinada',tone:'elite',glyph:'IV'},
]

const LOADOUT_ART:Record<string,{src:string;face:{left:number;top:number;width:number;height:number};label:string}> = {
  assault:{src:'/assets/loadout-assault.webp',face:{left:36.65,top:13.60,width:25.23,height:17.82},label:'Breacher'},
  sniper:{src:'/assets/loadout-precision.webp',face:{left:39.13,top:12.71,width:21.64,height:15.19},label:'Marksman'},
  recon:{src:'/assets/loadout-recon.webp',face:{left:39.04,top:12.02,width:21.55,height:15.75},label:'Scout'},
  support:{src:'/assets/loadout-support.webp',face:{left:39.23,top:11.95,width:21.45,height:15.33},label:'Guardian'},
  commander:{src:'/assets/loadout-support.webp',face:{left:39.23,top:11.95,width:21.45,height:15.33},label:'Commander'},
}

const BG_SCENES:Record<string,string> = {
  ridge:'/assets/avatar-bg-ridge.webp',
  city:'/assets/avatar-bg-city.webp',
  command:'/assets/avatar-bg-command.webp',
}

function loadoutConfig(op:any){
  return LOADOUT_ART[op?.selected_loadout || 'assault'] || LOADOUT_ART.assault
}

function classLabel(op:any){
  return op?.title || loadoutConfig(op).label
}

function operatorBg(op:any, variant:'mvp'|'podium'|'card'){
  if(variant==='mvp') return '/assets/mvp-battle-money-bg.webp'
  const key = op?.avatar_crop?.bgScene || 'ridge'
  return BG_SCENES[key] || BG_SCENES.ridge
}

function OperatorScene({op,variant='card'}:{op:any;variant?:'mvp'|'podium'|'card'}){
  const bg=operatorBg(op, variant)
  const finalRender=variant==='mvp' ? op?.render_mvp_url : op?.render_card_url
  return <div className={`operator-scene ${variant} ${finalRender?'has-render':'missing-render'}`}>
    <img className="operator-scene-bg" src={bg} alt="" aria-hidden="true"/>
    <div className="operator-scene-smoke"/>
    {finalRender
      ? <img className={`operator-final-render ${variant}`} src={finalRender} alt={op?.full_name || 'Operador'} />
      : <div className="operator-avatar-missing">
          <span>OPERADOR SEM RENDER</span>
          <strong>CONFIGURAR AVATAR</strong>
          <small>Abra Meu Loadout e salve o operador</small>
        </div>}
    <div className="operator-scene-vignette"/>
    <div className="operator-scene-moneyline"/>
  </div>
}

export default function DashboardView({data}:{data:any}){
  const {campaign,summary,operators,feed}=data
  const target=Number(campaign.target_vgv||7000000),confirmed=Number(summary.confirmed_vgv||0),progress=Math.min(100,target?confirmed/target*100:0)
  const top3=operators.slice(0,3),mvp=top3[0]
  return <div className="content max warroom-dashboard">
    <div className="warroom-livebar"><div><span>OPERAÇÃO SEXTA MARCHA</span><small>painel de guerra comercial · resultados aprovados</small></div><LiveRefresh/></div>

    <section className="hero animated-hero"><div className="hero-scan"/><div className="hero-content"><div className="kicker">FORÇA DE VENDAS · RESULTADOS REAIS</div><h1>Operação<br/><span>Sexta Marcha</span></h1><p>{campaign.subtitle||'Disciplina. Estratégia. Execução. Juntos por um único objetivo: acelerar resultados.'}</p><div className="hero-actions"><Link className="primary-btn" href="/vendas">Registrar venda →</Link><Link className="ghost-btn" href="/loadout">Configurar loadout</Link></div></div><div className="mission-strip"><div className="label">MISSÃO ATIVA</div><strong>Bater o recorde e conquistar novos territórios.</strong><p>Meta da temporada: {brl(target)} · Vigência até {new Date(campaign.end_date+'T12:00:00').toLocaleDateString('pt-BR')}</p></div></section>

    <div className="section-head top-three-head"><h2>Top 3 da <b>Operação</b></h2><div className="line"/><div className="meta">ranking somente de executivos cadastrados</div></div>
    {operators.length?<div className="top-three-grid">
      {mvp&&<article className="mvp-card"><div className="mvp-aura"/><div className="mvp-rank">1º</div><div className="mvp-crown">MVP</div><div className="mvp-image"><OperatorScene op={mvp} variant="mvp"/></div><div className="mvp-copy"><div className="mvp-squad">{mvp.team_name||'SEM SQUAD'} · {classLabel(mvp)}</div><h3>{mvp.codename||mvp.full_name}</h3><strong>{mvp.full_name}</strong><div className="mvp-vgv">{brl(mvp.vgv)}</div><div className="mvp-sales">{mvp.sales_count||0} vendas aprovadas</div></div></article>}
      {top3.slice(1).map((op:any,index:number)=><article className="podium-card" key={op.id}><div className="podium-rank">{index+2}º</div><div className="podium-image"><OperatorScene op={op} variant="podium"/></div><div className="podium-copy"><span>{op.team_name||'SEM SQUAD'} · {classLabel(op)}</span><h3>{op.codename||op.full_name}</h3><strong>{op.full_name}</strong><b>{brl(op.vgv)}</b><small>{op.sales_count||0} vendas</small></div></article>)}
    </div>:<div className="empty-warroom">Nenhum executivo cadastrado ainda. Cadastre os executivos em Gestão para iniciar o ranking em tempo real.</div>}

    <div className="section-head"><h2>Metas e <b>Insígnias</b></h2><div className="line"/><div className="meta">um objetivo · quatro condecorações</div></div>
    <div className="badge-level-grid">{levels.map((level,index)=>{const done=confirmed>=level.threshold;const current=!done&&(index===0||confirmed>=levels[index-1].threshold);return <div className={`badge-level ${level.tone} ${done?'done':''} ${current?'current':''}`} key={level.name}><div className="insignia"><span>{level.glyph}</span><i/></div><div><div className="level-name">{level.name}</div><div className="level-reward">{brl(level.threshold)} · {level.reward}</div><div className="level-status">{done?'✓ INSÍGNIA CONQUISTADA':current?'OBJETIVO ATUAL':'BLOQUEADA'}</div></div></div>})}</div>

    <div className="section-head" id="briefing"><h2>Briefing da <b>Operação</b></h2><div className="line"/><div className="meta">dados aprovados em tempo real</div></div>
    <div className="stat-grid"><div className="stat-card"><div className="label">VGV aprovado</div><div className="value">{brl(summary.confirmed_vgv)}</div><div className="hint">{summary.approved_sales||0} vendas aprovadas</div></div><div className="stat-card amber"><div className="label">Aguardando aprovação</div><div className="value">{brl(summary.pending_vgv)}</div><div className="hint">{summary.pending_sales||0} envios pendentes</div></div><div className="stat-card"><div className="label">VGV em operação</div><div className="value">{brl(summary.total_vgv)}</div><div className="hint">aprovado + pendente</div></div><div className="stat-card"><div className="label">Executivos cadastrados</div><div className="value">{summary.active_executives||operators.length}</div><div className="hint">somente perfis Executivo ativos</div></div></div>
    <div className="progress-card war-progress"><div className="progress-row"><span>AVANÇO → META SUPREMA</span><span>{brl(confirmed)} / {brl(target)} · {pct(progress)}</span></div><div className="progress-track"><div className="progress-fill animated-progress" style={{width:`${progress}%`}}/></div></div>

    <div className="warroom-columns">
      <section><div className="section-head"><h2>Esquadrão <b>Completo</b></h2><div className="line"/><div className="meta">{operators.length} executivos</div></div><div className="squad-grid compact-squad">{operators.map((op:any,index:number)=><article className={`operator-card ${index===0?'leader-card':''}`} key={op.id}><div className="operator-img operator-avatar-shell"><OperatorScene op={op} variant="card"/><div className="operator-rank">P{String(index+1).padStart(2,'0')}</div><div className="operator-online"/></div><div className="operator-body"><div className="operator-call">{op.codename||'OPERADOR'}</div><div className="operator-name">{op.full_name}</div><div className="operator-role">{classLabel(op)} · {op.team_name||'SEM SQUAD'}</div><div className="operator-stats"><div><strong>{brl(op.vgv)}</strong><small>VGV</small></div><div><strong>{op.sales_count||0}</strong><small>vendas</small></div></div></div></article>)}</div></section>
      <aside className="live-feed-panel"><div className="section-head"><h2>Feed <b>Ao Vivo</b></h2><div className="line"/></div><div className="live-feed-list">{(feed||[]).map((item:any)=><div className={`feed-item ${item.approval_status}`} key={item.id}><span className="feed-dot"/><div><strong>{item.profiles?.full_name||'Executivo'}</strong><small>{item.approval_status==='approved'?'venda aprovada':item.approval_status==='pending'?'venda aguardando aprovação':'registro rejeitado'} · {item.development}</small></div><b>{brl(item.vgv)}</b></div>)}{!(feed||[]).length&&<div className="feed-empty">As novas vendas aparecerão aqui assim que forem enviadas.</div>}</div></aside>
    </div>

    <div className="warroom-ticker"><span>DISCIPLINA GERA RESULTADO</span><i/> <span>EXECUÇÃO ACIMA DE DESCULPAS</span><i/> <span>CADA VENDA MOVE A OPERAÇÃO</span><i/> <span>COLLEGIATE VENDAS</span></div>
  </div>
}
