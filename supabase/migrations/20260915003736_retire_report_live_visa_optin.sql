-- Copa Visa / opt-in foi encerrada. Preservamos o contrato histórico e os
-- artefatos imutáveis; apenas retiramos o slide da seleção de novos runs.
update public.report_slide_contracts
set active = false,
    updated_at = now()
where slide_code = 'K-VISA';
