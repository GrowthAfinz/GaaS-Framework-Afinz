begin;

insert into public.crm_structure_cards (id,lane_id,title,position,measurement,data_scope) values ('0c5c1711-0000-4000-8000-000000000001',(select l.id from public.crm_structure_lanes l join public.crm_structure_pillars p on p.id=l.pillar_id where p.title='Desbloqueio e 1º Uso' and not p.archived and not l.archived order by l.position,l.id limit 1),'Pós-Tombamento',101,'c','{"domain": "renta", "any_of": [{"journey": "DISPARO_POS_TOMBAMENTO_BEM_BARATO_OUT_2"}, {"journey": "DISPARO_POS_TOMBAMENTO_BEM_BARATO_OUT_3"}, {"journey": "DISPARO_POS_TOMBAMENTO_BEM_BARATO_RÉGUA 30 DIAS"}, {"journey": "DISPARO_POS_TOMBAMENTO_PLURIX_MAISMAIGO_OUT"}, {"journey": "DISPARO_POS_TOMBEMENTO_BEM_BARATO_OUT"}, {"journey": "JOR_POS_TOMBAMENTO_DESBLOQUEIO_PLURIX_MAISAMIGO"}, {"journey": "JOR_POS_TOMBAMENTO_DESBLOQUEIO_PLURIX_MAISAMIGO_MAIO"}], "observed_only": true}'::jsonb) on conflict (id) do nothing;

insert into public.crm_structure_pillars (id,title,position) values ('0c5a1711-0000-4000-8000-000000000002','Antecipação',102) on conflict (id) do nothing;

insert into public.crm_structure_lanes (id,pillar_id,title,metric_key) values ('0c5b1711-0000-4000-8000-000000000002','0c5a1711-0000-4000-8000-000000000002','Antecipação','re') on conflict (id) do nothing;

insert into public.crm_structure_cards (id,lane_id,title,position,measurement,data_scope) values ('0c5c1711-0000-4000-8000-000000000002','0c5b1711-0000-4000-8000-000000000002','Antecipação de recebíveis',102,'c','{"domain": "renta", "any_of": [{"journey": "JOR_AM_ANTECIPACAO_F2_SAFRA10"}, {"journey": "JOR_AM_ANTECIPACAO_F2_SAFRA10_2"}, {"journey": "JOR_AM_ANTECIPACAO_F2_SAFRA6"}, {"journey": "JOR_AM_ANTECIPACAO_F2_SAFRA8"}, {"journey": "JOR_AM_ANTECIPACAO_F2_SAFRA9"}, {"journey": "JOR_ARV_ANTECIPACAO_PL"}], "observed_only": true}'::jsonb) on conflict (id) do nothing;

insert into public.crm_structure_pillars (id,title,position) values ('0c5a1711-0000-4000-8000-000000000003','Indicação',103) on conflict (id) do nothing;

insert into public.crm_structure_lanes (id,pillar_id,title,metric_key) values ('0c5b1711-0000-4000-8000-000000000003','0c5a1711-0000-4000-8000-000000000003','Indicação','re') on conflict (id) do nothing;

insert into public.crm_structure_cards (id,lane_id,title,position,measurement,data_scope) values ('0c5c1711-0000-4000-8000-000000000003','0c5b1711-0000-4000-8000-000000000003','Indicação Plurix',103,'c','{"domain": "renta", "any_of": [{"journey": "JOR_CIC_PLURIX_INDICACAO_ASSIS"}, {"journey": "JOR_CIC_PLURIX_INDICACAO_ASSIS_CAMPOMOURAO"}, {"journey": "JOR_CIC_PLURIX_INDICACAO_CAMPOMOURAO"}], "observed_only": true}'::jsonb) on conflict (id) do nothing;

insert into public.crm_structure_pillars (id,title,position) values ('0c5a1711-0000-4000-8000-000000000004','VBSS',104) on conflict (id) do nothing;

insert into public.crm_structure_lanes (id,pillar_id,title,metric_key) values ('0c5b1711-0000-4000-8000-000000000004','0c5a1711-0000-4000-8000-000000000004','VBSS','re') on conflict (id) do nothing;

insert into public.crm_structure_cards (id,lane_id,title,position,measurement,data_scope) values ('0c5c1711-0000-4000-8000-000000000004','0c5b1711-0000-4000-8000-000000000004','Fim de degustação',104,'c','{"domain": "renta", "any_of": [{"journey": "JOR_CIC_VBSS_FIM_DEGUSTACAO"}, {"journey": "JOR_CIC_VBSS_FIM_DEGUSTACAO_COMPLETO"}, {"journey": "JOR_CIC_VBSS_FIM_DEGUSTACAO_D60_D45"}, {"journey": "JOR_VBSS_FIM_DEGUSTACAO"}], "observed_only": true}'::jsonb) on conflict (id) do nothing;

insert into public.crm_structure_pillars (id,title,position) values ('0c5a1711-0000-4000-8000-000000000004','VBSS',105) on conflict (id) do nothing;

insert into public.crm_structure_cards (id,lane_id,title,position,measurement,data_scope) values ('0c5c1711-0000-4000-8000-000000000005','0c5b1711-0000-4000-8000-000000000004','Promoção do mês',105,'c','{"domain": "renta", "any_of": [{"journey": "JOR_VBS_PROMO_DO_MES"}, {"journey": "JOR_VBSS_PROMO_DO_MES"}], "observed_only": true}'::jsonb) on conflict (id) do nothing;

