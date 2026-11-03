---
title: Evolução cronológica do GaaS
tags: [gaas, historia, evolucao, arquitetura, wiki]
tipo: retrospectiva
camada: evolucao
tipo_diataxis: explanation
criado: 2026-10-31
atualizado: 2026-10-31
status: analise-documental-com-limites
fonte: github-vault-wiki-corte-2026-10-31
aliases: [Linha do tempo do GaaS]
---

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
- [[98-Legado/08-Engenharia/Histórico-de-Evolução]] e `Pipeline-ML.md`.
- [[00-Indice/Changelog-do-Vault]].
- [[05-Estrategia/Roadmap-Framework]], `Ontologia-v2.md` e `Função-Objetivo.md`.
- [[07-Evolucao/Decisões-Tomadas]], `Performance-do-Conteudo-GaaS.md`, `Performance-Atividades-e-Fluxo-de-Jornadas.md` e `Resultados-Evolucao-e-Retrospectivas.md`.
- [[08-Engenharia/ADR-001]], `GaaS-Vault-Library.md` e `Report-Live-Versionamento-e-Publicacao.md`.
- [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth]], `Inteligencia-Compartilhada-GaaS.md` e `Operacao-Fila-Notificacoes-Notas-de-Resultado.md`.

Arquivos auxiliares nesta pasta: `inventario-notas.json` (479 caminhos com hashes, metadados, títulos e datas); `github-prs.json` (resposta de PRs); `github-commits-recentes.json`; `git-main-completo.txt` (histórico alcançável com datas de autor e committer); `inventariar.py` (rotina reproduzível de inventário).


## Relacionado

[[MOC-Engenharia]] · [[Changelog-do-Vault]] · [[Loop-de-Aprendizado-Growth]] · [[Inteligencia-Compartilhada-GaaS]]
