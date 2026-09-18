'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile={id:string;full_name:string|null;email:string|null;role:string;active:boolean;team_id:string|null;teams?:{name:string}|null}
type InviteState={fullName:string;email:string;password:string;role:'admin'|'manager'|'executive';teamId:string}

const EMPTY_INVITE:InviteState={fullName:'',email:'',password:'',role:'executive',teamId:''}

async function readJson(response:Response){
  const payload=await response.json().catch(()=>({ok:false,error:`Erro HTTP ${response.status}`}))
  if(!response.ok || !payload.ok) throw new Error(payload.error||`Erro HTTP ${response.status}`)
  return payload
}

export default function ManagementPanel({initialProfiles,teams,viewerRole}:{initialProfiles:Profile[];teams:any[];viewerRole:string}){
  const supabase=useMemo(()=>createClient(),[])
  const [profiles,setProfiles]=useState(initialProfiles)
  const [search,setSearch]=useState('')
  const [editing,setEditing]=useState<Profile|null>(null)
  const [invite,setInvite]=useState(false)
  const [inviteData,setInviteData]=useState<InviteState>(EMPTY_INVITE)
  const [busy,setBusy]=useState(false)
  const [msg,setMsg]=useState('')
  const [modalError,setModalError]=useState('')
  const isAdmin=viewerRole==='admin'
  const filtered=profiles.filter(p=>`${p.full_name||''} ${p.email||''} ${p.role}`.toLowerCase().includes(search.toLowerCase()))

  async function refresh(){
    const {data,error}=await supabase.from('profiles').select('id,full_name,email,role,active,team_id,teams(name)').order('full_name')
    if(error) throw error
    if(data)setProfiles(data as any)
  }

  async function updateProfile(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    if(!editing||!isAdmin)return
    const form=new FormData(e.currentTarget)
    try{
      setBusy(true);setMsg('');setModalError('')
      const patch={full_name:String(form.get('full_name')||'').trim(),role:String(form.get('role')||'executive'),active:String(form.get('active'))==='true',team_id:String(form.get('team_id')||'')||null,updated_at:new Date().toISOString()}
      const {error}=await supabase.from('profiles').update(patch).eq('id',editing.id)
      if(error)throw error
      const newPassword=String(form.get('new_password')||'')
      if(newPassword){
        await readJson(await fetch('/api/admin/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:editing.id,password:newPassword})}))
      }
      await refresh()
      setEditing(null)
      setMsg(newPassword?'ACESSO E SENHA ATUALIZADOS COM SUCESSO.':'ACESSO ATUALIZADO COM SUCESSO.')
    }catch(e:any){setModalError(e.message||'Falha ao atualizar acesso.')}finally{setBusy(false)}
  }

  async function createUser(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    if(!isAdmin||busy)return
    try{
      setBusy(true);setMsg('');setModalError('')
      const payload={
        fullName:inviteData.fullName.trim(),
        email:inviteData.email.trim().toLowerCase(),
        password:inviteData.password,
        role:inviteData.role,
        teamId:inviteData.teamId||null,
      }
      if(!payload.fullName)throw new Error('Informe o nome do usuário.')
      if(!payload.email)throw new Error('Informe o e-mail do usuário.')
      if(payload.password.length<8)throw new Error('A senha inicial deve ter pelo menos 8 caracteres.')

      await readJson(await fetch('/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}))
      await refresh()
      setInviteData(EMPTY_INVITE)
      setInvite(false)
      setMsg('USUÁRIO CRIADO COM SUCESSO. ELE JÁ PODE ENTRAR COM E-MAIL E SENHA.')
    }catch(e:any){
      setModalError(e.message||'Falha ao criar usuário.')
    }finally{setBusy(false)}
  }

  function openInvite(){setInviteData(EMPTY_INVITE);setModalError('');setMsg('');setInvite(true)}
  function closeInvite(){if(!busy){setInvite(false);setModalError('')}}

  return <>
    <div className="toolbar"><input className="search" placeholder="Buscar por nome, e-mail ou perfil..." value={search} onChange={e=>setSearch(e.target.value)}/>{isAdmin&&<button className="primary-btn" onClick={openInvite}>+ Novo usuário</button>}</div>
    {msg&&<div className="form-msg" style={{marginBottom:12,color:'#9fe7ff'}}>{msg}</div>}
    <div className="panel" style={{padding:0,overflow:'auto'}}><table className="data-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Squad</th><th>Status</th><th>Ações</th></tr></thead><tbody>
      {filtered.map(p=><tr key={p.id}><td>{p.full_name||'—'}</td><td>{p.email||'—'}</td><td><span className="badge">{p.role==='executive'?'Executivo':p.role==='manager'?'Gerente':'Administrador'}</span></td><td>{p.teams?.name||'—'}</td><td><span className={`badge ${p.active?'green':'red'}`}>{p.active?'Ativo':'Bloqueado'}</span></td><td>{isAdmin?<button className="icon-btn" onClick={()=>{setModalError('');setEditing(p)}}>✎</button>:<span style={{color:'#59655d'}}>somente leitura</span>}</td></tr>)}
    </tbody></table></div>

    {editing&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy){setEditing(null);setModalError('')}}}><form className="modal" onSubmit={updateProfile}><h3>Editar acesso</h3><p className="page-sub">Defina função, squad e status do usuário. Apenas perfis Executivo aparecem no ranking da Home.</p><div className="modal-grid"><div className="field"><label>Nome</label><input name="full_name" defaultValue={editing.full_name||''}/></div><div className="field"><label>Perfil</label><select name="role" defaultValue={editing.role}><option value="executive">Executivo</option><option value="manager">Gerente</option><option value="admin">Administrador</option></select></div></div><div className="modal-grid"><div className="field"><label>Squad</label><select name="team_id" defaultValue={editing.team_id||''}><option value="">Sem squad</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div><div className="field"><label>Status</label><select name="active" defaultValue={String(editing.active)}><option value="true">Ativo</option><option value="false">Bloqueado</option></select></div></div><div className="field"><label>Redefinir senha <small style={{opacity:.55}}>(opcional)</small></label><input name="new_password" type="password" minLength={8} autoComplete="new-password" placeholder="Preencha somente se quiser trocar a senha deste usuário"/></div>{modalError&&<div className="form-msg" style={{margin:'10px 0 0',padding:'10px 12px',border:'1px solid rgba(227,109,100,.4)',background:'rgba(227,109,100,.08)',color:'#ffc0bb'}}>{modalError}</div>}<div className="modal-actions"><button type="button" className="ghost-btn" disabled={busy} onClick={()=>{setEditing(null);setModalError('')}}>Cancelar</button><button className="primary-btn" disabled={busy}>{busy?'Salvando...':'Salvar acesso'}</button></div></form></div>}

    {invite&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeInvite()}}><form className="modal" onSubmit={createUser}><h3>Novo usuário</h3><p className="page-sub">Crie o usuário com uma senha inicial. Em caso de erro, os dados permanecem preenchidos para você corrigir.</p><div className="modal-grid"><div className="field"><label>Nome</label><input value={inviteData.fullName} onChange={e=>setInviteData(v=>({...v,fullName:e.target.value}))} required/></div><div className="field"><label>E-mail</label><input value={inviteData.email} onChange={e=>setInviteData(v=>({...v,email:e.target.value}))} type="email" required autoComplete="off"/></div></div><div className="field"><label>Senha inicial</label><input value={inviteData.password} onChange={e=>setInviteData(v=>({...v,password:e.target.value}))} type="password" minLength={8} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" required/></div><div className="modal-grid"><div className="field"><label>Perfil</label><select value={inviteData.role} onChange={e=>setInviteData(v=>({...v,role:e.target.value as InviteState['role']}))}><option value="executive">Executivo</option><option value="manager">Gerente</option><option value="admin">Administrador</option></select></div><div className="field"><label>Squad</label><select value={inviteData.teamId} onChange={e=>setInviteData(v=>({...v,teamId:e.target.value}))}><option value="">Sem squad</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div></div>{modalError&&<div className="form-msg" style={{margin:'10px 0 0',padding:'10px 12px',border:'1px solid rgba(227,109,100,.4)',background:'rgba(227,109,100,.08)',color:'#ffc0bb'}}>{modalError}</div>}<div className="modal-actions"><button type="button" className="ghost-btn" disabled={busy} onClick={closeInvite}>Cancelar</button><button className="primary-btn" disabled={busy}>{busy?'Criando usuário...':'Criar usuário'}</button></div></form></div>}
  </>
}