insert into public.crm_structure_pillars (id,title,position) values ('0c5a1711-0000-4000-8000-000000000005','Cobrança',106) on conflict (id) do nothing;

insert into public.crm_structure_lanes (id,pillar_id,title,metric_key) values ('0c5b1711-0000-4000-8000-000000000005','0c5a1711-0000-4000-8000-000000000005','Cobrança','re') on conflict (id) do nothing;

insert into public.crm_structure_cards (id,lane_id,title,position,measurement,data_scope) values ('0c5c1711-0000-4000-8000-000000000006','0c5b1711-0000-4000-8000-000000000005','Fatura não enviada',106,'c','{"domain": "renta", "any_of": [{"journey": "JOR_TRS_COB_FATURA_NAO_ENVIADA"}, {"journey": "JOR_TRS_COB_PLU_FATURA_NAO_ENVIADA"}], "observed_only": true}'::jsonb) on conflict (id) do nothing;

insert into public.crm_structure_pillars (id,title,position) values ('0c5a1711-0000-4000-8000-000000000005','Cobrança',107) on conflict (id) do nothing;

insert into public.crm_structure_cards (id,lane_id,title,position,measurement,data_scope) values ('0c5c1711-0000-4000-8000-000000000007','0c5b1711-0000-4000-8000-000000000005','Preventiva',107,'c','{"domain": "renta", "any_of": [{"journey": "JOR_COBRANCA_PREVENTIVA_AFINZ"}, {"journey": "JOR_COBRANCA_PREVENTIVA_AFINZ_V2"}], "observed_only": true}'::jsonb) on conflict (id) do nothing;

insert into public.crm_structure_pillars (id,title,position) values ('0c5a1711-0000-4000-8000-000000000005','Cobrança',108) on conflict (id) do nothing;

insert into public.crm_structure_cards (id,lane_id,title,position,measurement,data_scope) values ('0c5c1711-0000-4000-8000-000000000008','0c5b1711-0000-4000-8000-000000000005','Atraso',108,'c','{"domain": "renta", "any_of": [{"journey": "JOR_COBRANCA_ATRASO_FIXA_CP_PROD_04"}, {"journey": "JOR_COBRANCA_ATRASO_FIXA_CP_PROD_05"}], "observed_only": true}'::jsonb) on conflict (id) do nothing;

insert into public.crm_structure_pillars (id,title,position) values ('0c5a1711-0000-4000-8000-000000000006','Regulatório',109) on conflict (id) do nothing;

insert into public.crm_structure_lanes (id,pillar_id,title,metric_key) values ('0c5b1711-0000-4000-8000-000000000006','0c5a1711-0000-4000-8000-000000000006','Regulatório','re') on conflict (id) do nothing;

insert into public.crm_structure_cards (id,lane_id,title,position,measurement,data_scope) values ('0c5c1711-0000-4000-8000-000000000009','0c5b1711-0000-4000-8000-000000000006','Contrato e termos',109,'c','{"domain": "renta", "any_of": [{"journey": "JOR_CONTRATO_AFINZ_CONTAS_NOVAS"}, {"journey": "JOR_REGULATORIO_NOVO_TC"}, {"journey": "JOR_REGULATORIO_NOVO_TC_PLX"}], "observed_only": true}'::jsonb) on conflict (id) do nothing;

insert into public.crm_structure_pillars (id,title,position) values ('0c5a1711-0000-4000-8000-000000000006','Regulatório',110) on conflict (id) do nothing;

insert into public.crm_structure_cards (id,lane_id,title,position,measurement,data_scope) values ('0c5c1711-0000-4000-8000-000000000010','0c5b1711-0000-4000-8000-000000000006','Anuidade e mensalidade',110,'c','{"domain": "renta", "any_of": [{"journey": "JOR_BARATAO_NOVA_ANUIDADE"}, {"journey": "JOR_CIC_AUMENTO_MENSALIDADE_RD"}, {"journey": "JOR_SIPOLATTI_NOVA_ANUIDADE"}], "observed_only": true}'::jsonb) on conflict (id) do nothing;

update public.crm_structure_cards set data_scope='{"domain": "renta", "any_of": [{"journey": "JOR_RENT_POOL_OFERTAS"}, {"journey": "JOR_RENT_POOL_OFERTAS_REPIQUE_EMAGRECENTRO"}, {"journey": "JOR_SHOPPING_AFINZ_EMAGRECENTRO"}, {"journey": "JOR_SHOPPING_AFINZ_STARMOVEIS"}, {"journey": "JOR_SHOPPING_AFINZ_VIRTUOSA"}]}'::jsonb, measurement='c', wiki_note='10-Resultados/Iniciativas/Iniciativa-Pool-de-Ofertas-Parceiros', revision=revision+1, updated_at=now() where title='Shopping Afinz on-us' and not archived and data_scope is null;

update public.crm_structure_cards set data_scope='{"domain": "renta", "any_of": [{"journey": "JOR_RENT_POOL_OFERTAS_VDV"}]}'::jsonb, measurement='c', wiki_note='10-Resultados/Iniciativas/Iniciativa-Pool-de-Ofertas-Vai-de-Visa', revision=revision+1, updated_at=now() where title='Shopping Afinz off-us' and not archived and data_scope is null;

commit;
