import { createClient } from '@/lib/supabase/server'

export const fallbackOperators = [
  { id:'1', codename:'FÚRIA', full_name:'Lucas Costa', title:'Líder de Esquadrão', vgv:1955060, sales_count:4, units_count:9, status:'signed', avatar_url:'/assets/operator-4.webp', team_name:'BRAVO' },
  { id:'2', codename:'TITÃ', full_name:'Pedro Augusto', title:'Ponta de Lança', vgv:1510160, sales_count:3, units_count:7, status:'signed', avatar_url:'/assets/operator-5.webp', team_name:'DELTA' },
  { id:'3', codename:'PANTERA', full_name:'Lucas Silva', title:'Atirador de Elite', vgv:476000, sales_count:1, units_count:2, status:'signed', avatar_url:'/assets/operator-2.webp', team_name:'ALFA' },
  { id:'4', codename:'FALCÃO', full_name:'Geovanne', title:'Assalto', vgv:439800, sales_count:2, units_count:2, status:'signed', avatar_url:'/assets/operator-1.webp', team_name:'ALFA' },
  { id:'5', codename:'CORVO', full_name:'Yuri', title:'Reconhecimento', vgv:425800, sales_count:2, units_count:2, status:'signed', avatar_url:'/assets/operator-6.webp', team_name:'FOXTROT' },
  { id:'6', codename:'AÇO', full_name:'Cleiton', title:'Suporte Pesado', vgv:275000, sales_count:1, units_count:1, status:'signed', avatar_url:'/assets/operator-3.webp', team_name:'CHARLIE' },
]

export async function getDashboardData() {
  const supabase = await createClient()
  const [{ data: campaign }, { data: summary }, { data: performance }] = await Promise.all([
    supabase.from('campaigns').select('*').eq('active', true).order('start_date', { ascending:false }).limit(1).maybeSingle(),
    supabase.from('campaign_summary').select('*').limit(1).maybeSingle(),
    supabase.from('operator_performance').select('*').order('vgv', { ascending:false }).limit(24),
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

  let operators = (performance || []) as any[]
  if (!operators.length) operators = fallbackOperators
  operators = operators.map((o, index) => ({
    ...o,
    avatar_url: o.avatar_path
      ? supabase.storage.from('avatars').getPublicUrl(o.avatar_path).data.publicUrl
      : o.avatar_url || `/assets/operator-${(index % 6)+1}.webp`,
  }))

  return { campaign: activeCampaign, summary: safeSummary, operators }
}

export async function getLoadoutProfile(userId:string) {
  const supabase = await createClient()
  const [{ data: profile }, { data: loadouts }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, operator_id, selected_loadout, avatar_path, avatar_crop').eq('id', userId).single(),
    supabase.from('loadouts').select('*').eq('active', true).order('sort_order'),
  ])
  const avatarUrl = profile?.avatar_path ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_path).data.publicUrl : null
  return { profile, loadouts: loadouts || [], avatarUrl }
}
