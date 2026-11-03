# Operação: SFMC, e-mails dinâmicos e abas do GaaS (operacao.md)

<!-- gerado por scripts/bundle_vault.py: não editar à mão -->

> Compilado do vault em 2026-11-03. 17 notas. Quando carregar: Tarefa de jornada, DE, template, ingestão ou comportamento de uma aba.
> Arquivo derivado: a fonte canônica é a nota no vault. Mapa completo em [INDEX.md](INDEX.md).

## 📌 Notas neste arquivo

- [AppsFlyer-Tracking-CRM](#appsflyer-tracking-crm)
- [Automacao-VDV-Pool-de-Ofertas](#automacao-vdv-pool-de-ofertas)
- [Comunicacoes-Pacote-SFMC-Catalogo](#comunicacoes-pacote-sfmc-catalogo)
- [Emails-Dinamicos-Plurix-V11](#emails-dinamicos-plurix-v11)
- [Emails-Dinamicos-Plurix](#emails-dinamicos-plurix)
- [Emails-Dinamicos-SFMC](#emails-dinamicos-sfmc)
- [Emails-Dinamicos-Vai-de-Visa](#emails-dinamicos-vai-de-visa)
- [Fabrica-de-Emails-GaaS](#fabrica-de-emails-gaas)
- [Ficha-de-Produto-Guia](#ficha-de-produto-guia)
- [Formatacao-WhatsApp-Variaveis-e-Espacamento](#formatacao-whatsapp-variaveis-e-espacamento)
- [Plurix-Recencia-Automation-e-Comunicacoes](#plurix-recencia-automation-e-comunicacoes)
- [SFMC-Package-Manager-e-Pacotes](#sfmc-package-manager-e-pacotes)
- [SFMC-Packs-Fluxos-Vinculos-e-Aprendizados](#sfmc-packs-fluxos-vinculos-e-aprendizados)
- [SFMC-Query-Studio-e-SQL](#sfmc-query-studio-e-sql)
- [SFMC-Salesforce-Marketing-Cloud](#sfmc-salesforce-marketing-cloud)
- [Servico-Emails-Dinamicos](#servico-emails-dinamicos)
- [WhatsApp-Respostas-de-Opt-out](#whatsapp-respostas-de-opt-out)

---

## AppsFlyer-Tracking-CRM

> **tags:** `operacao,appsflyer,atribuicao,tracking,governanca,template` | **tipo:** `operacao` | **camada:** `operacao` | **atualizado:** `2026-07-28` | **status:** `confirmado` | **fonte:** `planilha-governanca + validacao-mcp-appsflyer`

# AppsFlyer — Tracking e Atribuição (CRM + Mídia)

**Definição:** a camada de **atribuição unificada** — CRM ([SFMC](#sfmc-salesforce-marketing-cloud)/WhatsApp), [Mídia-Paga](core.md#mídia-paga) e parceiros lidos de forma padronizada no AppsFlyer, por origem, canal, campanha, público, **template** e etapa de conversão do funil de cartão.

> ⚠️ **Correção 2026-07-28.** A versão anterior desta nota mapeava os sub-params errado (dizia `af_ad_id + af_sub1 = ID do template` e `af_ad = Activity Name`). A **fonte de verdade** agora é a planilha oficial `GOVERNANÇA_LINKS_E_TEMPLATES` (aba `Base_Links_CRM`, 556 links), validada contra os dados vivos via MCP AppsFlyer. O mapa correto está abaixo.

## Decisão estrutural — mapa de parâmetros (corrigido)
`pid=crm` é a **Media Source única de governança**; o canal real vive em `af_channel`. Parâmetros de query são capturados no clique (nada precisa ser pré-cadastrado).

| Parâmetro | Valor / origem | Significado |
|---|---|---|
| `pid` | `crm` (fixo) | Media Source de governança |
| `af_channel` | whatsapp, sms, email, push (meta_ads/google_ads na mídia) | canal real de ativação |
| `c` | campanha CRM | [Campanha](core.md#campanha) |
| `af_sub1` | **[Segmentos](legado.md#segmentos)** — base_proprietaria, negados, abandonados… | público |
| `af_sub2` | **SEMANA/MOMENTO** — s1, s2… | posição na [Régua](core.md#régua) |
| `af_sub3` | **ID [Template](core.md#template)** — ex. `b2c_email_copa_bsp_S1D01` | **identidade de conteúdo reutilizável (chave da orquestração)** |
| `af_dp` | `sorocredapp://` | deep link (destino no app) |
| `af_ad` | *(vazio hoje)* | seria o [Taxonomia-Activity-Name](core.md#taxonomia-activity-name) — **NÃO está ligado**; só auditoria |

O `af_sub3` embute BU+canal+campanha+segmento+**semana/dia da régua** (`SxDy`). A aba `ID_Dicionario` da planilha traz a normalização de códigos (Negados→`ngd`, whatsapp→`wpp`) que resolve a duplicação de caixa `CRM`/`crm`.

Em Meta/Google, `c`/`af_adset`/`af_ad` usam **macros dinâmicas** (`{{campaign.name}}`…); no CRM o valor é **fixado por template**.

## Validação de cobertura (2026-07-28)
- ✅ Links carregam `af_sub3` na query: `…/9ODN/mtuc2zhn?c=b2c_topo_de_funil_copa&af_sub1=base_proprietaria&af_sub2=s1&af_sub3=b2c_email_copa_bsp_S1D01`.
- ✅ `discover_onelink` confirma `pid=crm` + `af_channel=email` + `af_dp=sorocredapp://` no link base (template `9ODN` = PROD_AFINZ_ONELINKS).
- ✅ Links governados estão **vivos e atribuindo**: `pid=crm` aparece como a media source `crm` (minúscula) no agregado, com as campanhas/segmentos batendo.
- 🟡 **Só links governados** (`LINK AJUSTADO?=True`) carregam `af_sub3`. Legados aparecem como `WhatsApp`/`CRM`(maiúsc)/`SMS`/`Cross_sale` **sem** template.
- 🔴 **Crux:** a API **agregada** só expõe `af_sub1`. `af_sub2`/`af_sub3` **só saem por raw data** → performance por template exige **Pull API / Data Locker** (ver [AppsFlyer-Ingestao-Template-Arquitetura](engenharia.md#appsflyer-ingestao-template-arquitetura)).

## Conversão em dois níveis
Clique é métrica intermediária. Funil: clique → install/abertura → `account_created` → `proposal_submitted` → `account_approved` → cartão emitido.
- **Conversão operacional:** `Account Created` (evento primário de otimização de mídia).
- **Conversão de negócio:** `Account Approved` / cartão emitido (qualidade da aquisição).

> ⚠️ **Estado real do app (2026-07-28):** hoje só o evento auto-coletado `af_content_view` chega ao AppsFlyer — os eventos de negócio são disparados como `af_content_view` + `af_param_1` (mapeamento condicional → StartTrial/registration no Facebook). Não há evento de **cartão emitido**. Ver [Funis-de-Onboarding-GaaS](evolucao.md#funis-de-onboarding-gaas).

## OneLink — 1 link base por canal
Domínio: **`cartao-afinz.onelink.me`**, template **`9ODN`** (PROD_AFINZ_ONELINKS). Parâmetros na query **sobrescrevem** os do link curto. 12 templates na conta; `Afinz_B2C` (I1Ur, 80 links) e `9ODN` (7) são os B2C de produção; `Campanhas Hirota` (tEcz) = parceiro com domínio próprio.

**Gerador:** planilha `Gerador_Links_AppsFlyer_CRM_Afinz_v2.xlsx` → hoje consolidada na `GOVERNANÇA_LINKS_E_TEMPLATES`.

## Papel do AppsFlyer no GaaS
Camada de atribuição que **liga o CRM à espinha [activities](dados.md#activities) via [template_id](core.md#template)** (não via Activity Name). É a fonte do rastro de app (clique→install→sessão) que hoje falta em cada disparo, e o **prior de conteúdo** do [Orquestrador](core.md#orquestrador). Arquitetura completa em [AppsFlyer-Ingestao-Template-Arquitetura](engenharia.md#appsflyer-ingestao-template-arquitetura).

## Pendências
> ⚠️ A validar: amostra Pull API provando `af_sub3` no raw (passo 0); geração dos links dos canais restantes; SDK+UDL e eventos SDK nomeados + `Card order completed` no app (time dev); tabela `attribution_links` como entidade.

## Relacionado
- [AppsFlyer-Ingestao-Template-Arquitetura](engenharia.md#appsflyer-ingestao-template-arquitetura) · [appsflyer_template_daily](dados.md#appsflyer_template_daily) · [Template](core.md#template) · [Taxonomia-Activity-Name](core.md#taxonomia-activity-name) · [Segmentos](legado.md#segmentos) · [Orquestrador](core.md#orquestrador) · [Funis-de-Onboarding-GaaS](evolucao.md#funis-de-onboarding-gaas) · [SFMC-Salesforce-Marketing-Cloud](#sfmc-salesforce-marketing-cloud) · [Mídia-Paga](core.md#mídia-paga)


---

## Automacao-VDV-Pool-de-Ofertas

> **tags:** `operacao, sfmc, automation-studio, vai-de-visa, runbook` | **tipo:** `operacao` | **camada:** `operacao` | **aliases:** `Automação Vai de Visa, POOL DE OFERTAS VISA - PREPARAÇÃO, POOL DE OFERTAS VISA - CONGELAR, VDV_POOL_OFERTAS` | **atualizado:** `2026-11-03` | **status:** `confirmado` | **fonte:** `automações criadas no Automation Studio em 03/11/2026; runbook VDV_Automacao_Preparacao.pdf (local), operador`

# Automações do Pool de Ofertas - Vai de Visa

**Definição e propósito:** como a base do [Vai de Visa](resultados-2.md#iniciativa-pool-de-ofertas-vai-de-visa) é montada no Automation Studio. São **duas automações** com riscos diferentes: a de preparação pode rodar quantas vezes for preciso; a de congelamento roda uma vez por safra, no dia do disparo.

> Status: PREPARAÇÃO montada em 03/11/2026 (4 passos) e em primeira execução; CONGELAR a montar. Runbook com anotações e queries em PDF local (`VDV_Automacao_Preparacao.pdf`).

## Visão geral

| Automação | Passos | Quando | Risco fora de hora |
|---|---|---|---|
| **POOL DE OFERTAS VISA – PREPARAÇÃO** | `Q_VDV_02_MAPA` → `Q_VDV_03_CRUZAMENTO` → `Q_VDV_04_APTOS` → `Q_VDV_06_FUNIL` | quantas vezes quiser | nenhum (Overwrite) |
| **POOL DE OFERTAS VISA – CONGELAR** | `Q_VDV_05_ENVIO` → `Q_VDV_06_FUNIL` | 1× no dia do disparo, após Test Send | congela grupo e célula |

A numeração dos nomes segue o fluxo completo (01 import, 02 MAPA, 03 cruzamento, 04 aptos, 05 envio, 06 funil), não a posição em cada automação. Um passo por etapa, porque cada query depende da anterior. Pasta `my automations/MCC`.

## Passos e anotações

| Atividade | Destino | Ação | Anotação (campo Anotações) |
|---|---|---|---|
| `IMP_VDV_01_MAPA_ENTRADA` *(ainda não incluído)* | [MAPA_MCC_ENTRADA](dados.md#de-mapa_mcc) | Overwrite | Importa o arquivo MAPA_MCC do SFTP como texto para MAPA_MCC_ENTRADA, sem converter valores. Overwrite a cada execução; aspas duplas marcadas. |
| `Q_VDV_02_MAPA` | [MAPA_MCC](dados.md#de-mapa_mcc) | Overwrite | Converte a MAPA_MCC_ENTRADA (texto) para MAPA_MCC: vírgula decimal vira ponto e datas dd/mm/aaaa viram Date. Carimba DT_CARGA no horário de Brasília. |
| `Q_VDV_03_CRUZAMENTO` | [DE-VDV_CRUZAMENTO](dados.md#de-vdv_cruzamento) | Overwrite | Monta a base apta (1 linha por CPF): NORMAL, compra em 30 dias, limite ≥ R$ 200, e-mail ok, sem atraso; soma compras por categoria da MAPA via NR_CONTA. |
| `Q_VDV_04_APTOS` | [DE-VDV_APTOS](dados.md#de-vdv_aptos) | Overwrite | Define grupo (MODA, SAUDE_BELEZA, FAMILIA_PRESENTES ou GENERICO) e célula do teste: controle fixo de 10% e A/B por safra. Grava em VDV_APTOS. |
| `Q_VDV_05_ENVIO` (CONGELAR) | [DE-VDV_ENVIO](dados.md#de-vdv_envio) | Atualizar | Congela na VDV_ENVIO os aptos da safra, inclusive o controle, só para CPFs novos. Roda uma vez no dia do disparo. |
| `Q_VDV_06_FUNIL` | [DE-VDV_FUNIL](dados.md#de-vdv_funil) | **Atualizar** | Registra as contagens de cada etapa e a proporção de células por grupo em VDV_FUNIL, com status OK/ALERTA. Acumula histórico a cada execução. |

As queries completas estão nas notas de cada DE. Horários gravados em Brasília (`DATEADD(HOUR, 3, GETDATE())`, servidor do MC em UTC-6).

## Import do arquivo da IN (pendente)

O passo `IMP_VDV_01_MAPA_ENTRADA` não foi incluído: a `MAPA_MCC_ENTRADA` foi carregada manualmente em 03/11/2026. **Enquanto o import não entrar na automação, uma atualização do arquivo no SFTP não é capturada.** Configuração prevista: arquivo `MAPA_MCC.csv`, delimitador `;`, aspas duplas marcadas, mapeamento por cabeçalho, Overwrite.

## Ordem de execução

1. Executar a PREPARAÇÃO (Executar uma vez; **sem ativar agendamento** por enquanto).
2. Conferir a [DE-VDV_FUNIL](dados.md#de-vdv_funil): nenhum ALERTA; tamanho de cada grupo; células perto de 45/45/10.
3. Montar e aprovar e-mail e Test Send.
4. Executar a CONGELAR no dia do disparo; jornada entra pela `VDV_ENVIO`.

## Relacionado

[Iniciativa-Pool-de-Ofertas-Vai-de-Visa](resultados-2.md#iniciativa-pool-de-ofertas-vai-de-visa) · [MOC-SFMC-DEs-e-Automations](dados.md#moc-sfmc-des-e-automations) · [SFMC-Query-Studio-e-SQL](#sfmc-query-studio-e-sql) · [Plurix-Recencia-Automation-e-Comunicacoes](#plurix-recencia-automation-e-comunicacoes) (padrão ENTRADA → CRUZAMENTO → APTOS → FUNIL)


---

## Comunicacoes-Pacote-SFMC-Catalogo

> **tags:** `operacao, comunicacoes, template-id, sfmc, governanca, gaas` | **tipo:** `operacao` | **camada:** `operacao` | **atualizado:** `2026-10-07` | **status:** `parcialmente-implementado` | **fonte:** `supabase-e-pacotes-package-manager`

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
- Inconsistência não é erro por padrão ([Auditoria-Jornadas-SFMC-2026-10](evolucao.md#auditoria-jornadas-sfmc-2026-10)).

## Exemplo e validação

Pacote de carrinho 21D (07/10/2026), 12 atividades de mensagem: 6 com vínculo direto (templates ativos com print, `activities.template_id` vazio em 12 linhas), 4 só pelo nome Meta (links de set/26 sem `af_sub3`), 2 com template fora do catálogo (Copa, mai/26), 1 sem linha em `activities`, 0 slots existentes.

## Lacunas e pendências

- Onde guardar o conteúdo extraído: `metadata` do template (proposta) ou tabela própria de versões de conteúdo.
- Política para o mesmo activity_name reaproveitado em meses diferentes com template diferente.

## Relacionado

- [communication_templates](dados.md#communication_templates) · [communication_slots](dados.md#communication_slots) · [Galeria-de-Templates](evolucao.md#galeria-de-templates) · [Performance-do-Conteudo-GaaS](evolucao.md#performance-do-conteudo-gaas) · [AppsFlyer-Tracking-CRM](#appsflyer-tracking-crm) · [SFMC-Package-Manager-e-Pacotes](#sfmc-package-manager-e-pacotes) · [Auditoria-Jornadas-SFMC-2026-10](evolucao.md#auditoria-jornadas-sfmc-2026-10)

## Release de ingestão e prévias (07/10/2026)

Implementado e publicado na main (3b7ba68): botão Importar pacote SFMC em Cadastro e templates; leitura do ZIP no navegador em Worker; staging de mensagens e estrutura; revisão com simulação e aplicação; conteúdo versionado em tabela própria; prévias de WhatsApp/SMS na revisão e biblioteca, com fallback na Performance.

A escolha da versão atual é explícita. Vínculos históricos exigem janela confirmada, evidência e seleção dos IDs da mesma jornada e canal; outros meses/jornadas ficam para revisão. Templates já vinculados não são sobrescritos. É possível aprovar somente conteúdo, sem vincular disparos. Slots existentes e curadoria manual são preservados.

Wiki e reformulação da Fila/Auditoria foram adiadas por orientação do Pablo. E-mails dinâmicos não recebem copy inventada: o texto depende do briefing. A versão exportada não comprova a versão historicamente enviada.

Correção do snapshot anterior: em 07/10/2026 foram confirmados 904/3.661 vínculos desde maio (24,69%); carrinho tem 18 ocorrências, sendo 14 de campanha e 4 opt-outs, com 12 Activity Names de campanha distintos. O cruzamento exato achou 4 registros para as 8 mensagens com ID cadastrado; os demais contextos não autorizam 12 vínculos automáticos.

Guia técnico e operacional: [Ingestão de pacotes SFMC](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/blob/main/docs/reference/SFMC_PACKAGE_INGESTION.md). Migration: 20261007203329_sfmc_package_ingestion. Deploy validado pelo workflow 37683043470. Nenhum pacote real foi aplicado nesta release; a primeira aplicação exige revisão na tela.


---

## Emails-Dinamicos-Plurix-V11

> **tags:** `operacao, sfmc, plurix, emails-dinamicos, ampscript, gaas, sequencia` | **tipo:** `operacao` | **camada:** `operacao` | **atualizado:** `2026-10-06` | **status:** `confirmado` | **fonte:** `codigo-gaas-e-teste-informado-pelo-operador`

# E-mails Dinâmicos Plurix V11

## Resultado de 06/10/2026

O usuário confirmou o recebimento correto de **E-mail 1 e E-mail 2 pelo mesmo motor V11**, em uma jornada de teste restrita ao próprio contato. Os prints de caixa de entrada mostram dois assuntos distintos; o print do e-mail mostra header por imagem, nome e faixa de limite pré-aprovado.

Essa evidência confirma o recorte testado: dois toques, uma rede e um contato. Não certifica todas as redes, clientes de e-mail, reentrada, concorrência, elegibilidade de produção ou modificações futuras. Nenhum disparo ao público foi realizado por esta tarefa.

## Contexto: o incidente do V9

O operador informou que uma régua V9 de dois disparos enviou o conteúdo E2 tanto no primeiro quanto no segundo. A investigação confirmou que o V9 da Fábrica e sua fonte persistida leem `[SEQUENCIA]`, enquanto os HTMLs históricos autoavançantes fazem lookup explícito da audiência atual. A causa histórica do incidente permanece não comprovada: um snapshot E1 sozinho não explica E2 no primeiro toque.

A prévia do GaaS não executa o bloco de preparação AMPscript. Ela injeta variáveis e pode renderizar mesmo com um lookup adulterado. Portanto, testes visuais não comprovam leitura das DEs ou progressão da jornada.

Foi considerada uma alternativa com dois assets de sequência fixa, mas **a decisão final do usuário foi manter um único motor que consulta o estado atual**. Os arquivos fixos são evidência de investigação, não o contrato operacional escolhido.

## Contrato V11 escolhido e testado

| Papel | Fonte | Dados usados |
|---|---|---|
| Público e dados cadastrais | `COMUNICACAO_PLX` | `CPF`, `EMAIL`, `FIRST_NAME`, `INVESTIDA`, `LIMITE_CRD` |
| Posição atual | `ESTADO_SEQUENCIA_CRM` | `CPF`, `SEQUENCIA` |
| Conteúdo | `TB_BRIEFING_CAMPANHA_AQUISICAO` | Produto × campanha × sequência e campos do e-mail |

O motor identifica a pessoa por CPF textual, usando Subscriber Key como fallback de identidade quando compatível. Preserva zeros à esquerda. Lê nome, rede e limite na audiência e **lê SEQUENCIA na DE de estado**, não na audiência nem no snapshot de entrada.

`INVESTIDA` é mapeada para `AMIGAO`, `BOA`, `AVENIDA`, `COMPRE MAIS`, `PARANA` e `SUPERPAO`, com variantes de acento aprovadas no código. A campanha técnica dessa V11 é `CRM`; as sequências aceitas são `E-mail 1` e `E-mail 2`.

A DE de estado criada possui CPF Texto/PK, OBS Texto, SEQUENCIA Texto e ATUALIZADO_EM Data. **Não há coluna CRM nem chave composta** nessa versão: uma posição por CPF. O contrato exige um único percurso/escritor controlando o estado de cada contato. Duas réguas simultâneas podem sobrescrever a mesma posição.

## Jornada de teste

Entrada filtrada para o contato interno → Update Contact com E1 → espera de QA → mesmo asset V11 → espera → Update Contact com E2 → espera → mesmo asset V11 → saída. O caminho restante sai sem envio. Nos prints, o filtro também está na entrada.

Update Contact grava SEQUENCIA e ATUALIZADO_EM com hora atual. A DE de estado precisa ser enviável, com CPF relacionado a Subscriber Key, para ser destino dessa atividade; isso não a transforma na audiência da jornada. Lookup isolado pode consultar uma DE não enviável. A DE de estado é separada da entrada, conforme a recomendação Salesforce.

ATUALIZADO_EM indica atualização do estado, não entrega do e-mail. Os intervalos curtos usados no QA não são cadência aprovada para produção nem garantia de sincronização. Não executar writes em DE no AMPscript de renderização.

## Conteúdo e comportamento atual

- Header exclusivamente por imagem HTTPS; sem header dinâmico nesta operação.
- Faixa quando `LIMITE_CRD` é numérico e positivo; formatação brasileira. Zero/vazio não inventa pré-aprovação.
- Pool explicitamente removido, independentemente de ofertas vigentes na DE do pool.
- Uma linha de audiência, uma de estado e uma de briefing por chave; ausência, duplicidade, sequência inválida ou vigência inválida geram erro do destinatário naquele envio.
- `RaiseError(..., true)` não remove automaticamente o contato dos próximos envios da jornada.
- **O texto da faixa ainda está fixo na V11 testada.** Externalizá-lo no briefing é a próxima proposta, não uma mudança já concluída.

O CSV exportado da DE SFMC fornecido em 06/10 tem 48 linhas e 36 colunas, sem linhas malformadas detectadas. As chaves AMIGAO + CRM + E1/E2 têm uma linha cada, vigentes de 17/08/2026 a 01/10/2028, com imagens e CTAs. Não foi necessário carregar novos briefings para esse teste. O assunto E1 tem um apóstrofo literal inicial, registrado como revisão editorial. Não deduzir o estado de outras DEs a partir do nome do arquivo exportado.

## Integração publicada na Fábrica

A V11 foi cadastrada em `dynamic_email_template_slots` como `builtin-plurix-v11`, com HTML completo, não placeholder. A fonte foi comparada com o arquivo local. **V9 permaneceu principal**; cadastrar V11 não muda automaticamente os vínculos de todos os briefings CRM.

Por isso, uma faixa visível na régua Topo de Funil/V10 pode não aparecer em Topo de Funil (CRM) quando o briefing ainda usa V9. A V11 tem faixa, como o recebimento do teste confirma. Na prévia V11, usar limite de teste numérico, por exemplo `12000`; o valor fictício legado `R$ 3.500` não ativa a faixa nesse contrato atual.

Publicações verificadas:

| Mudança | Evidência |
|---|---|
| Prévia V11 com aliases FIRST_NAME/LIMITE_CRD, nome e header imagem | [PR #49](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/49), merge `8fdbaf9` |
| Correção dos UUIDs de teste e gate TypeScript | [PR #50](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/50), merge `ebc01c4`; deploy `37535902926` aprovado |
| Orientações e cópia de assunto/pré-cabeçalho em Template-fonte | [PR #51](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/51), merge `484286a`; deploy `37537657639` aprovado |

Foram verificadas 12 combinações de rede × toque em simulação local com briefings GaaS, sem imagens quebradas nas capturas finais. A prévia publicada do E1 foi observada com imagem, nome e limite positivo. Isso permanece QA visual, não execução Salesforce.

O painel de assunto/pré-cabeçalho foi confirmado no bundle público; sua conferência visual final ficou pendente por falha da conexão de controle do navegador. Testes de derivação, TypeScript e build passaram. Não afirmar que o clique dos dois botões foi verificado em navegador nesse recorte.

## Configuração do Content Builder

Assunto:

```ampscript
%%=TreatAsContent(@Assunto)=%%
```

Pré-cabeçalho: bloco inicial completo da V11, seguido de:

```ampscript
%%=TreatAsContent(@PreCabecalho)=%%
```

O preparo usa uma guarda de inicialização comum ao pré-cabeçalho e ao corpo. Na Fábrica, o botão “Copiar pré-cabeçalho completo” deriva esse bloco da fonte atual do editor; não mantém uma cópia divergente. Não misturar pré-cabeçalho de outra versão com o corpo V11.

## Fontes e limites

Pacote local: `SFMC_PLURIX_IMPLANTACAO/v11/`. Investigação e matrizes: `SFMC_PLURIX_IMPLANTACAO/investigacao-2026-10-06/`. Não armazenar CPFs, telefones ou e-mails de destinatários nesta documentação.

[Personalização por dados atualizados](https://help.salesforce.com/s/articleView?id=sf.mc_jb_personalization_in_the_journey_builder_send_email_activity.htm&language=en_US&type=5), [Update Contact](https://help.salesforce.com/s/articleView?id=mktg.mc_jb_update_a_contact.htm&language=en_US&type=5), [ordem de operações AMPscript](https://developer.salesforce.com/docs/marketing/marketing-cloud-ampscript/guide/mc-ampscript-guide-language-basics-order-of-operations.html).

## Próxima evolução

[Fabrica-XLSX-TOPO-CRM-3](core.md#fabrica-xlsx-topo-crm-3) registra a especificação alinhada após o teste. Ela externaliza a mensagem de limite, remove o nome repetido no corpo dos novos toques e prepara a importação enriquecida por IA. O usuário pediu um prompt para Claude e depois a documentação; a implementação anterior de textos fixos no template foi interrompida e não promovida.

Relacionados: [Emails-Dinamicos-Plurix](#emails-dinamicos-plurix) · [Emails-Dinamicos-SFMC](#emails-dinamicos-sfmc) · [Fabrica-de-Emails-GaaS](#fabrica-de-emails-gaas) · [Servico-Emails-Dinamicos](#servico-emails-dinamicos).


---

## Emails-Dinamicos-Plurix

> **tags:** `operacao,sfmc,crm,emails-dinamicos,ampscript,plurix,topo-de-funil` | **tipo:** `operacao` | **camada:** `operacao` | **atualizado:** `2026-10-06` | **status:** `confirmado` | **fonte:** `html-legado-sfmc + de-crm-topo-funil + template-institucional`

# Emails Dinâmicos — Implementação Plurix (+amigo)

**Definição (1 frase precisa, para IA):** implementação do motor de e-mail dinâmico do SFMC para a BU Plurix, em que **um único e-mail no Content Builder serve as 6 bandeiras de supermercado** porque rodapé, deeplink e imagens de cada bandeira viajam como colunas do briefing em vez de estarem no HTML.

> Esta nota é **autocontida e reprodutível**. Um agente sem contexto prévio deve conseguir reconstruir a implementação inteira lendo apenas ela + [Bandeiras-Plurix](core.md#bandeiras-plurix) + [Emails-Dinamicos-SFMC](#emails-dinamicos-sfmc). Todo valor, nome de coluna e trecho de código aqui é literal.

---

## 1. Problema

Plurix vende o cartão `+amigo` através de 6 redes de supermercado (ver [Bandeiras-Plurix](core.md#bandeiras-plurix)). No modelo legado existia **um arquivo HTML por bandeira**, mantido à mão. Comparando os 6 arquivos reais, as diferenças eram: o rodapé, o deeplink do app, e em 2 casos uma imagem. Estrutura, cores, textos legais e layout eram byte-a-byte iguais.

Custo desse modelo: correção de bug precisa ser replicada 6 vezes; campanha nova precisa de 6 HTMLs novos.

**Solução:** transformar as diferenças em dado. `NM_PRODUTO_INTERNO` passa a carregar a bandeira, entrando na chave composta que já existia. O rodapé de cada bandeira ocupa `BANNER_3_CORPO`, coluna que estava vazia em 100% das linhas do institucional.

**Nenhuma coluna nova foi criada.** As 36 do institucional bastaram.

---

## 2. Arquitetura — 4 camadas

```
CAMADA 0 — DE de origem do CRM (ex.: CRM_PLURIX_202603_GC1)
  95.266 pessoas · 11 colunas · não vai para o SFMC nesse formato
        │  script de carga (filtra + renomeia)
        ▼
CAMADA 1 — TB_CAMPANHA_AQUISICAO ............ QUEM RECEBE
  73.078 linhas por sequência · 10 colunas · entrada da jornada
  1 linha = 1 pessoa em 1 sequência
        │  chave composta: PRODUTO + TP_CAMPANHA + SEQUENCIA
        ▼
CAMADA 2 — TB_BRIEFING_CAMPANHA_AQUISICAO ... O QUE É ENVIADO
  12 linhas · 36 colunas
  1 linha = 1 e-mail completo de 1 bandeira em 1 sequência
        │  LookupOrderedRows + validação de vigência
        ▼
CAMADA 3 — E-mail dinâmico (Content Builder)
  1 template · 42 variáveis AMPscript · 17 blocos condicionais
```

**A jornada não escolhe conteúdo.** Ela decide apenas quem entra. Quem escolhe o conteúdo é a chave composta. Essa separação é o que permite 2 jornadas (uma por sequência) servirem 6 bandeiras.

---

## 3. Camada 0 — DE de origem

Colunas: `CPF, PHONE, LOCALE, EMAIL, FIRST_NAME, INVESTIDA, SEGMENTO, SO_EMAIL, SO_PHONE, AMBOS, ID_LINHA`

Mapeamento para a Camada 1:

| Origem | Destino | Observação |
|---|---|---|
| `CPF` | `CPF` | único na origem (95.266 distintos, 0 repetidos) |
| `FIRST_NAME` | `PRI_NOME` | 100% preenchido |
| `EMAIL` | `EMAIL` | 86,2% preenchido |
| `PHONE` | `CELULAR` | não usado no e-mail |
| `LOCALE` | `LOCAL` | sempre `br` |
| `INVESTIDA` | `PRODUTO` | **a bandeira** — ver tabela de normalização em [Bandeiras-Plurix](core.md#bandeiras-plurix) |
| `SEGMENTO` | dentro de `CAMPANHA` | não entra na chave |
| `SO_EMAIL` / `SO_PHONE` / `AMBOS` | filtro de corte | não são gravados |
| `ID_LINHA` | descartado | controle do CRM |
| — | `LIMITE` | **vazio** — não existe no topo de funil |
| — | `TP_CAMPANHA` | constante `Topo de Funil` |
| — | `SEQUENCIA` | `E-mail 1` / `E-mail 2` |

### Regra de elegibilidade (crítica)

```
elegivel = EMAIL preenchido
           AND (AMBOS = "SIM" OR SO_EMAIL = "SIM")
           AND EMAIL casa com regex de e-mail válido
           AND INVESTIDA está no dicionário de bandeiras
```

| Etapa | Pessoas |
|---|---:|
| Base bruta | 95.266 |
| − sem e-mail | −13.130 |
| − com e-mail mas **sem flag de canal** | −9.058 |
| **Endereçáveis** | **73.078** |

⚠️ **Filtrar apenas por "EMAIL não vazio" dispara para 9.058 pessoas indevidamente.** As flags de canal são a fonte de verdade, não o preenchimento do campo.

### Três diferenças estruturais vs. o protótipo institucional

1. **`LIMITE` não existe.** Topo de funil não tem limite pré-aprovado. `@LimiteNovo` chega vazio no e-mail — nenhuma copy pode prometer valor.
2. **`CPF` é único nas duas pontas — origem e Camada 1.** `TB_CAMPANHA_AQUISICAO` tem **1 linha por pessoa**, com `CPF` como chave primária. A `SEQUENCIA` é **campo de estado mutável**: quem avança a régua é o `Update Contact` da jornada, atualizando a linha no lugar, não uma carga nova.

   > **Correção 2026-08-19.** A versão anterior desta nota afirmava que `CPF` não era único e que era preciso um arquivo de carga por sequência. Isso estava errado — a duplicidade observada veio de testes fechados iniciais com CPFs fabricados, não do modelo de produção. Consequência prática: **um único arquivo de audiência**, e a régua avança dentro da própria DE.
3. **`INVESTIDA` não tem equivalente no institucional**, onde `PRODUTO` é sempre `INSTITUCIONAL`.

---

## 4. Camada 1 — `TB_CAMPANHA_AQUISICAO` (10 colunas)

| # | Coluna | Valor Plurix | Papel |
|---|---|---|---|
| 1 | `CPF` | da origem | **chave primária**, 1 linha por pessoa → `@SubscriberKey` |
| 2 | `PRI_NOME` | da origem | → `@FirstName`, usado na copy |
| 3 | `EMAIL` | da origem | **relação de assinante** — o envio sai por aqui |
| 4 | `CELULAR` | da origem | reservado para SMS/WhatsApp |
| 5 | `LOCAL` | `br` | não usado |
| 6 | `LIMITE` | **vazio** | → `@LimiteNovo` |
| 7 | `PRODUTO` | `AMIGAO`, `BOA`, `AVENIDA`, `COMPRE MAIS`, `PARANA`, `SUPERPAO` | **chave 1/3** |
| 8 | `TP_CAMPANHA` | `Topo de Funil` | **chave 2/3** + filtro da jornada |
| 9 | `SEQUENCIA` | `E-mail 1` / `E-mail 2` | **chave 3/3** + filtro da jornada · **campo de estado**, avançado in-place pelo `Update Contact` |
| 10 | `CAMPANHA` | `afz_aqs_{slug}_reg_cart_email_{segmento}{n}_diario` | activity_name — ver [Taxonomia-Activity-Name](core.md#taxonomia-activity-name) |

A coluna `CAMPANHA` está **vazia em todos os exemplos do institucional**. Na implementação Plurix ela carrega o segmento normalizado (minúsculo, sem acento, sem espaço) + o número da sequência. Exemplo: `afz_aqs_amigao_reg_cart_email_prechurn1_diario`.

---

## 5. Camada 2 — `TB_BRIEFING_CAMPANHA_AQUISICAO` (36 colunas)

Ordem literal das colunas no CSV:

```
DT_INICIO, DT_FIM, UTM_CAMPANHA, TP_CAMPANHA, SEQUENCIA, ASSUNTO, PRE_CABECALHO, HEADER,
CARTAO_NM_COMERCIAL, NM_PRODUTO_INTERNO, TITULO_COPY_1_AZUL, COR_COPY_1,
TAMANHO_DA_FONTE_TITULO_COPY_1, TITULO_CTA_1, LINK_CTA_1, COPY_1_PRETO, COR_COPY_PRETO_1,
TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1, TITULO_COPY_2, COR_TITULO_COPY_2,
TAMANHO_DA_FONTE_TITULO_COPY_2, COPY_2_PRETO, COR_COPY_2, TAMANHO_DA_FONTE_COPY_2,
TITULO_CTA_2, LINK_CTA_2, BANNER_1_CORPO, LINK_BANNER_1_CORPO, BANNER_2_CORPO,
LINK_BANNER_2_CORPO, BANNER_3_CORPO, LINK_BANNER_3_CORPO, NOTA_LEGAL, COR_NOTA_LEGAL,
TAMANHO_DA_FONTE_NOTA_LEGAL, RODAPE
```

### Rastreamento completo: coluna → variável → onde age

| # | Coluna | Variável | Onde age no e-mail | Eixo |
|---|---|---|---|---|
| 1 | `DT_INICIO` | `@DtInicio` | validação de vigência | fixa |
| 2 | `DT_FIM` | `@DtFim` | validação de vigência | fixa |
| 3 | `UTM_CAMPANHA` | — | **nunca lida** ⚠ (ver §11) | bandeira × seq |
| 4 | `TP_CAMPANHA` | — | chave do lookup | fixa |
| 5 | `SEQUENCIA` | — | chave do lookup | sequência |
| 6 | `ASSUNTO` | `@Assunto` | `<title>` + campo Assunto do CB | sequência |
| 7 | `PRE_CABECALHO` | `@PreCabecalho` | div oculta + campo Pré-cabeçalho do CB | sequência |
| 8 | `HEADER` | `@Header` | imagem topo, 600px | bandeira |
| 9 | `CARTAO_NM_COMERCIAL` | `@CartaoNmComercial` | `alt` do header | fixa |
| 10 | `NM_PRODUTO_INTERNO` | — | chave do lookup | bandeira |
| 11 | `TITULO_COPY_1_AZUL` | `@TituloCopy1` | `<h1>` bloco 1 | sequência |
| 12 | `COR_COPY_1` | `@CorCopy1` | cor do `<h1>` | fixa |
| 13 | `TAMANHO_DA_FONTE_TITULO_COPY_1` | `@TamanhoFonteTituloCopy1` | tamanho do `<h1>` | fixa |
| 14 | `TITULO_CTA_1` | `@TituloCTA1` | rótulo do botão 1 | sequência |
| 15 | `LINK_CTA_1` | `@LinkCTA1` | `href` do botão 1 via `RedirectTo` | bandeira |
| 16 | `COPY_1_PRETO` | `@Copy1Preto` | parágrafo bloco 1 | sequência |
| 17 | `COR_COPY_PRETO_1` | `@CorCopyPreto1` | cor do parágrafo | fixa |
| 18 | `TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1` | `@TamanhoFonteCopyPreto1` | tamanho do parágrafo | fixa |
| 19 | `TITULO_COPY_2` | `@TituloCopy2` | `<h2>` faixa lavanda | sequência |
| 20 | `COR_TITULO_COPY_2` | `@CorTituloCopy2` | cor do `<h2>` | fixa |
| 21 | `TAMANHO_DA_FONTE_TITULO_COPY_2` | `@TamanhoFonteTituloCopy2` | tamanho do `<h2>` | fixa |
| 22 | `COPY_2_PRETO` | `@Copy2Preto` | parágrafo faixa lavanda | sequência |
| 23 | `COR_COPY_2` | `@CorCopy2` | cor | fixa |
| 24 | `TAMANHO_DA_FONTE_COPY_2` | `@TamanhoFonteCopy2` | tamanho | fixa |
| 25 | `TITULO_CTA_2` | `@TituloCTA2` | rótulo do botão 2 | sequência |
| 26 | `LINK_CTA_2` | `@LinkCTA2` | `href` do botão 2 | bandeira |
| 27 | `BANNER_1_CORPO` | `@Banner1Corpo` | imagem de benefícios, 552px | bandeira |
| 28 | `LINK_BANNER_1_CORPO` | `@LinkBanner1` | `href` da imagem de benefícios | bandeira |
| 29 | `BANNER_2_CORPO` | `@Banner2Corpo` | imagem "como solicitar", 552px | fixa |
| 30 | `LINK_BANNER_2_CORPO` | `@LinkBanner2` | `href` do "como solicitar" | bandeira |
| 31 | `BANNER_3_CORPO` | `@Banner3Corpo` | **rodapé da bandeira**, 600px | bandeira |
| 32 | `LINK_BANNER_3_CORPO` | `@LinkBanner3` | `href` do rodapé → site | bandeira |
| 33 | `NOTA_LEGAL` | `@NotaLegal` | texto legal | fixa |
| 34 | `COR_NOTA_LEGAL` | `@CorNotaLegal` | cor | fixa |
| 35 | `TAMANHO_DA_FONTE_NOTA_LEGAL` | `@TamanhoFonteNotaLegal` | tamanho | fixa |
| 36 | `RODAPE` | `@Rodape` | assinatura da bandeira | bandeira |

**32 das 36 colunas são lidas.** Das 4 restantes, 3 são a chave (filtram, não renderizam) e 1 é `UTM_CAMPANHA`, que é lacuna real.

---

## 6. Os quatro eixos de variação

Classificando as 36 colunas por **o que faz o valor mudar** — este é o núcleo conceitual do framework:

| Eixo | Nº | Colunas |
|---|---:|---|
| **Fixa** | 15 | cores, tamanhos, nota legal, vigência, `BANNER_2_CORPO`, `TP_CAMPANHA`, `CARTAO_NM_COMERCIAL` |
| **Varia por bandeira** | 11 | `HEADER`, `NM_PRODUTO_INTERNO`, `LINK_CTA_1/2`, `BANNER_1_CORPO`, `LINK_BANNER_1/2/3_CORPO`, `BANNER_3_CORPO`, `RODAPE` |
| **Varia por sequência** | 9 | `SEQUENCIA`, `ASSUNTO`, `PRE_CABECALHO`, `TITULO_COPY_1_AZUL`, `TITULO_CTA_1`, `COPY_1_PRETO`, `TITULO_COPY_2`, `COPY_2_PRETO`, `TITULO_CTA_2` |
| **Varia por bandeira × sequência** | 1 | `UTM_CAMPANHA` |

**Leitura útil: identidade e mensagem são independentes.** Trocar a copy de uma sequência mexe em 9 colunas e não toca em nenhum rodapé. Trocar o rodapé de uma bandeira mexe em 1 coluna e não toca em nenhuma copy.

**Custo escondido:** as 11 colunas de bandeira estão repetidas em cada sequência. Com 2 sequências, o deeplink de uma bandeira aparece em 8 lugares (2 linhas × 4 campos de link). Desnormalização consciente — ver §11.

---

## 7. O AMPscript (verbatim, reprodutível)

Bloco idêntico ao do e-mail institucional. **A única diferença entre os dois e-mails é o HTML depois de `]%%`.**

```ampscript
%%[
/* 1. Captura de Variáveis do Destinatário (TB_CAMPANHA_AQUISICAO) */
SET @SubscriberKey = [CPF]
SET @FirstName = [PRI_NOME]
SET @LimiteNovo = [LIMITE]
SET @Produto = [PRODUTO]
SET @Sequencia = [SEQUENCIA]
SET @TpCampanha = [TP_CAMPANHA]

/* 2. Busca na DE de Briefing com Filtro de Chave Composta e Vigência */
SET @Today = NOW()
SET @BriefingRows = LookupOrderedRows(
    "TB_BRIEFING_CAMPANHA_AQUISICAO",
    1,
    "DT_INICIO DESC",
    "NM_PRODUTO_INTERNO", @Produto,
    "SEQUENCIA", @Sequencia,
    "TP_CAMPANHA", @TpCampanha
)
SET @RowCount = RowCount(@BriefingRows)

IF @RowCount > 0 THEN
    SET @Row = Row(@BriefingRows, 1)

    /* Validação de Vigência da Campanha */
    SET @DtInicio = Field(@Row, "DT_INICIO")
    SET @DtFim = Field(@Row, "DT_FIM")

    IF @Today >= @DtInicio AND @Today <= @DtFim THEN

        SET @Assunto = Field(@Row, "ASSUNTO")
        SET @PreCabecalho = Field(@Row, "PRE_CABECALHO")
        SET @Header = Field(@Row, "HEADER")
        SET @CartaoNmComercial = Field(@Row, "CARTAO_NM_COMERCIAL")

        SET @TituloCopy1 = Field(@Row, "TITULO_COPY_1_AZUL")
        SET @CorCopy1 = Field(@Row, "COR_COPY_1")
        SET @TamanhoFonteTituloCopy1 = Field(@Row, "TAMANHO_DA_FONTE_TITULO_COPY_1")
        SET @Copy1Preto = Field(@Row, "COPY_1_PRETO")
        SET @CorCopyPreto1 = Field(@Row, "COR_COPY_PRETO_1")
        SET @TamanhoFonteCopyPreto1 = Field(@Row, "TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1")
        SET @TituloCTA1 = Field(@Row, "TITULO_CTA_1")
        SET @LinkCTA1 = Field(@Row, "LINK_CTA_1")

        SET @TituloCopy2 = Field(@Row, "TITULO_COPY_2")
        SET @CorTituloCopy2 = Field(@Row, "COR_TITULO_COPY_2")
        SET @TamanhoFonteTituloCopy2 = Field(@Row, "TAMANHO_DA_FONTE_TITULO_COPY_2")
        SET @Copy2Preto = Field(@Row, "COPY_2_PRETO")
        SET @CorCopy2 = Field(@Row, "COR_COPY_2")
        SET @TamanhoFonteCopy2 = Field(@Row, "TAMANHO_DA_FONTE_COPY_2")
        SET @TituloCTA2 = Field(@Row, "TITULO_CTA_2")
        SET @LinkCTA2 = Field(@Row, "LINK_CTA_2")

        SET @Banner1Corpo = Field(@Row, "BANNER_1_CORPO")
        SET @LinkBanner1 = Field(@Row, "LINK_BANNER_1_CORPO")
        SET @Banner2Corpo = Field(@Row, "BANNER_2_CORPO")
        SET @LinkBanner2 = Field(@Row, "LINK_BANNER_2_CORPO")
        SET @Banner3Corpo = Field(@Row, "BANNER_3_CORPO")
        SET @LinkBanner3 = Field(@Row, "LINK_BANNER_3_CORPO")

        SET @NotaLegal = Field(@Row, "NOTA_LEGAL")
        SET @CorNotaLegal = Field(@Row, "COR_NOTA_LEGAL")
        SET @TamanhoFonteNotaLegal = Field(@Row, "TAMANHO_DA_FONTE_NOTA_LEGAL")
        SET @Rodape = Field(@Row, "RODAPE")

    ELSE
        RaiseError("Campanha fora do prazo de vigência.", true)
    ENDIF
ELSE
    RaiseError("Dados de briefing da campanha não encontrados.", true)
ENDIF
]%%
```

### Duas funções de saída, papéis distintos

| Função | Uso | Por quê |
|---|---|---|
| `%%=v(@X)=%%` | cores, tamanhos, URLs de imagem | imprime o valor cru |
| `%%=TreatAsContent(@X)=%%` | todo campo de texto | **reprocessa o valor como AMPscript** — é o que faz `%%=v(@FirstName)=%%` gravado dentro de uma célula do CSV resolver no envio |
| `%%=RedirectTo(TreatAsContent(@X))=%%` | todo `href` | tracking de clique do SFMC + resolve AMPscript embutido na URL |

Sem `TreatAsContent`, a personalização escrita na planilha sairia literal para o cliente.

---

## 8. Estrutura do HTML (spec reprodutível)

Arquivo literal: `SFMC_PLURIX_IMPLANTACAO/03_email_dinamico_plurix.html`

Container: `<table>` 600px, centralizado, fundo branco. Fonte DM Sans com fallback Arial.
**17 blocos `%%[ IF NOT EMPTY(...) THEN ]%%`** — campo vazio no briefing faz o bloco sumir sem deixar buraco.

Ordem dos blocos — **idêntica à do institucional**, o que garante que a mesma linha de briefing renderize na mesma sequência nas duas BUs:

| Ordem | Bloco | Fundo | Conteúdo |
|---|---|---|---|
| 0 | preheader | — | `<div>` oculta com `@PreCabecalho` |
| 1 | logo +amigo | `#ffffff` | fixo, 190px, link `clubemaisamigo.com.br` |
| 2 | header | `#efefef` | `@Header`, 600px, cantos superiores 16px |
| 3 | **bloco 1** | `#efefef` | `@TituloCopy1` (h1) → `@Copy1Preto` (p) → CTA 1 → `@Banner1Corpo` (552px) |
| 4 | **bloco 2** | `#D1D4EB` | `@TituloCopy2` (h2) → `@Copy2Preto` → CTA 2 → `@Banner2Corpo` (552px); cantos inferiores 16px |
| 5 | **banner 3** | — | `@Banner3Corpo` = **rodapé da bandeira**, 600px, link `@LinkBanner3` |
| 6 | legal | `#EBEBEB` | `@NotaLegal` → `@Rodape` → bloco fixo Afinz + `%%profile_center_url%%` / `%%unsub_center_url%%` |
| 7 | CAN-SPAM | oculto | `%%Member_Busname%%`, `%%Member_Addr%%` etc. |

Botões CTA: tabela aninhada (bulletproof), `bgcolor="#2C3490"`, `border-radius: 12px`, padding `16px 36px`, texto branco bold 16px.

Banners usam padrão `%%[ IF ... THEN ]%% <a><img></a> %%[ ELSE ]%% <img> %%[ ENDIF ]%%` — nunca IF aninhado em volta da âncora.

### Campos do Content Builder

| Campo | Valor exato |
|---|---|
| **Assunto** | `%%=v(@Assunto)=%%` |
| **Pré-cabeçalho** | `%%=v(@PreCabecalho)=%%` |

⚠️ O pré-cabeçalho existe **nos dois lugares** (campo do CB + div oculta no corpo), replicando o institucional. Se o preview duplicar na caixa de entrada, remover a div e manter só o campo.

⚠️ `v()` **não** resolve AMPscript dentro do valor. Para assunto personalizado, o campo precisa virar `%%=TreatAsContent(@Assunto)=%%`.

---

## 9. Jornada

**2 jornadas no total — uma por sequência, não uma por bandeira.**

```
Journey Builder → Nova jornada → Extensão de dados como entrada
Nome:    JOR_TOPOFUNIL_PLURIX_SEQ1
Entrada: TB_CAMPANHA_AQUISICAO

Critérios de filtro:
  TP_CAMPANHA  é igual a  Topo de Funil
  SEQUENCIA    é igual a  E-mail 1
```

As 6 bandeiras passam pela mesma jornada e pelo mesmo e-mail. `Topo de Funil` é exclusivo de Plurix, então não há risco de contato institucional entrar.

`TB_CAMPANHA_AQUISICAO` precisa estar marcada como **"É enviável"** com `EMAIL` como relação de assinante.

---

## 10. Procedimento de reprodução

### Geração dos arquivos

**Briefing** (12 linhas = 6 bandeiras × 2 sequências): produto cartesiano de `BANDEIRAS × SEQUENCIAS`. Cada bandeira contribui com os campos de identidade (assets de [Bandeiras-Plurix](core.md#bandeiras-plurix)); cada sequência contribui com os campos de mensagem. **Registro histórico de agosto:** datas em `MM/DD/AAAA HH:MM:SS`, campos entre aspas duplas, `<br>` em vez de `\n` e UTF-8 com BOM. **Para novas exportações, usar o contrato homologado em setembro de [Emails-Dinamicos-SFMC](#emails-dinamicos-sfmc): UTF-8 sem BOM, vírgula, CRLF e qualificação mínima.**

**Audiência** (1 arquivo por sequência): filtra a DE de origem pela regra de elegibilidade (§3), renomeia colunas, deixa `LIMITE` vazio, monta `CAMPANHA` como `afz_aqs_{slug}_reg_cart_email_{segmento_slug}{n}_diario`.

Scripts: `SFMC_PLURIX_IMPLANTACAO/scripts/gen_briefing.py` e `gen_audiencia.py`.

### Ordem de execução no SFMC

1. Conferir que as duas DEs existem e que a de audiência é "enviável"
2. **Importar o briefing** (sempre antes da audiência — sem briefing, o `RaiseError` derruba o envio)
3. Importar a audiência **da sequência atual apenas**
4. Criar o e-mail em Content Builder → HTML livre
5. Preencher Assunto e Pré-cabeçalho
6. Criar a jornada com o filtro
7. **6 Test Sends, um por bandeira**
8. Ativar

### Configuração de import (as duas DEs)

| Campo | Valor |
|---|---|
| Codificação | UTF-8 |
| Delimitador | vírgula |
| Respeitar aspas duplas | ☑️ **marcar — desmarca sozinha a cada import** |
| Ação | Adicionar e atualizar |

### QA automatizável

Verificações que um agente deve rodar antes de subir:

```
1. chave composta única no briefing (NM_PRODUTO_INTERNO + TP_CAMPANHA + SEQUENCIA)
2. toda linha de audiência tem briefing correspondente (join pela chave)
3. DT_INICIO e DT_FIM casam com ^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$
4. nenhum campo contém \n ou \r cru
5. nenhum campo contém merge field legado %%TOKEN%% (regex: %%(?![=\[])([A-Za-z_]+)%%)
6. nenhum placeholder "PEGAR NA BASE" ou "CRIAR"
7. HEADER e BANNER_* começam com https://
8. BANNER_3_CORPO preenchido em todas as linhas (rodapé é obrigatório)
9. nº de rodapés distintos == nº de bandeiras
10. nº de deeplinks distintos == nº de bandeiras
11. template: contagem de %%[ igual a ]%%; IF/ENDIF balanceados no AMPscript e no HTML
12. template: nenhuma URL de bandeira específica chumbada no HTML
```

### Test Send — 7 pontos por bandeira

1. Assunto veio do briefing, não vazio
2. Primeiro nome resolveu
3. **Rodapé é o da bandeira certa**
4. **Deeplink é o da bandeira certa** (6 distintos)
5. Imagem de benefícios correta (Boa = FLV, Compre Mais = header/banner próprios)
6. Botões `#2C3490`, faixa `#D1D4EB`
7. "Gerenciar cadastro" e "Descadastrar" abrem

---

## 11. Modos de falha

| Sintoma | Causa | Correção |
|---|---|---|
| `Dados de briefing da campanha não encontrados.` | chave não bate entre as duas DEs | comparar `PRODUTO` × `NM_PRODUTO_INTERNO` caractere a caractere (maiúscula e acento contam) |
| `Campanha fora do prazo de vigência.` | hoje fora de `DT_INICIO`–`DT_FIM` | corrigir vigência no briefing |
| `Contagem de arquivos inválida: N` | checkbox de aspas duplas desmarcada | remarcar e reimportar |
| `Data inválida` | datas em DD/MM em vez de MM/DD | reescrever em MM/DD; **não abrir o CSV no Excel** |
| `arquivo inválido` | quebra de linha crua num campo | trocar `\n` por `<br>` |
| Disparo nunca sai, **sem erro nenhum** | nenhuma jornada ativa filtra aquele `TP_CAMPANHA` + `SEQUENCIA` | criar/ativar a jornada |
| Rodapé ou deeplink de outra bandeira | erro de preenchimento do briefing | só o Test Send pega — não há validação automática |

---

## 12. Log de decisões (com razão — não reverter sem motivo novo)

| Decisão | Alternativa descartada | Razão |
|---|---|---|
| E-mail dedicado Plurix, separado do institucional | e-mail único parametrizado | exigiria ~6 colunas novas de marca; com 2 templates o custo de duplicação ainda é baixo |
| Rodapé da bandeira em `BANNER_3_CORPO` | migrar para `TB_BRIEFING_JORNADAS` | essa DE **não é lida por este template nem por nada no repositório** — serve jornadas de onboarding/desbloqueio. Migrar exigiria máquina nova e mexeria numa DE compartilhada cujo consumidor não é inspecionável |
| `NM_PRODUTO_INTERNO` = nome puro (`AMIGAO`) | `PLURIX_AMIGAO` | alinha ao padrão existente `INSTITUCIONAL` / `BEM BARATO` / `ALVORADA` |
| `TP_CAMPANHA` = `Topo de Funil` | reaproveitar `Aquisição` | colidiria com o institucional no filtro da jornada |
| Segmento fora da chave, só no `activity_name` | chave de 4 campos | copy é idêntica por segmento; entrar na chave multiplicaria o briefing por 8 (12 → 96 linhas) |
| **1 arquivo de audiência, `SEQUENCIA` avançada in-place** | 1 arquivo por sequência | `CPF` é chave primária e a pessoa tem uma linha só. A régua anda pelo `Update Contact` da jornada, não por carga nova. Exige que o e-mail leia a `SEQUENCIA` ao vivo (`LookupRows`), porque o Journey Builder congela os dados de entrada |
| Imagemap removido do rodapé | manter os 2–5 links por rodapé | imagemap não funciona no app do Gmail; parte dos cliques já estava perdida |
| AMPscript copiado verbatim do institucional | reescrever/otimizar | garante que a mesma linha de briefing se comporte igual nas duas BUs |
| `CAMPANHA` e `UTM_CAMPANHA` como **auditoria não-bloqueante** | exigir preenchimento antes de exportar | nenhum dos dois afeta entrega ou renderização; travar disparo válido por etiqueta de tracking ausente custa mais do que disparar sem ela. Ver §15 |

---

## 13. Lacunas conhecidas

**`UTM_CAMPANHA` nunca chega ao destino.** Verificado por parsing do template: zero ocorrências de `utm_` no HTML, nos 5 `RedirectTo`. A coluna é preenchida com 12 valores distintos e simplesmente não é lida. Quem clica chega no OneLink sem marcação de campanha — a atribuição do lado do app fica cega. **O institucional tem a mesma lacuna.** Correção conhecida (concatenar `@UtmCampanha` no `RedirectTo`), mas exige validar concatenação de parâmetro em deeplink OneLink com clique real antes de entrar em produção.

**Identidade desnormalizada.** Rodapé e deeplink repetidos por linha de briefing. Aceitável em 12 linhas; degrada linearmente com o número de campanhas.

**Dois templates para manter.** Institucional e Plurix. Bug de HTML precisa ser corrigido nos dois.

---

## 14. Escala — modelo aplicável às outras BUs

A pergunta que determina quantos templates existem **não é "quantas BUs?"**, é **"quantas identidades visuais distintas o e-mail precisa servir?"**

| BU | Identidades | O que varia | Templates | Status |
|---|---|---|---|---|
| **B2C** | 1 (Afinz Visa) | nada | 1 | resolvido — nada precisa virar dado |
| **Plurix** | 1 marca (`+amigo`), 6 assinaturas | rodapé + deeplink | 1 | **resolvido** — virou coluna do briefing |
| **B2B2C** | N marcas de cartão | logo, cores, nome do cartão | 1 por parceiro | **em aberto** |

Em B2B2C os parceiros têm cartão de marca própria — `Bem Barato` → *Bem Mais Afinz Visa*, `Alvorada` → *Alvorada Afinz Visa*. O campo `FLAG_WHITELABEL` em `TB_BRIEFING_JORNADAS` existe exatamente para marcar isso. Não é só rodapé diferente.

**O que trava tecnicamente:** quatro valores estão chumbados no HTML do template Plurix — o logo `+amigo`, o azul `#2C3490`, o lavanda `#D1D4EB` e o cinza `#efefef`. Promover esses quatro a colunas do briefing é o que faria o mesmo motor servir B2B2C.

**Quando fazer:** o gatilho é a **terceira identidade** — quando o primeiro parceiro whitelabel de B2B2C precisar de e-mail dinâmico. Com 2 templates, duplicar uma correção é chato. Com 3, alguém corrige em 2 e esquece o terceiro.

**Hipótese não validada:** B2B2C tem apenas 115 disparos ([BUs](legado.md#bus), snapshot 2026-06-10). É possível que seja pequeno *porque* cada parceiro novo custa um template, não porque o mercado é pequeno. Se o custo marginal cair para uma linha de planilha, a pergunta "quantos parceiros a operação aguenta?" muda de resposta. Testar antes de assumir que B2B2C é nicho.

---

## 15. Próximos passos — rastreamento é auditoria, não pré-requisito

**Decisão de arquitetura (2026-08-18):** `CAMPANHA` (activity_name) e `UTM_CAMPANHA` formam uma **camada de auditoria**. Ela é desejável, mas **não é obrigatória** para o disparo — e não deve ser tratada como bloqueante em nenhuma validação futura.

### Por quê

Nenhum dos dois campos participa do funcionamento do e-mail:

| Campo | Entra na chave? | Renderiza? | Bloqueia o envio? |
|---|---|---|---|
| `CAMPANHA` (activity_name) | não | não | **não** |
| `UTM_CAMPANHA` | não | não (hoje nem é lida) | **não** |

Um briefing sem `UTM_CAMPANHA` e uma audiência sem `CAMPANHA` produzem exatamente o mesmo e-mail, entregue às mesmas pessoas. O que se perde é **leitura de resultado**, não entrega.

Separar as duas camadas evita o modo de falha mais caro que existe aqui: **travar um disparo válido por causa de uma etiqueta de tracking ausente.** Campanha que não sai custa mais do que campanha que sai sem `utm`.

### Como implementar essa distinção

Nas validações do briefing (§10) e no motor da Fábrica de e-mails do GaaS:

- Regras que garantem **entrega** → severidade `erro`, bloqueiam exportação.
  Chave duplicada, placeholder na chave, data inválida, URL não-HTTPS, sintaxe de personalização incompatível.
- Regras de **auditoria** → severidade `aviso`, nunca bloqueiam.
  `UTM_CAMPANHA` vazia, `CAMPANHA` vazia ou fora do padrão de [Taxonomia-Activity-Name](core.md#taxonomia-activity-name), segmento não reconhecido.

Hoje `UTM_CAMPANHA` já é validada como `erro` na regra de placeholder (`"CRIAR"`) no módulo `dynamic-email` do GaaS. **Rebaixar para `aviso`** é o ajuste concreto a fazer.

### O contraponto — o risco de rebaixar

Aviso que ninguém lê vira campo vazio permanente. Se `CAMPANHA` degradar em silêncio, a leitura de resultado por segmento — que é a única razão de o segmento existir fora da chave (§12) — para de funcionar sem que nada quebre.

Mitigação sugerida, na ordem em que vale fazer:

1. **Contador visível** na Fábrica: "N de 12 briefings sem UTM" no header, não escondido dentro da linha.
2. **Preencher por padrão** em vez de exigir: o `gen_briefing.py` já monta `UTM_CAMPANHA` automaticamente a partir de bandeira + sequência. Gerar sempre e deixar editável é melhor do que validar depois.
3. **Fechar a lacuna da UTM antes de rebaixar a regra** — hoje o campo é obrigatório e inútil, o pior dos dois mundos. Ver §13.

### Ordem recomendada dos próximos passos

1. Confirmar se a lacuna de `UTM_CAMPANHA` vale para o e-mail institucional também. Se valer, **nenhum e-mail dinâmico está sendo atribuído corretamente hoje** — isso muda como os relatórios de conversão devem ser lidos, e é maior que Plurix.
2. Corrigir o consumo da UTM no template (concatenar no `RedirectTo`), validando com clique real em deeplink OneLink antes de produção.
3. Só então rebaixar as regras de auditoria para `aviso` e adicionar o contador visível.

Fazer o passo 3 antes do 2 congela a lacuna: o campo deixa de ser cobrado e continua sem uso.

---

## Briefings CRM · Semana 1 (2026-08-19)

A caixa compartilhada da Fábrica foi substituída por dois briefings visuais adaptados dos HTMLs legados fornecidos pelo time:

- `TP_CAMPANHA = CRM`, sequências `E-mail 1` e `E-mail 2`.
- Ambos classificados em `Semana 1`, com vigência de `17/08/2026 00:00` a `01/10/2028 23:59`.
- Cada grupo visual gera seis linhas técnicas: `AMIGAO`, `BOA`, `AVENIDA`, `COMPRE MAIS`, `PARANA` e `SUPERPAO`.
- Deeplink, assinatura, site e UTM são específicos por bandeira. O E-mail 1 preserva as variações de benefício de Boa e Compre Mais.
- O conteúdo foi adaptado às 36 colunas existentes; image maps e CTAs gráficos extras foram traduzidos para CTA 1, CTA 2, banners e assinatura, sem alterar a DE.
- Estado auditado após a carga: 2 grupos, 12 linhas e 12 versões iniciais. A biblioteca ficou com 22 referências externas aprovadas.
- Quando o Supabase retorna uma caixa vazia, o frontend não repõe mais os exemplos locais antigos.

## Template PLURIX V10 · régua de topo reformulada (05/10/2026)

Evolução do V9 para a régua de topo nova (`TP_CAMPANHA = Topo de Funil`, convive com a régua `CRM` até a troca das jornadas). Três recursos que dependem de dados fora do briefing, sem coluna nova no briefing de 36 campos:

| Recurso | Fonte no SFMC | Regra |
|---|---|---|
| Header dinâmico | `TB_HEADER_VARIACOES` (código, título, subtítulo, imagem do cartão, cores) + `TB_REDE_ASSETS` (logo por rede) | `HEADER` com link = imagem (como antes); com código `HDR_...` = header em HTML. Compre Mais e Superpão sem logo |
| Faixa de limite | coluna `LIMITE` da audiência | Quem tem limite vê a faixa com o valor em todos os e-mails. Não é benefício escolhido por e-mail, é regra |
| Bloco 3, pool de ofertas | `DE_POOL_OFERTAS_PLURIX` | Oferta do dia da rede: produto em mais regiões, "a partir de" o menor preço, "cidades e regiões participantes". Sem oferta, o bloco some. Lookup nunca derruba o envio |

- **Fonte de verdade:** Fábrica do GaaS, aba "Header e ofertas" (variações, logos e cópia do pool para a prévia). A regra da oferta do dia existe em dois lugares que precisam andar juntos: o AMPscript do V10 e `domain/topoPlurixV10.ts`.
- **Pacote de subida:** `SFMC_PLURIX_IMPLANTACAO/v10/` (HTML do V10, CSVs das duas DEs e o LEIA-ME com o roteiro de Test Send).
- **Público:** só membros do Clube (ver [Topo-de-Funil](core.md#topo-de-funil)); parte da base pré-aprovada.
- **Pool hoje:** só o Amigão tem ofertas, todas de açougue, com validade de 1 dia (quinta a sábado) e preço por região. A audiência de topo não tem UF/cidade, por isso o tom publicitário.

## Relacionado

- [Servico-Emails-Dinamicos](#servico-emails-dinamicos) · [Briefing-e-Regua-de-Aquisicao](core.md#briefing-e-regua-de-aquisicao) · [Fontes-e-Proveniencia-Growth](core.md#fontes-e-proveniencia-growth)
- [Emails-Dinamicos-SFMC](#emails-dinamicos-sfmc) · [Bandeiras-Plurix](core.md#bandeiras-plurix) · [SFMC-Salesforce-Marketing-Cloud](#sfmc-salesforce-marketing-cloud) · [Taxonomia-Activity-Name](core.md#taxonomia-activity-name) · [Topo-de-Funil](core.md#topo-de-funil) · [BUs](legado.md#bus) · [Parceiros](legado.md#parceiros) · [Segmentos](legado.md#segmentos) · [Jornada](core.md#jornada)


## Evolução registrada em 06/10/2026

[Emails-Dinamicos-Plurix-V11](#emails-dinamicos-plurix-v11) consolida a investigação do V9, o contrato audiência COMUNICACAO_PLX + estado ESTADO_SEQUENCIA_CRM + briefing, o teste de dois toques confirmado pelo usuário e as melhorias publicadas na Fábrica. A V11 mantém imagem, limite e nenhum pool. Cadastrar a V11 não troca os vínculos dos briefings CRM antigos. O contrato em uso ainda tem 36 colunas e a copy da faixa permanece fixa na versão testada.

[Fabrica-XLSX-TOPO-CRM-3](core.md#fabrica-xlsx-topo-crm-3) registra a próxima especificação: mensagem de limite como coluna opcional do briefing, escrita por toque no XLSX/GaaS, rascunhos enriquecidos por IA e a nova régua de dois toques TOPO DE FUNIL (CRM) 3. Essa evolução foi alinhada e documentada em prompt, mas não implementada; não tratar a futura coluna 37 ou o importador como disponíveis.


---

## Emails-Dinamicos-SFMC

> **tags:** `operacao,sfmc,crm,emails-dinamicos,ampscript` | **tipo:** `operacao` | **camada:** `operacao` | **atualizado:** `2026-11-03` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Emails Dinâmicos — Motor de Content Builder (SFMC)

> **Rota de leitura (revisão editorial 02/10/2026):** [Servico-Emails-Dinamicos](#servico-emails-dinamicos) explica o fluxo completo; [Briefing-e-Regua-de-Aquisicao](core.md#briefing-e-regua-de-aquisicao) explica a intenção; esta nota detalha o contrato técnico. Revisar o texto não equivale a recertificar a operação SFMC.

**Definição (1 frase precisa, para IA):** motor de e-mail único no SFMC Content Builder que, via AMPscript, busca o conteúdo de um e-mail numa Data Extension de briefing a partir de 3 campos do destinatário (produto, tipo de campanha, sequência), eliminando a necessidade de criar um e-mail novo por campanha.

## Contexto

Existe **um único** e-mail dinâmico no Content Builder (ex.: `afz_car_vis_aqs_email_anc_joraquisicaotestedinamicoseq1_diario`). Ele não tem copy fixa — todo o conteúdo vem de `LookupOrderedRows` numa Data Extension de briefing, filtrado pelos 3 campos que o destinatário carrega consigo. Isso substitui "criar 1 e-mail por campanha" por "criar 1 linha por campanha" em duas planilhas.

Validado ponta a ponta em 2026-08-10 com o caso Plurix (parceiro `+amigo`/Amigão Supermercados): audiência de teste (Pablo, Pietra, Mariana) recebendo conteúdo Plurix via Test Send, reaproveitando o mesmo template que serve o Afinz Visa institucional.

## As 3 peças

**Grãos diferentes:** audiência = uma pessoa e seu estado no contrato documental corrigido; briefing = uma combinação produto × tipo de campanha × sequência; variante de assinatura = identidade contextual; template = código que consome os dados. Confirmar chaves e configuração na DE real antes de qualquer carga.

1. **DE de Audiência — `TB_CAMPANHA_AQUISICAO`** (quem recebe). Colunas: `CPF, PRI_NOME, EMAIL, CELULAR, LOCAL, LIMITE, PRODUTO, TP_CAMPANHA, SEQUENCIA, CAMPANHA`. **1 linha por pessoa**, com `CPF` como chave primária. `SEQUENCIA` é campo de estado: a régua avança atualizando a linha no lugar (`Update Contact` na jornada), não carregando linha nova.

   > **Correção 2026-08-19.** A versão original desta nota dizia que `CPF` **não** era único e que a pessoa aparecia várias vezes. Estava errado — a duplicidade observada veio de testes fechados iniciais com CPFs fabricados, não do modelo de produção. A confusão gerou um desenho de carga por sequência que foi descartado. Ver [Emails-Dinamicos-Plurix](#emails-dinamicos-plurix) §12.
2. **DE de Briefing — `TB_BRIEFING_CAMPANHA_AQUISICAO`** (o que é enviado). 36 colunas: datas de vigência, assunto, pré-cabeçalho, header, cartão, produto interno, 2 blocos de copy+CTA, até 3 banners, nota legal, rodapé. Cada linha = 1 e-mail completo.
3. **E-mail dinâmico** (Content Builder, AMPscript) — motor que casa as duas DEs.

## A chave composta (regra de ouro)

O lookup no e-mail é:
```
LookupOrderedRows("TB_BRIEFING_CAMPANHA_AQUISICAO", 1, "DT_INICIO DESC",
  "NM_PRODUTO_INTERNO", @Produto, "SEQUENCIA", @Sequencia, "TP_CAMPANHA", @TpCampanha)
```
`PRODUTO` (audiência) = `NM_PRODUTO_INTERNO` (briefing) · `TP_CAMPANHA` = `TP_CAMPANHA` · `SEQUENCIA` = `SEQUENCIA` — precisam ser **idênticos caractere a caractere** (maiúscula/acento) nos dois arquivos. Sem isso, o e-mail dá `RaiseError("Dados de briefing da campanha não encontrados.")`. Além da chave, a data de hoje precisa estar entre `DT_INICIO` e `DT_FIM` da linha do briefing, senão `RaiseError("Campanha fora do prazo de vigência.")`.

`TB_BRIEFING_JORNADAS` (produto × banners de onboarding/desbloqueio) é uma **camada separada**, não usada por este template — não confundir. Confirmado por varredura do repositório em 2026-08-18: a DE aparece **apenas em prosa** no vault, zero referências em código (`.ts`, `.tsx`, `.html`), e o e-mail de aquisição faz **um único** `LookupOrderedRows`. Ela é consumida por outros e-mails que vivem só no Content Builder.

## Institucional B2C — dívida arquitetural resolvida (2026-09-01)

**Constatado no Supabase** (`dynamic_email_briefings` + `dynamic_email_template_slots`): os dois modelos convivem hoje em produção, em extremos opostos.

| | Plurix | Institucional B2C |
|---|---:|---:|
| Campos preenchidos no briefing (contagem histórica a reconciliar; não é schema de exportação) | **38** | **10** |
| Templates no Content Builder | **1** (`builtin-plurix-acquisition-ux-v2`) | **8** (`b2c-classic-vibe-email-01..08-control`) |
| O que varia por dado | copies, cores, banners, CTAs, rodapé | só assunto, pré-cabeçalho, header, vigência |
| Marca | 6 assinaturas sobre 1 layout | layout próprio por e-mail |

O diagnóstico de 2026-08-26 encontrou oito templates dedicados. A migração concluída em 2026-09-01 consolidou os oito e-mails Classic + Vibe em **um template dinâmico canônico**, com as linhas de briefing carregando o conteúdo variável. Os oito slots legados foram arquivados para auditoria, não apagados.

O contrato de 36 campos e a chave composta foram preservados. A migração foi validada no GaaS por testes automatizados e build; os oito e-mails permanecem dependentes de Test Send no SFMC para receber certificação operacional.

### O contrato mínimo (achado do mesmo cruzamento)

Cruzando os campos usados pelas duas BUs, **exatamente 10 são comuns** — e formam o núcleo obrigatório de qualquer briefing dinâmico:

| Função | Campos |
|---|---|
| Chave composta | `NM_PRODUTO_INTERNO` · `TP_CAMPANHA` · `SEQUENCIA` |
| Vigência | `DT_INICIO` · `DT_FIM` |
| Envelope | `ASSUNTO` · `PRE_CABECALHO` |
| Identidade | `HEADER` · `CARTAO_NM_COMERCIAL` |
| Rastreamento | `UTM_CAMPANHA` |

No contrato de **36 colunas**, os outros **26** são campos de corpo/apresentação: presentes conforme o template delegue conteúdo ao dado. A contagem histórica de 38 acima não autoriza acrescentar duas colunas à exportação; sua origem precisa ser reconciliada. Quantos campos a frente usa define onde ela está no espectro "template dedicado ↔ template único".

Esse é o eixo real de modularização — não a frente de negócio.

## Modelo de escala — quantos templates a operação precisa

A pergunta que determina o número de templates **não é "quantas BUs?"**, é **"quantas identidades visuais distintas o e-mail precisa servir?"**

| BU | Identidades | O que varia entre elas | Templates | Status |
|---|---|---|---|---|
| **B2C** | 1 — Afinz Visa | nada | 1 | resolvido: nada precisa virar dado |
| **Plurix** | 1 marca (`+amigo`), 6 assinaturas de varejo | rodapé + deeplink | 1 | **resolvido** — viraram coluna do briefing (ver [Emails-Dinamicos-Plurix](#emails-dinamicos-plurix)) |
| **B2B2C** | N marcas de cartão próprias | logo, cores, nome do cartão | 1 por parceiro | **em aberto** |

Plurix parecia o caso difícil e não era: as 6 bandeiras vendem o mesmo cartão, com o mesmo logo e as mesmas cores. Só o rodapé e o deeplink mudam — e ambos couberam em colunas que já existiam.

B2B2C é o caso ainda não resolvido. Lá os parceiros têm cartão de marca própria (`Bem Barato` → *Bem Mais Afinz Visa*); o campo `FLAG_WHITELABEL` em `TB_BRIEFING_JORNADAS` existe para marcar exatamente isso.

**O que trava tecnicamente:** no template Plurix, quatro valores estão chumbados no HTML — logo, `#2C3490`, `#D1D4EB` e `#efefef`. Promover esses quatro a colunas do briefing faria o mesmo motor servir B2B2C. **Gatilho para fazer:** a terceira identidade, não antes.

## Sintaxe de personalização

Dentro dos campos de texto do briefing (Copy 1, Copy 2 etc.), a personalização é `%%=v(@FirstName)=%%`, nunca `%%FIRST_NAME%%` (essa é sintaxe de Triggered Send/Email Studio, não funciona aqui — envia o texto literal pro cliente). `TreatAsContent()` reprocessa o campo, então o AMPscript embutido no texto do CSV é resolvido na hora da renderização. **Achado real:** a planilha-modelo da analista (matriz de governança) tinha essa sintaxe errada até 2026-08-10 — corrigir na fonte, não só linha a linha.

## Pitfalls confirmados (custaram ~6 rodadas de import até descobrir)

> Regras gerais de importação (data, aspas, separador, Overwrite) valem para qualquer DE e têm lugar canônico em [SFMC-Salesforce-Marketing-Cloud](#sfmc-salesforce-marketing-cloud). Conteúdo que varia **por CPF** (ofertas): ver [Emails-Dinamicos-Vai-de-Visa](#emails-dinamicos-vai-de-visa).

- **Import do wizard não autodetecta o formato de data.** A tela "Formato de data" (dropdown "English (United States)") interpreta como **MM/DD/AAAA**, não DD/MM. Datas com dia >12 (ex. `31/08/2026`) falham com "Data inválida"; datas com dia ≤12 passam silenciosamente com o dia/mês trocados (risco de vigência errada sem erro nenhum). **Correção:** escrever as datas do CSV já em MM/DD/AAAA (ex. 31 de agosto = `08/31/2026`), ou selecionar "Outro" no dropdown e digitar `dd/MM/yyyy HH:mm:ss` explicitamente.
- **Checkbox "Respeitar as aspas duplas como qualificadores de texto"** vem desmarcada por padrão a cada nova importação (não é lembrada). Sem ela, qualquer vírgula dentro de um campo (`NOTA_LEGAL`, `COPY_2_PRETO` etc.) quebra a contagem de colunas e invalida a linha inteira.
- **Quebra de linha crua (`\n`) dentro de um campo quoted** é válida em CSV (RFC4180) mas o importador do SFMC conta linha física, não lógica — vira "arquivo inválido". Usar `<br>` em vez de `\n` nos campos de copy (o template já tem `white-space: pre-line` no CSS de Copy1/Copy2 Preto, então `<br>` funciona igual).
- **Placeholders da analista** (`"PEGAR NA BASE"` em `NM_PRODUTO_INTERNO`, `"CRIAR"` em `UTM_CAMPANHA`) precisam virar valor real antes de subir — não bloqueiam o CSV tecnicamente, mas quebram o lookup silenciosamente se ninguém resolver.
- **A Jornada tem filtro de entrada próprio**, independente da chave do briefing. Ex.: `JOR_AQUISICAO_TESTE_DINAMICO3` só aceita `TP_CAMPANHA = Repescagem AND SEQUENCIA = E-mail 1` — uma campanha nova com `TP_CAMPANHA = Aquisição` pode estar 100% correta nas duas DEs e ainda assim nunca disparar, porque nenhuma jornada ativa a filtra. Confirmar isso **antes** de considerar uma campanha "pronta".

## Como testar uma campanha nova

1. **Test Send no Content Builder** (`Visualizar e testar` → Test Send, escolhendo o CPF na DE de audiência) — valida renderização sem depender de jornada nenhuma. Caminho mais rápido.
2. **Via Jornada** (fluxo real automatizado) — exige confirmar/criar uma jornada com filtro de entrada batendo `TP_CAMPANHA` + `SEQUENCIA` da campanha nova.

## Relacionado
- [Emails-Dinamicos-Plurix](#emails-dinamicos-plurix) (implementação completa da BU Plurix, autocontida) · [Bandeiras-Plurix](core.md#bandeiras-plurix) · [SFMC-Salesforce-Marketing-Cloud](#sfmc-salesforce-marketing-cloud) · [Taxonomia-Activity-Name](core.md#taxonomia-activity-name) · [Ingestão-de-Dados](legado.md#ingestão-de-dados) · [Modal-de-Disparo](legado.md#modal-de-disparo) · [Repescagem](core.md#repescagem) · [BU Plurix](legado.md#bus)

## Workspace editorial no GaaS (2026-08-11)

O menu **Comunicações → Fábrica de E-mails** funciona como uma área editorial para preparar e revisar as linhas de `TB_BRIEFING_CAMPANHA_AQUISICAO` antes da importação no SFMC. No menu de Comunicação, **Performance do Conteúdo** usa um ícone analítico e a Fábrica preserva o ícone de e-mail, evitando ambiguidade visual entre as duas funções.

- **Caixa de briefings ampliada:** apresenta parceiro/produto, campanha, sequência, assunto, pré-cabeçalho e estado de validação com busca e filtros, em uma organização semelhante a uma caixa de entrada.
- **Header operacional único:** usa o mesmo verde-petróleo de Cadastro e templates e concentra nome da área, quantidade de briefings, ajustes bloqueantes e revisões sugeridas. As abas **Campanhas** e **Template-fonte** ficam acima das ações de importar, duplicar, criar, excluir e exportar.
- **Workspace em três painéis:** caixa de briefings, editor e prévia permanecem visíveis lado a lado. A caixa tem largura estável; editor e prévia dividem o espaço restante.
- **Divisor ajustável e persistente:** o usuário pode arrastar o separador entre editor e prévia, ajustar com as setas do teclado e restaurar a proporção padrão com duplo clique. A largura escolhida fica salva localmente no navegador daquele usuário.
- **Edição na ordem do e-mail:** campanha e vigência → assunto e pré-cabeçalho → header → primeiro bloco com CTA e banner → segundo bloco com CTA e banner → banner final → nota legal e rodapé.
- **Seções minimizáveis:** cada grupo vindo do CSV pode ser recolhido individualmente. Os antigos contadores numéricos de preenchimento por seção foram removidos por não representarem uma decisão útil para a analista.
- **Rótulos orientados à analista:** a interface usa nomes legíveis e mantém o nome físico da coluna do CSV como referência secundária para governança.
- **Imagens por URL pública:** header e banners aceitam link HTTPS público, exibem prévia, dimensões e validação de carregamento; quando aplicável, o destino clicável permanece separado.
- **Duplicação segura:** a cópia preserva o conteúdo, cria um novo identificador local, remove a confirmação manual da jornada e exige revisão de sequência/vigência antes da exportação.
- **Exclusão governada:** a remoção exige confirmação explícita, identifica o briefing afetado e informa que ele não aparecerá no próximo CSV exportado.
- **Prévia com contexto real:** o terceiro painel exibe assunto, pré-cabeçalho, remetente definido no SFMC, destinatário de teste, parceiro, campanha, sequência e a renderização completa. O botão **Ampliar** fica dentro do cabeçalho da própria prévia e abre um modal central sem retirar o painel do workspace. A renderização no navegador é uma simulação; o **Test Send do SFMC continua sendo a certificação final**.

O rascunho continua sendo preservado localmente. A partir da V2 (2026-08-18), o botão **Salvar briefing** também persiste metadados editoriais e versões no Supabase para uso compartilhado e auditoria; não altera a DE nem o motor do SFMC.

## Fábrica de E-mails V2 (2026-08-18)

- A caixa é organizada por **parceiro → segmento → semana editorial → e-mail → assinaturas**. Parceiro e segmento usam a taxonomia observada em `activities`; a semana é um organizador editorial controlado e não deve ser confundida com `Safra`.
- `Activity Name` é opcional, porém destacado no salvamento. Salvar sem ele exige confirmação explícita e essa decisão entra no histórico.
- Para a Fábrica, `activities.BU = Plurix` governa **Plurix** como parceiro sem alterar o dado bruto `activities.Parceiro = N/A`. `Institucional B2C` é uma opção editorial distinta; `N/A` nunca é convertido automaticamente em Proprietária.
- A **Biblioteca de ativos** armazena somente URL pública do Salesforce Content Builder, link clicável opcional e metadados leves. Não há upload de imagem nem uso do Supabase Storage.
- Plurix é a identidade principal. Cada e-mail editorial governa seis assinaturas (Amigão, Boa, Avenida, Compre Mais, Paraná e Superpão) e exporta uma linha técnica por bandeira para preservar a chave composta atual. Assim, os dois e-mails existentes aparecem como **2 e-mails editoriais e 12 variantes técnicas**.
- Conteúdo comum é propagado entre assinaturas; imagens, rodapé, deeplink, UTM e produto interno podem variar por bandeira. Não existem e-mails editoriais separados por bandeira.
- A nota legal usa texto compartilhado por padrão. Um override avançado permite edição por linha/bandeira e registra essa exceção na auditoria.
- O CSV exportado continua contendo exatamente as 36 colunas de `TB_BRIEFING_CAMPANHA_AQUISICAO`; metadados, versões e auditoria não entram na DE.

### Biblioteca visual e carga histórica (2026-08-19)

- O editor abre uma galeria visual no contexto de cada campo de imagem, substituindo a seleção textual por miniaturas pesquisáveis.
- A aba **Recomendados** prioriza posição do e-mail e produto/bandeira do briefing; **Todos** mantém o acervo completo disponível.
- Carga inicial governada: 17 URLs aprovadas encontradas nos CSVs Plurix, HTMLs legados e render institucional — 3 headers, 4 banners principais, 2 banners complementares, 6 assinaturas e 2 logos de marca.
- Todos os 17 links foram validados com resposta HTTP 200 antes do cadastro e receberam as tags `historico` e `aprovado`.
- A URL externa continua sendo a identidade de deduplicação. Selecionar um ativo também aplica seu link clicável quando esse destino está governado no acervo.

### Fluxo operacional do editor e biblioteca (2026-08-18)

- A aba principal do header passa a se chamar **E-mails**. O botão **Salvar briefing** fica no encerramento do formulário, depois das informações legais, para representar a conclusão da revisão editorial.
- Em cada posição visual, **Selecionar imagem salva** é a ação primária. A URL pública deixa de ser editada diretamente dentro do briefing; **Subir novo ativo** leva à Biblioteca de ativos, onde a referência do Salesforce é cadastrada.
- A Biblioteca de ativos possui barra persistente com busca textual e filtros por posição, parceiro e subgrupo, além de contagem do recorte e ação para limpar filtros.
- Ao lado de **Ampliar**, **Abrir em nova aba** entrega a simulação HTML completa e **Salvar em PDF** usa a impressão nativa do navegador. Isso evita o corte e as restrições de CORS da conversão para JPEG. O Test Send do SFMC continua sendo a certificação de renderização e personalização.
- O seletor de `Activity Name` oferece o histórico de `activities` e uma ação controlada para cadastrar um novo identificador no briefing. Falha de consulta à taxonomia é exibida com tentativa de recarga; o placeholder dos seletores obrigatórios não pode apagar valores existentes.

### Árvore editorial e ciclo de vida das assinaturas (2026-08-19)

- A caixa de briefings é uma árvore expansível e persistente: **parceiro → segmento → semana → e-mail → assinatura**. O e-mail informa a proporção de assinaturas ativas e oferece acesso contextual ao gerenciador.
- O menu contextual da semana permite **criar um e-mail já dentro da semana**, **duplicar a semana completa** para a próxima semana disponível — incluindo todos os e-mails e suas variações de assinatura — ou arquivar o conjunto mediante confirmação. No e-mail, o mesmo menu concentra **Gerenciar assinaturas**, **Duplicar e-mail** e **Arquivar e-mail**.
- **Novo e-mail editorial** solicita segmento, semana, sequência, origem do conteúdo e assinaturas participantes. Assinaturas globalmente inativas não aparecem na criação.
- O **Gerenciador de assinaturas** diferencia: adicionar ao e-mail, desativar somente naquele e-mail, restaurar uma variação e desativar/reativar globalmente para Plurix.
- Desativação não apaga histórico. Variação já salva recebe `status = archived`, sai do CSV e fica disponível no filtro **Arquivadas** em modo somente leitura. Somente rascunho nunca salvo pode ser removido fisicamente da sessão.
- A governança global fica em `dynamic_email_signature_settings`, com parceiro, chave, nome, status e vigência. Desativar uma assinatura impede sua criação futura e arquiva as variações ativas existentes, sem alterar a DE do SFMC.

### Slots de Template-fonte e testes AMPscript (atualizado em 2026-09-01)

- A área **Template-fonte** funciona como uma biblioteca compartilhada de fontes do Content Builder. Cada slot possui identificador, nome, HTML/AMPscript, versão e data da última alteração; os slots ficam em `dynamic_email_template_slots` no Supabase e são iguais para os usuários autenticados.
- O template único legado em `gaas-dynamic-email-template-v1` é migrado automaticamente para o primeiro slot, chamado **Template principal**, preservando o código já usado pelo operador.
- O operador pode **Novo slot** para começar a partir do template-base, **Subir HTML** para carregar `.html`, `.htm` ou `.txt`, renomear, editar, salvar, duplicar ou apagar slots. Pelo menos um slot deve permanecer disponível.
- **Definir como principal para visualização** salva o conteúdo atual do slot e o torna a única fonte usada pelo renderizador AMPscript-lite na prévia da Fábrica. Salvar um slot secundário não muda a visualização até essa promoção explícita.
- Se o slot principal for apagado após confirmação, um slot remanescente deve assumir a visualização. A exclusão afeta o catálogo compartilhado do GaaS, mas não exclui conteúdo do Content Builder.
- A decisão operacional destravada é testar variações de HTML/AMPscript no GaaS antes de copiar o código ao SFMC. O preview continua sendo uma simulação local: construções não suportadas falham visivelmente e o **Test Send do SFMC** permanece a certificação final.
- A prévia dos briefings também possui um seletor direto de template. Ele alterna o slot principal renderizado e oferece atalho para abrir a edição integral de seu HTML + AMPscript, sem exigir que o operador procure novamente a versão na biblioteca.

### Template Plurix aquisição UX v2 (2026-08-19)

- A Fábrica distribui um slot editável chamado **Plurix aquisição UX v2**. A migração acrescenta a versão aos slots existentes uma única vez e preserva o template principal escolhido pelo operador; nenhuma versão anterior é sobrescrita.
- O topo passa a apresentar a logo comum do produto `+amigo`, antes do hero. **Plurix** continua sendo o parceiro operacional e o banner final continua sendo a assinatura variável da bandeira; logo de produto e assinatura de varejo não são confundidas.
- A direção visual do slot 2 usa o azul-violeta `#2C3490` do cartão `+amigo` nos CTAs, substituindo o ciano associado à Afinz B2C. A abertura tem título e apoio centralizados; o segundo bloco usa fundo lavanda `#F6F6FB`, título centralizado e benefícios alinhados à esquerda para preservar a leitura comparativa.
- A ordem dos blocos passa a ser **copy → apoio visual → CTA** nos dois momentos do e-mail. Isso coloca a ação depois de sua evidência/explicação e reduz espaços artificiais deixados por imagens ou campos vazios.
- O HTML usa tabelas de apresentação, largura de 600 px com comportamento fluido, padding mobile, botões com largura integral em telas pequenas, texto essencial em HTML vivo, descrições alternativas e `opencounter` preservado.
- A V2 reutiliza integralmente as mesmas 36 colunas e os 12 briefings técnicos existentes. Não cria campo, não altera DE, não muda chave composta e não publica automaticamente no Content Builder.
- O mesmo AMPscript escolhe a composição por `SEQUENCIA`: o E-mail 1 usa descoberta dos benefícios → passo a passo → fechamento; o E-mail 2 usa introdução → CTA → benefícios → painel de conversão com os cartões. Títulos e CTAs já presentes nas artes não são repetidos em HTML.
- Status operacional apó auditoria local: **ready_for_test_send**. A promoção para `sfmc_certified` exige Test Send aprovado nas seis assinaturas e nos dois e-mails.

### Aprendizados do comparativo visual e teste real Plurix (2026-08-19)

- Um único AMPscript deve atender os dois e-mails, mas a composição visual precisa mudar por `SEQUENCIA`; reutilizar mecanicamente todos os slots em ambos repete textos, CTAs e informações já presentes nas artes.
- O E-mail 1 funciona melhor como descoberta: logo comum → hero → personalização curta → benefícios visuais → passo a passo → fechamento e CTA. O E-mail 2 funciona melhor como conversão: logo comum → hero → personalização → CTA → benefícios em HTML → painel final com CTA e cartões.
- Texto já presente numa imagem não deve reaparecer imediatamente em HTML. Imagens são evidência ou apoio; a hierarquia, personalização e ação essenciais continuam em texto vivo.
- A identidade principal do conteúdo é o cartão `+amigo`; **Plurix** é o parceiro operacional e a bandeira é a assinatura variável no encerramento. A assinatura não deve dominar a abertura do e-mail.
- A base real Plurix já informa a bandeira na coluna `INVESTIDA`. Para o motor atual, esse valor precisa ser normalizado para uma das seis chaves canônicas do briefing: `AMIGAO`, `BOA`, `AVENIDA`, `COMPRE MAIS`, `PARANA` ou `SUPERPAO`.
- Enquanto o lookup permanecer em `NM_PRODUTO_INTERNO = @Produto`, a DE de audiência deve gravar a chave canônica da bandeira em `PRODUTO`; `TP_CAMPANHA` e `SEQUENCIA` completam a chave. `PRODUTO = PLURIX` não distingue a assinatura e não encontra as 12 variantes atuais.
- Mapeamento recomendado da origem: `Amigao → AMIGAO`, `Boa → BOA`, `Avenida → AVENIDA`, `Compre Mais → COMPRE MAIS`, `Parana → PARANA`, `Superpao → SUPERPAO`. Valor vazio ou desconhecido deve ir para quarentena, nunca receber uma bandeira por fallback silencioso.
- O teste controlado deve cobrir a matriz completa de **6 bandeiras × 2 sequências**, confirmar logo, hero, CTA, links, assinatura, legal e responsividade, e só então receber status `sfmc_certified` após Test Send no SFMC.

### Padrão de exportação CSV para o SFMC (corrigido em 2026-09-03)

- A comparação byte a byte de 03/09/2026 mostrou que o CSV gerado pelo GaaS usava `;`, enquanto o arquivo baixado da DE e aceito pelo SFMC usa **vírgula (`,`)**. A decisão anterior de padronizar `;` estava errada e foi revertida.
- O contrato reproduzido pela Fábrica é: UTF-8 sem BOM, delimitador `,`, CRLF, 36 colunas na ordem oficial, uma linha física por registro e aspas duplas somente quando o valor contém vírgula, aspas ou outro caractere que exige qualificação.
- As datas de importação saem em `MM/DD/YYYY HH:mm:ss`, conforme o wizard English (United States) desta BU. O download da DE é localizado em DD/MM e não deve ser usado como prova do formato de reimportação. Em 03/09/2026, 56 linhas iniciadas em `17/08/2026` produziram exatamente 56 erros de data; `01/10/2028` não acusou erro por ser ambígua.
- Vírgulas editoriais como `Olá, PABLO!` permanecem intactas dentro de campos qualificados. Não substituir pontuação do conteúdo para contornar o parser.
- Antes da entrega, validar: 36 colunas após parsing CSV, nenhuma quebra de linha crua dentro do registro, CRLF, ausência de BOM, datas no padrão acordado e round-trip sem perda de copy.
- Para uma DE isolada de homologação, preferir **Sobrescrever** ao reenviar a matriz completa, evitando duplicidade de chaves. Em produção incremental, usar Adicionar e Atualizar somente após validar a chave composta e a configuração da DE.

### Skill de design e engenharia de e-mails de aquisição (2026-08-19)

- A skill de projeto `.claude/skills/sfmc-acquisition-email-designer/` cria, altera, refatora e audita HTML/AMPscript de aquisição. Ela cobre dimensões, alinhamento, ordem de blocos, espaçamento, responsividade, ativos, copy, acessibilidade, dark mode, segurança e compatibilidade.
- A skill é complementar a `emails-dinamicos-sfmc`: o designer cuida do conteúdo/código/renderização; a skill operacional continua responsável por DE, CSV, chave composta, importação, vigência e jornada.
- Alterações em código existente seguem estratégia de patch mínimo: inventariar blocos e dependências, traduzir o pedido em operações explícitas, preservar tracking/legal/lógica não solicitada, executar auditoria estática e entregar cenários de teste.
- Regras incorporadas da documentação oficial: validar rowset antes de `Row`/`Field`; usar `RedirectTo` quando necessário para tracking de URLs dinâmicas; tratar `TreatAsContent` como execução de conteúdo governado e sanitizado; reservar `RaiseError` para falha real; considerar a ordem de processamento preheader → HTML → texto → assunto.
- O auditor `scripts/audit_email_source.py` produz achados `blocked`/`review` para delimitadores e IF/ENDIF, JavaScript e meta refresh, links, imagens, tabelas, guards de rowset, `TreatAsContent` e tracking dinâmico. Ele complementa, mas não substitui renderização e Test Send.

### Camada semântica gerencial e revisão externa (2026-08-31)

- A Fábrica mantém `dynamic_email_briefings.briefing_data` como contrato técnico de 36 colunas e adiciona uma camada relacional separada para contexto de produto, guardrails, estratégia da régua, estratégia por e-mail, blocos semânticos, ocorrências de CTA e adaptações.
- O backfill é conservador: os 56 briefings técnicos permanecem intactos; fatos existentes recebem proveniência e campos interpretativos ficam vazios com `needs_enrichment`. A unidade editorial é `campaign_group_id`, portanto uma pendência compartilhada não é multiplicada pelas seis assinaturas Plurix.
- Os estados técnico, editorial, visual e de certificação são independentes. Pronto tecnicamente não significa certificado; o Test Send no SFMC continua sendo a validação final.
- Múltiplos CTAs são registrados como ocorrências individuais e não geram penalidade genérica. A validação deve observar destino, tracking, coerência de ação e papel na régua.
- A aplicação não chama IA, não guarda chave de provedor e não dispara análise automática. Quando necessário, o operador pede a análise diretamente no chat a um agente autorizado a acessar o Supabase.
- O agente externo registra execução, snapshot de contexto e guardrails, valor anterior, sugestão, justificativa, evidência e confiança. A área **Revisões** apenas exibe o diff e exige aceite ou rejeição humana; nenhuma sugestão altera conteúdo silenciosamente.
- Alterações gerenciais usam controle otimista por versão e snapshots em `dynamic_email_management_versions`. Conflito entre sessões exige recarga antes de salvar.
- A área **Estratégia e guardrails** explicita papel na régua, objetivo, mensagem-chave, ação esperada, proposta de valor, benefícios, objeção e estratégia de CTA sem misturar esses dados ao CSV do SFMC.

## Produto Fábrica de E-mails — estado consolidado (2026-09-02)

O motor desta nota é apenas a camada técnica do produto. A definição completa do workspace, Revisor, biblioteca, templates compartilhados, Plano de Comunicação, criação de réguas, fontes Supabase, limites e roadmap está em [Fabrica-de-Emails-GaaS](#fabrica-de-emails-gaas).


## Evolução registrada em 06/10/2026

[Emails-Dinamicos-Plurix-V11](#emails-dinamicos-plurix-v11) consolida a investigação do V9, o contrato audiência COMUNICACAO_PLX + estado ESTADO_SEQUENCIA_CRM + briefing, o teste de dois toques confirmado pelo usuário e as melhorias publicadas na Fábrica. A V11 mantém imagem, limite e nenhum pool. Cadastrar a V11 não troca os vínculos dos briefings CRM antigos. O contrato em uso ainda tem 36 colunas e a copy da faixa permanece fixa na versão testada.

[Fabrica-XLSX-TOPO-CRM-3](core.md#fabrica-xlsx-topo-crm-3) registra a próxima especificação: mensagem de limite como coluna opcional do briefing, escrita por toque no XLSX/GaaS, rascunhos enriquecidos por IA e a nova régua de dois toques TOPO DE FUNIL (CRM) 3. Essa evolução foi alinhada e documentada em prompt, mas não implementada; não tratar a futura coluna 37 ou o importador como disponíveis.


---

## Emails-Dinamicos-Vai-de-Visa

> **tags:** `operacao, sfmc, emails-dinamicos, ampscript, cloudpages, vai-de-visa, rentabilizacao` | **tipo:** `operacao` | **camada:** `operacao` | **aliases:** `E-mail dinâmico Vai de Visa, LP dinâmica Vai de Visa, LP Oferta Visa` | **atualizado:** `2026-11-03` | **status:** `a-validar` | **fonte:** `operador; desenho a partir de [[Emails-Dinamicos-SFMC]] e do Bloco 3 do Plurix V10`

# E-mail e LP dinâmicos — Vai de Visa

**Definição e propósito:** como o e-mail e a landing page (CloudPage) do [Vai de Visa](resultados-2.md#iniciativa-pool-de-ofertas-vai-de-visa) montam, **por CPF**, 4 ofertas escolhidas pela afinidade de compra, pelo limite disponível e pela célula do teste. Explica por que o motor de briefing atual não basta sozinho e qual padrão já existente reaproveitar.

> Status: desenho = `a-validar`; nada construído em 03/11/2026. Aguarda o KV de Black Friday do Marketing.

## Decisões de 03/11/2026 (vigentes)

- **Template-fonte novo** com o KV de Black Friday, usando o layout de referência com cards (logo, valor da oferta na cor da marca, descrição curta, CTA).
- **1º teste com 3 cards por e-mail**, sem reserva: o AMPscript busca as 3 linhas de [DE-BRIEFING_OFERTAS_VISA](dados.md#de-briefing_ofertas_visa) por `ID_VERSAO` + `CD_GRUPO` (o grupo do cliente; células SEG-B e GEN-A usam `GENERICO`) em ordem de `NR_POSICAO`.
- O SQL **não grava ofertas por CPF**: a regra é fixa (grupo + versão + limite), então o que cada cliente viu é reconstruível pela `ID_VERSAO_OFERTAS` da [DE-VDV_ENVIO](dados.md#de-vdv_envio).
- A LP recebe o `ID_ENVIO` (aleatório) no link, nunca o CPF.

### Template dinâmico v1 (03/11/2026, fim do dia)

- Referências do Marketing: "KV E-mail Black Afinz 2026 - v1 persona" (ID 191865) e "- v2 cartão"; diferem só no hero.
- Arquivo `VDV_BF26_Template_Dinamico.html`: toda a lógica no 1º bloco `%%[ ]%%` (lookup, vigência, variáveis `@C1…@C3`); o corpo usa só `IF` e `v()`, porque a prévia da Fábrica não executa `FOR`/lookup no corpo (`ampscript/renderer.ts`).
- Nome: `FIRST_NAME` da [DE-VDV_ENVIO](dados.md#de-vdv_envio) com `ProperCase` e saudação sem nome quando vazio (o HTML de referência usava `%%PRI_NOME%%`, que não existe na DE de envio).
- Assunto e pré-cabeçalho: propriedades do e-mail com `%%=v(@Assunto)=%%` e `%%=v(@PreHeader)=%%`, lidos de [DE-BRIEFING_OFERTAS_VISA](dados.md#de-briefing_ofertas_visa) → validar no Test Send.
- Cada card tem link (logo + "Aproveitar ›") com `RedirectTo` e alias `VDV_<versão>_<grupo>_P<posição>_<ID_OFERTA>` para medir clique por marca e posição. Os cards de referência não tinham link.
- Bloco "Condições das ofertas" em texto vivo com `NOTA_CONDICOES` (inclui "Beba com moderação" da Evino).
- Vitrine sem oferta vigente: o cliente é pulado (`RaiseError` com skip), nunca recebe e-mail vazio.
- Pendente: foto + logo das 12 marcas no Content Builder (só oBoticário tem, vindo do HTML de referência).

As seções abaixo registram o desenho inicial (6 slots, reservas); a mecânica de reserva volta quando o pool crescer.

## Por que o contrato de 36 colunas não resolve sozinho

O [motor de e-mail dinâmico](#emails-dinamicos-sfmc) resolve o e-mail inteiro por `PRODUTO` × `TP_CAMPANHA` × `SEQUENCIA`: **todo mundo da campanha recebe o mesmo conteúdo**. No Vai de Visa, o conteúdo **muda por pessoa** — dois clientes da mesma campanha veem ofertas diferentes. O briefing não tem como guardar "a oferta de cada CPF".

## Padrão a reaproveitar: Bloco 3 do Plurix V10

O [Plurix V10](#emails-dinamicos-plurix) já resolveu um caso parecido: o Bloco 3 busca a oferta do dia em `DE_POOL_OFERTAS_PLURIX`, **separada do briefing**, e a regra é "sem oferta, o bloco some; o lookup nunca derruba o envio".

| Camada | De onde vem | Peça |
|---|---|---|
| Envelope (assunto, pré-cabeçalho, header com o KV, rodapé, nota legal, UTM) | briefing de 36 colunas, como hoje | `TB_BRIEFING_CAMPANHA_AQUISICAO` |
| Quem é e qual grupo/célula | audiência | [DE-VDV_APTOS](dados.md#de-vdv_aptos) |
| As 4 ofertas | lookup por grupo + limite | [DE-BRIEFING_OFERTAS_VISA](dados.md#de-briefing_ofertas_visa) |

## Lógica dos slots (AMPscript, esboço)

```
SET @grupo  = AttributeValue("CD_GRUPO_PRINCIPAL")
SET @celula = AttributeValue("DS_CELULA_TESTE")
SET @limite = AttributeValue("VL_LIMITE_DISPONIVEL")
IF @celula == "SEG-B" OR @celula == "GEN-A" THEN SET @grupo = "GENERICO" ENDIF
SET @rows = LookupOrderedRows("DE_VDV_OFERTAS", 0, "NR_PRIORIDADE ASC", "CD_GRUPO", @grupo)
/* percorrer @rows: manter só DT_INICIO <= hoje <= DT_FIM e VL_LIMITE_EXIGIDO <= @limite, até 4 */
/* se < 4: completar com LookupOrderedRows(..., "FL_TOP_VENDIDA", 1) aplicando o mesmo filtro */
/* nunca RaiseError por falta de oferta */
```

`LookupOrderedRows` só filtra por igualdade; vigência e limite são filtrados no loop. Células SEG-C e GEN-C ficam fora do envio pelo filtro da jornada, não pelo e-mail.

## LP dinâmica (CloudPage) para SMS e WhatsApp

- Mesma lógica dos slots, recebendo o CPF por parâmetro de URL **criptografado ou por ID opaco**, nunca CPF aberto no link.
- SMS/WhatsApp levam o link da LP; a mensagem segue a estrutura de briefing do [Pool de Ofertas - Parceiros](resultados-2.md#iniciativa-pool-de-ofertas-parceiros).
- Formatação de variáveis e espaçamento: [Formatacao-WhatsApp-Variaveis-e-Espacamento](#formatacao-whatsapp-variaveis-e-espacamento); opt-out: [WhatsApp-Respostas-de-Opt-out](#whatsapp-respostas-de-opt-out).
- Precedente de LP com captura em DE: LPs de seguros no CloudPages (blocos HTML/AMPscript gravando em DE única).

## Checklist de QA (antes do Test Send)

- [ ] Um CPF de teste por grupo b1–b7 e um do Genérico, mais um com limite baixo (só ofertas de R$ 200).
- [ ] Cliente de Eletrônicos com limite < R$ 1.650 vê 1 oferta do grupo + 3 genéricas.
- [ ] Nenhum slot vazio, nenhum `RaiseError` por oferta.
- [ ] Oferta vencida não aparece (testar mudando a data de vigência).
- [ ] Cupom `NÃO POSSUI` não aparece como texto.
- [ ] Links `tidd.ly` abrem e mantêm o rastreio de afiliado.
- [ ] Personalização no formato `%%=v(@FirstName)=%%` (ver [Emails-Dinamicos-SFMC](#emails-dinamicos-sfmc)).

## Ideia: Fábrica como fonte de verdade das ofertas

A [Fábrica](#fabrica-de-emails-gaas) já tem a aba "Header e ofertas" que alimenta o pool do Plurix V10. Usar a mesma aba para manter `DE_VDV_OFERTAS` daria versão, prévia e histórico ao catálogo, em vez de planilha solta. *Proposta, não decidida.*

## Lacunas e pendências

- Layout com KV de Black Friday não aprovado → bloqueia o HTML → Marketing.
- Limite de 4 ofertas no layout (informado por Pablo, 03/11/2026) → define o número de slots → confirmado.
- Forma de passar o cliente para a LP sem expor CPF → requisito LGPD → definir na construção → Pablo.

## Relacionado

[Emails-Dinamicos-SFMC](#emails-dinamicos-sfmc) · [Emails-Dinamicos-Plurix](#emails-dinamicos-plurix) · [Servico-Emails-Dinamicos](#servico-emails-dinamicos) · [DE-BRIEFING_OFERTAS_VISA](dados.md#de-briefing_ofertas_visa) · [DE-VDV_APTOS](dados.md#de-vdv_aptos) · [Teste-Afinidade-MCC-vs-Generico](core.md#teste-afinidade-mcc-vs-generico) · [MOC-SFMC-DEs-e-Automations](dados.md#moc-sfmc-des-e-automations)


---

## Fabrica-de-Emails-GaaS

> **tags:** `operacao,gaas,crm,email,fabrica-de-emails,governanca,reguas` | **tipo:** `operacao` | **camada:** `operacao` | **atualizado:** `2026-10-06` | **status:** `confirmado` | **fonte:** `codigo-gaas`

# Fábrica de E-mails GaaS

**Definição:** workspace editorial e de governança que transforma uma régua de e-mails em briefings dinâmicos versionados, ativos reutilizáveis, plano de comunicação e CSV compatível com o SFMC, mantendo revisão humana antes da operação.

## O que o produto resolve

A Fábrica reduz o trabalho de montar e revisar e-mails em arquivos, HTMLs e telas desconectadas. A unidade de trabalho deixa de ser apenas "um template" e passa a ser uma **régua editorial** composta por e-mails, semanas, segmentos e adaptações.

Ela ajuda a responder quatro perguntas operacionais:

1. quais e-mails existem na régua e qual o papel de cada um;
2. qual conteúdo e quais ativos entram em cada comunicação;
3. o que está incompleto, bloqueado, aguardando revisão ou Test Send;
4. qual versão deve ser exportada para a Data Extension de briefing.

O produto **não** escolhe audiência individual, não configura Journey Builder, não publica no Content Builder e não dispara campanhas. Esses passos continuam no SFMC.

## Usuários, decisões e frequência

| Usuário | Decisão principal | Frequência esperada |
|---|---|---|
| Analista de CRM | preparar, adaptar, validar e exportar briefings | diária/semanal |
| Marketing/Criação | entender pendências visuais e entregar ativos | por campanha |
| Produto/Negócio | validar benefícios, claims, público e proposta de valor | por régua/revisão |
| Gestão CRM | revisar coerência da régua e prontidão | semanal |
| Agente externo de IA | ler Supabase/vault e registrar sugestões auditáveis | sob demanda |

## Modelo mental e navegação

A tela principal usa três painéis:

- **Caixa de briefings:** parceiro → segmento → semana → e-mail → assinatura.
- **Editor ou Revisor:** o clique numa assinatura abre o briefing; o clique numa semana abre o revisor semanal; o clique no segmento abre a régua completa.
- **Prévia:** acompanha o item selecionado e renderiza o e-mail com dados de teste.

A seta da árvore apenas expande/recolhe. O nome da semana ou do segmento muda o escopo do Revisor.

Aliases como **Topo de Funil (Base Proprietária)** e **Topo de Funil (CRM)** são nomes visuais. As chaves técnicas permanecem inalteradas.

### Layout e rolagem (revisão de 2026-09-03)

- **Rolagem única.** As três colunas rolam juntas numa só barra à direita; ao passar do fim do editor, a Caixa de briefings e o editor saem da tela e a prévia continua. Não há mais rolagens internas concorrentes.
- **Divisores próprios.** Duas alças arrastáveis (Caixa | editor | prévia) com largura persistida no navegador; duplo-clique restaura a proporção padrão.
- **Único elemento fixo:** o botão **Salvar briefing**, colado no rodapé da viewport enquanto o editor está em tela.
- **Ordenação da árvore de parceiros por volume:** parceiros com mais e-mails em briefing aparecem no topo; slots de aquisição sem briefing vão para o fim e não exibem rótulo de status.

## Funcionalidades implementadas

### Caixa, edição e ciclo editorial

- busca e filtros por estado (`Todos`, `Prontos`, `Com ajustes`, `Arquivadas`);
- recolher toda a árvore ou abrir rapidamente até o nível de segmentos;
- criar e-mail dentro de uma semana, criar semana, duplicar semana/e-mail e arquivar sem apagar histórico salvo;
- editar as 36 colunas técnicas na ordem visual do e-mail;
- seções minimizáveis, nomes amigáveis e coluna física visível como referência;
- salvar rascunho ou pronto, com `Activity Name` recomendado e confirmação explícita quando ausente;
- versões e auditoria de briefing no Supabase;
- status editorial com rascunho, revisão, pronto, exportado, teste pendente, certificado e arquivado.

### Revisor da semana e da régua

Layout compactado em 2026-09-03: cada e-mail é **uma linha** (antes era um cartão de ~100px com assunto e pré-cabeçalho em duas linhas e uma faixa-rodapé separada).

- colunas por linha: ordem + nome + status (bolinha) · assunto (uma linha) · **barra do Plano de Comunicação** (`N/11` diretrizes preenchidas, cor pela prontidão) · ativos · variações · **botão editar na própria linha**;
- a seta (chevron) expande a linha e mostra o vínculo com o [#Plano de Comunicação](#): papel na régua, objetivo, mensagem-chave, ação esperada, benefício principal, pré-cabeçalho atual e um bloco **assunto planejado × atual**;
- na linha expandida há os atalhos **Editar e-mail** e **Ver no Plano de Comunicação →** (troca de aba);
- o cabeçalho resume tudo numa linha só: `N e-mails · N prontos · N com plano · N assets · N pendências`;
- selecionar o nome ou o assunto atualiza a prévia; o lápis abre o briefing completo;
- selecionar o segmento mostra a régua inteira, inclusive os E-mails 1 a 8 quando cadastrados em semanas diferentes.

### Prévia e QA local

- renderiza o template selecionado com AMPscript-lite e dados de teste;
- por padrão mostra o **e-mail projetado**, usando textos e ativos reais disponíveis;
- o botão **Observações MKT** troca os ativos projetados pelos pedidos/pendências destinados à criação;
- **renderização sempre em desktop:** o e-mail é gerado num viewport fixo de 680px e reduzido por escala para caber na coluna, então nunca cai no layout mobile do template dentro da prévia;
- **peça inteira, sem rolagem própria:** a prévia mostra o e-mail em altura total; quem rola é a página;
- **régua de estrutura:** um trilho de pinos numerados à esquerda liga cada bloco visível do e-mail ao bloco correspondente do editor. A âncora ignora tokens dinâmicos (`%%=v(@X)=%%`), então blocos cujo primeiro campo é só AMPscript continuam aparecendo no trilho;
- assunto e pré-cabeçalho aparecem como linhas rotuladas **ASSUNTO:** / **PRÉ-CABEÇALHO:** (não mais como mock de caixa de entrada);
- **barra de controles minimizável:** o botão **Minimizar / Controles** recolhe o texto de apoio, o seletor de template e os rótulos dos botões (reduz o cabeçalho da prévia de ~230px para ~90px); a escolha é lembrada;
- **Nome de teste** e **Limite de teste** ficam no bloco **Informações da mensagem** do editor, num quadro "amostra usada só na simulação" — não vão no CSV;
- **campos fixos no template ficam bloqueados:** quando o HTML/AMPscript chumba um valor (ex.: rodapé CAN-SPAM), o campo correspondente aparece desabilitado com o selo "fixo no AMP" e um aviso apontando o Template-fonte;
- permite ampliar, abrir em nova aba e imprimir/salvar em PDF;
- a simulação local não substitui o Test Send nem prova compatibilidade entre clientes de e-mail.

### Biblioteca de ativos

- cadastra URLs HTTPS públicas do Salesforce Content Builder, link clicável e metadados;
- filtra por posição, parceiro, segmento, subgrupo e produto;
- recomenda ativos pelo contexto do briefing;
- usa miniaturas e dimensões para revisão;
- deduplica pela URL externa;
- não envia binários ao Supabase Storage.

### Assinaturas Plurix

- um e-mail editorial pode gerar variações técnicas por bandeira;
- conteúdo comum propaga; assinatura, produto interno, deeplink, UTM, legal e ativos podem variar;
- desativar uma assinatura arquiva a variação sem apagar histórico;
- a governança global vive em `dynamic_email_signature_settings`.

### Templates dinâmicos compartilhados

- os slots de HTML/AMPscript vivem em `dynamic_email_template_slots` e são compartilhados entre usuários autenticados;
- é possível criar, importar HTML/TXT, renomear, editar integralmente, salvar, duplicar, excluir e escolher o principal;
- o seletor da prévia permite trocar de slot sem sair do briefing;
- apagar um slot da Fábrica não apaga o ativo correspondente no Content Builder;
- os oito e-mails B2C Classic + Vibe usam um slot canônico dinâmico; os slots legados foram arquivados, não apagados.

### Plano de Comunicação

A camada gerencial é separada do contrato técnico da DE. Por e-mail, registra:

- nome funcional e papel na régua;
- objetivo e mensagem-chave;
- ação esperada;
- proposta de valor e benefícios;
- objeção e prova;
- estratégia de hierarquia visual e CTA;
- proveniência, autor, fonte, versão e motivo da alteração;
- estados técnico, editorial, visual e de certificação independentes.

O plano possui filtros, visão geral, contagem de completude, comparação planejado × executado e consulta de guardrails de produto. O salvamento usa controle otimista para evitar sobrescrever uma versão alterada em outra sessão.

**Layout compactado (revisão de 2026-09-03):** os três blocos de topo que antes vinham empilhados (título + subtítulo, seis filtros em caixas, chips de contagem, abas de Produto, cabeçalho de Régua com chips repetidos) foram fundidos em **uma toolbar de ~2 linhas** — o "cromo" antes do primeiro e-mail caiu de ~400 px para ~67 px. A contagem passou a ser uma linha só (`N e-mails · N pendentes · N bloqueados · N completos`, no escopo do produto), o filtro "Parceiro" saiu (as pills de Produto fazem essa seleção) e o filtro "Regra aplicável" migrou para dentro da aba Regras.

- **Lista de e-mails:** uma linha por e-mail, agrupada por semana, com nome, papel na régua, barra de completude `N/11`, bolinha de status e uma **bolinha de aderência ao briefing** (verde = o assunto do briefing segue a mensagem-chave do plano; âmbar = diverge; cinza = briefing sem assunto).
- **Painel do plano:** modo **ficha** por padrão — as 11 diretrizes como `rótulo: valor`, clicar numa linha abre a edição inline daquele campo; o botão **Editar tudo** abre o formulário completo em accordion de três etapas (Função · Argumento · Conversão). A faixa de contexto (semana · e-mail · versão · autor · N/11) foi fundida no cabeçalho. **Salvar versão** só habilita quando há mudança de fato.
- **Planejado × executado:** puxa o briefing vinculado pelo `campaignGroupId` e compara mensagem-chave × assunto, objetivo × pré-cabeçalho, benefício principal × copy (`TITULO_COPY_1_AZUL`+`COPY_1_PRETO`) e estratégia de CTAs × `TITULO_CTA`/`LINK_CTA`. Isso fecha parcialmente a lacuna P1 nº 9 — conteúdo e CTAs deixam de aparecer como "integração pendente".
- **Toggle Compacto / Confortável** lembrado no navegador (`localStorage['gaas-plano-density-v1']`).

**Ficha de Produto no topo (revisões de 2026-09-04):** "Referências de produto" saiu da aba Regras (estava enterrada no detalhe do e-mail) e virou a **Ficha de Produto** — card full-width acima da lista+detalhe, colapsável, com mais peso visual. É "o suco do produto" e tem **guia de redação próprio** ([Ficha-de-Produto-Guia](#ficha-de-produto-guia)) que a IA deve seguir.

- **Identidade completa e editável:** proposta de valor, diferenciais (chips), tom de voz, fonte + **blocos full-width** para **público elegível** (com dica de incluir o tamanho do público endereçável — ex.: 800K+ CPFs, distinto da base do Clube) e **contexto de marca** (5 linhas, "vários parágrafos, não uma frase"). Campos que já existiam em `dynamic_email_product_contexts` e a UI antiga escondia (só mostrava produto + proposta de valor). Cada campo tem dica de preenchimento no modo edição.
- **Benefícios listados por inteiro**, agrupados por categoria (inferida do texto até a migration `20260904120000`). Cada um: `frase — value_exact · vigência derivada de valid_from/valid_to (VIGENTE até dd/mm | EXPIROU — riscado | sem data) · selo pode citar / cuidado / checar / não citar · escopo de applies_to · fonte↗`.
- **Todas as regras do produto** aparecem na Ficha (não só a contagem), agrupadas por tipo (Proibição, Alegação, Legal, Elegibilidade, …), cada uma com a evidência visível.
- **Tudo editável inline** — identidade, cada benefício e cada regra — com `descartar | salvar` minimalistas via `saveProductContext` / `saveProductGuardrail` (controle otimista por `version`, mesma trava de sessão do plano do e-mail). `saveProductGuardrail` grava só as colunas que existem antes da migration: título, regra, severidade, allowed_status, evidência, url, vigência.
- **Nota fixa:** ficha, benefícios e regras também podem ser preenchidos por uma IA autorizada a ler o Supabase — via chat, nunca automático, seguindo o [guia de redação](#ficha-de-produto-guia), tudo versionado.
- A aba **"Regras aplicáveis"** de cada e-mail continua sendo a mesma lista, filtrada por severidade e em modo leitura.

Migration `20260904120000_dynamic_email_benefit_structure` (aditiva, idempotente, **enfileirada — não há CI de migration, aplica manual**): `category` (enum de 14 compartilhado entre produtos), `value_exact`, `citation_status`, `source_type`, `source` (`xlsx`|`gaas`|`llm` para o sync futuro) em `dynamic_email_product_guardrails` + `source` no contexto + índice de benefício. O front lê essas colunas de forma defensiva (`row.x ?? undefined`) até a migration rodar; só **não escreve** as colunas novas ainda.

### Revisão externa por IA, sem automação embutida

A aplicação não chama modelos nem guarda chave de provedor. Um agente autorizado pode, sob pedido direto no chat, ler o contexto e gravar execuções e sugestões no Supabase. A aba **Revisões** mostra valor anterior, sugestão, justificativa, evidência, confiança e exige aceite ou rejeição humana.

### Criação de régua

O modal cria a estrutura editorial de uma régua de Aquisição ou Rentabilização:

- define BU, parceiro, nome, família, objetivo e template;
- usa segmentos observados em `activities` para Aquisição e `rentabilizacao_activities` para Rentabilização;
- permite propor um segmento novo como rascunho em `dynamic_email_segments`, sem escrever nas tabelas operacionais;
- sugere famílias de ciclo de vida, mas permite texto livre;
- cria nomes funcionais, papéis e semanas para N e-mails;
- pode registrar adaptações para outros parceiros;
- cria briefings vazios e estratégias em estado de rascunho; não cria jornada nem audiência no SFMC.

## Arquitetura e fontes de verdade

| Camada | Fonte | Papel |
|---|---|---|
| Audiência e execução | SFMC (`TB_CAMPANHA_AQUISICAO`, Journey Builder) | quem recebe e quando |
| Conteúdo técnico | `dynamic_email_briefings.briefing_data` | espelho versionado das 36 colunas exportáveis |
| Templates | `dynamic_email_template_slots` | HTML/AMPscript compartilhado |
| Ativos | `dynamic_email_assets` | referências públicas e metadados |
| Assinaturas | `dynamic_email_signature_settings` | disponibilidade de variações |
| Textos legais | `dynamic_email_legal_texts` | biblioteca governada |
| Plano | `dynamic_email_ruler_strategies` e `dynamic_email_email_strategies` | intenção da régua e do e-mail |
| Guardrails | `dynamic_email_product_contexts` e `dynamic_email_product_guardrails` | o que pode/exige validação |
| Adaptações | `dynamic_email_ruler_adaptations` | reaproveitamento planejado entre parceiros |
| Segmentos editoriais | `dynamic_email_segments` | catálogo planejado/observado sem contaminar atividades |
| Revisão externa | `dynamic_email_ai_analysis_runs` e `dynamic_email_ai_suggestions` | sugestão auditável, nunca aplicação silenciosa |
| Histórico | tabelas `*_versions` e `dynamic_email_export_runs` | auditoria e rastreabilidade |

O CSV exportado continua restrito às 36 colunas de `TB_BRIEFING_CAMPANHA_AQUISICAO`. Metadados gerenciais não entram na DE.

## Contratos que não podem ser quebrados

- lookup por `NM_PRODUTO_INTERNO + TP_CAMPANHA + SEQUENCIA`;
- datas e vigência compatíveis com o importador do SFMC;
- CSV UTF-8 sem BOM, com `,`, CRLF, quote mínimo, uma linha física por registro e pontuação editorial preservada;
- imagens por URL HTTPS pública;
- personalização e links dinâmicos validados em Test Send;
- arquivar em vez de apagar ativos e templates legados com valor de auditoria;
- `ready` no GaaS não equivale a `sfmc_certified`.

## Lacunas confirmadas na auditoria de 2026-09-02

### P0 — integridade da criação

1. **Criação não é atômica.** Segmento, briefings, estratégia e adaptações são gravados por chamadas separadas. Uma falha intermediária pode deixar estrutura parcial. A correção adequada é uma função transacional no Postgres/RPC com idempotency key e retorno do conjunto criado.
2. **O relacionamento régua ↔ segmento ainda não é persistido.** A tabela `dynamic_email_ruler_segments` existe, mas o fluxo atual grava o texto em `dynamic_email_ruler_strategies.segment` e não insere o vínculo relacional. Isso impede governança consistente quando um segmento for renomeado, aprovado ou associado a mais de uma régua.
3. **Rollback incompleto.** Se falhar ao criar adaptações, a régua e as estratégias já podem ter sido criadas. O rollback manual existente cobre apenas a falha imediata dos e-mails gerenciais.

### P1 — operação e governança

4. **Segmentos observados não são materializados no catálogo.** O modal os lê diretamente das activities; `dynamic_email_segments` recebe apenas propostas novas. Falta um processo de reconciliação `observed/approved/draft` e uma tela de aprovação.
5. **A herança de adaptações é declarativa.** O sistema registra o que deve preservar ou mudar, mas ainda não materializa cópias vinculadas nem mostra diff por campo entre origem e adaptação.
6. **A nova régua nasce vazia.** Selecionar um template associa o slot, mas não cria conteúdo de briefing a partir de um arquétipo, régua anterior ou pacote de campos. Isso reduz o ganho operacional esperado.
7. **Taxonomia limitada ao recorte carregado.** Cada fonte consulta no máximo 3.000 atividades de e-mail recentes. Segmentos válidos fora do recorte podem não aparecer no modal.
8. **Família de ciclo de vida não é governada.** As sugestões orientam, mas o valor final é livre e pode gerar sinônimos ou duplicidade.
9. **Plano × executado — parcialmente resolvido (2026-09-03).** A comparação agora puxa o briefing vinculado e mostra assunto, pré-cabeçalho, copy principal (`TITULO_COPY_1_AZUL`+`COPY_1_PRETO`) e CTAs (`TITULO_CTA`/`LINK_CTA`) lado a lado com o plano. Falta ainda o mapeamento bloco a bloco (banners, hierarquia visual) e um score de aderência mais rico que o token-overlap atual do assunto.

### P2 — escala e aprendizado

10. **Não existe ciclo fechado com performance.** A Fábrica ainda não relaciona o e-mail planejado com entrega, abertura, clique, proposta, aprovação e cartão por `Activity Name`/template. Portanto não recomenda próxima versão com evidência histórica dentro da tela.
11. **Sem registro estruturado de experimento A/B.** Há versionamento e slots alternativos, mas não hipótese, variante-controle, métrica, amostra, janela e decisão conectadas ao sistema de experimentação.
12. **QA de cliente continua externo.** A prévia é AMPscript-lite; não há matriz Outlook/Gmail/iOS, dark mode real, spam score ou screenshots de clientes.
13. **Biblioteca referencia, mas não hospeda.** A disponibilidade depende das URLs do Content Builder e de sua permanência pública.
14. **Exportar não publica.** Não há API transacional com o SFMC para criar/atualizar DE, Content Builder ou Journey; isso é limite atual e também barreira de segurança desejada até existir certificação robusta.

## Taxonomia de régua e benefício (proposta 2026-09-04)

Pesquisa a pedido do Pablo. Hoje "segmento" é **quatro vocabulários sobrepostos**, não um só:

| Camada | Valores | Onde vive | Rígido? |
|---|---|---|---|
| **Frente** | `acquisition` / `monetization` | toggle do header · `dynamic_email_segments.business_front` · `CreateRulerDialog` passo 0 · espelha `paid_media_objectives` | ✅ decide `activities` vs `rentabilizacao_activities` |
| **Etapa de funil** | `Aquisicao` · `Meio_de_Funil` · `Cross-sell` · `Reativacao` | coluna de `activities` · [Etapa-de-Aquisição](core.md#etapa-de-aquisição) | ✅ não mistura na mesma linha (Ontologia-v2) |
| **Segmento** | 10 reais (Abandonados, Base_Proprietaria, CRM, Negados, Leads_Parceiros, Aprovados_nao_convertidos, Rentabilizacao, Cartonistas, Recência de Compra, Instabilidade) | `dynamic_email_segments` · **é a unidade de "régua" na Fábrica** | ✅ mas `segmentDisplayLabel()` só apelida 2 |
| **Ciclo de vida** (`lifecycle_family`) | livre. Sugestões: `Cliente novo · Sem primeira compra · Em ativação · Cliente ativo · Baixo engajamento · Cliente inativo · Em reativação` | `dynamic_email_segments.lifecycle_family` (texto livre, **quase vazio**) · campo "Família" do `CreateRulerDialog` | ⚠️ proposto, não governado |

Estado confirmado pelo Pablo: **frente Aquisição usa o funil** (é venda), tem **todos os 10 segmentos**, mas **só `Base_Proprietaria` (= Topo de Funil) tem e-mail hoje**. Futuro: Meio de Funil duplicando os e-mails de Topo com variável de limite (Meio de Funil já tem limite aprovado).

### Modelo proposto — 4 dimensões ortogonais

1. **`frente`** (3): `aquisicao` · `rentabilizacao` · `institucional` (novo — marca/endo/co-marketing sem meta de conversão).
2. **`objetivo_da_regua`** (8) — substitui o `lifecycle_family` livre:

   | Objetivo | O que é | Frente | Estágios |
   |---|---|---|---|
   | `venda_cartao` | vender o cartão principal | aquisicao | `topo` · `meio` · `fundo` |
   | `ativacao` | 1º uso pós-aprovação (**nunca usou**) | rentabilizacao | `D0`·`D7`·`D15`·`D30`·`pos_D30` |
   | `engajamento` | + frequência / ticket / recência | rentabilizacao | `novo`·`ativo`·`em_risco` |
   | `reativacao` | trazer de volta app/cartão parado (**usou e parou**) | rentabilizacao | `inativo_curto`·`inativo_longo`·`pre_churn` |
   | `cross_sell` | vender **outro produto Afinz** | aquisicao (do 2º produto) | por `produto_alvo` |
   | `cobranca` | recuperar fatura em atraso | rentabilizacao | `pre_vencimento`·`atraso_D1..D30` |
   | `transacional` | confirmar evento (compra, fatura, cartão a caminho) | — | evento |
   | `institucional` | marca, endomarketing, campanha do parceiro | institucional | — |

3. **`estagio`** (enum generoso, filtrado por objetivo na tela).
4. **`produto_alvo`** (só quando ≠ cartão do parceiro): `seguro_mulher · seguro_residencia · investimento · adquirencia · …`.

### Julgamento da lista do Pablo

- **Reativação** → objetivo próprio, frente rentabilização. Sub-casos: parou o **app** vs. parou o **cartão**.
- **Cross Sell / Captação-Investimento / Adquirência** → **um objetivo só (`cross_sell`) + `produto_alvo`**. Não fragmentar por produto — o 5º produto é uma linha no enum, não uma família nova. Pablo confirmou: **alvo de investimento = clientes do cartão** (é cross-sell interno, não frente própria).
- **Ativação** → objetivo próprio, distinto de reativação (nunca usou × usou e esfriou). Janela D0–D30 tipo a [Regua-Vibe-Ativacao](core.md#regua-vibe-ativacao).
- **Cobrança** → `tipo_comunicacao = operacional`. Gatilho por evento, peso jurídico. Guardrail legal vale mais forte; vigência de benefício só no overlay.
- **Transações** → **fica FORA da Fábrica por ora** (decisão do Pablo — "deixe como registro"). É transacional puro, template fixo, sem criação de copy.
- **Marketing** → `frente = institucional`. Sub-tipos endomarketing (colaborador) e co-marketing (cliente do parceiro sem oferta de cartão). Guardrail = aprovação de marca/parceiro, não vigência de benefício.

### Novo `tipo_comunicacao` (`campanha` · `operacional` · `transacional`)

Define quais guardrails a IA e a tela aplicam: campanha = tudo; operacional (cobrança) = legal forte + benefício só no overlay; transacional = legal forte + sem geração de copy.

### Estrutura de benefício (`dynamic_email_product_guardrails` onde `guardrail_type='benefit'`)

Benefício **já é semi-estruturado** — é um guardrail com `title` (frase), `rule_text` (condições), `severity`, `allowed_status`, `valid_from`/`valid_to` (vigência **já existe**), `evidence`, `source_url`, `applies_to`, `owner_id`. Bate ~80% com a aba `Beneficios` do [Dicionario_Produtos_Afinz_v3.xlsx](dados.md#beneficios-e-vigencia). Migration `20260904120000` fecha o gap: `category` (14 valores, a chave que liga benefícios entre produtos), `value_exact` (número isolado da prosa), `citation_status` (4 estados vs 3 do allowed_status), `source_type` (oficial/terceira/interno por linha), `source` (`xlsx`/`gaas`/`llm`). `applies_to` ganha `{ frentes, objetivos, estagios, produtos, bandeiras }` — vazio = todo o produto.

### Conflito planilha × edição na tela

Coluna `source`: sync do xlsx **só toca `source='xlsx'`**; editar na tela → vira `source='gaas'` e fica **imune ao sync** até mandar "voltar a seguir a planilha". A planilha continua verdade para o que ninguém tocou.

### Fases

1. ✅ **Recap de leitura + edição da ficha** (commit `23b9c0a`) — categoria inferida, migration enfileirada.
2. Aplicar a migration `20260904120000` (manual) + trocar inferência de categoria pela coluna real + edição inline de benefício/guardrail.
3. Skill `gaas-produto-benefits-sync` (xlsx → Supabase respeitando `source`).
4. Migration leva 2: `frente`+`institutional`, `objetivo_da_regua`, `estagio`, `tipo_comunicacao`, `produto_alvo` + `CreateRulerDialog`.

## Roadmap recomendado

1. **Confiabilidade:** RPC transacional/idempotente para criar régua e persistir `dynamic_email_ruler_segments`.
2. **Governança de segmentos:** sincronização observada, aprovação, alias e famílias canônicas de ciclo de vida.
3. **Reuso real:** criar a partir de arquétipo ou régua-base, com herança por campo e diff das adaptações.
4. **Comparador completo:** mapear blocos, CTAs, ativos e links do briefing para Planejado × Executado.
5. **Fechar aprendizado:** ligar `Activity Name`, AppsFlyer e métricas SFMC à estratégia e aos experimentos, sem confundir clique com conversão downstream.
6. **Release operacional:** checklist exportado → importado → Test Send → certificado, com evidência por cliente/bandeira/assinatura.

## Relacionado

- [Enciclopedia-Servicos-Growth](core.md#enciclopedia-servicos-growth) · [Servico-Emails-Dinamicos](#servico-emails-dinamicos) · [Briefing-e-Regua-de-Aquisicao](core.md#briefing-e-regua-de-aquisicao) · [Fontes-e-Proveniencia-Growth](core.md#fontes-e-proveniencia-growth)

## Trilha de aprendizagem e contrato de saída — revisão 02/10/2026

Para quem está chegando, começar pela [Ficha-de-Produto-Guia](#ficha-de-produto-guia), depois pela intenção em [Briefing-e-Regua-de-Aquisicao](core.md#briefing-e-regua-de-aquisicao) e finalmente pelo editor. A unidade editorial reúne o e-mail; suas variantes técnicas conservam identidade e chave por assinatura. Um slot de template é fonte de renderização, não um briefing nem uma jornada publicada.

O serviço completo está em [Servico-Emails-Dinamicos](#servico-emails-dinamicos). Sua entrega na Fábrica é conteúdo revisado/versionado e exportável. A etapa SFMC adiciona importação, teste e configuração da jornada. Não declarar envio ou certificação a partir do status editorial.

### Context Pack para IAs

O exportador `src/modules/dynamic-email/export/aiContextMarkdown.ts` reúne contexto no escopo escolhido, orientações, estados de prontidão e seções omitidas. `managementService.ts` lê fichas/guardrails ativos e preserva controle por versão. O pacote é um snapshot para a tarefa; não revalida comercialmente benefícios e não deve conter dados pessoais de destinatários.

Uma seção omitida indica ausência de dado naquele escopo, não ausência da capacidade. A IA deve devolver fatos usados, informação ausente, alterações justificadas e validação, respeitando versão/escopo. Proposta gerada não deve ser descrita como conteúdo aceito.

### Evidência atual e limites

Supabase consultado em 02/10: um contexto ativo de +amigo e sete guardrails. Código consultado no checkout `importer-aqs-routing`, commit local `1ef6b4d`; isso comprova o contrato no checkout, não certifica sozinho o deploy atual. Não houve sessão SFMC nem nova certificação. As fases e roadmaps anteriores permanecem históricos/propostas salvo verificação explícita.

- [Emails-Dinamicos-SFMC](#emails-dinamicos-sfmc) — contrato técnico AMPscript, DE, CSV e Test Send
- [Emails-Dinamicos-Plurix](#emails-dinamicos-plurix) — implementação e aprendizados específicos de Plurix
- [Sistema-de-Experimentacao-Referencias](core.md#sistema-de-experimentacao-referencias) — desenho de hipóteses e decisões A/B
- [Performance-do-Conteudo-GaaS](evolucao.md#performance-do-conteudo-gaas) — camada retrospectiva de comunicações
- [AppsFlyer-Tracking-CRM](#appsflyer-tracking-crm) — governança de links e atribuição
- [SFMC-Salesforce-Marketing-Cloud](#sfmc-salesforce-marketing-cloud) · [Taxonomia-Activity-Name](core.md#taxonomia-activity-name) · [Segmentos](legado.md#segmentos)


## Evolução registrada em 06/10/2026

[Emails-Dinamicos-Plurix-V11](#emails-dinamicos-plurix-v11) consolida a investigação do V9, o contrato audiência COMUNICACAO_PLX + estado ESTADO_SEQUENCIA_CRM + briefing, o teste de dois toques confirmado pelo usuário e as melhorias publicadas na Fábrica. A V11 mantém imagem, limite e nenhum pool. Cadastrar a V11 não troca os vínculos dos briefings CRM antigos. O contrato em uso ainda tem 36 colunas e a copy da faixa permanece fixa na versão testada.

[Fabrica-XLSX-TOPO-CRM-3](core.md#fabrica-xlsx-topo-crm-3) registra a próxima especificação: mensagem de limite como coluna opcional do briefing, escrita por toque no XLSX/GaaS, rascunhos enriquecidos por IA e a nova régua de dois toques TOPO DE FUNIL (CRM) 3. Essa evolução foi alinhada e documentada em prompt, mas não implementada; não tratar a futura coluna 37 ou o importador como disponíveis.


---

## Ficha-de-Produto-Guia

> **tags:** `operacao,gaas,email,fabrica-de-emails,produto,ficha,guardrail,llm` | **tipo:** `operacao` | **camada:** `operacao` | **atualizado:** `2026-10-02` | **status:** `confirmado` | **fonte:** `operador`

# Ficha de Produto — guia de redação

**Para que serve:** a Ficha de Produto é o card no topo da aba **Plano de Comunicação** da [Fabrica-de-Emails-GaaS](#fabrica-de-emails-gaas). É o "suco do produto" — o que uma pessoa (ou uma IA) precisa saber para escrever ou revisar qualquer e-mail daquele produto sem abrir mais nada. Alimenta `dynamic_email_product_contexts` (identidade) e `dynamic_email_product_guardrails` (benefícios + regras).

**Quem preenche:** analista de CRM na tela, ou uma IA autorizada a ler o Supabase, sob pedido no chat (nunca automático). Toda gravação é versionada.

---

## Princípios

1. **Escreve para quem não conhece o produto.** Nunca pressuponha contexto. Quem lê a ficha pode nunca ter visto uma peça desse cartão.
2. **Fonte para tudo.** Cada afirmação citável tem `evidence` (quem/o quê confirma) e, quando existe, `source_url`. Classifique a fonte: `oficial` (site/material do produto), `terceira` (blog, imprensa), `interno` (planilha/decisão Afinz).
3. **Data em benefício de campanha.** Todo benefício com fim conhecido nasce com `valid_to` preenchido — senão nunca expira sozinho e vira informação morta. Ver [Beneficios-e-Vigencia](dados.md#beneficios-e-vigencia).
4. **Explique fronteiras e diferenças.** Evitar assumir Vibe no +amigo, percentual de desconto no Bem Mais ou programa de pontos ativo. Diferenciar Clube, cartão, benefício e promoção com a regra aplicável.
5. **Vocabulário do cliente, não da operação.** "supermercado", não "rede parceira". "seu limite", não "linha de crédito pré-aprovada".
6. **Curto onde dá, longo onde precisa.** Proposta de valor = 1 frase. Contexto de marca = vários parágrafos.

---

## Campos da identidade (`dynamic_email_product_contexts`)

### `value_proposition` — proposta de valor
Uma frase. **O benefício central + a âncora mental do cliente.** Responde: "por que essa pessoa quer isso?". Não é slogan, é a tese.
> ✅ *"Desconto extra dentro do supermercado que a pessoa já frequenta. O '+' é literal: soma sobre a oferta do Clube. Ancora em compra do mês, não em crédito."*
> ❌ *"O melhor cartão para você."*

### `differentiators` — diferenciais (lista, um por linha)
3 a 6 itens. O que esse produto tem que os concorrentes (ou os outros cartões Afinz) não têm, em forma de bullet citável.

### `tone_of_voice` — tom de voz
**Como falar e como NÃO falar.** Palavras a usar, palavras a evitar, nível de formalidade, quem é o sujeito da frase. Se há uma decisão de vocabulário registrada (ex.: "dizer supermercado, não rede parceira" — Pablo, 20/08/2026), ela vai aqui, com data.

### `eligible_audience` — público elegível
Quatro coisas, sempre:
1. **quem é** (comportamento, relação com o produto);
2. **o que conhece** e **o que NÃO conhece** (ex.: "conhece a loja, não conhece a Afinz");
3. **o tamanho do público endereçável, quando conhecido** — número agregado real, com origem, data e critério de elegibilidade. Se ausente, registrar `não disponível` e a consulta necessária; nunca reutilizar número ilustrativo. **Não confundir** com a base total do Clube/programa de fidelidade;
4. **ressalvas de elegibilidade** (praça, restrição de bandeira, pré-requisito que NÃO existe).

### `brand_context` — contexto de marca
**Vários parágrafos, não uma frase.** Cobre:
- **história e origem** da marca — de onde veio, o que era antes (ex.: "Clube Amigão virou +amigo em abr/2025");
- **posicionamento** — o que a marca representa, o lugar que ocupa na cabeça do cliente;
- **relação com o parceiro e com o emissor** — quem assina o quê. Ex.: "+amigo é uma marca da Plurix; o site do produto não cita a Afinz como emissor; a Afinz aparece só no benefício 'Você Bem (Afinz)'";
- **arquitetura de marca** — se há sub-marcas, bandeiras, assinaturas (ex.: 8 bandeiras Plurix, cada uma com rodapé próprio);
- **o que a marca NÃO é** — associações a evitar;
- **transições em curso** — marcas sendo absorvidas, renomeadas, descontinuadas.

### `provenance` / `source_url`
De onde veio a ficha. Data da última pesquisa. URL da fonte principal.

---

## Campos de cada regra e benefício (`dynamic_email_product_guardrails`)

Comum a benefício e regra:

| Campo | O que escrever |
|---|---|
| `title` | a frase do benefício/regra, curta e citável |
| `rule_text` | o que fazer / não fazer. Para benefício: a formulação recomendada + condições. Para regra: a instrução ("Não citar X em assunto, pré-cabeçalho, copy, arte ou rodapé") |
| `severity` | `hard_block` (bloqueia publicação) · `requires_review` (exige validação humana) · `advisory` (orientação) |
| `allowed_status` | `allowed` · `conditional` · `blocked` — o gate de publicação |
| `evidence` | **quem ou o quê confirma.** Ex.: "Confirmado pelo Pablo em 20/08/2026" · "Site oficial do Clube +amigo" · "Régua antiga vendia isso no E-mail 5; o vault registra que o produto não tem esse programa" |
| `source_url` | link, quando existe |
| `valid_from` / `valid_to` | janela de vigência. `valid_to` vazio = sem fim conhecido |

Específico de **benefício** (`guardrail_type = 'benefit'`, colunas da migration `20260904120000`):

| Campo | O que escrever |
|---|---|
| `category` | uma de: `desconto · cashback · prazo · saude · seguro · cartao_virtual · aceitacao · frete · sorteio · pontos · vibe · app · atendimento · outro`. É a chave que compara benefícios entre produtos |
| `value_exact` | o número **literal como a fonte publica** — "a partir de +5% off", "até 70%", "R$100". Não normalize, não arredonde |
| `citation_status` | `pode` · `cuidado` (condicional) · `checar` (falta confirmar) · `nao` |
| `source_type` | `oficial` · `terceira` · `interno` |
| `applies_to` (jsonb) | escopo opcional. Vazio = vale para todo o produto. Chaves: `frentes`, `objetivos`, `estagios`, `produtos`, `bandeiras`. Ex.: `{ "bandeiras": ["dom_olivio"] }` para um desconto que só a Dom Olívio pratica |

---

## Barra de qualidade — a ficha "atende bem" quando:

- [ ] a proposta de valor cabe numa frase e um estranho entende o produto só com ela;
- [ ] o **tamanho do público endereçável** tem fonte/data, ou a ausência e sua implicação estão registradas;
- [ ] o contexto de marca tem pelo menos 3 parágrafos e diz de onde a marca veio;
- [ ] existe pelo menos uma frase começando com "**Nunca**" ou "**Não citar**" (o que o produto não tem/não pode);
- [ ] todo benefício com valor tem `value_exact` preenchido;
- [ ] todo benefício de campanha tem `valid_to`;
- [ ] toda regra `hard_block` tem `evidence` que explica **por que** ela existe;
- [ ] nenhuma afirmação citável está sem `evidence`.

---

## Fonte de verdade

### Como ler a ficha com segurança — revisão 02/10/2026

A ficha operacional da Fábrica e o dicionário do vault são materiais complementares. O primeiro registra configuração editável com versões; o segundo explica produto, regras e fontes. Divergência deve ser registrada e reconciliada conforme [Fontes-e-Proveniencia-Growth](core.md#fontes-e-proveniencia-growth), sem apagar overrides operacionais.

Na consulta ao projeto `mipiwxadnpwtcgfcedym` em 02/10/2026, há **um contexto ativo**, para **+amigo / Plurix**, e **sete guardrails ativos**. A existência de fichas dos quatro cartões no vault não significa quatro contextos operacionais já cadastrados. Não criar ausência como produto inexistente.

O público de topo do +amigo foi atualizado no registro operacional em 02/10: membros do Clube, sem cartão/proposta no recorte descrito e sem limite declarado. A restrição é da régua; não muda a elegibilidade universal para solicitar. Marcas Compre Mais e Superpão estão bloqueadas para comunicação nominal no escopo da régua, com assinatura +amigo até definição de nova marca.

### Procedimento de revisão da ficha

1. Ler identidade, proposta de valor e escopo da régua.
2. Conferir cada benefício em fonte datada e aplicável à rede/praça.
3. Conferir guardrails ativos, vigência e severidade; `allowed` com evidência fraca não basta para certificar claim.
4. Registrar público conhecido e lacunas agregadas, sem dados pessoais.
5. Confrontar com a ficha canônica do produto e registrar conflitos.
6. Alterar registro operacional somente no escopo autorizado, preservando versão; enriquecer o vault com interpretação e fonte.

### Lacunas confirmadas

Não há contexto ativo dos outros três cartões na consulta. Os sete guardrails do +amigo não possuem URL de fonte preenchida. Cobertura familiar do Você Bem está `allowed` com evidência baseada em peça antiga; o percentual/cobertura também possui regra de revisão. Falta confirmação comercial específica antes de usar a abrangência completa. Responsável nominal e tamanho atualizado da audiência não foram recuperados nesta revisão.

O sync da planilha mencionado abaixo continua **roadmap**: a presença de campos `source` não demonstra um sincronizador implantado.

`Dicionario_Produtos_Afinz_v3.xlsx` (aba `Beneficios` + docs de produto) é a verdade para benefícios e vigência. O sync `gaas-produto-benefits-sync` (roadmap) só toca linhas com `source = 'xlsx'`. Uma linha editada na tela vira `source = 'gaas'` e fica imune ao sync até alguém mandar "voltar a seguir a planilha".

## Relacionado

- [Enciclopedia-Servicos-Growth](core.md#enciclopedia-servicos-growth) · [Briefing-e-Regua-de-Aquisicao](core.md#briefing-e-regua-de-aquisicao) · [Fontes-e-Proveniencia-Growth](core.md#fontes-e-proveniencia-growth)

- [Fabrica-de-Emails-GaaS](#fabrica-de-emails-gaas) — a aba onde a ficha vive
- [Beneficios-e-Vigencia](dados.md#beneficios-e-vigencia) — o esquema de benefício com vigência (fonte de verdade)
- [Pode-Dizer-Nao-Pode-Dizer](dados.md#pode-dizer-nao-pode-dizer) — proibições por produto
- [Dicionario-de-Produtos](dados.md#dicionario-de-produtos) — os quatro cartões
- [Emails-Dinamicos-SFMC](#emails-dinamicos-sfmc) · [Cartao-Amigo-Afinz-Visa](dados.md#cartao-amigo-afinz-visa)


---

## Formatacao-WhatsApp-Variaveis-e-Espacamento

> **tags:** `operacao,whatsapp,copy,convencao,meta` | **tipo:** `operacao` | **camada:** `operacao` | **atualizado:** `2026-08-19` | **status:** `confirmado` | **fonte:** `pesquisa-externa`

# Formatação de WhatsApp — variáveis e espaçamento

**Definição:** a convenção de merge field e de quebra de linha para copy de WhatsApp da Afinz. **Sobrepõe qualquer outra fonte do vault sobre merge fields de WhatsApp.**

> Corrigido pelo **Pablo Prado em 19/08/2026**, a partir da aba `Base Templates Meta` da planilha real de briefing.

## O erro que esta nota impede

Uma régua de 14 briefings foi entregue usando `%%FirstName%%` e `%%LIMITE_CRD%%` nas peças de WhatsApp. **Está errado.** Aquelas tags vieram de prints antigos de template — mas de **outro canal**. O WhatsApp da Afinz passa pelo Business Manager da Meta, e a Meta só aceita placeholder posicional numerado.

## 1. Variável é `{{n}}`, não `%%TAG%%`

| Canal | Sintaxe | Exemplo |
|---|---|---|
| **WhatsApp** | `{{1}}` `{{2}}` `{{3}}` — posicional numerado (padrão Meta) | `Oi, {{1}}, seu limite de R${{2}}...` |
| **E-mail (SFMC)** | `%%=v(@FirstName)=%%` | ver [Emails-Dinamicos-SFMC](#emails-dinamicos-sfmc) |
| **SMS / Push** | `%%NOME%%`, `%%LIMITE_CRD%%` | confirmar com a ferramenta de disparo |

**Ordem convencionada:** `{{1}}` = nome · `{{2}}` = limite (ou limite **anterior**, se houver comparativo) · `{{3}}` = limite novo.

### Armadilha A — reusar o mesmo número

Se `{{1}}` é o nome, ele **não pode** também ser o limite mais adiante. Bug encontrado em peça real:

```
Oi, {{1}},
recapitulando o que te espera no cartão +amigo Afinz Visa: {{1}} de limite pré-aprovado,
```

Renderiza `Fernanda de limite pré-aprovado`. O segundo tinha que ser `{{2}}`.

→ Ao escrever, contar os slots **distintos** e numerar em ordem de aparição.

### Armadilha B — `R$` dentro e fora da variável

Decidir **uma vez por régua**: ou o valor chega já formatado com `R$` e a copy escreve `{{2}}`, ou chega cru e a copy escreve `R${{2}}`. Misturar gera `R$R$4.000` em metade dos disparos.

Peças reais da mesma régua têm as duas formas hoje. Precisa padronizar.

## 2. Espaçamento faz parte da copy

WhatsApp é lido no celular, em rolagem rápida. Bloco corrido não é lido. Padrão validado:

```
Oi, {{1}},

seu *cartão +amigo Afinz Visa* rende dentro do supermercado:
são 5% OFF pagando com ele, além de descontos exclusivos.

Seu limite de R${{2}} continua reservado. Peça agora!

Sujeito à análise de crédito.
```

1. **Vocativo sozinho na 1ª linha**, com quebra depois. Nunca emendado no corpo.
2. **Blocos curtos separados por linha em branco.** Um bloco, uma ideia.
3. **Quebra de linha dentro do bloco** quando a frase tem duas partes (o benefício e o detalhamento dele), mesmo sem linha em branco entre elas.
4. **CTA no fim do último bloco de conteúdo**, não isolado.
5. **Disclaimer sozinho na última linha**, separado por linha em branco.
6. **Negrito com asterisco simples** — `*cartão +amigo Afinz Visa*` — markdown nativo do WhatsApp. Só no **nome do produto**, nunca em frase inteira.

## 3. Como entregar a copy

Sempre dentro de **bloco de código**, com as quebras reais preservadas. Copy de WhatsApp colada como parágrafo de markdown perde o espaçamento e chega errada na ferramenta — foi exatamente o que aconteceu em 19/08/2026.

## 4. Outras regras de canal (evidência de peças reais)

- **CTA duplo obrigatório:** ação positiva + saída explícita *"Não tenho interesse agora"*. 11/11 peças reais, zero exceções.
- **Emoji varia por marca:** B2C usa bastante (🎉 🎁 💳 💙); **+amigo é zero emoji**, ênfase em CAIXA ALTA.
- Template de Marketing/Utility passa por **aprovação prévia da Meta** — não assumir liberdade total de texto.

## Relacionado

- [Galeria-de-Templates](evolucao.md#galeria-de-templates) · [Dicionario-de-Produtos](dados.md#dicionario-de-produtos) · [Pode-Dizer-Nao-Pode-Dizer](dados.md#pode-dizer-nao-pode-dizer)
- [Emails-Dinamicos-SFMC](#emails-dinamicos-sfmc) · [Plataformas-de-Comunicação](core.md#plataformas-de-comunicação) · [Template](core.md#template) · [Canais](legado.md#canais)
- [Motor-de-Briefing-Automatico](core.md#motor-de-briefing-automatico)


---

## Plurix-Recencia-Automation-e-Comunicacoes

> **title:** `Plurix — Recência, automação e comunicações` | **tags:** `plurix, recencia, sfmc, automation, sms, whatsapp, aquisicao` | **tipo:** `runbook` | **camada:** `operacao` | **atualizado:** `2026-10-28` | **status:** `documentado-com-pendencias` | **fonte:** `conversa operacional e screenshots SFMC de outubro de 2026; consulta Supabase e fontes oficiais em 2026-10-26`

# Plurix — Recência, automação e comunicações

## Objetivo e alcance da evidência

Converter compradores recentes sem cartão em solicitantes do cartão +amigo Afinz Visa, usando economia potencial nas compras e oferta pré-aprovada como argumentos. Este documento consolida as decisões e correções da conversa até 28/10/2026. Não certifica configuração ao vivo, entrega, conversão nem sucesso de todas as execuções posteriores.

Relacionados: [07-Evolucao/Segmento-Recencia-de-Compra](resultados-1.md#segmento-recencia-de-compra), [07-Evolucao/Resultados-CRM-Recencia_de_Compra](resultados-1.md#resultados-crm-recencia_de_compra), [03-Dimensoes/Bandeiras-Plurix](core.md#bandeiras-plurix), [07-Evolucao/Parceiro-Plurix](resultados-1.md#parceiro-plurix).

## Dados e significado comercial

- Arquivo de entrada: `lista_nao_cartonistas.csv`, 407.711 registros na carga observada. Arquivo local `(1).csv` foi identificado como cópia equivalente no trabalho anterior.
- Grão da entrada: CPF. Histórico: CPF e semana de referência.
- `economia_4_semanas`: economia potencial calculada pelo parceiro para pagamento com o cartão, referente às quatro semanas do arquivo. Não é desconto recebido, cashback, saldo, economia futura garantida ou benefício líquido após mensalidade.
- Campos brutos: `cpf`, `desc_nome`, `desc_telefone_principal`, `desc_email`, `bol_optin_whats`, `bol_optin_sms`, `bol_optin_email`, `bandeiras`, `cupons_semana`, `gasto_semana`, `cupons_4_semanas`, `gasto_4_semanas`, `gasto_produtos_com_desconto`, `produtos_com_desconto`, `economia_4_semanas`.
- CSV separado por vírgula, com aspas duplas como qualificadores. A economia bruta continha quatro casas decimais: usar Decimal(18,4) na entrada e arredondar para duas no histórico.
- Erros resolvidos durante a importação: `InvalidFieldMap` e `InvalidDecimalScale`. A carga bruta de 407.711 foi observada após correção.
- `bandeiras` pode agregar redes separadas por vírgula. A decisão foi usar a primeira rede em `INVESTIDA`. Isso não torna a economia agregada atribuível exclusivamente a essa rede. Futuro arquivo com apenas a última rede foi mencionado como intenção, não como contrato já comprovado.

## Extensões de dados e localização

Compartilhadas: `Itens Compartilhados > Extensões de Dados Compartilhadas > Plurix > 3_RECENCIA_PLX`. SQL usa `ENT.[nome]`.

| DE | Papel | Grão / ação |
|---|---|---|
| RECENCIA_PLX_ENTRADA | Arquivo bruto atual, 15 campos | CPF, importação da base atual |
| RECENCIA_CONTROLE_CARGA | Identificação da carga e semana | CARGA_ID, adicionar/atualizar |
| RECENCIA_PLX | Histórico bruto com semana e data de importação | CPF + SEMANA_REFERENCIA, adicionar/atualizar |
| RECENCIA_CRUZAMENTO | Enriquecimento, indicadores e motivo principal | CPF, sobrescrever |
| RECENCIA_FUNIL | Contagens por resultado e carga | Sobrescrever |
| RECENCIA_PLX_APTOS | Audiência e personalização da jornada | CPF, sobrescrever |

Fontes locais na BU: `[COMUNICACAO_PLX]`, `[PRE_APROVADO_PLX]`, `[Plurix_publico]`, `[GC_Mesa_Gupshup]`. Restrição compartilhada: `ENT.[sem_interesse]`.

## Automação RECENCIA_CRUZAMENTO

São seis etapas, com sete atividades no arranjo mostrado. A importação móvel e o detalhamento final do funil podem ficar na mesma etapa, pois leem aptos e gravam destinos diferentes. Consultas dependentes devem ficar em etapas sucessivas.

| Etapa | Atividade | O que faz |
|---|---|---|
| 1 | RECENCIA_CONTROLE_CARGA | Registra/atualiza a carga com STATUS PREPARACAO, semana e DATA_CRIACAO |
| 2 | Q_PLX_RECENCIA_02_HISTORICO | Copia entrada para histórico, acrescenta semana e DATA_IMPORTACAO, arredonda economia |
| 3 | Q_PLX_RECENCIA_03_CRUZAMENTO | Cruza cadastro, oferta e restrições; calcula indicadores e RESULTADO |
| 4 | Q_PLX_RECENCIA_04_FUNIL | Resume o cruzamento por resultado |
| 5 | Q_PLX_RECENCIA_05_APTOS | Valida telefone e oferta, prepara personalização e marca WPP/SMS/NOT_CANAL |
| 6 | IMP_PLX_RECENCIA_APTOS + Q_PLX_RECENCIA_06_FUNIL_CANAIS | Importa cadastro móvel e substitui o funil geral pelo detalhamento final |

O registro de controle muda quando a consulta 1 executa, não simplesmente quando um arquivo é importado. O status PREPARACAO não comprova conclusão: não foi implementada atividade de encerramento da carga nesta conversa. QTDE_ESPERADA apareceu vazia.

Semana calculada: segunda-feira da semana anterior à data de execução em UTC-3. Exemplo observado em 21/10: `RECENCIA_2026-10-12`. A fórmula depende da data de execução, não do conteúdo/data do arquivo. Reprocessar arquivo antigo em outra semana pode rotulá-lo incorretamente. Mesma semana atualiza a mesma carga; não há identidade determinística do arquivo implementada.

### Etapa 3 — Regras do cruzamento

Cadastro, nome, e-mail e telefone de cadastro vêm da COMUNICACAO_PLX. Limite e validade vêm da PRE_APROVADO_PLX. CPFs das fontes auxiliares são normalizados para 11 dígitos após validação de tamanho e caracteres. O histórico é restringido aos CPFs presentes na entrada atual e à semana/carga em PREPARACAO.

Prioridade do CASE: formato CPF; ausência no cadastro; ausência em pré-aprovados; validade ausente; oferta vencida; cartonista em Plurix_publico; sem_interesse; Mesa Gupshup; TIPO indicando cartonista; investida ausente; economia não positiva; passou nos filtros. Os motivos são exclusivos pelo primeiro teste atendido; as flags podem se sobrepor.

**Correção excepcional de validade:** todos os registros consultados na PRE_APROVADO_PLX estavam armazenados como 11/01/2026 (YEAR 2026, MONTH 1, DAY 11). O usuário confirmou que a intenção era 01/11/2026 e pediu correção na query. Somente a data `20260111` é convertida para `20261101` na subconsulta de pré-aprovados. Outras datas ficam inalteradas. Não estender automaticamente essa exceção para nova safra/ano.

### Etapa 5 — Contrato final aprovado na conversa

- Destino sobrescrito: RECENCIA_PLX_APTOS.
- Saídas: CPF, CARGA_ID, SEMANA_REFERENCIA, FIRST_NAME, EMAIL, LOCALE, INVESTIDA, ECONOMIA_4_SEMANAS, GASTO_4_SEMANAS, GASTO_PRODUTOS_COM_DESCONTO, PRODUTOS_COM_DESCONTO, LIMITE_CRD, VALIDADE, TELEFONE, CANAL, APTO_RECENCIA, LIBERADO_ENVIO, MOTIVO_PENDENCIA, DATA_PROCESSAMENTO.
- `TELEFONE`: **tipo Phone/Telefone**, único telefone de envio na DE. Nome anterior PHONE_ENVIO foi removido e não deve permanecer no SELECT nem nos mapeamentos. O campo temporário Phone também foi descartado. Número normalizado exclusivamente de COMUNICACAO_PLX.PHONE, sem fallback para o arquivo.
- `LOCALE`: **tipo Locale/Localidade**, valor `BR`. Texto não satisfazia os critérios de elegibilidade do preview de SMS. Não é necessário alterar `'BR' AS LOCALE` ao recriar o campo com tipo correto.
- `ECONOMIA_4_SEMANAS` e `LIMITE_CRD`: **Texto**, definidos para pelo menos 30 caracteres (screenshot posterior mostra 50). SQL converte decimal(18,2) para texto e substitui ponto por vírgula. Ex.: `29,34`, `2500,00`. Campos numéricos de origem permanecem numéricos no cruzamento.
- EMAIL precisa comportar o endereço completo. Houve truncamento; recomendação foi 254 caracteres, mas screenshot posterior mostra Texto(250). Harmonização para 254 permanece uma verificação pendente, sem cortar endereços para caber.
- Nomes: AMIGAO/AMIGÃO → Amigão, BOA → Boa, AVENIDA → Avenida, PARANA/PARANÁ → Paraná. Demais valores preservados até mapear nomes reais.
- Mantidos: formato de celular brasileiro, 55 + DDD válido + 9 + oito dígitos; rejeição de últimos oito dígitos todos iguais; limite numérico positivo; validade pelo menos a data atual UTC-3.
- Mantida unicidade de telefone entre CPFs: agrupa telefone nacional normalizado na união de COMUNICACAO_PLX e entrada atual; aceita COUNT(DISTINCT CPF)=1. **A entrada ainda participa dessa regra**, mesmo após remover a igualdade de telefones.
- **Removido:** exigir que telefone da COMUNICACAO_PLX seja igual ao telefone de origem.
- **Removido:** excluir do público por falta de opt-in WPP/SMS na entrada.
- Canal: opt-in WPP=1 → WPP; senão opt-in SMS=1 → SMS; senão NOT_CANAL. WPP tem prioridade quando ambos são verdadeiros.
- APTO_RECENCIA=1 em todas as linhas retornadas. LIBERADO_ENVIO=1 para indicação WPP/SMS; zero para NOT_CANAL. Motivo para NOT_CANAL: `Sem indicacao de canal na origem`.
- LIBERADO_ENVIO é uma flag da consulta, não certificação de autorização de envio. Inscrição atual e descadastros precisam ser respeitados no canal. Não foi implementada checagem de ciclo ativo/proposta em andamento no SQL 5.

### Etapa 6 — SQL final de detalhamento do funil

Nome: Q_PLX_RECENCIA_06_FUNIL_CANAIS. Destino RECENCIA_FUNIL, Sobrescrever. Executar depois dos aptos. A consulta 4 e esta não podem escrever simultaneamente. O resumo 4 é intermediário; o 6 substitui sua linha de aprovados pelos grupos finais, sem somar novamente o subtotal.

```sql
SELECT
    f.CARGA_ID,
    f.SEMANA_REFERENCIA,
    f.RESULTADO,
    COUNT(*) AS TOTAL_CPFS,
    GETDATE() AS DATA_PROCESSAMENTO
FROM (
    SELECT
        r.CARGA_ID,
        r.SEMANA_REFERENCIA,
        CASE
            WHEN r.RESULTADO <>
                 'Passou nos filtros - validar telefone e canal'
                THEN r.RESULTADO
            WHEN a.CPF IS NULL
                THEN 'Fora dos aptos - revisar filtros do passo 5'
            WHEN a.CANAL = 'WPP'
                THEN 'WPP - prioridade com opt-in na origem'
            WHEN a.CANAL = 'SMS'
                THEN 'SMS - opt-in SMS sem opt-in WPP'
            WHEN a.CANAL = 'NOT_CANAL'
                THEN 'NOT_CANAL - sem opt-in na origem'
            ELSE 'Canal nao identificado - revisar passo 5'
        END AS RESULTADO
    FROM ENT.[RECENCIA_CRUZAMENTO] r
    LEFT JOIN ENT.[RECENCIA_PLX_APTOS] a
        ON a.CPF = r.CPF
       AND a.CARGA_ID = r.CARGA_ID
       AND a.SEMANA_REFERENCIA = r.SEMANA_REFERENCIA
) f
GROUP BY f.CARGA_ID, f.SEMANA_REFERENCIA, f.RESULTADO
```

## Importação móvel e audiência

Definição `IMP_PLX_RECENCIA_APTOS`, criada no Contact Builder e selecionada na atividade de importação móvel da automação. Origem RECENCIA_PLX_APTOS; ação mostrada: Adicionar e atualizar. Não é importação de novo CSV nem cópia para outra DE. Importar todos os aptos finais foi decisão expressa, inclusive contatos já existentes e NOT_CANAL; importar não autoriza disparar.

| Campo da DE | Atributo móvel | Uso |
|---|---|---|
| CPF | _ContactKey | Identidade |
| TELEFONE | _MobileNumber | Celular |
| LOCALE | _Locale | País/localidade |
| FIRST_NAME | _FirstName | Nome e variável WPP 1 |
| ECONOMIA_4_SEMANAS | _City | Variável WPP 2 |
| LIMITE_CRD | _ZipCode | Variável WPP 3 |
| INVESTIDA | _State | Variável WPP 4 |

**Desvio operacional aceito pelo usuário:** ele informou ter testado a personalização por atributos móveis. City/ZipCode/State são usados como transporte de valores comerciais, sobrescrevendo dados globais desses atributos. Isso pode afetar outras mensagens e jornadas; não tratar como arquitetura recomendada genérica. Para SMS, variáveis vêm diretamente da DE.

Audiência escolhida: RECENCIA_PLX_APTOS, transmissível e testável, CPF relacionado à Chave de assinante. Separar caminhos WPP/SMS e excluir NOT_CANAL dos envios. Valores de entrada da jornada devem ser preservados como snapshot quando necessário; sobrescrita semanal da DE e atributos móveis pode mudar personalização de quem já está em jornada.

## Comunicações e personalização

### WhatsApp — template montado/testado visualmente

Imagem do cartão +amigo; corpo observado:

```text
Oi, {{1}}. Ja pensou que suas compras podem render mais?
Nas ultimas 4 semanas, voce poderia ter economizado R${{2}} pagando com o cartao +amigo Afinz Visa.
Voce tem uma oferta pre-aprovada com limite de R${{3}}!
Peca seu cartao e aproveite nas proximas compras no {{4}}.
```

Transcrição normalizada de conteúdo, não exportação byte a byte do template. O template mostrado tinha acentos/emoji e rodapé `Oferta sujeita a análise e validade.` Botões: Pedir cartão; Não tenho interesse agora. Ordem final de variáveis: nome, economia, limite, investida. Aprovação Meta, vínculo definitivo e entrega da peça não foram certificados por essa conversa.

### SMS — versão que o usuário informou como final

```text
%%FIRST_NAME%%, vimos sua compra no %%=Replace(Replace(AttributeValue("INVESTIDA"),"ã","a"),"á","a")=%%! Voce poderia ter economizado R$%%eCONOMIA_4_SEMANAS%% com o cartao +amigo. Limite pre-aprovado de R$%%LIMITE_CRD%%. Peca ja: https://bit.ly/47tZLFN
```

### SMS — última alternativa solicitada para D+4

```text
%%FIRST_NAME%%, com o cartao +amigo voce poderia ter economizado R$%%ECONOMIA_4_SEMANAS%% nas ultimas semanas no %%=Replace(Replace(AttributeValue("INVESTIDA"),"ã","a"),"á","a")=%%! Limite pre-aprovado: R$%%LIMITE_CRD%%. Solicite: https://bit.ly/47tZLFN
```

Alternativa redigida, sem confirmação de publicação/envio. Manter economia potencial. A frase liga o valor à rede: usar apenas quando o cálculo for daquela rede ou corrigir a copy se multibandeira. Não há teste comprovando superioridade da segunda versão.

Regra operacional: SMS sem acentos no texto e valores dinâmicos; preservar Amigão/Paraná na DE e WhatsApp. Replace acima cobre ã/á, não todos os caracteres possíveis. Nome pessoal e outras redes ainda precisam de revisão completa de caracteres. Limite de segmentos é medido após renderização das variáveis e link; a contagem do código AMPscript não representa o texto entregue.

## Snapshots observados, não produção atual

| Resultado do cruzamento | Quantidade |
|---|---:|
| Não localizado na COMUNICACAO_PLX | 227829 |
| Sem registro na PRE_APROVADO_PLX | 58699 |
| Já possui cartão - Plurix_publico | 76 |
| Registrado na restrição sem_interesse | 973 |
| Reservado para a Mesa Gupshup | 5881 |
| Passou nos filtros - validar telefone e canal | 114253 |
| Total | 407711 |

114.253 é subtotal do cruzamento, não garantia de audiência final. A DE de aptos apareceu primeiro com 114.253 numa versão sem liberação efetiva, depois com 97.721 após filtros adicionais, e por último com **106.892** no screenshot após ajustes. Não atribuir causalidade exata a cada filtro sem auditoria. Distribuição final por canal não foi recebida nesta conversa.

Falhas observadas: SQL 5 interrompido por truncamento EMAIL; após excluir PHONE_ENVIO, erro Invalid column name PHONE_ENVIO. Corrigir SELECT e revalidar/reselecionar destino; revisar importação. O tipo Número não substitui Phone. Preview SMS passou a mostrar dados renderizados após os ajustes, sem provar entrega real.

Consulta Supabase de 26/10 identificou `afz_car_plx_aqs_wpp_rec_disp1_pontual` em 23/10/2026 no segmento Recencia_de_Compra, sem template_id. Registro de activity não comprova texto entregue, cobertura ou causalidade. Templates antigos de Copa não podem ser reutilizados como benefício vigente.

## Guardrails de copy, operação e mensuração

- Uma promessa central e um CTA direto à solicitação. Valor pequeno não justifica adjetivos como grande economia; testar economia primeiro versus limite primeiro em grupos comparáveis.
- Não prometer economia futura igual ao valor histórico nem anualizar por multiplicação. Não chamar economia bruta de líquida: mensalidade varia por rede.
- Quatro semanas são do arquivo original, não janela móvel no momento de cada toque. D+4 não atualiza automaticamente cálculo/período.
- Não criar falsa escassez nem apresentar pré-aprovado como aprovado definitivamente. Validar limite e validade antes de cada toque, não só na entrada.
- Oferta excepcional corrigida vence em 01/11/2026. D+4 após esse prazo não deve usar essa pré-aprovação sem renovação válida.
- Supressão de quem iniciou solicitação, virou cartonista, entrou em restrição ou se descadastrou é necessária no desenho da jornada; implementação completa não demonstrada.
- Ausência de opt-in na entrada deixou de excluir da DE. Isso não equivale a consentimento/inscrição para enviar, nem autoriza reativar descadastrados pela importação.
- Pontos encerrados em julho/2026; não usar. Percentuais, saúde, prazos e taxas dependem de rede e condições vigentes.
- Comparar proposta concluída, aprovação, cartão/primeira compra e custo, com controle e populações equivalentes. Cliques são diagnóstico, não prova de copy vencedora.
- Não usar dados ausentes como zero nem interpretar metadados sem conteúdo como texto validado.

Fontes consultadas na pesquisa de 26/10: [produto oficial](https://www.clubemaisamigo.com.br/cartao), [CDC](https://planalto.gov.br/ccivil_03/leis/l8078compilado.htm), [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm), [política WhatsApp](https://whatsappbusiness.com/policy/?faq=5), skills locais produtos-afinz e afinz-copy-aquisicao. Referências orientam operação; não constituem certificação jurídica da peça.

## Artefatos e pendências para continuidade

Kit anterior: `outputs/sfmc-recencia-guia-20261021/` com gerar_guia.py, guia HTML, schemas, ZIP e SQLs 01–04. Plano: `outputs/plurix-recencia-plano-20261021/Estrategia_Recencia_Plurix_Plano_Templates.xlsx`. Os artefatos anteriores **não foram sincronizados com todas as revisões finais de SQL 3/5/6, tipos e nomes desta conversa**. Não regenerar nem importar o kit antigo como se refletisse este contrato. SQL 5 completo mais recente foi entregue no chat; este documento registra seu contrato, não uma extração da versão salva ao vivo.

Próximas verificações: exportar as definições finais salvas no SFMC para versionar SQLs e mapeamentos; conferir EMAIL 254 e Locale; confirmar distribuição por canal e reconciliação dos 114.253; validar importação sem reativar opt-outs; testar SMS/WPP com valores reais; conferir validade em D+4; comprovar supressões e reentrada; vincular template_id à activity e medir resultados maturados. Não houve ativação de agendamento ou jornada certificada pelo agente.


---

## SFMC-Package-Manager-e-Pacotes

> **tags:** `operacao, sfmc, package-manager, jornadas` | **tipo:** `operacao` | **camada:** `operacao` | **atualizado:** `2026-10-07` | **status:** `confirmado` | **fonte:** `documentacao-salesforce-e-pacotes-reais`

# SFMC Package Manager e pacotes de jornada

**Definição e propósito:** o Package Manager é o app nativo do Marketing Cloud que empacota jornadas, automações, DEs e conteúdo com as dependências e implanta em outra BU. Para o GaaS, o valor está no **ZIP exportado**: é uma foto legível e completa de cada jornada (passos, filtros, esperas, mensagens, links), sem precisar de API.

## Contexto e conceitos

- Menu: **Plataforma → Package Manager** (na UI em português: abas Pacote, Implantação, Soluções da indústria). Pablo tem acesso na BU Plurix (06/10/2026).
- **Pacote** = definição (o que foi selecionado) + dependências puxadas automaticamente.
- **Deploy (Implantação)** = subir o ZIP numa BU e recriar os itens.
- Suporta: jornadas completas (entrada por DE, esperas, splits, e-mail, SMS, push, WhatsApp, Update Contact, STO, eventos de API e data), automações, DEs (só estrutura), Content Builder, CloudPages.

## Funcionamento e operação

**Criar pacote:** Pacote → Criar → Nova definição ou Da existente → escolher itens → Save & Continue → (opcional) desmarcar *Preserve Folder Structure* → Package Items → revisar → Next → Download Package. **Upload exige ZIP**; o JSON serve para hospedar e linkar de outro pacote.

**Implantar:** Implantação → Deploy → subir ZIP → pasta, prefixo/sufixo e timestamp opcionais → campos personalizáveis → Next → ação por item → Deploy → Deploy Summary (Success, Warning, Information, Task, Error).

**Campos personalizáveis:** placeholders `{{mcpm:nomeDoCampo}}` em atividades do Journey Builder, Content Builder, CloudPages e envio de e-mail de automação. O deploy pede o valor e substitui. Não funciona em nome de jornada nem de e-mail; e-mail e SMS da jornada têm campos fixos.

## Regras, condições e limites

- **1º deploy só permite criar ou pular** cada item. Manter, atualizar ou renomear existente só aparece ao atualizar um pacote já implantado.
- DE não compartilhada vira **cópia vazia**; DE compartilhada com mesmo nome é referenciada.
- AMPscript é empacotado, mas só referência **por ID** vira dependência. `LookupRows` com nome de DE em texto não entra; `ContentBlockByName` entra.
- Filtro que usa grupos do Contact Builder puxa o **grupo inteiro** (pacotes de 1 jornada vieram com 23 a 37 DEs).
- `WAITUNTILCHATRESPONSE` (espera por resposta no WhatsApp) é **não suportado** (aviso no pacote).
- Limites: item até 5 MB, pacote até 50 MB. Esperas não levam data específica.
- **Não serve como gerador de jornada na mesma BU:** cria cópias das DEs com sufixo, mas o e-mail dinâmico lê DE pelo nome escrito no código, então a jornada clonada grava num lugar e lê de outro. Serve para backup, mover entre BUs e **ler a estrutura**.

## Exemplo e validação

Pacotes analisados em 06 e 07/10/2026:
- `pacote teste - plurix-v1.zip`: 1 jornada (Plurix CRM SEM1, e-mail dinâmico V12).
- `teste - b2c ngd-v1.zip` e `-v2.zip`: 5 e depois 30 jornadas (NGD, ANC, topo, Clube Bem Barato, carrinho B2C e Bem Barato).
- `Minha definição ... 4_09_14 PM-v1.zip`: 14 jornadas de carrinho 21D e sábado (mai a set/26).

Leitura e achados em [Auditoria-Jornadas-SFMC-2026-10](evolucao.md#auditoria-jornadas-sfmc-2026-10).

## Fontes e evidências

- Salesforce Help: *Package Manager in Marketing Cloud Engagement*, *Package Items*, *Customize Branding in Packaged Items*, *Deploy Packaged Items*, *Update Packaged Items*, *Supported Objects*, *Supported Actions*, *Notifications* (lidas em 06/10/2026).
- Estrutura interna do ZIP: `.claude/skills/sfmc-jornadas-pacote/references/anatomia-pacote.md`.

## Lacunas e pendências

- Rodar o teste de deploy numa pasta de teste para ver se placeholders funcionam no **filtro de entrada**. Dono: Pablo.
- Status de uma jornada após deploy (rascunho) não está explícito na documentação.

## Relacionado

- [SFMC-Salesforce-Marketing-Cloud](#sfmc-salesforce-marketing-cloud) · [SFMC-Integracao-API-Roadmap](core.md#sfmc-integracao-api-roadmap) · [Comunicacoes-Pacote-SFMC-Catalogo](#comunicacoes-pacote-sfmc-catalogo) · [Auditoria-Jornadas-SFMC-2026-10](evolucao.md#auditoria-jornadas-sfmc-2026-10)
- Skill do repositório: `sfmc-jornadas-pacote` (extrai mensagens, liga a `activities`, raio-x de jornada).


---

## SFMC-Packs-Fluxos-Vinculos-e-Aprendizados

> **tags:** `sfmc, packs, governanca, template-id, jornadas, gaas, aprendizados` | **tipo:** `operacao` | **camada:** `operacao` | **atualizado:** `2026-10-09` | **status:** `parcialmente-implementado` | **fonte:** `decisoes-do-operador-codigo-gaas-packs-e-supabase`

# Packs SFMC: fluxos, vínculos e aprendizados

Consolidação das decisões de Pablo e das verificações realizadas até 09/10/2026. Complementa [Comunicacoes-Pacote-SFMC-Catalogo](#comunicacoes-pacote-sfmc-catalogo), [SFMC-Package-Manager-e-Pacotes](#sfmc-package-manager-e-pacotes) e [Auditoria-Jornadas-SFMC-2026-10](evolucao.md#auditoria-jornadas-sfmc-2026-10). Os números são snapshots, não contadores permanentes. O Vault é a fonte viva de conhecimento; o GaaS é sua projeção operacional.

## Entidades que não podem ser confundidas

1. Template governado: identidade externa `af_sub3`, com caixa preservada.
2. Versão de conteúdo: texto, assunto, pré-header, HTML, mídia, parâmetros e botões.
3. Uso configurado: importação, jornada, versão, ocorrência, nó, ramo, caminho e posição.
4. Execução: `activities.id`, data real, jornada, Activity Name, canal e dimensões registradas.
5. Decisão: evidência, autor, escopo, vigência, snapshots e auditoria.

O pack comprova configuração exportada, não envio histórico nem passagem de contatos por um ramo. Aprovação editorial não implica vínculo de execução. Vínculo não certifica a versão de conteúdo enviada.

## Ramificações e reuso: regra central

A mesma peça pode ser repetida em nós, momentos e caminhos distintos, inclusive com IDs diferentes. Não deduplicar ocorrências pelo asset, body ou template. Preservar cada nó e sua posição no grafo. Na VIBE SEM1, disparos 2 e 4 reutilizam asset: isso não é erro por si só nem permite juntar os caminhos.

Separar ordinal global, ordinal por canal, `af_sub2`, dia acumulado, semana, subgrupo e data de calendário. Upgrade menor / aprovados não convertidos pode reutilizar mensagens de Repescagem: preservar o segmento da execução e explicitar a relação de reuso; não reclassificar silenciosamente como Negados.

Se o mesmo Activity Name aparece em vários nós do mesmo fluxo, métricas por nome não comprovam qual ramo executou. Expor a ambiguidade e não distribuir resultados entre nós por suposição. Reuso entre jornadas precisa de evidência contextual e temporal.

## Governança das tags

`c` declara campanha; `af_sub1` declara segmento/base/público; `af_sub2` declara momento de tracking; `af_sub3` identifica o template. A interpretação é por campo e por família, não por split posicional universal.

As mais de 30 colunas de `activities` fornecem contexto: BU, parceiro, Segmento, Subgrupos, Oferta, Promocional, data, bases e métricas. Nome de jornada e Activity Name são evidências auxiliares e detalhes completos, não títulos dominantes na interface. Usar tags diretas B2C, B2B2C etc., sem prefixos desnecessários.

Oferta e Promocional são dimensões distintas: Vibe e Padrão podem coexistir, sem conflito. Copa não deve aparecer por inferência indevida da peça. Resolver divergência por dimensão, preservando a fonte. Um ID com `bsp` não substitui uma declaração CRM conhecida da governança/execução.

Para Abandonados, usar os valores oficiais de Subgrupos: `D-21 A D>7` para 21D, `D-7` para sábado/7D e `Diário` para a régua diária. Confirmar a coluna e o uso concreto antes de classificar; não adicionar família/recência redundantes. `Dispd1_21d` significa disparo 1 e qualificador 21D, nunca disparo 121. Negados e outras réguas podem usar D como disparo; topo/e-mail/CRM usam S e D segundo a governança da régua. Não tratar ordinal como duração.

## Packs com e sem ID

Priorizar comunicações com link parametrizado. Sem ID, apresentar aviso e proposta revisável; não fabricar identidade nem promover opt-out a mensagem de campanha. Manifestos, referências, dependências e IDs técnicos são rastreabilidade: ocultar do cotidiano, preservar no ZIP.

## Fluxo de jornadas: contrato visual

Nome do produto: **Fluxo de jornadas**. Preservar gramática do Journey Builder: losangos laranja para decisão/espera; azul-marinho Einstein; quadrados verde-água para canais/atualizações; círculos verdes para saídas. Grade, conectores ortogonais e rótulos colados à bifurcação. Entrada mostra DE, filtro, agendamento/reentrada; não inventar contagem de contatos.

Miniaturas pequenas servem para reconhecimento; ficha lateral única concentra prévia legível, Activity Name completo, ID observado, tags e fontes, caminho, reuso, vínculo, métricas e evolução. Dia nominal soma esperas do caminho; Einstein acrescenta janela separada. Espera variável vira dia variável. Saídas conservam dia acumulado quando determinável.

O grafo não é sempre árvore: joins exigem DAG, otimização/eventos tornam duração variável, ciclos precisam de tratamento explícito. Implementação própria em grade/SVG, sem React Flow/elkjs/dagre. Filtros progressivos de contexto/parceiro/B2C → segmento → jornada → versão; filtros do disparo destacam caminhos sem destruir o grafo. Tela cheia e enquadramento são ações distintas. PNG/PDF e modo só fluxo atendem jornadas maiores.

## Previews: causa dos erros e correção implementada

Quatro packs importados continham 29 ocorrências de e-mail, 118 WhatsApp, 29 SMS e nenhum Push. Ausência de Push nesses packs não significa ausência do canal: o catálogo possuía seis templates Push com arquivo.

No extrator antigo, imagens acima de 300.000 caracteres base64 dependiam de publishedURL; vários assets não tinham URL publicada. Assim, logos pequenos apareciam, mas banners/GIF desapareciam. Seis HTMLs também foram omitidos pelo orçamento de 6 MB por pack. Copiar todo computedStyle na rasterização deformava espaços e textos.

Release `e8a51a2d2e3cbd5c983c02f1b3b4c7ceeca78a2d`: recursos visuais privados deduplicados por importação, HTML de referência e resolução `sfmc-asset:`; staging atômico; recuperação aditiva dos 29 e-mails sem alterar snapshots/ZIPs originais. Derivados WebP podem ser redimensionados; não são bytes idênticos ao original. HTML sanitizado no leitor, sem execução de scripts/AMPscript. Raster derivado preserva documento; cache privado versionado. Catálogo compatível é fallback explícito, não certificado histórico. Origem aprovada ambígua não escolhe arquivo arbitrário.

URL Salesforce é útil quando realmente presente e acessível. Não assumir que todo arquivo embutido possui URL. Disponibilidade de HTML no catálogo não certifica todas as imagens. Aviso legado pode persistir em metadados do canvas mesmo com recuperação visual; não confundir aviso antigo com falha atual do leitor.

## Resultados e lacunas ainda abertas

Todas as métricas e gráficos respeitam período selecionado, datas de São Paulo e filtros. Ausência de taxa não vira zero. Taxa de entrega ponderada usa Base Total somente com cobertura de taxa/denominador válida; não inventar volume entregue. Agregação não comprova causalidade ou versão enviada.

Performance diferencia: com template vinculado; execuções sem template para revisão; comunicações aprovadas sem execução no período, com prévia e aviso, sem ranking/métricas inventadas. A visão consolidada orienta-se por template e agrega as atividades que comprovadamente o utilizaram.

**Lacuna verificada em 09/10:** `occurrenceExecutions` ainda exige template_id para resultados de Esta atividade. Corrigir para permitir métricas pelo contexto exato mesmo sem vínculo, preservando ambiguidade de nós repetidos. Não documentar essa correção como implementada. Histórico fora do período é cobertura, não soma de resultados do recorte.

**Caso DIA verificado em 09/10:** pack `JOR_AQS_B2B2C_DIA_CRM_AQUISICAO_PAD_VIBE_SEM1`, Activity `afz_car_dia_aqs_email_crm_disp1s1vibe_pontual`, ID `dia_email_vibe_bsp_S1D01`. Base usa jornada equivalente `JOR_AQUISICAO_...`, mas Activity `afz_car_vis_aqs_email_dia_disp1s1vibe_pontual`. Registro 21/08/2026: Base Total 238.716; Base Acionável 236.476; Segmento CRM; Oferta Vibe; Promocional Padrao; template_id vazio; taxas de abertura/clique ausentes. Outubro não tem resultado, mas a mensagem nenhum histórico perde o alias de Activity Name. Propor crosswalk explícito por jornada/canal/contexto e vigência; não substituir nomes globalmente nem assumir identidade só pelo sufixo. Alias ainda não implementado/aplicado neste registro.

## Auditoria de vínculos — 09/10/2026

Antes da aplicação: 7.912 registros; 1.073 vinculados; 6.839 sem template. Correspondência exata dos packs encontrou 136 sem vínculo: 82 com ID único cadastrado/canal compatível, 47 com ID ausente do catálogo, sete com IDs ambíguos. Os 82 abrangiam 37 grupos e 28 templates; 31 tinham comunicação aprovada, 29 com catálogo ativo e dois rascunhos. Histórico adicional sugeria 874 candidatos, não vínculos certificados. Treze registros preenchidos divergiam do ID observado no pack: manter para investigação, sem sobrescrever.

Pablo autorizou aplicar os casos de maior certeza e ignorar histórico anterior à Copa. Corte conservador aplicado: **15/04/2026**, da nota [Copa-2026](core.md#copa-2026); não universalizar como início de tracking de todo sistema nem confundir com calendário esportivo.

Aplicados **96 vínculos**, por `link_communication_executions`, em 17 lotes auditados: E-mail 15, SMS 31, WhatsApp 13, Push 37. Foram 59 sustentados por pack+aprovação ou histórico concordante e 37 de continuidade estritamente entre primeira/última data já vinculada, com BU/Segmento/Subgrupos/Oferta/Promocional iguais. Dos 135 Push inicialmente nessa janela, filtros de duplicidade/reviews deixaram 37 elegíveis. Os 28 SMS `afz_car_bbt_aqs_sms_car_d3vibe_diario` foram ligados a `bb_car_vibe_inst_Dispd3`.

Validação pós-aplicação: 96 IDs confirmados; nenhum template anterior não nulo; nenhum registro pré-corte; total 1.169 vinculados e 6.743 sem vínculo. Dois vínculos apontam para template em rascunho com comunicação aprovada: não ativamos o catálogo nem alteramos versão corrente. Alteração de dados não exige deploy frontend. Contagem física não equivale a pessoas/disparos únicos certificados.

Aplicação usa snapshots completos, bloqueio concorrente, IDs únicos, janela explícita e auditoria. Nunca vínculo irrestrito por Activity Name. Não alterar grupos de duplicidade revisados: mudança de snapshots pode invalidar projeção. Não extrapolar continuidade para datas fora da janela apenas porque nome/template parecem iguais.

## Próximos passos registrados, não executados

- Crosswalk de Activity Name com fonte, contexto, vigência e revisão, incluindo DIA.
- Resultados de atividade independentemente de template_id; agregação de template continua exigindo vínculo real.
- Fila comunicação aprovada / vínculo pendente, simulação dos IDs e aprovação por evidência.
- Reuso de decisões delimitado por conteúdo, ramo, dimensões e janela; conflitos bloqueiam lote.
- Ajustar avisos legados e verificar cobertura por canal sem prometer prévia completa universal.
- Aprendizado Growth pode consumir evidências governadas; não transformar configuração de pack em outcome causal validado.

## Referências verificáveis

Código: `src/modules/sfmc-package/parsePackage.ts`, `journeyFlow.ts`, `src/components/communications/journeys/`, `src/services/journeyReadService.ts`, `communicationService.ts`; documentação `docs/tabs/fluxo-jornadas.md`. Skill `.claude/skills/sfmc-jornadas-pacote/SKILL.md`.

Banco: `sfmc_journey_snapshots`, `journey_flow_messages_v`, `sfmc_visual_assets`, `sfmc_visual_messages`, `communication_execution_links`, `communication_execution_reviews`, `activities`. RPCs de leitura preservam RLS; fontes privadas não devem ser publicadas em artefatos. QA local e checks de deploy não substituem Test Send do SFMC nem UAT autenticada do operador.


## Contexto e resultados — revisão 09/10/2026

BU e parceiro são resolvidos por registro de activities, sem cruzar listas independentes. BSP de B2B2C/Plurix é exibido como CRM; o ID original permanece intacto. A seleção de BU limita também os contextos das mensagens.

Resultados da atividade incluem execuções sem template. A consolidação do template usa somente vínculos efetivos, mesmo segmento e filtros do recorte. Usos de outros segmentos aparecem como referências em Outros usos, sem entrar no gráfico. Contagens históricas nessa aba são registros de origem, sem certificar versão enviada ou métricas após revisão de duplicidade.

Equivalências explícitas de contexto são auditadas em journey_flow_context_aliases: DIA SEM1 e jornadas B2C Vibe de Abandonados (Aquisição no pack / Reativação em activities). Nenhum nome original ou template_id foi alterado. Escrita autenticada comum não é permitida nessa tabela.

Teste real pelo RPC autenticado e pela projeção de execuções usada na tela, de 01–30/09/2026, B2C/Serasa/Abandonados:
- afz_car_vis_aqs_wpp_car_d1ecredvibe_diario: 30 ativações, base 3.063, 2.094 aberturas e 181 cartões; sem vínculo de template.
- afz_car_vis_aqs_sms_car_d3ecred_diario: 30 ativações, base 2.766 e 44 cartões; 30 vínculos b2c_car_vibe_srsa_Dispd3.
- Cliques e taxa de entrega não informados nos dois exemplos. SMS sem abertura informada.
- Outubro: zero registros nos dois contextos.

Validação: 382 testes, build, gate TypeScript sem novos erros e teste SQL/RLS. Backend aplicado em produção; frontend desta revisão ainda local, sem commit/push nesta etapa.


---

## SFMC-Query-Studio-e-SQL

> **tags:** `operacao, sfmc, sql, query-studio, automation-studio, armadilhas` | **tipo:** `operacao` | **camada:** `operacao` | **aliases:** `Query Studio, SQL no SFMC, Armadilhas Query Studio` | **atualizado:** `2026-11-03` | **status:** `confirmado` | **fonte:** `erros reproduzidos no Query Studio (Salesforce Labs) em 03/11/2026, operador`

# SFMC — Query Studio e SQL

**Definição e propósito:** guia de como escrever e testar SQL no Marketing Cloud. O **Query Studio** (app gratuito da Salesforce Labs) roda um `SELECT` e mostra o resultado na tela, sem DE de destino. A **Query Activity** (Automation Studio) grava o resultado numa DE e é o que vai para produção. Os dois usam o dialeto SQL Server do SFMC, mas o Query Studio tem limitações próprias.

> Status: armadilhas 1–4 = `confirmado` (erro reproduzido em 03/11/2026); causa exata da 4 = `inferência`.

## Quando usar cada um

| Situação | Ferramenta |
|---|---|
| Explorar uma DE, contar, validar import, testar uma regra | Query Studio |
| Gerar audiência, alimentar jornada, rodar todo dia | Query Activity (Automation Studio), com DE de destino e ação Overwrite / Update |

## Armadilhas do Query Studio

| # | Sintoma | Causa | Como escrever |
|---|---|---|---|
| 1 | "The ORDER BY clause is invalid in views, inline functions, derived tables, subqueries…" | a query roda embrulhada numa subquery | `ORDER BY` só com `TOP`: `SELECT TOP 500 … ORDER BY qtd DESC` |
| 2 | "Unable to create temporary data extension: Non-whitespace before first tag" | a query vai dentro de um XML; `<` abre tag | evitar `<`, `<=`, `<>`; inverter (`b > a`) ou trocar `x <> ''` por `LEN(x) > 0` |
| 3 | "A field named limite_disponivel >= 200 and … already exists" | o nome da coluna é deduzido pela palavra `AS`; `CAST(… AS DATE)` confunde | usar `CONVERT(DATE, GETDATE())`; `AS` só para nomear coluna |
| 4 | `COUNT(DISTINCT CPF)` igual ao total de linhas mesmo com CPF repetido | observado 2× (MAPA_MCC e CLIENTES ATIVOS) | contar com `SELECT CPF … GROUP BY CPF` e ler o total no rodapé ("1 of N (**X rows**)") |

Outras regras: nome de DE com espaço vai entre colchetes (`[CLIENTES ATIVOS]`); DE compartilhada de outra BU usa `ENT.[nome]`; vale o **nome externo** da DE (Propriedades), não o nome exibido. Sessão longa expira: recarregar a página antes de suspeitar da query.

No Automation Studio as armadilhas 2 e 3 não se aplicam. `COUNT(DISTINCT CPF)` é usado em produção na automação de recência Plurix ([Plurix-Recencia-Automation-e-Comunicacoes](#plurix-recencia-automation-e-comunicacoes)); a armadilha 4 é do Query Studio.

## Armadilhas também do Automation Studio (03/11/2026)

| Sintoma | Causa | Como escrever |
|---|---|---|
| "VALUES não é uma extensão de dados ou exibição de dados do sistema conhecida" | `CROSS APPLY (VALUES …)` não é suportado | uma subquery com `UNION ALL` (um bloco por categoria) e `ROW_NUMBER()` por cima |
| Horário 3 h atrás de Brasília | `GETDATE()` usa o servidor (UTC-6) | `DATEADD(HOUR, 3, GETDATE())` |
| Campo inexistente no destino | o SELECT precisa ter os nomes das colunas da DE de destino | alias (`b.PRI_NOME AS FIRST_NAME`); colunas calculadas (`DT_CARGA`) não precisam existir na origem |
| Valores 100× maiores após import | vírgula decimal lida como milhar | importar como texto e converter com `REPLACE` + `TRY_CONVERT` ([DE-MAPA_MCC](dados.md#de-mapa_mcc)) |

`ROW_NUMBER() OVER (PARTITION BY … ORDER BY …)`, `TRY_CONVERT`, `NEWID()` e `NOT EXISTS` funcionam na Query Activity.

## Padrões reutilizáveis

**Uma linha por cliente com regras "qualquer linha" (CPF repetido):**

```sql
SELECT a.CPF
FROM [CLIENTES ATIVOS] a
GROUP BY a.CPF
HAVING MAX(CASE WHEN <condição de elegibilidade> THEN 1 ELSE 0 END) = 1   -- ao menos um cartão bom
   AND MAX(CASE WHEN a.bloqueio_email = 1 THEN 1 ELSE 0 END) = 0          -- nenhuma linha bloqueada
```
(No Query Studio, escrever a condição sem `<`.)

**Somar outra tabela por cliente sem duplicar:** juntar por conta a partir de `SELECT DISTINCT CPF, NR_CONTA`, depois `GROUP BY CPF`. Ver [DE-MAPA_MCC](dados.md#de-mapa_mcc).

**Funil de filtros numa query só:** um `COUNT(CASE WHEN … THEN 1 END)` por etapa, acumulando condições. No Query Studio, só confiar em contagem por linha; para CPF, usar o padrão `GROUP BY`.

**Booleans:** comparar com `= 1` / `= 0`; agregar com `MAX(CASE …)`, porque bit não aceita `MAX` direto.

**Datas:** "últimos 30 dias" = `DATEADD(DAY,-30,CONVERT(DATE,GETDATE()))`. `GETDATE()` no SFMC é horário do servidor (não UTC-3) — irrelevante para janelas em dias, relevante para corte por hora.

## Relacionado

[SFMC-Salesforce-Marketing-Cloud](#sfmc-salesforce-marketing-cloud) · [MOC-SFMC-DEs-e-Automations](dados.md#moc-sfmc-des-e-automations) · [DE-CLIENTES_ATIVOS](dados.md#de-clientes_ativos) · [DE-MAPA_MCC](dados.md#de-mapa_mcc) · [DE-VDV_APTOS](dados.md#de-vdv_aptos) · [Plurix-Recencia-Automation-e-Comunicacoes](#plurix-recencia-automation-e-comunicacoes)


---

## SFMC-Salesforce-Marketing-Cloud

> **tags:** `operacao,sfmc,integracao` | **tipo:** `operacao` | **camada:** `operacao` | **atualizado:** `2026-11-03` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# SFMC — Salesforce Marketing Cloud

**Definição:** a **plataforma real de disparo** das campanhas de CRM. O GaaS planeja e analisa; o SFMC **executa** o envio de e-mail, SMS, WhatsApp e push.

## Contexto
Cada [Disparo](core.md#disparo) que vira linha em [activities](dados.md#activities) foi, na origem, executado no SFMC. A fronteira de integração hoje é **manual/semi-automática**: resultados saem do SFMC/BI, são colados/subidos e passam pela [ingestão com revisão humana](legado.md#ingestão-de-dados). O GaaS não dispara direto no SFMC (ainda) — o `tsvGenerator` do wizard de disparo gera TSV para colar lá.

## Implicações
- A [Taxonomia-Activity-Name](core.md#taxonomia-activity-name) é a chave que reconcilia o que foi planejado no GaaS com o que o SFMC retornou.
- Acesso a dado **individual** (CPF) vive no SFMC, não no GaaS — daí o [anti-overlap](core.md#anti-overlap-pressão-de-contato) real depender dessa integração (ver [Decisões-Abertas](evolucao.md#decisões-abertas)).

## Relacionado
- [Servico-Emails-Dinamicos](#servico-emails-dinamicos) · [Briefing-e-Regua-de-Aquisicao](core.md#briefing-e-regua-de-aquisicao) · [Fontes-e-Proveniencia-Growth](core.md#fontes-e-proveniencia-growth)
- [Disparo](core.md#disparo) · [activities](dados.md#activities) · [Ingestão-de-Dados](legado.md#ingestão-de-dados) · [Modal-de-Disparo](legado.md#modal-de-disparo) · [Anti-Overlap-Pressão-de-Contato](core.md#anti-overlap-pressão-de-contato) · [AppsFlyer-Tracking-CRM](#appsflyer-tracking-crm) · [Emails-Dinamicos-SFMC](#emails-dinamicos-sfmc)
- Pacotes e integração (out/2026): [SFMC-Package-Manager-e-Pacotes](#sfmc-package-manager-e-pacotes) · [SFMC-Integracao-API-Roadmap](core.md#sfmc-integracao-api-roadmap) · [Comunicacoes-Pacote-SFMC-Catalogo](#comunicacoes-pacote-sfmc-catalogo) · [Auditoria-Jornadas-SFMC-2026-10](evolucao.md#auditoria-jornadas-sfmc-2026-10)

## Funcionamento para quem está chegando

**Data Extension (DE)** é a tabela de dados usada pelo SFMC. **Content Builder** armazena conteúdo/HTML do e-mail. **AMPscript** lê dados e monta conteúdo personalizado. **Journey Builder** organiza entrada, esperas, decisões, atualização de dados e envio. **Test Send** envia amostras para verificar a peça real.

No motor documentado, a DE de audiência contém o destinatário e o estado da sequência; a DE de briefing contém conteúdo por produto, campanha e sequência. A chave de conteúdo não é o CPF. O destinatário fornece os três valores de busca; o template procura o briefing correspondente e verifica vigência.

## Entradas, saídas e fronteira operacional

| Etapa | GaaS | SFMC |
|---|---|---|
| Planejamento | produto, estratégia, briefing e versão | configuração da jornada aplicável |
| Conteúdo | simulação, ativos referenciados e CSV | DE de briefing e template do Content Builder |
| Público | contexto agregado e critérios | audiência individual, elegibilidade e supressões |
| Teste | QA editorial/técnico e prévia | Test Send de personalização/renderização |
| Execução | registros de planejamento | entrada e disparo da jornada |
| Resultado | ingestão e análise reconciliada | logs/resultados, conforme integração |

O fluxo documentado não demonstra um conector automático de publicação/disparo. Uma funcionalidade cadastrada no GaaS não comprova configuração equivalente no SFMC.

## Checklist antes de operar

1. Confirmar BU, estrutura e chaves das DEs; validar o desenho de carga antes de sobrescrever audiência de produção.
2. Conferir correspondência das chaves e datas da campanha.
3. Validar template ativo e leitura de `SEQUENCIA`: dados congelados da jornada podem não refletir `Update Contact`.
4. Importar com contrato da BU e conferir contagem e amostras.
5. Executar Test Send por sequência/assinatura afetada e registrar evidência.
6. Conferir jornada, filtros, ativação/reentrada e supressões para envio real.
7. Em falha, preservar arquivo, versão e erro; corrigir a causa antes de reenviar ou recarregar base.

## Importação de arquivos em Data Extensions (regra canônica)

Vale para qualquer DE, não só para o e-mail dinâmico. Casos reais: briefing de e-mails (03/09/2026) e [DE-MAPA_MCC](dados.md#de-mapa_mcc) (03/11/2026).

| Armadilha | Sintoma | Prevenção |
|---|---|---|
| Formato de data | muitos "Data inválida" — e, pior, linhas aceitas com **dia e mês trocados** sem erro | conferir o formato do arquivo e configurar o import; pedir `yyyy-MM-dd` na origem. Teste: se os erros batem com "linhas com dia > 12", é inversão |
| "Respeitar aspas duplas" | colunas desalinhadas ou arquivo inteiro rejeitado | marcar sempre; a opção **desmarca a cada novo import** |
| Separador | coluna toda desalinhada | conferir `;` × `,` no arquivo e no wizard |
| .xlsx | não importa | Import Activity só lê CSV/TXT delimitado |
| Ação | linhas antigas permanecem | Overwrite para foto do período; Adicionar/Atualizar só para incremento |
| Zero à esquerda | CPF/conta não cruzam | campos de identificador como Text |

Depois de importar, validar com uma query de contagem e faixa de datas ([SFMC-Query-Studio-e-SQL](#sfmc-query-studio-e-sql)). Mapa das DEs: [MOC-SFMC-DEs-e-Automations](dados.md#moc-sfmc-des-e-automations).

## Evidências e lacunas — revisão 02/10/2026

Esta revisão cruzou notas, código da Fábrica e Supabase; não inspecionou sessão SFMC. [Emails-Dinamicos-Plurix](#emails-dinamicos-plurix) conserva o teste histórico de 10/08. Configuração atual das DEs, testes posteriores, reentrada, pressão de contato e responsáveis nominais devem ser confirmados pelo operador. A conclusão operacional só vale para o recorte que possui essa evidência.


---

## Servico-Emails-Dinamicos

> **tags:** `servico, crm, email, sfmc, onboarding` | **tipo:** `operacao` | **camada:** `operacao` | **atualizado:** `2026-10-02` | **status:** `confirmado` | **fonte:** `codigo-gaas` | **publico:** `pessoas-novas, ias, operacao-interna`

# Serviço Interno de E-mails Dinâmicos

**Definição:** processo interno que transforma produto, público e intenção de comunicação em e-mails versionados, exportáveis e testados no SFMC.

## Quando usar e qual é a entrega

Usar para criar, adaptar ou revisar réguas de e-mail com conteúdo variável por produto, campanha e sequência. O serviço entrega o plano, os briefings técnicos, os ativos referenciados, o CSV e o registro das validações. O envio real exige operação no SFMC.

Uma régua é o conjunto organizado de toques; um briefing é o conteúdo de um toque; uma assinatura adapta sua identidade à bandeira; o template é o HTML/AMPscript que transforma os dados em peça. Esses objetos não são intercambiáveis.

## Entradas necessárias

| Entrada | Fonte / verificação |
|---|---|
| Produto comercial, parceiro e bandeira | [Dicionario-de-Produtos](dados.md#dicionario-de-produtos) e [Bandeiras-Plurix](core.md#bandeiras-plurix) |
| Benefícios e restrições | [Beneficios-e-Vigencia](dados.md#beneficios-e-vigencia), [Pode-Dizer-Nao-Pode-Dizer](dados.md#pode-dizer-nao-pode-dizer) e guardrails ativos do GaaS |
| Público e momento | [Segmentos](legado.md#segmentos), regra da régua e elegibilidade real no SFMC |
| Objetivo e progressão | [Briefing-e-Regua-de-Aquisicao](core.md#briefing-e-regua-de-aquisicao) |
| Conteúdo e ativos | [Fabrica-de-Emails-GaaS](#fabrica-de-emails-gaas), URLs governadas e validade da oferta |
| Contrato técnico | [Emails-Dinamicos-SFMC](#emails-dinamicos-sfmc) e DE aplicável |
| Critério de sucesso | evento de negócio, janela e referência de comparação |

Se uma entrada faltar, registrar a lacuna e o efeito no trabalho. Não inventar limite, tamanho de audiência, intervalo entre toques ou condições comerciais.

## Procedimento completo

1. **Entender o produto:** confirmar marca, público, benefício principal, prova e restrições. Separar regra de aquisição de requisito para pedir o cartão.
2. **Planejar a régua:** dar um papel a cada toque, definir o comportamento esperado, o sinal de entrada, a cadência aplicável e as supressões.
3. **Preparar o briefing:** preencher conteúdo, campos técnicos, ativos, CTA e legal por sequência e assinatura. Preservar a chave composta.
4. **Revisar:** confrontar planejado e peça, resolver placeholders e conferir validade, marca, renderização e destinos de todos os CTAs.
5. **Exportar:** validar o CSV de 36 colunas, datas e integridade de registros; metadados editoriais ficam no GaaS.
6. **Importar e testar no SFMC:** conferir a DE, a unicidade, o template ativo, o lookup e as amostras de Test Send.
7. **Operar a jornada:** verificar entrada, reentrada, atualização da sequência e supressões. Test Send não certifica a configuração da jornada.
8. **Medir:** reconciliar a versão enviada, o identificador, o público e os eventos; separar diagnóstico de e-mail de resultado de aquisição.

## Responsabilidades

CRM prepara e opera; Produto/Negócio valida benefícios e audiência; Criação entrega os ativos; responsável pela operação SFMC registra o Test Send e a configuração de jornada. Os nomes dos responsáveis não estão consolidados nesta nota: identificar o dono por campanha antes de executar. Uma IA pode reunir evidências e sugerir alterações dentro do pedido; aceite editorial e certificação continuam explícitos.

## Critérios de conclusão

- Plano e briefing correspondem à mesma régua e versão.
- Benefícios, imagens, marca e legal têm fonte e escopo.
- Não há duplicidade de chave de briefing ou placeholder pendente.
- CSV foi validado e importado sem perda de conteúdo.
- Test Send aprovado tem data, template/versão, sequência/assinatura e evidência.
- Jornada real foi verificada quando houver disparo automático.

Se só o CSV estiver entregue, registrar **exportado**. Se só a prévia estiver correta, registrar **QA local**. Não declarar **certificado no SFMC** sem a evidência correspondente.

## Exemplo documentado e limites

[Emails-Dinamicos-Plurix](#emails-dinamicos-plurix) registra a implementação Plurix e o teste de 10/08/2026. É evidência histórica de funcionamento daquele recorte; não certifica mudanças posteriores. As seis assinaturas operacionais não equivalem a todas as redes comerciais do Clube.

## Erros e recuperação

| Sintoma | Conferir | Recuperação |
|---|---|---|
| Briefing não encontrado | produto, campanha e sequência nos dois lados | corrigir a chave e repetir teste |
| Data inválida na importação | locale da BU e formato de entrada | gerar no padrão homologado e conferir datas não ambíguas |
| Arquivo inválido / colunas deslocadas | BOM, delimitador, aspas e quebras cruas | reexportar e validar round-trip |
| Sequência não muda | Journey Data congelado versus leitura da DE atual | revisar lookup e Update Contact no template/jornada real |
| Peça correta, nenhum envio | filtro, ativação, entrada e supressões | revisar jornada; não recarregar audiência às cegas |
| Marca antiga em arte/rodapé | guardrail e ativo por assinatura | substituir ativo e repetir QA/Test Send |

## Fontes e lacunas

Fontes: [Fabrica-de-Emails-GaaS](#fabrica-de-emails-gaas), [Emails-Dinamicos-SFMC](#emails-dinamicos-sfmc), [Emails-Dinamicos-Plurix](#emails-dinamicos-plurix), código `src/modules/dynamic-email` do GaaS e leitura de governança de produto no Supabase em 02/10/2026. Não houve acesso ao SFMC nesta revisão. Permanecem a confirmar: configuração atual de cada DE/jornada, evidências dos testes mais recentes e responsável nominal.

## Relacionado

- [Enciclopedia-Servicos-Growth](core.md#enciclopedia-servicos-growth) · [Briefing-e-Regua-de-Aquisicao](core.md#briefing-e-regua-de-aquisicao) · [Ficha-de-Produto-Guia](#ficha-de-produto-guia)
- [SFMC-Salesforce-Marketing-Cloud](#sfmc-salesforce-marketing-cloud) · [Fontes-e-Proveniencia-Growth](core.md#fontes-e-proveniencia-growth)


---

## WhatsApp-Respostas-de-Opt-out

> **tags:** `crm, whatsapp, opt-out, jornada, governanca, aprendizado` | **tipo:** `contrato` | **camada:** `operacao` | **atualizado:** `2026-10-26` | **status:** `confirmado` | **fonte:** `confirmacao-direta-do-responsavel`

# WhatsApp — respostas de opt-out

## Significado confirmado em 26/10/2026

Nas activities de WhatsApp, o sufixo `_resposta_optout_pontual` identifica a
**mensagem de resposta enviada após a pessoa clicar em “Não tenho interesse agora”
nos templates**. A regra é geral para WhatsApp: não se limita aos nomes
`afz_car_vis_*` e `afz_car_bbt_*`, nem ao segmento ANC.

O termo `pontual` faz parte do nome operacional da resposta. Ele não define
o subgrupo do público; tampouco autoriza sugerir `Diario`, `Abandonados D-7`
ou `Abandonados D-21 A D>7`.

É uma resposta operacional ao interesse negativo. A mensagem principal do
template, o clique no botão e a resposta de opt-out são eventos distintos.
O nome da activity, sozinho, não comprova a configuração técnica de supressão
global nem substitui o evento original do clique.

## Classificação e identidade

- A resposta herda o contexto da sua jornada e execução. O mesmo Activity Name
  pode ser reutilizado em jornadas e públicos diferentes.
- Não identificar o segmento apenas por `apr`, pelo texto da resposta ou pelo
  histórico global da mesma activity. Não juntar jornadas ou copiar resultados
  entre elas porque compartilham a resposta padrão.
- Para **ANC / Aprovados_nao_convertidos**, o responsável confirmou:
  **Etapa = Meio_de_Funil; Subgrupos = N/A (sem subgrupo)**.
- A confirmação inclui os casos de `JOR_AQS_BB_NA_ANC_MEIO_DE_FUNIL_PAD_VIBE_SET26`
  e `JOR_AQS_BB_NA_ANC_MEIO_DE_FUNIL_PAD_VIBE_OUT26` revisados no CSV (63).
- `JOR_AQS_BB_*` é uma forma abreviada observada de Bem Barato / B2B2C;
  reconhecer a dimensão sem renomear automaticamente a jornada persistida.
- A regra ANC não transforma respostas de outras jornadas, como carrinho,
  automaticamente em Meio de Funil. O contexto da jornada continua prevalecendo.

## Causa do erro observado no parser

O histórico da mesma activity compartilhada, de segmentos e de tokens semelhantes
oferecia subgrupos de carrinho para uma jornada ANC. O formato abreviado
`JOR_AQS_BB_*` também não era reconhecido pelo parser canônico, deixando a etapa
dependente dessas sugestões. Assim apareceram Reativacao e Abandonados D-21 A D>7.

A correção local reconhece o formato abreviado; fixa ANC em Meio_de_Funil / N/A;
retira etapa e subgrupos incompatíveis da lista de sugestões; e impede que respostas
de opt-out usem histórico da mesma activity em outras jornadas, buckets globais,
tokens ou outros segmentos para completar suas dimensões.

Implementação local em 26/10/2026: `intelligentImportRouting.ts` e
`intelligentUpdateEngine.ts`, usados pela skill e pelo checkout do Atualizador
Inteligente. Isso não confirma publicação do código na aplicação em produção.

## Melhorias propostas para acompanhamento

Estas são propostas, ainda não implementadas:

1. Distinguir mensagem principal, clique em “Não tenho interesse agora” e resposta
   enviada/entregue no catálogo e na visualização de jornadas.
2. Relacionar a resposta ao template, botão e execução de origem, preservando
   jornada, BU, parceiro, canal e período. Registrar a evidência do vínculo.
3. Acompanhar cliques no botão, pessoas únicas, respostas enviadas e entregues,
   repetição e tempo entre o clique e a resposta, quando essas fontes existirem.
4. Separar esses eventos na análise de volume e de conteúdo para evitar que uma
   resposta automática seja interpretada como uma nova comunicação principal.
   Qualquer mudança nos indicadores atuais precisa de contrato e validação próprios.
5. Investigar propostas/cartões associados às activities de resposta no BI.
   Associação no export não demonstra que a mensagem de opt-out gerou conversão.

Sem identificadores de pessoa/evento e população compatível, contagem de mensagens
não deve ser apresentada como contagem de pessoas nem como taxa de opt-out única.

## Relacionado

- [Importador-Segmentacao-Aquisicao-2026-10](engenharia.md#importador-segmentacao-aquisicao-2026-10)
- [Jornada-Disparos](legado.md#jornada-disparos)
- [activities](dados.md#activities)
- [Canais](legado.md#canais)


---
