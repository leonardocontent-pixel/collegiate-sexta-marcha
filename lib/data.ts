import { createClient } from '@/lib/supabase/server'

function avatarUrl(supabase:any, path:string|null|undefined){
  return path ? supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl : null
}

export async function getRegisteredExecutives(limit?:number){
  const supabase=await createClient()
  let query=supabase.from('executive_performance').select('*').order('vgv',{ascending:false}).order('full_name',{ascending:true})
  if(limit) query=query.limit(limit)
  const {data,error}=await query
  if(error) return []
  return (data||[]).map((row:any)=>{
    const crop=row.avatar_crop && typeof row.avatar_crop==='object' ? row.avatar_crop : {}
    return {
      ...row,
      avatar_url:avatarUrl(supabase,row.avatar_path),
      render_card_url:avatarUrl(supabase,crop.renderCardPath),
      render_mvp_url:avatarUrl(supabase,crop.renderMvpPath),
      title: row.selected_loadout==='sniper'?'Marksman':row.selected_loadout==='recon'?'Scout':row.selected_loadout==='support'?'Guardian':'Breacher',
    }
  })
}

export async function getDashboardData(){
  const supabase=await createClient()
  const [{data:campaign},{data:summary},executives,{data:feed}]=await Promise.all([
    supabase.from('campaigns').select('*').eq('active',true).order('start_date',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('operation_summary').select('*').limit(1).maybeSingle(),
    getRegisteredExecutives(40),
    supabase.from('sales_submissions').select('id,vgv,approval_status,created_at,approved_at,development,profiles!sales_submissions_executive_id_fkey(full_name)').order('created_at',{ascending:false}).limit(10),
  ])
  const activeCampaign=campaign||{id:'demo',name:'Operação Sexta Marcha',subtitle:'Disciplina. Estratégia. Execução.',target_vgv:7000000,start_date:'2026-09-01',end_date:'2026-09-30'}
  const safeSummary=summary||{confirmed_vgv:0,pending_vgv:0,total_vgv:0,approved_sales:0,pending_sales:0,active_executives:executives.length}
  return {campaign:activeCampaign,summary:safeSummary,operators:executives,feed:feed||[]}
}

export async function getLoadoutProfile(userId:string){
  const supabase=await createClient()
  const [{data:profile},{data:loadouts},{data:teams}]=await Promise.all([
    supabase.from('profiles').select('id,full_name,email,role,team_id,selected_loadout,avatar_path,avatar_crop').eq('id',userId).single(),
    supabase.from('loadouts').select('*').eq('active',true).order('sort_order'),
    supabase.from('teams').select('id,name,slug').eq('active',true).order('name'),
  ])
  const avatarUrlValue=profile?.avatar_path?avatarUrl(supabase,profile.avatar_path):null
  return {profile,loadouts:loadouts||[],teams:teams||[],avatarUrl:avatarUrlValue}
}

export async function getSalesWorkspace(userId:string,role:string){
  const supabase=await createClient()
  const [{data:campaign},{data:executives},{data:sales}]=await Promise.all([
    supabase.from('campaigns').select('id,name,target_vgv').eq('active',true).order('start_date',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('profiles').select('id,full_name,email,team_id,teams(name)').eq('active',true).eq('role','executive').order('full_name'),
    role==='executive'
      ? supabase.from('sales_submissions').select('*,executive:profiles!sales_submissions_executive_id_fkey(full_name,email),approver:profiles!sales_submissions_approved_by_fkey(full_name)').eq('executive_id',userId).order('created_at',{ascending:false}).limit(100)
      : supabase.from('sales_submissions').select('*,executive:profiles!sales_submissions_executive_id_fkey(full_name,email),approver:profiles!sales_submissions_approved_by_fkey(full_name)').order('created_at',{ascending:false}).limit(200),
  ])
  return {campaign,executives:executives||[],sales:sales||[]}
}
