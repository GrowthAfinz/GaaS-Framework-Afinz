# Testes e Tarefas: quatro frentes conectadas ao conhecimento

Data: 03/11/2026. Estado: proposta de produto para revisão e implementação incremental.
Esta especificação não representa funcionalidades já publicadas nem comprova execução de campanhas.

## Problema e resultado esperado

Pablo precisa acompanhar separadamente Spec Driven Development, Aquisição CRM,
Rentabilização CRM e Cross-sell CRM, mantendo relações entre iniciativas, trabalho,
atividades executadas, notas e aprendizado. A entrada deve responder: o que merece
atenção, qual é a próxima ação e o que comprova o estado apresentado?

Usuário inicial: Pablo, no planejamento e acompanhamento operacional recorrente.
Agentes apoiam investigação e atualização por pedido explícito via skill.
Frequência proposta: consulta diária, revisão por iniciativa e leitura por janela de teste.
Unidade de acompanhamento: item de trabalho; iniciativa agrupa itens; atividade de CRM
é uma execução observada, não sinônimo de tarefa.

## Base examinada e limites

- `TasksWorkspace.tsx` do checkout local `.codex-worktrees/loop-development-tasks` contém
  os caminhos development e investigations; este exame não certifica a versão de produção.
- `developmentService.ts` já contém responsável, prioridade, prazo, dependências,
  critérios, resolução, nota de origem, revisão e histórico; conservar esses contratos.
- O motor de agentes e o método SDD estão descritos nas notas canônicas do vault.
- A iniciativa Vai de Visa e o teste MCC possuem atualizações em 03/11/2026.
- Não houve nesta etapa consulta de schema vivo, auditoria visual da aplicação,
  instalação de referências ou validação de envios no SFMC.

## Arquitetura da informação

### Navegação principal

`Visão geral | Spec Driven Development | Aquisição CRM | Rentabilização CRM | Cross-sell CRM`

As quatro entradas são visões de acompanhamento, não quatro aplicações independentes.
SDD representa um modo de desenvolver o produto; as três entradas CRM representam
objetivos de negócio. A semântica deve permanecer explícita no modelo:

- **Espaço responsável:** SDD, Aquisição CRM, Rentabilização CRM ou Cross-sell CRM.
- **Contextos relacionados:** outras frentes e iniciativas beneficiadas pelo trabalho.
- **Tipo de trabalho:** tarefa, investigação, experimento ou especificação.
- **Iniciativa:** objetivo que reúne vários itens e suas notas canônicas.

Um item tem um espaço responsável. Pode aparecer em outra visão por vínculo, com
identificação clara de sua origem. Sua edição e histórico continuam únicos.
Contagens globais usam identidade única; não somam as contagens das visões vinculadas.
Cross-sell pode usar dados fisicamente armazenados em rentabilização sem copiá-los.

### Visão geral

Mostrar decisões pendentes, trabalhos em andamento, impedimentos e leituras de
experimentos previstas, com ligação para os itens. Separar contadores por tipo:
entregas concluídas não representam experimentos vencedores nem impacto comercial.
Evitar um painel de métricas de CRM nesta tela: resultados completos continuam em
suas superfícies analíticas, acessíveis por vínculo contextual.

### Dentro de cada frente

1. Título e propósito em uma frase.
2. Busca, iniciativa, tipo, estado e responsável; filtros ativos visíveis e removíveis.
3. Lista como padrão, quadro opcional com o mesmo conjunto filtrado.
4. Ação contextual: nova tarefa, investigação, experimento ou spec.
5. Seleção abre painel lateral; retornar preserva filtros, posição e item.

Cada linha mostra título humano, iniciativa, tipo, estado, responsável, prazo quando
existir e próxima ação. Identificadores técnicos ficam disponíveis nos detalhes.
Cor discreta distingue contexto; impedimento e atenção exigem também texto/ícone.
Mudança de estado deve funcionar por menu/teclado, além de eventual arraste.
Em tela pequena, detalhes podem ocupar a tela toda, preservando retorno ao contexto.

## Contrato do item de trabalho

| Campo | Regra proposta |
|---|---|
| Título e objetivo | Linguagem de entrega ou pergunta; evitar códigos como título |
| Espaço responsável e tipo | Definidos na criação; alterações preservam histórico |
| Iniciativa | Opcional para captura rápida; explicitada ao planejar uma iniciativa |
| Estado, prioridade, responsável e prazo | Prazo e responsável podem estar ausentes; não inventar |
| Próxima ação | Ação humana ou investigação concreta; separada da descrição extensa |
| Critérios e dependências | Proporcionais ao tipo e necessários para executar com clareza |
| Relações | Notas, trabalhos, execuções, propostas, decisões e resultados com identidades próprias |
| Histórico e revisão | Quem mudou, quando, o que mudou; conflito de revisão não sobrescreve silenciosamente |
| Evidência de entrega | Comprova o critério; checklist marcado sozinho não comprova comportamento |

