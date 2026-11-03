---
tags: [operacao,gaas,crm,email,fabrica-de-emails,governanca,reguas]
tipo: operacao
camada: operacao
atualizado: 2026-10-06
status: confirmado
fonte: codigo-gaas
---

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
- a seta (chevron) expande a linha e mostra o vínculo com o [[#Plano de Comunicação]]: papel na régua, objetivo, mensagem-chave, ação esperada, benefício principal, pré-cabeçalho atual e um bloco **assunto planejado × atual**;
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

**Ficha de Produto no topo (revisões de 2026-09-04):** "Referências de produto" saiu da aba Regras (estava enterrada no detalhe do e-mail) e virou a **Ficha de Produto** — card full-width acima da lista+detalhe, colapsável, com mais peso visual. É "o suco do produto" e tem **guia de redação próprio** ([[Ficha-de-Produto-Guia]]) que a IA deve seguir.

- **Identidade completa e editável:** proposta de valor, diferenciais (chips), tom de voz, fonte + **blocos full-width** para **público elegível** (com dica de incluir o tamanho do público endereçável — ex.: 800K+ CPFs, distinto da base do Clube) e **contexto de marca** (5 linhas, "vários parágrafos, não uma frase"). Campos que já existiam em `dynamic_email_product_contexts` e a UI antiga escondia (só mostrava produto + proposta de valor). Cada campo tem dica de preenchimento no modo edição.
- **Benefícios listados por inteiro**, agrupados por categoria (inferida do texto até a migration `20260904120000`). Cada um: `frase — value_exact · vigência derivada de valid_from/valid_to (VIGENTE até dd/mm | EXPIROU — riscado | sem data) · selo pode citar / cuidado / checar / não citar · escopo de applies_to · fonte↗`.
- **Todas as regras do produto** aparecem na Ficha (não só a contagem), agrupadas por tipo (Proibição, Alegação, Legal, Elegibilidade, …), cada uma com a evidência visível.
- **Tudo editável inline** — identidade, cada benefício e cada regra — com `descartar | salvar` minimalistas via `saveProductContext` / `saveProductGuardrail` (controle otimista por `version`, mesma trava de sessão do plano do e-mail). `saveProductGuardrail` grava só as colunas que existem antes da migration: título, regra, severidade, allowed_status, evidência, url, vigência.
- **Nota fixa:** ficha, benefícios e regras também podem ser preenchidos por uma IA autorizada a ler o Supabase — via chat, nunca automático, seguindo o [[Ficha-de-Produto-Guia|guia de redação]], tudo versionado.
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
| **Etapa de funil** | `Aquisicao` · `Meio_de_Funil` · `Cross-sell` · `Reativacao` | coluna de `activities` · [[Etapa-de-Aquisição]] | ✅ não mistura na mesma linha (Ontologia-v2) |
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
- **Ativação** → objetivo próprio, distinto de reativação (nunca usou × usou e esfriou). Janela D0–D30 tipo a [[Regua-Vibe-Ativacao]].
- **Cobrança** → `tipo_comunicacao = operacional`. Gatilho por evento, peso jurídico. Guardrail legal vale mais forte; vigência de benefício só no overlay.
- **Transações** → **fica FORA da Fábrica por ora** (decisão do Pablo — "deixe como registro"). É transacional puro, template fixo, sem criação de copy.
- **Marketing** → `frente = institucional`. Sub-tipos endomarketing (colaborador) e co-marketing (cliente do parceiro sem oferta de cartão). Guardrail = aprovação de marca/parceiro, não vigência de benefício.

### Novo `tipo_comunicacao` (`campanha` · `operacional` · `transacional`)

Define quais guardrails a IA e a tela aplicam: campanha = tudo; operacional (cobrança) = legal forte + benefício só no overlay; transacional = legal forte + sem geração de copy.

### Estrutura de benefício (`dynamic_email_product_guardrails` onde `guardrail_type='benefit'`)

Benefício **já é semi-estruturado** — é um guardrail com `title` (frase), `rule_text` (condições), `severity`, `allowed_status`, `valid_from`/`valid_to` (vigência **já existe**), `evidence`, `source_url`, `applies_to`, `owner_id`. Bate ~80% com a aba `Beneficios` do [[Beneficios-e-Vigencia|Dicionario_Produtos_Afinz_v3.xlsx]]. Migration `20260904120000` fecha o gap: `category` (14 valores, a chave que liga benefícios entre produtos), `value_exact` (número isolado da prosa), `citation_status` (4 estados vs 3 do allowed_status), `source_type` (oficial/terceira/interno por linha), `source` (`xlsx`/`gaas`/`llm`). `applies_to` ganha `{ frentes, objetivos, estagios, produtos, bandeiras }` — vazio = todo o produto.

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

- [[Enciclopedia-Servicos-Growth]] · [[Servico-Emails-Dinamicos]] · [[Briefing-e-Regua-de-Aquisicao]] · [[Fontes-e-Proveniencia-Growth]]

## Trilha de aprendizagem e contrato de saída — revisão 02/10/2026

Para quem está chegando, começar pela [[Ficha-de-Produto-Guia]], depois pela intenção em [[Briefing-e-Regua-de-Aquisicao]] e finalmente pelo editor. A unidade editorial reúne o e-mail; suas variantes técnicas conservam identidade e chave por assinatura. Um slot de template é fonte de renderização, não um briefing nem uma jornada publicada.

O serviço completo está em [[Servico-Emails-Dinamicos]]. Sua entrega na Fábrica é conteúdo revisado/versionado e exportável. A etapa SFMC adiciona importação, teste e configuração da jornada. Não declarar envio ou certificação a partir do status editorial.

### Context Pack para IAs

O exportador `src/modules/dynamic-email/export/aiContextMarkdown.ts` reúne contexto no escopo escolhido, orientações, estados de prontidão e seções omitidas. `managementService.ts` lê fichas/guardrails ativos e preserva controle por versão. O pacote é um snapshot para a tarefa; não revalida comercialmente benefícios e não deve conter dados pessoais de destinatários.

Uma seção omitida indica ausência de dado naquele escopo, não ausência da capacidade. A IA deve devolver fatos usados, informação ausente, alterações justificadas e validação, respeitando versão/escopo. Proposta gerada não deve ser descrita como conteúdo aceito.

### Evidência atual e limites

Supabase consultado em 02/10: um contexto ativo de +amigo e sete guardrails. Código consultado no checkout `importer-aqs-routing`, commit local `1ef6b4d`; isso comprova o contrato no checkout, não certifica sozinho o deploy atual. Não houve sessão SFMC nem nova certificação. As fases e roadmaps anteriores permanecem históricos/propostas salvo verificação explícita.

- [[Emails-Dinamicos-SFMC]] — contrato técnico AMPscript, DE, CSV e Test Send
- [[Emails-Dinamicos-Plurix]] — implementação e aprendizados específicos de Plurix
- [[Sistema-de-Experimentacao-Referencias]] — desenho de hipóteses e decisões A/B
- [[Performance-do-Conteudo-GaaS]] — camada retrospectiva de comunicações
- [[AppsFlyer-Tracking-CRM]] — governança de links e atribuição
- [[SFMC-Salesforce-Marketing-Cloud]] · [[Taxonomia-Activity-Name]] · [[Segmentos]]


## Evolução registrada em 06/10/2026

[[Emails-Dinamicos-Plurix-V11]] consolida a investigação do V9, o contrato audiência COMUNICACAO_PLX + estado ESTADO_SEQUENCIA_CRM + briefing, o teste de dois toques confirmado pelo usuário e as melhorias publicadas na Fábrica. A V11 mantém imagem, limite e nenhum pool. Cadastrar a V11 não troca os vínculos dos briefings CRM antigos. O contrato em uso ainda tem 36 colunas e a copy da faixa permanece fixa na versão testada.

[[Fabrica-XLSX-TOPO-CRM-3]] registra a próxima especificação: mensagem de limite como coluna opcional do briefing, escrita por toque no XLSX/GaaS, rascunhos enriquecidos por IA e a nova régua de dois toques TOPO DE FUNIL (CRM) 3. Essa evolução foi alinhada e documentada em prompt, mas não implementada; não tratar a futura coluna 37 ou o importador como disponíveis.
