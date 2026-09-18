'use client'

import { useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FALLBACK_LOADOUTS = [
  { key:'assault', name:'Assalto', tag:'Agressividade', description:'Ritmo alto, presença e fechamento.', stats:[1,1,1,0], classLabel:'Breacher', accent:'lime', weaponHint:'Carabina', accessoryHint:'Flashbang' },
  { key:'sniper', name:'Precisão', tag:'Negociação', description:'Foco em conversão de oportunidades qualificadas.', stats:[1,1,0,0], classLabel:'Marksman', accent:'amber', weaponHint:'DMR', accessoryHint:'Scope Kit' },
  { key:'recon', name:'Recon', tag:'Inteligência', description:'Cadência, leitura de funil e prospecção.', stats:[1,1,1,1], classLabel:'Scout', accent:'cyan', weaponHint:'SMG', accessoryHint:'Drone' },
  { key:'support', name:'Suporte', tag:'Equipe', description:'Trabalho coordenado e força coletiva.', stats:[1,0,1,1], classLabel:'Guardian', accent:'violet', weaponHint:'LMG', accessoryHint:'Medkit' },
]

const OUTFITS = [
  { key:'vanguard', name:'Vanguard', description:'Colete pesado e presença de linha de frente.' },
  { key:'phantom', name:'Phantom', description:'Perfil stealth com recorte mais enxuto.' },
  { key:'sentinel', name:'Sentinel', description:'Silhueta de proteção, bolsos e placas utilitárias.' },
  { key:'striker', name:'Striker', description:'Visual urbano de impacto com acabamento agressivo.' },
]

const HEADGEARS = [
  { key:'helmet', name:'Capacete', description:'Visual tático padrão' },
  { key:'cap', name:'Boné', description:'Mais leve e casual' },
  { key:'headset', name:'Headset', description:'Comunicação de operação' },
  { key:'goggles', name:'Óculos', description:'Perfil de incursão' },
]

const WEAPONS = [
  { key:'carbine', name:'Carabina', description:'Equilíbrio para assalto e fechamento.' },
  { key:'marksman', name:'Marksman', description:'Precisão e presença de elite.' },
  { key:'smg', name:'SMG', description:'Mobilidade e ritmo acelerado.' },
  { key:'shotgun', name:'Shotgun', description:'Impacto e controle de curta distância.' },
]

const ACCESSORIES = [
  { key:'flash', name:'Flash', description:'Entrada agressiva e abertura de espaço.' },
  { key:'drone', name:'Drone', description:'Leitura e inteligência de cenário.' },
  { key:'shield', name:'Escudo', description:'Proteção, retenção e cobertura.' },
  { key:'medkit', name:'Medkit', description:'Suporte ao time e recuperação rápida.' },
]

const SQUAD_FALLBACKS = [
  { id:'alfa', name:'Time Alfa' },
  { id:'bravo', name:'Time Bravo' },
  { id:'charlie', name:'Time Charlie' },
  { id:'delta', name:'Time Delta' },
]

const STAGE_WIDTH = 520
const STAGE_HEIGHT = 360
const OUTPUT_SIZE = 640
const OUTPUT_SHIFT_RATIO = OUTPUT_SIZE / 300

function readCustomState(initialProfile:any, teams:any[]) {
  const crop = initialProfile?.avatar_crop && typeof initialProfile.avatar_crop === 'object' ? initialProfile.avatar_crop : {}
  const defaultTeamName = teams.find((team:any) => team.id === initialProfile?.operator?.team_id)?.name || teams[0]?.name || SQUAD_FALLBACKS[0].name
  const defaultTeamId = initialProfile?.operator?.team_id || teams[0]?.id || SQUAD_FALLBACKS[0].id
  return {
    zoom: Number(crop.zoom ?? 1.18),
    x: Number(crop.x ?? 0),
    y: Number(crop.y ?? 0),
    codename: String(crop.codename || initialProfile?.operator?.codename || '').toUpperCase(),
    squadId: String(crop.squadId || defaultTeamId),
    squadName: String(crop.squadName || defaultTeamName),
    outfit: String(crop.outfit || 'vanguard'),
    headgear: String(crop.headgear || 'helmet'),
    weapon: String(crop.weapon || 'carbine'),
    accessory: String(crop.accessory || 'flash'),
  }
}

function clamp(value:number, min:number, max:number){
  return Math.min(max, Math.max(min, value))
}

export default function LoadoutConfigurator({ userId, initialProfile, dbLoadouts, teams = [], initialAvatarUrl }:{userId:string;initialProfile:any;dbLoadouts:any[];teams:any[];initialAvatarUrl:string|null}){
  const supabase = useMemo(()=>createClient(),[])
  const loadouts = dbLoadouts.length ? dbLoadouts.map((l:any, index:number)=>({
    key:l.key,
    name:l.name,
    tag:l.tagline||l.name,
    description:l.description,
    stats:Array.isArray(l.stats)?l.stats:[1,1,1,0],
    classLabel:FALLBACK_LOADOUTS[index]?.classLabel || FALLBACK_LOADOUTS[0].classLabel,
    accent:FALLBACK_LOADOUTS[index]?.accent || 'lime',
    weaponHint:FALLBACK_LOADOUTS[index]?.weaponHint || 'Carabina',
    accessoryHint:FALLBACK_LOADOUTS[index]?.accessoryHint || 'Flash',
  })) : FALLBACK_LOADOUTS
  const squads = teams.length ? teams : SQUAD_FALLBACKS
  const defaults = readCustomState(initialProfile, squads)

  const [selected,setSelected]=useState(initialProfile?.selected_loadout || loadouts[0].key)
  const [source,setSource]=useState<string|null>(initialAvatarUrl)
  const [file,setFile]=useState<File|null>(null)
  const [zoom,setZoom]=useState(defaults.zoom)
  const [x,setX]=useState(defaults.x)
  const [y,setY]=useState(defaults.y)
  const [codename,setCodename]=useState(defaults.codename)
  const [squadId,setSquadId]=useState(defaults.squadId)
  const [outfit,setOutfit]=useState(defaults.outfit)
  const [headgear,setHeadgear]=useState(defaults.headgear)
  const [weapon,setWeapon]=useState(defaults.weapon)
  const [accessory,setAccessory]=useState(defaults.accessory)
  const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState('')
  const [dragging,setDragging]=useState(false)
  const dragRef=useRef<{x:number;y:number;startX:number;startY:number}>({x:0,y:0,startX:0,startY:0})

  const selectedLoadout = loadouts.find((l:any)=>l.key===selected) || loadouts[0]
  const squadName = squads.find((team:any) => team.id === squadId)?.name || defaults.squadName
  const faceBackground = source
    ? {
        backgroundImage:`url(${source})`,
        backgroundSize:`${zoom * 100}%`,
        backgroundPosition:`calc(50% + ${x}px) calc(50% + ${y}px)`,
      }
    : undefined

  function onPick(e:React.ChangeEvent<HTMLInputElement>){
    const f=e.target.files?.[0]
    if(!f) return
    setFile(f)
    setSource(URL.createObjectURL(f))
    setZoom(1.18)
    setX(0)
    setY(0)
    setMsg('')
  }

  function onPointerDown(e:React.PointerEvent<HTMLDivElement>) {
    if (!source) return
    setDragging(true)
    dragRef.current = { startX: e.clientX, startY: e.clientY, x, y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e:React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !source) return
    const nextX = clamp(dragRef.current.x + (e.clientX - dragRef.current.startX), -150, 150)
    const nextY = clamp(dragRef.current.y + (e.clientY - dragRef.current.startY), -150, 150)
    setX(nextX)
    setY(nextY)
  }

  function onPointerUp(e:React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    setDragging(false)
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
  }

  async function makeCrop(){
    if(!source) return null
    const img=new window.Image()
    img.crossOrigin='anonymous'
    img.src=source
    await new Promise((res,rej)=>{img.onload=()=>res(true);img.onerror=rej})

    const canvas=document.createElement('canvas')
    canvas.width=OUTPUT_SIZE
    canvas.height=OUTPUT_SIZE
    const ctx=canvas.getContext('2d')
    if(!ctx) throw new Error('Falha ao preparar a arte do avatar.')

    ctx.fillStyle='#0b100f'
    ctx.fillRect(0,0,OUTPUT_SIZE,OUTPUT_SIZE)

    const scale = Math.max(OUTPUT_SIZE / img.naturalWidth, OUTPUT_SIZE / img.naturalHeight) * zoom
    const drawWidth = img.naturalWidth * scale
    const drawHeight = img.naturalHeight * scale
    const dx = (OUTPUT_SIZE - drawWidth) / 2 + (x * OUTPUT_SHIFT_RATIO)
    const dy = (OUTPUT_SIZE - drawHeight) / 2 + (y * OUTPUT_SHIFT_RATIO)
    ctx.imageSmoothingQuality='high'
    ctx.drawImage(img, dx, dy, drawWidth, drawHeight)

    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Falha ao gerar corte')),'image/jpeg',.94))
  }

  async function save(){
    try{
      setSaving(true)
      setMsg('')
      let avatarPath=initialProfile?.avatar_path || null
      if(source && (file || !avatarPath)){
        const blob=await makeCrop()
        if(blob){
          const path=`${userId}/avatar-${Date.now()}.jpg`
          const {error}=await supabase.storage.from('avatars').upload(path,blob,{contentType:'image/jpeg',upsert:true})
          if(error) throw error
          avatarPath=path
        }
      }

      const payload={
        selected_loadout:selected,
        avatar_path:avatarPath,
        avatar_crop:{ zoom, x, y, codename, squadId, squadName, outfit, headgear, weapon, accessory },
        updated_at:new Date().toISOString(),
      }
      const {error}=await supabase.from('profiles').update(payload).eq('id',userId)
      if(error) throw error
      setMsg('OPERADOR ATUALIZADO. LOADOUT, CARD E AVATAR SALVOS COM SUCESSO.')
    }catch(err:any){
      setMsg(err?.message || 'Não foi possível salvar o loadout.')
    }finally{
      setSaving(false)
    }
  }

  return <>
    <div className="section-head"><h2>Escolha seu <b>Loadout</b></h2><div className="line"/><div className="meta">4 classes · visual tático completo</div></div>
    <div className="loadout-grid">{loadouts.map((l:any,i:number)=><button type="button" key={l.key} className={`loadout-card accent-${l.accent} ${selected===l.key?'selected':''}`} onClick={()=>setSelected(l.key)}>
      <div className="loadout-id">LOADOUT 0{i+1} // {l.tag}</div>
      <h3>{l.name}</h3>
      <div className="loadout-class">Classe: {l.classLabel}</div>
      <p>{l.description}</p>
      <div className="loadout-meta-row"><span>Arma sugerida: {l.weaponHint}</span><span>Item: {l.accessoryHint}</span></div>
      <div className="loadout-stats">{[0,1,2,3].map(n=><span key={n} className={l.stats[n]?'on':''}/>)}</div>
    </button>)}</div>

    <div className="section-head"><h2>Monte seu <b>Operador</b></h2><div className="line"/><div className="meta">estilo jib jab · card final com identidade</div></div>
    <div className="loadout-lab">
      <section className="panel stack-panel identity-panel">
        <div className="page-kicker">IDENTIDADE DO OPERADOR</div>
        <div className="identity-grid">
          <div className="field"><label>Nome exibido</label><input value={initialProfile?.full_name || ''} readOnly disabled/></div>
          <div className="field"><label>Codinome</label><input maxLength={18} value={codename} onChange={e=>setCodename(e.target.value.toUpperCase())} placeholder="Ex.: FALCÃO"/></div>
        </div>
        <div className="identity-grid">
          <div className="field"><label>Squad</label><select value={squadId} onChange={e=>setSquadId(e.target.value)}>{squads.map((team:any)=><option key={team.id} value={team.id}>{team.name}</option>)}</select></div>
          <div className="field"><label>Classe</label><div className="field-readonly">{selectedLoadout.name} · {selectedLoadout.classLabel}</div></div>
        </div>
        <div className="loadout-summary-card">
          <div className="summary-kicker">Resumo da composição</div>
          <div className="summary-row"><span>Classe</span><strong>{selectedLoadout.name}</strong></div>
          <div className="summary-row"><span>Arma</span><strong>{WEAPONS.find(item=>item.key===weapon)?.name}</strong></div>
          <div className="summary-row"><span>Acessório</span><strong>{ACCESSORIES.find(item=>item.key===accessory)?.name}</strong></div>
          <div className="summary-row"><span>Squad</span><strong>{squadName}</strong></div>
        </div>
      </section>

      <section className="panel stack-panel crop-panel">
        <div className="page-kicker">EDITOR DE ROSTO · ARRASTE PARA AJUSTAR</div>
        <div className={`crop-stage improved ${dragging ? 'dragging' : ''}`} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
          {source ? <div className="crop-photo" style={faceBackground}/> : <div className="empty-state"><strong>Envie sua foto frontal</strong><span>Depois arraste para posicionar o rosto e use os controles finos abaixo.</span></div>}
          <div className="crop-jibjab-body">
            <div className={`jibjab-silhouette outfit-${outfit}`}/>
          </div>
          <div className="crop-mask improved-mask"/>
          <div className="crop-cross"/>
          <div className="drag-tip">ARRASTE A FOTO PARA POSICIONAR O ROSTO</div>
        </div>

        <div className="upload-actions">
          <label className="ghost-btn" htmlFor="face-upload">Enviar foto</label>
          <button type="button" className="ghost-btn" onClick={()=>{setZoom(1.18);setX(0);setY(0)}}>Centralizar</button>
          <input id="face-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick}/>
        </div>

        <div className="slider-row"><label>Zoom</label><input type="range" min="0.8" max="2.4" step="0.02" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/><output>{zoom.toFixed(2)}x</output></div>
        <div className="slider-row"><label>Horizontal</label><input type="range" min="-150" max="150" value={x} onChange={e=>setX(Number(e.target.value))}/><output>{x}px</output></div>
        <div className="slider-row"><label>Vertical</label><input type="range" min="-150" max="150" value={y} onChange={e=>setY(Number(e.target.value))}/><output>{y}px</output></div>
      </section>

      <section className="panel stack-panel loadout-choices-panel">
        <div className="page-kicker">PERSONALIZAÇÃO TÁTICA</div>
        <div className="choice-group">
          <div className="choice-title">4 roupas</div>
          <div className="choice-grid four-up">{OUTFITS.map(item=><button type="button" key={item.key} className={`option-chip visual ${outfit===item.key?'selected':''}`} onClick={()=>setOutfit(item.key)}><span>{item.name}</span><small>{item.description}</small></button>)}</div>
        </div>
        <div className="choice-group">
          <div className="choice-title">4 personalizações de cabeça</div>
          <div className="choice-grid four-up">{HEADGEARS.map(item=><button type="button" key={item.key} className={`option-chip visual ${headgear===item.key?'selected':''}`} onClick={()=>setHeadgear(item.key)}><span>{item.name}</span><small>{item.description}</small></button>)}</div>
        </div>
        <div className="choice-group">
          <div className="choice-title">4 armas</div>
          <div className="choice-grid four-up">{WEAPONS.map(item=><button type="button" key={item.key} className={`option-chip visual ${weapon===item.key?'selected':''}`} onClick={()=>setWeapon(item.key)}><span>{item.name}</span><small>{item.description}</small></button>)}</div>
        </div>
        <div className="choice-group">
          <div className="choice-title">4 itens de personalização</div>
          <div className="choice-grid four-up">{ACCESSORIES.map(item=><button type="button" key={item.key} className={`option-chip visual ${accessory===item.key?'selected':''}`} onClick={()=>setAccessory(item.key)}><span>{item.name}</span><small>{item.description}</small></button>)}</div>
        </div>
      </section>

      <section className="panel stack-panel preview-panel enhanced-preview">
        <div className="page-kicker">CARD FINAL DO OPERADOR</div>
        <div className={`operator-card-builder accent-${selectedLoadout.accent}`}>
          <div className="builder-topline">
            <span>OPERAÇÃO SEXTA MARCHA</span>
            <span>{selectedLoadout.classLabel}</span>
          </div>
          <div className="builder-layout">
            <div className="avatar-stage">
              <div className={`avatar-body outfit-${outfit}`}>
                <div className={`body-vest vest-${selected}`}/>
                <div className="body-arms"/>
                <div className="body-legs"/>
                <div className={`weapon-layer weapon-${weapon}`}/>
                <div className={`accessory-layer accessory-${accessory}`}/>
                <div className={`headgear-layer headgear-${headgear}`}/>
                <div className="avatar-head" style={faceBackground}/>
              </div>
            </div>
            <div className="builder-info">
              <div className="badge-line">SQUAD · {squadName}</div>
              <h3>{codename || 'DEFINA SEU CODINOME'}</h3>
              <strong>{initialProfile?.full_name || 'OPERADOR'}</strong>
              <div className="builder-class">Classe escolhida: {selectedLoadout.name}</div>
              <div className="builder-loadout-list">
                <div><span>Roupa</span><b>{OUTFITS.find(item=>item.key===outfit)?.name}</b></div>
                <div><span>Cabeça</span><b>{HEADGEARS.find(item=>item.key===headgear)?.name}</b></div>
                <div><span>Arma</span><b>{WEAPONS.find(item=>item.key===weapon)?.name}</b></div>
                <div><span>Item</span><b>{ACCESSORIES.find(item=>item.key===accessory)?.name}</b></div>
              </div>
              <p>{selectedLoadout.description}</p>
            </div>
          </div>
          <div className="builder-footer">
            <div className="operator-bars">{selectedLoadout.stats.map((value:number,index:number)=><span key={index} className={value?'on':''}/>)}</div>
            <button className="primary-btn" onClick={save} disabled={saving}>{saving?'Salvando...':'Salvar avatar e loadout'}</button>
          </div>
        </div>
        {msg&&<div className="form-msg">{msg}</div>}
      </section>
    </div>
  </>
}
