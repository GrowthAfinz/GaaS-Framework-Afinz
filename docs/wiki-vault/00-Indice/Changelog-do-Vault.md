---
tags: [indice,changelog,meta]
tipo: moc
camada: indice
atualizado: 2026-11-03
status: confirmado
fonte: gaas-supabase
---

# Changelog do Vault

**Definição:** o histórico de evolução **do próprio vault** (não da operação — para isso ver [[Histórico-de-Evolução]]).

## 2026-11-03 · Testes e Tarefas por frente

- [[Testes-e-Tarefas-Quatro-Frentes]]: central com SDD, aquisição, rentabilização e cross-sell;
  iniciativas, formulários por tipo, versões e integração de atenção com a Fila.
- Contexto Visa incluído na sincronização completa; cadastros de planejamento não afirmam envio ou resultado.
- Parser/exportador ajustados para wikilinks escapados em tabelas, conservando conteúdo canônico.

## 2026-11-03 (tarde) · Vai de Visa: DEs reais, automações e pool de ofertas

- Novas entidades com os nomes criados no SFMC: [[DE-VDV_CRUZAMENTO]], [[DE-VDV_APTOS]] (substitui `DE_VDV_BASE_ELEGIVEL`), [[DE-VDV_ENVIO]], [[DE-VDV_FUNIL]] e [[DE-BRIEFING_OFERTAS_VISA]] (substitui `DE_VDV_OFERTAS`). As notas antigas viraram redirecionamentos em `98-Legado/02-Entidades-Dados/`.
- Nova [[Automacao-VDV-Pool-de-Ofertas]] (PREPARAÇÃO e CONGELAR, anotações e ordem de execução).
- [[DE-MAPA_MCC]]: fluxo com `MAPA_MCC_ENTRADA` em texto e validação após a conversão. [[SFMC-Query-Studio-e-SQL]]: armadilhas do Automation Studio (sem `CROSS APPLY VALUES`, fuso do `GETDATE`).
- Atualizadas: [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] (1º teste, frentes), [[Teste-Afinidade-MCC-vs-Generico]] (sorteio em duas camadas, safras), [[Emails-Dinamicos-Vai-de-Visa]] (3 cards), [[MOC-SFMC-DEs-e-Automations]], decisões e inconsistências.

## 2026-11-03 · Pool de Ofertas - Vai de Visa, MCC e mapa do SFMC

- Nova iniciativa [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] (rentabilização, Black Friday / Best November) e nome próprio para a variante existente: [[Iniciativa-Pool-de-Ofertas-Parceiros]] (RENT-96f7a0892e), com visão de resultado por jornada.
- Novo conceito [[MCC]] e desenho de teste [[Teste-Afinidade-MCC-vs-Generico]] (células SEG/GEN, holdout de 10%, regra `V1_12M_REC6M`).
- Nova subpasta `02-Entidades-Dados/SFMC/` com [[MOC-SFMC-DEs-e-Automations]], [[DE-CLIENTES_ATIVOS]], [[DE-MAPA_MCC]], [[DE-VDV_APTOS]] e [[DE-BRIEFING_OFERTAS_VISA]]. Primeira vez que DEs do SFMC viram entidades do vault.
- Novas notas de operação: [[Emails-Dinamicos-Vai-de-Visa]] e [[SFMC-Query-Studio-e-SQL]]. Regras de importação de DE consolidadas em [[SFMC-Salesforce-Marketing-Cloud]].
- Atualizadas: [[Incentivo-ao-Uso]], [[Publico-Cartonistas]], [[Cartao-Afinz-Visa]], [[Decisões-Tomadas]], [[Decisões-Abertas]], [[Inconsistências-a-Corrigir]], [[Emails-Dinamicos-SFMC]], [[MOC-Operacao]].
- Números com snapshot de 03/11/2026 (Query Studio e perfil do arquivo MAPA_MCC). Nenhum dado pessoal registrado. Pendente: recompilar ontologia e sincronizar a biblioteca.

## 2026-10-31 · Método de trabalho com specs

- Nova [[Como-Trabalhar-SDD-no-GaaS]], com pesquisa em GitHub Spec Kit, Kiro, OpenSpec e DORA, distinguindo princípios consultados e proposta adaptada ao projeto.
- Inclui níveis tema/spec/tarefas, profundidade proporcional, template, exemplo de integração Fila–agentes–Wiki e piloto ainda não executado. Nenhuma ferramenta instalada ou tarefa promovida automaticamente.

## 2026-10-31 · SDD GaaS e linguagem simplificada

- Área de desenvolvimento renomeada para **SDD GaaS**, com foco em priorização e desenvolvimento guiado por especificações.
- Temas e rótulos de prioridade simplificados, mantendo identificadores, dependências e histórico internos.
- Atualizados [[Backlog-Desenvolvimento-GaaS-Loop-2026-10]] e [[Motor-de-Agentes-Loop-de-Memoria-2026-10]].

