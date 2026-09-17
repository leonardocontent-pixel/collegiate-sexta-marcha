create or replace function public.guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if auth.uid() = old.id and private.current_role() <> 'admin' then
    -- One-time bootstrap: when there is still no active admin, the first authenticated
    -- user may promote only their own profile to admin.
    if new.role = 'admin' and old.role <> 'admin' and not exists (
      select 1 from public.profiles p where p.role = 'admin' and p.active = true and p.id <> old.id
    ) then
      null;
    else
      new.role := old.role;
    end if;
    new.active := old.active;
    new.team_id := old.team_id;
    new.operator_id := old.operator_id;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_profile_sensitive_fields() from public, anon, authenticated;
