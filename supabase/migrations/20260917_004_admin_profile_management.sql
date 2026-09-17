create policy "admin update managed profiles" on public.profiles for update to authenticated
using (private.current_role() = 'admin') with check (private.current_role() = 'admin');
