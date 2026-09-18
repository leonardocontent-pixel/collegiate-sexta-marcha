'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function money(value:number|string){
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(value||0))
}

export default function SalesConsole({viewerId,viewerRole,campaign,executives,initialSales,compact=false}:{viewerId:string;viewerRole:string;campaign:any;executives:any[];initialSales:any[];compact?:boolean}){
  const supabase=useMemo(()=>createClient(),[])
  const router=useRouter()
  const manager=viewerRole==='admin'||viewerRole==='manager'
  const [sales,setSales]=useState(initialSales||[])
  const [busy,setBusy]=useState(false)
  const [msg,setMsg]=useState('')
  const [showForm,setShowForm]=useState(!compact)

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
      const vgv=Number(String(form.get('vgv')||'').replace(/\./g,'').replace(',','.'))
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
        <div className="approval-actions"><button type="button" className="danger-btn" disabled={busy} onClick={()=>decide(sale.id,'rejected')}>Rejeitar</button><button type="button" className="primary-btn" disabled={busy} onClick={()=>decide(sale.id,'approved')}>Aprovar venda</button></div>
      </article>)}</div>
    </section>}

    <div className="section-head"><h2>{manager?'Últimos':'Meu'} <b>Registros</b></h2><div className="line"/><div className="meta">histórico da operação</div></div>
    <div className="panel" style={{padding:0,overflow:'auto'}}><table className="data-table"><thead><tr>{manager&&<th>Executivo</th>}<th>Data</th><th>Empreendimento</th><th>Unidade</th><th>VGV</th><th>Status</th></tr></thead><tbody>
      {sales.map((s:any)=><tr key={s.id}>{manager&&<td>{s.executive?.full_name||'—'}</td>}<td>{new Date(s.sold_at+'T12:00:00').toLocaleDateString('pt-BR')}</td><td>{s.development}</td><td>{s.unit||'—'}</td><td>{money(s.vgv)}</td><td><span className={`badge ${s.approval_status==='approved'?'green':s.approval_status==='pending'?'amber':'red'}`}>{s.approval_status==='approved'?'Aprovada':s.approval_status==='pending'?'Aguardando':'Rejeitada'}</span></td></tr>)}
      {!sales.length&&<tr><td colSpan={manager?6:5} style={{textAlign:'center',padding:30,color:'#718078'}}>Nenhuma venda registrada ainda.</td></tr>}
    </tbody></table></div>
  </div>
}
