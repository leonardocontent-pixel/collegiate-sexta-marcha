'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function money(value:number|string){
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(value||0))
}

function parseMoney(value:string){
  const cleaned=String(value||'').trim().replace(/[R$\s]/g,'').replace(/\./g,'').replace(',','.')
  return Number(cleaned)
}

export default function SalesConsole({viewerId,viewerRole,campaign,executives,initialSales,compact=false}:{viewerId:string;viewerRole:string;campaign:any;executives:any[];initialSales:any[];compact?:boolean}){
  const supabase=useMemo(()=>createClient(),[])
  const router=useRouter()
  const manager=viewerRole==='admin'||viewerRole==='manager'
  const isAdmin=viewerRole==='admin'
  const [sales,setSales]=useState(initialSales||[])
  const [busy,setBusy]=useState(false)
  const [msg,setMsg]=useState('')
  const [showForm,setShowForm]=useState(!compact)
  const [editingSale,setEditingSale]=useState<any|null>(null)
  const [editVgv,setEditVgv]=useState('')
  const [deletingSale,setDeletingSale]=useState<any|null>(null)

  async function refresh(){
    const query=supabase.from('sales_submissions').select('*,executive:profiles!sales_submissions_executive_id_fkey(full_name,email),approver:profiles!sales_submissions_approved_by_fkey(full_name)').order('created_at',{ascending:false}).limit(manager?200:100)
    const {data}=manager?await query:await query.eq('executive_id',viewerId)
    if(data)setSales(data as any)
    router.refresh()
  }

  async function submitSale(form:FormData){
    try{
      setBusy(true);setMsg('')
      if(!campaign?.id)throw new Error('Nenhuma campanha ativa encontrada.')
      const executiveId=manager?String(form.get('executive_id')||''):viewerId
      if(!executiveId)throw new Error('Selecione o executivo.')
      const vgv=parseMoney(String(form.get('vgv')||''))
      if(!Number.isFinite(vgv)||vgv<=0)throw new Error('Informe um VGV válido.')
      const payload={
        campaign_id:campaign.id,
        executive_id:executiveId,
        submitted_by:viewerId,
        customer_name:String(form.get('customer_name')||'').trim()||null,
        development:String(form.get('development')||'').trim(),
        unit:String(form.get('unit')||'').trim()||null,
        vgv,
        sold_at:String(form.get('sold_at')||new Date().toISOString().slice(0,10)),
        approval_status:manager?'approved':'pending',
      }
      if(!payload.development)throw new Error('Informe o empreendimento.')
      const {error}=await supabase.from('sales_submissions').insert(payload)
      if(error)throw error
      setMsg(manager?'VENDA REGISTRADA E APROVADA. O RANKING FOI ATUALIZADO.':'VENDA ENVIADA PARA APROVAÇÃO DO GESTOR.')
      const formEl=document.getElementById('sale-form') as HTMLFormElement|null
      formEl?.reset()
      await refresh()
    }catch(e:any){setMsg(e?.message||'Não foi possível registrar a venda.')}finally{setBusy(false)}
  }

  async function decide(id:string,status:'approved'|'rejected'){
    try{
      setBusy(true);setMsg('')
      const {error}=await supabase.from('sales_submissions').update({approval_status:status}).eq('id',id)
      if(error)throw error
      setMsg(status==='approved'?'VENDA APROVADA. PONTUAÇÃO ATUALIZADA.':'VENDA REJEITADA.')
      await refresh()
    }catch(e:any){setMsg(e?.message||'Falha ao atualizar a venda.')}finally{setBusy(false)}
  }

  function openEditValue(sale:any){
    if(!isAdmin)return
    setMsg('')
    setEditingSale(sale)
    setEditVgv(String(Number(sale.vgv||0)))
  }

  async function saveSaleValue(){
    if(!isAdmin||!editingSale)return
    try{
      setBusy(true);setMsg('')
      const vgv=parseMoney(editVgv)
      if(!Number.isFinite(vgv)||vgv<=0)throw new Error('Informe um valor de venda válido.')
      const {error}=await supabase
        .from('sales_submissions')
        .update({vgv,updated_at:new Date().toISOString()})
        .eq('id',editingSale.id)
      if(error)throw error

      setSales(current=>current.map((sale:any)=>sale.id===editingSale.id?{...sale,vgv}:sale))
      setEditingSale(null)
      setEditVgv('')
      setMsg('VALOR DA VENDA ATUALIZADO. VGV, RANKING E METAS FORAM RECALCULADOS.')
      await refresh()
    }catch(e:any){
      setMsg(e?.message||'Não foi possível alterar o valor da venda.')
    }finally{
      setBusy(false)
    }
  }


  async function deleteSale(){
    if(!isAdmin||!deletingSale)return
    try{
      setBusy(true);setMsg('')
      const {error}=await supabase
        .from('sales_submissions')
        .delete()
        .eq('id',deletingSale.id)
      if(error)throw error

      setSales(current=>current.filter((sale:any)=>sale.id!==deletingSale.id))
      setDeletingSale(null)
      setMsg('VENDA APAGADA DEFINITIVAMENTE. VGV, RANKING E METAS FORAM RECALCULADOS.')
      await refresh()
    }catch(e:any){
      setMsg(e?.message||'Não foi possível apagar a venda.')
    }finally{
      setBusy(false)
    }
  }

  const pending=sales.filter((s:any)=>s.approval_status==='pending')
  const approved=sales.filter((s:any)=>s.approval_status==='approved')
  const approvedVgv=approved.reduce((sum:number,s:any)=>sum+Number(s.vgv||0),0)

  return <div className="sales-console">
    <div className="sales-command-head">
      <div><div className="page-kicker">{manager?'CENTRAL DE APROVAÇÃO':'MEU PAINEL DE VENDAS'}</div><h2>{manager?'Comando de vendas':'Enviar nova venda'}</h2><p>{manager?'Vendas lançadas pelo gestor entram aprovadas. Envios dos executivos aguardam sua liberação.':'Envie suas vendas para o gestor. Somente após a aprovação elas entram no VGV e no ranking.'}</p></div>
      <button className="primary-btn" type="button" onClick={()=>setShowForm(v=>!v)}>{showForm?'Fechar formulário':'+ Nova venda'}</button>
    </div>

    <div className="sales-kpis">
      <div><span>Vendas aprovadas</span><strong>{approved.length}</strong></div>
      <div><span>VGV aprovado</span><strong>{money(approvedVgv)}</strong></div>
      <div><span>Aguardando</span><strong className={pending.length?'amber-text':''}>{pending.length}</strong></div>
    </div>

    {showForm&&<form id="sale-form" className="sale-entry panel" action={submitSale}>
      <div className="sale-entry-grid">
        {manager&&<div className="field"><label>Executivo</label><select name="executive_id" required defaultValue=""><option value="" disabled>Selecione o executivo</option>{executives.map((e:any)=><option key={e.id} value={e.id}>{e.full_name||e.email}</option>)}</select></div>}
        <div className="field"><label>Empreendimento</label><input name="development" required placeholder="Ex.: Uberaba III"/></div>
        <div className="field"><label>Unidade</label><input name="unit" placeholder="Ex.: 504"/></div>
        <div className="field"><label>Cliente</label><input name="customer_name" placeholder="Nome do cliente"/></div>
        <div className="field"><label>VGV</label><input name="vgv" inputMode="decimal" required placeholder="232900"/></div>
        <div className="field"><label>Data da venda</label><input name="sold_at" type="date" defaultValue={new Date().toISOString().slice(0,10)}/></div>
      </div>
      <div className="sale-submit-row"><div className={`approval-note ${manager?'approved':'pending'}`}>{manager?'✓ Entrada do gestor: aprovação automática':'◌ Entrada do executivo: aprovação obrigatória'}</div><button className="primary-btn" disabled={busy}>{busy?'Processando...':manager?'Registrar venda':'Enviar para aprovação'}</button></div>
    </form>}

    {msg&&<div className="form-msg operation-message">{msg}</div>}

    {manager&&pending.length>0&&<section className="approval-queue">
      <div className="section-head"><h2>Fila de <b>Aprovação</b></h2><div className="line"/><div className="meta">{pending.length} aguardando comando</div></div>
      <div className="approval-grid">{pending.map((sale:any)=><article className="approval-card" key={sale.id}>
        <div className="approval-status">PENDENTE</div><h3>{sale.executive?.full_name||'Executivo'}</h3><strong>{money(sale.vgv)}</strong><p>{sale.development}{sale.unit?` · ${sale.unit}`:''}</p><small>{new Date(sale.sold_at+'T12:00:00').toLocaleDateString('pt-BR')} · {sale.customer_name||'Cliente não informado'}</small>
        <div className="approval-actions">
          {isAdmin&&<button type="button" className="ghost-btn" disabled={busy} onClick={()=>openEditValue(sale)}>Editar valor</button>}
          {isAdmin&&<button type="button" className="danger-btn" disabled={busy} onClick={()=>setDeletingSale(sale)}>Apagar</button>}
          <button type="button" className="danger-btn" disabled={busy} onClick={()=>decide(sale.id,'rejected')}>Rejeitar</button>
          <button type="button" className="primary-btn" disabled={busy} onClick={()=>decide(sale.id,'approved')}>Aprovar venda</button>
        </div>
      </article>)}</div>
    </section>}

    <div className="section-head"><h2>{manager?'Últimos':'Meu'} <b>Registros</b></h2><div className="line"/><div className="meta">histórico da operação</div></div>
    <div className="panel" style={{padding:0,overflow:'auto'}}><table className="data-table"><thead><tr>{manager&&<th>Executivo</th>}<th>Data</th><th>Empreendimento</th><th>Unidade</th><th>VGV</th><th>Status</th>{isAdmin&&<th>Ações</th>}</tr></thead><tbody>
      {sales.map((s:any)=><tr key={s.id}>{manager&&<td>{s.executive?.full_name||'—'}</td>}<td>{new Date(s.sold_at+'T12:00:00').toLocaleDateString('pt-BR')}</td><td>{s.development}</td><td>{s.unit||'—'}</td><td>{money(s.vgv)}</td><td><span className={`badge ${s.approval_status==='approved'?'green':s.approval_status==='pending'?'amber':'red'}`}>{s.approval_status==='approved'?'Aprovada':s.approval_status==='pending'?'Aguardando':'Rejeitada'}</span></td>{isAdmin&&<td><div style={{display:'flex',gap:6,alignItems:'center'}}><button type="button" className="icon-btn" title="Editar valor da venda" onClick={()=>openEditValue(s)}>✎</button><button type="button" className="icon-btn sale-delete-icon" title="Apagar venda" onClick={()=>setDeletingSale(s)}>×</button></div></td>}</tr>)}
      {!sales.length&&<tr><td colSpan={(manager?6:5)+(isAdmin?1:0)} style={{textAlign:'center',padding:30,color:'#718078'}}>Nenhuma venda registrada ainda.</td></tr>}
    </tbody></table></div>

    {editingSale&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setEditingSale(null)}}>
      <div className="modal">
        <h3>Editar valor da venda</h3>
        <p className="page-sub">Alteração exclusiva do administrador. Ao salvar, o VGV aprovado, ranking e metas passam a considerar o novo valor.</p>
        <div className="panel" style={{padding:14,marginTop:14}}>
          <div className="page-kicker">{editingSale.executive?.full_name||'Executivo'}</div>
          <div style={{fontFamily:'Barlow Condensed',fontWeight:800,fontSize:24,color:'#fff',textTransform:'uppercase',marginTop:6}}>{editingSale.development}{editingSale.unit?` · ${editingSale.unit}`:''}</div>
          <div style={{fontSize:12,color:'#7f95ac',marginTop:5}}>Valor atual: {money(editingSale.vgv)}</div>
        </div>
        <div className="field">
          <label>Novo valor da venda / VGV</label>
          <input autoFocus inputMode="decimal" value={editVgv} onChange={e=>setEditVgv(e.target.value)} placeholder="Ex.: 232900"/>
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-btn" disabled={busy} onClick={()=>setEditingSale(null)}>Cancelar</button>
          <button type="button" className="primary-btn" disabled={busy} onClick={saveSaleValue}>{busy?'Salvando...':'Salvar novo valor'}</button>
        </div>
      </div>
    </div>}

    {deletingSale&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setDeletingSale(null)}}>
      <div className="modal sale-delete-modal">
        <div className="sale-delete-warning">AÇÃO IRREVERSÍVEL</div>
        <h3>Apagar venda?</h3>
        <p className="page-sub">Esta venda será removida definitivamente da operação. Se estiver aprovada, o valor será retirado imediatamente do VGV, ranking e metas.</p>
        <div className="panel sale-delete-summary">
          <div className="page-kicker">{deletingSale.executive?.full_name||'Executivo'}</div>
          <div className="sale-delete-title">{deletingSale.development}{deletingSale.unit?` · ${deletingSale.unit}`:''}</div>
          <div className="sale-delete-value">{money(deletingSale.vgv)}</div>
          <div className="sale-delete-customer">{deletingSale.customer_name||'Cliente não informado'}</div>
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-btn" disabled={busy} onClick={()=>setDeletingSale(null)}>Cancelar</button>
          <button type="button" className="danger-btn" disabled={busy} onClick={deleteSale}>{busy?'Apagando...':'Apagar definitivamente'}</button>
        </div>
      </div>
    </div>}
  </div>
}
