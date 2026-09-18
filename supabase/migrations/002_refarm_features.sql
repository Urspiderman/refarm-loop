-- ReFarm Loop feature fields for My Surplus. No seed data.
alter table public.surplus_listings add column if not exists category text;
alter table public.surplus_listings add column if not exists location_text text;
alter table public.surplus_listings add column if not exists available_date date;
alter table public.surplus_listings add column if not exists notes text;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='material_assessments' and policyname='assessment owner insert') then
    create policy "assessment owner insert" on public.material_assessments for insert with check (exists(select 1 from public.surplus_listings s where s.id=surplus_id and s.supplier_id=auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='material_assessments' and policyname='assessment owner update') then
    create policy "assessment owner update" on public.material_assessments for update using (exists(select 1 from public.surplus_listings s where s.id=surplus_id and s.supplier_id=auth.uid()));
  end if;
end $$;
