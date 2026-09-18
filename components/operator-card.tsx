import { brl } from '@/lib/format'

const BG_SCENES:Record<string,string> = {
  ridge:'/assets/avatar-bg-ridge.webp',
  city:'/assets/avatar-bg-city.webp',
  command:'/assets/avatar-bg-command.webp',
}

const LOADOUT_LABELS:Record<string,string> = {
  assault:'Breacher',
  sniper:'Marksman',
  recon:'Scout',
  support:'Guardian',
  commander:'Commander',
}

function classLabel(op:any){
  return op?.title || LOADOUT_LABELS[op?.selected_loadout || 'assault'] || 'Breacher'
}

function operatorBg(op:any){
  const key = op?.avatar_crop?.bgScene || 'ridge'
  return BG_SCENES[key] || BG_SCENES.ridge
}

function OperatorCardScene({op}:{op:any}){
  const bg=operatorBg(op)
  const finalRender=op?.render_card_url

  return <div className={`operator-scene card ${finalRender?'has-render':'missing-render'}`}>
    <img className="operator-scene-bg" src={bg} alt="" aria-hidden="true"/>
    <div className="operator-scene-smoke"/>
    {finalRender
      ? <img className="operator-final-render card" src={finalRender} alt={op?.full_name || 'Operador'} />
      : <div className="operator-avatar-missing">
          <span>OPERADOR SEM RENDER</span>
          <strong>CONFIGURAR AVATAR</strong>
          <small>Abra Meu Loadout e salve o operador</small>
        </div>}
    <div className="operator-scene-vignette"/>
    <div className="operator-scene-moneyline"/>
  </div>
}

export default function OperatorCard({op,index,leader=false}:{op:any;index:number;leader?:boolean}){
  return <article className={`operator-card ${leader?'leader-card':''}`}>
    <div className="operator-img operator-avatar-shell">
      <OperatorCardScene op={op}/>
      <div className="operator-rank">P{String(index+1).padStart(2,'0')}</div>
      <div className="operator-online"/>
    </div>
    <div className="operator-body">
      <div className="operator-call">{op.codename||'OPERADOR'}</div>
      <div className="operator-name">{op.full_name}</div>
      <div className="operator-role">{classLabel(op)} · {op.team_name||'SEM SQUAD'}</div>
      <div className="operator-stats">
        <div><strong>{brl(op.vgv)}</strong><small>VGV</small></div>
        <div><strong>{op.sales_count||0}</strong><small>vendas</small></div>
      </div>
      {Number(op.pending_count)>0&&<div className="pending-mini">{op.pending_count} aguardando aprovação</div>}
    </div>
  </article>
}
