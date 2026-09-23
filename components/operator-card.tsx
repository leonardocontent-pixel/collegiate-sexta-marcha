import styles from './operator-sales-goals.module.css'

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

export const SALES_BADGES=[
  { threshold:1, label:'First Blood', src:'/assets/sales-badge-first-blood.png', helper:'1ª venda', motivator:'Missão iniciada com sucesso. Continue pressionando e busque a próxima insígnia.' },
  { threshold:3, label:'Multikill', src:'/assets/sales-badge-3.png', helper:'3 vendas', motivator:'Você engatou o ritmo da operação. Mantenha a sequência e avance para Rampage.' },
  { threshold:5, label:'Rampage', src:'/assets/sales-badge-5.png', helper:'5 vendas', motivator:'Excelente cadência. Seu próximo passo é dominar o placar com 10 vendas.' },
  { threshold:10, label:'Domination', src:'/assets/sales-badge-10.png', helper:'10 vendas', motivator:'Patamar máximo das insígnias de vendas alcançado. Agora é acelerar ainda mais o VGV.' },
]

export function getLatestUnlockedBadge(salesCount:number){
  const total=Math.max(0, Number(salesCount||0))
  return [...SALES_BADGES].reverse().find((badge)=>total>=badge.threshold) || null
}

export function getNextBadge(salesCount:number){
  const total=Math.max(0, Number(salesCount||0))
  return SALES_BADGES.find((badge)=>total<badge.threshold) || null
}

export function loadoutConfig(op:any){
  return LOADOUT_ART[op?.selected_loadout || 'assault'] || LOADOUT_ART.assault
}

export function classLabel(op:any){
  return op?.title || loadoutConfig(op).label
}

function operatorBg(op:any, variant:'mvp'|'podium'|'card'){
  if(variant==='mvp') return '/assets/mvp-battle-money-bg.webp'
  const key = op?.avatar_crop?.bgScene || 'ridge'
  return BG_SCENES[key] || BG_SCENES.ridge
}

function operatorFaceStyle(op:any, art:any){
  return {
    left:`${art.face.left}%`,
    top:`${art.face.top}%`,
    width:`${art.face.width}%`,
    height:`${art.face.height}%`,
    backgroundImage:`url(${op.avatar_url})`,
    backgroundSize:'cover',
    backgroundPosition:'center',
  }
}

export function OperatorScene({op,variant='card'}:{op:any;variant?:'mvp'|'podium'|'card'}){
  const art=loadoutConfig(op)
  const bg=operatorBg(op, variant)
  const finalRender=variant==='mvp' ? op?.render_mvp_url : op?.render_card_url
  return <div className={`operator-scene ${variant}`}>
    <img className="operator-scene-bg" src={bg} alt="" aria-hidden="true"/>
    <div className="operator-scene-smoke"/>
    {finalRender
      ? <img className={`operator-final-render ${variant}`} src={finalRender} alt={op?.full_name || 'Operador'} />
      : <div className={`operator-scene-figure ${variant}`}>
          {op?.avatar_url ? <div className="operator-scene-face" style={operatorFaceStyle(op, art)}/> : null}
          <img className="operator-scene-art" src={art.src} alt={op?.full_name || 'Operador'} />
        </div>}
    <div className="operator-scene-vignette"/>
    <div className="operator-scene-moneyline"/>
  </div>
}

