import type { CSSProperties } from 'react'
import Link from 'next/link'
import { brl, pct } from '@/lib/format'
import LiveRefresh from '@/components/live-refresh'
import FirstBloodFloater from '@/components/first-blood-floater'
import incentiveStyles from '@/components/dashboard-incentives.module.css'
import { normalizeGoalTiers } from '@/lib/goals'
import { OperatorCard, OperatorScene, SalesMarks, classLabel } from '@/components/operator-card'

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
  const {campaign,summary,operators,feed,viewerReward,firstBloodStats}=data
  const levels=normalizeGoalTiers(data.goals)
  const visibleLevels=levels.filter((level:any)=>String(level.name||'').trim().toLowerCase()!=='suprema').slice(0,3)
  const lastGoal=visibleLevels[visibleLevels.length-1]
  const target=Number(campaign.target_vgv || lastGoal?.threshold_vgv || 7000000)
  const confirmed=Number(summary.confirmed_vgv||0)
  const progress=Math.min(100,target?confirmed/target*100:0)
  const operationDone=target>0 && confirmed>=target
  const top3=operators.slice(0,3),mvp=top3[0]

  return <div className="content max warroom-dashboard page-enter">
    <FirstBloodFloater viewerId={viewerReward?.viewerId} enabled={viewerReward?.firstBloodUnlocked} approvedSales={viewerReward?.approvedSales} />

    <div className="dust-field" aria-hidden="true">{DUST_PARTICLES.map((p,index)=><span key={index} className="dust-particle" style={{left:p.x,top:p.y,width:`${p.size}px`,height:`${p.size}px`,animationDuration:`${p.duration}s`,animationDelay:`${p.delay}s`}}/> )}</div>
    <div className="warroom-livebar reveal reveal-1"><div><span>OPERAÇÃO RESULTADO</span><small>painel de guerra comercial · resultados aprovados</small></div><LiveRefresh/></div>

    <section className="hero animated-hero reveal reveal-1"><div className="hero-scan"/><div className="hero-content"><div className="kicker">FORÇA DE VENDAS · RESULTADOS REAIS</div><h1>Operação<br/><span>Resultado</span></h1><p>{campaign.subtitle||'Quem executa, vende. Pessoas, processos, vendas e crescimento juntos por um único objetivo: acelerar resultados.'}</p><div className="hero-actions"><Link className="primary-btn" href="/vendas">Registrar venda →</Link><Link className="ghost-btn" href="/loadout">Configurar loadout</Link></div></div><div className="mission-strip"><div className="label">MISSÃO ATIVA</div><strong>{campaign.name || 'Operação Resultado'}</strong><p>Meta da temporada: {brl(target)} · Vigência até {new Date(campaign.end_date+'T12:00:00').toLocaleDateString('pt-BR')}</p></div></section>

    <div className="section-head top-three-head reveal reveal-2"><h2>Top 3 da <b>Operação</b></h2><div className="line"/><div className="meta">ranking somente de executivos cadastrados</div></div>
    {operators.length?<div className="top-three-grid reveal reveal-2">
      {mvp&&<article className="mvp-card"><div className="mvp-aura"/><div className="mvp-rank">1º</div><div className="mvp-crown">MVP</div><div className="mvp-image"><OperatorScene op={mvp} variant="mvp"/></div><div className="mvp-copy"><div className="mvp-squad">{mvp.team_name||'SEM SQUAD'} · {classLabel(mvp)}</div><h3>{mvp.codename||mvp.full_name}</h3><strong>{mvp.full_name}</strong><div className="mvp-vgv">{brl(mvp.vgv)}</div><div className="mvp-sales">{mvp.sales_count||0} vendas aprovadas</div><SalesMarks salesCount={mvp.sales_count||0} /></div></article>}
      {top3.slice(1).map((op:any,index:number)=><article className="podium-card" key={op.id}><div className="podium-rank">{index+2}º</div><div className="podium-image"><OperatorScene op={op} variant="podium"/></div><div className="podium-copy"><span>{op.team_name||'SEM SQUAD'} · {classLabel(op)}</span><h3>{op.codename||op.full_name}</h3><strong>{op.full_name}</strong><b>{brl(op.vgv)}</b><small>{op.sales_count||0} vendas</small><SalesMarks salesCount={op.sales_count||0} compact /></div></article>)}
    </div>:<div className="empty-warroom reveal reveal-2">Nenhum executivo cadastrado ainda. Cadastre os executivos em Gestão para iniciar o ranking em tempo real.</div>}

    <div className="section-head reveal reveal-3"><h2>Metas e <b>Insígnias</b></h2><div className="line"/><div className="meta">objetivos atualizados pela gestão</div></div>
    <div className={`badge-level-grid reveal reveal-3 ${incentiveStyles.threeGoalGrid}`}>{visibleLevels.map((level:any,index:number)=>{
      const threshold=Number(level.threshold_vgv||0)
      const done=threshold>0 && confirmed>=threshold
      const previousThreshold=index>0?Number(visibleLevels[index-1]?.threshold_vgv||0):0
      const current=!done && (index===0 || confirmed>=previousThreshold)
      const tierProgress=Math.max(0,Math.min(100,threshold?confirmed/threshold*100:0))
      return <div className={`badge-level ${level.tone} ${done?'done':''} ${current?'current':''} ${incentiveStyles.goalCard}`} key={level.id||`${level.name}-${index}`}>
        {done&&<div className="objective-seal">Objetivo concluído</div>}
        <div className={`insignia ${incentiveStyles.goalInsignia}`}><img src={level.badge} alt={`Insígnia ${level.name}`} /></div>
        <div className={`badge-level-copy ${incentiveStyles.goalCopy}`}>
          <div className="level-name">{level.name}</div>
          <div className={incentiveStyles.goalTarget}>{brl(threshold)}</div>
          <div className={incentiveStyles.rewardList}>
            {String(level.reward||'').split(/\s*\+\s*/).filter(Boolean).map((reward:string,rewardIndex:number)=><div className={incentiveStyles.rewardLine} key={`${level.name}-reward-${rewardIndex}`}><span className={incentiveStyles.rewardBullet}>◆</span><span>{reward}</span></div>)}
          </div>
          <div className="level-weapon">{level.code} // {level.weapon}</div>
          <div className="level-status">{done?'✓ INSÍGNIA CONQUISTADA':current?'OBJETIVO ATUAL':'BLOQUEADA'}</div>
          <div className={incentiveStyles.goalProgress}>
            <div className={incentiveStyles.goalProgressHead}><span>Avanço da meta</span><strong>{pct(tierProgress)}</strong></div>
            <div className={incentiveStyles.goalProgressTrack}>
              <div className={`${incentiveStyles.goalProgressFill} ${done?incentiveStyles.goalProgressDone:''}`} style={{width:`${tierProgress}%`}}/>
            </div>
            <div className={incentiveStyles.goalProgressValues}><span>{brl(confirmed)}</span><span>{brl(threshold)}</span></div>
          </div>
        </div>
      </div>
    })}</div>

    <section className={`${incentiveStyles.bonusPanel} reveal reveal-4`}>
      <div className={incentiveStyles.badgeWrap}><img src="/assets/sales-badge-first-blood.png" alt="First Blood" /></div>
      <div className={incentiveStyles.copy}>
        <div className={incentiveStyles.kicker}>BÔNUS DE ESTREIA · VALE DESDE JÁ</div>
        <h3>First Blood — R$ 500 na primeira venda</h3>
        <p>Cada corretor que tiver a <strong>primeira venda aprovada</strong> garante <strong>R$ 500,00 na hora</strong>, independente do degrau coletivo. As premiações da escada são cumulativas: ao subir de degrau, os benefícios anteriores permanecem.</p>
        <div className={incentiveStyles.cumulativeNote}>1ª venda aprovada = prêmio liberado automaticamente no painel</div>
      </div>
      <div className={incentiveStyles.metrics}>
        <div className={incentiveStyles.metric}><span>Corretores que já garantiram</span><b>{firstBloodStats?.rewardedExecutives || 0}</b></div>
        <div className={`${incentiveStyles.metric} ${incentiveStyles.metricAccent}`}><span>Total acumulado</span><b>{brl(firstBloodStats?.accumulatedReward || 0)}</b></div>
        <div className={incentiveStyles.metric}><span>Prêmio por corretor</span><b>{brl(firstBloodStats?.rewardPerExecutive || 500)}</b></div>
      </div>
    </section>

    <div className="section-head reveal reveal-4" id="briefing"><h2>Briefing da <b>Operação</b></h2><div className="line"/><div className="meta">dados aprovados em tempo real</div></div>
    <div className="stat-grid reveal reveal-4"><div className="stat-card"><div className="label">VGV aprovado</div><div className="value">{brl(summary.confirmed_vgv)}</div><div className="hint">{summary.approved_sales||0} vendas aprovadas</div></div><div className="stat-card amber"><div className="label">Aguardando aprovação</div><div className="value">{brl(summary.pending_vgv)}</div><div className="hint">{summary.pending_sales||0} envios pendentes</div></div><div className="stat-card"><div className="label">VGV em operação</div><div className="value">{brl(summary.total_vgv)}</div><div className="hint">aprovado + pendente</div></div><div className="stat-card"><div className="label">Executivos cadastrados</div><div className="value">{summary.active_executives||operators.length}</div><div className="hint">somente perfis Executivo ativos</div></div></div>
    <div className="progress-card war-progress reveal reveal-4">
      {operationDone&&<div className="campaign-complete-seal">Objetivo concluído</div>}
      <div className="progress-row"><span>AVANÇO → META GERAL</span><span>{brl(confirmed)} / {brl(target)} · {pct(progress)}</span></div>
      <div className="progress-track"><div className="progress-fill animated-progress animated-meter" style={{'--target-width':`${progress}%`} as CSSProperties}/></div>
    </div>

    <div className="warroom-columns reveal reveal-5">
      <section><div className="section-head"><h2>Esquadrão <b>Completo</b></h2><div className="line"/><div className="meta">{operators.length} executivos</div></div><div className="squad-grid compact-squad">{operators.map((op:any,index:number)=><OperatorCard key={op.id} op={op} index={index} showPending={false} />)}</div></section>
      <aside className="live-feed-panel"><div className="section-head"><h2>Feed <b>Ao Vivo</b></h2><div className="line"/></div><div className="live-feed-list">{(feed||[]).map((item:any)=><div className={`feed-item ${item.approval_status}`} key={item.id}><span className="feed-dot"/><div><strong>{item.profiles?.full_name||'Executivo'}</strong><small>{item.approval_status==='approved'?'venda aprovada':item.approval_status==='pending'?'venda aguardando aprovação':'registro rejeitado'} · {item.development}</small>{item.approval_status==='approved'&&<div style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:8,padding:'5px 8px',border:'1px solid rgba(107,255,159,.16)',background:'rgba(86,255,142,.08)',color:'#baffcb',font:'700 9px JetBrains Mono',letterSpacing:'.08em',textTransform:'uppercase'}}><img src="/assets/feed-mission-completed.png" alt="Missão cumprida" style={{width:22,height:22,objectFit:'contain'}} /><span>Missão cumprida</span></div>}</div><b>{brl(item.vgv)}</b></div>)}{!(feed||[]).length&&<div className="feed-empty">As novas vendas aparecerão aqui assim que forem enviadas.</div>}</div></aside>
    </div>

    <div className="warroom-ticker reveal reveal-5"><span>QUEM EXECUTA, VENDE</span><i/> <span>PESSOAS · PROCESSOS · VENDAS</span><i/> <span>CRESCIMENTO EM TEMPO REAL</span><i/> <span>MENFE</span></div>
  </div>
}
