-- Recompõe editorialmente os E-mails 3 a 8 da régua Plurix sem trocar
-- identidade, agrupamento, taxonomia ou campos técnicos dos 36 registros.

do $$
declare
  target_count integer;
begin
  select count(*) into target_count
  from public.dynamic_email_briefings
  where briefing_data->>'SEQUENCIA' in ('E-mail 3', 'E-mail 4', 'E-mail 5', 'E-mail 6', 'E-mail 7', 'E-mail 8')
    and briefing_data->>'NM_PRODUTO_INTERNO' in ('AMIGAO', 'BOA', 'AVENIDA', 'COMPRE MAIS', 'PARANA', 'SUPERPAO');

  if target_count <> 36 then
    raise exception 'Atualização Plurix abortada: esperado 36 registros, encontrado %.', target_count;
  end if;
end $$;

with editorial(sequence_name, preheader, title_1, copy_1, cta_1, title_2, copy_2, cta_2, header_asset, banner_1_asset, banner_2_asset) as (
  values
    ('E-mail 3',
      'Conheça agora o Clube +amigo',
      'O Clube agora é +amigo',
      '%%=v(@FirstName)=%%, o Clube agora é +amigo e chega com mais ofertas exclusivas para você.',
      'CONHECER O +AMIGO',
      'Mais benefícios com o cartão',
      'Além das ofertas do Clube, o cartão +amigo dá acesso a +5% em carnes, aves, leite, arroz e feijão e a até 70% em consultas e exames.',
      'PEDIR CARTÃO +AMIGO',
      '[PENDENTE MKT] HEADER 600 px: comunicar que o Clube da bandeira agora é +amigo; não é necessário novo cadastro.',
      '[PENDENTE MKT] BANNER 552 px: mostrar a mudança do Clube para +amigo e as ofertas exclusivas.',
      '[PENDENTE MKT] BANNER 552 px: apresentar o cartão +amigo e os benefícios citados no texto.'),
    ('E-mail 4',
      'Até 70% em consultas, exames e medicamentos',
      'Você Bem cuida da sua saúde',
      '%%=v(@FirstName)=%%, com o cartão +amigo você acessa descontos em consultas, exames e medicamentos pelo programa Você Bem.',
      'PEDIR CARTÃO +AMIGO',
      'Preços para toda a família',
      'Consultas a partir de R$ 50 e exames a partir de R$ 10, sem carência e sem limite de uso. Cobertura para titular, cônjuge, filhos até 30 anos, pais e sogros; consulte a rede credenciada.',
      'CONFERIR REDE DE SAÚDE',
      '[PENDENTE MKT] HEADER 600 px: comunicar descontos de até 70% em farmácias, consultas e exames.',
      '[PENDENTE MKT] BANNER 552 px: apresentar consultas, exames e farmácias do programa Você Bem.',
      '[PENDENTE MKT] BANNER 552 px: destacar preços, cobertura familiar, ausência de carência e rede credenciada.'),
    ('E-mail 5',
      'Validação de Produto necessária antes do envio',
      'Pontos e recompensas: validar',
      '[PENDENTE MKT] A peça antiga afirma acúmulo de pontos e troca por vale-compras, O Boticário e Drogaria São Paulo. Produto deve confirmar se o benefício continua vigente.',
      '',
      'Não liberar sem confirmação',
      '[PENDENTE MKT] Confirmar regra de acúmulo a partir de R$ 10, parceiros, recompensas e prazo de voucher antes de transformar o legado em promessa atual.',
      '',
      '[PENDENTE MKT] HEADER 600 px: criar somente após Produto confirmar a vigência do programa de pontos.',
      '[PENDENTE MKT] BANNER 552 px: explicar acúmulo e resgate somente após validação das regras.',
      '[PENDENTE MKT] BANNER 552 px: listar recompensas e parceiros somente após validação contratual.'),
    ('E-mail 6',
      'Use no supermercado e onde mais você quiser',
      'Um Visa para usar onde quiser',
      '%%=v(@FirstName)=%%, o cartão +amigo é Visa: use nas compras do dia a dia e aproveite vantagens dos parceiros Vai de Visa.',
      'PEDIR CARTÃO +AMIGO',
      'Mais benefícios com Vai de Visa',
      'Encontre descontos em restaurantes e delivery, ofertas em eletrônicos, streaming e assinaturas, além de promoções em beleza, saúde e bem-estar.',
      'CONFERIR VAI DE VISA',
      '[PENDENTE MKT] HEADER 600 px: comunicar que o +amigo é um cartão Visa para usar onde quiser, sem prometer limite.',
      '[PENDENTE MKT] BANNER 552 px: apresentar categorias de benefícios do Vai de Visa.',
      '[PENDENTE MKT] BANNER 552 px: apoiar a chamada de conferência dos benefícios Vai de Visa.'),
    ('E-mail 7',
      'Peça seu cartão +amigo e aproveite mais',
      'Com o cartão, você vai além',
      '%%=v(@FirstName)=%%, no Clube +amigo você já aproveita ofertas. Com o cartão +amigo, pode economizar ainda mais a cada compra.',
      'PEDIR CARTÃO +AMIGO',
      'Compare Clube e cartão',
      'Clube +amigo: promoções, eventos e sorteios. Cartão +amigo: mais descontos em carnes, aves, leite, arroz, feijão, farmácias, exames e consultas.',
      '',
      '[PENDENTE MKT] HEADER 600 px: comparar a economia do Clube +amigo com os benefícios adicionais do cartão.',
      '[PENDENTE MKT] BANNER 552 px: matriz comparativa Sem Clube/Sem Cartão, Clube +amigo e Cartão +amigo.',
      ''),
    ('E-mail 8',
      'O açougue fica mais barato para você',
      'Economia real no açougue',
      '%%=v(@FirstName)=%%, economizar para o churrasco ficou mais fácil: o cartão +amigo garante +5% de desconto em carnes e aves frescas.',
      'PEDIR CARTÃO +AMIGO',
      'Veja uma simulação de preço',
      'Contra-filé: R$ 49,90 sem Clube e cartão; R$ 43,90 no Clube; R$ 41,70 com o cartão (+5% OFF). Preços e imagens são uma simulação ilustrativa; o desconto de +5% é o benefício comunicado.',
      '',
      '[PENDENTE MKT] HEADER 600 px: comunicar a diferença do cartão +amigo na compra para churrasco.',
      '[PENDENTE MKT] BANNER 552 px: comparar os três preços simulados do contra-filé e destacar +5% OFF.',
      '')
),
targets as (
  select b.*, e.*,
    case b.briefing_data->>'NM_PRODUTO_INTERNO'
      when 'AMIGAO' then 'Amigão'
      when 'BOA' then 'Boa Supermercados'
      when 'AVENIDA' then 'Supermercados Avenida'
      when 'PARANA' then 'Paraná'
      else null
    end as subject_brand
  from public.dynamic_email_briefings b
  join editorial e on e.sequence_name = b.briefing_data->>'SEQUENCIA'
  where b.briefing_data->>'NM_PRODUTO_INTERNO' in ('AMIGAO', 'BOA', 'AVENIDA', 'COMPRE MAIS', 'PARANA', 'SUPERPAO')
),
updated as (
  update public.dynamic_email_briefings b
  set briefing_data = b.briefing_data || jsonb_build_object(
      '__id', b.id::text,
      'ASSUNTO', case t.sequence_name
        when 'E-mail 3' then coalesce('O Clube ' || t.subject_brand || ' agora é +amigo', 'O Clube agora é +amigo')
        when 'E-mail 4' then 'Com o cartão +amigo, cuide da sua saúde'
        when 'E-mail 5' then 'Programa de pontos: validação pendente'
        when 'E-mail 6' then coalesce(t.subject_brand || ': use seu +amigo onde quiser', 'Use seu cartão +amigo onde quiser')
        when 'E-mail 7' then coalesce(t.subject_brand || ': com o cartão, vá além', 'Com o cartão +amigo, vá além')
        when 'E-mail 8' then coalesce(t.subject_brand || ': economize no açougue', 'Só com o cartão +amigo')
      end,
      'PRE_CABECALHO', t.preheader,
      'TITULO_COPY_1_AZUL', t.title_1,
      'COPY_1_PRETO', t.copy_1,
      'TITULO_CTA_1', t.cta_1,
      'TITULO_COPY_2', t.title_2,
      'COPY_2_PRETO', t.copy_2,
      'TITULO_CTA_2', t.cta_2,
      'HEADER', t.header_asset,
      'BANNER_1_CORPO', t.banner_1_asset,
      'BANNER_2_CORPO', t.banner_2_asset
    ),
    status = 'needs_review',
    version = b.version + 1,
    updated_at = now()
  from targets t
  where b.id = t.id
  returning b.*
)
insert into public.dynamic_email_briefing_versions
  (briefing_id, version, snapshot, change_summary, warnings)
select id, version, to_jsonb(updated),
  'Recomposição editorial rastreável dos E-mails 3 a 8 da régua Plurix',
  case when briefing_data->>'SEQUENCIA' = 'E-mail 5'
    then '["Programa de pontos bloqueado até validação atual de Produto e Marketing", "Assets pendentes bloqueiam exportação", "Test Send do SFMC obrigatório"]'::jsonb
    else '["Assets pendentes bloqueiam exportação", "Test Send do SFMC obrigatório"]'::jsonb
  end
from updated;
