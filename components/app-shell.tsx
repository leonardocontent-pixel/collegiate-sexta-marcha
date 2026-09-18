'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AppShell({children,viewer}:{children:React.ReactNode;viewer:{fullName:string;role:string}}){
  const pathname=usePathname()
  const canManage=viewer.role==='admin'||viewer.role==='manager'
  const nav=[
    {href:'/dashboard',label:'Início',icon:'⌂'},
    {href:'/vendas',label:viewer.role==='executive'?'Minhas Vendas':'Vendas',icon:'▣'},
    {href:'/loadout',label:'Meu Loadout',icon:'⬡'},
    {href:'/esquadrao',label:'Esquadrão',icon:'♟'},
    {href:'/relatorios',label:'Relatórios',icon:'▥'},
    {href:'/conta',label:'Minha Conta',icon:'◉'},
    ...(canManage?[{href:'/gestao',label:'Gestão',icon:'⚙'}]:[]),
  ]
  const initials=viewer.fullName.split(' ').map(v=>v[0]).slice(0,2).join('').toUpperCase()
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-wrap"><Image className="side-logo" src="/logo-menfe-white.png" width={1257} height={635} alt="Menfe" priority/></div>
      <nav className="side-nav">{nav.map(item=><Link key={item.href} href={item.href} className={`side-link ${pathname===item.href?'active':''}`}><span className="ico">{item.icon}</span><span>{item.label}</span></Link>)}</nav>
      {canManage&&<div className="side-section">Operação</div>}
      {canManage&&<Link href="/gestao" className={`side-link ${pathname==='/gestao'?'active':''}`}><span className="ico">⌘</span><span>Acessos</span></Link>}
      <div className="side-user"><div><span className="online-dot"/><span style={{font:'600 9px JetBrains Mono',color:'#718078'}}>ONLINE</span></div><div className="viewer-avatar" style={{marginTop:12}}>{initials}</div><div className="name">{viewer.fullName}</div><div className="role">{viewer.role}</div><form action="/auth/signout" method="post" className="logout-form"><button>Sair</button></form></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="top-title"><div className="op-mark">Operação <b>Resultado</b></div><div className="top-meta">pessoas · processos · vendas · crescimento</div></div><div className="viewer-pill"><div className="viewer-avatar">{initials}</div><div><strong>{viewer.fullName}</strong><small>{viewer.role}</small></div></div></header>
      {children}
    </main>
  </div>
}
