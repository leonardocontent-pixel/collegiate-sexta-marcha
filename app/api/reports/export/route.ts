import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req:NextRequest){
  const supabase=await createClient()
  const p=req.nextUrl.searchParams
  let query=supabase.from('sales_submissions').select('sold_at,development,unit,customer_name,vgv,approval_status,executive:profiles!sales_submissions_executive_id_fkey(full_name,email)').order('sold_at',{ascending:false})
  if(p.get('from'))query=query.gte('sold_at',p.get('from')!)
  if(p.get('to'))query=query.lte('sold_at',p.get('to')!)
  if(p.get('status'))query=query.eq('approval_status',p.get('status')!)
  if(p.get('executive'))query=query.eq('executive_id',p.get('executive')!)
  if(p.get('development'))query=query.ilike('development',`%${p.get('development')}%`)
  const {data,error}=await query
  if(error)return new Response('Falha ao exportar',{status:500})
  const esc=(v:any)=>`"${String(v??'').replaceAll('"','""')}"`
  const lines=['Data,Executivo,Cliente,Empreendimento,Unidade,VGV,Status',...(data||[]).map((s:any)=>[s.sold_at,s.executive?.full_name||s.executive?.email||'',s.customer_name||'',s.development,s.unit||'',Number(s.vgv||0).toFixed(2),s.approval_status].map(esc).join(','))]
  return new Response('\ufeff'+lines.join('\n'),{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="relatorio-sexta-marcha-${new Date().toISOString().slice(0,10)}.csv"`}})
}
