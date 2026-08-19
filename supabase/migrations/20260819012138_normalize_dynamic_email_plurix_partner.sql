-- The Plurix factory is one editorial campaign with six signature variants.
-- `activities.Parceiro = N/A` is a source-system detail; inside the factory,
-- BU Plurix is the governed semantic partner.
update public.dynamic_email_briefings
set partner = 'Plurix',
    updated_at = now()
where segment = 'CRM'
  and coalesce(partner, '') in ('', 'N/A')
  and upper(coalesce(briefing_data ->> 'NM_PRODUTO_INTERNO', '')) in (
    'AMIGAO', 'BOA', 'AVENIDA', 'COMPRE MAIS', 'PARANA', 'SUPERPAO'
  );
