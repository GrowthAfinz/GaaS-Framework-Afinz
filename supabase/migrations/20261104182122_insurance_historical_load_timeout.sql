begin;
-- Initial historical workbooks materialize hundreds of governed facts in one transaction.
-- Extend only this write RPC; keep all role checks, RLS and ordinary read timeouts intact.
alter function public.insurance_save_snapshot(jsonb) set statement_timeout to '60s';
notify pgrst, 'reload schema';
commit;