## 2026-10-31 · Agentes como motor do Loop e backlog de desenvolvimento

- Consolidada a evolução desta conversa em [[Motor-de-Agentes-Loop-de-Memoria-2026-10]], distinguindo pesquisa, infraestrutura, testes executados e exp-3 ainda proposta.
- Direção confirmada por Pablo: ativação por skill, execução generativa, aprendizado e reutilização; Fila e Wiki prioritárias. Registros, Assuntos, testes/cross-sell e Report Live exigem planejamento posterior.
- Criado [[Backlog-Desenvolvimento-GaaS-Loop-2026-10]], com 12 tarefas persistidas no GaaS, dependências, critérios e avisos na Fila. Não implica execução das reformas futuras.
- Preservados os registros anteriores; as notas de Loop e Experimento receberam adendos e referências. Publicação desta consolidação autorizada por Pablo.

## 2026-10-31 · Experimento de agentes da Wiki

- Nova [[Experimento-Agentes-Wiki-2026-10-31]]: estado do primeiro teste do framework ADM, Editor e especialistas por região. Leitura integral das 482 notas concluída e conferida; delegação do ADM registrada; rodada dos especialistas em andamento.
- Nenhuma proposta dos agentes foi aplicada ao vault. Publicação desta nota autorizada por Pablo.
- Acesso pelo [[MOC-Inteligencia-IA]].

## 2026-10-31 — Evolução cronológica do GaaS

- Publicada [[Evolucao-Cronologica-GaaS-2026-10]], com linha do tempo, mudanças de capacidade e divergências entre notas antigas e histórico GitHub.
- Corte documental: 912 commits alcançáveis, 62 PRs e 479 notas anteriores à publicação; varredura automatizada integral e leitura aprofundada das fontes históricas, sem alegar revisão semântica linha a linha de todo o acervo.
- Acesso pelo [[MOC-Engenharia]]. Publicação autorizada por Pablo; análise distingue proposta, integração de código, implantação registrada e resultado observado.

## 2026-10-07 · SFMC: pacotes de jornada, integração e Comunicações

- Nova [[SFMC-Package-Manager-e-Pacotes]]: o que o Package Manager faz, limites (1º deploy só cria ou pula, cópias vazias de DE, `{{mcpm:}}`), e por que o ZIP é fonte de leitura e não gerador na mesma BU.
- Nova [[SFMC-Integracao-API-Roadmap]]: capacidades de API por área (DEs, automações, jornadas, tracking, conteúdo), personalização em cascata, IA antes do envio, requisitos e ordem.
- Nova [[Auditoria-Jornadas-SFMC-2026-10]]: padrões de jornada, resultados por parceiro, achados em três baldes (erro, hipótese, lógica a perguntar) e copy x Pode Dizer.
- Nova [[Comunicacoes-Pacote-SFMC-Catalogo]]: as duas chaves do pacote (`af_sub3` = `template_id`; nome Meta = `title`) e o fluxo-alvo da aba Comunicações.
- [[Cartao-Bem-Mais-Afinz-Visa]]: OneLink encontrado e primeiras peças reais de CRM registradas.
- Skill nova `sfmc-jornadas-pacote` no repositório; plano de implementação em `docs/plans/2026-10-07-PROMPT-CODEX-comunicacoes-pacote-sfmc.md`.

## 2026-10-02 — Enciclopédia interna, primeiro corte editorial

- Inventário integral de notas e wikilinks; enriquecimento do piloto Produtos → Briefing → E-mails Dinâmicos → SFMC.
- Nova [[Enciclopedia-Servicos-Growth]], [[Servico-Emails-Dinamicos]] e [[Briefing-e-Regua-de-Aquisicao]].
- [[Padrao-Editorial-Enciclopedia]] e [[Fontes-e-Proveniencia-Growth]]: lacunas explícitas, vigência separada de atualização e estado de implementação.
- Fichas enriquecidas com aplicação, objeções, operação e pendências. Contexto +amigo e sete guardrails observados no Supabase com data de corte.
- Correções documentais de CPF, BOM e contagem 36/38; preservação de histórico.
- Convenções publicáveis, entradas de ADR e acervo Vibe para resolver destinos de links.
- Detalhes e limites em [[Auditoria-Contexto-Vault-2026-10-02]]. Publicação no GaaS exige run concluído e comparação de hashes; consultar validação em `outputs/vault-context-2026-10-02/`.

## 2026-09-29 — Vault integrado ao loop de Aprendizado e Memória

