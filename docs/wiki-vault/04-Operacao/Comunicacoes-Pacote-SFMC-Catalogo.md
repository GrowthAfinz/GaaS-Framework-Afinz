---
tags: [operacao, comunicacoes, template-id, sfmc, governanca, gaas]
tipo: operacao
camada: operacao
atualizado: 2026-10-07
status: parcialmente-implementado
fonte: supabase-e-pacotes-package-manager
---

# Comunicações no GaaS alimentadas pelo pacote do SFMC

**Definição e propósito:** como o ZIP do Package Manager passa a ser fonte da aba **Comunicações** do GaaS (Fila de reconciliação, Templates sem peça, Auditoria, Performance do Conteúdo), ligando cada disparo ao `template_id` e dando aos templates o conteúdo real que hoje falta. Base do plano de implementação `docs/plans/2026-10-07-PROMPT-CODEX-comunicacoes-pacote-sfmc.md`.

## Contexto e conceitos

O modelo atual (snapshot 07/10/2026):

| Tabela | Papel | Estado |
|---|---|---|
| `communication_templates` | catálogo; `template_id` = `af_sub3` **com a mesma caixa**; `title` = **nome do template na Meta**; peça no bucket `crm-communications` | 156 ativos com peça, 57 rascunhos sem peça (46 WhatsApp) |
| `communication_slots` | lugar da comunicação: jornada + activity_name + canal, template atual, `metadata.moment_suggestion` | 115 slots, 113 `unmapped` |
| `activities.template_id` | qual template saiu em cada disparo | ~18% preenchido desde mai/26 |
| `appsflyer_template_daily` | clique/install por template | depende de `af_sub3` no link |

## As duas chaves que o pacote entrega

1. **`af_sub3` do link do botão** → `communication_templates.template_id` (determinístico).
2. **Nome do template Meta** (`requestBody.template.name`) → `communication_templates.title` (quando o link não tem `af_sub3`; confiança média).

Somadas ao **activity_name** da atividade da jornada, elas fecham o triângulo disparo ↔ template ↔ peça, que hoje é feito por parser de nome (`useReconciliation`, confiança forte/provável/fraca).

## Funcionamento e operação (fluxo-alvo)

1. Operador sobe o ZIP no GaaS (ou a skill `sfmc-jornadas-pacote` processa fora do app).
2. Extração por mensagem: jornada, versão, caminho, esperas, canal, activity_name, template Meta, texto, parâmetros, botões, rodapé, banner, link, `af_sub1/2/3`.
3. Reconciliação com status e evidência: **vínculo direto** (af_sub3), **vínculo por nome Meta** (confirmar), **template novo** (criar rascunho com conteúdo), **sem disparo registrado**, **lógica a perguntar**.
4. Revisão humana e aplicação: preencher `activities.template_id`, criar/atualizar slots com momento real, gravar conteúdo no `metadata` do template.
5. Prévia: WhatsApp e SMS renderizados a partir do texto (balão com nome/limite de exemplo, banner, botões); o print continua sendo a peça "oficial" quando existir.
6. Performance do Conteúdo passa a mostrar a prévia renderizada quando não há print.

## Regras, condições e limites

- Gravação sempre em duas etapas (proposta → aprovação). Nada é aplicado na leitura.
- `template_id` preserva a caixa (`src/utils/templateId.ts`). Constraint em produção conferida em 07/10/2026: `^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$`. A migration de fundação no repositório e a doc da skill `gaas-governanca-comunicacoes` ainda falam em maiúscula: estão desatualizadas.
- Opt-out (`..._resposta_optout_...`) é uma atividade compartilhada entre jornadas: não vira template de campanha.
- Inconsistência não é erro por padrão ([[Auditoria-Jornadas-SFMC-2026-10]]).

## Exemplo e validação

Pacote de carrinho 21D (07/10/2026), 12 atividades de mensagem: 6 com vínculo direto (templates ativos com print, `activities.template_id` vazio em 12 linhas), 4 só pelo nome Meta (links de set/26 sem `af_sub3`), 2 com template fora do catálogo (Copa, mai/26), 1 sem linha em `activities`, 0 slots existentes.

## Lacunas e pendências

- Onde guardar o conteúdo extraído: `metadata` do template (proposta) ou tabela própria de versões de conteúdo.
- Política para o mesmo activity_name reaproveitado em meses diferentes com template diferente.

## Relacionado

- [[communication_templates]] · [[communication_slots]] · [[Galeria-de-Templates]] · [[Performance-do-Conteudo-GaaS]] · [[AppsFlyer-Tracking-CRM]] · [[SFMC-Package-Manager-e-Pacotes]] · [[Auditoria-Jornadas-SFMC-2026-10]]

## Release de ingestão e prévias (07/10/2026)

Implementado e publicado na main (3b7ba68): botão Importar pacote SFMC em Cadastro e templates; leitura do ZIP no navegador em Worker; staging de mensagens e estrutura; revisão com simulação e aplicação; conteúdo versionado em tabela própria; prévias de WhatsApp/SMS na revisão e biblioteca, com fallback na Performance.

A escolha da versão atual é explícita. Vínculos históricos exigem janela confirmada, evidência e seleção dos IDs da mesma jornada e canal; outros meses/jornadas ficam para revisão. Templates já vinculados não são sobrescritos. É possível aprovar somente conteúdo, sem vincular disparos. Slots existentes e curadoria manual são preservados.

Wiki e reformulação da Fila/Auditoria foram adiadas por orientação do Pablo. E-mails dinâmicos não recebem copy inventada: o texto depende do briefing. A versão exportada não comprova a versão historicamente enviada.

Correção do snapshot anterior: em 07/10/2026 foram confirmados 904/3.661 vínculos desde maio (24,69%); carrinho tem 18 ocorrências, sendo 14 de campanha e 4 opt-outs, com 12 Activity Names de campanha distintos. O cruzamento exato achou 4 registros para as 8 mensagens com ID cadastrado; os demais contextos não autorizam 12 vínculos automáticos.

Guia técnico e operacional: [Ingestão de pacotes SFMC](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/blob/main/docs/reference/SFMC_PACKAGE_INGESTION.md). Migration: 20261007203329_sfmc_package_ingestion. Deploy validado pelo workflow 37683043470. Nenhum pacote real foi aplicado nesta release; a primeira aplicação exige revisão na tela.
