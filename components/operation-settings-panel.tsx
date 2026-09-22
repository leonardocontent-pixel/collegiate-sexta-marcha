'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_GOAL_TIERS, normalizeGoalTiers } from '@/lib/goals'

type Campaign = {
  id: string
  name: string
  subtitle: string | null
  target_vgv: number
  start_date: string
  end_date: string
  active: boolean
  meta_vgv?: number
  super_vgv?: number
  hiper_vgv?: number
  suprema_vgv?: number
  meta_reward?: string
  super_reward?: string
  hiper_reward?: string
  suprema_reward?: string
}

type GoalTier = {
  name: string
  threshold_vgv: number
  reward: string
  weapon: string
  code: string
  badge_key: string
  sort_order: number
  active?: boolean
}

const columnMap = [
  { vgv: 'meta_vgv', reward: 'meta_reward' },
  { vgv: 'super_vgv', reward: 'super_reward' },
  { vgv: 'hiper_vgv', reward: 'hiper_reward' },
  { vgv: 'suprema_vgv', reward: 'suprema_reward' },
] as const

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

  function setGoalValue(index: number, field: 'threshold_vgv' | 'reward', value: string) {
    setGoals((current) => current.map((goal, i) => {
      if (i !== index) return goal
      return {
        ...goal,
        [field]: field === 'threshold_vgv' ? Number(value || 0) : value,
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

      const payload: Record<string, number | string> = {}
      goals.slice(0, 4).forEach((goal, index) => {
        const cols = columnMap[index]
        if (!cols) return
        payload[cols.vgv] = Number(goal.threshold_vgv || 0)
        payload[cols.reward] = String(goal.reward || '').trim()
      })

      const { data, error } = await supabase
        .from('campaigns')
        .update(payload)
        .eq('id', campaign.id)
        .select('*')
        .single()

      if (error) throw error

      if (data) {
        setCampaign(data as Campaign)
        const nextGoals = DEFAULT_GOAL_TIERS.map((base, index) => {
          const cols = columnMap[index]
          return {
            ...base,
            threshold_vgv: Number((data as any)[cols.vgv] ?? base.threshold_vgv),
            reward: String((data as any)[cols.reward] ?? base.reward),
          }
        })
        setGoals(normalizeGoalTiers(nextGoals) as GoalTier[])
      }

      setMsg('METAS E PREMIAÇÕES ATUALIZADAS. A HOME PASSA A USAR ESTES VALORES.')
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
              <p className="page-sub">Defina o nome, subtítulo e a meta principal usada na barra geral da Home.</p>
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
              <p className="page-sub">Altere os valores de VGV e as premiações. A Home lê estes mesmos dados diretamente da campanha ativa.</p>
            </div>
            {isAdmin && (
              <button type="button" className="primary-btn" disabled={busy || !campaign} onClick={saveGoals}>
                {busy ? 'Salvando...' : 'Salvar metas'}
              </button>
            )}
          </div>

          <div className="goal-admin-grid">
            {goals.slice(0, 4).map((goal, index) => (
              <div key={index} className="goal-admin-card">
                <div className="goal-admin-card-top">
                  <span className="goal-admin-index">OBJ {index + 1}</span>
                  <span className="goal-admin-badge">{goal.name}</span>
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
                    <input value={goal.code} disabled />
                  </div>
                  <div className="field">
                    <label>Arsenal</label>
                    <input value={goal.weapon} disabled />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