- A biblioteca deixou de ser uma aba primária de **Análise** e passou a ser uma seção de **Análise → Aprendizado e Memória**, ao lado de Fila, Report Live, Apostas, Outcomes e Memória.
- A navegação agora explicita os papéis: **Vault** é a fonte canônica de contexto; **Memória** reúne aprendizados validados e reutilizáveis pelo loop.
- O índice passou a carregar somente metadados, com paginação de 60 notas, filtros por pasta e contagens; o conteúdo Markdown e os backlinks são buscados apenas ao abrir uma nota.
- Foram adicionados estados de carregamento, erro e vazio, busca com limpeza, links profundos e retomada confiável da seleção.

## 2026-09-28 — Vault visual e vivo dentro do GaaS

- Criada [[GaaS-Vault-Library]]: o Obsidian/OneDrive permanece como fonte canônica e o Supabase passa a guardar uma projeção autenticada, pesquisável e auditável.
- A primeira versão da biblioteca ofereceu árvore de pastas, busca full-text em português, reader Markdown, navegação por wikilinks, abertura no Obsidian, indicador de atualização e sincronização administrativa da pasta.
- Contrato explícito de RLS, revisions append-only, tombstone após run completo e ausência de embeddings no MVP.

## 2026-09-04 (2) — Ficha de Produto editável por completo + guia de redação

- "Recap do produto" → **Ficha de Produto**. Contexto de marca vira bloco full-width de 5 linhas ("vários parágrafos, não uma frase"); público elegível ganha dica de incluir o tamanho do público endereçável (ex.: 800K+ CPFs, ≠ base do Clube). Dicas de preenchimento por campo.
- **Todas as regras do produto** agora aparecem na Ficha (não só a contagem), agrupadas por tipo, **cada uma editável inline** com `descartar|salvar` via `saveProductGuardrail` (novo em managementService — grava só as colunas pré-migration). Benefícios idem.
- Nota nova [[Ficha-de-Produto-Guia]] (`04-Operacao/`): o que a IA deve seguir para escrever uma Ficha de Produto que "atende bem" — princípios, campo a campo, barra de qualidade, exemplos. Commit `1fa58b4`, deploy ok.

## 2026-09-04 — Recap do produto no Plano de Comunicação + taxonomia de régua/benefício

- [[Fabrica-de-Emails-GaaS]]: "Referências de produto" saiu da aba Regras e virou **card full-width no topo** (identidade completa + benefícios por categoria com vigência derivada + contagem de regras + edição inline da ficha + nota de que IA pode preencher). Commit `23b9c0a`, deploy ok. Migration `20260904120000` (benefit structure: `category`/`value_exact`/`citation_status`/`source_type`/`source`) **enfileirada — não há CI de migration, aplica manual**.
- **Pesquisa registrada:** "segmento" hoje = 4 vocabulários sobrepostos (frente · etapa de funil · segmento · lifecycle_family). Frente Aquisição usa funil e tem os 10 segmentos, mas só `Base_Proprietaria` (Topo) tem e-mail.
- **Modelo proposto** (4 dimensões ortogonais): `frente` (3, +institucional) · `objetivo_da_regua` (8: venda_cartao, ativacao, engajamento, reativacao, cross_sell, cobranca, transacional, institucional) · `estagio` · `produto_alvo`. + `tipo_comunicacao` (campanha/operacional/transacional) governando quais guardrails aplicam.
- **Decisões do Pablo:** Captação/Investimento = `cross_sell` interno (alvo = cliente de cartão); Transações = fora da Fábrica por ora; Cross Sell não fragmenta por produto (um objetivo + `produto_alvo`).

## 2026-09-03 — Plano de Comunicação compacto e mais útil

Atualizada [[Fabrica-de-Emails-GaaS]] (seção Plano de Comunicação e lacuna P1 nº 9):

- Os três blocos de topo empilhados (título+subtítulo, seis filtros em caixas, dois conjuntos de chips de contagem, abas de Produto, cabeçalho de Régua) viraram **uma toolbar de ~2 linhas** — o cromo antes do primeiro e-mail caiu de ~400 px para ~67 px. Contagem em linha única; filtro "Parceiro" removido (as pills de Produto fazem a seleção); "Regra aplicável" movido para a aba Regras.
- **Lista de e-mails**: uma linha por e-mail agrupada por semana, com papel na régua, barra `N/11`, bolinha de status e **bolinha de aderência ao briefing** (assunto do briefing × mensagem-chave do plano).
- **Painel do plano**: modo **ficha** (11 diretrizes como rótulo:valor, edição inline por linha) + "Editar tudo" abrindo o formulário completo em accordion de 3 etapas. "Salvar versão" só habilita com mudança real.
- **Planejado × executado** passou a puxar o briefing vinculado pelo `campaignGroupId` e comparar mensagem-chave × assunto, objetivo × pré-cabeçalho, benefício × copy, CTAs × `TITULO_CTA`/`LINK_CTA` — fecha parcialmente a lacuna P1 nº 9.
- Toggle **Compacto / Confortável** lembrado no navegador.

