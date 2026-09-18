'use client'

import { useMemo, useState } from 'react'
import { createClient as createRawClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type Profile={id:string;full_name:string|null;email:string|null;role:string;active:boolean;team_id:string|null;teams?:{name:string}|null}

export default function ManagementPanel({initialProfiles,teams,viewerRole}:{initialProfiles:Profile[];teams:any[];viewerRole:string}){
  const supabase=useMemo(()=>createClient(),[])
  const [profiles,setProfiles]=useState(initialProfiles)
  const [search,setSearch]=useState('')
  const [editing,setEditing]=useState<Profile|null>(null)
  const [invite,setInvite]=useState(false)
  const [busy,setBusy]=useState(false)
  const [msg,setMsg]=useState('')
  const isAdmin=viewerRole==='admin'
  const filtered=profiles.filter(p=>`${p.full_name||''} ${p.email||''} ${p.role}`.toLowerCase().includes(search.toLowerCase()))

  async function refresh(){
    const {data}=await supabase.from('profiles').select('id,full_name,email,role,active,team_id,teams(name)').order('full_name')
    if(data)setProfiles(data as any)
  }

  async function updateProfile(form:FormData){
    if(!editing||!isAdmin)return
    try{setBusy(true);setMsg('')
      const patch={full_name:String(form.get('full_name')||'').trim(),role:String(form.get('role')||'executive'),active:String(form.get('active'))==='true',team_id:String(form.get('team_id')||'')||null,updated_at:new Date().toISOString()}
      const {error}=await supabase.from('profiles').update(patch).eq('id',editing.id);if(error)throw error
      setEditing(null);await refresh();setMsg('ACESSO ATUALIZADO COM SUCESSO.')
    }catch(e:any){setMsg(e.message||'Falha ao atualizar acesso.')}finally{setBusy(false)}
  }

  async function inviteUser(form:FormData){
    if(!isAdmin)return
    try{setBusy(true);setMsg('')
      const email=String(form.get('email')||'').trim().toLowerCase(),full_name=String(form.get('full_name')||'').trim(),role=String(form.get('role')||'executive'),team_id=String(form.get('team_id')||'')||null
      if(!email||!full_name)throw new Error('Informe nome e e-mail.')
      const url=process.env.NEXT_PUBLIC_SUPABASE_URL!,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      const inviter=createRawClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
      const {error:inviteError}=await inviter.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:`${window.location.origin}/auth/callback?next=/dashboard`,data:{full_name}}});if(inviteError)throw inviteError
      let created:any=null
      for(let i=0;i<7;i++){await new Promise(r=>setTimeout(r,500));const {data}=await supabase.from('profiles').select('id').eq('email',email).maybeSingle();if(data){created=data;break}}
      if(created){const {error}=await supabase.from('profiles').update({full_name,role,team_id,active:true,updated_at:new Date().toISOString()}).eq('id',created.id);if(error)throw error}
      setInvite(false);await refresh();setMsg('CONVITE ENVIADO. QUANDO O USUÁRIO ATIVAR O ACESSO, ELE JÁ APARECERÁ NO ESQUADRÃO SE FOR EXECUTIVO.')
    }catch(e:any){setMsg(e.message||'Falha ao enviar convite.')}finally{setBusy(false)}
  }

  return <>
    <div className="toolbar"><input className="search" placeholder="Buscar por nome, e-mail ou perfil..." value={search} onChange={e=>setSearch(e.target.value)}/>{isAdmin&&<button className="primary-btn" onClick={()=>setInvite(true)}>+ Novo usuário</button>}</div>
    {msg&&<div className="form-msg" style={{marginBottom:12}}>{msg}</div>}
    <div className="panel" style={{padding:0,overflow:'auto'}}><table className="data-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Squad</th><th>Status</th><th>Ações</th></tr></thead><tbody>
      {filtered.map(p=><tr key={p.id}><td>{p.full_name||'—'}</td><td>{p.email||'—'}</td><td><span className="badge">{p.role==='executive'?'Executivo':p.role==='manager'?'Gerente':'Administrador'}</span></td><td>{p.teams?.name||'—'}</td><td><span className={`badge ${p.active?'green':'red'}`}>{p.active?'Ativo':'Bloqueado'}</span></td><td>{isAdmin?<button className="icon-btn" onClick={()=>setEditing(p)}>✎</button>:<span style={{color:'#59655d'}}>somente leitura</span>}</td></tr>)}
    </tbody></table></div>

    {editing&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(null)}}><form className="modal" action={updateProfile}><h3>Editar acesso</h3><p className="page-sub">Defina função, squad e status do usuário. Apenas perfis Executivo aparecem no ranking da Home.</p><div className="modal-grid"><div className="field"><label>Nome</label><input name="full_name" defaultValue={editing.full_name||''}/></div><div className="field"><label>Perfil</label><select name="role" defaultValue={editing.role}><option value="executive">Executivo</option><option value="manager">Gerente</option><option value="admin">Administrador</option></select></div></div><div className="modal-grid"><div className="field"><label>Squad</label><select name="team_id" defaultValue={editing.team_id||''}><option value="">Sem squad</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div><div className="field"><label>Status</label><select name="active" defaultValue={String(editing.active)}><option value="true">Ativo</option><option value="false">Bloqueado</option></select></div></div><div className="modal-actions"><button type="button" className="ghost-btn" onClick={()=>setEditing(null)}>Cancelar</button><button className="primary-btn" disabled={busy}>{busy?'Salvando...':'Salvar acesso'}</button></div></form></div>}

    {invite&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setInvite(false)}}><form className="modal" action={inviteUser}><h3>Novo usuário</h3><p className="page-sub">Convide o usuário e já defina se ele é Executivo de Vendas, Gerente ou Administrador.</p><div className="modal-grid"><div className="field"><label>Nome</label><input name="full_name" required/></div><div className="field"><label>E-mail</label><input name="email" type="email" required/></div></div><div className="modal-grid"><div className="field"><label>Perfil</label><select name="role" defaultValue="executive"><option value="executive">Executivo</option><option value="manager">Gerente</option><option value="admin">Administrador</option></select></div><div className="field"><label>Squad</label><select name="team_id"><option value="">Sem squad</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div></div><div className="modal-actions"><button type="button" className="ghost-btn" onClick={()=>setInvite(false)}>Cancelar</button><button className="primary-btn" disabled={busy}>{busy?'Enviando...':'Enviar convite'}</button></div></form></div>}
  </>
}
