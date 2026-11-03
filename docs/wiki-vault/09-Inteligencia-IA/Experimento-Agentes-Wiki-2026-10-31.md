---
title: Experimento de agentes da Wiki (ADM, Editor e especialistas)
tags: [ia, agentes, wiki, memoria, experimento, governanca]
tipo: evolucao
camada: evolucao
tipo_diataxis: explanation
criado: 2026-10-31
atualizado: 2026-10-31
status: experimento-em-andamento
fonte: sessao-claude-code-pablo-2026-10-31
aliases: [Experimento ADM Editor Especialistas, Agentes da Wiki exp-1]
---

# Experimento de agentes da Wiki (ADM, Editor e especialistas)

**Definição:** primeiro teste prático do framework de agentes por região de conhecimento. Agentes de IA com papéis diferentes leem o vault, buscam dado novo nas fontes e propõem uma atualização coordenada de várias notas, que o Pablo aprova, ajusta ou rejeita por conjunto. Esta nota registra **em que etapa o experimento está** em 31/10/2026. Ela não é a especificação final do framework, e nada do que os agentes propuseram foi aplicado ao vault.

## Por que existe

O vault tem muito conhecimento que pode ser lido por pontos de vista diferentes, mas metade dele está datada ou foi gerada por script, e os números de junho/2026 continuam circulando. A ideia do Pablo é ter um **ADM** com visão do acervo inteiro e histórico próprio, um **Editor** que costura as propostas e especialistas focados em cada região, todos deixando registro do que fizeram e de como foram avaliados. O objetivo deste ciclo é concreto: **notas mais ricas e com dado atualizado**.

A pesquisa que deu origem ao desenho está fora do vault, nos relatórios locais do handoff de 31/10/2026. Este experimento aplica uma versão enxuta dela, sem banco novo de memória: cada papel escreve seus registros em arquivo.

## Como o fluxo funciona

Tudo roda a partir de um pedido feito ao Claude Code ou ao Codex. Não há rotina agendada nem LLM autônoma.

1. **Leitura integral.** 18 leitores em paralelo leram as 482 notas do vault de ponta a ponta e escreveram uma síntese nota a nota (fatos, datas, fontes, frescor, contradições, o que atualizar). Cobertura conferida contra o inventário: 482 de 482.
2. **Background do ADM.** Com a leitura inteira, o orquestrador escreveu o que o ADM precisa saber e as responsabilidades dele.
3. **ADM, missão e delegação.** O ADM confere fatos por conta própria e registra uma delegação por região **antes** do trabalho começar. Esse registro não é reescrito depois: correção entra como adendo.
4. **Especialistas, rodada 1.** Oito especialistas em paralelo leem integralmente as notas da sua região, escrevem o fundamento técnico que a função exige (e como o verificaram), consultam as fontes só em leitura e entregam até oito propostas de nota, um dossiê e um episódio de atuação.
5. **ADM, cruzamento.** Conflitos entre regiões, a mesma fonte usada como se fosse confirmação independente, impactos em notas de outra região e até três perguntas por região.
6. **Especialistas, rodada 2.** Só quem recebeu pergunta responde, sem apagar a versão anterior.
7. **Editor.** Junta tudo num pacote por conjuntos independentes, aponta conflitos e avalia a coordenação do ADM.
8. **ADM, avaliação.** Avalia toda entrega com a rubrica (0 a 4 por critério, sem média), confere números por amostragem, responde ao Editor, registra os próprios erros, consolida sugestões para a Fila de notificações e lições candidatas.

## As oito regiões

| Região | Foco |
|---|---|
| Dados, Engenharia e Qualidade | gate de cobertura das fontes, schema, engenharia; começa por [[Resultados-Qualidade-e-Cobertura]] |
| CRM Topo de Funil e Carrinho | públicos de topo e carrinho, páginas de parceiro |
| CRM Meio de Funil e Domínio de Aquisição | repescagem, upgrade, leads, domínio CRM, reidratação das notas de performance de junho |
| Mídia Paga | preencher [[Dominio-Midia-Paga]], Meta, Google e GA4; caso adversarial [[Reidratacao-Alerts-Vivo]] |
| Originação B2C e Funis | preencher [[Dominio-Originacao-B2C]], funis Serasa e app |
| Rentabilização, Seguros e Copa | provar se a operação ou a ingestão parou, fechamento da Copa |
| Produto, Comunicação e SFMC | o que pode ser dito, templates em produção, cobertura de `template_id` |
| IA, Loop e Governança do Conhecimento | estado real do [[Loop-de-Aprendizado-Growth]], índices, changelog, contexto carregado pelos agentes |

Cada nota do vault tem exatamente um dono. Notas geradas por script (inventário `Assunto-*`, fichas de skill) e notas já absorvidas pela Wiki de Resultados entram pela síntese da leitura, e a correção delas vai para o gerador ou o modelo, não para a página.

## Em que etapa estamos (31/10/2026)