## 2026-09-03 — Fábrica de E-mails: leva de melhorias de layout, prévia e revisão

Atualizada [[Fabrica-de-Emails-GaaS]] com as mudanças de interface entregues no módulo `dynamic-email` do GaaS:

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

- Criada [[Fabrica-de-Emails-GaaS]] com definição do produto, usuários, decisões, navegação, inventário funcional, arquitetura Supabase, contratos SFMC e fronteiras operacionais.
- Documentados o Revisor semanal e da régua completa, prévia projetada versus **Observações MKT**, biblioteca de ativos, assinaturas Plurix, templates compartilhados, Plano de Comunicação, revisão externa sem IA embutida e modal de criação de réguas para Aquisição/Rentabilização.
- Registradas 14 lacunas em três prioridades. P0: criação não atômica, `dynamic_email_ruler_segments` ainda sem gravação no fluxo e rollback parcial. P1: governança/materialização de segmentos, herança real, arquétipos, taxonomia limitada, famílias livres e comparador parcial. P2: performance, experimentos, QA de clientes, dependência das URLs e publicação SFMC.
- [[Emails-Dinamicos-SFMC]] corrigida: os slots de Template-fonte agora são compartilhados no Supabase e a dívida dos oito templates B2C foi resolvida com um template dinâmico canônico; Test Send permanece pendente para certificação dos oito e-mails.

## 2026-08-20 — Dicionário de Produtos + Vibe consolidado como camada institucional

- **Pasta nova [[Dicionario-de-Produtos]]** (`02-Entidades-Dados/`): registro canônico dos quatro cartões — [[Cartao-Afinz-Visa]], [[Cartao-Amigo-Afinz-Visa]], [[Cartao-Bem-Mais-Afinz-Visa]], [[Cartao-Dia-Afinz-Visa]] — com nome na copy, proposta de valor, público, tom de voz e encanação técnica. Construído por raspagem de fontes públicas em 19–20/08, com URL para cada afirmação e classificação OFICIAL / TERCEIRA / INTERNO.
- **[[Beneficios-e-Vigencia]] — o guardrail que faltava.** Todo benefício citável vira linha com `vigente_de` / `vigente_ate` / fonte / dono, e a coluna `STATUS` é **fórmula contra `=TODAY()`**. Benefício com data de fim no passado se marca `EXPIRADO` sozinho. Regra que a nota cria: *nenhum benefício entra na copy sem linha vigente*.
- **Achado que motivou tudo:** o **programa de pontos do +amigo encerrou em 01/07/2026** e o resgate **expirou em 31/07/2026** — e as páginas de bandeira do Compre Mais e do Superpão **ainda o anunciavam** em 20/08. Quem copiasse delas escreveria peça sobre programa morto. O que faltava na nossa base não era o dado, era o **campo de validade**.
- **[[Pode-Dizer-Nao-Pode-Dizer]]**: 19 proibições com fonte e severidade (BLOQUEADOR / ALTA / MÉDIA), mais o registro do que é seguro afirmar por produto.
- **[[Vibe]] reescrita**: deixa de ser "oferta dominante" e passa a **camada institucional** (lock-up `afinz + ViBE`). Mapa confirmado — **B2C ✅ · Dia ✅ · Bem Mais ✅ · +amigo ❌**, com o **mesmo pacote nos três** (R$100 na ativação + R$30 por fatura paga). A versão anterior falava em "eventual App Vibe"; o app existe e a integração tem roadmap de duas fases.
- **A distinção que mais afeta copy:** ganhar crédito ≠ ter a jornada no app. O **Bem Mais ganha os créditos mas seu app é whitelabel** — sem opt-in, saldo ou extrato. Toda a [[Regua-Vibe-Ativacao]] pressupõe o app Afinz e **não funciona para ele**. Registrado como buraco aberto.
- **[[Regua-Vibe-Ativacao]] nova**: régua oficial D+7 / D+15 / D+30 / pós-D+30, de **rentabilização**, não de aquisição — não existia em nenhuma taxonomia nossa. Inclui o segundo buraco: o público **elegível, com cartão e sem opt-in**, que não ganha nada e não está mapeado.
- **Correção de público:** pertencer ao clube **não é requisito para pedir o cartão** — é condição para **resgatar o desconto**. Vale para DIA e +amigo. O passo "entre no clube" pertence à régua de **ativação**, e hoje não existe em régua nenhuma.
- **[[Formatacao-WhatsApp-Variaveis-e-Espacamento]] nova**: variável de WhatsApp é `{{n}}` posicional da Meta, **nunca** `%%TAG%%` — e o espaçamento faz parte da copy. Corrige um erro real cometido em 19/08 numa régua de 14 briefings.
- **[[Motor-de-Briefing-Automatico]] nova**: as 6 camadas para a IA montar briefing sozinha, com guardrails determinísticos e contra-visão adversarial. A camada 2 (benefícios vigentes) foi resolvida nesta mesma leva.
- **[[Conflitos-de-Fonte-Produtos-2026-08]] nova**: 14 casos em que duas fontes **oficiais** divergem — sorteio Vibe R$100 mil vs R$10 mil (com regulamento expirado em 11/05/2026), Você Bem farmácia 70% vs 35%, educação 40% vs 80%, "ativação" vs "primeira compra", cartão virtual de 1h vs virtual pleno, e a Tabela de Tarifas **sem data de vigência**.
- **Risco de parceiro documentado:** o **cartão DIA pode estar dormente** — sem comunicação pública desde nov/2024, sem página de produto ativa, e o DIA fechou **343 das 587 lojas**, operando só em SP.
- **Correções à base:** "Tudão" **não é** bandeira Plurix (nenhuma fonte confirma); [[Bandeiras-Plurix]] lista 6 redes mas a lista oficial tem **8** — faltam **Mega** e **Dom Olívio**, e Dom Olívio é justamente a que quebra o padrão de 5% (vinhos 20%, carnes 10%) e tem restrição de praça.

