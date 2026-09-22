'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './first-blood-floater.module.css'

type Props = {
  viewerId?: string | null
  enabled?: boolean
  approvedSales?: number
}

export default function FirstBloodFloater({ viewerId, enabled = false, approvedSales = 0 }: Props) {
  const [open, setOpen] = useState(false)
  const storageKey = useMemo(() => `menfe-first-blood-seen:${viewerId || 'anon'}`, [viewerId])

  useEffect(() => {
    if (!enabled || !viewerId || approvedSales !== 1) return
    if (typeof window === 'undefined') return
    const alreadySeen = window.sessionStorage.getItem(storageKey)
    if (!alreadySeen) setOpen(true)
  }, [approvedSales, enabled, storageKey, viewerId])

  function closeFloater() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(storageKey, '1')
    }
    setOpen(false)
  }

  if (!open || !enabled || approvedSales !== 1) return null

  return (
    <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget) closeFloater() }}>
      <div className={styles.card}>
        <button type="button" className={styles.close} onClick={closeFloater} aria-label="Fechar">×</button>
        <div className={styles.imageWrap}>
          <img src="/assets/first-blood-floater.png" alt="Conquista First Blood liberada" className={styles.image} />
        </div>
        <div className={styles.copy}>
          <div className={styles.kicker}>CONQUISTA DESBLOQUEADA</div>
          <h3>First Blood</h3>
          <p>Primeira venda aprovada registrada com sucesso.</p>
          <div className={styles.reward}>R$ 500,00 na hora</div>
          <small>Bonificação liberada para quem bate a 1ª venda.</small>
        </div>
        <div className={styles.actions}>
          <button type="button" className="primary-btn" onClick={closeFloater}>Missão cumprida</button>
        </div>
      </div>
    </div>
  )
}
