import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const esc = (v:unknown) => `"${String(v ?? '').replaceAll('"','""')}"`

export async function GET(req:NextRequest){
  const supabase=await createClient()
  const {data:claims}=await supabase.auth.getClaims()
  if(!claims?.claims?.sub) return new Response('Unauthorized',{status:401})
  const p=req.nextUrl.searchParams
  let q=supabase.from('sales').select('development,unit,customer_name,vgv,commission_rate,status,signed_at,created_at,operators(full_name,codename)').order('created_at',{ascending:false})
  if(p.get('from')) q=q.gte('created_at',`${p.get('from')}T00:00:00`)
  if(p.get('to')) q=q.lte('created_at',`${p.get('to')}T23:59:59`)
  if(p.get('status')) q=q.eq('status',p.get('status')!)
  if(p.get('operator')) q=q.eq('operator_id',p.get('operator')!)
  if(p.get('development')) q=q.ilike('development',`%${p.get('development')}%`)
  const {data,error}=await q
  if(error) return new Response(error.message,{status:400})
  const header=['Data','Operador','Codinome','Empreendimento','Unidade','Cliente','Status','VGV','Taxa Comissão','Comissão']
  const lines=(data||[]).map((s:any)=>[
    s.signed_at||String(s.created_at).slice(0,10),s.operators?.full_name,s.operators?.codename,s.development,s.unit,s.customer_name,s.status,Number(s.vgv||0).toFixed(2),Number(s.commission_rate||0).toFixed(5),(Number(s.vgv||0)*Number(s.commission_rate||0)).toFixed(2)
  ].map(esc).join(';'))
  const csv='\ufeff'+[header.map(esc).join(';'),...lines].join('\n')
  return new Response(csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="relatorio-sexta-marcha-${new Date().toISOString().slice(0,10)}.csv"`}})
}
