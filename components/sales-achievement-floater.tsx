'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './sales-achievement-floater.module.css'
import { SALES_BADGES, getLatestUnlockedBadge, getNextBadge } from '@/components/operator-card'

type Props = {
  viewerId?: string | null
  approvedSales?: number
}

export default function SalesAchievementFloater({ viewerId, approvedSales = 0 }: Props) {
  const total = Math.max(0, Number(approvedSales || 0))
  const latestBadge = getLatestUnlockedBadge(total)
  const nextBadge = getNextBadge(total)
  const shouldOpen = Boolean(viewerId && latestBadge && total === latestBadge.threshold)
  const storageKey = useMemo(() => `menfe-sales-badge-seen:${viewerId || 'anon'}:${latestBadge?.threshold || 0}`, [viewerId, latestBadge?.threshold])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!shouldOpen || !viewerId || !latestBadge) return
    if (typeof window === 'undefined') return
    const alreadySeen = window.sessionStorage.getItem(storageKey)
    if (!alreadySeen) setOpen(true)
  }, [latestBadge, shouldOpen, storageKey, viewerId])

  function closeFloater() {
    if (typeof window !== 'undefined' && latestBadge) {
      window.sessionStorage.setItem(storageKey, '1')
    }
    setOpen(false)
  }

  if (!open || !shouldOpen || !latestBadge) return null

  const remaining = nextBadge ? Math.max(0, nextBadge.threshold - total) : 0
  const rewardText = latestBadge.threshold === 1 ? 'R$ 500,00 na hora liberados.' : 'Nova insígnia progressiva desbloqueada.'
  const guidance = nextBadge
    ? `Próximo alvo: ${nextBadge.label} com ${nextBadge.threshold} vendas. Faltam ${remaining} venda${remaining===1?'':'s'} para a próxima conquista.`
    : 'Você alcançou a última insígnia progressiva. Agora é manter a dominância e elevar ainda mais o VGV.'

  return (
    <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget) closeFloater() }}>
      <div className={styles.card}>
        <button type="button" className={styles.close} onClick={closeFloater} aria-label="Fechar">×</button>
        <div className={styles.iconStage}>
          <div className={styles.aura} />
          <img src={latestBadge.src} alt={latestBadge.label} className={styles.badge} />
        </div>
        <div className={styles.copy}>
          <div className={styles.kicker}>INSÍGNIA DESBLOQUEADA</div>
          <h3>{latestBadge.label}</h3>
          <div className={styles.helper}>{latestBadge.helper}</div>
          <p>{latestBadge.motivator}</p>
          <div className={styles.reward}>{rewardText}</div>
          <div className={styles.guidance}>{guidance}</div>
        </div>
        <div className={styles.actions}>
          <button type="button" className="primary-btn" onClick={closeFloater}>Continuar missão</button>
        </div>
      </div>
    </div>
  )
}
