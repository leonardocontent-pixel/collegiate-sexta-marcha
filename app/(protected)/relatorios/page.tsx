import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/auth'
import { brl } from '@/lib/format'

export const dynamic='force-dynamic'

function qs(params:Record<string,string|undefined>){const s=new URLSearchParams();Object.entries(params).forEach(([k,v])=>{if(v)s.set(k,v)});return s.toString()}

export default async function ReportsPage({searchParams}:{searchParams:Promise<{from?:string;to?:string;status?:string;executive?:string;development?:string}>}){
  const viewer=await requireViewer(),p=await searchParams,supabase=await createClient()
  let query=supabase.from('sales_submissions').select('id,development,unit,customer_name,vgv,approval_status,sold_at,created_at,executive:profiles!sales_submissions_executive_id_fkey(id,full_name,email)').order('sold_at',{ascending:false})
  if(p.from)query=query.gte('sold_at',p.from)
  if(p.to)query=query.lte('sold_at',p.to)
  if(p.status)query=query.eq('approval_status',p.status)
  if(p.executive)query=query.eq('executive_id',p.executive)
  if(p.development)query=query.ilike('development',`%${p.development}%`)
  const [{data:sales},{data:executives}]=await Promise.all([query,supabase.from('profiles').select('id,full_name,email').eq('active',true).eq('role','executive').order('full_name')])
  const rows=sales||[],approved=rows.filter((s:any)=>s.approval_status==='approved'),pending=rows.filter((s:any)=>s.approval_status==='pending')
  const totalVgv=rows.reduce((a:number,s:any)=>a+Number(s.vgv||0),0),approvedVgv=approved.reduce((a:number,s:any)=>a+Number(s.vgv||0),0),pendingVgv=pending.reduce((a:number,s:any)=>a+Number(s.vgv||0),0)
  const byDevelopment=Object.entries(approved.reduce((acc:any,s:any)=>{acc[s.development]=(acc[s.development]||0)+Number(s.vgv||0);return acc},{})).sort((a:any,b:any)=>b[1]-a[1]).slice(0,6) as [string,number][]
  const maxDev=Math.max(1,...byDevelopment.map(([,v])=>v)),exportHref=`/api/reports/export?${qs(p)}`
  const canSeeAll=viewer.profile.role!=='executive'
  return <div className="content max"><div className="page-kicker">INTELIGÊNCIA COMERCIAL // RELATÓRIOS</div><h1 className="page-title">Relatórios</h1><p className="page-sub">Vendas enviadas, aprovadas e rejeitadas. O ranking e as metas utilizam somente o VGV aprovado.</p>
    <form className="panel" style={{marginTop:22}}><div className="report-controls"><div className="field"><label>De</label><input type="date" name="from" defaultValue={p.from}/></div><div className="field"><label>Até</label><input type="date" name="to" defaultValue={p.to}/></div><div className="field"><label>Status</label><select name="status" defaultValue={p.status||''}><option value="">Todos</option><option value="approved">Aprovada</option><option value="pending">Aguardando</option><option value="rejected">Rejeitada</option></select></div>{canSeeAll&&<div className="field"><label>Executivo</label><select name="executive" defaultValue={p.executive||''}><option value="">Todos</option>{(executives||[]).map((e:any)=><option key={e.id} value={e.id}>{e.full_name||e.email}</option>)}</select></div>}<div className="field"><label>Empreendimento</label><input name="development" defaultValue={p.development||''} placeholder="Uberaba III"/></div></div><div style={{display:'flex',gap:8,marginTop:12,justifyContent:'flex-end'}}><a className="ghost-btn" href="/relatorios">Limpar</a><button className="primary-btn">Aplicar filtros</button><a className="ghost-btn" href={exportHref}>Exportar CSV ↓</a></div></form>
    <div className="metric-grid"><div className="metric"><div className="label">VGV aprovado</div><div className="value">{brl(approvedVgv)}</div></div><div className="metric"><div className="label">VGV aguardando</div><div className="value">{brl(pendingVgv)}</div></div><div className="metric"><div className="label">Registros</div><div className="value">{rows.length}</div></div><div className="metric"><div className="label">VGV total enviado</div><div className="value">{brl(totalVgv)}</div></div></div>
    <div className="panel-grid"><section className="panel"><div className="section-head" style={{marginTop:0}}><h2>Vendas <b>detalhadas</b></h2><div className="line"/><div className="meta">{rows.length} registros</div></div><div className="report-table-wrap">{rows.length?<table className="data-table"><thead><tr><th>Data</th><th>Executivo</th><th>Empreendimento</th><th>Unidade</th><th>Status</th><th>VGV</th></tr></thead><tbody>{rows.map((s:any)=><tr key={s.id}><td>{new Date(s.sold_at+'T12:00:00').toLocaleDateString('pt-BR')}</td><td>{s.executive?.full_name||'—'}</td><td>{s.development}</td><td>{s.unit||'—'}</td><td><span className={`badge ${s.approval_status==='approved'?'green':s.approval_status==='pending'?'amber':'red'}`}>{s.approval_status==='approved'?'Aprovada':s.approval_status==='pending'?'Aguardando':'Rejeitada'}</span></td><td>{brl(s.vgv)}</td></tr>)}</tbody></table>:<div className="empty">Nenhuma venda encontrada.</div>}</div></section>
    <section className="panel"><div className="section-head" style={{marginTop:0}}><h2>VGV aprovado por <b>empreendimento</b></h2><div className="line"/></div><div style={{display:'grid',gap:14}}>{byDevelopment.map(([name,value])=><div key={name}><div className="progress-row"><span>{name}</span><span>{brl(value)}</span></div><div className="progress-track" style={{height:10}}><div className="progress-fill" style={{width:`${value/maxDev*100}%`}}/></div></div>)}</div></section></div>
  </div>
}
