create table if not exists public.executive_stats (
  executive_id uuid primary key references public.profiles(id) on delete cascade,
  approved_vgv numeric(14,2) not null default 0,
  approved_sales int not null default 0,
  pending_vgv numeric(14,2) not null default 0,
  pending_sales int not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.operation_stats (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  approved_vgv numeric(14,2) not null default 0,
  approved_sales int not null default 0,
  pending_vgv numeric(14,2) not null default 0,
  pending_sales int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.executive_stats enable row level security;
alter table public.operation_stats enable row level security;
create policy "authenticated read executive stats" on public.executive_stats for select to authenticated using (true);
create policy "authenticated read operation stats" on public.operation_stats for select to authenticated using (true);
create policy "authenticated read active executives" on public.profiles for select to authenticated using (role='executive' and active=true);

create or replace function public.refresh_sales_stats() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare exec_id uuid; camp_id uuid;
begin
  exec_id:=coalesce(new.executive_id,old.executive_id); camp_id:=coalesce(new.campaign_id,old.campaign_id);
  insert into public.executive_stats(executive_id,approved_vgv,approved_sales,pending_vgv,pending_sales,updated_at)
  select exec_id,coalesce(sum(vgv) filter(where approval_status='approved'),0),count(*) filter(where approval_status='approved')::int,coalesce(sum(vgv) filter(where approval_status='pending'),0),count(*) filter(where approval_status='pending')::int,now()
  from public.sales_submissions where executive_id=exec_id
  on conflict(executive_id) do update set approved_vgv=excluded.approved_vgv,approved_sales=excluded.approved_sales,pending_vgv=excluded.pending_vgv,pending_sales=excluded.pending_sales,updated_at=now();
  insert into public.operation_stats(campaign_id,approved_vgv,approved_sales,pending_vgv,pending_sales,updated_at)
  select camp_id,coalesce(sum(vgv) filter(where approval_status='approved'),0),count(*) filter(where approval_status='approved')::int,coalesce(sum(vgv) filter(where approval_status='pending'),0),count(*) filter(where approval_status='pending')::int,now()
  from public.sales_submissions where campaign_id=camp_id
  on conflict(campaign_id) do update set approved_vgv=excluded.approved_vgv,approved_sales=excluded.approved_sales,pending_vgv=excluded.pending_vgv,pending_sales=excluded.pending_sales,updated_at=now();
  if tg_op='UPDATE' and old.executive_id is distinct from new.executive_id then
    insert into public.executive_stats(executive_id,approved_vgv,approved_sales,pending_vgv,pending_sales,updated_at)
    select old.executive_id,coalesce(sum(vgv) filter(where approval_status='approved'),0),count(*) filter(where approval_status='approved')::int,coalesce(sum(vgv) filter(where approval_status='pending'),0),count(*) filter(where approval_status='pending')::int,now()
    from public.sales_submissions where executive_id=old.executive_id
    on conflict(executive_id) do update set approved_vgv=excluded.approved_vgv,approved_sales=excluded.approved_sales,pending_vgv=excluded.pending_vgv,pending_sales=excluded.pending_sales,updated_at=now();
  end if;
  return coalesce(new,old);
end; $$;
revoke all on function public.refresh_sales_stats() from public,anon,authenticated;
create trigger refresh_sales_stats after insert or update or delete on public.sales_submissions for each row execute procedure public.refresh_sales_stats();

insert into public.executive_stats(executive_id,approved_vgv,approved_sales,pending_vgv,pending_sales)
select p.id,coalesce(sum(s.vgv) filter(where s.approval_status='approved'),0),count(s.id) filter(where s.approval_status='approved')::int,coalesce(sum(s.vgv) filter(where s.approval_status='pending'),0),count(s.id) filter(where s.approval_status='pending')::int
from public.profiles p left join public.sales_submissions s on s.executive_id=p.id where p.role='executive' and p.active=true group by p.id
on conflict(executive_id) do update set approved_vgv=excluded.approved_vgv,approved_sales=excluded.approved_sales,pending_vgv=excluded.pending_vgv,pending_sales=excluded.pending_sales,updated_at=now();
insert into public.operation_stats(campaign_id,approved_vgv,approved_sales,pending_vgv,pending_sales)
select c.id,coalesce(sum(s.vgv) filter(where s.approval_status='approved'),0),count(s.id) filter(where s.approval_status='approved')::int,coalesce(sum(s.vgv) filter(where s.approval_status='pending'),0),count(s.id) filter(where s.approval_status='pending')::int
from public.campaigns c left join public.sales_submissions s on s.campaign_id=c.id group by c.id
on conflict(campaign_id) do update set approved_vgv=excluded.approved_vgv,approved_sales=excluded.approved_sales,pending_vgv=excluded.pending_vgv,pending_sales=excluded.pending_sales,updated_at=now();

create or replace view public.executive_performance with (security_invoker=true) as
select p.id,p.full_name,p.email,coalesce(nullif(p.avatar_crop->>'codename',''),upper(split_part(coalesce(p.full_name,p.email,'OPERADOR'),' ',1))) as codename,p.avatar_path,p.avatar_crop,p.selected_loadout,t.name as team_name,coalesce(es.approved_vgv,0)::numeric as vgv,coalesce(es.approved_sales,0)::int as sales_count,coalesce(es.pending_sales,0)::int as pending_count,es.updated_at as latest_sale_at
from public.profiles p left join public.teams t on t.id=p.team_id left join public.executive_stats es on es.executive_id=p.id where p.active=true and p.role='executive';
create or replace view public.operation_summary with (security_invoker=true) as
select c.id as campaign_id,c.name,c.target_vgv,coalesce(os.approved_vgv,0)::numeric as confirmed_vgv,coalesce(os.pending_vgv,0)::numeric as pending_vgv,(coalesce(os.approved_vgv,0)+coalesce(os.pending_vgv,0))::numeric as total_vgv,coalesce(os.approved_sales,0)::int as approved_sales,coalesce(os.pending_sales,0)::int as pending_sales,(select count(*)::int from public.profiles p where p.active=true and p.role='executive') as active_executives
from public.campaigns c left join public.operation_stats os on os.campaign_id=c.id where c.active=true;
grant select on public.executive_stats,public.operation_stats,public.executive_performance,public.operation_summary to authenticated;
