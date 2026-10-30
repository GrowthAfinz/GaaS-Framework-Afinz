# Taxonomia × Marca — regras de validação

A taxonomia do `activity_name` **não mapeia 1:1 para BU** (validado nos dados):
- `afz` (1º token) aparece em B2C, B2B2C, Plurix e Seguros — é o **emissor**, não a BU.
- Plurix usa muito `afz_..._grl_` **e** `plu_...`.
- `bbt` (Bem Barato) e `dia` (Dia) aparecem como **sigla no meio** do nome, não no prefixo.

Por isso a validação **não** tenta classificar BU pela taxonomia. Ela usa sinais de
**consistência** de alta confiança:

## 1. activity_name reusado entre apps (alta confiança)
Um `activity_name` é uma execução única; não pode pertencer a dois `template_id` de
**apps diferentes**. Se a planilha mapeia o mesmo activity_name para apps distintos
(ex.: `plu_car_vis_aqs_email_apr_disp1s1copa_pontual` em **Plurix** e em **Bem Barato**),
é cópia → `suspeito`.

## 2. Marca do template × emissor da taxonomia (confiança média)
Convenção do prefixo do `template_id`:
- `b2c_`, `dia_`, `bb_` → família **Afinz** → taxonomia deve começar com `afz`.
- `plurix_` → **Plurix** → taxonomia `plu` (ou `afz_..._grl`).

Divergências sinalizadas:
- template família Afinz, mas taxonomia começa com `plu` → `suspeito`.
- template Plurix, mas taxonomia começa com `afz` **sem** marca `grl` → `suspeito`.

## 3. Existência em `activities`
- activity_name não encontrado em `activities` → `activity_nao_encontrada` (cria draft, não vincula).
- sem activity_name na planilha → `planejado_sem_activity` (cria draft, não vincula).

## 4. BU/Parceiro divergente do token explícito na jornada (alta confiança) — pendente de implementar

**Achado em auditoria de 2026-07-06** (ver `.claude/skills/gaas-momento-disparo/references/higiene_taxonomia.md`
para o detalhe e as queries): a coluna `activities.BU` pode divergir do token
explícito no nome da **jornada** (não da taxonomia do activity, que é ambígua —
ver nota do topo deste arquivo). Quando `jornada ilike '%b2b2c%'` mas `BU <> 'B2B2C'`,
ou `jornada ilike '%plurix%'` mas `BU <> 'Plurix'`, é sinal de alta confiança de erro
de digitação/import — 7 disparos da campanha Copa (jul/2026) e 2 disparos Plurix
(abr/mai 2026) foram achados assim, todos com `BU='B2C'` errado.

Esta regra **ainda não está implementada** em `governance_templates.py` nem no
importador (`IntelligentFrameworkUpdate.tsx`, que só herda BU/Segmento por histórico
no fluxo de rentabilização, não no de aquisição). Antes de rodar `analyze` numa
planilha nova, ou de aprovar um import de aquisição, rode a query de higiene do
`gaas-momento-disparo` e trate resultado como `suspeito` de BU (mesmo tratamento de
"parar e mostrar" da seção anterior) — ainda não automatizado no script, fazer manual
por enquanto.

## Decisões do operador (fixadas)
- Em `suspeito`: **parar e mostrar** antes de gravar; não importar por padrão.
- **Não** sugerir o activity_name correto — apenas sinalizar.
- Planejados/não-encontrados: **guardar mesmo assim** como draft (o vínculo se completa
  quando o disparo aparecer em `activities` e for reprocessado).