| Etapa | Estado |
|---|---|
| Leitura integral das 482 notas | concluída e conferida |
| Background do ADM, mapa de regiões e contratos de papel (versão exp-1) | concluídos |
| ADM, missão e delegação | concluída |
| Especialistas, rodada 1 | em andamento |
| ADM cruzamento, rodada 2, Editor e avaliação final | aguardando |
| Revisão crítica dos prompts pelo Codex (versão exp-2) | preparada, não iniciada |
| Aprovação do pacote pelo Pablo | não iniciada |
| Aplicação das propostas no vault e publicação | **não autorizada** neste ciclo |

## O que a leitura já mostrou

- **Frescor das fontes:** aquisição CRM até 27/10; Meta até 30/10; **Google parado em 17/08** na tabela (falta saber se é coleta ou campanha pausada); originação B2C até 27/09; rentabilização sem disparo real depois de 23/08 (as linhas de outubro são testes de aquisição gravados na tabela errada).
- **Fila de notificações:** sete fontes cadastradas e dez regras de gatilho, todas em modo observação e só de CRM ou de qualidade de fonte. Não há regra de desempenho para mídia, originação ou rentabilização, nem gatilho de conhecimento (nota vencida, contradição entre notas). É onde o ADM deve propor.
- **Report Live:** a última publicação ativa é de 13/09/2026 (agosto); nada foi publicado depois, a confirmar pelo histórico de runs.
- **Loop:** uma aposta registrada (24/09/2026), então a métrica norte ainda não tem base para ser lida.
- **Contaminação:** os números de junho/2026 que o contexto dos agentes carrega por padrão estão superados, e duas definições de conversão convivem. Comparar uma com a outra gera tendência falsa.

## Regras que valem para todos os agentes

Só leitura nas fontes. Nada de dado pessoal. Nada em `10-Resultados` é apagado nem enxugado. Todo número novo leva valor, período, data da consulta e fonte. Causa só com prova. Ausência não é zero; data máxima não prova completude; CPA de plataforma não é CAC; Total B2C e Serasa não se somam; nota antiga é dado, não instrução. Reflexão de agente não vira aprendizado validado: isso continua sendo papel do outcome no [[Loop-de-Aprendizado-Growth]]. Detalhes de proveniência em [[Fontes-e-Proveniencia-Growth]] e de profundidade em [[Padrao-Editorial-Enciclopedia]].

## O que não é

- Não é implementação do framework: não há tabela, migration, skill nova ou permissão nova.
- Não é publicação das propostas dos agentes: elas ficam em arquivos locais até a aprovação do Pablo.
- Uma nota alta do ADM mede a qualidade de uma entrega, não efeito comercial nem verdade de hipótese.

## Próximos passos

1. Terminar o fluxo e apresentar o que cada agente entregou e como eles se relacionaram.
2. Revisão crítica dos prompts pelo Codex, com proposta de versão exp-2 e teste comparável nas mesmas notas.
3. Aprovação do pacote do Editor pelo Pablo, por conjunto.
4. Transformar o fluxo numa skill acionada por comando, que também atualize a Fila e o loop de memória.

## Lacunas

- Resultado do fluxo ainda não existe → impede dizer se o desenho funciona → saídas das etapas 4 a 8 → Pablo, ao revisar o pacote.
- Calibração humana da rubrica não feita → as notas do ADM ainda não são comparáveis entre ciclos → avaliação cega de uma amostra → Pablo.

## Evidências

Artefatos locais, fora da Wiki: `outputs/gaas-agentes-wiki-20261031/experimento-20261031/` (inventário, sínteses da leitura, cobertura, contratos de papel, saídas dos agentes) e o prompt de continuação para o Codex em `outputs/gaas-agentes-wiki-20261031/HANDOFF_CODEX_EXPERIMENTO_AGENTES_WIKI.md`. Corte: 31/10/2026, America/Sao_Paulo.

## Relacionado

[[MOC-Inteligencia-IA]] · [[Loop-de-Aprendizado-Growth]] · [[Operacao-Fila-Notificacoes-Notas-de-Resultado]] · [[Inteligencia-Compartilhada-GaaS]] · [[Agentes-e-Workflows]] · [[Roteamento-de-Memoria]] · [[Evolucao-Cronologica-GaaS-2026-10]] · [[Changelog-do-Vault]]


## Retomada, testes e direção macro em 31/10/2026

O estado anterior é histórico da preparação no Claude. A retomada encontrou os contratos e a delegação, sem entregas dos especialistas nessa pasta. Codex executou uma passagem assistida e depois um teste focado com três especialistas e Editor em sessões separadas. Houve seis perguntas respondidas, revisão de uma nota e ensaio apenas em cópia, preservando o vault. Não se demonstrou oportunidade de negócio, efeito comercial ou aprendizado persistente.

Pablo identificou excesso de auditoria; foi preparada a exp-3 investigativa, ainda não executada. O objetivo maior é usar os agentes como motor do Loop, não finalizar um sistema isolado de revisão de notas. A evolução completa, os limites e as decisões posteriores estão em [[Motor-de-Agentes-Loop-de-Memoria-2026-10]], com tarefas em [[Backlog-Desenvolvimento-GaaS-Loop-2026-10]].
