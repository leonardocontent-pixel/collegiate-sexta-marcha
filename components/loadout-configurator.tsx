'use client'

import { useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FALLBACK_LOADOUTS = [
  { key:'assault', name:'Assalto', tag:'Agressividade', description:'Ritmo alto, presença e fechamento.', stats:[1,1,1,0], classLabel:'Breacher', accent:'lime', weaponHint:'Carabina', accessoryHint:'Flashbang' },
  { key:'sniper', name:'Precisão', tag:'Negociação', description:'Foco em conversão de oportunidades qualificadas.', stats:[1,1,0,0], classLabel:'Marksman', accent:'amber', weaponHint:'DMR', accessoryHint:'Scope Kit' },
  { key:'recon', name:'Recon', tag:'Inteligência', description:'Cadência, leitura de funil e prospecção.', stats:[1,1,1,1], classLabel:'Scout', accent:'cyan', weaponHint:'SMG', accessoryHint:'Drone' },
  { key:'support', name:'Suporte', tag:'Equipe', description:'Trabalho coordenado e força coletiva.', stats:[1,0,1,1], classLabel:'Guardian', accent:'violet', weaponHint:'LMG', accessoryHint:'Medkit' },
  { key:'commander', name:'Comando', tag:'Liderança', description:'Visão tática do squad, aprovação de vendas e condução da operação.', stats:[1,1,1,1], classLabel:'Commander', accent:'gold', weaponHint:'Command Rifle', accessoryHint:'Comms Kit' },
]

const REALISTIC_ART:Record<string,{src:string;face:{left:number;top:number;width:number;height:number}}> = {
  assault:{src:'/assets/loadout-assault.webp',face:{left:36.65,top:13.60,width:25.23,height:17.82}},
  sniper:{src:'/assets/loadout-precision.webp',face:{left:39.13,top:12.71,width:21.64,height:15.19}},
  recon:{src:'/assets/loadout-recon.webp',face:{left:39.04,top:12.02,width:21.55,height:15.75}},
  support:{src:'/assets/loadout-support.webp',face:{left:39.23,top:11.95,width:21.45,height:15.33}},
  commander:{src:'/assets/loadout-support.webp',face:{left:39.23,top:11.95,width:21.45,height:15.33}},
}

const DEFAULT_KIT:Record<string,{outfit:string;headgear:string;weapon:string;accessory:string}> = {
  assault:{outfit:'vanguard',headgear:'helmet',weapon:'carbine',accessory:'flash'},
  sniper:{outfit:'phantom',headgear:'headset',weapon:'marksman',accessory:'drone'},
  recon:{outfit:'striker',headgear:'goggles',weapon:'smg',accessory:'drone'},
  support:{outfit:'sentinel',headgear:'helmet',weapon:'lmg',accessory:'medkit'},
  commander:{outfit:'sentinel',headgear:'headset',weapon:'marksman',accessory:'drone'},
}

const OUTFITS = [
  { key:'vanguard', name:'Vanguard', description:'Colete pesado e presença de linha de frente.' },
  { key:'phantom', name:'Phantom', description:'Perfil stealth com acabamento escurecido.' },
  { key:'sentinel', name:'Sentinel', description:'Configuração robusta e utilitária.' },
  { key:'striker', name:'Striker', description:'Visual urbano de incursão rápida.' },
]

const HEADGEARS = [
  { key:'helmet', name:'Capacete', description:'Proteção tática padrão' },
  { key:'cap', name:'Boné', description:'Perfil leve de campo' },
  { key:'headset', name:'Headset', description:'Comunicação avançada' },
  { key:'goggles', name:'Óculos', description:'Reconhecimento e incursão' },
]

const WEAPONS = [
  { key:'carbine', name:'Carabina', description:'Equilíbrio para assalto e fechamento.' },
  { key:'marksman', name:'Marksman', description:'Precisão e presença de elite.' },
  { key:'smg', name:'SMG', description:'Mobilidade e ritmo acelerado.' },
  { key:'lmg', name:'LMG', description:'Supressão, presença e suporte pesado.' },
]

const ACCESSORIES = [
  { key:'flash', name:'Flash', description:'Entrada agressiva e abertura de espaço.' },
  { key:'drone', name:'Drone', description:'Leitura e inteligência de cenário.' },
  { key:'shield', name:'Escudo', description:'Proteção, retenção e cobertura.' },
  { key:'medkit', name:'Medkit', description:'Suporte ao time e recuperação rápida.' },
]


const BG_SCENES = [
  { key:'ridge', name:'Montanha Tática', description:'Base avançada em vale montanhoso.', src:'/assets/avatar-bg-ridge.webp' },
  { key:'city', name:'Zona Urbana', description:'Corredor de guerra ao entardecer.', src:'/assets/avatar-bg-city.webp' },
  { key:'command', name:'Base de Comando', description:'Quartel avançado sob holofotes.', src:'/assets/avatar-bg-command.webp' },
]

const SQUAD_FALLBACKS = [
  { id:'alfa', name:'Time Alfa' },
  { id:'bravo', name:'Time Bravo' },
  { id:'charlie', name:'Time Charlie' },
  { id:'delta', name:'Time Delta' },
]

const OUTPUT_SIZE = 640
const OUTPUT_SHIFT_RATIO = OUTPUT_SIZE / 300
const ART_WIDTH = 1086
const ART_HEIGHT = 1448
const MVP_CROP_HEIGHT = 860

function readCustomState(initialProfile:any, teams:any[]) {
  const crop = initialProfile?.avatar_crop && typeof initialProfile.avatar_crop === 'object' ? initialProfile.avatar_crop : {}
  const defaultTeamName = teams.find((team:any) => team.id === initialProfile?.operator?.team_id)?.name || teams[0]?.name || SQUAD_FALLBACKS[0].name
  const defaultTeamId = initialProfile?.operator?.team_id || teams[0]?.id || SQUAD_FALLBACKS[0].id
  return {
    zoom: Number(crop.zoom ?? 1.18), x: Number(crop.x ?? 0), y: Number(crop.y ?? 0),
    codename: String(crop.codename || initialProfile?.operator?.codename || '').toUpperCase(),
    squadId: String(crop.squadId || defaultTeamId), squadName: String(crop.squadName || defaultTeamName),
    outfit: String(crop.outfit || 'vanguard'), headgear: String(crop.headgear || 'helmet'),
    weapon: String(crop.weapon || 'carbine'), accessory: String(crop.accessory || 'flash'),
    bgScene: String(crop.bgScene || 'ridge'),
  }
}

function clamp(value:number, min:number, max:number){ return Math.min(max, Math.max(min, value)) }

async function loadCanvasImage(src:string){
  const img=new window.Image()
  img.crossOrigin='anonymous'
  img.src=src
  await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('Falha ao carregar um dos elementos do avatar.'))})
  return img
}

