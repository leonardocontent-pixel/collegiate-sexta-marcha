import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Collegiate Vendas — Operação Sexta Marcha',
  description: 'Dashboard comercial tático da Collegiate Vendas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
