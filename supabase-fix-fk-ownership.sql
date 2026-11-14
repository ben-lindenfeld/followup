-- Enforce that foreign keys point at the owner's own rows (cross-tenant attach prevention).
drop policy "own leads" on public.leads;
create policy "own leads" on public.leads for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (customer_id is null or exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid()))
  );

drop policy "own tasks" on public.tasks;
create policy "own tasks" on public.tasks for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (customer_id is null or exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid()))
  );

drop policy "own notes" on public.notes;
create policy "own notes" on public.notes for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid())
  );

drop policy "own activity" on public.activity_logs;
create policy "own activity" on public.activity_logs for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (customer_id is null or exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid()))
  );
