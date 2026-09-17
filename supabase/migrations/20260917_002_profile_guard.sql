create or replace function public.guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() = old.id and public.current_role() <> 'admin' then
    new.role := old.role;
    new.active := old.active;
    new.team_id := old.team_id;
    new.operator_id := old.operator_id;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_sensitive_fields on public.profiles;
create trigger guard_profile_sensitive_fields
before update on public.profiles
for each row execute procedure public.guard_profile_sensitive_fields();