## 2026-08-19 — Correção de fato: `CPF` é único · régua avança in-place

- **Correção em [[Emails-Dinamicos-SFMC]] e [[Emails-Dinamicos-Plurix]]:** a nota original de 2026-08-10 afirmava que `CPF` **não** era único na `TB_CAMPANHA_AQUISICAO` e que a mesma pessoa aparecia várias vezes. **Estava errado.** A duplicidade observada veio de testes fechados iniciais com CPFs fabricados, não do modelo de produção. Em produção, `CPF` é **chave primária: 1 linha por pessoa**.
- **Consequência de desenho:** cai o modelo de "1 arquivo de carga por sequência". Passa a ser **um arquivo só**, e a régua avança **dentro da própria DE de audiência** — `SEQUENCIA` é campo de estado, atualizado in-place pelo `Update Contact` da jornada.
- **Isso exige leitura ao vivo no e-mail.** O Journey Builder congela os dados de entrada num snapshot, então `[SEQUENCIA]` devolveria para sempre o valor da entrada. O template passa a ler a DE no momento do envio com `LookupRows(@DE_AUDIENCIA, "CPF", @SubscriberKey)`, com fallback para `AttributeValue()`. Isso é o que permite **um único e-mail dinâmico servir a régua inteira**.
- **Achado sobre `RaiseError`:** o segundo parâmetro `true` pula o assinante e segue; `false` tentaria parar o job, mas a Salesforce documenta que por causa dos retries internos frequentemente **não** para. `true` não é só o mais seguro — é o único com comportamento previsível. Falhar alto custa 1 e-mail, não a campanha.
- **Lição de processo:** a afirmação errada estava no vault desde 10/08 e foi replicada em 5 arquivos derivados sem ser questionada. Fato observado em ambiente de teste foi registrado como regra de produção.

## 2026-08-18 — Framework de e-mail dinâmico Plurix (6 bandeiras, 1 template)

