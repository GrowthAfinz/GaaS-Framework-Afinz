-- Fábrica de E-mails · estrutura escalável de benefícios de produto.
-- Aditiva e idempotente. Campos só fazem sentido quando guardrail_type = 'benefit',
-- todos nullable — outros tipos de guardrail ignoram.
-- O front lê estas colunas de forma defensiva; enquanto a migration não roda,
-- a categoria é inferida no cliente a partir do título/regra.

-- 1. Categoria compartilhada entre TODOS os produtos — a chave que liga benefícios
--    entre cartões e permite montar a matriz produto × categoria.
alter table public.dynamic_email_product_guardrails
  add column if not exists category text
    check (category is null or category in (
      'desconto','cashback','prazo','saude','seguro','cartao_virtual',
      'aceitacao','frete','sorteio','pontos','vibe','app','atendimento','outro'
    ));

-- 2. Valor literal como a fonte publica ("a partir de +5% off", "até 70%", "R$100").
alter table public.dynamic_email_product_guardrails
  add column if not exists value_exact text;

-- 3. Permissão editorial de citação (distinta de allowed_status, que é o gate de publicação).
alter table public.dynamic_email_product_guardrails
  add column if not exists citation_status text
    check (citation_status is null or citation_status in ('pode','nao','cuidado','checar'));

-- 4. Tipo de fonte por linha (a coluna `provenance` fica só no contexto).
alter table public.dynamic_email_product_guardrails
  add column if not exists source_type text
    check (source_type is null or source_type in ('oficial','terceira','interno'));

-- 5. Origem do dado — governa o sync com Dicionario_Produtos_Afinz_v3.xlsx:
--    'xlsx'  = sincronizado da planilha (o sync só toca estas linhas)
--    'gaas'  = editado na tela (imune ao sync até voltar a seguir a planilha)
--    'llm'   = preenchido por IA autorizada via chat
alter table public.dynamic_email_product_guardrails
  add column if not exists source text not null default 'gaas'
    check (source in ('xlsx','gaas','llm'));
alter table public.dynamic_email_product_contexts
  add column if not exists source text not null default 'gaas'
    check (source in ('xlsx','gaas','llm'));

-- 6. applies_to (jsonb) já existe em product_guardrails desde a v2. Convenção de chaves:
--    { "frentes":[], "objetivos":[], "estagios":[], "produtos":[], "bandeiras":[] }
--    Vazio = vale para todo o produto.
comment on column public.dynamic_email_product_guardrails.applies_to is
  'Escopo opcional do benefício/regra. Chaves: frentes, objetivos, estagios, produtos, bandeiras. Vazio = todo o produto.';

create index if not exists dynamic_email_guardrails_benefit_idx
  on public.dynamic_email_product_guardrails (product_context_id, category, valid_to)
  where guardrail_type = 'benefit';