Não guardar spec, PR, resultado e nota histórica num único campo `source_note`.
O desenho técnico das relações depende do inventário de entidades já existentes.
Uma experiência comum não exige substituir os dois modelos atuais por uma tabela genérica.

### Conteúdo por tipo

- **Tarefa:** resultado esperado, checklist, dependências e evidência de entrega.
- **Investigação:** pergunta, escopo, fontes, achados, hipóteses, limitações e decisão sugerida.
- **Spec:** problema, comportamento atual/esperado, cenários de aceitação, limites,
  alternativas relevantes, plano e verificação. Tema pode originar várias specs;
  tarefas de implementação são vinculadas, não checklists sem identidade quando precisam de histórico próprio.
- **Experimento:** hipótese, população elegível, unidade de alocação, células e controle,
  versões de conteúdo, exposição, janela, métricas, fontes, critérios e decisão.

## Estados e conclusão

Preservar inicialmente os estados atuais de desenvolvimento, com rótulos humanos.
O ciclo do experimento é próprio: desenho → preparado → em execução → em leitura → encerrado,
com saídas cancelado e inconclusivo quando pertinentes. Mapeamento técnico ainda a validar.
Estado de coleta e qualidade da evidência são propriedades separadas do andamento.

Concluir construção de um teste não o marca como executado. Encerrar um experimento
não significa validar a hipótese. Aprovar uma proposta de nota não comprova efeito de negócio.
Uma spec só é entregue quando os cenários aplicáveis têm evidência; o impacto posterior
continua em observação quando houver janela de negócio.

## Painel de detalhes

Seções: Resumo e próxima ação; Plano ou desenho; Evidências e notas; Histórico e decisões.
Mostrar apenas os campos do tipo selecionado, com acesso progressivo ao restante.
Vínculo para Wiki abre a nota canônica. Proposta editorial aparece como proposta,
sem substituir o conteúdo vigente antes da aplicação autorizada.
Estados explícitos: carregando, vazio, erro com recuperação, evidência parcial,
base desatualizada, falta de permissão e conflito de edição.

## Caso 1: spec do Loop de Memória

**Espaço responsável:** SDD. **Iniciativa:** Motor de agentes do Loop de Memória.
**Spec:** Acompanhar uma contribuição dos agentes a partir da Fila.

Primeiro incremento: partir de um item da Fila e recuperar o trabalho, a execução,
fontes consultadas, contribuição, proposta exata de alteração e decisão/versão aplicada.
A ativação da LLM permanece explícita via skill. O vínculo não implementa agendamento.

| Cenário | Resultado observável |
|---|---|
| Agente apresenta achado | Usuário localiza contribuição e evidências no trabalho de origem |
| Proposta afeta várias notas | Pacote identifica conteúdo proposto e revisões de base por nota |
| Resultado é inconclusivo | Limitação e próxima verificação aparecem sem conclusão fabricada |
| Nota mudou após a proposta | Aprovação antiga não autoriza aplicar conteúdo sobre a nova base |
| Aprovação válida | Aplicação produz recibo e referências às versões; falha não aparece como sucesso |
| Repetição da integração | Mesmo evento não cria trabalho ou aviso duplicado |
| Nova ativação | Lição aprovada recuperada é identificável; uso não é presumido pela existência da nota |

Investigar contratos existentes antes de adicionar armazenamento ou endpoints.
Históricos dos agentes, lições e conhecimento de negócio mantêm validações distintas.

## Caso 2: Vai de Visa

**Espaço responsável:** Rentabilização CRM. **Iniciativa:** Pool de Ofertas — Vai de Visa.
**Experimento:** Afinidade MCC × oferta genérica, vinculado à safra `VDV_2026_11_BF`.

Relacionar a iniciativa à nota canônica e o experimento à nota de desenho. Tarefas
propostas para validação do operador: audiência e sorteio; vitrine e validade das ofertas;
e-mail/LP; rastreio e congelamento do envio; reconciliação das atividades;
contrato de medição e leituras D+7, D+15 e D+30. Não cadastradas nem marcadas como executadas aqui.

Configuração geral e configuração por safra devem ser distintas: as notas descrevem
quatro ofertas no desenho geral e três na primeira safra. O sistema deve recuperar
a versão aplicável, não preencher a configuração por busca de uma frase isolada.
O status das notas não é confirmação de execução no tenant.