- **Nota nova [[Emails-Dinamicos-Plurix]]**: implementação completa e **autocontida** do motor para a BU Plurix. Escrita para ser reproduzível por um agente sem contexto prévio — inclui o AMPscript verbatim, o rastreamento das 36 colunas (coluna → variável → onde renderiza), a spec do HTML, o procedimento de import, o QA automatizável e o log de decisões com razão.
- **Nota nova [[Bandeiras-Plurix]]**: Plurix não é um parceiro, é holding com 6 redes (Amigão, Boa, Avenida, Compre Mais, Paraná, Superpão). Todos os assets por bandeira — rodapé, deeplink OneLink, site, variações de imagem — e a convenção de nomenclatura de `NM_PRODUTO_INTERNO`.
- **Achado estrutural:** o que varia entre bandeiras é só rodapé + deeplink, porque todas vendem o mesmo cartão `+amigo`. Isso coube em colunas que já existiam (`BANNER_3_CORPO` estava vazia em 100% das linhas do institucional) — **1 e-mail serve as 6, zero coluna nova**.
- **Modelo de escala adicionado a [[Emails-Dinamicos-SFMC]]**: o número de templates é função de quantas *identidades visuais* existem, não de quantas BUs. B2C = 1 (resolvido), Plurix = 1 marca com 6 assinaturas (resolvido), B2B2C = N marcas de cartão (em aberto). O que trava B2B2C são 4 valores chumbados no HTML (logo + 3 cores).
- **Lacuna documentada:** `UTM_CAMPANHA` é preenchida e **nunca lida** pelo template — verificado por parsing, zero `utm_` no HTML nos 5 `RedirectTo`. Vale para o institucional também: a atribuição de campanha no destino está cega.
- **`TB_BRIEFING_JORNADAS` confirmada como camada separada** por varredura do repositório: aparece só em prosa, zero referências em código.
- **Base real analisada** (`CRM_PLURIX_202603_GC1`, topo de funil): 95.266 pessoas → **73.078 endereçáveis**. 9.058 têm e-mail preenchido mas sem flag de canal — filtrar pelo campo em vez das flags dispararia indevidamente para elas.
- **Separação entrega × auditoria** ([[Emails-Dinamicos-Plurix]] §15): `CAMPANHA` (activity_name) e `UTM_CAMPANHA` passam a ser tratados como **camada de auditoria não-bloqueante**. Nenhum dos dois entra na chave, renderiza ou afeta entrega — travar disparo válido por etiqueta de tracking ausente custa mais do que disparar sem ela. Ajuste concreto pendente: rebaixar de `erro` para `aviso` a regra de placeholder de `UTM_CAMPANHA` no módulo `dynamic-email` do GaaS, **depois** de fechar a lacuna de consumo da UTM.

## 2026-08-10 — Emails Dinâmicos SFMC documentado (validado ponta a ponta)
- **Nota nova [[Emails-Dinamicos-SFMC]]**: motor único de e-mail no Content Builder que resolve conteúdo via AMPscript/`LookupOrderedRows` contra `TB_BRIEFING_CAMPANHA_AQUISICAO`, casado por chave composta `NM_PRODUTO_INTERNO + TP_CAMPANHA + SEQUENCIA` com `TB_CAMPANHA_AQUISICAO` (audiência).
- **Validado em produção de teste**: caso Plurix (`+amigo`/Amigão Supermercados) reaproveitando o mesmo template do Afinz Visa institucional, via Test Send.
- **5 pitfalls documentados**, descobertos em ~6 rodadas de import com erro: formato de data do wizard é MM/DD (não DD/MM) e não autodetecta; checkbox de qualificador de aspas duplas desmarcada por padrão a cada import; quebra de linha crua dentro de campo quoted invalida a linha inteira; placeholders da analista (`PEGAR NA BASE`, `CRIAR`) quebram o lookup silenciosamente; filtro de entrada da Jornada é independente da chave do briefing.
- [[SFMC-Salesforce-Marketing-Cloud]] e [[MOC-Operacao]] linkados à nota nova.

## 2026-07-22 — Central de Funis + handoff Codex/Claude
- Criada [[Funis-de-Onboarding-GaaS]] com as três visões em produção: Apps, Serasa e Mídia Paga, incluindo padrão visual, taxas, granularidades e limites de compatibilidade.
- Criada [[Funil-Onboarding-Arquitetura-e-Ingestao]] com o contrato Meta certificado, arquitetura Supabase, collector, views, maturação, aliases e estados de observação.
- Registrada a colaboração assíncrona no arquivo `09-Inteligencia-IA/Handoff-Codex-Claude-Funil-Meta.txt`, incluindo descoberta de `results`, certificação do StartTrial atribuído e bloqueio de SubmitApplication.
- [[Decisões-Tomadas]] recebeu quatro ADRs para impedir soma incompatível, proxies de evento e confusão entre ausência e zero.

## 2026-06-11 — Export Copa v2 implementado + 2 tabelas novas populadas
- **Código em produção** (commit `6843143` na main, auto-deploy GH Pages): `rentabilizacaoCrmExcelExport.ts` v2 — bloco fixo da aba "Rentabilização Copa" expandido de 7 para **25 colunas**, agora preenchidas automaticamente. Grupos: LP Visa GA4 (tráfego, opt-ins etapa), BI Visa oficial (opt-ins, cartões/dia), Mídia Total / Google / Meta (spend, cliques, CPC, impressões, CTR, CPM) + Custo/Opt-in (spend ÷ opt-ins Visa, nunca CAC). Linha 1 = totais do período por fórmula. Arquitetura em [[Export-XLSX-Renta-Copa]].
- **Tabelas novas criadas e populadas no Supabase** (migration `create_copa_lp_and_visa_daily`): [[copa_lp_daily]] (559 linhas, 58 dias 15/04–11/06, via export CSV do Looker lido pelo agente Chrome) e [[copa_visa_daily]] (15 dias 27/05–10/06, do print do BI Visa).
- **Reconciliação das fontes resolvida**: "Optins LP" do acompanhamento manual = usuários em `/cadastro/optins` (GA4); fonte oficial de opt-in = **Clientes do BI Visa** (gap de captura GA4 ~39% documentado). VDV = base existente ([[Glossário-de-Siglas]]).
- Fetchers resilientes: fonte indisponível gera `console.warn` e coluna vazia, sem derrubar o export.
- **Validado pelo operador em 2026-06-11**: export testado em produção e funcionando. Pendência residual: `optins_sucesso` zerado no diário (limite de séries do gráfico Looker).

