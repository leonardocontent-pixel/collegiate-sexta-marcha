import { createClient } from '@/lib/supabase/server'

export const fallbackOperators = [
  { id:'1', codename:'FÚRIA', full_name:'Lucas Costa', title:'Líder de Esquadrão', vgv:1955060, sales_count:4, units_count:9, status:'signed', avatar_url:'/assets/operator-4.webp', team_name:'BRAVO' },
  { id:'2', codename:'TITÃ', full_name:'Pedro Augusto', title:'Ponta de Lança', vgv:1510160, sales_count:3, units_count:7, status:'signed', avatar_url:'/assets/operator-5.webp', team_name:'DELTA' },
  { id:'3', codename:'PANTERA', full_name:'Lucas Silva', title:'Atirador de Elite', vgv:476000, sales_count:1, units_count:2, status:'signed', avatar_url:'/assets/operator-2.webp', team_name:'ALFA' },
  { id:'4', codename:'FALCÃO', full_name:'Geovanne', title:'Assalto', vgv:439800, sales_count:2, units_count:2, status:'signed', avatar_url:'/assets/operator-1.webp', team_name:'ALFA' },
  { id:'5', codename:'CORVO', full_name:'Yuri', title:'Reconhecimento', vgv:425800, sales_count:2, units_count:2, status:'signed', avatar_url:'/assets/operator-6.webp', team_name:'FOXTROT' },
  { id:'6', codename:'AÇO', full_name:'Cleiton', title:'Suporte Pesado', vgv:275000, sales_count:1, units_count:1, status:'signed', avatar_url:'/assets/operator-3.webp', team_name:'CHARLIE' },
]

function readAvatarConfig(value: any) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return {
    zoom: Number(raw.zoom ?? 1.2),
    x: Number(raw.x ?? 0),
    y: Number(raw.y ?? 0),
    codename: typeof raw.codename === 'string' ? raw.codename : '',
    squadId: typeof raw.squadId === 'string' ? raw.squadId : '',
    squadName: typeof raw.squadName === 'string' ? raw.squadName : '',
    outfit: typeof raw.outfit === 'string' ? raw.outfit : 'vanguard',
    headgear: typeof raw.headgear === 'string' ? raw.headgear : 'helmet',
    weapon: typeof raw.weapon === 'string' ? raw.weapon : 'carbine',
    accessory: typeof raw.accessory === 'string' ? raw.accessory : 'flash',
  }
}

export async function getOperatorRoster(limit?: number) {
  const supabase = await createClient()
  let query = supabase.from('operator_performance').select('*').order('vgv', { ascending: false })
  if (limit) query = query.limit(limit)

  const { data: performance } = await query
  let operators = (performance || []) as any[]
  if (!operators.length) return fallbackOperators

  const operatorIds = operators.map((o) => o.id).filter(Boolean)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('operator_id, avatar_path, selected_loadout, avatar_crop')
    .in('operator_id', operatorIds)

  const byOperator = new Map((profiles || []).map((row: any) => [row.operator_id, row]))

  return operators.map((o, index) => {
    const custom = byOperator.get(o.id)
    const avatarConfig = readAvatarConfig(custom?.avatar_crop)
    const avatarPath = custom?.avatar_path || o.avatar_path

    return {
      ...o,
      codename: avatarConfig.codename || o.codename,
      team_name: avatarConfig.squadName || o.team_name,
      title: o.title || (o.selected_loadout ? `Classe ${o.selected_loadout}` : 'Operador'),
      selected_loadout: custom?.selected_loadout || o.selected_loadout,
      avatar_crop: avatarConfig,
      avatar_url: avatarPath
        ? supabase.storage.from('avatars').getPublicUrl(avatarPath).data.publicUrl
        : o.avatar_url || `/assets/operator-${(index % 6) + 1}.webp`,
    }
  })
}

export async function getDashboardData() {
  const supabase = await createClient()
  const [{ data: campaign }, { data: summary }, operators] = await Promise.all([
    supabase.from('campaigns').select('*').eq('active', true).order('start_date', { ascending:false }).limit(1).maybeSingle(),
    supabase.from('campaign_summary').select('*').limit(1).maybeSingle(),
    getOperatorRoster(24),
  ])

  const activeCampaign = campaign || {
    id:'demo', name:'Operação Sexta Marcha', subtitle:'Disciplina. Estratégia. Execução.', target_vgv:7000000, start_date:'2026-09-01', end_date:'2026-09-30'
  }

  const safeSummary = summary || {
    confirmed_vgv: 5491620,
    pending_vgv: 1289822,
    total_vgv: 6781442,
    signed_contracts: 15,
    total_sales: 20,
    total_units: 31,
    decorated_operators: 8,
    active_operators: 14,
  }

  return { campaign: activeCampaign, summary: safeSummary, operators }
}

export async function getLoadoutProfile(userId:string) {
  const supabase = await createClient()
  const [{ data: profile }, { data: loadouts }, { data: teams }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, operator_id, selected_loadout, avatar_path, avatar_crop').eq('id', userId).single(),
    supabase.from('loadouts').select('*').eq('active', true).order('sort_order'),
    supabase.from('teams').select('id,name,slug').eq('active', true).order('name'),
  ])

  let operator: any = null
  if (profile?.operator_id) {
    const { data } = await supabase
      .from('operators')
      .select('id, codename, title, team_id')
      .eq('id', profile.operator_id)
      .maybeSingle()
    operator = data
  }

  const avatarUrl = profile?.avatar_path ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_path).data.publicUrl : null
  return { profile: profile ? { ...profile, operator } : null, loadouts: loadouts || [], teams: teams || [], avatarUrl }
}
