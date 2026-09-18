import SalesConsole from '@/components/sales-console'
import { requireViewer } from '@/lib/auth'
import { getSalesWorkspace } from '@/lib/data'

export const dynamic='force-dynamic'

export default async function SalesPage(){
  const viewer=await requireViewer()
  const data=await getSalesWorkspace(viewer.id,viewer.profile.role)
  return <div className="content max">
    <div className="page-kicker">OPERAÇÃO // REGISTRO DE RESULTADOS</div><h1 className="page-title">{viewer.profile.role==='executive'?'Minhas vendas':'Vendas da operação'}</h1><p className="page-sub">Registre resultados em tempo real. O executivo envia para aprovação; gestores e administradores podem lançar vendas já validadas.</p>
    <SalesConsole viewerId={viewer.id} viewerRole={viewer.profile.role} campaign={data.campaign} executives={data.executives} initialSales={data.sales}/>
  </div>
}