function FeaturedSalesBadge({salesCount,layout='card'}:{salesCount:number;layout?:'card'|'mvp'|'podium'}){
  const total=Math.max(0, Number(salesCount||0))
  const latestBadge=getLatestUnlockedBadge(total)
  const nextBadge=getNextBadge(total)
  const featuredBadge=latestBadge || SALES_BADGES[0]
  const unlocked=Boolean(latestBadge)
  const remaining=Math.max(0, (nextBadge?.threshold || featuredBadge.threshold) - total)
  const isTop = layout==='mvp' || layout==='podium'

  return <div className={`${styles.featuredGoalWrap} ${layout==='mvp'?styles.featuredGoalWrapMvp:''} ${layout==='podium'?styles.featuredGoalWrapPodium:''}`}>
    <div className={styles.featuredGoalHead}>
      <span>{unlocked?'ÚLTIMA INSÍGNIA':'PRÓXIMA INSÍGNIA'}</span>
      <b>{total} venda{total===1?'':'s'}</b>
    </div>

    <div className={`${styles.featuredGoalCard} ${layout==='mvp'?styles.featuredGoalCardMvp:''} ${layout==='podium'?styles.featuredGoalCardPodium:''} ${unlocked?styles.unlocked:styles.locked}`}>
      <div className={`${styles.featuredIconWrap} ${layout==='mvp'?styles.featuredIconWrapMvp:''} ${layout==='podium'?styles.featuredIconWrapPodium:''}`}>
        <img src={featuredBadge.src} alt={featuredBadge.label} className={`${styles.featuredIcon} ${layout==='mvp'?styles.featuredIconMvp:''} ${layout==='podium'?styles.featuredIconPodium:''}`} />
      </div>
      <div className={styles.featuredCopyWrap}>
        <strong className={`${styles.featuredLabel} ${layout==='mvp'?styles.featuredLabelMvp:''} ${layout==='podium'?styles.featuredLabelPodium:''}`}>{featuredBadge.label}</strong>
        <small className={`${styles.featuredHelper} ${layout==='mvp'?styles.featuredHelperMvp:''} ${layout==='podium'?styles.featuredHelperPodium:''}`}>{featuredBadge.helper}</small>
        <span className={`${styles.featuredStatus} ${layout==='mvp'?styles.featuredStatusMvp:''} ${layout==='podium'?styles.featuredStatusPodium:''}`}>{unlocked?'insígnia ativa':'ainda bloqueada'}</span>
      </div>
    </div>

    <div className={`${styles.featuredNextHint} ${isTop?styles.featuredNextHintTop:''}`}>
      {nextBadge
        ? <>
            <span className={styles.featuredNextKicker}>PRÓXIMO OBJETIVO</span>
            <b>{nextBadge.label}</b>
            <small>faltam {remaining} venda{remaining===1?'':'s'} para desbloquear</small>
          </>
        : <>
            <span className={styles.featuredNextKicker}>PATAMAR MÁXIMO</span>
            <b>todas as insígnias progressivas já foram conquistadas</b>
            <small>mantenha o ritmo e acelere o VGV</small>
          </>}
    </div>
  </div>
}

export function SalesMarks({salesCount,compact=false,layout='card'}:{salesCount:number;compact?:boolean;layout?:'card'|'mvp'|'podium'}){
  const total=Math.max(0, Number(salesCount||0))
  const visible=Math.min(total,12)

  return <div className={`sales-marks ${compact?'compact':''}`}>
    <div className="sales-marks-head">
      <span>ABATES COMERCIAIS</span>
      <b>{total} venda{total===1?'':'s'}</b>
    </div>
    <div className="sales-skull-row" aria-label={`${total} vendas marcadas`}>
      {Array.from({length:visible}).map((_,index)=><img key={index} src="/assets/sales-skull-mark.png" alt="" aria-hidden="true" className="sales-skull-icon" />)}
      {total===0 && <span className="sales-skull-empty">sem marcas</span>}
      {total>12 && <span className="sales-skull-extra">+{total-12}</span>}
    </div>
    <FeaturedSalesBadge salesCount={total} layout={layout} />
  </div>
}

export function OperatorCard({op,index,leader,showPending=true}:{op:any;index:number;leader?:boolean;showPending?:boolean}){
  const isLeader=typeof leader==='boolean'?leader:index===0
  return <article className={`operator-card ${isLeader?'leader-card':''}`}>
    <div className="operator-img operator-avatar-shell">
      <OperatorScene op={op} variant="card"/>
      <div className="operator-rank">P{String(index+1).padStart(2,'0')}</div>
      <div className="operator-online"/>
    </div>
    <div className="operator-body">
      <div className="operator-call">{op.codename||'OPERADOR'}</div>
      <div className="operator-name">{op.full_name}</div>
      <div className="operator-role">{classLabel(op)} · {op.team_name||'SEM SQUAD'}</div>
      <SalesMarks salesCount={op.sales_count||0} compact/>
      <div className="operator-stats">
        <div><strong>{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(op.vgv||0))}</strong><small>VGV</small></div>
        <div><strong>{op.sales_count||0}</strong><small>vendas</small></div>
      </div>
      {showPending && Number(op.pending_count)>0 && <div className="pending-mini">{op.pending_count} aguardando aprovação</div>}
    </div>
  </article>
}

export default OperatorCard