function drawCover(ctx:CanvasRenderingContext2D,img:HTMLImageElement,x:number,y:number,w:number,h:number){
  const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight)
  const dw=img.naturalWidth*scale,dh=img.naturalHeight*scale
  ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh)
}

function canvasToPng(canvas:HTMLCanvasElement){
  return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Falha ao gerar PNG do operador.')),'image/png'))
}

async function renderOperatorPng(faceSrc:string,bodySrc:string,face:{left:number;top:number;width:number;height:number},mode:'card'|'mvp'){
  const [faceImg,bodyImg]=await Promise.all([loadCanvasImage(faceSrc),loadCanvasImage(bodySrc)])
  const height=mode==='mvp'?MVP_CROP_HEIGHT:ART_HEIGHT
  const canvas=document.createElement('canvas')
  canvas.width=ART_WIDTH
  canvas.height=height
  const ctx=canvas.getContext('2d')
  if(!ctx) throw new Error('Falha ao preparar render do operador.')
  ctx.clearRect(0,0,canvas.width,canvas.height)

  const fx=face.left/100*ART_WIDTH,fy=face.top/100*ART_HEIGHT
  const fw=face.width/100*ART_WIDTH,fh=face.height/100*ART_HEIGHT
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(fx+fw/2,fy+fh/2,fw*.5,fh*.52,0,0,Math.PI*2)
  ctx.clip()
  drawCover(ctx,faceImg,fx,fy,fw,fh)
  ctx.restore()

  ctx.drawImage(bodyImg,0,0,ART_WIDTH,ART_HEIGHT)
  return canvasToPng(canvas)
}

