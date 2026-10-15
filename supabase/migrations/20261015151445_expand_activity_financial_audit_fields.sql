alter table public.activity_data_correction_audit drop constraint activity_data_correction_audit_field_check;
alter table public.activity_data_correction_audit add constraint activity_data_correction_audit_field_check
check(field in ('CAC','Ordem de disparo','Custo unitário do canal','Custo total canal','Custo Total Campanha'));
