create table if not exists public.goal_tiers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  threshold_vgv numeric(14,2) not null default 0,
  reward text not null default '',
  weapon text not null default '',
  code text not null default '',
  badge_key text not null default 'meta_grenade',
  sort_order int not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists goal_tiers_campaign_sort_uidx on public.goal_tiers(campaign_id, sort_order);
create index if not exists goal_tiers_campaign_idx on public.goal_tiers(campaign_id);

alter table public.goal_tiers enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='goal_tiers' and policyname='authenticated read goal tiers') then
    create policy "authenticated read goal tiers" on public.goal_tiers
    for select to authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='goal_tiers' and policyname='admin manage goal tiers') then
    create policy "admin manage goal tiers" on public.goal_tiers
    for all to authenticated
    using (private.current_role() = 'admin')
    with check (private.current_role() = 'admin');
  end if;
end $$;

insert into public.goal_tiers (campaign_id, name, threshold_vgv, reward, weapon, code, badge_key, sort_order, active)
select c.id, g.name, g.threshold_vgv, g.reward, g.weapon, g.code, g.badge_key, g.sort_order, true
from public.campaigns c
cross join (
  values
    ('Meta', 2500000::numeric, 'Kart', 'Granada de impacto', 'Frag', 'meta_grenade', 1),
    ('Super', 3500000::numeric, 'P2', 'Carga C4', 'Breach', 'super_c4', 2),
    ('Hiper', 5000000::numeric, 'P3 + Óculos', 'Míssil guiado', 'Strike', 'hiper_missile', 3),
    ('Suprema', 7000000::numeric, 'Turbinada', 'Bomba atômica', 'Omega', 'suprema_nuke', 4)
) as g(name, threshold_vgv, reward, weapon, code, badge_key, sort_order)
where c.active = true
on conflict (campaign_id, sort_order) do update set
  name = excluded.name,
  threshold_vgv = excluded.threshold_vgv,
  reward = excluded.reward,
  weapon = excluded.weapon,
  code = excluded.code,
  badge_key = excluded.badge_key,
  active = true,
  updated_at = now();
