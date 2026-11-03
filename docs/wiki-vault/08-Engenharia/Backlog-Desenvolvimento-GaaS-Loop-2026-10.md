---
title: SDD GaaS, temas e prioridades
tipo: planejamento
camada: engenharia
criado: 2026-10-31
atualizado: 2026-10-31
status: backlog-priorizado
fonte: pedido-pablo-e-cadastro-gaas-2026-10-31
tags: [backlog, gaas, agentes, loop, desenvolvimento]
---

# SDD GaaS: temas e prioridades

Pablo autorizou cadastro de tarefas de desenvolvimento e notificações na Fila. Doze tarefas
foram persistidas em 31/10/2026, em backlog, com histórico inicial e dependências. A interface
é uma entrega própria, separada das reformas planejadas. Datas e responsáveis permanecem a definir.

Direção e histórico: [[Motor-de-Agentes-Loop-de-Memoria-2026-10]].

## Ordem sugerida

Começar por aqui define o ciclo e a integração Fila–Wiki; Na sequência aprofunda agentes, conhecimento, registros e
contratos de testes; Mais adiante trata reformas posteriores e reuso entre ativações. Prioridade não é prazo.
A tarefa pode ser planejada com dependências pendentes; execução e conclusão exigem dependências concluídas.

| Tema | Ordem sugerida | O que precisa vir antes |
|---|---|---|
| [Como o Loop de Memória deve funcionar](https://growthafinz.github.io/GaaS-Framework-Afinz/?view=learning&section=investigations&dev_task=eafbfdf0-f978-47e2-8336-108ed7a95fa9) | Começar por aqui | Pode começar |
| [Como os agentes trabalham com a Fila e a Wiki](https://growthafinz.github.io/GaaS-Framework-Afinz/?view=learning&section=investigations&dev_task=c0b774fa-ae30-4253-9e54-97804da96b0e) | Começar por aqui | Como o Loop de Memória deve funcionar |
| [Encontrar melhorias nas jornadas de CRM](https://growthafinz.github.io/GaaS-Framework-Afinz/?view=learning&section=investigations&dev_task=a1ec64b0-abef-4798-8cf9-1825bd3014bb) | Na sequência | Como o Loop de Memória deve funcionar, Como os agentes trabalham com a Fila e a Wiki |
| [Organizar e aprofundar os assuntos da Wiki](https://growthafinz.github.io/GaaS-Framework-Afinz/?view=learning&section=investigations&dev_task=255dcc91-30bb-4a12-969e-a8cd9e92ed4e) | Na sequência | Como o Loop de Memória deve funcionar |
| [Acompanhar a evolução de cada agente](https://growthafinz.github.io/GaaS-Framework-Afinz/?view=learning&section=investigations&dev_task=d4bfd8c1-6f0c-4435-acd8-ade085e48117) | Na sequência | Como o Loop de Memória deve funcionar, Como os agentes trabalham com a Fila e a Wiki |
| [Acompanhar testes A/B e cross-sell](https://growthafinz.github.io/GaaS-Framework-Afinz/?view=learning&section=investigations&dev_task=8f1ee7a1-197c-45a2-b6ee-6897d396c934) | Na sequência | Como o Loop de Memória deve funcionar |
| [Reunir Apostas em Testes e Tarefas](https://growthafinz.github.io/GaaS-Framework-Afinz/?view=learning&section=investigations&dev_task=d7d01450-6c33-4e24-adc5-eb3419cb6446) | Mais adiante | Acompanhar testes A/B e cross-sell |
| [Definir como avaliar resultados e aprendizados](https://growthafinz.github.io/GaaS-Framework-Afinz/?view=learning&section=investigations&dev_task=ea19e3dc-ff9d-4b38-b35a-a34ee44db4c8) | Mais adiante | Acompanhar testes A/B e cross-sell |
| [Gerar apresentações Afinz com Claude Code](https://growthafinz.github.io/GaaS-Framework-Afinz/?view=learning&section=investigations&dev_task=69417e78-c26b-44b6-829f-ce49ed8a6a3b) | Mais adiante | Como o Loop de Memória deve funcionar |
| [Usar dados do Google Sheets nas apresentações](https://growthafinz.github.io/GaaS-Framework-Afinz/?view=learning&section=investigations&dev_task=b6c88a62-3748-4c2d-8681-39b0adea8ef7) | Mais adiante | Gerar apresentações Afinz com Claude Code |
| [Manter Wiki e computador sincronizados](https://growthafinz.github.io/GaaS-Framework-Afinz/?view=learning&section=investigations&dev_task=0d22f2db-aa9f-493e-8660-a46d86d1575f) | Na sequência | Como os agentes trabalham com a Fila e a Wiki |
| [Verificar se os agentes aprendem entre ciclos](https://growthafinz.github.io/GaaS-Framework-Afinz/?view=learning&section=investigations&dev_task=12949d09-11ee-40b2-a02f-7d85c71a453d) | Mais adiante | Encontrar melhorias nas jornadas de CRM, Acompanhar a evolução de cada agente |

## Escopo e critérios

### Como o Loop de Memória deve funcionar

Planejar o motor macro: pedido explícito via skill Claude/Codex → releitura pertinente da base → interpretação de gatilhos e resultados → investigação e execução generativa → revisão → aprendizado → reutilização em nova ativação. Os agentes são uma camada de execução central ou de apoio principal, ainda em evolução. Não pressupor agendamento autônomo ou framework finalizado.

Critérios de conclusão:

- Contrato de entrada, saída e responsabilidade de cada fase revisado com Pablo
- Separar memória operacional dos agentes, hipóteses e conhecimento de negócio validado
- Definir como uma nova ativação recupera conhecimento aprovado e verifica sua aplicação

### Como os agentes trabalham com a Fila e a Wiki

Prioridade de produto: agentes trabalham sobre Fila e Wiki. Planejar seleção de trabalhos, contexto, novas leituras, interpretação de sinais, pesquisa, contribuição coordenada a várias notas e retorno ao mesmo item da Fila. Aprovação humana simples por conjunto e evidências versionadas. Não tratar conclusão de execução como aprovação ou enriquecimento comprovado.

Critérios de conclusão:

- Fluxo Fila → agentes → propostas Wiki → decisão → retorno à Fila desenhado
- Definir vínculo entre trabalho, execução, evidência, proposta e versão de nota
- Incluir descoberta, conexão, hipótese, oportunidade e lacuna acionável, com critérios próprios

### Encontrar melhorias nas jornadas de CRM

Executar a proposta exp-3: como melhorar jornadas e comunicações de aquisição CRM usando o conhecimento disponível. Cada especialista investiga uma pergunta e tenta uma contribuição fundamentada. Não forçar novidade. A primeira exp-2 validou coordenação e documentação; não demonstrou oportunidade de negócio ou reuso persistente.

Critérios de conclusão:

- Missões investigativas complementares e fontes pertinentes definidas
- Entregas mostram tentativas, evidências, alternativas, implicação e próximo teste
- Pablo avalia separadamente rigor e contribuição efetiva ao conhecimento

### Organizar e aprofundar os assuntos da Wiki

Planejar menos páginas canônicas e conteúdo mais completo, didático e conectado. Reordenar Assuntos para favorecer interpretação analítica dos relatórios. Incluir referências recentes de resultados em série de vários meses, com cobertura e comparabilidade. Preservar dados históricos, fontes, links e rastreabilidade, sem enxugar a Wiki de Resultados ou editar derivados à mão.

Critérios de conclusão:

- Inventário de páginas e proposta de agrupamento por assunto com destinos canônicos
- Modelo didático com conceitos, operação, evolução multimensal, limites e referências
- Plano de conservação, redirecionamento e revisão dos geradores antes de qualquer migração

### Acompanhar a evolução de cada agente

Criar proposta nova de Registros para acompanhar evolução do Loop e visão específica dos agentes. Cada papel terá nota e histórico completo sem limite editorial arbitrário de tamanho, com delegações, entregas, notas, revisões e lições. A leitura usa índices e sínteses referenciadas sem apagar o histórico. Ficha mostra função, versão de prompt, executor, evolução, avaliações e uso de memória. Não confundir registros dos agentes com outcomes comerciais.

Critérios de conclusão:

- Separar visão macro do Loop e ficha individual de cada agente
- Definir histórico preservado, busca, linha do tempo e sínteses de consulta
- Distinguir autoavaliação, ADM, Editor e revisão humana; rastrear o reuso das lições

### Acompanhar testes A/B e cross-sell

Especificar atributos de acompanhamento para experimentos growth em diferentes formatos, canais e frentes, incluindo cross-sell de seguros e novos dados que Pablo ainda apresentará. Modelo atual de investigações não é uma central A/B finalizada. Pode-se planejar agora; instrumentação e execução dependerão das novas fontes e definições de resultado.

Critérios de conclusão:

- Definir hipótese, grupos, unidade de alocação, público, exposição, janela, métrica e limites
- Separar tarefa de desenvolvimento, investigação, experimento e execução
- Contrato preliminar cross-sell com eventos e fontes pendentes claramente identificados

### Reunir Apostas em Testes e Tarefas

Diretriz do Pablo: descontinuar a aba Apostas e integrar partes importantes em Testes e Tarefas. Planejar preservação de hipótese, evidência, aprovação, responsável, execução, checklist, janela e vínculos históricos. Não remover a aba nem apagar registros antes de mapear capacidades, rotas e migração.

Critérios de conclusão:

- Mapear capacidades e dados atuais de Apostas para o destino
- Plano de transição preserva IDs, decisões, histórico e links
- Critérios para retirar a aba definidos e revisados antes da implementação

### Definir como avaliar resultados e aprendizados

Pablo quer alterar Outcomes, mas o papel futuro permanece aberto. Avaliar proposta de núcleo de Verificação e Aprendizados: o que foi executado, resultado observado, limites, decisão humana e o que pode ser reutilizado. A tela pode ser própria ou integrada a Testes e Tarefas; isso não está decidido. Não equiparar tarefa concluída a hipótese validada.

Critérios de conclusão:

- Comparar alternativas de tela própria e integração aos testes
- Definir estados de resultado observado, inconclusivo, não verificável e revisão
- Preservar distinção entre execução, efeito, aprendizado de negócio e lição de agente

### Gerar apresentações Afinz com Claude Code

Direção futura: Claude Code gera PPTX usando a skill afinz-pptx, substituindo geração via Google Slides API; arquivo concluído é disponibilizado no GaaS. Planejar dados, composição, marca, revisão visual, versionamento, upload, acesso, histórico e recuperação. Não mudar agora o pipeline vigente nem declarar o novo fluxo pronto.

Critérios de conclusão:

- Contrato do pedido e snapshot de dados definido
- Planejar geração pela skill Afinz e QA antes da publicação do arquivo
- Definir estados assíncronos, destino no GaaS, versões e recuperação de falhas

### Usar dados do Google Sheets nas apresentações

Testar tese: ler Google Sheets como fonte de dados, congelar o recorte e usar Claude Code para gerar o PPTX. Sheets não precisa ser o editor de slides, e a geração/upload será assíncrona. Confirmar planilha, abas, permissões de leitura, contratos de métricas e rastreabilidade antes do protótipo.

Critérios de conclusão:

- Leitura autorizada de intervalos com valores e datas preservados
- Snapshot rastreável usado na geração de um PPTX Afinz de teste
- Validação do arquivo e do upload posterior ao GaaS, sem dependência de Google Slides API

### Manter Wiki e computador sincronizados

Manter direção aceita: aprovação humana simplificada por conjunto, publicação de versão na Wiki primeiro e sincronização da mesma versão para o PC de Pablo depois. Planejar conflito, retomada, leitura durante publicação e proteção contra inventário local obsoleto. O teste de cópia e a publicação administrativa atual não equivalem a esse motor pronto.

Critérios de conclusão:

- Definir autoridade, versão aprovada e comprovantes de Wiki e PC
- Proteger contra alteração posterior à aprovação e sobrescrita por cópia antiga
- Testes de falha e retomada previstos, sem perda ou exclusão silenciosa de notas

### Verificar se os agentes aprendem entre ciclos

Planejar e depois testar um ciclo real de reutilização: lição candidata, revisão/aprovação, recuperação na próxima ativação, uso registrado e avaliação de efeito. Separar melhoria dentro de uma rodada de aprendizado persistente entre execuções. Definir como reprogramar o fluxo, prompts e contexto sem promover automaticamente reflexões a fatos ou ampliar permissões.

Critérios de conclusão:

- Definir promoção, revisão, substituição e validade das lições
- Comparar tarefa/evidência controladas quando avaliar melhoria
- Ficha e histórico mostram lição recuperada, uso/recusa, efeito e limitações

## Histórico e atualização

Esta nota preserva o planejamento de 31/10. O estado corrente das tarefas vive no GaaS, com revisão e histórico; não inferir conclusão pela existência do plano. Avisos por tarefa reutilizam as preferências pessoais de acompanhar, adiar e fechar. Mudanças relevantes reaparecem; checklist isolado não cria aviso novo. Concluir ou cancelar resolve o aviso, sem apagar histórico.

[[Loop-de-Aprendizado-Growth]] · [[MOC-Inteligencia-IA]] · [[Experimento-Agentes-Wiki-2026-10-31]]


## Objetivo e linguagem do menu SDD GaaS

SDD significa Spec Driven Development, desenvolvimento guiado por especificações. O menu serve para priorizar melhorias e transformar análises em especificações claras para evoluir o GaaS. Os temas são exibidos por nomes compreensíveis, com ordem sugerida, contexto e entregas esperadas. Códigos técnicos permanecem internos para preservar vínculos e histórico. Isso não altera o escopo, as dependências ou o estado dos trabalhos.


## Método proposto para amadurecer os temas

[[Como-Trabalhar-SDD-no-GaaS]] reúne pesquisa em fontes primárias, fluxo proporcional ao risco, ficha de especificação, critérios observáveis e um exemplo Fila–agentes–Wiki. A proposta distingue tema, spec e tarefas de execução. É um método para piloto; não muda automaticamente estados, dependências ou autorizações dos temas cadastrados.


## Revisão de Testes e Tarefas · 03/11/2026

[[Testes-e-Tarefas-Quatro-Frentes]] registra a implementação da central com quatro frentes, iniciativas, tipos de trabalho e notificações. Os temas macro permanecem em evolução; a nova interface não conclui automaticamente os agentes ou a medição CRM.
