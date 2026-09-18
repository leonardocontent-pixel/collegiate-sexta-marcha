export type GoalTier = {
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

export const BADGE_ASSETS: Record<string, string> = {
  meta_grenade: '/assets/badge-meta-grenade.png',
  super_c4: '/assets/badge-super-c4.png',
  hiper_missile: '/assets/badge-hiper-missile.png',
  suprema_nuke: '/assets/badge-suprema-nuke.png',
}

export const BADGE_LABELS: Record<string, string> = {
  meta_grenade: 'Granada',
  super_c4: 'C4',
  hiper_missile: 'Míssil',
  suprema_nuke: 'Bomba atômica',
}

export const DEFAULT_GOAL_TIERS: GoalTier[] = [
  {
    name: 'Meta',
    threshold_vgv: 2500000,
    reward: 'Kart',
    weapon: 'Granada de impacto',
    code: 'Frag',
    badge_key: 'meta_grenade',
    sort_order: 1,
    active: true,
  },
  {
    name: 'Super',
    threshold_vgv: 3500000,
    reward: 'P2',
    weapon: 'Carga C4',
    code: 'Breach',
    badge_key: 'super_c4',
    sort_order: 2,
    active: true,
  },
  {
    name: 'Hiper',
    threshold_vgv: 5000000,
    reward: 'P3 + Óculos',
    weapon: 'Míssil guiado',
    code: 'Strike',
    badge_key: 'hiper_missile',
    sort_order: 3,
    active: true,
  },
  {
    name: 'Suprema',
    threshold_vgv: 7000000,
    reward: 'Turbinada',
    weapon: 'Bomba atômica',
    code: 'Omega',
    badge_key: 'suprema_nuke',
    sort_order: 4,
    active: true,
  },
]

const TONES = ['bronze', 'silver', 'gold', 'elite'] as const

export function badgeSrcForKey(badgeKey: string | null | undefined) {
  return BADGE_ASSETS[badgeKey || ''] || BADGE_ASSETS.meta_grenade
}

export function normalizeGoalTiers(goalTiers?: Partial<GoalTier>[] | null) {
  const source = goalTiers && goalTiers.length ? goalTiers : DEFAULT_GOAL_TIERS
  return [...source]
    .filter((item) => item.active !== false)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((item, index) => ({
      id: item.id,
      campaign_id: item.campaign_id,
      name: item.name || DEFAULT_GOAL_TIERS[index]?.name || `Objetivo ${index + 1}`,
      threshold_vgv: Number(item.threshold_vgv ?? 0),
      reward: item.reward || 'Premiação não definida',
      weapon: item.weapon || 'Arsenal não definido',
      code: item.code || 'Op',
      badge_key: item.badge_key || DEFAULT_GOAL_TIERS[index]?.badge_key || 'meta_grenade',
      sort_order: Number(item.sort_order ?? index + 1),
      active: item.active !== false,
      tone: TONES[index] || 'bronze',
      badge: badgeSrcForKey(item.badge_key),
    }))
}
