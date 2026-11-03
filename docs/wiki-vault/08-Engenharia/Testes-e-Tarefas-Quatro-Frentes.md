---
title: Testes e Tarefas — quatro frentes de acompanhamento
tipo: especificacao
camada: engenharia
criado: 2026-11-03
atualizado: 2026-11-03
status: implementado-revisao-visual-pendente
fonte: pedido-pablo-e-implementacao-codex-2026-11-03
tags: [gaas, sdd, tarefas, experimentos, crm, visa, loop]
---

# Testes e Tarefas — quatro frentes de acompanhamento

## Propósito e direção de produto

Pablo pediu uma revisão de Testes e Tarefas inspirada em Notion, Trello e referências
abertas, para acompanhar separadamente **Spec Driven Development, Aquisição CRM,
Rentabilização CRM e Cross-sell CRM**, com visão geral e relações com a Wiki.

Referências: [Notion, visualizações](https://www.notion.com/help/views-filters-and-sorts),
[Trello, cartões](https://support.atlassian.com/trello/docs/add-and-customize-cards-and-lists/),
[Plane](https://github.com/makeplane/plane), [Vikunja](https://vikunja.io/features/) e
[Linear, opções de apresentação](https://linear.app/docs/display-options).
Adaptação de padrões ao GaaS; nenhum desses sistemas foi instalado ou incorporado.

## Estrutura entregue nesta revisão

- Quatro espaços responsáveis e visão geral. Contextos relacionados permitem acompanhar
  o mesmo trabalho em mais de uma frente, conservando identidade e histórico únicos.
- Iniciativas agrupam trabalhos e indicam nota canônica, com cadastro e revisão.
- Tipos próprios: tarefa, investigação, experimento e especificação; formulário contextual.
- Lista e quadro por estado, busca e filtros preservados na URL; painel lateral de detalhes.
- Próxima ação, responsável, prioridade humana, prazo, dependências, critérios e evidência.
- Referências separadas por nota, execução, evidência, proposta ou trabalho; vínculo sugerido
  não equivale a vínculo confirmado nem aprovação editorial.
- Histórico conserva as versões do desenho e das decisões. Conflito de revisão exige reabrir.
- Pedido de decisão, proposta pronta e leitura disponível integram-se à Fila. Datas previstas
  não afirmam disponibilidade de dados. Checklist isolado não gera novo aviso.
- Investigações analíticas anteriores continuam acessíveis em Aquisição; links legados preservados.

O armazenamento existente de desenvolvimento foi ampliado, sem remover seus IDs ou eventos.
Iniciativas possuem registros próprios. Escrita continua administrativa via funções com
checagem de acesso; leitura depende das políticas vigentes. A migração foi aplicada no banco.

## Trabalho, experimento e resultado são coisas distintas

Estado de entrega, fase do experimento, estado dos dados e conclusão sobre hipótese são
campos independentes. Encerramento do experimento exige leitura e decisão explícita, que
pode ser inconclusiva. Concluir trabalho exige critérios e evidência de entrega.
Specs em execução exigem comportamento esperado, cenários e estratégia de verificação.
A plataforma não calcula causalidade nem confirma resultado comercial por abertura/clique.

## Cadastros iniciais

Quatro iniciativas: Motor de agentes do Loop de Memória; Evolução das jornadas de aquisição;
Pool de Ofertas — Vai de Visa; Cross-sell de seguros.

Os doze temas anteriores foram vinculados à iniciativa do Loop, conservando suas identidades.
Novos trabalhos: uma spec de rastreabilidade dos agentes; uma investigação de aquisição;
seis tarefas preparatórias e um experimento Visa; uma tarefa de contrato de dados de seguros.
Total observado após cadastro: 22 trabalhos (13 SDD, 1 aquisição, 7 rentabilização, 1 cross-sell).
Os novos cadastros são planejamento, não confirmação de implementação SFMC ou envio.

## Aplicação ao Vai de Visa

[[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] permanece a nota canônica da iniciativa de
rentabilização por incentivo ao uso. [[Teste-Afinidade-MCC-vs-Generico]] descreve o teste.
Desenho geral de quatro ofertas e primeira safra com três ofertas são configurações
contextuais distintas; conservar versão e safra em cada registro.

Audiência/sorteio, vitrine/validade, e-mail/LP, rastreio/congelamento, reconciliação de
atividades e contrato de medição são trabalhos próprios. Novas atividades importadas
precisam de vínculo revisado; semelhança de nome não basta e importação não cria venda.
Controle sem envio exige denominador na fonte de alocação. D+7/D+15 são acompanhamento,
D+30 é a leitura prevista; cobertura, janela e integridade precisam ser verificadas.
Cross-sell tem espaço próprio, embora parte dos dados possa estar em rentabilização.
Os novos dados de seguros ainda precisam ser apresentados e contratados.

## Relação com os agentes e o Loop de Memória

[[Motor-de-Agentes-Loop-de-Memoria-2026-10]] continua a direção macro. A nova central
organiza trabalho, evidência e referências a propostas; não implementa sozinha todas
as integrações dos agentes. A spec de rastreabilidade permanece trabalho planejado.
Ativação da LLM continua por pedido explícito via skill; aprovação de notas vale para
conteúdo e base exatos. Registro de entrega não comprova aprendizado persistente.

## Validação e limites

Testes sintéticos do banco cobrem permissões, revisões concorrentes, dependências,
critérios alterados, fechamento experimental, histórico e notificações sem duplicação.
Testes de navegação preservam rotas anteriores e rejeitam protocolos executáveis em links.
Links Obsidian com separador escapado em tabelas passam a ser interpretados corretamente
no parser e exportador; conteúdo das notas de negócio é preservado.

A verificação visual automatizada foi interrompida pela ferramenta de navegação por
não conseguir confirmar a URL atual no Windows. Isso não equivale a validação visual concluída.
A confirmação de publicação e o resultado final dos checks ficam no recibo da release.

Ainda dependem de fontes/implementações próprias: novas atividades de rentabilização,
medição de compra/receita, dados de seguros, ciclo ponta a ponta dos agentes, reforma de
Registros/Outcomes e integração das partes de Apostas. Não declarar essas frentes concluídas.

## Relacionado

[[Como-Trabalhar-SDD-no-GaaS]] · [[Backlog-Desenvolvimento-GaaS-Loop-2026-10]] ·
[[Motor-de-Agentes-Loop-de-Memoria-2026-10]] · [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] ·
[[Teste-Afinidade-MCC-vs-Generico]]

## Novo padrão: Iniciativas por frentes de negócio · 03/11/2026

Pablo escolheu a proposta visual com navegação lateral por frente, iniciativa e trabalhos no
centro e contexto da Wiki à direita, renomeada para **Iniciativas por frentes de negócio**.
O padrão substitui os cabeçalhos repetidos e a lista extensa como entrada principal.

A implementação acrescenta percurso explícito (Contexto, Preparação, Teste/Desenvolvimento,
Leitura/Verificação, Aprendizado), pergunta orientadora, referências de contexto e registro
de decisões da iniciativa. Etapa e contexto são versionados; decisões corrigidas preservam
os registros anteriores. Favorito é preferência local por usuário. Formulários, histórico,
filtros e quadro anteriores continuam acessíveis sob demanda.

“Preparar próximo passo” abre o trabalho pertinente; “Preparar sessão com os agentes” gera
briefing revisável para ativação por skill, sem chamar LLM automaticamente. Os agentes não
aprovam suas propostas por esse botão. Fontes, versões e aprovação da Wiki seguem o contrato
do [[Motor-de-Agentes-Loop-de-Memoria-2026-10]].

O contexto das quatro iniciativas foi preparado a partir das notas canônicas. O Visa está
em preparação, conforme o desenho e as pendências registrados em
[[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]]. Nenhuma decisão ou venda foi fabricada a partir
da ilustração. O registro de decisões fica vazio até o operador registrar definições.

Os checks automáticos e testes de contratos são o critério desta publicação. A validação
visual foi interrompida pela ferramenta de navegação; Pablo autorizou expressamente:
“Publique com os testes atuais e registre a revisão visual como pendente”. Portanto, a
revisão visual e de responsividade permanece pendente; não declarar fidelidade de 100%.

Implementação e plano detalhado: PR #67 no repositório GaaS-Framework-Afinz e
`docs/plans/iniciativas-por-frentes-visao-aprovada.md`. O novo padrão preserva a rota
`?view=learning&section=investigations`.
