'use client'

import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FALLBACK_LOADOUTS = [
  { key:'assault', name:'Assalto', tag:'Agressividade', description:'Ritmo alto, presença e fechamento.', stats:[1,1,1,0] },
  { key:'sniper', name:'Precisão', tag:'Negociação', description:'Foco em conversão de oportunidades qualificadas.', stats:[1,1,0,0] },
  { key:'recon', name:'Recon', tag:'Inteligência', description:'Cadência, leitura de funil e prospecção.', stats:[1,1,1,1] },
  { key:'support', name:'Suporte', tag:'Equipe', description:'Trabalho coordenado e força coletiva.', stats:[1,0,1,1] },
]

export default function LoadoutConfigurator({ userId, initialProfile, dbLoadouts, initialAvatarUrl }:{userId:string;initialProfile:any;dbLoadouts:any[];initialAvatarUrl:string|null}){
  const supabase = useMemo(()=>createClient(),[])
  const loadouts = dbLoadouts.length ? dbLoadouts.map((l:any)=>({ key:l.key,name:l.name,tag:l.tagline||l.name,description:l.description,stats:Array.isArray(l.stats)?l.stats:[1,1,1,0] })) : FALLBACK_LOADOUTS
  const [selected,setSelected]=useState(initialProfile?.selected_loadout || loadouts[0].key)
  const [source,setSource]=useState<string|null>(initialAvatarUrl)
  const [file,setFile]=useState<File|null>(null)
  const [zoom,setZoom]=useState(1.25)
  const [x,setX]=useState(0)
  const [y,setY]=useState(0)
  const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState('')
  const imgRef=useRef<HTMLImageElement|null>(null)

  function onPick(e:React.ChangeEvent<HTMLInputElement>){
    const f=e.target.files?.[0]; if(!f) return
    setFile(f); setSource(URL.createObjectURL(f)); setZoom(1.25);setX(0);setY(0);setMsg('')
  }

  async function makeCrop(){
    if(!source) return null
    const img=new window.Image(); img.crossOrigin='anonymous'; img.src=source
    await new Promise((res,rej)=>{img.onload=()=>res(true);img.onerror=rej})
    const base=Math.min(img.naturalWidth,img.naturalHeight)
    const crop=base/zoom
    const cx=img.naturalWidth/2 + (x/100)*(img.naturalWidth*.28)
    const cy=img.naturalHeight/2 + (y/100)*(img.naturalHeight*.28)
    const sx=Math.max(0,Math.min(img.naturalWidth-crop,cx-crop/2))
    const sy=Math.max(0,Math.min(img.naturalHeight-crop,cy-crop/2))
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=640
    const ctx=canvas.getContext('2d')!;ctx.imageSmoothingQuality='high';ctx.drawImage(img,sx,sy,crop,crop,0,0,640,640)
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Falha ao gerar corte')),'image/jpeg',.92))
  }

  async function save(){
    try{
      setSaving(true);setMsg('')
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
      const payload={selected_loadout:selected,avatar_path:avatarPath,avatar_crop:{zoom,x,y},updated_at:new Date().toISOString()}
      const {error}=await supabase.from('profiles').update(payload).eq('id',userId); if(error) throw error
      if(initialProfile?.operator_id){
        const {error:opError}=await supabase.from('operators').update({selected_loadout:selected,avatar_path:avatarPath}).eq('id',initialProfile.operator_id); if(opError) throw opError
      }
      setMsg('LOADOUT SALVO. OPERADOR ATUALIZADO.')
    }catch(err:any){setMsg(err?.message || 'Não foi possível salvar o loadout.')}
    finally{setSaving(false)}
  }

  const faceStyle = source ? {transform:`translate(${x*.45}px, ${y*.45}px) scale(${zoom})`} : undefined
  return <>
    <div className="section-head"><h2>Escolha seu <b>Loadout</b></h2><div className="line"/><div className="meta">4 configurações de operação</div></div>
    <div className="loadout-grid">{loadouts.map((l:any,i:number)=><button type="button" key={l.key} className={`loadout-card ${selected===l.key?'selected':''}`} onClick={()=>setSelected(l.key)}>
      <div className="loadout-id">LOADOUT 0{i+1} // {l.tag}</div><h3>{l.name}</h3><p>{l.description}</p><div className="loadout-stats">{[0,1,2,3].map(n=><span key={n} className={l.stats[n]?'on':''}/>)}</div>
    </button>)}</div>

    <div className="section-head"><h2>Personalize seu <b>Operador</b></h2><div className="line"/><div className="meta">corte de rosto · avatar mini crack</div></div>
    <div className="customizer">
      <section className="crop-panel">
        <div className="page-kicker">AJUSTE E POSICIONE SEU ROSTO</div>
        <div className="crop-stage">
          {source ? <img ref={imgRef} src={source} alt="Foto para corte" style={{width:'78%',height:'78%',objectFit:'cover',...faceStyle}}/> : <div className="empty" style={{border:0}}>Envie uma foto frontal para iniciar</div>}
          <div className="crop-mask"/><div className="crop-cross"/>
        </div>
        <div className="upload-zone"><label className="ghost-btn" htmlFor="face-upload">Enviar foto</label><input id="face-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick}/></div>
        <div className="slider-row"><label>Zoom</label><input type="range" min="1" max="2.4" step=".02" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/><output>{zoom.toFixed(2)}x</output></div>
        <div className="slider-row"><label>Horizontal</label><input type="range" min="-100" max="100" value={x} onChange={e=>setX(Number(e.target.value))}/><output>{x}</output></div>
        <div className="slider-row"><label>Vertical</label><input type="range" min="-100" max="100" value={y} onChange={e=>setY(Number(e.target.value))}/><output>{y}</output></div>
      </section>
      <section className="preview-panel">
        <div className="page-kicker">PRÉVIA DO SEU OPERADOR</div>
        <div className="mini-preview">
          <Image className="body-img" src="/assets/operator-body.webp" width={620} height={540} alt="Corpo tático"/>
          <div className="mini-head">{source?<img src={source} alt="Rosto do operador" style={{transform:`translate(${x*.3}px,${y*.3}px) scale(${zoom})`}}/>:<Image src="/assets/operator-3.webp" fill alt="Avatar padrão" style={{objectFit:'cover'}}/>}</div>
          <div className="preview-tag"><strong>{initialProfile?.full_name || 'OPERADOR'}</strong><small>{loadouts.find((l:any)=>l.key===selected)?.name} · Collegiate Vendas</small></div>
        </div>
        <div className="save-row"><button className="primary-btn" onClick={save} disabled={saving}>{saving?'Salvando...':'Salvar avatar e loadout'}</button></div>
        {msg&&<div className="form-msg">{msg}</div>}
      </section>
    </div>
  </>
}
