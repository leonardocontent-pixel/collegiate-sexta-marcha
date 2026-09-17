import { createClient } from '@/lib/supabase/server'
import { brl } from '@/lib/format'

export const dynamic = 'force-dynamic'

function qs(params: Record<string,string|undefined>) {
  const s = new URLSearchParams()
  Object.entries(params).forEach(([k,v])=>{ if(v) s.set(k,v) })
  return s.toString()
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?:string; to?:string; status?:string; operator?:string; development?:string }> }) {
  const p = await searchParams
  const supabase = await createClient()
  let query = supabase.from('sales').select('id,development,unit,customer_name,vgv,commission_rate,status,signed_at,created_at,operators(id,full_name,codename,title)')
    .order('created_at',{ascending:false})
  if(p.from) query = query.gte('created_at', `${p.from}T00:00:00`)
  if(p.to) query = query.lte('created_at', `${p.to}T23:59:59`)
  if(p.status) query = query.eq('status', p.status)
  if(p.operator) query = query.eq('operator_id', p.operator)
  if(p.development) query = query.ilike('development', `%${p.development}%`)
  const [{ data:sales }, { data:operators }] = await Promise.all([
    query,
    supabase.from('operators').select('id,full_name,codename').eq('active',true).order('full_name')
  ])
  const rows = sales || []
  const totalVgv = rows.reduce((a:number,s:any)=>a+Number(s.vgv||0),0)
  const signed = rows.filter((s:any)=>s.status==='signed')
  const signedVgv = signed.reduce((a:number,s:any)=>a+Number(s.vgv||0),0)
  const commission = signed.reduce((a:number,s:any)=>a+Number(s.vgv||0)*Number(s.commission_rate||0),0)
  const byDevelopment = Object.entries(rows.reduce((acc:any,s:any)=>{acc[s.development]=(acc[s.development]||0)+Number(s.vgv||0);return acc},{})).sort((a:any,b:any)=>b[1]-a[1]).slice(0,6) as [string,number][]
  const maxDev = Math.max(1,...byDevelopment.map(([,v])=>v))
  const exportHref = `/api/reports/export?${qs(p)}`
  return <div className="content max">
    <div className="page-kicker">INTELIGÊNCIA COMERCIAL // RELATÓRIOS</div>
    <h1 className="page-title">Relatórios</h1>
    <p className="page-sub">Filtre por período, status, operador e empreendimento. Exporte o resultado em CSV para análise ou prestação de contas.</p>

    <form className="panel" style={{marginTop:22}}>
      <div className="report-controls">
        <div className="field"><label>De</label><input type="date" name="from" defaultValue={p.from}/></div>
        <div className="field"><label>Até</label><input type="date" name="to" defaultValue={p.to}/></div>
        <div className="field"><label>Status</label><select name="status" defaultValue={p.status || ''}><option value="">Todos</option><option value="signed">Assinado</option><option value="pending">Pendente</option><option value="cancelled">Cancelado</option></select></div>
        <div className="field"><label>Operador</label><select name="operator" defaultValue={p.operator || ''}><option value="">Todos</option>{(operators||[]).map((o:any)=><option key={o.id} value={o.id}>{o.full_name} · {o.codename}</option>)}</select></div>
        <div className="field"><label>Empreendimento</label><input name="development" defaultValue={p.development || ''} placeholder="Uberaba III"/></div>
      </div>
      <div style={{display:'flex',gap:8,marginTop:12,justifyContent:'flex-end'}}><a className="ghost-btn" href="/relatorios">Limpar</a><button className="primary-btn" type="submit">Aplicar filtros</button><a className="ghost-btn" href={exportHref}>Exportar CSV ↓</a></div>
    </form>

    <div className="metric-grid">
      <div className="metric"><div className="label">VGV no filtro</div><div className="value">{brl(totalVgv)}</div></div>
      <div className="metric"><div className="label">VGV assinado</div><div className="value">{brl(signedVgv)}</div></div>
      <div className="metric"><div className="label">Vendas</div><div className="value">{rows.length}</div></div>
      <div className="metric"><div className="label">Comissão estimada</div><div className="value">{brl(commission)}</div></div>
    </div>

    <div className="panel-grid">
      <section className="panel">
        <div className="section-head" style={{marginTop:0}}><h2>Vendas <b>detalhadas</b></h2><div className="line"/><div className="meta">{rows.length} registros</div></div>
        <div className="report-table-wrap">
          {rows.length ? <table className="data-table"><thead><tr><th>Data</th><th>Operador</th><th>Empreendimento</th><th>Unidade</th><th>Status</th><th>VGV</th></tr></thead><tbody>
            {rows.map((s:any)=><tr key={s.id}><td>{new Date(s.signed_at || s.created_at).toLocaleDateString('pt-BR')}</td><td>{s.operators?.full_name || '—'}<br/><small style={{color:'#6b766f'}}>{s.operators?.codename}</small></td><td>{s.development}</td><td>{s.unit || '—'}</td><td><span className={`badge ${s.status==='signed'?'green':s.status==='pending'?'amber':'red'}`}>{s.status}</span></td><td>{brl(s.vgv)}</td></tr>)}
          </tbody></table> : <div className="empty">Nenhuma venda encontrada com estes filtros.</div>}
        </div>
      </section>
      <section className="panel">
        <div className="section-head" style={{marginTop:0}}><h2>VGV por <b>empreendimento</b></h2><div className="line"/></div>
        <div style={{display:'grid',gap:14}}>{byDevelopment.map(([name,value])=><div key={name}><div className="progress-row"><span>{name}</span><span>{brl(value)}</span></div><div className="progress-track" style={{height:10}}><div className="progress-fill" style={{width:`${value/maxDev*100}%`}}/></div></div>)}</div>
      </section>
    </div>
  </div>
}
