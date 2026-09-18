'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BADGE_LABELS, DEFAULT_GOAL_TIERS, normalizeGoalTiers } from '@/lib/goals'

type Campaign = {
  id: string
  name: string
  subtitle: string | null
  target_vgv: number
  start_date: string
  end_date: string
  active: boolean
}

type GoalTier = {
  id?: string
  campaign_id?: string
  name: string
  threshold_vgv: number
  reward: string
  weapon: string
  code: string
  badge_key: string
  sort_order: number
  active?: boolean
}

const badgeOptions = Object.entries(BADGE_LABELS)

export default function OperationSettingsPanel({
  initialCampaign,
  initialGoals,
  viewerRole,
}: {
  initialCampaign: Campaign | null
  initialGoals: GoalTier[]
  viewerRole: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const isAdmin = viewerRole === 'admin'
  const [campaign, setCampaign] = useState<Campaign | null>(initialCampaign)
  const [goals, setGoals] = useState<GoalTier[]>(normalizeGoalTiers(initialGoals) as GoalTier[])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  function setGoalValue(index: number, field: keyof GoalTier, value: string) {
    setGoals((current) => current.map((goal, i) => {
      if (i !== index) return goal
      return {
        ...goal,
        [field]: field === 'threshold_vgv' || field === 'sort_order' ? Number(value || 0) : value,
      }
    }))
  }

  async function saveCampaignSettings(formData: FormData) {
    if (!isAdmin || !campaign) return
    try {
      setBusy(true)
      setMsg('')
      const payload = {
        name: String(formData.get('name') || 'Operação Resultado').trim(),
        subtitle: String(formData.get('subtitle') || '').trim(),
        target_vgv: Number(formData.get('target_vgv') || 0),
        start_date: String(formData.get('start_date') || campaign.start_date),
        end_date: String(formData.get('end_date') || campaign.end_date),
      }
      const { error } = await supabase.from('campaigns').update(payload).eq('id', campaign.id)
      if (error) throw error
      setCampaign((current) => current ? { ...current, ...payload } : current)
      setMsg('META GERAL E DADOS DA OPERAÇÃO ATUALIZADOS.')
    } catch (error: any) {
      setMsg(error.message || 'Falha ao salvar a operação.')
    } finally {
      setBusy(false)
    }
  }

  async function saveGoals() {
    if (!isAdmin || !campaign) return
    try {
      setBusy(true)
      setMsg('')
      const payload = goals.map((goal, index) => ({
        id: goal.id,
        campaign_id: campaign.id,
        name: goal.name.trim() || `Objetivo ${index + 1}`,
        threshold_vgv: Number(goal.threshold_vgv || 0),
        reward: goal.reward.trim() || 'Premiação a definir',
        weapon: goal.weapon.trim() || 'Arsenal a definir',
        code: goal.code.trim() || 'Op',
        badge_key: goal.badge_key || DEFAULT_GOAL_TIERS[index]?.badge_key || 'meta_grenade',
        sort_order: index + 1,
        active: true,
        updated_at: new Date().toISOString(),
      }))
      const { data, error } = await supabase
        .from('goal_tiers')
        .upsert(payload, { onConflict: 'campaign_id,sort_order' })
        .select('*')
        .order('sort_order')
      if (error) throw error
      if (data?.length) setGoals(normalizeGoalTiers(data) as GoalTier[])
      setMsg('METAS E PREMIAÇÕES ATUALIZADAS COM SUCESSO.')
    } catch (error: any) {
      setMsg(error.message || 'Falha ao salvar metas e premiações.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="section-head">
        <h2>Metas e <b>Premiações</b></h2>
        <div className="line" />
        <div className="meta">{isAdmin ? 'edição liberada' : 'somente leitura'}</div>
      </div>

      {msg && <div className="form-msg operation-settings-msg">{msg}</div>}

      <div className="panel operation-admin-panel">
        <form action={saveCampaignSettings} className="operation-admin-block">
          <div className="operation-admin-head">
            <div>
              <div className="page-kicker">META GERAL DA OPERAÇÃO</div>
              <h3>Operação ativa</h3>
              <p className="page-sub">Defina o nome, subtítulo e a meta principal usada na barra geral da home.</p>
            </div>
            {isAdmin && (
              <button className="primary-btn" disabled={busy || !campaign}>
                {busy ? 'Salvando...' : 'Salvar operação'}
              </button>
            )}
          </div>

          <div className="admin-config-grid">
            <div className="field">
              <label>Nome da operação</label>
              <input name="name" defaultValue={campaign?.name || 'Operação Resultado'} disabled={!isAdmin || !campaign} />
            </div>
            <div className="field">
              <label>Meta geral (VGV)</label>
              <input name="target_vgv" type="number" min="0" step="1000" defaultValue={campaign?.target_vgv || 0} disabled={!isAdmin || !campaign} />
            </div>
            <div className="field admin-grid-span-2">
              <label>Subtítulo / mensagem</label>
              <input name="subtitle" defaultValue={campaign?.subtitle || ''} disabled={!isAdmin || !campaign} />
            </div>
            <div className="field">
              <label>Início</label>
              <input name="start_date" type="date" defaultValue={campaign?.start_date || ''} disabled={!isAdmin || !campaign} />
            </div>
            <div className="field">
              <label>Fim</label>
              <input name="end_date" type="date" defaultValue={campaign?.end_date || ''} disabled={!isAdmin || !campaign} />
            </div>
          </div>
        </form>

        <div className="operation-admin-block">
          <div className="operation-admin-head">
            <div>
              <div className="page-kicker">OBJETIVOS SECUNDÁRIOS</div>
              <h3>Insígnias e premiações</h3>
              <p className="page-sub">Altere meta, nome, arsenal, texto da premiação e o tipo de insígnia de cada objetivo.</p>
            </div>
            {isAdmin && (
              <button type="button" className="primary-btn" disabled={busy || !campaign} onClick={saveGoals}>
                {busy ? 'Salvando...' : 'Salvar metas'}
              </button>
            )}
          </div>

          <div className="goal-admin-grid">
            {goals.map((goal, index) => (
              <div key={goal.id || index} className="goal-admin-card">
                <div className="goal-admin-card-top">
                  <span className="goal-admin-index">OBJ {index + 1}</span>
                  <span className="goal-admin-badge">{BADGE_LABELS[goal.badge_key] || 'Insígnia'}</span>
                </div>
                <div className="field">
                  <label>Nome da meta</label>
                  <input value={goal.name} disabled={!isAdmin || !campaign} onChange={(e) => setGoalValue(index, 'name', e.target.value)} />
                </div>
                <div className="field">
                  <label>Meta (VGV)</label>
                  <input type="number" min="0" step="1000" value={goal.threshold_vgv} disabled={!isAdmin || !campaign} onChange={(e) => setGoalValue(index, 'threshold_vgv', e.target.value)} />
                </div>
                <div className="field">
                  <label>Premiação</label>
                  <input value={goal.reward} disabled={!isAdmin || !campaign} onChange={(e) => setGoalValue(index, 'reward', e.target.value)} />
                </div>
                <div className="admin-config-grid compact">
                  <div className="field">
                    <label>Código</label>
                    <input value={goal.code} disabled={!isAdmin || !campaign} onChange={(e) => setGoalValue(index, 'code', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Arsenal</label>
                    <input value={goal.weapon} disabled={!isAdmin || !campaign} onChange={(e) => setGoalValue(index, 'weapon', e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>Tipo de insígnia</label>
                  <select value={goal.badge_key} disabled={!isAdmin || !campaign} onChange={(e) => setGoalValue(index, 'badge_key', e.target.value)}>
                    {badgeOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
