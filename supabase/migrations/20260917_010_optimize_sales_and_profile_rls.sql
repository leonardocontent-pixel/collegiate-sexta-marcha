create index if not exists sales_submissions_submitted_by_idx on public.sales_submissions(submitted_by);
create index if not exists sales_submissions_approved_by_idx on public.sales_submissions(approved_by);

drop policy if exists "read own or managed profiles" on public.profiles;
drop policy if exists "authenticated read active executives" on public.profiles;
create policy "read own managed or active executive profiles" on public.profiles for select to authenticated
using (id=(select auth.uid()) or private.current_role() in ('admin','manager') or (role='executive' and active=true));