| Cenário | Resultado observável |
|---|---|
| Novas atividades importadas | Usuário revisa vínculos por identidade de execução/jornada, data e contexto |
| Nome previsto diverge do observado | Sugestão fica pendente; não vincular só por semelhança de nome |
| Medição de compra ausente | Abertura/clique aparecem como diagnóstico; resultado comercial não disponível |
| Janela ainda aberta | Leitura parcial identificada, sem decisão final antecipada |
| Safras ou células diferentes | Separação preservada; não somar populações como se fossem pessoas únicas |
| Controle sem comunicação | Denominador de alocação vem da fonte de audiência, não da tabela de disparos |
| Modelo geral evolui | Desenho/exposição históricos do teste continuam recuperáveis |

Não inferir causalidade por comparação bruta de expostos e não expostos. A validade
do sorteio, contaminação, cobertura, perdas e unidade de análise exige verificação própria.
As fontes de compra/receita e novos dados de cross-sell precisam de contratos antes
da leitura de impacto. Importar atividades não resolve essa lacuna.

## Fila e Loop de Memória

Fila aponta o que exige ação; Testes e Tarefas mantém o acompanhamento; Wiki mantém
conhecimento e especificações; Registros conserva episódios e avaliação dos agentes.
Criar/atualizar aviso para decisão solicitada, bloqueio acionável, leitura disponível
ou proposta pronta. Edição de checklist e eventos técnicos comuns não notificam por padrão.
Aviso referencia entidade e motivo, possui resolução e evita repetição pelo mesmo evento.
Vencimento de D+7 não significa que dados chegaram: distinguir leitura prevista de disponível.

Agentes podem sugerir classificação, vínculos e hipóteses. Relação sugerida é distinta
de confirmada. Escrita e publicação seguem permissões e aprovação de conteúdo existentes.

## Implementação sugerida em incrementos

1. **Inventário atual e contratos:** conferir main, modelos de investigações/SDD,
   links da Fila, permissões, iniciativas e fontes CRM. Mapear IDs existentes e dados novos.
2. **Navegação e leitura:** quatro visões e visão geral, lista, filtros e detalhes,
   preservando URLs antigas e histórico. Pode mostrar estado vazio explicativo nas frentes sem dados.
3. **Cadastro contextual:** iniciativas, relações e formulários por tipo; manter
   a governança das entidades existentes. Migrar com mapa reversível e sem exclusões implícitas.
4. **Experimento Visa:** configuração versionada, atividades revisadas e estado
   da medição; resultados só após fonte e denominadores validados.
5. **Fila e agentes:** notificações relevantes e rastreabilidade ponta a ponta;
   investigar/aprovar aprendizados no mesmo pacote de revisão pertinente.

Fora do primeiro incremento: editor completo do Notion, cronograma/Gantt, automação
autônoma de LLM, envio SFMC, calculador estatístico novo, migração integral de Apostas,
reforma de Outcomes/Registros e leitura financeira sem dados confirmados.

## Verificação de UX e critérios do piloto

Com os dois casos, pedir ao operador para: localizar próxima ação; distinguir entrega
de resultado; abrir nota/evidência e retornar; identificar impedimento; separar safra;
localizar proposta pendente e execução histórica. Registrar hesitações e erros observados,
sem inventar ganho percentual. Conferir navegação por teclado e leitura em tela pequena.
Não afirmar UX validada antes desse exercício numa interface utilizável.

Critérios técnicos a detalhar após inventário: links legados, ausência de duplicações,
filtros persistentes, revisão concorrente, acesso por papel, preservação de histórico,
dados parciais e resolução de avisos. Checks proporcionais ao incremento implementado.

## Referências e decisões ainda abertas

- Notion: [views](https://www.notion.com/help/views-filters-and-sorts) e
  [relações](https://www.notion.com/help/relations-and-rollups): contexto relacionado e visões dos mesmos itens.
- Trello: [cartões e listas](https://support.atlassian.com/trello/docs/add-and-customize-cards-and-lists/):
  resumo simples e aprofundamento sob demanda.
- Plane: [repositório](https://github.com/makeplane/plane) e
  [views](https://docs.plane.so/core-concepts/views): referência estrutural para trabalho e visões.
- Vikunja: [features](https://vikunja.io/features/): projetos, subtarefas e múltiplas apresentações.
- Linear: [display options](https://linear.app/docs/display-options): propriedades e densidade controladas.

Referências consultadas na etapa anterior desta conversa. Inspiração de padrões não
equivale a incorporar código. Reutilização de código exigirá verificar licença e edição.

Antes de instrumentar cross-sell: conhecer novos dados, produto, unidade e evento de conversão.
Antes de automatizar decisão experimental: confirmar fonte, janela e critérios por teste.
Antes de alterar banco: conferir schema e políticas atuais. Essas dúvidas não impedem
o inventário e o desenho da navegação; impedem presumir resultados ou escrever migrações finais.
