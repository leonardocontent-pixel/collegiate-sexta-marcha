import styles from './gestao-font-fix.module.css'
import ManagementPanel from '@/components/management-panel'
import OperationSettingsPanel from '@/components/operation-settings-panel'
import SalesConsole from '@/components/sales-console'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { brl } from '@/lib/format'
import { DEFAULT_GOAL_TIERS, normalizeGoalTiers } from '@/lib/goals'
import { getSalesWorkspace } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function ManagementPage() {
  const viewer = await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const [{ data: profiles }, { data: teams }, { data: summary }, salesData, { data: campaign }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,email,role,active,team_id,teams(name)').order('full_name'),
    supabase.from('teams').select('id,name').eq('active', true).order('name'),
    supabase.from('operation_summary').select('*').limit(1).maybeSingle(),
    getSalesWorkspace(viewer.id, viewer.profile.role),
    supabase.from('campaigns').select('*').eq('active', true).order('start_date', { ascending: false }).limit(1).maybeSingle(),
  ])

  const list = profiles || []
  const vgvKeys = ['meta_vgv','super_vgv','hiper_vgv','suprema_vgv'] as const
  const rewardKeys = ['meta_reward','super_reward','hiper_reward','suprema_reward'] as const
  const goalRows = normalizeGoalTiers(DEFAULT_GOAL_TIERS.map((goal,index)=>({
    ...goal,
    threshold_vgv:Number((campaign as any)?.[vgvKeys[index]] ?? goal.threshold_vgv),
    reward:String((campaign as any)?.[rewardKeys[index]] ?? goal.reward),
  })))

  return <div className={`content max ${styles.gestaoRoot}`}>
    <div className="page-kicker">COMANDO // VENDAS, APROVAÇÕES, METAS E ACESSOS</div>
    <h1 className="page-title">Gestão</h1>
    <p className="page-sub">
      Central operacional do gestor. Registre vendas já validadas, aprove envios dos executivos,
      ajuste metas e premiações e administre os acessos da equipe.
    </p>

    <div className="metric-grid">
      <div className="metric"><div className="label">Executivos ativos</div><div className="value">{list.filter((p: any) => p.active && p.role === 'executive').length}</div></div>
      <div className="metric"><div className="label">Aguardando aprovação</div><div className="value">{summary?.pending_sales || 0}</div></div>
      <div className="metric"><div className="label">VGV aprovado</div><div className="value">{brl(summary?.confirmed_vgv || 0)}</div></div>
      <div className="metric"><div className="label">Vendas aprovadas</div><div className="value">{summary?.approved_sales || 0}</div></div>
    </div>

    <OperationSettingsPanel initialCampaign={campaign as any} initialGoals={goalRows as any} viewerRole={viewer.profile.role} />

    <SalesConsole viewerId={viewer.id} viewerRole={viewer.profile.role} campaign={salesData.campaign} executives={salesData.executives} initialSales={salesData.sales} compact />

    <div className="section-head"><h2>Usuários e <b>Acessos</b></h2><div className="line"/><div className="meta">{viewer.profile.role === 'admin' ? 'edição liberada' : 'somente leitura'}</div></div>
    <ManagementPanel initialProfiles={list as any} teams={teams || []} viewerRole={viewer.profile.role} />
  </div>
}
