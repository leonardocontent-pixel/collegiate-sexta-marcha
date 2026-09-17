create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id);

-- Profiles: collapse UPDATE policies and cache auth.uid() through SELECT.
drop policy if exists "read own or managed profiles" on public.profiles;
create policy "read own or managed profiles" on public.profiles for select to authenticated
using (id = (select auth.uid()) or private.current_role() in ('admin','manager'));

drop policy if exists "update own profile" on public.profiles;
drop policy if exists "admin update managed profiles" on public.profiles;
create policy "update own or admin managed profile" on public.profiles for update to authenticated
using (id = (select auth.uid()) or private.current_role() = 'admin')
with check (id = (select auth.uid()) or private.current_role() = 'admin');

-- Split management ALL policies so SELECT uses only the read policy.
drop policy if exists "management write teams" on public.teams;
create policy "management insert teams" on public.teams for insert to authenticated with check (private.current_role() in ('admin','manager'));
create policy "management update teams" on public.teams for update to authenticated using (private.current_role() in ('admin','manager')) with check (private.current_role() in ('admin','manager'));
create policy "management delete teams" on public.teams for delete to authenticated using (private.current_role() in ('admin','manager'));

drop policy if exists "management write operators" on public.operators;
create policy "management insert operators" on public.operators for insert to authenticated with check (private.current_role() in ('admin','manager'));
create policy "management update operators" on public.operators for update to authenticated using (private.current_role() in ('admin','manager')) with check (private.current_role() in ('admin','manager'));
create policy "management delete operators" on public.operators for delete to authenticated using (private.current_role() in ('admin','manager'));

drop policy if exists "management write campaigns" on public.campaigns;
create policy "management insert campaigns" on public.campaigns for insert to authenticated with check (private.current_role() in ('admin','manager'));
create policy "management update campaigns" on public.campaigns for update to authenticated using (private.current_role() in ('admin','manager')) with check (private.current_role() in ('admin','manager'));
create policy "management delete campaigns" on public.campaigns for delete to authenticated using (private.current_role() in ('admin','manager'));

drop policy if exists "management write sales" on public.sales;
create policy "management insert sales" on public.sales for insert to authenticated with check (private.current_role() in ('admin','manager'));
create policy "management update sales" on public.sales for update to authenticated using (private.current_role() in ('admin','manager')) with check (private.current_role() in ('admin','manager'));
create policy "management delete sales" on public.sales for delete to authenticated using (private.current_role() in ('admin','manager'));

drop policy if exists "admin write loadouts" on public.loadouts;
create policy "admin insert loadouts" on public.loadouts for insert to authenticated with check (private.current_role() = 'admin');
create policy "admin update loadouts" on public.loadouts for update to authenticated using (private.current_role() = 'admin') with check (private.current_role() = 'admin');
create policy "admin delete loadouts" on public.loadouts for delete to authenticated using (private.current_role() = 'admin');
