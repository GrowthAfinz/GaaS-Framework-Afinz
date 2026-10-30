# Lógicas da operação CRM (o que parece erro e pode não ser)

> Regra do Pablo (07/10/2026): várias inconsistências que aparecem nos pacotes são **lógicas do
> CRM ainda não documentadas**; só uma parte é erro pontual. Antes de chamar de bug, classificar
> e perguntar. Toda resposta dele entra aqui, com data.

## Confirmado (com fonte)

| Lógica | Fonte |
|---|---|
| Upgrade (ANC) se divide em **maior** (houve aumento de limite, peça própria) e **menor** (recebe a mesma linha de comunicação da repescagem). Reaproveitar o texto da repescagem no "menor" é desenho, não erro. | vault `01-Conceitos/Upgrade.md` |
| Repescagem pode dizer "pré-aprovado" e o limite real; "sujeito à análise de crédito" continua obrigatório; não relembrar a negativa. | vault `01-Conceitos/Repescagem.md` |
| Carrinho tem 3 sub-jornadas com cadência própria: diário, 21D e sábado. Ramos institucional e eCred/Serasa. | vault `02-Entidades-Dados/Templates-Vibe-Revisao-2026/README.md`; memória `subgrupo-abd-reativacao` |
| Finalizações eCred não passam pelo SFMC; o resultado do carrinho vem do GaaS. | vault `07-Evolucao/Inconsistências-a-Corrigir.md` |
| Em Serasa as propostas podem passar da base acionável (lead externo pré-qualificado). | vault `02-Entidades-Dados/Dimensao-Canonica-de-Parceiro.md` |
| Bem Barato usa `bbt` no WhatsApp e `bb` no e-mail; journey `JOR_AQUISICAO_BB_...` sem `B2B2C_` ainda é Bem Barato. | vault `07-Evolucao/Inconsistências-a-Corrigir.md` |
| A resposta "Não tenho interesse agora" grava em `sem_interesse.resposta` uma tag "<frente> DDMM <bu>", e `sem_interesse` é exclusão na entrada das próximas jornadas. | pacote B2C NGD v1 (06/10/2026) |
| Variável de WhatsApp na Meta é posicional (`{{1}}`, `{{2}}`); a jornada liga cada posição a um campo `%%CAMPO%%`. Convenção: 1 = nome, 2 = limite (ou limite anterior), 3 = limite novo. | vault `04-Operacao/Formatacao-WhatsApp-Variaveis-e-Espacamento.md` |

## Em aberto (perguntar antes de concluir)

| Observação | Dúvida |
|---|---|
| `%%FirstName%%` em jornadas cuja DE de entrada não tem essa coluna (carrinho usa `PRIMEIRO_NOME`). | Resolve por atributo de perfil do assinante? Já foi testado? |
| Várias jornadas com o mesmo nome, diferenciadas por espaço no fim; prefixos `JOR_AQS_` e `JOR_AQUISICAO_` convivendo. | É convenção de versão/cópia? Qual nome a ingestão espera? |
| Linhas de `activities` a partir de 11/09/2026 com prefixo `JOR_AQS_` sem safra e sem resultado; jornadas Bem Barato de set/2026 ausentes. | Atraso de ingestão ou quebra pela troca de nome? |
| ANC "menor" com link de repescagem (`af_sub1=negados`). | O rastreio do ANC "menor" deve ser atribuído a Negados de propósito? |
| Jornadas B2C na pasta "Aquisição VC Alvorada". | Pasta herdada ou organização intencional? |
| Upgrade B2C disparo3 (17/09) com `${2}` = `LIMITE_CRD` e `${3}` = `ULTIMO_LIMITE` ("de R$ novo para R$ antigo"). | `ULTIMO_LIMITE` é o limite anterior ou o mais recente? A versão Bem Barato usa a ordem inversa. |
| Clube Bem Barato SEM3 entra pela `CLUBE_BEM_BARATO_SET26` e o Update Contact grava na `CLUBE_BEM_BARATO_FEV26_v3`. | É estado compartilhado entre as bases de propósito? |

## Erros confirmados (registro)

| Data | Erro | Status |
|---|---|---|
| 06/10/2026 | Repescagem B2C disparo6 (template `b2c_repescagem`, 30/09): parâmetros `%%FirstName%%` e `%%State%%` no lugar de nome e limite. | apontado ao Pablo; conferir log de envio |

## ID de template de e-mail/SMS de topo CRM (confirmado pelo Pablo em 08/10/2026)

Formato `{publico}_{canal}_{campanha}_{segmento}_S{semana}D{disparo}`. O e-mail dinâmico não traz
af_sub3 no pacote; o ID sai desta regra (implementada em `fila_agente.mts`, função `topoCrmId`):

- `D` = ORDEM do disparo na régua: disp1 -> D01, disp2 -> D02, disp3 -> D03, disp4 -> repete o D02.
- Segmento no ID: `bsp` só no B2C; parceiros (BB, Dia, Plurix) usam `crm`. A planilha
  GOVERNANÇA_LINKS_E_TEMPLATES tem BB e Dia Vibe com `bsp` por engano (Pablo: "errei alguns bsp");
  o catálogo ainda tem `bb_email_vibe_bsp_*` / `dia_email_vibe_bsp_*`, que são esses erros.
- SMS de topo: só D01 por semana (`*_sms_vibe_{seg}_S{s}D01`), para quem clicou.
- Ainda serão criados (NÃO propor por enquanto): D03 da Vibe e toda a semana 4 da Vibe.
  Exceção a perguntar: `b2c_email_vibe_bsp_S2D03` já existe no catálogo e em activities.
- Hipóteses abertas: disp3s4vibe ligado a `b2c_email_copa_bsp_S4D03` em activities (herança da Copa);
  `bb_sms_crm_disp1s2vibeclicked` aparece como `..._S3D01` na planilha (nome diz s2).

- Só o e-mail do Plurix é dinâmico (AMPscript). B2C, BB e Dia são HTML normal com af_sub3 no link.
- ATENÇÃO (08/10/2026): os links no ar no SFMC de BB e Dia Vibe usam `bsp`
  (`bb_email_vibe_bsp_S3D01`, `dia_email_vibe_bsp_S1D01`, `bb_sms_vibe_bsp_S2D01`, `dia_sms_vibe_bsp_S1D01`).
  A regra do Pablo diz `crm`. Enquanto o link no ar não mudar, o AppsFlyer recebe `bsp`: perguntar antes de
  gravar `crm` como template_id. E-mail 5 BB Vibe (asset 178253) tem dois af_sub3 (S1D01 e S3D01).
- RESOLVIDO (08/10/2026, Pablo): B2B2C (BB, Dia) não tem base proprietária, então o ID usa `crm`. Os `bsp`
  nos links do SFMC foram erro pontual. O catálogo foi renomeado: 24 templates `bb_/dia_*_bsp_*` viraram
  `*_crm_*` (ID antigo em `metadata.template_id_legado`). O `sugerir` troca bsp -> crm no B2B2C e deixa o
  conflito "link no ar ainda manda bsp" até o link ser corrigido no SFMC.
