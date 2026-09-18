'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LiveRefresh(){
  const router=useRouter()
  const [now,setNow]=useState(new Date())
  const [full,setFull]=useState(false)
  useEffect(()=>{
    const clock=setInterval(()=>setNow(new Date()),1000)
    const refresh=setInterval(()=>router.refresh(),15000)
    const onFull=()=>setFull(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange',onFull)
    return()=>{clearInterval(clock);clearInterval(refresh);document.removeEventListener('fullscreenchange',onFull)}
  },[router])
  async function toggleFull(){
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{}
  }
  return <div className="live-clock"><span className="live-pulse"/><b>AO VIVO</b><strong>{now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</strong><small>atualiza a cada 15s</small><button className="tv-mode-btn" type="button" onClick={toggleFull}>{full?'Sair do telão':'Modo telão'}</button></div>
}
