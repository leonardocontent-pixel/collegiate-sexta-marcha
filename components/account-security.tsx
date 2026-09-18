'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './account-security.module.css'

export default function AccountSecurity({fullName,email,role}:{fullName:string;email:string;role:string}){
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const [busy,setBusy]=useState(false)
  const [msg,setMsg]=useState('')
  const [ok,setOk]=useState(false)

  async function changePassword(e:React.FormEvent){
    e.preventDefault()
    setMsg('');setOk(false)
    if(password.length<8){setMsg('A nova senha precisa ter pelo menos 8 caracteres.');return}
    if(password!==confirm){setMsg('As duas senhas não coincidem.');return}
    try{
      setBusy(true)
      const supabase=createClient()
      const {error}=await supabase.auth.updateUser({password})
      if(error)throw error
      setPassword('');setConfirm('');setOk(true);setMsg('SENHA ALTERADA COM SUCESSO. NO PRÓXIMO ACESSO, ENTRE COM E-MAIL E A NOVA SENHA.')
    }catch(error:any){
      setMsg(error?.message||'Não foi possível alterar a senha.')
    }finally{setBusy(false)}
  }

  return <div className={styles.grid}>
    <section className={`panel ${styles.profile}`}>
      <div className="page-kicker">IDENTIFICAÇÃO // OPERADOR</div>
      <h2>{fullName}</h2>
      <div className={styles.row}><span>E-mail</span><strong>{email||'—'}</strong></div>
      <div className={styles.row}><span>Perfil</span><strong>{role==='executive'?'Executivo':role==='manager'?'Gerente':'Administrador'}</strong></div>
      <div className={styles.status}><i/> ACESSO ATIVO</div>
    </section>

    <form className={`panel ${styles.password}`} onSubmit={changePassword}>
      <div className="page-kicker">SEGURANÇA // CREDENCIAIS</div>
      <h2>Trocar minha senha</h2>
      <p>Defina uma senha pessoal para entrar diretamente pela tela de login, sem depender do link enviado por e-mail.</p>
      <div className="field"><label>Nova senha</label><input type="password" minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" required/></div>
      <div className="field"><label>Confirmar nova senha</label><input type="password" minLength={8} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repita a nova senha" required/></div>
      <div className={styles.hint}><span className={password.length>=8?styles.ok:''}/> Use no mínimo 8 caracteres. Prefira letras, números e símbolos.</div>
      {msg&&<div className={`${styles.message} ${ok?styles.success:''}`}>{msg}</div>}
      <button className="primary-btn" disabled={busy}>{busy?'Atualizando...':'Atualizar senha →'}</button>
    </form>
  </div>
}
