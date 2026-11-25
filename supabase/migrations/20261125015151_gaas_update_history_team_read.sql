-- Histórico de atualizações visível para o time todo (membros aprovados).
-- Escrever, editar e apagar continuam só para quem criou; a trava restritiva
-- gaas_approved_member_gate segue barrando quem não é membro aprovado.
drop policy if exists "Authenticated users can read update runs" on public.gaas_update_runs;
create policy "Team members can read update runs" on public.gaas_update_runs
  for select to authenticated using (true);

drop policy if exists "Authenticated users can read update candidates" on public.gaas_update_candidates;
create policy "Team members can read update candidates" on public.gaas_update_candidates
  for select to authenticated using (true);
