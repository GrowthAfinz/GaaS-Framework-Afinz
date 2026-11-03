# Evolução: decisões, governança, catálogos e changelog (evolucao.md)

<!-- gerado por scripts/bundle_vault.py: não editar à mão -->

> Compilado do vault em 2026-11-03. 16 notas. Quando carregar: Tarefa que precisa de decisão aberta ou tomada, inconsistência de dado, glossário ou histórico do vault.
> Arquivo derivado: a fonte canônica é a nota no vault. Mapa completo em [INDEX.md](INDEX.md).

## 📌 Notas neste arquivo

- [Changelog-do-Vault](#changelog-do-vault)
- [Auditoria-Jornadas-SFMC-2026-10](#auditoria-jornadas-sfmc-2026-10)
- [Catalogo-Analitico-CRM](#catalogo-analitico-crm)
- [Catalogo-Analitico-Midia-B2C](#catalogo-analitico-midia-b2c)
- [Conflitos-de-Fonte-Produtos-2026-08](#conflitos-de-fonte-produtos-2026-08)
- [Decisões-Abertas](#decisões-abertas)
- [Decisões-Tomadas](#decisões-tomadas)
- [Evolucao-Cronologica-GaaS-2026-10](#evolucao-cronologica-gaas-2026-10)
- [Funis-de-Onboarding-GaaS](#funis-de-onboarding-gaas)
- [Galeria-de-Templates](#galeria-de-templates)
- [Glossário-de-Siglas](#glossário-de-siglas)
- [Governança-de-Dados](#governança-de-dados)
- [Inconsistências-a-Corrigir](#inconsistências-a-corrigir)
- [Inventario-Operacoes-Growth](#inventario-operacoes-growth)
- [Performance-Atividades-e-Fluxo-de-Jornadas](#performance-atividades-e-fluxo-de-jornadas)
- [Performance-do-Conteudo-GaaS](#performance-do-conteudo-gaas)

---

## Changelog-do-Vault

> **tags:** `indice,changelog,meta` | **tipo:** `moc` | **camada:** `indice` | **atualizado:** `2026-11-03` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Changelog do Vault

**Definição:** o histórico de evolução **do próprio vault** (não da operação — para isso ver [Histórico-de-Evolução](legado.md#histórico-de-evolução)).

## 2026-11-03 · Testes e Tarefas por frente

- Novo padrão **Iniciativas por frentes de negócio**, escolhido por Pablo: navegação lateral,
  percurso, contexto, pergunta e decisões versionadas. Ativação dos agentes continua por skill.
- Publicação autorizada com os testes atuais e revisão visual pendente. Ver
  [Testes-e-Tarefas-Quatro-Frentes](engenharia.md#testes-e-tarefas-quatro-frentes); não representa conclusão dos agentes nem resultado CRM.


- [Testes-e-Tarefas-Quatro-Frentes](engenharia.md#testes-e-tarefas-quatro-frentes): central com SDD, aquisição, rentabilização e cross-sell;
  iniciativas, formulários por tipo, versões e integração de atenção com a Fila.
- Contexto Visa incluído na sincronização completa; cadastros de planejamento não afirmam envio ou resultado.
- Parser/exportador ajustados para wikilinks escapados em tabelas, conservando conteúdo canônico.

## 2026-11-03 (tarde) · Vai de Visa: DEs reais, automações e pool de ofertas

- Novas entidades com os nomes criados no SFMC: [DE-VDV_CRUZAMENTO](dados.md#de-vdv_cruzamento), [DE-VDV_APTOS](dados.md#de-vdv_aptos) (substitui `DE_VDV_BASE_ELEGIVEL`), [DE-VDV_ENVIO](dados.md#de-vdv_envio), [DE-VDV_FUNIL](dados.md#de-vdv_funil) e [DE-BRIEFING_OFERTAS_VISA](dados.md#de-briefing_ofertas_visa) (substitui `DE_VDV_OFERTAS`). As notas antigas viraram redirecionamentos em `98-Legado/02-Entidades-Dados/`.
- Nova [Automacao-VDV-Pool-de-Ofertas](operacao.md#automacao-vdv-pool-de-ofertas) (PREPARAÇÃO e CONGELAR, anotações e ordem de execução).
- [DE-MAPA_MCC](dados.md#de-mapa_mcc): fluxo com `MAPA_MCC_ENTRADA` em texto e validação após a conversão. [SFMC-Query-Studio-e-SQL](operacao.md#sfmc-query-studio-e-sql): armadilhas do Automation Studio (sem `CROSS APPLY VALUES`, fuso do `GETDATE`).
- Atualizadas: [Iniciativa-Pool-de-Ofertas-Vai-de-Visa](resultados-2.md#iniciativa-pool-de-ofertas-vai-de-visa) (1º teste, frentes), [Teste-Afinidade-MCC-vs-Generico](core.md#teste-afinidade-mcc-vs-generico) (sorteio em duas camadas, safras), [Emails-Dinamicos-Vai-de-Visa](operacao.md#emails-dinamicos-vai-de-visa) (3 cards), [MOC-SFMC-DEs-e-Automations](dados.md#moc-sfmc-des-e-automations), decisões e inconsistências.

## 2026-11-03 · Pool de Ofertas - Vai de Visa, MCC e mapa do SFMC

- Nova iniciativa [Iniciativa-Pool-de-Ofertas-Vai-de-Visa](resultados-2.md#iniciativa-pool-de-ofertas-vai-de-visa) (rentabilização, Black Friday / Best November) e nome próprio para a variante existente: [Iniciativa-Pool-de-Ofertas-Parceiros](resultados-2.md#iniciativa-pool-de-ofertas-parceiros) (RENT-96f7a0892e), com visão de resultado por jornada.
- Novo conceito [MCC](core.md#mcc) e desenho de teste [Teste-Afinidade-MCC-vs-Generico](core.md#teste-afinidade-mcc-vs-generico) (células SEG/GEN, holdout de 10%, regra `V1_12M_REC6M`).
- Nova subpasta `02-Entidades-Dados/SFMC/` com [MOC-SFMC-DEs-e-Automations](dados.md#moc-sfmc-des-e-automations), [DE-CLIENTES_ATIVOS](dados.md#de-clientes_ativos), [DE-MAPA_MCC](dados.md#de-mapa_mcc), [DE-VDV_APTOS](dados.md#de-vdv_aptos) e [DE-BRIEFING_OFERTAS_VISA](dados.md#de-briefing_ofertas_visa). Primeira vez que DEs do SFMC viram entidades do vault.
- Novas notas de operação: [Emails-Dinamicos-Vai-de-Visa](operacao.md#emails-dinamicos-vai-de-visa) e [SFMC-Query-Studio-e-SQL](operacao.md#sfmc-query-studio-e-sql). Regras de importação de DE consolidadas em [SFMC-Salesforce-Marketing-Cloud](operacao.md#sfmc-salesforce-marketing-cloud).
- Atualizadas: [Incentivo-ao-Uso](resultados-3.md#incentivo-ao-uso), [Publico-Cartonistas](resultados-3.md#publico-cartonistas), [Cartao-Afinz-Visa](dados.md#cartao-afinz-visa), [Decisões-Tomadas](#decisões-tomadas), [Decisões-Abertas](#decisões-abertas), [Inconsistências-a-Corrigir](#inconsistências-a-corrigir), [Emails-Dinamicos-SFMC](operacao.md#emails-dinamicos-sfmc), [MOC-Operacao](core.md#moc-operacao).
- Números com snapshot de 03/11/2026 (Query Studio e perfil do arquivo MAPA_MCC). Nenhum dado pessoal registrado. Pendente: recompilar ontologia e sincronizar a biblioteca.

## 2026-10-31 · Método de trabalho com specs

- Nova [Como-Trabalhar-SDD-no-GaaS](engenharia.md#como-trabalhar-sdd-no-gaas), com pesquisa em GitHub Spec Kit, Kiro, OpenSpec e DORA, distinguindo princípios consultados e proposta adaptada ao projeto.
- Inclui níveis tema/spec/tarefas, profundidade proporcional, template, exemplo de integração Fila–agentes–Wiki e piloto ainda não executado. Nenhuma ferramenta instalada ou tarefa promovida automaticamente.

## 2026-10-31 · SDD GaaS e linguagem simplificada

- Área de desenvolvimento renomeada para **SDD GaaS**, com foco em priorização e desenvolvimento guiado por especificações.
- Temas e rótulos de prioridade simplificados, mantendo identificadores, dependências e histórico internos.
- Atualizados [Backlog-Desenvolvimento-GaaS-Loop-2026-10](engenharia.md#backlog-desenvolvimento-gaas-loop-2026-10) e [Motor-de-Agentes-Loop-de-Memoria-2026-10](ia.md#motor-de-agentes-loop-de-memoria-2026-10).

## 2026-10-31 · Agentes como motor do Loop e backlog de desenvolvimento

- Consolidada a evolução desta conversa em [Motor-de-Agentes-Loop-de-Memoria-2026-10](ia.md#motor-de-agentes-loop-de-memoria-2026-10), distinguindo pesquisa, infraestrutura, testes executados e exp-3 ainda proposta.
- Direção confirmada por Pablo: ativação por skill, execução generativa, aprendizado e reutilização; Fila e Wiki prioritárias. Registros, Assuntos, testes/cross-sell e Report Live exigem planejamento posterior.
- Criado [Backlog-Desenvolvimento-GaaS-Loop-2026-10](engenharia.md#backlog-desenvolvimento-gaas-loop-2026-10), com 12 tarefas persistidas no GaaS, dependências, critérios e avisos na Fila. Não implica execução das reformas futuras.
- Preservados os registros anteriores; as notas de Loop e Experimento receberam adendos e referências. Publicação desta consolidação autorizada por Pablo.

## 2026-10-31 · Experimento de agentes da Wiki

- Nova [Experimento-Agentes-Wiki-2026-10-31](ia.md#experimento-agentes-wiki-2026-10-31): estado do primeiro teste do framework ADM, Editor e especialistas por região. Leitura integral das 482 notas concluída e conferida; delegação do ADM registrada; rodada dos especialistas em andamento.
- Nenhuma proposta dos agentes foi aplicada ao vault. Publicação desta nota autorizada por Pablo.
- Acesso pelo [MOC-Inteligencia-IA](core.md#moc-inteligencia-ia).

## 2026-10-31 — Evolução cronológica do GaaS

- Publicada [Evolucao-Cronologica-GaaS-2026-10](#evolucao-cronologica-gaas-2026-10), com linha do tempo, mudanças de capacidade e divergências entre notas antigas e histórico GitHub.
- Corte documental: 912 commits alcançáveis, 62 PRs e 479 notas anteriores à publicação; varredura automatizada integral e leitura aprofundada das fontes históricas, sem alegar revisão semântica linha a linha de todo o acervo.
- Acesso pelo [MOC-Engenharia](engenharia.md#moc-engenharia). Publicação autorizada por Pablo; análise distingue proposta, integração de código, implantação registrada e resultado observado.

## 2026-10-07 · SFMC: pacotes de jornada, integração e Comunicações

- Nova [SFMC-Package-Manager-e-Pacotes](operacao.md#sfmc-package-manager-e-pacotes): o que o Package Manager faz, limites (1º deploy só cria ou pula, cópias vazias de DE, `{{mcpm:}}`), e por que o ZIP é fonte de leitura e não gerador na mesma BU.
- Nova [SFMC-Integracao-API-Roadmap](core.md#sfmc-integracao-api-roadmap): capacidades de API por área (DEs, automações, jornadas, tracking, conteúdo), personalização em cascata, IA antes do envio, requisitos e ordem.
- Nova [Auditoria-Jornadas-SFMC-2026-10](#auditoria-jornadas-sfmc-2026-10): padrões de jornada, resultados por parceiro, achados em três baldes (erro, hipótese, lógica a perguntar) e copy x Pode Dizer.
- Nova [Comunicacoes-Pacote-SFMC-Catalogo](operacao.md#comunicacoes-pacote-sfmc-catalogo): as duas chaves do pacote (`af_sub3` = `template_id`; nome Meta = `title`) e o fluxo-alvo da aba Comunicações.
- [Cartao-Bem-Mais-Afinz-Visa](dados.md#cartao-bem-mais-afinz-visa): OneLink encontrado e primeiras peças reais de CRM registradas.
- Skill nova `sfmc-jornadas-pacote` no repositório; plano de implementação em `docs/plans/2026-10-07-PROMPT-CODEX-comunicacoes-pacote-sfmc.md`.

## 2026-10-02 — Enciclopédia interna, primeiro corte editorial

- Inventário integral de notas e wikilinks; enriquecimento do piloto Produtos → Briefing → E-mails Dinâmicos → SFMC.
- Nova [Enciclopedia-Servicos-Growth](core.md#enciclopedia-servicos-growth), [Servico-Emails-Dinamicos](operacao.md#servico-emails-dinamicos) e [Briefing-e-Regua-de-Aquisicao](core.md#briefing-e-regua-de-aquisicao).
- [Padrao-Editorial-Enciclopedia](core.md#padrao-editorial-enciclopedia) e [Fontes-e-Proveniencia-Growth](core.md#fontes-e-proveniencia-growth): lacunas explícitas, vigência separada de atualização e estado de implementação.
- Fichas enriquecidas com aplicação, objeções, operação e pendências. Contexto +amigo e sete guardrails observados no Supabase com data de corte.
- Correções documentais de CPF, BOM e contagem 36/38; preservação de histórico.
- Convenções publicáveis, entradas de ADR e acervo Vibe para resolver destinos de links.
- Detalhes e limites em [Auditoria-Contexto-Vault-2026-10-02](ia.md#auditoria-contexto-vault-2026-10-02). Publicação no GaaS exige run concluído e comparação de hashes; consultar validação em `outputs/vault-context-2026-10-02/`.

## 2026-09-29 — Vault integrado ao loop de Aprendizado e Memória

- A biblioteca deixou de ser uma aba primária de **Análise** e passou a ser uma seção de **Análise → Aprendizado e Memória**, ao lado de Fila, Report Live, Apostas, Outcomes e Memória.
- A navegação agora explicita os papéis: **Vault** é a fonte canônica de contexto; **Memória** reúne aprendizados validados e reutilizáveis pelo loop.
- O índice passou a carregar somente metadados, com paginação de 60 notas, filtros por pasta e contagens; o conteúdo Markdown e os backlinks são buscados apenas ao abrir uma nota.
- Foram adicionados estados de carregamento, erro e vazio, busca com limpeza, links profundos e retomada confiável da seleção.

## 2026-09-28 — Vault visual e vivo dentro do GaaS

- Criada [GaaS-Vault-Library](engenharia.md#gaas-vault-library): o Obsidian/OneDrive permanece como fonte canônica e o Supabase passa a guardar uma projeção autenticada, pesquisável e auditável.
- A primeira versão da biblioteca ofereceu árvore de pastas, busca full-text em português, reader Markdown, navegação por wikilinks, abertura no Obsidian, indicador de atualização e sincronização administrativa da pasta.
- Contrato explícito de RLS, revisions append-only, tombstone após run completo e ausência de embeddings no MVP.

## 2026-09-04 (2) — Ficha de Produto editável por completo + guia de redação

- "Recap do produto" → **Ficha de Produto**. Contexto de marca vira bloco full-width de 5 linhas ("vários parágrafos, não uma frase"); público elegível ganha dica de incluir o tamanho do público endereçável (ex.: 800K+ CPFs, ≠ base do Clube). Dicas de preenchimento por campo.
- **Todas as regras do produto** agora aparecem na Ficha (não só a contagem), agrupadas por tipo, **cada uma editável inline** com `descartar|salvar` via `saveProductGuardrail` (novo em managementService — grava só as colunas pré-migration). Benefícios idem.
- Nota nova [Ficha-de-Produto-Guia](operacao.md#ficha-de-produto-guia) (`04-Operacao/`): o que a IA deve seguir para escrever uma Ficha de Produto que "atende bem" — princípios, campo a campo, barra de qualidade, exemplos. Commit `1fa58b4`, deploy ok.

## 2026-09-04 — Recap do produto no Plano de Comunicação + taxonomia de régua/benefício

- [Fabrica-de-Emails-GaaS](operacao.md#fabrica-de-emails-gaas): "Referências de produto" saiu da aba Regras e virou **card full-width no topo** (identidade completa + benefícios por categoria com vigência derivada + contagem de regras + edição inline da ficha + nota de que IA pode preencher). Commit `23b9c0a`, deploy ok. Migration `20260904120000` (benefit structure: `category`/`value_exact`/`citation_status`/`source_type`/`source`) **enfileirada — não há CI de migration, aplica manual**.
- **Pesquisa registrada:** "segmento" hoje = 4 vocabulários sobrepostos (frente · etapa de funil · segmento · lifecycle_family). Frente Aquisição usa funil e tem os 10 segmentos, mas só `Base_Proprietaria` (Topo) tem e-mail.
- **Modelo proposto** (4 dimensões ortogonais): `frente` (3, +institucional) · `objetivo_da_regua` (8: venda_cartao, ativacao, engajamento, reativacao, cross_sell, cobranca, transacional, institucional) · `estagio` · `produto_alvo`. + `tipo_comunicacao` (campanha/operacional/transacional) governando quais guardrails aplicam.
- **Decisões do Pablo:** Captação/Investimento = `cross_sell` interno (alvo = cliente de cartão); Transações = fora da Fábrica por ora; Cross Sell não fragmenta por produto (um objetivo + `produto_alvo`).

## 2026-09-03 — Plano de Comunicação compacto e mais útil

Atualizada [Fabrica-de-Emails-GaaS](operacao.md#fabrica-de-emails-gaas) (seção Plano de Comunicação e lacuna P1 nº 9):

- Os três blocos de topo empilhados (título+subtítulo, seis filtros em caixas, dois conjuntos de chips de contagem, abas de Produto, cabeçalho de Régua) viraram **uma toolbar de ~2 linhas** — o cromo antes do primeiro e-mail caiu de ~400 px para ~67 px. Contagem em linha única; filtro "Parceiro" removido (as pills de Produto fazem a seleção); "Regra aplicável" movido para a aba Regras.
- **Lista de e-mails**: uma linha por e-mail agrupada por semana, com papel na régua, barra `N/11`, bolinha de status e **bolinha de aderência ao briefing** (assunto do briefing × mensagem-chave do plano).
- **Painel do plano**: modo **ficha** (11 diretrizes como rótulo:valor, edição inline por linha) + "Editar tudo" abrindo o formulário completo em accordion de 3 etapas. "Salvar versão" só habilita com mudança real.
- **Planejado × executado** passou a puxar o briefing vinculado pelo `campaignGroupId` e comparar mensagem-chave × assunto, objetivo × pré-cabeçalho, benefício × copy, CTAs × `TITULO_CTA`/`LINK_CTA` — fecha parcialmente a lacuna P1 nº 9.
- Toggle **Compacto / Confortável** lembrado no navegador.

## 2026-09-03 — Fábrica de E-mails: leva de melhorias de layout, prévia e revisão

Atualizada [Fabrica-de-Emails-GaaS](operacao.md#fabrica-de-emails-gaas) com as mudanças de interface entregues no módulo `dynamic-email` do GaaS:

- **Rolagem única.** As três colunas (Caixa de briefings · editor · prévia) rolam juntas numa só barra; a Caixa e o editor saem da tela ao chegar ao fim e a prévia continua. Removidas as rolagens internas concorrentes e a biblioteca `react-resizable-panels` — os divisores viraram um resizer próprio com largura persistida e duplo-clique para restaurar. Único elemento fixo: **Salvar briefing**.
- **Prévia sempre em desktop.** O e-mail renderiza num viewport fixo de 680px e é reduzido por escala; nunca cai no layout mobile dentro da prévia. A peça aparece em altura total, sem rolagem própria.
- **Régua de estrutura na prévia** liga cada bloco visível ao bloco do editor; a âncora passou a ignorar tokens AMPscript (`%%=v(@X)=%%`), corrigindo o caso em que o Bloco principal da régua B2C institucional sumia do trilho porque o título era só `Olá, %%=v(@FirstName)=%%`.
- **Campos fixos no template ficam bloqueados** com o selo "fixo no AMP" quando o HTML/AMPscript chumba o valor (ex.: rodapé CAN-SPAM).
- **Assunto/Pré-cabeçalho** viraram linhas rotuladas `ASSUNTO:` / `PRÉ-CABEÇALHO:` (não mais mock de caixa de entrada).
- **Barra de controles da prévia minimizável** (botão *Minimizar / Controles*, escolha lembrada): recolhe texto de apoio, seletor de template e rótulos dos botões — cabeçalho da prévia de ~230px para ~90px. **Nome de teste** e **Limite de teste** saíram da barra e entraram no bloco *Informações da mensagem* do editor (amostra só de simulação, fora do CSV).
- **Revisor da semana/régua compactado:** cada e-mail é uma linha (~40px) com ordem, status, assunto, **barra do Plano de Comunicação `N/11`**, ativos, variações e **botão editar na linha**. A seta expande e mostra papel na régua, objetivo, mensagem-chave, ação esperada, benefício principal, pré-cabeçalho e *assunto planejado × atual*, com atalho **Ver no Plano de Comunicação →**. Os cinco cartões de métrica viraram uma linha única.
- Ordenação da árvore de parceiros por volume de briefings; slots de aquisição vazios sem rótulo de status.

## 2026-09-03 — Contrato CSV da Fábrica corrigido contra arquivo real do SFMC

- Comparado o export do GaaS com um arquivo baixado da própria `TB_BRIEFING_CAMPANHA_AQUISICAO`: o GaaS usava `;`, mas o SFMC usa `,` com quote mínimo.
- Corrigida a documentação para UTF-8 sem BOM, CRLF, 36 colunas, uma linha física por registro e datas de importação `MM/DD/YYYY HH:mm:ss`; o download localizado em DD/MM não reflete a validação do wizard.
- A regra anterior de ponto e vírgula foi explicitamente revogada para não voltar a orientar o exportador incorretamente.

## 2026-09-02 — Fábrica de E-mails consolidada como produto operacional

- Criada [Fabrica-de-Emails-GaaS](operacao.md#fabrica-de-emails-gaas) com definição do produto, usuários, decisões, navegação, inventário funcional, arquitetura Supabase, contratos SFMC e fronteiras operacionais.
- Documentados o Revisor semanal e da régua completa, prévia projetada versus **Observações MKT**, biblioteca de ativos, assinaturas Plurix, templates compartilhados, Plano de Comunicação, revisão externa sem IA embutida e modal de criação de réguas para Aquisição/Rentabilização.
- Registradas 14 lacunas em três prioridades. P0: criação não atômica, `dynamic_email_ruler_segments` ainda sem gravação no fluxo e rollback parcial. P1: governança/materialização de segmentos, herança real, arquétipos, taxonomia limitada, famílias livres e comparador parcial. P2: performance, experimentos, QA de clientes, dependência das URLs e publicação SFMC.
- [Emails-Dinamicos-SFMC](operacao.md#emails-dinamicos-sfmc) corrigida: os slots de Template-fonte agora são compartilhados no Supabase e a dívida dos oito templates B2C foi resolvida com um template dinâmico canônico; Test Send permanece pendente para certificação dos oito e-mails.

## 2026-08-20 — Dicionário de Produtos + Vibe consolidado como camada institucional

- **Pasta nova [Dicionario-de-Produtos](dados.md#dicionario-de-produtos)** (`02-Entidades-Dados/`): registro canônico dos quatro cartões — [Cartao-Afinz-Visa](dados.md#cartao-afinz-visa), [Cartao-Amigo-Afinz-Visa](dados.md#cartao-amigo-afinz-visa), [Cartao-Bem-Mais-Afinz-Visa](dados.md#cartao-bem-mais-afinz-visa), [Cartao-Dia-Afinz-Visa](dados.md#cartao-dia-afinz-visa) — com nome na copy, proposta de valor, público, tom de voz e encanação técnica. Construído por raspagem de fontes públicas em 19–20/08, com URL para cada afirmação e classificação OFICIAL / TERCEIRA / INTERNO.
- **[Beneficios-e-Vigencia](dados.md#beneficios-e-vigencia) — o guardrail que faltava.** Todo benefício citável vira linha com `vigente_de` / `vigente_ate` / fonte / dono, e a coluna `STATUS` é **fórmula contra `=TODAY()`**. Benefício com data de fim no passado se marca `EXPIRADO` sozinho. Regra que a nota cria: *nenhum benefício entra na copy sem linha vigente*.
- **Achado que motivou tudo:** o **programa de pontos do +amigo encerrou em 01/07/2026** e o resgate **expirou em 31/07/2026** — e as páginas de bandeira do Compre Mais e do Superpão **ainda o anunciavam** em 20/08. Quem copiasse delas escreveria peça sobre programa morto. O que faltava na nossa base não era o dado, era o **campo de validade**.
- **[Pode-Dizer-Nao-Pode-Dizer](dados.md#pode-dizer-nao-pode-dizer)**: 19 proibições com fonte e severidade (BLOQUEADOR / ALTA / MÉDIA), mais o registro do que é seguro afirmar por produto.
- **[Vibe](core.md#vibe) reescrita**: deixa de ser "oferta dominante" e passa a **camada institucional** (lock-up `afinz + ViBE`). Mapa confirmado — **B2C ✅ · Dia ✅ · Bem Mais ✅ · +amigo ❌**, com o **mesmo pacote nos três** (R$100 na ativação + R$30 por fatura paga). A versão anterior falava em "eventual App Vibe"; o app existe e a integração tem roadmap de duas fases.
- **A distinção que mais afeta copy:** ganhar crédito ≠ ter a jornada no app. O **Bem Mais ganha os créditos mas seu app é whitelabel** — sem opt-in, saldo ou extrato. Toda a [Regua-Vibe-Ativacao](core.md#regua-vibe-ativacao) pressupõe o app Afinz e **não funciona para ele**. Registrado como buraco aberto.
- **[Regua-Vibe-Ativacao](core.md#regua-vibe-ativacao) nova**: régua oficial D+7 / D+15 / D+30 / pós-D+30, de **rentabilização**, não de aquisição — não existia em nenhuma taxonomia nossa. Inclui o segundo buraco: o público **elegível, com cartão e sem opt-in**, que não ganha nada e não está mapeado.
- **Correção de público:** pertencer ao clube **não é requisito para pedir o cartão** — é condição para **resgatar o desconto**. Vale para DIA e +amigo. O passo "entre no clube" pertence à régua de **ativação**, e hoje não existe em régua nenhuma.
- **[Formatacao-WhatsApp-Variaveis-e-Espacamento](operacao.md#formatacao-whatsapp-variaveis-e-espacamento) nova**: variável de WhatsApp é `{{n}}` posicional da Meta, **nunca** `%%TAG%%` — e o espaçamento faz parte da copy. Corrige um erro real cometido em 19/08 numa régua de 14 briefings.
- **[Motor-de-Briefing-Automatico](core.md#motor-de-briefing-automatico) nova**: as 6 camadas para a IA montar briefing sozinha, com guardrails determinísticos e contra-visão adversarial. A camada 2 (benefícios vigentes) foi resolvida nesta mesma leva.
- **[Conflitos-de-Fonte-Produtos-2026-08](#conflitos-de-fonte-produtos-2026-08) nova**: 14 casos em que duas fontes **oficiais** divergem — sorteio Vibe R$100 mil vs R$10 mil (com regulamento expirado em 11/05/2026), Você Bem farmácia 70% vs 35%, educação 40% vs 80%, "ativação" vs "primeira compra", cartão virtual de 1h vs virtual pleno, e a Tabela de Tarifas **sem data de vigência**.
- **Risco de parceiro documentado:** o **cartão DIA pode estar dormente** — sem comunicação pública desde nov/2024, sem página de produto ativa, e o DIA fechou **343 das 587 lojas**, operando só em SP.
- **Correções à base:** "Tudão" **não é** bandeira Plurix (nenhuma fonte confirma); [Bandeiras-Plurix](core.md#bandeiras-plurix) lista 6 redes mas a lista oficial tem **8** — faltam **Mega** e **Dom Olívio**, e Dom Olívio é justamente a que quebra o padrão de 5% (vinhos 20%, carnes 10%) e tem restrição de praça.

## 2026-08-19 — Correção de fato: `CPF` é único · régua avança in-place

- **Correção em [Emails-Dinamicos-SFMC](operacao.md#emails-dinamicos-sfmc) e [Emails-Dinamicos-Plurix](operacao.md#emails-dinamicos-plurix):** a nota original de 2026-08-10 afirmava que `CPF` **não** era único na `TB_CAMPANHA_AQUISICAO` e que a mesma pessoa aparecia várias vezes. **Estava errado.** A duplicidade observada veio de testes fechados iniciais com CPFs fabricados, não do modelo de produção. Em produção, `CPF` é **chave primária: 1 linha por pessoa**.
- **Consequência de desenho:** cai o modelo de "1 arquivo de carga por sequência". Passa a ser **um arquivo só**, e a régua avança **dentro da própria DE de audiência** — `SEQUENCIA` é campo de estado, atualizado in-place pelo `Update Contact` da jornada.
- **Isso exige leitura ao vivo no e-mail.** O Journey Builder congela os dados de entrada num snapshot, então `[SEQUENCIA]` devolveria para sempre o valor da entrada. O template passa a ler a DE no momento do envio com `LookupRows(@DE_AUDIENCIA, "CPF", @SubscriberKey)`, com fallback para `AttributeValue()`. Isso é o que permite **um único e-mail dinâmico servir a régua inteira**.
- **Achado sobre `RaiseError`:** o segundo parâmetro `true` pula o assinante e segue; `false` tentaria parar o job, mas a Salesforce documenta que por causa dos retries internos frequentemente **não** para. `true` não é só o mais seguro — é o único com comportamento previsível. Falhar alto custa 1 e-mail, não a campanha.
- **Lição de processo:** a afirmação errada estava no vault desde 10/08 e foi replicada em 5 arquivos derivados sem ser questionada. Fato observado em ambiente de teste foi registrado como regra de produção.

## 2026-08-18 — Framework de e-mail dinâmico Plurix (6 bandeiras, 1 template)

- **Nota nova [Emails-Dinamicos-Plurix](operacao.md#emails-dinamicos-plurix)**: implementação completa e **autocontida** do motor para a BU Plurix. Escrita para ser reproduzível por um agente sem contexto prévio — inclui o AMPscript verbatim, o rastreamento das 36 colunas (coluna → variável → onde renderiza), a spec do HTML, o procedimento de import, o QA automatizável e o log de decisões com razão.
- **Nota nova [Bandeiras-Plurix](core.md#bandeiras-plurix)**: Plurix não é um parceiro, é holding com 6 redes (Amigão, Boa, Avenida, Compre Mais, Paraná, Superpão). Todos os assets por bandeira — rodapé, deeplink OneLink, site, variações de imagem — e a convenção de nomenclatura de `NM_PRODUTO_INTERNO`.
- **Achado estrutural:** o que varia entre bandeiras é só rodapé + deeplink, porque todas vendem o mesmo cartão `+amigo`. Isso coube em colunas que já existiam (`BANNER_3_CORPO` estava vazia em 100% das linhas do institucional) — **1 e-mail serve as 6, zero coluna nova**.
- **Modelo de escala adicionado a [Emails-Dinamicos-SFMC](operacao.md#emails-dinamicos-sfmc)**: o número de templates é função de quantas *identidades visuais* existem, não de quantas BUs. B2C = 1 (resolvido), Plurix = 1 marca com 6 assinaturas (resolvido), B2B2C = N marcas de cartão (em aberto). O que trava B2B2C são 4 valores chumbados no HTML (logo + 3 cores).
- **Lacuna documentada:** `UTM_CAMPANHA` é preenchida e **nunca lida** pelo template — verificado por parsing, zero `utm_` no HTML nos 5 `RedirectTo`. Vale para o institucional também: a atribuição de campanha no destino está cega.
- **`TB_BRIEFING_JORNADAS` confirmada como camada separada** por varredura do repositório: aparece só em prosa, zero referências em código.
- **Base real analisada** (`CRM_PLURIX_202603_GC1`, topo de funil): 95.266 pessoas → **73.078 endereçáveis**. 9.058 têm e-mail preenchido mas sem flag de canal — filtrar pelo campo em vez das flags dispararia indevidamente para elas.
- **Separação entrega × auditoria** ([Emails-Dinamicos-Plurix](operacao.md#emails-dinamicos-plurix) §15): `CAMPANHA` (activity_name) e `UTM_CAMPANHA` passam a ser tratados como **camada de auditoria não-bloqueante**. Nenhum dos dois entra na chave, renderiza ou afeta entrega — travar disparo válido por etiqueta de tracking ausente custa mais do que disparar sem ela. Ajuste concreto pendente: rebaixar de `erro` para `aviso` a regra de placeholder de `UTM_CAMPANHA` no módulo `dynamic-email` do GaaS, **depois** de fechar a lacuna de consumo da UTM.

## 2026-08-10 — Emails Dinâmicos SFMC documentado (validado ponta a ponta)
- **Nota nova [Emails-Dinamicos-SFMC](operacao.md#emails-dinamicos-sfmc)**: motor único de e-mail no Content Builder que resolve conteúdo via AMPscript/`LookupOrderedRows` contra `TB_BRIEFING_CAMPANHA_AQUISICAO`, casado por chave composta `NM_PRODUTO_INTERNO + TP_CAMPANHA + SEQUENCIA` com `TB_CAMPANHA_AQUISICAO` (audiência).
- **Validado em produção de teste**: caso Plurix (`+amigo`/Amigão Supermercados) reaproveitando o mesmo template do Afinz Visa institucional, via Test Send.
- **5 pitfalls documentados**, descobertos em ~6 rodadas de import com erro: formato de data do wizard é MM/DD (não DD/MM) e não autodetecta; checkbox de qualificador de aspas duplas desmarcada por padrão a cada import; quebra de linha crua dentro de campo quoted invalida a linha inteira; placeholders da analista (`PEGAR NA BASE`, `CRIAR`) quebram o lookup silenciosamente; filtro de entrada da Jornada é independente da chave do briefing.
- [SFMC-Salesforce-Marketing-Cloud](operacao.md#sfmc-salesforce-marketing-cloud) e [MOC-Operacao](core.md#moc-operacao) linkados à nota nova.

## 2026-07-22 — Central de Funis + handoff Codex/Claude
- Criada [Funis-de-Onboarding-GaaS](#funis-de-onboarding-gaas) com as três visões em produção: Apps, Serasa e Mídia Paga, incluindo padrão visual, taxas, granularidades e limites de compatibilidade.
- Criada [Funil-Onboarding-Arquitetura-e-Ingestao](engenharia.md#funil-onboarding-arquitetura-e-ingestao) com o contrato Meta certificado, arquitetura Supabase, collector, views, maturação, aliases e estados de observação.
- Registrada a colaboração assíncrona no arquivo `09-Inteligencia-IA/Handoff-Codex-Claude-Funil-Meta.txt`, incluindo descoberta de `results`, certificação do StartTrial atribuído e bloqueio de SubmitApplication.
- [Decisões-Tomadas](#decisões-tomadas) recebeu quatro ADRs para impedir soma incompatível, proxies de evento e confusão entre ausência e zero.

## 2026-06-11 — Export Copa v2 implementado + 2 tabelas novas populadas
- **Código em produção** (commit `6843143` na main, auto-deploy GH Pages): `rentabilizacaoCrmExcelExport.ts` v2 — bloco fixo da aba "Rentabilização Copa" expandido de 7 para **25 colunas**, agora preenchidas automaticamente. Grupos: LP Visa GA4 (tráfego, opt-ins etapa), BI Visa oficial (opt-ins, cartões/dia), Mídia Total / Google / Meta (spend, cliques, CPC, impressões, CTR, CPM) + Custo/Opt-in (spend ÷ opt-ins Visa, nunca CAC). Linha 1 = totais do período por fórmula. Arquitetura em [Export-XLSX-Renta-Copa](engenharia.md#export-xlsx-renta-copa).
- **Tabelas novas criadas e populadas no Supabase** (migration `create_copa_lp_and_visa_daily`): [copa_lp_daily](dados.md#copa_lp_daily) (559 linhas, 58 dias 15/04–11/06, via export CSV do Looker lido pelo agente Chrome) e [copa_visa_daily](dados.md#copa_visa_daily) (15 dias 27/05–10/06, do print do BI Visa).
- **Reconciliação das fontes resolvida**: "Optins LP" do acompanhamento manual = usuários em `/cadastro/optins` (GA4); fonte oficial de opt-in = **Clientes do BI Visa** (gap de captura GA4 ~39% documentado). VDV = base existente ([Glossário-de-Siglas](#glossário-de-siglas)).
- Fetchers resilientes: fonte indisponível gera `console.warn` e coluna vazia, sem derrubar o export.
- **Validado pelo operador em 2026-06-11**: export testado em produção e funcionando. Pendência residual: `optins_sucesso` zerado no diário (limite de séries do gráfico Looker).

## 2026-06-11 - Conversão Opt-in Copa Visa e extração diária do Looker
- [Copa-2026](core.md#copa-2026) registra o Opt-in concluído na LP como conversão oficial e exclusiva da campanha Meu Afinz Visa Bate Um Bolão, em parceria com a Visa.
- [Dossie-Mestre-Operacao-CRM-Midia](ia.md#dossie-mestre-operacao-crm-midia) ganha o contrato da tabela diária por grupo de mídia, com LP, etapa de Opt-in, sucesso, taxas, linha total de controle e regras de qualidade.
- Registrada a distinção entre chegada à página `/cadastro/optins`, proxy `/cadastro/sucesso` e Opt-in transacional confirmado.
- Expansão prevista da aba `COPA` do XLSX com CTR, CPC, CPM, frequência e custo por Opt-in por canal, sem tratar custo por Opt-in como CAC.

## 2026-06-10 — SDD Complemento — UX Reference & Implementation Guide
- **Complemento criado** `calendar-estrategico/docs/SDD_EXPERIMENTOS_KANBAN_COMPLEMENTO.md`: biblioteca de componentes prontos para implementação (ExperimentCard com borda esquerda por canal, StatusBadge com pulsing dot, SampleProgressBar com bloqueio de decisão, LiftPlot CI horizontal sem Recharts, ConversionSparkline com `isAnimationActive=false`), features adicionais (SRM detection, batting average por canal, Learning KB com view_count e aprendizado obrigatório), ExperimentsView estrutura completa com 3 sub-tabs (Kanban/Aprendizados/Programa).
- **Discovery**: `DiarioBordo.tsx` já tem slot para `<ExperimentsView />` — sem nova rota necessária.
- **Correção de cor**: SMS e WhatsApp tinham mesma cor (#10B981) — padronizado para SMS=amber, WhatsApp=emerald.

## 2026-06-10 — SDD do gestor de experimentos aprovada
- **Spec criada** `calendar-estrategico/docs/SDD_EXPERIMENTOS_KANBAN.md`: migration SQL (tabelas `experiments` + `experiment_activities` + view `vw_experiment_metrics`), Z-test bicaudal (α=0,05, poder=80%), card design (delta conv + progresso amostra + ICE badge + owner), kanban 3 colunas + repositório Booking-style, auto-attach por `Oferta+Promocional` (par composto obrigatório), 5 fases de implementação, integrações com Orientador e ProgramarDisparoModal.
- **Regra crítica registrada**: chave de intenção de oferta = par composto `(Oferta, Promocional)` — nunca campo isolado. [Sistema-de-Experimentacao-Referencias](core.md#sistema-de-experimentacao-referencias) e memory atualizados.
- Decisões de UX confirmadas pelo operador: captura na tela, cadência semanal, confirmação manual da decisão (não automática).

## 2026-06-10 — Pesquisa do sistema de experimentação + validação retroativa
- Nota nova [Sistema-de-Experimentacao-Referencias](core.md#sistema-de-experimentacao-referencias): benchmarks (Booking 25k testes/ano e repositório de fracassos; iFood "Faster"; ICE/GrowthHackers; padrão warehouse-native Eppo/GrowthBook), 6 princípios do nosso sistema e validação retroativa do modelo `experiments + experiment_activities` contra 2 casos reais.
- **Achado**: provável causa da virada de mar/26 no [Carrinho-Abandonado](core.md#carrinho-abandonado) — estratificação por recência (subgrupos D-7/D-21 isolados do Diario) + escala no núcleo; WhatsApp Diario 8,42%→24,05%. Era um experimento natural sem registro.
- Indexada no [MOC-Estrategia](core.md#moc-estrategia) (junto com [Ativacao-de-Audiencias-Diaria](core.md#ativacao-de-audiencias-diaria)).

## 2026-06-10 — Rede de campanhas-tipo + hub de plataformas (a-validar)
- **Hub novo [Plataformas-de-Comunicação](core.md#plataformas-de-comunicação)**: SFMC (E-mail/SMS/WhatsApp/Push; InApp inexistente), Meta (3 contas), Google, matriz segmento×canal real e diagnóstico das audiências Meta lidas via MCP (CSVs manuais congelados, sem convenção de nome).
- **4 campanhas-tipo viram conceitos de 1ª classe**: [Topo-de-Funil](core.md#topo-de-funil), [Repescagem](core.md#repescagem), [Upgrade](core.md#upgrade), [Carrinho-Abandonado](core.md#carrinho-abandonado) — cada uma com a chave em todas as camadas (CRM, diarizado, Meta atual, audiência proposta, af_adset) + performance ponderada.
- **Convenção de naming proposta** para audiências dinâmicas: `crm_<bu>_<bloco>_daily` (casa com af_adset e com as 6 bases do pipeline S3). Status a-validar pelo Pablo.

## 2026-06-10 — Ativação de audiências diária (decisão Rota B)
- Nota nova [Ativacao-de-Audiencias-Diaria](core.md#ativacao-de-audiencias-diaria): pesquisa das 3 rotas (Salesforce nativo em sunset, S3+APIs diretas ✅, ferramentas pagas), desenho do pipeline SFMC→S3→Meta/Google e requisitos das plataformas (Data Manager API do Google substitui Customer Match na Ads API).
- [Decisões-Tomadas](#decisões-tomadas) +1 ADR (Rota B escolhida).

## 2026-06-10 — Granularização ponderada (Safra × BU × Segmento + mídia até ad)
- **Safra normalizada no Supabase** (`06/26`→`2026-06`, `05/26`→`2026-05`; 128 linhas) — [Inconsistências-a-Corrigir](#inconsistências-a-corrigir) marca como corrigida.
- **4 views ponderadas criadas** (migration `create_weighted_performance_views`): nota nova [Views-Performance](dados.md#views-performance); indexadas em [Supabase-Schema](dados.md#supabase-schema) e no [Runbook-Vault-Vivo](ia.md#runbook-vault-vivo).
- **[Evolução-Temporal](dados.md#evolução-temporal)** ganhou leitura de cohort por safra (achado: virada de eficiência fev→mar/26 em Abandonados, CAC ÷3 e conversão ×3,6 — investigar causa).
- **[Decisões-Tomadas](#decisões-tomadas)** +1 ADR: views ponderadas como fonte única de agregação (fim do `avg` de taxas).

## 2026-06-10 — Camada de atribuição AppsFlyer + reidratação
- **Nota nova [AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm)**: governança `pid=crm`, mapeamento de parâmetros, conversão em 2 níveis (`account_created`/`account_approved`), OneLink por canal (`cartao-afinz.onelink.me/9ODN`), condições do deep link e planilha geradora de links.
- **[Decisões-Tomadas](#decisões-tomadas)** +4 ADRs de atribuição; **[Decisões-Abertas](#decisões-abertas)** +4 (UDL no app, OneLinks restantes, postback de eventos, tabela-mestre de links); **[Roadmap-Framework](core.md#roadmap-framework)** ganhou a frente transversal de atribuição.
- **Snapshots reidratados** (base re-ingerida: activities 4.606→4.459, jornadas 330): [Canais](legado.md#canais), [Segmentos](legado.md#segmentos), [BUs](legado.md#bus), [CAC-por-Canal](dados.md#cac-por-canal), [Performance-por-Segmento](dados.md#performance-por-segmento), [CPA-por-Plataforma](dados.md#cpa-por-plataforma), [Jornada](core.md#jornada), [Supabase-Schema](dados.md#supabase-schema).
- **Contexto de campanhas**: [campaign_context](dados.md#campaign_context) detalhada (7 campanhas, 4 frentes); [Copa-2026](core.md#copa-2026) enriquecida (Bate Um Bolão, ondas, 328 disparos); [Inconsistências-a-Corrigir](#inconsistências-a-corrigir) +8 incongruências de taxonomia SFMC vindas da skill `copa-crm-parser`.

## 2026-06-08 — Expansão completa (CRM + Mídia Paga + IA)
- **Mídia paga** ganhou camada completa: conceitos ([Mídia-Paga](core.md#mídia-paga), [Métricas-de-Mídia](core.md#métricas-de-mídia), [Spend-to-Card](core.md#spend-to-card)), dimensões ([Plataformas-Mídia](legado.md#plataformas-mídia), [Objetivos-de-Campanha](legado.md#objetivos-de-campanha), [Criativos](legado.md#criativos)), 7 entidades novas, performance ([CPA-por-Plataforma](dados.md#cpa-por-plataforma), [Spend-e-Tendência](dados.md#spend-e-tendência), [Eficiência-de-Criativo](dados.md#eficiência-de-criativo)) e [MOC-Midia-Paga](core.md#moc-midia-paga).
- **Nova camada `09-Inteligencia-IA`**: [Vault-como-Contexto](core.md#vault-como-contexto), [MCP-Visão-Geral](ia.md#mcp-visão-geral), [Skills-do-Projeto](ia.md#skills-do-projeto), [Agentes-e-Workflows](ia.md#agentes-e-workflows), [Obsidian-MCP](ia.md#obsidian-mcp), [Runbook-Vault-Vivo](ia.md#runbook-vault-vivo).
- **Links órfãos corrigidos**: [Pilar-Automação-por-Histórico](legado.md#pilar-automação-por-histórico), [Metas-e-CAC](dados.md#metas-e-cac), [Supabase-Schema](dados.md#supabase-schema), [Jornada-Disparos](legado.md#jornada-disparos), [Resultados](legado.md#resultados), [Originação-B2C](legado.md#originação-b2c).
- **Domínios CRM novos**: [SFMC-Salesforce-Marketing-Cloud](operacao.md#sfmc-salesforce-marketing-cloud), [Diário-de-Bordo](legado.md#diário-de-bordo), [Anti-Overlap-Pressão-de-Contato](core.md#anti-overlap-pressão-de-contato), [Vibe](core.md#vibe), [Copa-2026](core.md#copa-2026), notas-aba ([Launch-Planner](legado.md#launch-planner), [Relatório](legado.md#relatório), [Explorador-Avançado](legado.md#explorador-avançado), [Configurações](legado.md#configurações)).
- **Governança**: [Decisões-Tomadas](#decisões-tomadas), [Mapa-de-Oportunidades](dados.md#mapa-de-oportunidades), [Convenções-do-Vault](core.md#convenções-do-vault).
- Snapshots reidratados contra Supabase real (activities 4.606, runs 9, insights 249).

## 2026-06-08 — Base inicial
- 58 notas em 9 camadas (00–08), camada de engenharia gerada via Claude Code.

## Relacionado
- [🏠 HOME](core.md#-home) · [Histórico-de-Evolução](legado.md#histórico-de-evolução) · [Convenções-do-Vault](core.md#convenções-do-vault)


---

## Auditoria-Jornadas-SFMC-2026-10

> **tags:** `evidencia, sfmc, jornadas, auditoria, copy, rastreio, parceiros` | **tipo:** `evidência` | **camada:** `evolucao` | **atualizado:** `2026-10-07` | **status:** `a-validar` | **fonte:** `pacotes-package-manager-e-supabase-activities`

# Auditoria de jornadas SFMC (out/2026)

**Definição e propósito:** o que a leitura dos pacotes do Package Manager (06 e 07/10/2026), cruzada com o vault e com `activities`, mostrou sobre as jornadas de aquisição. Serve de ponto de partida para correções e para a lista de lógicas a confirmar.

> **Regra de leitura (Pablo, 07/10/2026):** muitas inconsistências aqui são **lógicas do CRM ainda não documentadas**; só parte é erro pontual. Cada item abaixo está num de três baldes: **erro confirmado**, **hipótese a testar** ou **lógica a perguntar**. A lista viva de lógicas fica em `.claude/skills/sfmc-jornadas-pacote/references/logicas-crm.md`.

## Contexto e conceitos

Pacotes lidos: Plurix CRM SEM1 (1 jornada), B2C NGD v1 (5) e v2 (30 jornadas: NGD, ANC, topo Tudão, Clube Bem Barato, carrinho B2C e Bem Barato) e carrinho 21D/sábado (14 jornadas, mai a set/26). Resultados de `activities` consultados em 06/10/2026, com setembro ainda imaturo.

## Padrões de jornada observados

| Padrão | Onde | Estrutura |
|---|---|---|
| E-mail dinâmico com estado | Plurix CRM | entrada `COMUNICACAO_PLX` (TIPO=CRM) com exclusões Contact Builder → decisão `LIMITE_CRD` → split 4×25% com esperas 0 a 3 dias → Update Contact `SEQUENCIA` em `ESTADO_SEQUENCIA_CRM` → e-mail V12 |
| Disparo WhatsApp com opt-out | NGD e ANC | entrada `DE_JORNADA_UNIFICADA_*` + 5 exclusões → decisão `MES_REF` + `CAMPANHA` → (split 50/50 + 1 dia) → template Meta → espera resposta 2 dias → "Não tenho interesse agora" grava `sem_interesse.resposta` ("ngd DDMM b2c"), que vira exclusão. Meta: app etapa 2 a 6. Saída: negado orgânico ou cliente ativo |
| SMS simples | NGD e ANC | mesma entrada e decisão, SMS do 29776 |
| Régua semanal de e-mail | topo Tudão e Clube Bem Barato | 4 e-mails + SMS para quem clicou, Update Contact de semana e bounce |
| Carrinho | B2C (institucional e eCred/Serasa) e Bem Barato | diário recorrente, 21D e sábado, ramos por `rede` |

## Resultados por parceiro (activities, ago e set/26)

| Parceiro | Achado |
|---|---|
| **Proprietária** | Repescagem: disp1 de set fez 435 cartões, CAC R$ 8,96, 4,3% de conversão; disparos seguintes rendem bem menos (ago Vibe WPP CAC R$ 49,90, SMS R$ 27,10). Upgrade: ago 7 cartões por R$ 3.036; set disp1 16 cartões, CAC R$ 97. Topo Tudão: ~1,2 milhão de e-mails para ~58 cartões, base `Tudao_B2C_202603` de março |
| **Serasa (carrinho eCred)** | maior ativo (880 a 940 cartões/mês); propostas passam da base (lead externo); D0 eCred com link genérico sem `af_sub` |
| **Bem Barato** | Repescagem ago: SMS 45 cartões CAC R$ 4,76 x WhatsApp 31 CAC R$ 17,40. Upgrade ago: 4 cartões (SMS). Carrinho: ~15 pessoas/dia e 0 cartões em set. Clube SEM2: 29 cartões, CAC R$ 6,40. Jornadas NGD/ANC de set ausentes de `activities` |

Hipótese a testar: concentrar a repescagem no D0 a D3 depois do `MES_REF` e reduzir os toques finais (e o Upgrade). Não validado.

## Achados por balde

**Erro confirmado**
- Repescagem B2C disparo6 (30/09, `b2c_repescagem`): `%%FirstName%%` e `%%State%%` no lugar de nome e limite.

**Hipótese a testar (Test Send ou log)**
- Upgrade B2C disparo3 (17/09): `${2}`=`LIMITE_CRD`, `${3}`=`ULTIMO_LIMITE` em "de R$ {2} para R$ {3}"; a versão Bem Barato usa a ordem inversa.
- `%%FirstName%%` em jornadas cuja DE tem `PRIMEIRO_NOME`/`FIRST_NAME` (carrinho B2C, 21D, Bem Barato, NGD/ANC BB).
- Linhas de `activities` a partir de 11/09/2026 com prefixo `JOR_AQS_` sem safra e sem resultado; Bem Barato set/26 ausente.
- Atividade `afz_car_vis_aqs_wpp_anc_dispvibe4_pontual` é SMS com `wpp` no nome (custo e canal errados no GaaS).

**Lógica a perguntar**
- Upgrade "menor" com link de repescagem (`af_sub1=negados`): copy reaproveitada é desenho ([Upgrade](core.md#upgrade)); a atribuição a Negados é intencional?
- Jornadas com o mesmo nome diferenciadas por espaço no fim; `JOR_AQS_` x `JOR_AQUISICAO_`; jornadas B2C na pasta "Aquisição VC Alvorada".
- Clube SEM3 entra por `CLUBE_BEM_BARATO_SET26` e grava semana em `CLUBE_BEM_BARATO_FEV26_v3`.
- Carrinho 21D set/26: atividades "serasa" usando o template institucional (`carrinho_b2c_sabado_sorteio`).
- `af_sub3` repetido entre disparos (disp4 e disp6 = `D5`); links de set/26 sem `af_sub3`.

## Copy x [Pode-Dizer-Nao-Pode-Dizer](dados.md#pode-dizer-nao-pode-dizer)

| Claim | Onde | Severidade |
|---|---|---|
| "Aproveite antes que essa oferta expire" / "Últimos dias" | NGD disparo3, BB NGD/ANC, ANC maior, SMS D4 carrinho | ALTA |
| Sorteio de R$ 100 mil | NGD disparo3, BB, ANC maior, carrinho sábado/21D | ALTA (regulamento expirado em 11/05/2026) |
| R$ 100 Vibe sem "anuidade ativa" | quase todo meio de funil e carrinho | ALTA |
| "Cartão virtual para usar na hora" no B2C | carrinho, ANC menor, NGD disp4/6 | ALTA |
| SMS sem "sujeito à análise de crédito" | SMS de NGD, ANC, carrinho | ALTA |
| "Limite de até R$ 6.000" | SMS ANC, carrinho sábado | ALTA (só com teto aprovado) |
| "Sua proposta foi reavaliada" | NGD disp1, SMS ANC menor BB | MÉDIA |

Padrão: os SMS de topo escritos depois de 20/08 já seguem as regras; a dívida está nos **templates de WhatsApp antigos aprovados na Meta** (`..._sorteio_mar26`, `..._1_2026`).

## Fontes e evidências

ZIPs do Package Manager (pastas Downloads do Pablo, 06 e 07/10/2026); consultas SQL em `activities` e tabelas de comunicação (06 e 07/10/2026); skill `sfmc-jornadas-pacote`.

## Lacunas e pendências

Respostas às lógicas acima, Test Send dos itens de hipótese e revisão em lote dos templates Meta. Dono: Pablo.

## Relacionado

- [SFMC-Package-Manager-e-Pacotes](operacao.md#sfmc-package-manager-e-pacotes) · [Comunicacoes-Pacote-SFMC-Catalogo](operacao.md#comunicacoes-pacote-sfmc-catalogo) · [Repescagem](core.md#repescagem) · [Upgrade](core.md#upgrade) · [Carrinho-Abandonado](core.md#carrinho-abandonado) · [Vibe](core.md#vibe) · [Cartao-Bem-Mais-Afinz-Visa](dados.md#cartao-bem-mais-afinz-visa) · [AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm) · [Formatacao-WhatsApp-Variaveis-e-Espacamento](operacao.md#formatacao-whatsapp-variaveis-e-espacamento)


---

## Catalogo-Analitico-CRM

> **tags:** `growth, resultados, catalogo, contexto-ia` | **tipo:** `catalogo-analitico` | **camada:** `evolucao` | **atualizado:** `2026-10-03` | **status:** `inferência` | **fonte:** `auditoria-integral-2026-10-02`

# Catálogo analítico — CRM

**Catálogo de possibilidades, auditado em 02/10/2026.** Não representa telas implementadas nem resultados certificados. Toda leitura deve acompanhar evolução mensal, cobertura e retrospectiva do mesmo recorte. A viabilidade registrada indica existência de campos; execução e decisão exigem os contratos e verificações descritos em [Resultados-Qualidade-e-Cobertura](resultados-1.md#resultados-qualidade-e-cobertura).

Use o sumário "Nesta página" para escolher um leque. Leia primeiro a pergunta e as condições; abra o histórico correspondente para consultar evidências. Esta organização reúne 80 possibilidades da auditoria anterior e preserva a data da avaliação.


## CRM — Panorama

| Possibilidade | Prontidão na auditoria |
|---|---|
| Produção mensal | Disponível |
| Funil mensal | Disponível |
| Mix de BU | Disponível |
| Variação mensal | Disponível |
| Acumulado comparável | Disponível |

## CRM — Segmentos

| Possibilidade | Prontidão na auditoria |
|---|---|
| Evolução por segmento | Disponível |
| Ranking de produção | Disponível |
| Participação mensal | Disponível |
| Base versus conversão | Disponível |
| Concentração de disparos | Disponível |

## CRM — Parceiros

| Possibilidade | Prontidão na auditoria |
|---|---|
| Evolução canônica | Disponível |
| Ranking de produção | Disponível |
| Mix mensal | Disponível |
| Concentração de parceiros | Disponível |
| Cobertura de classificação | Disponível |

## CRM — Segmento × parceiro

| Possibilidade | Prontidão na auditoria |
|---|---|
| Matriz de produção | Disponível |
| Matriz de conversão | Disponível |
| Histórico por combinação | Disponível |
| Ranking com volume mínimo | Disponível |
| Mudanças de participação | Disponível |

## CRM — Funil

| Possibilidade | Prontidão na auditoria |
|---|---|
| Base até cartões | Parcial |
| Propostas/base | Parcial |
| Aprovados/propostas | Parcial |
| Cartões/aprovados | Parcial |
| Gargalos mensais | Parcial |

## CRM — Canais

| Possibilidade | Prontidão na auditoria |
|---|---|
| Produção mensal | Disponível |
| Mix dentro do segmento | Disponível |
| Conversão comparável | Disponível |
| Dependência de canal | Disponível |
| Canal × parceiro | Disponível |

## CRM — Engajamento

| Possibilidade | Prontidão na auditoria |
|---|---|
| Aberturas de e-mail | Parcial |
| Cliques de e-mail | Parcial |
| Cliques/aberturas | Parcial |
| Aberturas WhatsApp | Parcial |
| Entrega por canal | Parcial |

## CRM — Custos

| Possibilidade | Prontidão na auditoria |
|---|---|
| Custo registrado mensal | Parcial |
| Cobertura de custos | Parcial |
| Custo/proposta | Parcial |
| Custo/cartão | Parcial |
| Custo versus produção | Parcial |

## CRM — Bases

| Possibilidade | Prontidão na auditoria |
|---|---|
| Volume acionado | Parcial |
| Acionável/total | Parcial |
| Distribuição de tamanho | Parcial |
| Disparos versus cartões | Parcial |
| Eficiência por tamanho | Parcial |

## CRM — Jornadas

| Possibilidade | Prontidão na auditoria |
|---|---|
| Histórico por jornada | Parcial |
| Pareto de jornadas | Parcial |
| Disparos equivalentes | Parcial |
| Calendário diário | Parcial |
| Ordem da régua | Parcial |

## CRM — Produtos e ofertas

| Possibilidade | Prontidão na auditoria |
|---|---|
| Produto por mês | Disponível |
| Conversão por produto | Disponível |
| Mix de ofertas | Disponível |
| Ações promocionais | Disponível |
| Oferta × segmento × parceiro | Disponível |

## CRM — Perfil e etapa

| Possibilidade | Prontidão na auditoria |
|---|---|
| Perfil de crédito mensal | Disponível |
| Conversão por perfil | Disponível |
| Etapas de aquisição | Disponível |
| Subgrupos | Disponível |
| Mix de elegibilidade | Disponível |

## CRM — Safras e calendário

| Possibilidade | Prontidão na auditoria |
|---|---|
| Safra declarada | Parcial |
| Safra × mês | Parcial |
| Dia da semana | Parcial |
| Distribuição no mês | Parcial |
| Persistência semanal/mensal | Parcial |

## CRM — Templates e emissões

| Possibilidade | Prontidão na auditoria |
|---|---|
| Templates por mês | Parcial |
| Produção por template | Parcial |
| Templates comparáveis | Parcial |
| Assistidas versus independentes | Parcial |
| Conciliação das emissões | Parcial |

## CRM — Diagnóstico

| Possibilidade | Prontidão na auditoria |
|---|---|
| Volume versus eficiência | Parcial |
| Outliers | Parcial |
| Contribuição para variação | Parcial |
| Top três disparos | Parcial |
| Persistência de sinais | Parcial |

## CRM — Qualidade e aprendizado

| Possibilidade | Prontidão na auditoria |
|---|---|
| Completude mensal | Parcial |
| Repetições | Parcial |
| Cobertura temporal | Parcial |
| Taxonomia e classificação | Parcial |
| Retrospectiva ligada às evidências | Parcial |

## Retrospectiva junto da análise

Escolher uma possibilidade não cria um aprendizado. Registrar a evolução do mesmo recorte, fatos e hipóteses separados, ação proposta e evidência necessária para verificar. Se fonte, vínculo, evento ou cobertura faltar, registrar a pendência. [Retrospectiva-Mensal-Growth](resultados-1.md#retrospectiva-mensal-growth) orienta esta etapa.

## Conexões

[Resultados-CRM](resultados-1.md#resultados-crm) · [Resultados-Midia-Paga](resultados-1.md#resultados-midia-paga) · [Resultados-B2C](resultados-1.md#resultados-b2c) · [Historico-Resultados-CRM](resultados-1.md#historico-resultados-crm) · [Historico-Resultados-Midia-Paga](resultados-1.md#historico-resultados-midia-paga) · [Historico-Resultados-B2C](resultados-1.md#historico-resultados-b2c).


---

## Catalogo-Analitico-Midia-B2C

> **tags:** `growth, resultados, catalogo, contexto-ia` | **tipo:** `catalogo-analitico` | **camada:** `evolucao` | **atualizado:** `2026-10-03` | **status:** `inferência` | **fonte:** `auditoria-integral-2026-10-02`

# Catálogo analítico — Mídia paga, B2C e conexões

**Catálogo de possibilidades, auditado em 02/10/2026.** Não representa telas implementadas nem resultados certificados. Toda leitura deve acompanhar evolução mensal, cobertura e retrospectiva do mesmo recorte. A viabilidade registrada indica existência de campos; execução e decisão exigem os contratos e verificações descritos em [Resultados-Qualidade-e-Cobertura](resultados-1.md#resultados-qualidade-e-cobertura).

Use o sumário "Nesta página" para escolher um leque. Leia primeiro a pergunta e as condições; abra o histórico correspondente para consultar evidências. Esta organização reúne 120 possibilidades da auditoria anterior e preserva a data da avaliação.


## Mídia paga — Investimento e distribuição

**Pergunta:** Onde colocamos recursos e como a distribuição mudou?

**Condições:** Separar Meta/Google e observar cobertura e renomeações; orçamento não é gasto.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Investimento mensal por plataforma | Descritivo |
| Participação de campanha no investimento | Descritivo |
| Distribuição por objetivo canônico | Descritivo |
| Concentração nas três maiores campanhas | Descritivo |
| Variação de investimento por campanha | Descritivo |
| Calendário de gasto diário | Descritivo |

## Mídia paga — Tráfego e eficiência

**Pergunta:** O custo de chegar ao público ou gerar tráfego mudou?

**Condições:** Recalcular a partir de somas do mesmo recorte. Google: 87 linhas com cliques > impressões e 225 divergências do CTR percentual.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Impressões e cliques mensais | Condicionado |
| CTR ponderado por campanha | Condicionado |
| CPC ponderado por campanha | Condicionado |
| CPM ponderado por campanha | Condicionado |
| Dispersão investimento × cliques | Condicionado |
| Decomposição gasto = impressões × CPM | Condicionado |

## Mídia paga — Campanhas e objetivos

**Pergunta:** Quais campanhas sustentam o resultado de cada frente?

**Condições:** 34 campanhas canônicas, ainda com certificação pending_review/source_id_only; CPA event/optimization event nulos. Taxonomia raw não é objetivo de negócio.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Dossiê mensal de campanha | Descritivo |
| Ranking dentro do mesmo objetivo | Descritivo |
| Contribuição de campanha para variação | Descritivo |
| Entrada e saída de campanhas do mix | Descritivo |
| Histórico por identidade canônica | Descritivo |
| Cobertura de objetivo e aliases | Descritivo |

## Mídia paga — Conjuntos e anúncios

**Pergunta:** Onde o desempenho se concentra dentro da campanha?

**Condições:** Meta tem 208 anúncios/40 conjuntos históricos. Google tem dois IDs de anúncio e um conjunto; não projetar a mesma profundidade. Nenhuma duplicidade na chave candidata testada.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Pareto dos anúncios | Condicionado |
| Pareto dos conjuntos | Condicionado |
| Histórico por anúncio | Condicionado |
| Dispersão gasto × conversão reportada | Condicionado |
| Dependência de um anúncio dominante | Condicionado |
| Persistência do resultado dos anúncios | Condicionado |

## Mídia paga — Criativos e mensagens

**Pergunta:** Quais peças e mensagens acompanharam resultados melhores?

**Condições:** 382 cadastros, 186/208 anúncios Meta vinculados. Body em 95; variações de body em 264; insights não vazios em 79. Status atual e asset atual não provam versão histórica. Comparações observacionais, sem causalidade.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Galeria de peças com histórico | Condicionado |
| Imagem versus vídeo em recortes comparáveis | Condicionado |
| Resultados por creative_id | Condicionado |
| Resultados por copy e título disponíveis | Condicionado |
| Comparação de CTA e proporção da peça | Condicionado |
| Variações de assets com evidência da plataforma | Condicionado |

## Mídia paga — Eventos no app

**Pergunta:** O caminho até o evento de interesse está evoluindo?

**Condições:** Ações detalhadas cobrem apenas duas campanhas Meta. Usar medida primária do event_map, vigência, janela única, source e fact/ad. StartTrial não equivale a emissão. Razões de eventos não são conversão de pessoas/coortes.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Instalações atribuídas por mês | Condicionado |
| Sessões atribuídas ao longo do tempo | Condicionado |
| Checkout iniciado por período | Condicionado |
| StartTrial atribuído por período | Condicionado |
| Custo por evento escolhido | Condicionado |
| Relações entre etapas com cobertura pareada | Condicionado |

## Mídia paga — Atribuição e reconciliação

**Pergunta:** Quanto da leitura depende da janela e da fonte?

**Condições:** 743.616 registros brutos incluem versões e janelas. View latest tem 65.844 linhas, 38.096 fact/ad. Nunca somar janelas, aliases, versões ou níveis. Entity spend se repete por evento/janela; obter custo único da entidade.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Comparação 1d/7d/28d click | Condicionado |
| Click-through versus view-through | Condicionado |
| Resultados versus actions | Condicionado |
| Reconciliação anúncio/conjunto/campanha | Condicionado |
| Revisão dos eventos ao longo das coletas | Condicionado |
| Cobertura de eventos canônicos | Condicionado |

## Mídia paga — Engajamento e saturação

**Pergunta:** Há sinais consistentes de atenção ou desgaste?

**Condições:** Eventos auxiliares ainda sem canônico: preservar nomes/status e homologar definições. Não somar page/post_engagement ou aliases. Frequência Meta tem 18 valores >100; 19 inconsistências com impressões/alcance. Google reach/frequency sempre zero: indisponibilidade, não alcance real zero.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Reações e comentários por período | Condicionado |
| Compartilhamentos e salvamentos observados | Condicionado |
| Video views por anúncio | Condicionado |
| Visitas à LP por campanha | Condicionado |
| Mensagens iniciadas e respondidas | Condicionado |
| Frequência versus CTR por anúncio/dia | Condicionado |

## Mídia paga — Orçamento e metas

**Pergunta:** O realizado acompanha o planejado?

**Condições:** Targets vazios. Orçamentos por objetivo só abr–jun/2026; por campanha só abr/2026. Não criar pacing de setembro/outubro usando orçamento antigo. Metas das campanhas não homologadas.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Realizado versus orçamento por frente | Histórico parcial |
| Ritmo de gasto por mês válido | Histórico parcial |
| Execução de alocação por campanha | Histórico parcial |
| Diferença entre orçamento e realizado | Histórico parcial |
| Disponibilidade de metas por período | Histórico parcial |
| Histórico de revisão de metas e orçamento | Histórico parcial |

## Mídia paga — Mensuração e qualidade

**Pergunta:** Quais resultados estão aptos para uso?

**Condições:** Meta metrics até 01/10, Google até 17/08. Coletas modernas Meta completas até 02/10; logs legados falhos até 15/07. Gasto com zero conversão reportada é sinal para investigar, não prova de desperdício.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Cobertura diária por plataforma | Descritivo |
| Latência e atualização por fonte | Descritivo |
| Completude por métrica e mês | Descritivo |
| Campanhas com gasto e conversão reportada zero | Descritivo |
| Saúde das coletas atuais versus legadas | Descritivo |
| Mapa de anomalias e certificação | Descritivo |

## B2C — Produção e evolução

**Pergunta:** Como a originação total evoluiu?

**Condições:** 635 dias tipo total, 01/01/2025–27/09/2026. Não usar setembro como mês fechado nem outubro como produção zero.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Propostas e emissões mensais | Descritivo histórico |
| Evolução diária dentro do mês | Descritivo histórico |
| Acumulado em janelas equivalentes | Descritivo histórico |
| Comparação com mesmo mês do ano anterior | Descritivo histórico |
| Contribuição dos dias para variação mensal | Descritivo histórico |
| Distribuição e estabilidade da produção diária | Descritivo histórico |

## B2C — Conversão e gargalos

**Pergunta:** O resultado mudou por entrada de propostas ou taxa agregada?

**Condições:** Recalcular somas; duas divergências de percentual armazenado. Emissão e proposta do mesmo dia não demonstram conversão de mesma coorte; não há aprovados nem tempos de passagem na tabela.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Razão emissões/propostas por mês | Condicionado |
| Volume versus razão de conversão | Condicionado |
| Decomposição da mudança em volume e taxa | Condicionado |
| Razão por dia da semana | Condicionado |
| Dias atípicos de volume ou taxa | Condicionado |
| Evolução da dispersão entre dias | Condicionado |

## B2C — Serasa e composição

**Pergunta:** Quanto da evolução depende do Serasa?

**Condições:** Serasa é subconjunto, não parcela adicional; 270 dias pareados. Residual = total - Serasa; não chamá-lo CRM. Em maio, 31/31 dias conciliam total = Serasa + crm; isso não prova classificação dos demais meses.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Participação de Serasa nas emissões | Descritivo histórico |
| Participação de Serasa nas propostas | Descritivo histórico |
| Histórico total e Serasa em paralelo | Descritivo histórico |
| Evolução do residual não Serasa | Descritivo histórico |
| Razão de conversão Serasa versus residual | Descritivo histórico |
| Contribuição de Serasa para mudança total | Descritivo histórico |

## B2C — Metas e ritmo

**Pergunta:** A produção acompanha a meta válida?

**Condições:** 10 metas jan–out/2026. Ago–out herdadas de julho; expor origem/validade. Pacing só com corte disponível, calendario aprovado e dias fechados; cenário é projeção, não previsão certificada.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Emissões realizadas versus b2c_meta | Histórico parcial |
| Atingimento mensal | Histórico parcial |
| Gap por mês | Histórico parcial |
| Ritmo diário necessário | Histórico parcial |
| Cenários de fechamento com premissas explícitas | Histórico parcial |
| Meta original versus herdada | Histórico parcial |

## B2C — Calendário e persistência

**Pergunta:** O comportamento se repete ou foi pontual?

**Condições:** Calendário derivável da data. Feriados/dias úteis operacionais requerem calendário governado. Persistência não identifica a causa; variações sazonais não são efeito de campanha.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Mapa dia da semana × mês | Descritivo histórico |
| Evolução por semana | Descritivo histórico |
| Comparação dias úteis/finais de semana | Descritivo histórico |
| Persistência de altas e quedas | Descritivo histórico |
| Primeira versus última parte do mês | Descritivo histórico |
| Baseline móvel própria de 7/28 dias | Descritivo histórico |

## B2C — Qualidade e proveniência

**Pergunta:** Como sabemos que o resultado está correto?

**Condições:** 936 linhas sem repetição data/tipo. CRM só maio/2026. Fonte tipada b2c_daily não existe neste schema; leitura do código mostra risco de incluir tipo crm no total em useOriginacaoDashboard. Não certificada em navegador.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Cobertura por tipo e período | Descritivo |
| Conciliação total/Serasa/CRM | Descritivo |
| Percentual armazenado versus recalculado | Descritivo |
| Completude de share e taxa de canal | Descritivo |
| Observações operacionais ligadas à evolução | Descritivo |
| Auditoria da regra de totalização da tela | Descritivo |

## Conexões — CRM e originação

**Pergunta:** Como os resultados registrados no CRM se relacionam com a originação?

**Condições:** Exigir escopo B2C, grão de activities reconciliado e janelas compatíveis. CRM/Serasa podem ter sobreposição; soma não é aquisição única. Data de disparo e emissão podem ser distintas.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Produção CRM e B2C lado a lado | Reconciliação necessária |
| Relação cartões CRM/originação com ressalva | Reconciliação necessária |
| Conciliação diária por origem | Reconciliação necessária |
| Variação de mix CRM/Serasa/residual | Reconciliação necessária |
| Segmentos CRM associados à evolução total | Reconciliação necessária |
| Calendário de mudanças de régua e originação | Reconciliação necessária |

## Conexões — Mídia e aquisição no app

**Pergunta:** A leitura da plataforma concorda com a aquisição observada?

**Condições:** AppsFlyer acquisition tem 2.372 linhas; campaign 1.168. Só escopo af inz B2C; Android raw e agregado Android/iOS sobrepostos em 52 dias. Fontes e coortes não devem ser somadas. Cost campaign parcial e USD; aquisição cost totalmente nulo. Comparação de investimento/originação é correlacional.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Instalações AppsFlyer por origem | Condicionado |
| Mídia paga/CRM/parceiros/orgânico no histórico | Condicionado |
| Plataforma versus AppsFlyer por campanha | Condicionado |
| Aquisição por geografia disponível | Condicionado |
| Investimento e instalações no período comum | Condicionado |
| Investimento e originação em séries paralelas | Condicionado |

## Conexões — Templates e instalações CRM

**Pergunta:** Quais comunicações têm instalações associadas?

**Condições:** 631 linhas de 64 templates; 28 templates/352 linhas têm vínculo por ID com activities. Cliques/sessões AF do template estão ausentes; decisões de auditoria vazias. Associação por template não atribui instalação a disparo específico.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Instalações por template e mês | Vínculo parcial |
| Templates AppsFlyer vinculados ao CRM | Vínculo parcial |
| Evolução de instalação após disparos | Vínculo parcial |
| Régua/segmento associados a templates | Vínculo parcial |
| Cobertura e conflitos do vínculo | Vínculo parcial |
| Fila de homologação do rateio por disparo | Vínculo parcial |

## Conexões — Retrospectiva e aprendizado

**Pergunta:** O que aprendemos e o que será verificado no próximo ciclo?

**Condições:** 340 insights com campo evidencias não vazio não são 340 aprendizados validados. Campaign_context tem sete campanhas e nenhuma hipótese/KPI alvo preenchidos. Integrar Wiki e entidades do loop preservando revisão/autoria/validade.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Retrospectiva do recorte por mês | Integração necessária |
| Linha do tempo de decisões e mudanças | Integração necessária |
| Sinais ligados a apostas e evidências | Integração necessária |
| Outcome e revisão do aprendizado | Integração necessária |
| Reuso explicado por recorte compatível | Integração necessária |
| Lacunas de evidência e próxima verificação | Integração necessária |

## Retrospectiva junto da análise

Escolher uma possibilidade não cria um aprendizado. Registrar a evolução do mesmo recorte, fatos e hipóteses separados, ação proposta e evidência necessária para verificar. Se fonte, vínculo, evento ou cobertura faltar, registrar a pendência. [Retrospectiva-Mensal-Growth](resultados-1.md#retrospectiva-mensal-growth) orienta esta etapa.

## Conexões

[Resultados-CRM](resultados-1.md#resultados-crm) · [Resultados-Midia-Paga](resultados-1.md#resultados-midia-paga) · [Resultados-B2C](resultados-1.md#resultados-b2c) · [Historico-Resultados-CRM](resultados-1.md#historico-resultados-crm) · [Historico-Resultados-Midia-Paga](resultados-1.md#historico-resultados-midia-paga) · [Historico-Resultados-B2C](resultados-1.md#historico-resultados-b2c).


---

## Conflitos-de-Fonte-Produtos-2026-08

> **tags:** `evolucao,inconsistencia,produto,compliance` | **tipo:** `evolucao` | **camada:** `evolucao` | **atualizado:** `2026-08-20` | **status:** `confirmado` | **fonte:** `pesquisa-externa`

# Conflitos de Fonte — Produtos (ago/2026)

**Definição:** o registro dos casos em que **duas fontes oficiais dizem números diferentes** do mesmo benefício, ou em que o dado que usamos não tem lastro verificável. Nenhum destes deve ir ao ar antes de alguém escolher o número canônico.

Complementa [Inconsistências-a-Corrigir](#inconsistências-a-corrigir), que trata de inconsistências de **dado no Supabase**. Aqui é inconsistência de **conteúdo publicado**.

## 🔴 Bloqueadores

### 1 — Programa de pontos +amigo: encerrado, e as bandeiras não sabem

Encerrou **01/07/2026**; resgate expirou **31/07/2026**. Comunicado oficial no site do Clube.

**Mas em 20/08/2026** as páginas de **Compre Mais** e **Superpão** ainda anunciavam *"Ganhe 1 ponto a cada R$10"* e *"Pontos que viram Vale Compras"*. O passo 4 do onboarding no próprio site do Clube ainda diz *"acumular pontos"*.

→ Bloquear "pontos" na copy +amigo. Pedir à Plurix a atualização das páginas de bandeira.

### 2 — Cartão DIA: possivelmente dormente

Nenhuma comunicação pública desde **nov/2024**. Sem página de produto ativa nem em `dia.com.br` nem em `afinz.com.br`. O DIA saiu de recuperação judicial fechando **343 das 587 lojas**, opera só em SP com 238 lojas.

→ Todo benefício de loja do DIA está marcado `Checar`. Confirmar com produto antes de qualquer régua.

## ⚠️ Conflitos entre fontes oficiais

### 3 — Sorteio Vibe: R$100 mil ou R$10 mil?

| Fonte | Diz | Data |
|---|---|---|
| Material comercial interno (2 slides) | **R$100 mil todo mês** | 08/08/2026 |
| Home do Vibe | *"Todo mês alguém leva R$ 100 mil"* | — |
| **Descrição do app Vibe no Google Play** | *"ganhe **até R$10.000** todos os meses"* | **24/06/2026** |
| Plano de lançamento interno | *"sorteios mensais de 10 mil reais"* | 2025 |

O material comercial de ago/2026 é a fonte interna mais recente e autoritativa. Mas o app — também oficial e atualizado em jun/2026 — diz outra coisa. E o **último regulamento localizável (SPA/ME 04.047730/2026) expirou em 11/05/2026**.

→ **Não publicar valor de sorteio sem regulamento vigente.** Pedir à Vertem.

### 4 — Mecânica do sorteio mudou

| Versão | Regra |
|---|---|
| Plano interno 2025 | 1 número da sorte a cada **30 Vibes utilizados** |
| Fontes 2026 | a cada **50 créditos resgatados**, teto de 5 bilhetes/mês |

Em **todas** as versões o número vem do **resgate**, nunca do acúmulo. → Copy sempre "use e concorra".

### 5 — Créditos Vibe expiram em 6 meses

*"Os créditos têm a validade de 6 meses"* (microsite Vibe/Posto Ipiranga; 180 dias no regulamento SPA). **Nenhuma peça nossa menciona.** É omissão material.

→ Confirmar se vale para os Vibes de cartão Afinz (documentado só para outro parceiro) e decidir com jurídico se precisa aparecer.

### 6 — Você Bem Farmácia: até 70% ou até 35%?

Landing do Você Bem: **"até 70%"** em genéricos tarjados. Blog da própria Afinz: **"até 35%"**. Duas fontes oficiais.

### 7 — Você Bem Educação: a partir de 40% ou até 80%?

Afinz: **"a partir de 40%"**. Bem Barato: **"até 80%"**. Emissor e parceiro divergem sobre o mesmo programa.

### 8 — A página do Você Bem se contradiz sobre gratuidade

A mesma URL diz que o Você Bem Saúde é *"gratuito por tempo determinado"* **e** *"esse é um benefício sem data de término"*.

Agrava: existe um **"Você Bem Saúde Super" PAGO de R$24,90/mês**, com reclamação registrada de cobrança não autorizada em fatura do +amigo (08/02/2026).

→ Resolver antes de usar "grátis" em qualquer copy de Você Bem.

### 9 — Tabela de Tarifas sem data de vigência

O PDF oficial (`afinz.com.br/wp-content/uploads/Tabela_de_Tarifas_Afinz.pdf`) não traz data, versão nem "vigente a partir de". Só referência genérica a resoluções do CMN.

→ Não é possível afirmar que anuidade R$155,88–R$360 e os CETs são os valores de ago/2026. Pedir versão datada ao jurídico.

### 10 — "Ativação do cartão" ou "primeira compra"?

| Fonte | Diz |
|---|---|
| Pablo Prado, 20/08/2026 | *"R$100 na **ativação** do cartão"* |
| Material comercial, 08/08/2026 | *"**primeira compra** com seu cartão (com anuidade ativa) em até 30 dias após abrir a conta"* |
| Bem Barato (público) | *"na **1ª compra**"* |

Muda o **verbo da copy**: *"ative seu cartão e ganhe R$100"* é promessa diferente de *"faça sua primeira compra e ganhe R$100"*. Se o gatilho técnico é a transação, a copy tem que dizer isso — "ativação" pode ser lido como só desbloquear o cartão.

### 11 — Cartão virtual: dois produtos com o mesmo nome

| Produto | O que é |
|---|---|
| Afinz Visa (proprietário) | virtual gerado no app, **validade de 1 hora**, **exclusivo online** |
| +amigo, Bem Mais | virtual **pleno**, usado enquanto o físico não chega (10 e 7 dias úteis) |

Nossa copy B2C diz *"Cartão virtual para usar na hora"*. → Confirmar com produto qual o cliente B2C recebe.

## ⚠️ Divergências de nomenclatura interna

### 12 — Três grafias de prefixo para Plurix

`plu_` (activities históricas) · `plx_` (planilhas novas e links de Topo) · `plurix_` (esperado pela taxonomia de governança).

→ A governança marca divergência de prefixo como `suspeito`. Padronizar antes de subir templates novos.

### 13 — Bandeiras Plurix: 6 ou 8?

[Bandeiras-Plurix](core.md#bandeiras-plurix) lista **6** (Amigão, Boa, Avenida, Compre Mais, Paraná, Superpão). A lista oficial do Clube em 20/08/2026 tem **8** — as 6 + **Mega** + **Dom Olívio**.

Dom Olívio é justamente a que **quebra o padrão de 5%** (vinhos e destilados 20%, carnes e queijos 10%) e tem **restrição de praça** (Campinas, Jundiaí, Sorocaba). → Reconciliar.

### 14 — "Tudão" não existe

Aparecia na nossa base como bandeira Plurix. Nenhuma fonte confirma. → Remover.

## Lacunas — dado que simplesmente não existe

- Mensalidade e anuidade dos co-branded (nenhuma é pública)
- Limite inicial de qualquer produto
- Descontos das bandeiras Amigão, Paraná/Paraná Atacadista e Mega
- Nenhuma peça real de CRM do **Bem Mais** e do **DIA** — os dois entram sem lastro de tom
- Regulamento vigente do sorteio Vibe
- Bem Mais: **nenhum documento legal público** (sem regulamento, termos, contrato ou tabela de tarifas)

## Relacionado

- [Dicionario-de-Produtos](dados.md#dicionario-de-produtos) · [Beneficios-e-Vigencia](dados.md#beneficios-e-vigencia) · [Pode-Dizer-Nao-Pode-Dizer](dados.md#pode-dizer-nao-pode-dizer)
- [Inconsistências-a-Corrigir](#inconsistências-a-corrigir) · [Decisões-Abertas](#decisões-abertas) · [Bandeiras-Plurix](core.md#bandeiras-plurix) · [Vibe](core.md#vibe)


---

## Decisões-Abertas

> **tags:** `evolucao,decisao` | **tipo:** `evolucao` | **camada:** `evolucao` | **atualizado:** `2026-11-03` | **status:** `a-validar` | **fonte:** `gaas-supabase`

# Decisões Abertas

**Definição:** as escolhas pendentes que travam ou desviam a evolução. Manter vivo.

## Abertas
1. **[campaign_context](dados.md#campaign_context) estender ou substituir?** Risco de duplicar com `orchestrator_campaigns` e o `campaign_templates` do doc Miro — unificar antes de criar.
2. **Acesso a dado individual (CPF/SFMC)?** Anti-overlap real e personalização dependem disso; hoje só há agregado. Decide o teto da [Fase 3](core.md#roadmap-framework).
3. **Recalibrar o score do [Orientador](legado.md#orientador)** para a faixa de CAC real antes de persistir.
4. **Persistir score/insights?** Só na Fase 2, espelhando [paid_media_insights](dados.md#paid_media_insights).
5. **Owners e rito de governança** do framework — quem mantém a [Ontologia-v2](core.md#ontologia-v2).
6. **Deep link real no app** — SDK AppsFlyer + UDL implementados? Sem isso `deep_link_value=pedido_cartao` não roteia ([AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm)). Depende do time de dev/app.
7. **OneLinks por canal restantes** (sms, email, push, meta_ads, google_ads) — criar no painel e colar na planilha geradora.
8. **Postback de eventos** `account_created`/`account_approved` para Meta/Google otimizarem — integração de eventos in-app/S2S no AppsFlyer.
9. **Tabela-mestre de links de atribuição** — virar entidade no Supabase (canal, campanha, segmento, template, link, owner, status) ou ficar na planilha?
10. **Dois catálogos de skill divergentes** — `09-Inteligencia-IA/Skills-do-Projeto.md` (parado em 08/06, não lista `gaas-insight-engine` nem várias skills do repositório) vs `08-Engenharia/Skills-e-Disponibilidade-por-IA.md` (08/07, inventário completo por onde cada skill roda — Claude Code/Cowork/Codex). Decidir: aposentar o primeiro com link para o segundo, ou manter os dois com escopos explicitamente diferentes?
11. **`AFINZ_GAAS_ONTOLOGY.md` pode ter cruzado o gatilho de 120k tokens.** 272.878 caracteres em 20/06 (≈75-90k tokens estimados); 409.281 caracteres em 12/08 (+~50%). Rodar `scripts/bundle_vault.py` e conferir a contagem real contra a tabela de [Estrategia-de-Contexto](core.md#estrategia-de-contexto) (decisão D-2 do [ADR-001](engenharia.md#adr-001)) — se cruzou 120k, é hora de compilar sub-índices por camada.
12. **Contagem de RLS desabilitado desatualizada.** [Governança-de-Dados](#governança-de-dados) registra 11 tabelas (snapshot 08/06); o advisor do Supabase contou 13 em 12/08 (prováveis novas: `crm_insights`, tabelas da Copa 2026). Atualizar a nota e decidir se a Fase 2 (escrita automatizada) já está próxima o suficiente pra tratar isso como bloqueador ativo, não só risco futuro.
13. **Notas de dimensão sem reidratar há ~2 meses.** `Parceiros`, `Segmentos`, `BUs`, `Canais`, `Ofertas` têm snapshot de 06-08/06-10 contra a cadência de 2x/semana definida em [Reidratacao-Alerts-Vivo](ia.md#reidratacao-alerts-vivo). Números já divergem visivelmente do Supabase ao vivo (ex.: `activities` foi de ~4.600 para 6.637 linhas no período). Rodar o [Runbook-Vault-Vivo](ia.md#runbook-vault-vivo) quando houver janela.

> Itens 10-13 vieram de uma sessão de reconciliação vault ↔ Supabase ↔ `.claude/skills` em 12/08/2026 (Claude/Cowork), a pedido do Pablo. Registrados, não resolvidos — nenhuma nota de dimensão foi alterada nesta sessão além desta.

14. **Vai de Visa — atraso em qualquer conta exclui o CPF?** Regra aplicada em 03/11/2026, fora da spec da gestora; impacto pequeno (~50 CPFs). Confirmar com a gestora ([DE-VDV_APTOS](dados.md#de-vdv_aptos)).
15. **Vai de Visa — 79 mil ativos com limite < R$ 200.** Ficam sem comunicação; avaliar mensagem sem oferta (lembrete de fatura, liberar limite) ([Iniciativa-Pool-de-Ofertas-Vai-de-Visa](resultados-2.md#iniciativa-pool-de-ofertas-vai-de-visa)).
16. ~~Vai de Visa — conteúdo genérico~~ → resolvido em 03/11/2026: Movida, Alura, Oceane no 1º teste ([DE-BRIEFING_OFERTAS_VISA](dados.md#de-briefing_ofertas_visa)).
17. **Vai de Visa — WhatsApp entra na onda 1?** E qual o nome da jornada (`JOR_RENT_POOL_OFERTAS_VAIDEVISA` proposto).
18. **Vai de Visa — medição pela Visa.** Pedir dado de resgate por oferta/cupom no formato do `copa_visa_daily`, em vez de cruzar nome de estabelecimento ([Teste-Afinidade-MCC-vs-Generico](core.md#teste-afinidade-mcc-vs-generico)).
19. **MAPA_MCC na fonte (IN):** quantidade em 6 meses, regra de parcela/estorno e datas `yyyy-MM-dd` ([DE-MAPA_MCC](dados.md#de-mapa_mcc)).
20. **Eixo cliente novo × maduro (`DATA_ABERTURA_CONTA`)** — adiado por decisão do Pablo em 03/11/2026; retomar depois da primeira onda.

21. **Vai de Visa — controle perene ou por safra?** Implementado com código fixo (permite perene); confirmar com a gestão antes da 2ª safra.
22. **Vai de Visa — compra em safras sobrepostas.** Proposta: última safra recebida + leitura mensal do programa contra o controle perene.
23. **Vai de Visa — import automático do arquivo da IN.** Passo `IMP_VDV_01` fora da automação; atualização no SFTP não é capturada até entrar ([Automacao-VDV-Pool-de-Ofertas](operacao.md#automacao-vdv-pool-de-ofertas)).
24. **Vai de Visa — FAMILIA_PRESENTES fica no teste?** Depende do tamanho medido na etapa APTOS do funil.

> Itens 14-20 vieram do planejamento do Pool de Ofertas - Vai de Visa em 03/11/2026 (Claude/Cowork, com o Pablo).

## Relacionado
- [Orquestrador](core.md#orquestrador) · [Governança-de-Dados](#governança-de-dados) · [Roadmap-Framework](core.md#roadmap-framework)


---

## Decisões-Tomadas

> **tags:** `evolucao,decisao,adr` | **tipo:** `evolucao` | **camada:** `evolucao` | **atualizado:** `2026-11-03` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Decisões Tomadas (log ADR)

**Definição:** o registro das **decisões já resolvidas** de modelagem e estratégia — complementa as [Decisões-Abertas](#decisões-abertas). Cada linha: contexto → escolha → consequência.

## Decisões
| Data | Decisão | Consequência |
|---|---|---|
| v2 | **Experimento agrupa disparos; Template é atributo** | aprendizado vira entidade; template = `template_id` ([Entidades-v2](legado.md#entidades-v2)) |
| v2 | **Campanha explícita** = jornada+safra | deixa de ver 700 linhas, passa a ver ~40 campanhas ([Campanha](core.md#campanha)) |
| v2 | **Conversão zero é resultado válido** | confiança = volume de execução, não de conversão ([Base-Acionável](core.md#base-acionável)) |
| 2026-04 | **b2c_daily_metrics com PK (data, tipo)** | total + serasa_api por dia ([b2c_daily_metrics](dados.md#b2c_daily_metrics)) |
| eng | **Supabase como único backend** (sem servidor) | velocidade alta; RLS vira risco ([Decisões-Técnicas](legado.md#decisões-técnicas)) |
| eng | **ML client-side heurístico** (sem modelos) | explicável e instantâneo; precisão limitada ([Pipeline-ML](legado.md#pipeline-ml)) |
| 2026-06 | **`pid=crm` como Media Source única no AppsFlyer** | CRM, WhatsApp e mídia lidos sob a mesma governança; canal real em `af_channel` ([AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm)) |
| 2026-06 | **`af_ad` = Activity Name; `af_ad_id` = id do template** | a [Taxonomia-Activity-Name](core.md#taxonomia-activity-name) vira chave de reconciliação AppsFlyer ↔ Supabase/SFMC |
| 2026-06 | **1 OneLink base por canal** (domínio `cartao-afinz.onelink.me`, template 9ODN) | leitura limpa por mídia; links gerados em massa por planilha-fórmula |
| 2026-06 | **Conversão em 2 níveis: `Account Created` (operacional) e `Account Approved` (negócio)** | mídia otimiza por qualidade, não por clique/install ([AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm)) |
| 2026-06-10 | **Views ponderadas como fonte única de agregação** (4 views, flag de confiança) | fim do `avg` de taxas; granularidade Safra×BU×Segmento e mídia até nível ad ([Views-Performance](dados.md#views-performance)) |
| 2026-06-10 | **Ativação diária de audiências via S3 + APIs diretas** (Rota B; descartado Advertising Studio em sunset) | 6 audiências Topo/Repescagem/Upgrade × B2C/Plurix sincronizadas a Meta/Google a custo ~zero ([Ativacao-de-Audiencias-Diaria](core.md#ativacao-de-audiencias-diaria)) |
| 2026-06-20 | **D-1: Roteamento de memória em 3 níveis** (working=CLAUDE.md, semântica=vault, episódica=snapshots) | fim da duplicação/drift; write-back da IA fica disciplinado ([Roteamento-de-Memoria](core.md#roteamento-de-memoria), [ADR-001](engenharia.md#adr-001)) |
| 2026-06-20 | **D-2: Carrega-tudo até gatilho de tokens** (<120k total; 120-180k sub-índice; >180k RAG) | decisão de contexto amarrada a número; ontologia hoje ~75-90k tokens ([Estrategia-de-Contexto](core.md#estrategia-de-contexto), [ADR-001](engenharia.md#adr-001)) |
| 2026-06-20 | **D-3: Atribuição v1 = MMM agregado; MTA via AppsFlyer é v2** | atribuição acionável com dados de hoje (agregado); MTA espera deep link+postback ([ADR-001](engenharia.md#adr-001), [AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm)) |

| 2026-07-15 | **Galeria é a entrada padrão de Performance do Conteúdo** | prioriza reconhecimento visual e comparação entre peças; Visão Geral e Tabela ficam como leituras complementares ([Performance-do-Conteudo-GaaS](#performance-do-conteudo-gaas)) |
| 2026-07-15 | **Rascunhos ficam ocultos por padrão e sob controle explícito** | reduz ruído operacional sem eliminar a consulta ao inventário incompleto ([Performance-do-Conteudo-GaaS](#performance-do-conteudo-gaas)) |
| 2026-07-15 | **Identidade estrutural precede score no match Activity Name ↔ Template ID** | incompatibilidades B2C × BB/B2B2C são rejeitadas antes da similaridade textual ([Performance-do-Conteudo-GaaS](#performance-do-conteudo-gaas)) |
| 2026-07-15 | **Template ID é traduzido visualmente, mas preservado como identidade canônica** | chips aceleram leitura sem quebrar reconciliação, auditoria ou integrações ([Performance-do-Conteudo-GaaS](#performance-do-conteudo-gaas)) |
| 2026-07-22 | **Funis de Apps, Serasa e Mídia Paga permanecem independentes** | a central permite alternar a origem sem somar populações, janelas ou semânticas incompatíveis ([Funis-de-Onboarding-GaaS](#funis-de-onboarding-gaas)) |
| 2026-07-22 | **StartTrial Meta vem de `results`, com indicador e atribuição preservados** | `conversions:start_trial_mobile_app` é confiável como resultado atribuído em 7d click, nunca como total do app ([Funil-Onboarding-Arquitetura-e-Ingestao](engenharia.md#funil-onboarding-arquitetura-e-ingestao)) |
| 2026-07-22 | **Ausência, zero explícito e run incompleto são estados distintos** | valores ausentes ficam nulos e runs pending/failed não entram no BI ([Funil-Onboarding-Arquitetura-e-Ingestao](engenharia.md#funil-onboarding-arquitetura-e-ingestao)) |
| 2026-07-22 | **SubmitApplication fica bloqueado até instrumentação/fonte AppsFlyer** | nenhuma proxy de sessão, checkout ou StartTrial pode ocupar o KPI final ([Funil-Onboarding-Arquitetura-e-Ingestao](engenharia.md#funil-onboarding-arquitetura-e-ingestao)) |

| 2026-11-03 | **Vai de Visa: base elegível = STATUS NORMAL + compra em 30 dias + limite disponível ≥ R$ 200 + e-mail liberado** | 130.175 CPFs na fase 1 (B2C + B2B2C); `STATUS` substitui códigos de conta/atraso ([DE-VDV_APTOS](dados.md#de-vdv_aptos)) |
| 2026-11-03 | **Bloqueio é por canal e por CPF** | qualquer linha do CPF com `bloqueio_email = True` tira do e-mail; `bloqueio_celular` tira só de SMS/WhatsApp ([DE-CLIENTES_ATIVOS](dados.md#de-clientes_ativos)) |
| 2026-11-03 | **Base do Vai de Visa montada no MC por Query/Automation, não pela IN** | regras e sorteio ficam versionados no vault e no SFMC ([DE-VDV_APTOS](dados.md#de-vdv_aptos)) |
| 2026-11-03 | **Join CLIENTES ATIVOS ↔ MAPA_MCC por `NR_CONTA`, não por CPF** | match de 99,8%; `DISTINCT CPF, NR_CONTA` evita somar a mesma conta por cartão ([DE-MAPA_MCC](dados.md#de-mapa_mcc)) |
| 2026-11-03 | **Regra de grupo `V1_12M_REC6M`** (≥ 2 compras em 12 meses + última compra na categoria ≤ 6 meses) | substitui "≥ 2 em 6 meses" enquanto a MAPA não tiver quantidade em 6 meses; teste segue válido ([Teste-Afinidade-MCC-vs-Generico](core.md#teste-afinidade-mcc-vs-generico)) |
| 2026-11-03 | **Grupo e célula congelados no envio; sorteio depois do filtro do e-mail** | medição não quebra com recálculo; controle não fica com público inalcançável ([Teste-Afinidade-MCC-vs-Generico](core.md#teste-afinidade-mcc-vs-generico)) |
| 2026-11-03 | **Nome "Pool de Ofertas - Parceiros" para a variante RENT-96f7a0892e** | separa do Vai de Visa na Wiki e no Loop ([Iniciativa-Pool-de-Ofertas-Parceiros](resultados-2.md#iniciativa-pool-de-ofertas-parceiros)) |
| 2026-11-03 | **DEs do SFMC viram entidades em `02-Entidades-Dados/SFMC/`** | mapa de relacionamento em [MOC-SFMC-DEs-e-Automations](dados.md#moc-sfmc-des-e-automations) |

| 2026-11-03 | **MAPA importada como texto (`MAPA_MCC_ENTRADA`) e convertida em SQL** | o arquivo fixo do SFTP com vírgula decimal deixa de depender do import ([DE-MAPA_MCC](dados.md#de-mapa_mcc)) |
| 2026-11-03 | **Duas automações: PREPARAÇÃO (repetível) e CONGELAR (1× por safra)** | testes não gravam ninguém na VDV_ENVIO por engano ([Automacao-VDV-Pool-de-Ofertas](operacao.md#automacao-vdv-pool-de-ofertas)) |
| 2026-11-03 | **DEs com nomes simples no padrão ENTRADA → CRUZAMENTO → APTOS → ENVIO → FUNIL** | `DE_VDV_BASE_ELEGIVEL` virou [DE-VDV_APTOS](dados.md#de-vdv_aptos); `DE_VDV_OFERTAS` virou [DE-BRIEFING_OFERTAS_VISA](dados.md#de-briefing_ofertas_visa) |
| 2026-11-03 | **Ofertas como pool único priorizado (nota 0–100), não vitrines manuais** | vitrines saem do ranking; base para orquestração futura ([DE-BRIEFING_OFERTAS_VISA](dados.md#de-briefing_ofertas_visa)) |
| 2026-11-03 | **1º teste com 3 grupos (Moda, Saúde e Beleza, Família e Presentes) e 3 marcas cada** | escopo menor e legível; demais afinidades no Genérico ([DE-VDV_APTOS](dados.md#de-vdv_aptos)) |
| 2026-11-03 | **Sorteio em duas camadas: controle fixo + A × B por safra** | mantém aberta a opção de controle perene ([Teste-Afinidade-MCC-vs-Generico](core.md#teste-afinidade-mcc-vs-generico)) |
| 2026-11-03 | **Campanha perene com safras (`ID_SAFRA`)** | tema sazonal muda, operação e medição se repetem |
| 2026-11-03 | **Resultado da medição fica com a IN (lake + relatório)** | MC recebe no máximo o resumo por cliente, não transações |

## Como usar
Quando uma [decisão aberta](#decisões-abertas) for resolvida, mova-a para cá com a consequência. Mantém o histórico de *por que* o framework é como é.

## Relacionado
- [Decisões-Abertas](#decisões-abertas) · [Decisões-Técnicas](legado.md#decisões-técnicas) · [Entidades-v2](legado.md#entidades-v2) · [Ontologia-v2](core.md#ontologia-v2)


---

## Evolucao-Cronologica-GaaS-2026-10

> **title:** `Evolução cronológica do GaaS` | **tags:** `gaas, historia, evolucao, arquitetura, wiki` | **tipo:** `retrospectiva` | **camada:** `evolucao` | **tipo_diataxis:** `explanation` | **criado:** `2026-10-31` | **atualizado:** `2026-10-31` | **status:** `analise-documental-com-limites` | **fonte:** `github-vault-wiki-corte-2026-10-31` | **aliases:** `Linha do tempo do GaaS`

# Evolução cronológica do GaaS Afinz

Data de corte: 31/10/2026, America/Sao_Paulo. Análise de história do produto, arquitetura e conhecimento; não é auditoria dos resultados financeiros ou da operação atual.

## Leitura principal

O GaaS começou resolvendo a visibilidade dos disparos de CRM e foi incorporando as etapas que faltavam para decidir: histórico comparável, métricas, conteúdo, jornadas, contexto de negócio, decisões e verificação posterior. A transformação mais profunda ocorre em setembro de 2026, quando a análise passa a se conectar a apostas, execução, outcomes e memória versionada. Outubro aproxima esse circuito do trabalho cotidiano, com Wiki, investigações assistidas por agentes, notificações e contribuições revisáveis.

A sequência sustentada pelas fontes é:

**Calendário de disparos → planejamento baseado no histórico → plataforma integrada de análise → governança de conteúdo e mensuração → produção de comunicações → publicação auditável → aprendizado operacional → colaboração com IA sob revisão humana.**

Essa é uma interpretação da evolução do produto. A existência das capacidades não comprova, por si, adoção recorrente, aumento de conversão ou redução de CAC.

## Escopo e método

- GitHub consultado pelo conector: repositório `GrowthAfinz/GaaS-Framework-Afinz`, 62 PRs retornados, sendo 60 mergeados, uma PR fechada sem merge e uma aberta no corte consultado.
- Histórico Git remoto atualizado e fixado na referência de auditoria `refs/codex-audit/gaas-evolucao-20261031`: **912 commits alcançáveis pela main**, em checkout não shallow. Inclui merges; não representa 912 funcionalidades nem todos os commits de branches não integradas.
- Head verificado: `052b6fec6a798b25ab8d4c08fb971a16b87a0971`, de 30/10/2026.
- Vault elegível: **479 notas, 57.008 linhas e 3.117.030 bytes**. Leitura automatizada de todos os conteúdos para inventário, hashes, frontmatter, títulos e datas; leitura aprofundada das notas históricas, de arquitetura e dos contratos que sustentam os marcos abaixo.
- Wiki: `vault_lint.py --no-report` confirmou 479 notas publicadas, sem notas exclusivas de um lado e sem diferenças de hash. Último sync registrado: 30/10/2026, 14:58 UTC. Assim, o conteúdo local elegível representa a projeção publicada naquele momento.
- Não foi realizada revisão semântica linha a linha de todas as 479 notas. A varredura integral do corpus e a leitura aprofundada das fontes históricas são níveis diferentes de cobertura. Anexos binários e arquivos excluídos pelo contrato da Wiki não entram nessa contagem.
- A análise original não alterou notas, métricas, campanhas ou publicações. Esta versão foi autorizada para publicação na Wiki em 31/10/2026. Os artefatos de auditoria ficam em `outputs/gaas-evolucao-20261031/`, fora da projeção Markdown da Wiki.

Três datas precisam permanecer separadas: data do fato descrito, data de edição da nota e data de integração do código. Um documento atualizado em outubro pode preservar um acontecimento de junho. Um commit escrito em setembro pode ser integrado em outubro. Para PRs, usamos `merged_at`, convertido para São Paulo quando a data local importa; datas de autor de commits isolados são evidência de desenvolvimento, não certificado de implantação.

## Linha do tempo

| Período | Evolução observada | Mudança de capacidade | Evidência e limite |
|---|---|---|---|
| 12/11/2025 | Entrega documental do MVP | Visualizar disparos em calendário, importar CSV, filtrar BU e consultar KPIs | `ENTREGA.md`; primeiro commit alcançável identificado é de 26/11. A entrega declarada antecede o registro Git disponível. |
| Dez/2025–jan/2026 | Estrutura de app, configurações, filtros, marca GaaS, metas e B2C | Passar da visualização ao planejamento operacional | Commits de dezembro e janeiro; B2C já aparece em 20/01, antes do marco de sincronização de abril. |
| Jan–fev/2026 | Campos históricos, versionamento, projeções e sugestões; Explorador em 25/02 | Usar o passado para orientar o próximo disparo | `9f7ad19`, `461ca49`, `8d5d5f5`; motor estatístico heurístico, sem comprovação de modelo treinado ou causalidade. |
| Mar/2026 | Persistência direta no Supabase, autenticação, papéis, relatórios e Media Analytics | Consolidar análise e operação em uma plataforma compartilhada | `304af65`, `d719222`, `e33b716`, `c0db5c4`, `a839374`; commits e correções de integração. |
| Abr–mai/2026 | Originação B2C remodelada, orçamento/pacing, comparativos mensais, importador e rentabilização | Acompanhar produção, planejamento e eficiência em diferentes frentes | `47028d2`, `cd814c3`, `47a68d4`, `2c3e136`, `209a730`; abril é consolidação de B2C, não nascimento comprovado. |
| Jun/2026 | Vault, ontologia, governança, experimentos, Copa e Comunicações | Explicitar o significado dos dados e ligar peças a resultados | Changelog do vault; ADR-001; `ede7804`, `6843143`, `d7c4def`, `1ca8c82`. Decisão arquitetural não equivale a todos os itens implementados. |
| Jul/2026 | Performance do Conteúdo, reconciliação, funis por fonte, AppsFlyer e Report Live | Comparar conteúdo e etapas com identidade e fonte preservadas | `6244d37`, `f7bbff7`, `689bd14`, `7c77de4`; notas de funis e publicação. Funis distintos não viram população única. |
| Ago/2026 | Fábrica de E-mails, biblioteca de assets, versões e réguas | Produzir e revisar comunicações no GaaS | `3f9658b`, `a5d03e6`, `7d91fe1`, `0e9372a`, `5adaa0a`; prontidão no app não certifica cada envio no SFMC. |
| 08–15/09/2026 | Recuperação e endurecimento do Report Live | Separar construção, certificação e publicação, com recuperação e permissões | PRs #3–#10; publicação de agosto registrada em setembro, com 57 páginas. Renderer Office mensal continua piloto separado. |
| 22–24/09/2026 | Releases 1–7 do Aprendizado Growth | Conectar sinal, decisão, execução, outcome e memória reutilizável | PRs #13–#32, com cortes de schema, interface, documentação e projeção editorial. Capacidade publicada não prova volume de loops reais fechados. |
| 28/09–07/10/2026 | Biblioteca do vault no app, Wiki por assuntos, resultados e retrospectivas | Tornar o conhecimento navegável no contexto analítico | PRs #34–#48. A PR #34 foi mergeada em 28/09 à noite em São Paulo; o changelog registra 29/09. |
| 07–19/10/2026 | Pacotes SFMC, prévias, fluxo visual e atribuição exata por execução | Reconstruir jornada e conteúdo sem depender apenas da semelhança de nomes | `3b7ba68`, `bad1b04`, `9dbba5c`, `dd71efd`; nota de integração de 19/10. Resultados agregados não provam percurso individual. |
| 22–30/10/2026 | Contexto completo para IA, contribuições revisáveis, mapa, gatilhos, tarefas e notificações | Levar o loop ao trabalho diário com fronteiras humanas explícitas | PRs #52–#62 e commits diretos; V17 Plurix em `98d9f9e`; biblioteca de skills e navegação em 30/10. |

## 1. Novembro de 2025: tornar o CRM visível

O MVP declarado em 12/11 tinha uma proposta concreta: transformar o CSV do Framework em uma visão temporal. Calendário mensal, filtros de B2C/B2B2C/Plurix, detalhes por dia e indicadores eram suficientes para responder quando e para quem os disparos aconteciam.

A unidade central era a **atividade de disparo**. O valor inicial estava em organizar e consultar a operação. Não há evidência suficiente para fixar a concepção em setembro/outubro de 2025: a nota de legado identifica essa origem como inferência. O primeiro commit disponível, `c5ea2cf`, é de 26/11/2025; ele também não deve ser confundido com o início absoluto do projeto.

Fontes: `ENTREGA.md`, `ENTREGA_MVP_CALENDARIO.md`, nota legada `Histórico-de-Evolução`, histórico Git.

## 2. Janeiro e fevereiro: planejar usando o histórico

Janeiro adiciona configurações, metas, melhorias de carregamento, edição de atividades e identidade GaaS. Os commits `899563c` de 20/01 e `cd9c247` de 27/01 já tratam dados e KPIs B2C. Em 31/01, `9f7ad19` registra versionamento do Framework e campos inteligentes. Em 02/02, `461ca49` registra o motor de sugestões no planejamento de disparos. Em 25/02, `8d5d5f5` adiciona o Explorador de Disparos.

A mudança conceitual é importante: o histórico passa a orientar campos e expectativas antes da execução. O produto começa a responder “o que esperar e como preencher este planejamento?”, além de “o que aconteceu?”.

O termo “ML” usado nos documentos precisa ser lido com precisão. A nota `Pipeline-ML` descreve heurísticas estatísticas determinísticas no navegador, sem modelos treinados. O próprio texto ressalva que o analisador chamado causal aproxima diferenças entre grupos; isso não estabelece causalidade. Portanto, o marco é a introdução de apoio estatístico explicável ao planejamento.

## 3. Março a maio: plataforma integrada de análise e operação

Março concentra mudanças de infraestrutura e experiência: importação/persistência direta no banco, redução da dependência de caches locais, metas e orçamento no Supabase, autenticação por e-mail/senha, papéis e painel administrativo. Relatórios e Explorador ganham detalhamento; Media Analytics incorpora campanha, grupo, anúncio e criativo.

Abril aprofunda Originação B2C e orçamento/pacing. Maio avança comparações mês a mês, personalização de relatórios, atualização inteligente e exportação de rentabilização. O sync de 27/04 é uma evidência operacional de alimentação da base, não uma evidência de que a aba B2C nasceu naquele dia.

Minha leitura: nesse período o GaaS deixa de ser predominantemente um calendário e se torna um ambiente de trabalho com várias leituras da operação. A expansão também aumenta a necessidade de coerência entre filtros, fontes e indicadores. As primeiras PRs reforçam isso: #1 corrige filtro de BU no relatório; #2 corrige agregação multicanal em mídia.

## 4. Junho: o conhecimento de negócio passa a fazer parte da arquitetura

O changelog registra a base inicial do vault em 08/06, com 58 notas em nove camadas, seguida da expansão para CRM, mídia paga e IA. As definições de campanha, template, experimento, safra, CAC e conversão passam a formar uma linguagem compartilhada.

Há três movimentos simultâneos:

1. **Semântica e governança:** views ponderadas, distinção de zero e ausência, regras de atribuição e identidade de campanha.
2. **Conhecimento reutilizável:** vault, roteamento de memória e ontologia derivada. O ADR de 20/06 separa contexto de sessão, conhecimento semântico e registros episódicos.
3. **Objetos de produto:** experimento, comunicação e template passam a receber interfaces e contratos próprios. O Git registra o Kanban de experimentos em 10/06 e a fundação de Comunicações em 24/06.

A Copa funciona como um caso concreto de integração entre CRM, LP, BI Visa e mídia no exportador. Esse caso evidencia capacidade de reconciliação, mas não autoriza confundir usuários de página, opt-ins transacionais e cartões.

O norte declarado é consistente: conversão sob restrição de custo no nível tático, e rentabilidade/CAC ótimo no estratégico. A formalização desse norte não comprova um otimizador de rentabilidade já operacional.

## 5. Julho: conteúdo, jornada e fonte ganham identidade própria

Comunicações evolui de cadastro para análise da peça: galeria, ranking, detalhe, tradução visual do Template ID e reconciliação com Activity Name. A nota de 15/07 registra uma regra decisiva: compatibilidade estrutural precede score textual. Compartilhar palavras não torna duas comunicações equivalentes.

Os funis de onboarding ampliam a análise de aquisição, preservando Apps, Serasa e mídia como fontes distintas. A governança documenta que um resultado atribuído pela Meta não é o total do aplicativo e que uma etapa sem instrumentação não deve ser preenchida com uma proxy conveniente.

O Report Live já aparece como pipeline Supabase → Sheets → Slides → PDF, com execução verificada em julho. Assim, setembro representa recuperação e amadurecimento operacional desse pipeline, não sua criação do zero.

Ao fim de julho, o GaaS consegue relacionar melhor quatro objetos diferentes: resultado, atividade, conteúdo e jornada. Essa distinção será essencial para investigar desempenho sem atribuir ao criativo um efeito que pode vir de público, posição ou momento.

## 6. Agosto: da análise para a produção de comunicações

A Fábrica de E-mails é um novo tipo de capacidade. O GaaS passa a oferecer editor, prévia, biblioteca de assets, slots de template, persistência de versões, exportação e navegação por régua. A evolução de agosto inclui tanto a edição visual quanto a organização semântica e gerencial dos briefings.

O motor dinâmico permite reutilizar uma estrutura de e-mail com conteúdo resolvido por dados. No caso Plurix, as notas documentam variações de assinatura e links entre bandeiras. Isso aproxima planejamento, conteúdo e preparação para execução.

A fronteira de validação continua importante: a nota de 10/08 registra um Test Send de um caso específico. Esse teste não certifica todas as versões posteriores. Prévia, HTML ou CSV prontos no GaaS não demonstram, isoladamente, lookup correto no tenant nem renderização de todos os clientes.

## 7. Setembro: publicar um relatório vira processo auditável

Os commits de 08/09 registram recuperação de uma publicação parada. Entre 13 e 15/09, as PRs #3–#9 consolidam artefato imutável, checkpoints, recuperação, cron de workers, permissões, fundação canônica e contratos editoriais.

A mudança arquitetural é a separação entre:

- o dado e a semântica usados;
- a narrativa e o plano de renderização;
- a certificação da candidata;
- a publicação efetivamente promovida ao documento vivo.

O deck passa a ser uma representação publicável, com rastreabilidade do que o originou. A publicação de agosto foi homologada em setembro com 57 páginas, segundo a PR #3 e seus fechamentos. Isso é evidência histórica de uma publicação específica, não verificação ao vivo do ponteiro em 31/10.

A PR #10 integra uma prova vertical de renderer Office. A #11, consultada nesta análise, permanece aberta: o piloto mensal não deve ser descrito como substituição produtiva concluída do renderer.

## 8. De 22 a 24 de setembro: o salto para aprendizado operacional

Esse é o ponto de maior mudança na natureza do produto. A sequência de PRs implementa o circuito em partes verificáveis:

| Corte | Capacidade | PRs principais |
|---|---|---|
| Release 1 | Workspace e separação entre consumir relatório e operá-lo | #13 |
| Release 2 | Fila sistêmica de eventos materiais | #14 |
| Release 3A/3B | Contrato persistido de aposta, decisão, execução e timeline | #15, #17 |
| Release 4 | Agenda de outcomes e revisão humana do veredito | #19 |
| Release 5 | Memória versionada, com origem e validade | #21 |
| Release 6 | Reutilização determinística de memória na próxima decisão | #23 |
| Release 7A/7B | Aposta iniciada na análise e retorno ao contexto original | #25, #27 |
| Release 7C | Projeção de apostas, outcomes e aprendizados no Report Live | #29 |

O objeto central deixa de ser somente o disparo: a **decisão verificável** ganha contrato próprio. Hipótese, ação, baseline, expectativa, janela, evidência e resultado passam a existir separadamente.

A proteção mais relevante é epistemológica: ação não executada não pode virar hipótese refutada; memória curada do vault não equivale a aprendizado validado por outcome; ausência de match não precisa ser preenchida com uma recomendação artificial.

A documentação registra cinco memórias curadas e zero memórias de outcome no estado inicial da Release 5. A Release 6 relata zero matches nos dez sinais consultados. Esses estados vazios demonstram que a infraestrutura preserva limites; não demonstram falta de funcionamento nem comprovam valor de negócio já realizado.

## 9. Final de setembro e início de outubro: a Wiki se conecta aos resultados

A PR #34 integra a biblioteca viva do vault; #35 a conecta ao loop. O Obsidian/OneDrive continua fonte canônica de edição e o GaaS recebe uma projeção pesquisável e auditável. Essa separação evita duas fontes concorrentes.

Entre 02 e 07/10, as PRs #36–#48 aproximam navegação por assuntos, resultados mensais, retrospectivas, parceiro, segmento, canal, conteúdo e jornada. A Wiki começa a funcionar como contexto da decisão, com acesso aos resultados do recorte.

A organização em seis pilares — contexto, evidência, evolução, retrospectiva, aposta/verificação e memória/reuso — expressa a convergência do projeto: resultado precisa vir acompanhado de interpretação, limite e próxima decisão.

## 10. Outubro: jornadas e conteúdo passam a ser reconciliados por execução

Os commits de 07–09/10 integram pacotes SFMC, prévias e fluxo visual de jornadas. Em 15/10, o catálogo recebe navegação progressiva. Em 19/10, a nota de Performance por Atividade registra o contrato que começa pelo resultado da atividade e só depois atribui o conteúdo quando há evidência suficiente.

Isso resolve uma distorção comum: uma atividade sem template vinculado não deve desaparecer da análise de produção. Resultado e cobertura de vínculo são informações diferentes.

A identidade exata por jornada, Activity Name e canal passa a orientar a atribuição, com origem, conflitos e reversão manual preservados. A documentação explicita que o mesmo conteúdo reutilizado em outro toque não muda de identidade e que o gráfico da jornada não prova passagem individual por seus ramos.

A Fábrica continua evoluindo em paralelo, incluindo templates Plurix e preparação de contexto para IA. O commit `98d9f9e`, de 29/10, registra a V17 limitada à audiência `COMUNICACAO_PLX`. O merge do código não comprova o Test Send dessa versão nem um disparo de produção.

## 11. De 22 a 30 de outubro: colaboração com IA e operação cotidiana

A PR #52 implementa pacotes completos de contexto, contribuições externas e revisão exclusiva do responsável. Aprovar uma contribuição não escreve no vault: a incorporação exige atualização local e confirmação posterior por hashes e sincronização. Memória passa a se chamar Registros na interface, preservando a rota técnica.

O mapa de conexões e as melhorias da Wiki tornam o acervo mais explorável. Em 28–29/10, páginas de resultado são reorganizadas por domínios, parceiros, públicos e mecanismos, mantendo evolução e retrospectiva juntas.

O fim do mês adiciona outra cadeia de capacidades:

- **PR #55:** motor determinístico e backtest em observação, com bloqueios de cobertura preservados.
- **PR #56:** piloto executável com fila durável e agendamento; não cria aposta nem candidata por simples observação.
- **PR #57:** investigação operada por Codex/Claude, com evidência versionada e decisão humana. A descrição registra um caso Plurix concluído e Proprietária/ANC bloqueado por ambiguidade.
- **PRs #60/#61:** Fila e notificações no planejamento, propostas de notas e prevalência da última decisão humana.
- **PR #62:** comunicação mais curta e contextual das próximas análises, sem reescrever automaticamente o histórico.

O app não passa a executar uma LLM agendada. O cron reconcilia estados e avisos; os agentes trabalham sob comando explícito e contratos próprios. No dia 30, biblioteca de skills, links por aba e posição do Loop de Memória na navegação reforçam sua centralidade no produto.

## Divergências que mudam a interpretação da história

| Registro encontrado | Reconciliação | Consequência |
|---|---|---|
| Nota legada diz que há apenas um commit | O histórico remoto atual contém 912 commits alcançáveis, com registros desde novembro de 2025 | Tratar a frase como descrição de uma limitação do checkout consultado à época. Não afirmar hoje que toda a história Git foi perdida. |
| Nota legada situa o nascimento de B2C em 27/04 | Commits de janeiro já corrigem e integram B2C; abril registra remodelagem e sync | Abril é consolidação comprovada, não origem absoluta. |
| Seção 7C da nota do loop diz que PR #29 ainda não foi mergeada | GitHub registra merge em 24/09; outra nota já registra a promoção | Separar o texto da candidata do estado posterior da integração. Isso não certifica publicação de um deck. |
| PR #33 aparece em textos históricos como aberta | Está fechada sem merge; conteúdo integrado pela #54 em 27/10, horário de São Paulo | Não contar a proposta como descartada nem considerar duas implementações independentes. |
| Datas UTC das PRs #54/#55 caem em 28/10 | Em São Paulo, os merges ocorreram na noite de 27/10 | Adotar um fuso único na cronologia. |
| Frontmatter antigo em notas que receberam seções posteriores | O corpo contém fatos posteriores à data `atualizado` | Frontmatter não é relógio suficiente para ordenar a evolução. |
| Registros de produção convivem com roadmap, candidata e piloto | O escopo e a evidência variam por seção | Classificar cada afirmação pelo que prova: intenção, código integrado, implantação registrada ou resultado observado. |

Essas divergências não foram corrigidas nas notas: esta análise apenas as registra. O lint também apontou links no formato de âncora compilada e notas com revisão antiga; sincronização perfeita não significa que todo conteúdo esteja atualizado semanticamente.

## O que essa evolução revela

**A continuidade é maior que a mudança de nomes.** O princípio de aproveitar o histórico atravessa o calendário, as sugestões, a reconciliação de conteúdo, o Report Live e a memória operacional. Minha interpretação é que o produto foi ampliando o significado de “histórico”: primeiro registros de envio, depois resultados comparáveis, e por fim decisões com evidência e verificação.

**A governança se tornou parte do valor do produto.** A separação entre zero e ausência, conteúdo e uso, origem e parceiro, proposta e decisão, curadoria e aprendizado deixou de ser apenas documentação e passou a aparecer em contratos e interfaces.

**O último mês busca transformar capacidade em rotina.** Fila, tarefas, avisos, propostas revisáveis e contexto para IA aproximam a arquitetura do trabalho diário. Isso é um avanço de operação; a evidência consultada ainda não permite quantificar seu impacto sobre velocidade de decisão ou resultado de aquisição.

**O próximo marco de maturidade é observável.** O próprio desenho do loop aponta para uma medida: apostas elegíveis com janela vencida, execução registrada, outcome revisado e aprendizado persistido. Para demonstrar valor do circuito, também importa observar reutilização desse aprendizado em decisões posteriores. Contagem de notas, commits ou recursos não substitui essa evidência.

## Fontes e material de auditoria

GitHub: [repositório](https://github.com/GrowthAfinz/GaaS-Framework-Afinz), [publicação durável #3](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/3), [fundação do loop #13](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/13), [memória #21](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/21), [reutilização #23](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/23), [biblioteca #34](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/34), [colaboração com IA #52](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/52), [investigação #57](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/57), [operação do loop #60](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/60).

Fontes locais aprofundadas, a partir da raiz do projeto:

- `ENTREGA.md` e `B2C_SYNC_REPORT_2026-04-27.md`.
- `docs/ontology/INDEX.md` e entradas do núcleo para princípios de contexto e proveniência.
- [98-Legado/08-Engenharia/Histórico-de-Evolução](legado.md#histórico-de-evolução) e `Pipeline-ML.md`.
- [00-Indice/Changelog-do-Vault](#changelog-do-vault).
- [05-Estrategia/Roadmap-Framework](core.md#roadmap-framework), `Ontologia-v2.md` e `Função-Objetivo.md`.
- [07-Evolucao/Decisões-Tomadas](#decisões-tomadas), `Performance-do-Conteudo-GaaS.md`, `Performance-Atividades-e-Fluxo-de-Jornadas.md` e `Resultados-Evolucao-e-Retrospectivas.md`.
- [08-Engenharia/ADR-001](engenharia.md#adr-001), `GaaS-Vault-Library.md` e `Report-Live-Versionamento-e-Publicacao.md`.
- [09-Inteligencia-IA/Loop-de-Aprendizado-Growth](ia.md#loop-de-aprendizado-growth), `Inteligencia-Compartilhada-GaaS.md` e `Operacao-Fila-Notificacoes-Notas-de-Resultado.md`.

Arquivos auxiliares nesta pasta: `inventario-notas.json` (479 caminhos com hashes, metadados, títulos e datas); `github-prs.json` (resposta de PRs); `github-commits-recentes.json`; `git-main-completo.txt` (histórico alcançável com datas de autor e committer); `inventariar.py` (rotina reproduzível de inventário).


## Relacionado

[MOC-Engenharia](engenharia.md#moc-engenharia) · [Changelog-do-Vault](#changelog-do-vault) · [Loop-de-Aprendizado-Growth](ia.md#loop-de-aprendizado-growth) · [Inteligencia-Compartilhada-GaaS](core.md#inteligencia-compartilhada-gaas)


---

## Funis-de-Onboarding-GaaS

> **tags:** `funil, onboarding, serasa, app, midia-paga, gaas` | **tipo:** `evolucao` | **camada:** `produto` | **atualizado:** `2026-07-22` | **status:** `confirmado` | **fonte:** `codigo-gaas-e-validacao-operador`

# Funis de Onboarding GaaS

## Estado atual

A aba **Análise → Funil de Aquisição** virou uma central com três leituras independentes:

1. **Funil Onboarding - Apps** — visão padrão e primeira opção; lê App completo, B2C + B2B2C e Plurix.
2. **Funil Onboarding - Serasa** — originação via API Serasa.
3. **Funil Onboarding - Mídia Paga** — campanhas B2C de App Install e StartTrial atribuído pela Meta.

As fontes não são somadas como se fossem um único funil causal. Cada visão preserva população, janela, granularidade e confiança próprias.

## Padrão visual validado

- referência técnica próxima de Excel/Power BI, com alta densidade e pouca ornamentação;
- cabeçalho contextual integrado ao seletor de funil;
- Funil completo antes da Evolução do funil;
- gráfico combinado com barras de volume e linhas de taxas no mesmo eixo temporal;
- Diária como abertura padrão, com Semanal e Mensal dentro do módulo;
- seletores retos e compactos para Volumes e Taxas;
- até quatro linhas de taxa simultâneas;
- gráfico continua exibindo taxas quando todos os volumes são removidos;
- linhas sem animação, com alto contraste e pontos vazados;
- detalhe diário com data, dia da semana, variação D-1, destaque de desvios, ordenação e exportação;
- ausência permanece vazia e nunca vira zero silenciosamente.

## Funil Apps

Fonte atual: snapshot TSV derivado do histórico manual do App Afinz.

Etapas disponíveis:

`Digitação CPF → Início onboarding → Geolocalização → Fotos documento → Biometria → Endereço → Personalização → Assinatura → Cartão concluído`

Recortes:

- **Funil Completo**: população total quando existe medida total certificada;
- **B2C + B2B2C**: `MARC_PLURIX = NAO`;
- **Plurix**: `MARC_PLURIX = SIM`.

Limite confirmado: a fonte separa Plurix do restante, mas não separa B2C de B2B2C. A medida `APROVADO` da etapa 1 foi excluída porque superava a entrada e não era compatível com a sequência. Para os recortes sem denominador, a taxa é omitida.

## Funil Serasa

Leitura operacional da API Serasa com volumes, taxas compatíveis e detalhe diário. O título canônico na interface é **API Serasa - Funil de Aquisição**.

APP e total conciliado permanecem fora dessa visão enquanto não houver correlação diária certificada entre fontes.

## Funil Mídia Paga

Escopo: família B2C App Install, preservando a atribuição Meta por fase.

Funil de decisão certificado:

`Impressão → Clique no link → Instalação → Sessão no app → App aberto/checkout → StartTrial atribuído`

As campanhas equivalentes de App Install podem compor topo e meio quando pertencem à mesma família de objetivo. StartTrial só aparece quando a campanha realmente retorna o indicador certificado.

Métricas de eficiência adicionadas: investimento, CPI e custo por início de proposta. Nunca chamar CPA de plataforma de CAC de cartão.

## Regra de leitura

- confirmado: evento, fórmula, janela e fonte reconciliados;
- direcional: leitura útil, mas com cobertura ou semântica ainda limitada;
- bloqueado: não usar em decisão até instrumentação ou fonte produtiva existir.

## Próximos passos

- substituir o snapshot do App por ingestão governada e recorrente;
- obter AppsFlyer como fonte do StartTrial total, onboarding concluído, split pago/orgânico e SubmitApplication;
- instrumentar `Card order completed` / SubmitApplication para fechar o fundo do funil;
- criar síntese Growth apenas com sinais comparáveis, mantendo drill para os três funis.

## Relacionado

- [Funil-Onboarding-Arquitetura-e-Ingestao](engenharia.md#funil-onboarding-arquitetura-e-ingestao)
- [MOC-Midia-Paga](core.md#moc-midia-paga)
- [Decisões-Tomadas](#decisões-tomadas)
- [Handoff Codex-Claude](../09-Inteligencia-IA/Handoff-Codex-Claude-Funil-Meta.txt)


---

## Galeria-de-Templates

> **tags:** `evolucao, template, criativo, ideia, llm` | **tipo:** `evolucao` | **camada:** `evolucao` | **atualizado:** `2026-07-15` | **status:** `implementado` | **fonte:** `operador`

# Galeria de Templates

> [!success] Evolução entregue em 2026-07-15
> A galeria passou a ser a entrada principal de **Comunicações → Performance do Conteúdo**, com seleção de segmento, leitura visual do `template_id`, rascunhos sob demanda e insights acionáveis.

## O que entrou no produto
- **Galeria como visão padrão**; Visão Geral e Tabela permanecem como leituras complementares.
- **Seleção de segmento antes das peças**, exibindo nome corrigido e etapa do funil de forma compacta.
- **Rascunhos desligados por padrão**, com controle explícito `off/on`.
- **Chips semânticos do Template ID**, traduzindo público, canal, campanha, segmento e ordem do disparo.
- **Caixa curta de insight e sugestão de análise**, conectada ao score e ao diagnóstico da peça.
- **Modal de detalhe corrigido**, acima do cabeçalho do GaaS, com fechamento reposicionado e identidade visual mais legível.

## Guardrails de governança implementados
- A identidade estrutural de público/BU tem precedência sobre similaridade textual e score.
- Campanhas `BB`, `BBT`, `B2B2C` e jornadas com `CRM` não podem sugerir ou vincular templates `B2C`.
- O identificador canônico continua preservado nos dados; a tradução ocorre apenas na camada visual.
- Matches rejeitados permanecem explicáveis e disponíveis para revisão humana.

Detalhamento operacional, auditoria e próximos passos: [Performance-do-Conteudo-GaaS](#performance-do-conteudo-gaas).

**Definição:** página no GaaS para **navegar pelas imagens dos templates e compará-los**, com extração de conteúdo via LLM no momento do armazenamento. Materializa a pergunta de negócio do conceito [Template](core.md#template) (*qual criativo gerou resposta?*) e a oportunidade aberta em [Eficiência-de-Criativo](dados.md#eficiência-de-criativo).

## Arquitetura proposta (conversa 2026-06-11)

### Armazenamento — Supabase Storage (Free dá conta)
- **Duas renditions por template**: preview WebP leve (~100 KB) para a grade da galeria + full WebP legível (qualidade 80, ~200–400 KB para e-mail inteiro) para leitura em zoom.
- Conta: ~1.000 templates ≈ 300–400 MB de 1 GB do plano Free; egress 5 GB/mês com CDN cobre 7 usuários com folga (thumbnail + lazy loading, full-res sob demanda).
- Válvula de escape se escalar: Cloudflare R2 (10 GB free) trocando só a URL base.
- ⚠️ Nunca hotlinkar imagens do CDN do Meta ([ad_creatives](dados.md#ad_creatives)) — as URLs **expiram**. Sempre copiar para o bucket próprio.

### Extração via LLM (skill / agendamento)
No upload, o template passa por análise de imagem que grava campos estruturados na tabela de templates:
- `texto_completo` (o conteúdo legível — tira da imagem a responsabilidade de ser "lida")
- `oferta`, `promocional` (conecta com a chave de intenção `(Oferta, Promocional)` do sistema de experimentos)
- `cta`, `elementos_visuais`, `tom`
- **Chave inferida do template** `jornada+canal+ordem+oferta+promocional` (mecanismo da [v2](legado.md#entidades-v2): confiança <80% → fila de revisão humana, padrão [gaas_update_runs](dados.md#gaas_update_runs))
- Hash/similaridade para detectar **reuso** do mesmo criativo entre disparos (ex.: D1 = D11, hoje invisível)

### Comparação
A comparação acontece por **dados estruturados** (filtro por CTA, agrupamento por oferta, diff de copy entre disparos), não só por imagens lado a lado. A galeria vira camada de inteligência de criativo do CRM, paralela ao que [ad_creatives](dados.md#ad_creatives) já é para mídia paga.

## Decisões abertas
- [ ] **Pipeline de captura** (o gargalo real): quem screenshota o template do SFMC, quando, e com que convenção de nome. Sem isso, galeria e LLM ficam sem matéria-prima.
  > 📎 Achado 2026-08-12: já existe um arquivo manual candidato a matéria-prima — pastas pessoais do Pablo `WHATSAPP AQUISIÇÃO COPA` (organizada por BU→Segmento/Etapa→variante de audiência, onda Copa 2026) e `COMUNICAÇÕES` (organizada por ano→BU→Segmento→Canal, com material de 2025). Ainda **não resolve** a decisão — três problemas ficaram claros na amostragem (12 imagens vistas, não é cobertura completa): (1) proveniência mista — parte dos prints da pasta Copa parece ser envio de teste/QA (nomes "Pablo"/"Pietra", limites com cara de placeholder), não confirmadamente disparo real pra base, então não dá pra tratar 1:1 como "o que já rodou"; (2) o canal indicado pela pasta nem sempre bate com o conteúdo real (um print de push estava dentro da árvore de WhatsApp); (3) os dois lotes têm formato de captura diferente (2025 mostra tags de merge cruas tipo `%%FirstName%%`, 2026/Copa mostra valores já preenchidos) — qualquer prompt de extração por LLM precisa lidar com as duas formas. Antes de promover isso a pipeline oficial, definir um campo de status de proveniência (ex. `preview_manual` vs `confirmado_disparo`) pra não inflar `communication_slots.coverage_status` com QA.
  > 📎 Atualização 2026-08-17: rodada a extração completa (não mais amostra) nas 73 imagens das duas pastas — dataset bruto salvo em [02-Entidades-Dados/Amostras-Comunicacoes-Reais](dados.md#amostras-comunicacoes-reais) (`dataset_completo.json` + `afinz_briefing_dataset.csv`, schema com `texto_completo`/`oferta`/`promocional`/`cta`/`elementos_visuais`/`tom` — os mesmos campos já especificados na seção "Extração via LLM" acima). Números confirmam os problemas apontados no achado anterior, agora na base inteira: **53/73 (73%) com indício de teste/QA**, **6/73 com canal da pasta divergente do canal real** (todas em `B2C/CARRINHO/DIÁRIO`, marcadas WhatsApp mas são push). Nenhuma linha foi vinculada a `template_id` — a tabela usa `template_id` como chave primária `NOT NULL` com validação de formato, então não dá pra promover essas linhas pra `communication_templates` sem atribuir um `template_id` real vindo da planilha de governança primeiro. O dataset está pronto como insumo; a decisão de pipeline oficial continua aberta.
  > 📎 Atualização 2026-08-17 (2): segunda fonte, de qualidade bem melhor — a planilha oficial de revisão `REVISÃO VIBE.xlsx` (upload do Pablo), que usa o recurso "imagem na célula" do Excel moderno (não drawings antigos; `openpyxl` não lê isso, foi preciso parsear `xl/richData` + `xl/metadata.xml` na mão). Extraídos os 61 templates embutidos, religados às suas linhas de origem em 4 abas (2 atuais + 2 históricas/"old", cobrindo justamente o "reuso invisível" citado acima: **106 referências de imagem em só 61 arquivos = 27 criativos reaproveitados em mais de uma linha**, agora seguível campo a campo). Diferença crucial para o blocker de `template_id`: **todos os 61 registros já têm o nome real do template no Salesforce** (`nome_template_salesforce`), e só 6/61 (10%) têm indício de teste/QA — muito mais limpo que o lote de screenshots pessoais. Ainda é candidato, não confirmado 1:1 contra `communication_templates.template_id` (não pular a validação humana da `gaas-governanca-comunicacoes`), mas é o melhor insumo disponível hoje para começar a fechar os 113 slots `unmapped` de [communication_slots](dados.md#communication_slots). Dataset em [02-Entidades-Dados/Templates-Vibe-Revisao-2026](dados.md#templates-vibe-revisao-2026); a mesma planilha também trouxe a matriz de régua planejada (`Estrutura BAU CRM - OFERTA VIBE`), usada como base da proposta em [Reguas-Inteligentes-Arquitetura](core.md#reguas-inteligentes-arquitetura).
- [ ] Onde roda a análise LLM: skill no Cowork (sob demanda/agendada) vs edge function.
- [ ] Tabela própria `templates` (promover Template a entidade) vs campos em [activities](dados.md#activities).
- [ ] Padrão de qualidade da rendition full (legibilidade de e-mail longo em mobile).

## Relacionado
- [Template](core.md#template) · [Eficiência-de-Criativo](dados.md#eficiência-de-criativo) · [ad_creatives](dados.md#ad_creatives) · [Criativos](legado.md#criativos) · [Experimento](core.md#experimento) · [Entidades-v2](legado.md#entidades-v2) · [Decisões-Abertas](#decisões-abertas) · [Amostras-Comunicacoes-Reais](dados.md#amostras-comunicacoes-reais) · [Templates-Vibe-Revisao-2026](dados.md#templates-vibe-revisao-2026) · [Reguas-Inteligentes-Arquitetura](core.md#reguas-inteligentes-arquitetura)


---

## Glossário-de-Siglas

> **tags:** `evolucao,referencia` | **tipo:** `evolucao` | **camada:** `evolucao` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Glossário de Siglas

**Definição:** decodificador rápido das siglas e termos internos.

| Sigla / Termo | Significado |
|---|---|
| GaaS | Growth as a Service — o sistema |
| CAC | Custo de Aquisição de Cliente |
| BU | Business Unit (B2C, B2B2C, Plurix, Seguros) |
| SFMC | Salesforce Marketing Cloud (plataforma de disparo) |
| MCP | Model Context Protocol (camada que liga IA aos dados) |
| RLS | Row Level Security (segurança de acesso no Supabase) |
| MOC | Map of Content (nota-índice do vault) |
| AARRR | funil Aquisição-Ativação-Retenção-Receita-Referência |
| Safra | mês de referência da campanha (MMMYY) |
| Vibe | oferta/benefício de cashback (alavanca de engajamento) |
| VDV | cliente/cartão da base existente no BI Visa Copa (vs Novos = adquiridos na campanha) — ver [copa_visa_daily](dados.md#copa_visa_daily) |

## Relacionado
- [🏠 HOME](core.md#-home) · [O-que-é-o-GaaS](legado.md#o-que-é-o-gaas) · [CAC](core.md#cac)


---

## Governança-de-Dados

> **tags:** `evolucao,governanca,risco` | **tipo:** `evolucao` | **camada:** `evolucao` | **atualizado:** `2026-06-08` | **status:** `a-validar` | **fonte:** `gaas-supabase`

# Governança de Dados

**Definição:** os pré-requisitos de confiabilidade para automação operar sem risco.

## Pontos críticos
- **RLS desabilitado em 11 tabelas** (incl. [activities via](dados.md#activities) correlatas, [campaign_context](dados.md#campaign_context), [goals](dados.md#goals), [rentabilizacao_activities](dados.md#rentabilizacao_activities)): com a anon key, qualquer um lê/escreve. Pré-requisito da [Fase 2](core.md#roadmap-framework) (quando o orquestrador escreve no banco). *Não bloqueia Fase 0/1 (leitura).*
- **Padronização de domínios** — ver [Inconsistências-a-Corrigir](#inconsistências-a-corrigir).
- **Unificação de modelos de campanha** — ver [Decisões-Abertas](#decisões-abertas).
- **Linguagem única** via [Ontologia-v2](core.md#ontologia-v2).

## Princípio
Governança de dado é pré-requisito de automação confiável — não burocracia.

## Relacionado
- [Ontologia-v2](core.md#ontologia-v2) · [Inconsistências-a-Corrigir](#inconsistências-a-corrigir) · [Decisões-Abertas](#decisões-abertas)


---

## Inconsistências-a-Corrigir

> **tags:** `evolucao,governanca,dados` | **tipo:** `evolucao` | **camada:** `evolucao` | **atualizado:** `2026-11-03` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Inconsistências a Corrigir

**Definição:** as duplicidades e lacunas reais nos dados, expostas ao reconciliar a [Ontologia-v2](core.md#ontologia-v2) com o Supabase.

> 📊 Snapshot 2026-06-08.

| Dimensão | Problema | Ação |
|---|---|---|
| [Parceiros](legado.md#parceiros) | "Bem Barato"(13) + "Bem_Barato"(11) | unificar → Bem_Barato |
| [Parceiros](legado.md#parceiros) | "Acordo Certo" | padronizar → Acordo_Certo |
| [Subgrupos](legado.md#subgrupos) | "Leais"(121) + "Leal"(1) | unificar |
| [Produtos](legado.md#produtos) | "Cartao" genérico (592) | mapear → Classic/Platinum (a validar) |
| [Ofertas](legado.md#ofertas) | 5 disparos sem oferta | corrigir origem |
| [Segmentos](legado.md#segmentos) | "Recencia de Compra" com espaço | → Recencia_de_Compra |
| [Safra](core.md#safra) | ~~"06/26"(117) + "05/26"(11) vs padrão AAAA-MM~~ | ✅ **corrigido 2026-06-10** (UPDATE → 2026-06/2026-05); novas ingestões devem validar regex `^\d{4}-\d{2}$` |

## Incongruências de taxonomia SFMC (fonte: skill `copa-crm-parser`)
| Problema | Tratamento |
|---|---|
| Bem Barato com 2 siglas: `bb` (e-mail) vs `bbt` (WPP) | ambos → Bem_Barato |
| Plurix: `plu_` nas activities vs `PLURIX` nas journeys | resolver por posição/journey |
| `upo` (público inexistente na taxonomia) | classificar como "Upload" |
| `rec` ambíguo: público=Recência vs área=Recorrente | resolver por posição no nome |
| Grafia de safra: `ABR26`=`ABRI26`, `MAI26`=`MAIO26` | normalizar |
| Journey sem BU: `JOR_AQUISICAO_BB_...` (falta `B2B2C_`) | ainda é Bem Barato |
| Carrinho abandonado usa `_aqs_` mas é Reativação | classificar pela journey (`*_ABD`) |
| Finalizados ECRED ausentes no SFMC (journeys ABD) | resultado real vem do GaaS (`Emitidos`) |

## Catálogo Vai de Visa (out/2026)

> 📊 Catálogo Visa mapeado na aba "Ofertas x Segmento" da spec; conferido em 03/11/2026.

| Problema | Ação |
|---|---|
| Lojas Lebes (fim 01/11/2026) e Unidas (fim 31/10/2026) já vencidas no primeiro disparo | tirar da [DE-BRIEFING_OFERTAS_VISA](dados.md#de-briefing_ofertas_visa) |
| 5 ofertas duplicadas (Seara, Giuliana Flores, L'Occitane en Provence, L'Occitane au Brésil, Movida) | manter uma linha |
| Riachuelo com oferta `0.1`; Decolar com `120`, `400`… sem "R$ OFF" | padronizar texto da oferta |
| Categoria "Saúde e Belezza" e "Saúde / Beleza" | normalizar → Saúde e Beleza |
| Brinquedos (b5) com 1 oferta; Eletrônicos (b4) com 1 acessível com R$ 200 | completar slots com genéricas ou pedir mais ofertas à Visa |
| Coluna "Top vendida Visa" vazia | ver [Decisões-Abertas](#decisões-abertas) item 16 |

## Arquivo "Ofertas_novembro" (Cupons Negociados | Novembro 2026)

| Problema | Tratamento |
|---|---|
| 4 linhas duplicadas (Seara, Giuliana Flores, L'Occitane ×2) | 62 ofertas únicas |
| Sem data fim e sem ticket mínimo em coluna própria | usados os da spec de out/26, conferidos com a descrição |
| Larroude: desconto 15%, descrição 10% · Zee Now: desconto 5%, descrição 10% | usado o da descrição; confirmar |
| Assist Card "apenas para MASS" | fora das vitrines até confirmar se Platinum pode |
| Spicy como Eletrodomésticos, mas é cozinha/mesa | Genérico (Casa) |
| Evino (bebida alcoólica) | exige aviso legal no card |

## Por que importa
Variação de grafia quebra agregação e distorce as bases de conhecimento (Fase 1). Corrigir é pré-requisito de comparabilidade.

## Relacionado
- [Governança-de-Dados](#governança-de-dados) · [Ontologia-v2](core.md#ontologia-v2) · [Taxonomia-Activity-Name](core.md#taxonomia-activity-name)


---

## Inventario-Operacoes-Growth

> **title:** `Inventário de operações e campanhas de Growth` | **tags:** `growth", "resultados", "inventario` | **tipo:** `guia-operacional` | **status:** `confirmado` | **fonte:** `auditoria-supabase-vault-2026-10-03` | **atualizado:** `2026-10-03` | **growth_catalog:** `{}`

# Inventário de operações e campanhas de Growth


Levantamento em 03/10/2026. O universo vai além dos cinco exemplos iniciais. Foram relidos os 221 arquivos Markdown atuais do vault e consultadas as dimensões de todas as linhas das fontes abaixo. As consultas são independentes, sem snapshot transacional. Fontes externas como SFMC, contas de anúncio, briefings privados fora do repositório e eventos ainda não ingeridos não foram auditadas.

## O que foi encontrado

| Fonte / unidade | Quantidade | Como interpretar |
|---|---|---|
| CRM Aquisição: linhas físicas | 7895 | Registro bruto, sem deduplicação automática |
| Escopos CRM: BU × segmento × parceiro | 33 | Unidades de descoberta; não operações de negócio confirmadas |
| Combinações CRM incluindo etapa e subgrupo | 60 | Variantes preservadas |
| Agrupamentos de campanha CRM | 669 | BU/segmento/parceiro/subgrupo/etapa/jornada/safra |
| Jornadas CRM distintas | 419 | Nome literal, sem fusão de variantes |
| Taxonomias CRM distintas | 2154 | Nome não é identidade única da execução |
| Rentabilização: linhas físicas | 8664 | Pode conter teste e seedlist; não prova produção comercial |
| Agrupamentos de campanha de rentabilização | 92 | Inclui seguros, Copa, welcome, uso e comunicações informativas |
| Famílias candidatas de rentabilização por BU | 43 | Classificação declarada por campos e nomes, sujeita a revisão |
| Mídia: linhas físicas | 8498 | Grão preservado; não somar campanha e anúncio |
| Nomes de campanha observados por plataforma | 29 | Identidade literal; nomes parecidos não fundidos |
| Identidades de mídia no cadastro canônico | 34 | Cadastro e execução são universos diferentes |
| Populações B2C | 3 | total, serasa_api e crm; populações sobrepostas |
| Recortes de onboarding e funis | 6 | App, Serasa BI, Neurotech e Marketplace |
| Grupos de campanha e origem AppsFlyer | 45 | App/OS/origem/campanha/qualidade; não campanhas causais de cartões |
| Réguas editoriais cadastradas | 3 | Plurix, Bem Barato e Dia; status editorial não prova disparo |
| Grupos editoriais de briefings | 78 | Grupo/parceiro/segmento/subgrupo/semana/status |

Os números acima **não devem ser somados** como um total de operações. Eles medem níveis diferentes e fontes sobrepostas. O registro contém 164 entradas tipadas para navegar entre escopos, famílias candidatas, campanhas, cadastros, populações e momentos documentados.

## Todas as entradas de CRM Aquisição

| ID | Assunto candidato | Linhas | Etapas físicas | Subgrupos |
|---|---|---|---|---|
| CRM-3bd920ad5c | Carrinho abandonado — Bem Barato — B2B2C | 100 | Reativacao | Diario |
| CRM-c063e536a7 | Carrinho abandonado — Dia — B2B2C | 1 | Reativacao | Diario |
| CRM-b9d196a55b | Finalização de proposta e Upgrade candidato — Bem Barato — B2B2C | 12 | Meio_de_Funil, Reativacao | Diario, N/A |
| CRM-e3372078aa | Topo de funil CRM candidato — Alvorada — B2B2C | 14 | Aquisicao, Meio_de_Funil | N/A |
| CRM-86b77dd1bc | Topo de funil CRM candidato — Bem Barato — B2B2C | 193 | Aquisicao | N/A |
| CRM-073dcbe686 | Topo de funil CRM candidato — Dia — B2B2C | 215 | Aquisicao, Reativacao | Diario, N/A, Novos |
| CRM-91f6d115db | Topo de funil CRM candidato — N/A — B2B2C | 1 | Meio_de_Funil | N/A |
| CRM-cc03a5f98d | Recuperação após instabilidade — Bem Barato — B2B2C | 1 | Reativacao | N/A |
| CRM-e3353b859a | Repescagem candidata — Bem Barato — B2B2C | 13 | Meio_de_Funil | N/A |
| CRM-24693c62ef | Repescagem candidata — Dia — B2B2C | 2 | Meio_de_Funil | N/A |
| CRM-f5ee848cf4 | Acionamento por compra recente — Bem Barato — B2B2C | 1 | Aquisicao | Compradores D-7 |
| CRM-2cc364c6bd | Carrinho abandonado — Proprietaria — B2C | 1206 | Reativacao | Abandonados D-21 A D>7, Abandonados D-7, Diario, N/A |
| CRM-f9b25b84df | Carrinho abandonado — Serasa — B2C | 1158 | Reativacao | Abandonados D-21 A D>7, Abandonados D-7, Diario |
| CRM-a695575900 | Finalização de proposta e Upgrade candidato — Proprietaria — B2C | 116 | Meio_de_Funil, Reativacao | Diario, N/A |
| CRM-85fefd8ebc | Finalização de proposta e Upgrade candidato — Serasa — B2C | 6 | Meio_de_Funil | N/A |
| CRM-6714bb10d7 | Acionamento da base proprietária — Proprietaria — B2C | 1187 | Aquisicao, Meio_de_Funil | N/A |
| CRM-e2dbd0d4bf | Acionamento da base proprietária — Serasa — B2C | 1 | Meio_de_Funil | N/A |
| CRM-798bf8f3a7 | Recuperação após instabilidade — Proprietaria — B2C | 2 | Meio_de_Funil, Reativacao | N/A |
| CRM-6e7d329c84 | Recuperação após instabilidade — Serasa — B2C | 4 | Meio_de_Funil | N/A |
| CRM-b34ee27854 | Originação por leads de parceiros — Acordo Certo — B2C | 7 | Meio_de_Funil | N/A |
| CRM-beb36081a4 | Originação por leads de parceiros — Bom_Pra_Credito — B2C | 40 | Meio_de_Funil | N/A |
| CRM-5eaebf1046 | Originação por leads de parceiros — Proprietaria — B2C | 28 | Meio_de_Funil | N/A |
| CRM-e63826e827 | Originação por leads de parceiros — Serasa — B2C | 82 | Meio_de_Funil | N/A |
| CRM-89856bcf7b | Repescagem candidata — Proprietaria — B2C | 252 | Meio_de_Funil | N/A |
| CRM-bdc57e480d | Carrinho abandonado — Plurix — Plurix | 2072 | Reativacao | Abandonados D-7, Diario, N/A |
| CRM-015928e5ba | Finalização de proposta e Upgrade candidato — Plurix — Plurix | 53 | Meio_de_Funil, Reativacao | Diario, N/A |
| CRM-9475544ed5 | Topo de funil CRM candidato — N/A — Plurix | 1 | Aquisicao | Leais |
| CRM-6d4dfb4e59 | Topo de funil CRM candidato — Plurix — Plurix | 1018 | Aquisicao | Ativacao, Churn, Frequentes, Leais, Leal, N/A, Novos, Ocasional, Pre_Churn, Sem Segmento |
| CRM-bcaf001164 | Acionamento de cartonistas e migração candidata — N/A — Plurix | 16 | Aquisicao | Ativo, N/A |
| CRM-0104a32e90 | Acionamento de cartonistas e migração candidata — Plurix — Plurix | 14 | Aquisicao | Ativo, N/A |
| CRM-ac74764beb | Recuperação após instabilidade — N/A — Plurix | 1 | Reativacao | N/A |
| CRM-92fbd40403 | Repescagem candidata — Plurix — Plurix | 49 | Meio_de_Funil | N/A |
| CRM-4b4cf35f73 | Acionamento por compra recente — Plurix — Plurix | 29 | Aquisicao | Compradores D-7 |

As 60 combinações e os 669 agrupamentos estão nos CSVs, preservando todos os vínculos, nomes e períodos. A classificação usa segmento e parceiro para localizar candidatos. Não comprova gatilhos, reanálise de crédito, intenção de cada peça ou estado individual de clientes.

## Famílias observadas em rentabilização e seguros

| ID | Família candidata | BU | Linhas | Agrupamentos |
|---|---|---|---|---|
| RENT-09a331cabd | Ativação | B2B2C | 1 | 1 |
| RENT-1565b28c8f | Black Friday inativos | B2B2C | 3 | 1 |
| RENT-7f04768511 | Copa Ativação | B2B2C | 1246 | 6 |
| RENT-68eae484cf | Copa Cartonistas | B2B2C | 12 | 1 |
| RENT-de7adb7cce | Copa Novos | B2B2C | 299 | 1 |
| RENT-fcb2005be4 | Copa Reativação | B2B2C | 342 | 2 |
| RENT-deaef88d25 | Copa cadastro incompleto | B2B2C | 1 | 1 |
| RENT-e26f566672 | Copa eventos e lembretes | B2B2C | 9 | 7 |
| RENT-77f8f33e8f | Copa incentivo ao cadastro | B2B2C | 15 | 1 |
| RENT-3d51d00ed6 | Copa público cadastrado | B2B2C | 83 | 1 |
| RENT-093062a4b8 | Incentivo ao uso Sorridentes e GIO | B2B2C | 2 | 1 |
| RENT-55b43e6e2a | Incentivo ao uso demais parceiros | B2B2C | 2 | 1 |
| RENT-839315987f | Oferta de investimento CDB | B2B2C | 4 | 2 |
| RENT-339eff5a34 | Aniversário com parceiro | B2C | 1 | 1 |
| RENT-7cfb8b35bf | Cadastro pontual | B2C | 16 | 1 |
| RENT-0500aab9d6 | Copa Ativação | B2C | 2 | 1 |
| RENT-aede134f3d | Desbloqueio | B2C | 366 | 1 |
| RENT-1752944e1c | Incentivo ao uso | B2C | 1308 | 1 |
| RENT-7b62e804a9 | Pagamento de contas | B2C | 2 | 1 |
| RENT-96f7a0892e | Pool de ofertas | B2C | 13 | 2 |
| RENT-6ca0baf5f3 | Recarga de celular | B2C | 1 | 1 |
| RENT-a9cebf447f | Recuperação de inativos no aniversário Afinz | B2C | 10 | 5 |
| RENT-63c4e611b8 | Welcome | B2C | 235 | 2 |
| RENT-392d973d79 | Ativação | Plurix | 10 | 2 |
| RENT-328952fe4d | Aumento de limite de cartonistas | Plurix | 1 | 1 |
| RENT-cafe598fb3 | Ação Avenida | Plurix | 1 | 1 |
| RENT-bda382d827 | Copa Ativação | Plurix | 95 | 3 |
| RENT-8cc1b6d474 | Copa Cartonistas | Plurix | 1 | 1 |
| RENT-bfa7c5c65b | Copa Novos | Plurix | 343 | 1 |
| RENT-e833be777d | Copa eventos e lembretes | Plurix | 3 | 3 |
| RENT-9bbaebd866 | Desbloqueio | Plurix | 917 | 1 |
| RENT-f73bceeb96 | Desbloqueio pós-tombamento | Plurix | 34 | 2 |
| RENT-2f0e84a868 | Incentivo ao uso | Plurix | 993 | 1 |
| RENT-16761c8a3a | Informativo de encerramento de pontos | Plurix | 1 | 1 |
| RENT-2cbba934fa | Natal Avenida | Plurix | 4 | 1 |
| RENT-0a46d97819 | Oferta de seguro em Plurix | Plurix | 79 | 1 |
| RENT-6afea2d2e0 | Seedlist nomeada | Plurix | 556 | 1 |
| RENT-5051e37f02 | Teste nomeado | Plurix | 1 | 1 |
| RENT-cd4c748d2b | Welcome | Plurix | 1017 | 1 |
| RENT-613bd68a2c | Carrinho de Seguro Mulher | Seguros | 372 | 3 |
| RENT-bc1d462c4c | Oferta Seguro Mulher | Seguros | 165 | 14 |
| RENT-7ab8558f4b | Seguro Residência 24h | Seguros | 95 | 9 |
| RENT-929cf587a1 | Teste nomeado | Seguros | 3 | 2 |

Parceiro aparece como N/A nessa fonte e foi preservado. Redes citadas em nomes são pistas, não identidades canônicas confirmadas. Aumento de limite de cartonistas em rentabilização permanece separado do conceito Upgrade de propostas em aquisição. Seguros e uso não herdam CAC/cartões como resultado apenas por possuírem campos semelhantes.

## Todas as campanhas de mídia observadas

| Plataforma | Campanha | Objetivo de negócio registrado | Período observado | Grão | Alias exato |
|---|---|---|---|---|---|
| google | [Afinz  /  Fábrica de Vendas] [RENTABILIZACAO][COPA]DISPLAY_B2C_VISA | rentabilizacao | 2026-08-13 a 2026-08-13 | ad | não |
| google | [Fábrica de Vendas - Cartões] [RENTABILIZACAO][COPA]DISPLAY_B2C_VISA | rentabilizacao | 2026-04-18 a 2026-08-17 | ad | sim |
| google | [Institucional] [009] [TMP] [B2C] [Demand] - Cartão de Crédito | marca | 2025-01-01 a 2026-01-08 | campaign | sim |
| google | [Institucional] [010] [TMP] [B2C] [Youtube] Cartão de Crédito | marca | 2025-01-01 a 2026-01-08 | campaign | sim |
| google | [Institucional] [011] [TMP] [B2C] [PMAX] Cartão de Crédito Download  /  QR CODE | b2c | 2025-01-01 a 2026-01-29 | campaign | sim |
| google | [Institucional] [012] [TMP] [MARCA] [Pesquisa] Institucional | marca | 2025-01-01 a 2025-10-08 | campaign | sim |
| google | [Institucional] [013] [TMP] [B2B] [Pesquisa] [Formulário] | marca | 2025-01-01 a 2025-04-08 | campaign | sim |
| google | [Institucional] [014] [TMP] [B2B] [Youtube] Cartão para Loja | marca | 2025-01-01 a 2025-04-08 | campaign | sim |
| google | [Institucional] [016] [TMP] [B2C] Display  /  QR CODE | marca | 2025-01-01 a 2025-09-10 | campaign | sim |
| google | [Institucional] [016] [TMP] [B2C] Display  /  QR CODE  /  VIBE | b2c | 2025-04-15 a 2025-05-29 | campaign | sim |
| google | [Institucional] [018] [TMP] [B2C] PMAX  /  Alvorada | b2c | 2025-03-25 a 2025-04-08 | campaign | sim |
| google | [Institucional] [14] [TMP] [S] Não Institucional  /  B2C | marca | 2025-01-01 a 2025-01-16 | campaign | sim |
| google | [Institucional] [15] [TMP] [GDN] B2C - Cartão de crédito | b2c | 2025-01-01 a 2025-01-16 | campaign | sim |
| google | [Institucional] [COPA][AQUISICAO]APP_INSTALL_B2C | aquisicao | 2026-04-16 a 2026-05-20 | ad, campaign | sim |
| meta | [007B] [TMP] Download App Matriz_BID2 | aquisicao | 2025-07-14 a 2025-08-11 | ad | sim |
| meta | [007] [TMP] Download App Matriz | aquisicao | 2025-01-01 a 2026-02-25 | ad | sim |
| meta | [02] [TMP]  Download App Advantage+ | aquisicao | 2025-01-01 a 2025-01-21 | ad | sim |
| meta | [Afinz  /  Fábrica de Vendas] [B2C]App_Install_Emissao_Afinz | pendente | 2026-08-20 a 2026-10-01 | ad | não |
| meta | [Afinz  /  Fábrica de Vendas] [B2C]App_Install_Onboarding_Afinz | aquisicao | 2026-08-28 a 2026-10-01 | ad | sim |
| meta | [Afinz  /  Fábrica de Vendas] [SEGUROS]Conversão_Leads | seguros | 2026-08-20 a 2026-10-01 | ad | sim |
| meta | [Afinz  /  Fábrica de Vendas] [SEGUROS]Conversão_Vendas | pendente | 2026-09-30 a 2026-10-01 | ad | não |
| meta | [B2C]App_Install_Afinz | aquisicao | 2025-01-01 a 2026-06-23 | ad | sim |
| meta | [B2C]App_Install_Emissao_Afinz | pendente | 2026-08-05 a 2026-08-18 | ad | não |
| meta | [B2C]App_Install_Onboarding_Afinz | aquisicao | 2026-06-22 a 2026-08-17 | ad | sim |
| meta | [Black Friday] Alcance | aquisicao | 2025-11-26 a 2025-12-17 | ad | sim |
| meta | [PLURIX]App_Install_Mais_Amigo | plurix | 2026-03-05 a 2026-08-11 | ad | sim |
| meta | [RENTABILIZACAO][COPA]Trafego_LP_Visa | rentabilizacao | 2026-05-11 a 2026-07-02 | ad | sim |
| meta | [RENTABILIZACAO][COPA]Trafego_LP_Visa_V2 | pendente | 2026-07-02 a 2026-08-19 | ad | não |
| meta | [SEGUROS]Conversão_Leads | seguros | 2026-04-06 a 2026-08-19 | ad | sim |

5 nomes/plataformas observados não têm alias exato no cadastro consultado. O inventário preserva esses nomes e os cadastros sem correspondência. Objetivo de plataforma (conversion, app_installs etc.) não substitui objetivo de negócio. Certificação de cadastro é mantida conforme a fonte; não certifica métrica ou atribuição.

## B2C, onboarding e Copa

| Assunto | Fonte | Linhas | Primeira data | Última data |
|---|---|---|---|---|
| Originação B2C — crm | b2c_daily_metrics | 31 | 2026-05-01 | 2026-05-31 |
| Originação B2C — serasa_api | b2c_daily_metrics | 270 | 2026-01-01 | 2026-09-27 |
| Originação B2C — total | b2c_daily_metrics | 635 | 2025-01-01 | 2026-09-27 |
| app_afinz_funnel_daily_raw — SIM | app_afinz_funnel_daily_raw | 952 | 2026-05-23 | 2026-09-28 |
| app_afinz_funnel_daily_raw — 0 | app_afinz_funnel_daily_raw | 395 | 2026-01-01 | 2026-09-28 |
| app_afinz_funnel_daily_raw — NAO | app_afinz_funnel_daily_raw | 1051 | 2026-05-23 | 2026-09-28 |
| serasa_bi_daily_funnel — Serasa BI | serasa_bi_daily_funnel | 193 | 2026-01-01 | 2026-07-12 |
| serasa_bi_neurotech_daily_funnel — Neurotech | serasa_bi_neurotech_daily_funnel | 271 | 2026-01-01 | 2026-09-28 |
| serasa_marketplace_daily_funnel — Marketplace | serasa_marketplace_daily_funnel | 57 | 2026-06-01 | 2026-07-27 |
| LP — __total__ | copa_lp_daily | 123 | 2026-04-15 | 2026-08-15 |
| LP — (direct) | copa_lp_daily | 58 | 2026-04-15 | 2026-06-11 |
| LP — (todas_origens) | copa_lp_daily | 19 | 2026-04-30 | 2026-06-11 |
| LP — (todas_origens) | copa_lp_daily | 57 | 2026-04-16 | 2026-06-11 |
| LP — (todas_origens) | copa_lp_daily | 58 | 2026-04-15 | 2026-06-11 |
| LP — (todas_origens) | copa_lp_daily | 58 | 2026-04-15 | 2026-06-11 |
| LP — (todas_origens) | copa_lp_daily | 58 | 2026-04-15 | 2026-06-11 |
| LP — afz_car_vis_rnt_sms_atv_disp2_pontual | copa_lp_daily | 57 | 2026-04-15 | 2026-06-10 |
| LP — facebook | copa_lp_daily | 32 | 2026-05-11 | 2026-06-11 |
| LP — google | copa_lp_daily | 57 | 2026-04-16 | 2026-06-11 |
| LP — sfmc | copa_lp_daily | 47 | 2026-04-24 | 2026-06-11 |
| Visa — daily | copa_visa_daily | 122 | 2026-04-15 | 2026-08-15 |

Total B2C inclui componentes. Serasa, funis e AppsFlyer são perspectivas relacionadas, não somas de uma mesma jornada causal. O App apresenta 0, NAO e SIM em MARC_PLURIX; a equivalência de 0 com NAO depende da regra de ingestão e de sua vigência. Os recortes __total__ da LP são preservados sem soma às origens.

## Réguas, peças e assuntos documentados

Há 115 slots e 211 templates cadastrados. O inventário de slots preserva jornada, canal, cobertura e estado. As três réguas editoriais cadastradas são Topo de Funil Bem Barato, Topo de Funil Dia e Topo de Funil +amigo/Plurix. Elas podem contextualizar campanhas existentes, mas o vínculo por versão, atividade e execução ainda precisa de confirmação.

O vault também documenta Vibe adesão, crédito recebido, primeiro resgate, segunda e terceira transação, sorteios e a lacuna de variante Bem Mais. Esses momentos foram registrados como conhecimento documentado com execução não reconciliada, e não como novas campanhas ativas. Condições comerciais históricas e cronogramas não foram assumidos vigentes.

## Ambiguidades que mudam o entendimento

- DIA: existem 49 linhas de CRM em Reativacao cuja jornada contém CRM_AQUISICAO. Não converter silenciosamente esse conjunto em carrinho ou topo.
- Plurix: Cartonistas reúne sinais de tombamento/migração e vendas, com etapa física Aquisicao. A intenção precisa ser desdobrada antes da nota final.
- Upgrade: nova análise e comparação de limites não são colunas de activities. Aprovados_nao_convertidos é um público candidato, não prova de Upgrade.
- Repescagem: Negados descreve o passado; confirmar a nova elegibilidade antes de dar esse nome a todas as campanhas.
- Plurix tem linhas com Oferta Vibe. A ficha +amigo não permite transportar esse benefício por analogia; investigar período, produto e classificação.
- Rentabilização inclui welcome, desbloqueio pós-tombamento, seguros, CDB, funcionalidades e informativos. Cada mecanismo precisa de evento próprio de sucesso.
- Nomes de teste, seedlist e SDK foram mantidos e sinalizados. Não são automaticamente operações comerciais nem registros que podem ser apagados.

## Como transformar o inventário em Wiki

1. Escolher o mecanismo e a pergunta de negócio de cada candidato, preservando sua origem e suas ambiguidades.
2. Dar identidade estável à operação e relacionar campanhas/variantes. Fundir apenas com evidência de equivalência; separar quando gatilho, propósito ou evento de sucesso diferirem.
3. Criar entradas por operação, parceiro, público e etapa que apontem aos mesmos registros. CRM, Varejo, Serasa, migração, ativação, uso, seguros, mídia e originação precisam de trilhas próprias conectadas.
4. Todo assunto com resultados apresenta evolução mensal, cobertura e retrospectiva do mesmo recorte. Campanhas sazonais mantêm o histórico do ciclo e a ligação com a operação recorrente quando aplicável.
5. O Word reúne os assuntos selecionados para o período e preserva IDs, definições, evidências e decisões. O catálogo completo permanece consultável; o relatório não precisa despejar todos os registros.

## Cobertura e reprodução

A cobertura de CRM reconcilia 669 agrupamentos e 60 combinações aos 7.895 registros. Rentabilização reconcilia 92 agrupamentos aos 8.664 registros. Mídia reconcilia 32 grupos de nome/objetivo/grão aos 8.498 registros. B2C reconcilia suas três populações aos 936 registros. Essa conciliação certifica a cobertura do inventário, não a ausência de duplicidade ou a validade de resultados.

Regra de campanhas deste inventário inclui jornada para preservar fluxos distintos. Ela é uma chave de descoberta, não afirmação de que todo agrupamento corresponde a uma campanha aprovada. Classificação de rentabilização está declarada no script e nos campos classification_rule do CSV. Nenhuma taxonomia ou dado vivo foi alterado.


## Navegar por parceiro

[Acordo Certo](resultados-1.md#parceiro-acordo-certo) · [Alvorada](resultados-1.md#parceiro-alvorada) · [Bem Barato](resultados-1.md#parceiro-bem-barato) · [Bom_Pra_Credito](resultados-1.md#parceiro-bom-pra-credito) · [Dia](resultados-1.md#parceiro-dia) · [Plurix](resultados-1.md#parceiro-plurix) · [Proprietaria](resultados-1.md#parceiro-proprietaria) · [Serasa](resultados-1.md#parceiro-serasa)

## Navegar por segmento

[Abandonados](resultados-1.md#segmento-abandonados) · [Aprovados_nao_convertidos](resultados-1.md#segmento-aprovados-nao-convertidos) · [Base_Proprietaria](resultados-1.md#segmento-base-proprietaria) · [CRM](resultados-1.md#segmento-crm) · [Cartonistas](resultados-1.md#segmento-cartonistas) · [Instabilidade](resultados-1.md#segmento-instabilidade) · [Leads_Parceiros](resultados-1.md#segmento-leads-parceiros) · [Negados](resultados-1.md#segmento-negados) · [Recencia_de_Compra](resultados-1.md#segmento-recencia-de-compra)


---

## Performance-Atividades-e-Fluxo-de-Jornadas

> **tags:** `gaas, comunicacoes, performance, sfmc, jornadas` | **tipo:** `implementacao` | **camada:** `evolucao` | **atualizado:** `2026-10-19` | **status:** `confirmado` | **fonte:** `codigo-gaas-e-supabase`

# Performance por atividade e Fluxo de Jornadas

Contrato aprovado por Pablo e implementado em 19/10/2026. Complementa [Performance-do-Conteudo-GaaS](#performance-do-conteudo-gaas). A interface foi publicada pelo commit 692f00d; o ajuste de reversão manual está na main em afe4965 e nas migrations aplicadas no Supabase.

## Resultado antes do vínculo

Performance responde primeiro qual foi o resultado e depois a quais conteúdos é possível atribuí-lo. Todos é um recorte junto de Com template vinculado, Vínculos pendentes e Comunicações aprovadas. Visão Geral, Galeria e Tabela são modos de apresentação.

Todos contém atividades com registros no período global, independentemente de template_id. Uma atividade é agrupada por BU de negócio, jornada normalizada, Activity Name exata e canal. Execuções são contadas por activities.id após a projeção de revisões de duplicidade válidas. Atividades e execuções têm contagens distintas; conteúdos aprovados não são somados a grupos de atividades.

Sem template vinculado aparece explicitamente, com atalho para Cadastro e templates que leva jornada, Activity Name, canal e IDs pendentes. A volta preserva os filtros e o modo da Performance.

## Fluxo e resultados compartilhados

O leitor de comunicação não exige template_id para exibir os resultados da atividade exata. Fluxo e Performance compartilham KPIs de base total/acionável, aberturas, cliques, propostas, aprovados, cartões, custo e CAC, funil e evolução diária em barras de volume e linha de taxa. Ausências não viram zero; taxas e CAC exigem cobertura completa dos componentes. O painel da jornada consulta todas as páginas antes de totalizar.

Momento operacional, tempo relativo do grafo e identidade do conteúdo permanecem separados. Reuso de uma peça em outro toque não altera seu ID nem a posição do nó. Os resultados registrados não comprovam passagem individual por ramos nem a versão enviada.

## Automação e exceções

Entrada de dados, ingestão de pack e aprovação de novo ID tentam correspondência exata por jornada, Activity Name e canal. A conta SFMC declarada é respeitada; não se escolhe por score, semelhança ou ordinal. Exige um único ID conhecido/aprovado, sem conflito de origem ou de vínculo histórico. Templates novos exigem aprovação; usos exatos conhecidos não exigem confirmação repetitiva.

Se a mesma atividade apresentar templates diferentes, notificar e suspender novas atribuições automáticas. Preservar vínculos anteriores. communication_auto_links registra fonte, regra e estado anterior; correção ou reversão manual revoga a decisão automática para aquela execução.

## Ingestões

Configurações → Packs SFMC exibe histórico recebido, jornadas/versões, conteúdos pendentes e notificações. Data do recebimento, data de criação do snapshot e última execução são distintas. BU SFMC Afinz/Plurix é diferente das dimensões de negócio B2C/B2B2C/Plurix. Origens legadas B2C não comprovam a conta física; não atribuir uma BU nem uma última atualização sem evidência. Próximas cargas por agente devem declarar --escopo Afinz ou --escopo Plurix.

## Evidência da implantação

As migrations 20261019141419_content_performance_integration, 20261019142130_approved_proposal_auto_attribution e 20261019142534_automatic_attribution_manual_override foram aplicadas ao projeto mipiwxadnpwtcgfcedym.

A primeira reconciliação criou 29 vínculos, preservando os 1.169 anteriores e os valores de origem/métricas dos 8.150 registros. Outubro manteve 227 execuções e 685 cartões registrados; a quantidade com vínculo passou de 16 para 35. Os envios de 05 e 06/10 da atividade afz_car_vis_aqs_email_bsp_disp1s1vibe_pontual na jornada B2C SEM1 foram associados a b2c_email_vibe_bsp_S1D01.

Validação: 482 testes frontend; contratos SQL de atribuição, aprovação, divergência, acesso e reversão; QA isolado de Galeria, Tabela, Visão Geral, modal, navegação ao cadastro e mobile; regressão TypeScript e build. Histórico técnico em calendar-estrategico/docs/reference/SFMC_PACKAGE_INGESTION.md.


---

## Performance-do-Conteudo-GaaS

> **tags:** `evolucao, gaas, comunicacoes, template, ux, governanca` | **tipo:** `evolucao` | **camada:** `evolucao` | **atualizado:** `2026-07-15` | **status:** `implementado` | **fonte:** `produto-e-codigo`

# Performance do Conteúdo no GaaS

**Definição:** camada de navegação, comparação e diagnóstico das peças de CRM em **Comunicações → Performance do Conteúdo**, conectando criativo, Template ID, Activity Name, segmento, jornada e resultado.

## Avanços entregues em 2026-07-15

### Navegação orientada à peça
- A **Galeria** passou a ser a aba inicial.
- Visão Geral e Tabela continuam disponíveis para síntese e análise tabular.
- A seleção de **segmento** acontece antes da exibição das peças, com nome normalizado e etapa do funil ao lado.
- Filtros por canal, busca e segmento trabalham sobre o mesmo recorte.
- **Rascunhos ficam ocultos por padrão** e aparecem apenas quando o operador liga o controle.

### Inteligência acionável
- Inclusão de uma caixa compacta de **insight e sugestão de análise**.
- Cards mantêm score, abertura, CTR, cartões e CAC estimado, com diagnóstico visual do principal gargalo.
- A visão geral prioriza peça campeã e ações sugeridas; o detalhe permite aprofundar score, funil e evolução.

### Tradução visual do Template ID
Quando a peça é nomeada diretamente pelo identificador, o produto prioriza chips legíveis sem alterar a identidade canônica:

- `b2c_email_copa_bsp_S3D01` → **B2C · E-mail · Copa · Base Proprietária · Semana 3 · Disparo 1**
- `b2c_wpp_copa_ngd_D3` → **B2C · WhatsApp · Copa · Negados · Disparo 3**

A regra foi aplicada nos pontos em que a leitura rápida é mais importante: galeria, tabela, ranking, peça campeã, ações sugeridas e modal de detalhe. O código original continua acessível como referência técnica.

### Modal de detalhe
- Overlay elevado acima do cabeçalho global, eliminando a sobreposição visual com o GaaS.
- Área útil ampliada para preview e indicadores.
- Botão de fechar movido para uma posição previsível no canto superior direito.
- Cabeçalho de identidade mais estável, priorizando chips e contexto da peça.

## Correção da inteligência de match

O matcher passou a aplicar **compatibilidade estrutural antes do score de similaridade**:

1. Extrai público/BU do Activity Name, jornada e Template ID.
2. Dá precedência aos sinais `bb`, `bbt`, `b2b2c` e `crm` sobre tokens genéricos de campanha.
3. Rejeita candidatos de identidade incompatível antes de calcular ou exibir a sugestão.
4. Mantém a justificativa do match visível para validação humana.

Isso impede que campanhas do Banco do Brasil/B2B2C, cujo `CRM` pertence a esse universo, sejam interpretadas como disparos B2C apenas por compartilharem canal, campanha ou ordem.

## Auditoria da base

Foi encontrado e corrigido um vínculo cruzado:

- Activity Name: `afz_car_bbt_aqs_email_bsp_disp1s2copa_pontual`
- vínculo incorreto: `b2c_email_copa_bsp_S2D01`
- vínculo corrigido: `bb_email_copa_crm_S2D01`

Após a correção, a validação não encontrou outros cruzamentos **BB/B2B2C × B2C** no recorte auditado.

## Evidência de implementação
- `40f3efb` — aprofundamento do matcher e correção do vínculo na base.
- `6244d37` — tradução visual do Template ID e correções do modal.
- Alterações publicadas na `main`, com build da aplicação e do GitHub Pages validados.

## Próximos avanços recomendados
- [ ] Criar monitor recorrente de incompatibilidades estruturais entre Activity Name, jornada e Template ID.
- [ ] Exibir quantidade de peças sem vínculo por segmento, evitando que um segmento desapareça silenciosamente da seleção.
- [ ] Criar fila de templates ativos sem preview/criativo vinculado.
- [ ] Medir uso de Galeria, Visão Geral, Tabela, filtros e abertura do detalhe.
- [ ] Evoluir o insight para comparar cada peça com pares do mesmo segmento, etapa de funil e canal.

## Relacionado
- [Galeria-de-Templates](#galeria-de-templates) · [Template](core.md#template) · [Taxonomia-Activity-Name](core.md#taxonomia-activity-name) · [Eficiência-de-Criativo](dados.md#eficiência-de-criativo) · [Decisões-Tomadas](#decisões-tomadas)


---