export default function LoadoutConfigurator({ userId, initialProfile, dbLoadouts, teams = [], initialAvatarUrl }:{userId:string;initialProfile:any;dbLoadouts:any[];teams:any[];initialAvatarUrl:string|null}){
  const supabase = useMemo(()=>createClient(),[])
  const mappedLoadouts = dbLoadouts.length ? dbLoadouts.map((l:any)=>{
    const preset=FALLBACK_LOADOUTS.find(p=>p.key===l.key) || FALLBACK_LOADOUTS[0]
    return {key:l.key,name:l.name,tag:l.tagline||l.name,description:l.description,stats:Array.isArray(l.stats)?l.stats:[1,1,1,0],classLabel:preset.classLabel,accent:preset.accent,weaponHint:preset.weaponHint,accessoryHint:preset.accessoryHint}
  }) : FALLBACK_LOADOUTS
  const loadouts = initialProfile?.role==='manager' ? mappedLoadouts.filter((l:any)=>l.key==='commander') : mappedLoadouts.filter((l:any)=>l.key!=='commander')
  const squads = teams.length ? teams : SQUAD_FALLBACKS
  const defaults = readCustomState(initialProfile, squads)

  const [selected,setSelected]=useState(loadouts.some((l:any)=>l.key===initialProfile?.selected_loadout) ? initialProfile.selected_loadout : loadouts[0].key)
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
  const [bgScene,setBgScene]=useState(defaults.bgScene)
  const [faceDirty,setFaceDirty]=useState(false)
  const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState('')
  const [dragging,setDragging]=useState(false)
  const dragRef=useRef<{x:number;y:number;startX:number;startY:number}>({x:0,y:0,startX:0,startY:0})

  const selectedLoadout = loadouts.find((l:any)=>l.key===selected) || loadouts[0]
  const art = REALISTIC_ART[selected] || REALISTIC_ART.assault
  const squadName = squads.find((team:any) => team.id === squadId)?.name || defaults.squadName
  const rawFaceBackground = source ? { backgroundImage:`url(${source})`, backgroundSize:`${zoom * 100}%`, backgroundPosition:`calc(50% + ${x}px) calc(50% + ${y}px)` } : undefined
  const previewFaceBackground = source ? { backgroundImage:`url(${source})`, backgroundSize:file ? `${Math.max(100, zoom * 118)}%` : 'cover', backgroundPosition:file ? `calc(50% + ${x*.34}px) calc(50% + ${y*.34}px)` : 'center' } : undefined
  const selectedScene = BG_SCENES.find(item=>item.key===bgScene) || BG_SCENES[0]

  function selectLoadout(key:string){
    setSelected(key)
    const kit=DEFAULT_KIT[key]
    if(kit){ setOutfit(kit.outfit);setHeadgear(kit.headgear);setWeapon(kit.weapon);setAccessory(kit.accessory) }
  }

  function onPick(e:React.ChangeEvent<HTMLInputElement>){
    const f=e.target.files?.[0]; if(!f) return
    setFile(f);setSource(URL.createObjectURL(f));setZoom(1.18);setX(0);setY(0);setFaceDirty(true);setMsg('')
  }

  function onPointerDown(e:React.PointerEvent<HTMLDivElement>) {
    if (!source) return
    setDragging(true);dragRef.current={startX:e.clientX,startY:e.clientY,x,y};e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e:React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !source) return
    setX(clamp(dragRef.current.x+(e.clientX-dragRef.current.startX),-150,150))
    setY(clamp(dragRef.current.y+(e.clientY-dragRef.current.startY),-150,150))
    setFaceDirty(true)
  }
  function onPointerUp(e:React.PointerEvent<HTMLDivElement>) { if(!dragging)return;setDragging(false);try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{} }

  async function makeCrop(){
    if(!source) return null
    const img=new window.Image();img.crossOrigin='anonymous';img.src=source
    await new Promise((res,rej)=>{img.onload=()=>res(true);img.onerror=rej})
    const canvas=document.createElement('canvas');canvas.width=OUTPUT_SIZE;canvas.height=OUTPUT_SIZE
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Falha ao preparar a arte do avatar.')
    ctx.fillStyle='#0b100f';ctx.fillRect(0,0,OUTPUT_SIZE,OUTPUT_SIZE)
    const scale=Math.max(OUTPUT_SIZE/img.naturalWidth,OUTPUT_SIZE/img.naturalHeight)*zoom
    const drawWidth=img.naturalWidth*scale,drawHeight=img.naturalHeight*scale
    const dx=(OUTPUT_SIZE-drawWidth)/2+(x*OUTPUT_SHIFT_RATIO),dy=(OUTPUT_SIZE-drawHeight)/2+(y*OUTPUT_SHIFT_RATIO)
    ctx.imageSmoothingQuality='high';ctx.drawImage(img,dx,dy,drawWidth,drawHeight)
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Falha ao gerar corte')),'image/jpeg',.94))
  }

  async function save(){
    let temporaryFaceUrl:string|null=null
    try{
      setSaving(true);setMsg('GERANDO AVATAR DEFINITIVO...')
      let avatarPath=initialProfile?.avatar_path || null
      let faceSource=source

      if(source && (file || !avatarPath || faceDirty)){
        const blob=await makeCrop()
        if(blob){
          const path=`${userId}/avatar-${Date.now()}.jpg`
          const {error}=await supabase.storage.from('avatars').upload(path,blob,{contentType:'image/jpeg',upsert:true})
          if(error)throw error
          avatarPath=path
          const publicUrl=supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
          setSource(publicUrl);setFile(null)
          temporaryFaceUrl=URL.createObjectURL(blob)
          faceSource=temporaryFaceUrl
        }
      }

      const previousCrop=initialProfile?.avatar_crop && typeof initialProfile.avatar_crop==='object' ? initialProfile.avatar_crop : {}
      let renderCardPath=previousCrop.renderCardPath || null
      let renderMvpPath=previousCrop.renderMvpPath || null

      if(faceSource){
        setMsg('MESCLANDO ROSTO E PERSONAGEM...')
        const [cardPng,mvpPng]=await Promise.all([
          renderOperatorPng(faceSource,art.src,art.face,'card'),
          renderOperatorPng(faceSource,art.src,art.face,'mvp'),
        ])
        const stamp=Date.now()
        renderCardPath=`${userId}/renders/operator-card-${stamp}.png`
        renderMvpPath=`${userId}/renders/operator-mvp-${stamp}.png`
        const [{error:cardError},{error:mvpError}]=await Promise.all([
          supabase.storage.from('avatars').upload(renderCardPath,cardPng,{contentType:'image/png',upsert:true}),
          supabase.storage.from('avatars').upload(renderMvpPath,mvpPng,{contentType:'image/png',upsert:true}),
        ])
        if(cardError)throw cardError
        if(mvpError)throw mvpError
      }

      const normalizedFace = source ? {zoom:1,x:0,y:0} : {zoom,x,y}
      const payload={
        selected_loadout:selected,
        avatar_path:avatarPath,
        avatar_crop:{...normalizedFace,codename,squadId,squadName,outfit,headgear,weapon,accessory,bgScene,renderCardPath,renderMvpPath,renderVersion:3},
        updated_at:new Date().toISOString(),
      }
      const {error}=await supabase.from('profiles').update(payload).eq('id',userId)
      if(error)throw error
      if(source){setZoom(1);setX(0);setY(0);setFaceDirty(false)}
      setMsg('OPERADOR FINALIZADO. PNG NORMAL E PNG MVP FORAM GERADOS E SALVOS.')
    }catch(err:any){
      setMsg(err?.message || 'Não foi possível gerar o avatar definitivo.')
    }finally{
      if(temporaryFaceUrl) URL.revokeObjectURL(temporaryFaceUrl)
      setSaving(false)
    }
  }

  return <>
    <div className="section-head"><h2>{initialProfile?.role==='manager'?'Loadout de ': 'Escolha seu '}<b>{initialProfile?.role==='manager'?'Comando':'Loadout'}</b></h2><div className="line"/><div className="meta">{initialProfile?.role==='manager'?'configuração exclusiva para gerente de equipe':'4 classes · operadores ultra realistas'}</div></div>
    <div className="loadout-grid cinematic-loadouts">{loadouts.map((l:any,i:number)=>{
      const loadoutArt=REALISTIC_ART[l.key] || REALISTIC_ART.assault
      return <button type="button" key={l.key} className={`loadout-card cinematic-card accent-${l.accent} ${selected===l.key?'selected':''}`} onClick={()=>selectLoadout(l.key)}>
        <img className="loadout-card-art" src={loadoutArt.src} alt="" aria-hidden="true"/>
        <div className="loadout-card-shade"/>
        <div className="loadout-card-copy">
          <div className="loadout-id">LOADOUT 0{i+1} // {l.tag}</div>
          <h3>{l.name}</h3><div className="loadout-class">{l.classLabel}</div>
          <p>{l.description}</p>
          <div className="loadout-meta-row"><span>{l.weaponHint}</span><span>{l.accessoryHint}</span></div>
          <div className="loadout-stats">{[0,1,2,3].map(n=><span key={n} className={l.stats[n]?'on':''}/>)}</div>
        </div>
      </button>})}</div>

    <div className="section-head"><h2>Monte seu <b>Operador</b></h2><div className="line"/><div className="meta">rosto real · personagem de game · card final</div></div>
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
        <div className="loadout-summary-card"><div className="summary-kicker">Resumo da composição</div>
          <div className="summary-row"><span>Classe</span><strong>{selectedLoadout.name}</strong></div>
          <div className="summary-row"><span>Arma</span><strong>{WEAPONS.find(item=>item.key===weapon)?.name}</strong></div>
          <div className="summary-row"><span>Acessório</span><strong>{ACCESSORIES.find(item=>item.key===accessory)?.name}</strong></div>
          <div className="summary-row"><span>Squad</span><strong>{squadName}</strong></div>
        </div>
      </section>

      <section className="panel stack-panel crop-panel">
        <div className="page-kicker">EDITOR DE ROSTO · ARRASTE PARA AJUSTAR</div>
        <div className={`crop-stage improved ${dragging?'dragging':''}`} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
          {source?<div className="crop-photo" style={rawFaceBackground}/>:<div className="empty-state"><strong>Envie sua foto frontal</strong><span>Depois arraste para posicionar o rosto e use os controles finos abaixo.</span></div>}
          <div className="crop-mask improved-mask"/><div className="crop-cross"/><div className="drag-tip">ARRASTE A FOTO PARA POSICIONAR O ROSTO</div>
        </div>
        <div className="upload-actions"><label className="ghost-btn" htmlFor="face-upload">Enviar foto</label><button type="button" className="ghost-btn" onClick={()=>{setZoom(1);setX(0);setY(0);setFaceDirty(true)}}>Centralizar</button><input id="face-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick}/></div>
        <div className="slider-row"><label>Zoom</label><input type="range" min="0.8" max="2.4" step="0.02" value={zoom} onChange={e=>{setZoom(Number(e.target.value));setFaceDirty(true)}}/><output>{zoom.toFixed(2)}x</output></div>
        <div className="slider-row"><label>Horizontal</label><input type="range" min="-150" max="150" value={x} onChange={e=>{setX(Number(e.target.value));setFaceDirty(true)}}/><output>{x}px</output></div>
        <div className="slider-row"><label>Vertical</label><input type="range" min="-150" max="150" value={y} onChange={e=>{setY(Number(e.target.value));setFaceDirty(true)}}/><output>{y}px</output></div>
      </section>

      <section className="panel stack-panel loadout-choices-panel">
        <div className="page-kicker">PERSONALIZAÇÃO TÁTICA</div>
        <div className="choice-group"><div className="choice-title">4 roupas</div><div className="choice-grid four-up">{OUTFITS.map(item=><button type="button" key={item.key} className={`option-chip visual ${outfit===item.key?'selected':''}`} onClick={()=>setOutfit(item.key)}><span>{item.name}</span><small>{item.description}</small></button>)}</div></div>
        <div className="choice-group"><div className="choice-title">4 personalizações de cabeça</div><div className="choice-grid four-up">{HEADGEARS.map(item=><button type="button" key={item.key} className={`option-chip visual ${headgear===item.key?'selected':''}`} onClick={()=>setHeadgear(item.key)}><span>{item.name}</span><small>{item.description}</small></button>)}</div></div>
        <div className="choice-group"><div className="choice-title">4 armas</div><div className="choice-grid four-up">{WEAPONS.map(item=><button type="button" key={item.key} className={`option-chip visual ${weapon===item.key?'selected':''}`} onClick={()=>setWeapon(item.key)}><span>{item.name}</span><small>{item.description}</small></button>)}</div></div>
        <div className="choice-group"><div className="choice-title">4 itens de personalização</div><div className="choice-grid four-up">{ACCESSORIES.map(item=><button type="button" key={item.key} className={`option-chip visual ${accessory===item.key?'selected':''}`} onClick={()=>setAccessory(item.key)}><span>{item.name}</span><small>{item.description}</small></button>)}</div></div>
        <div className="choice-group"><div className="choice-title">Escolha o background do avatar</div><div className="scene-grid">{BG_SCENES.map(item=><button type="button" key={item.key} className={`scene-card ${bgScene===item.key?'selected':''}`} onClick={()=>setBgScene(item.key)}><img src={item.src} alt={item.name}/><div className="scene-card-copy"><span>{item.name}</span><small>{item.description}</small></div></button>)}</div></div>
      </section>

      <section className="panel stack-panel preview-panel enhanced-preview">
        <div className="page-kicker">CARD FINAL DO OPERADOR</div>
        <div className={`operator-card-builder realistic-card accent-${selectedLoadout.accent} outfit-tone-${outfit}`}>
          <div className="builder-topline"><span>OPERAÇÃO SEXTA MARCHA</span><span>{selectedLoadout.classLabel}</span></div>
          <div className="realistic-stage">
            <img className="realistic-stage-bg" src={selectedScene.src} alt="" aria-hidden="true"/>
            <div className="realistic-operator-wrap">
              {source&&<div className="realistic-face" style={{left:`${art.face.left}%`,top:`${art.face.top}%`,width:`${art.face.width}%`,height:`${art.face.height}%`,...previewFaceBackground}}/>}
              <img className="realistic-body-art" src={art.src} alt={`${selectedLoadout.name} - operador tático`}/>
            </div>
            <div className="realistic-stage-noise"/>
            <div className="realistic-stage-label"><span>VISUAL BASE</span><strong>{selectedLoadout.name}</strong><small>{selectedLoadout.weaponHint} · {selectedLoadout.accessoryHint}</small></div>
          </div>
          <div className="builder-info"><div className="badge-line">SQUAD · {squadName}</div><h3>{codename || 'DEFINA SEU CODINOME'}</h3><strong>{initialProfile?.full_name || 'OPERADOR'}</strong><div className="builder-class">Classe escolhida: {selectedLoadout.name}</div>
            <div className="builder-loadout-list"><div><span>Roupa</span><b>{OUTFITS.find(item=>item.key===outfit)?.name}</b></div><div><span>Cabeça</span><b>{HEADGEARS.find(item=>item.key===headgear)?.name}</b></div><div><span>Arma</span><b>{WEAPONS.find(item=>item.key===weapon)?.name}</b></div><div><span>Item</span><b>{ACCESSORIES.find(item=>item.key===accessory)?.name}</b></div></div>
            <p>{selectedLoadout.description}</p>
          </div>
          <div className="builder-footer"><div className="operator-bars">{selectedLoadout.stats.map((value:number,index:number)=><span key={index} className={value?'on':''}/>)}</div><button className="primary-btn" onClick={save} disabled={saving}>{saving?'Gerando PNGs...':'Salvar avatar e loadout'}</button></div>
        </div>
        <div className="render-note">Ao salvar, o sistema gera duas imagens finais: uma para os cards e outra já enquadrada da cintura para cima para o MVP.</div>{msg&&<div className="form-msg">{msg}</div>}
      </section>
    </div>
  </>
}
