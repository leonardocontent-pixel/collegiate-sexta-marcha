import ManagementPanel from '@/components/management-panel'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { brl } from '@/lib/format'

export const dynamic='force-dynamic'

export default async function ManagementPage(){
  const viewer=await requireRole(['admin','manager'])
  const supabase=await createClient()
  const [{data:profiles},{data:teams},{data:operators},{data:summary}]=await Promise.all([
    supabase.from('profiles').select('id,full_name,email,role,active,team_id,operator_id,teams(name),operators(full_name,codename)').order('full_name'),
    supabase.from('teams').select('id,name').eq('active',true).order('name'),
    supabase.from('operators').select('id,full_name,codename').eq('active',true).order('full_name'),
    supabase.from('campaign_summary').select('*').limit(1).maybeSingle(),
  ])
  const list=profiles||[]
  return <div className="content max">
    <div className="page-kicker">COMANDO // ACESSOS E OPERAÇÃO</div><h1 className="page-title">Gestão</h1><p className="page-sub">Gerencie os acessos do time, vínculos de operadores e consulte os indicadores consolidados. Alterações de acesso são restritas ao perfil Administrador.</p>
    <div className="metric-grid"><div className="metric"><div className="label">Usuários</div><div className="value">{list.length}</div></div><div className="metric"><div className="label">Acessos ativos</div><div className="value">{list.filter((p:any)=>p.active).length}</div></div><div className="metric"><div className="label">VGV confirmado</div><div className="value">{brl(summary?.confirmed_vgv||0)}</div></div><div className="metric"><div className="label">Vendas</div><div className="value">{summary?.total_sales||0}</div></div></div>
    <div className="section-head"><h2>Usuários e <b>Acessos</b></h2><div className="line"/><div className="meta">{viewer.profile.role==='admin'?'edição liberada':'somente leitura'}</div></div>
    <ManagementPanel initialProfiles={list as any} teams={teams||[]} operators={operators||[]} viewerRole={viewer.profile.role}/>
  </div>
}