## 2026-06-11 - Conversão Opt-in Copa Visa e extração diária do Looker
- [[Copa-2026]] registra o Opt-in concluído na LP como conversão oficial e exclusiva da campanha Meu Afinz Visa Bate Um Bolão, em parceria com a Visa.
- [[Dossie-Mestre-Operacao-CRM-Midia]] ganha o contrato da tabela diária por grupo de mídia, com LP, etapa de Opt-in, sucesso, taxas, linha total de controle e regras de qualidade.
- Registrada a distinção entre chegada à página `/cadastro/optins`, proxy `/cadastro/sucesso` e Opt-in transacional confirmado.
- Expansão prevista da aba `COPA` do XLSX com CTR, CPC, CPM, frequência e custo por Opt-in por canal, sem tratar custo por Opt-in como CAC.

## 2026-06-10 — SDD Complemento — UX Reference & Implementation Guide
- **Complemento criado** `calendar-estrategico/docs/SDD_EXPERIMENTOS_KANBAN_COMPLEMENTO.md`: biblioteca de componentes prontos para implementação (ExperimentCard com borda esquerda por canal, StatusBadge com pulsing dot, SampleProgressBar com bloqueio de decisão, LiftPlot CI horizontal sem Recharts, ConversionSparkline com `isAnimationActive=false`), features adicionais (SRM detection, batting average por canal, Learning KB com view_count e aprendizado obrigatório), ExperimentsView estrutura completa com 3 sub-tabs (Kanban/Aprendizados/Programa).
- **Discovery**: `DiarioBordo.tsx` já tem slot para `<ExperimentsView />` — sem nova rota necessária.
- **Correção de cor**: SMS e WhatsApp tinham mesma cor (#10B981) — padronizado para SMS=amber, WhatsApp=emerald.

## 2026-06-10 — SDD do gestor de experimentos aprovada
- **Spec criada** `calendar-estrategico/docs/SDD_EXPERIMENTOS_KANBAN.md`: migration SQL (tabelas `experiments` + `experiment_activities` + view `vw_experiment_metrics`), Z-test bicaudal (α=0,05, poder=80%), card design (delta conv + progresso amostra + ICE badge + owner), kanban 3 colunas + repositório Booking-style, auto-attach por `Oferta+Promocional` (par composto obrigatório), 5 fases de implementação, integrações com Orientador e ProgramarDisparoModal.
- **Regra crítica registrada**: chave de intenção de oferta = par composto `(Oferta, Promocional)` — nunca campo isolado. [[Sistema-de-Experimentacao-Referencias]] e memory atualizados.
- Decisões de UX confirmadas pelo operador: captura na tela, cadência semanal, confirmação manual da decisão (não automática).

## 2026-06-10 — Pesquisa do sistema de experimentação + validação retroativa
- Nota nova [[Sistema-de-Experimentacao-Referencias]]: benchmarks (Booking 25k testes/ano e repositório de fracassos; iFood "Faster"; ICE/GrowthHackers; padrão warehouse-native Eppo/GrowthBook), 6 princípios do nosso sistema e validação retroativa do modelo `experiments + experiment_activities` contra 2 casos reais.
- **Achado**: provável causa da virada de mar/26 no [[Carrinho-Abandonado]] — estratificação por recência (subgrupos D-7/D-21 isolados do Diario) + escala no núcleo; WhatsApp Diario 8,42%→24,05%. Era um experimento natural sem registro.
- Indexada no [[MOC-Estrategia]] (junto com [[Ativacao-de-Audiencias-Diaria]]).

## 2026-06-10 — Rede de campanhas-tipo + hub de plataformas (a-validar)
- **Hub novo [[Plataformas-de-Comunicação]]**: SFMC (E-mail/SMS/WhatsApp/Push; InApp inexistente), Meta (3 contas), Google, matriz segmento×canal real e diagnóstico das audiências Meta lidas via MCP (CSVs manuais congelados, sem convenção de nome).
- **4 campanhas-tipo viram conceitos de 1ª classe**: [[Topo-de-Funil]], [[Repescagem]], [[Upgrade]], [[Carrinho-Abandonado]] — cada uma com a chave em todas as camadas (CRM, diarizado, Meta atual, audiência proposta, af_adset) + performance ponderada.
- **Convenção de naming proposta** para audiências dinâmicas: `crm_<bu>_<bloco>_daily` (casa com af_adset e com as 6 bases do pipeline S3). Status a-validar pelo Pablo.

## 2026-06-10 — Ativação de audiências diária (decisão Rota B)
- Nota nova [[Ativacao-de-Audiencias-Diaria]]: pesquisa das 3 rotas (Salesforce nativo em sunset, S3+APIs diretas ✅, ferramentas pagas), desenho do pipeline SFMC→S3→Meta/Google e requisitos das plataformas (Data Manager API do Google substitui Customer Match na Ads API).
- [[Decisões-Tomadas]] +1 ADR (Rota B escolhida).

## 2026-06-10 — Granularização ponderada (Safra × BU × Segmento + mídia até ad)
- **Safra normalizada no Supabase** (`06/26`→`2026-06`, `05/26`→`2026-05`; 128 linhas) — [[Inconsistências-a-Corrigir]] marca como corrigida.
- **4 views ponderadas criadas** (migration `create_weighted_performance_views`): nota nova [[Views-Performance]]; indexadas em [[Supabase-Schema]] e no [[Runbook-Vault-Vivo]].
- **[[Evolução-Temporal]]** ganhou leitura de cohort por safra (achado: virada de eficiência fev→mar/26 em Abandonados, CAC ÷3 e conversão ×3,6 — investigar causa).
- **[[Decisões-Tomadas]]** +1 ADR: views ponderadas como fonte única de agregação (fim do `avg` de taxas).

## 2026-06-10 — Camada de atribuição AppsFlyer + reidratação
- **Nota nova [[AppsFlyer-Tracking-CRM]]**: governança `pid=crm`, mapeamento de parâmetros, conversão em 2 níveis (`account_created`/`account_approved`), OneLink por canal (`cartao-afinz.onelink.me/9ODN`), condições do deep link e planilha geradora de links.
- **[[Decisões-Tomadas]]** +4 ADRs de atribuição; **[[Decisões-Abertas]]** +4 (UDL no app, OneLinks restantes, postback de eventos, tabela-mestre de links); **[[Roadmap-Framework]]** ganhou a frente transversal de atribuição.
- **Snapshots reidratados** (base re-ingerida: activities 4.606→4.459, jornadas 330): [[Canais]], [[Segmentos]], [[BUs]], [[CAC-por-Canal]], [[Performance-por-Segmento]], [[CPA-por-Plataforma]], [[Jornada]], [[Supabase-Schema]].
- **Contexto de campanhas**: [[campaign_context]] detalhada (7 campanhas, 4 frentes); [[Copa-2026]] enriquecida (Bate Um Bolão, ondas, 328 disparos); [[Inconsistências-a-Corrigir]] +8 incongruências de taxonomia SFMC vindas da skill `copa-crm-parser`.

## 2026-06-08 — Expansão completa (CRM + Mídia Paga + IA)
- **Mídia paga** ganhou camada completa: conceitos ([[Mídia-Paga]], [[Métricas-de-Mídia]], [[Spend-to-Card]]), dimensões ([[Plataformas-Mídia]], [[Objetivos-de-Campanha]], [[Criativos]]), 7 entidades novas, performance ([[CPA-por-Plataforma]], [[Spend-e-Tendência]], [[Eficiência-de-Criativo]]) e [[MOC-Midia-Paga]].
- **Nova camada `09-Inteligencia-IA`**: [[Vault-como-Contexto]], [[MCP-Visão-Geral]], [[Skills-do-Projeto]], [[Agentes-e-Workflows]], [[Obsidian-MCP]], [[Runbook-Vault-Vivo]].
- **Links órfãos corrigidos**: [[Pilar-Automação-por-Histórico]], [[Metas-e-CAC]], [[Supabase-Schema]], [[Jornada-Disparos]], [[Resultados]], [[Originação-B2C]].
- **Domínios CRM novos**: [[SFMC-Salesforce-Marketing-Cloud]], [[Diário-de-Bordo]], [[Anti-Overlap-Pressão-de-Contato]], [[Vibe]], [[Copa-2026]], notas-aba ([[Launch-Planner]], [[Relatório]], [[Explorador-Avançado]], [[Configurações]]).
- **Governança**: [[Decisões-Tomadas]], [[Mapa-de-Oportunidades]], [[Convenções-do-Vault]].
- Snapshots reidratados contra Supabase real (activities 4.606, runs 9, insights 249).

## 2026-06-08 — Base inicial
- 58 notas em 9 camadas (00–08), camada de engenharia gerada via Claude Code.

## Relacionado
- [[🏠 HOME]] · [[Histórico-de-Evolução]] · [[Convenções-do-Vault]]
