create table if not exists public.sales_submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  executive_id uuid not null references public.profiles(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  customer_name text,
  development text not null,
  unit text,
  vgv numeric(14,2) not null check (vgv > 0),
  sold_at date not null default current_date,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  manager_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sales_submissions_campaign_idx on public.sales_submissions(campaign_id);
create index if not exists sales_submissions_executive_idx on public.sales_submissions(executive_id);
create index if not exists sales_submissions_status_idx on public.sales_submissions(approval_status);
create index if not exists sales_submissions_created_idx on public.sales_submissions(created_at desc);
alter table public.sales_submissions enable row level security;

create policy "read own or managed sales submissions" on public.sales_submissions for select to authenticated
using (executive_id=(select auth.uid()) or private.current_role() in ('admin','manager'));
create policy "submit own or manager sales" on public.sales_submissions for insert to authenticated
with check ((private.current_role()='executive' and executive_id=(select auth.uid()) and submitted_by=(select auth.uid()) and approval_status='pending') or private.current_role() in ('admin','manager'));
create policy "management approve sales" on public.sales_submissions for update to authenticated
using (private.current_role() in ('admin','manager')) with check (private.current_role() in ('admin','manager'));
create policy "management delete sales" on public.sales_submissions for delete to authenticated
using (private.current_role() in ('admin','manager'));

create or replace function public.guard_sales_submission() returns trigger language plpgsql security definer set search_path=public,private,pg_temp as $$
declare r text;
begin
  r:=private.current_role();
  if tg_op='INSERT' then
    new.updated_at:=now();
    if r='executive' then
      new.executive_id:=auth.uid(); new.submitted_by:=auth.uid(); new.approval_status:='pending'; new.approved_by:=null; new.approved_at:=null; new.manager_note:=null;
    elsif r in ('admin','manager') then
      if new.submitted_by is null then new.submitted_by:=auth.uid(); end if;
      if new.approval_status='approved' then new.approved_by:=auth.uid(); new.approved_at:=coalesce(new.approved_at,now()); end if;
    end if;
  elsif tg_op='UPDATE' then
    new.updated_at:=now();
    if r in ('admin','manager') and new.approval_status='approved' and old.approval_status is distinct from 'approved' then new.approved_by:=auth.uid(); new.approved_at:=now();
    elsif r in ('admin','manager') and new.approval_status<>'approved' then new.approved_at:=null; new.approved_by:=null; end if;
  end if;
  return new;
end; $$;
revoke all on function public.guard_sales_submission() from public,anon,authenticated;
create trigger guard_sales_submission before insert or update on public.sales_submissions for each row execute procedure public.guard_sales_submission();

insert into public.loadouts(key,name,tagline,description,stats,sort_order,active)
values ('commander','Comando','Liderança','Visão tática do squad, aprovação de vendas e condução da operação.','[1,1,1,1]',5,true)
on conflict(key) do update set name=excluded.name,tagline=excluded.tagline,description=excluded.description,stats=excluded.stats,sort_order=excluded.sort_order,active=true;

-- Remove legacy demo performance data. Auth/Profile users remain intact.
delete from public.sales;
delete from public.operators;
