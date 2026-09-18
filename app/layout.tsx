import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Menfe — Operação Resultado',
  description: 'Dashboard comercial tático da Menfe — Operação Resultado',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
