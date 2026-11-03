---
title: Como trabalhar temas de Spec Driven Development no GaaS
tipo: guia-proposto
camada: engenharia
criado: 2026-10-31
atualizado: 2026-10-31
status: proposta-para-piloto
fonte: pesquisa-fontes-primarias-e-contexto-gaas
tags: [sdd, especificacoes, desenvolvimento, agentes, qualidade, loop]
---

# Como trabalhar temas de Spec Driven Development no GaaS

## Propósito

Transformar a seção Spec Driven Development em uma fila de melhorias que possam ser entendidas,
priorizadas, implementadas e verificadas com menos ambiguidade. O resultado esperado é qualidade
de entrega e aprendizado reaproveitável, não volume de documentação ou quantidade de tarefas concluídas.

Esta nota propõe um método para o GaaS. Não instala ferramentas, muda estados da tela, aprova
especificações ou declara as tarefas existentes prontas para execução. Pesquisa consultada em 31/10/2026.

## O que a pesquisa oferece

| Referência primária | Contribuição pertinente | Aplicação proposta no GaaS |
|---|---|---|
| [GitHub Spec Kit](https://github.com/github/spec-kit) | Explicitar intenção e princípios e refinar especificação, plano e tarefas antes de implementar; oferece caminhos próprios para bugs e avaliação de ideias | Reutilizar AGENTS.md e regras canônicas; não transformar toda correção numa especificação extensa |
| [Kiro Specs](https://kiro.dev/docs/specs/) | Distingue requisitos, desenho e tarefas, incluindo critérios observáveis | Diferenciar o que queremos mudar, como pretendemos fazer e quais entregas comprovam a mudança |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | Organiza cada mudança por proposta, cenários, desenho e tarefas; permite revisar artefatos durante o trabalho | Registrar a mudança no produto existente e atualizar a spec quando uma decisão legítima mudar |
| [DORA, pequenos lotes](https://dora.dev/capabilities/working-in-small-batches/) | Recomenda entregas menores para encurtar feedback e corrigir premissas mais cedo | Dividir temas grandes em incrementos verificáveis, sem fragmentar tanto que se perca o objetivo |

Essas referências não definem um único padrão obrigatório de SDD. As descrições de ferramentas
documentam seus métodos; não são prova independente de ganho no GaaS. A pesquisa DORA trata de
práticas de entrega, não de uma garantia específica sobre adotar SDD. A hipótese local é que explicitar
comportamento, contexto e verificação reduzirá retrabalho. Ela precisa ser observada no piloto.

Não recomendo instalar os três sistemas ou migrar o projeto para um deles agora. O ganho inicial
pode vir do método, usando Markdown versionado, a fila existente, as skills e os checks do projeto.

## Um tema ainda não é uma especificação

“Acompanhar a evolução de cada agente” expressa uma intenção relevante, mas não define qual
primeiro comportamento deve existir. Pode abranger histórico, avaliações, memória, busca e comparação.
Tentar desenvolver tudo num só pedido favorece interpretação livre, retrabalho e entregas difíceis de revisar.

A fila pode ter três níveis relacionados:

- **Tema:** problema ou oportunidade que vale explorar. Exemplo: acompanhar a evolução dos agentes.
- **Especificação de uma mudança:** comportamento delimitado e verificável. Exemplo: consultar as
entregas e avaliações de um agente por execução, preservando versões anteriores.
- **Tarefas de execução:** passos para realizar essa mudança, com dependências e evidência de conclusão.

Um tema pode originar várias specs ao longo do tempo. Tarefas técnicas devem manter vínculo com a
mudança e seu propósito. Não confundir esse agrupamento com uma única tarefa enorme de implementação.

## Fluxo sugerido

**Entender → especificar → escolher a solução → executar em partes → verificar → publicar → observar e reutilizar.**

1. **Entender:** quem enfrenta o problema, qual comportamento existe, qual evidência temos e o que
ainda é desconhecido. Se não soubermos o suficiente, produzir investigação delimitada antes de projetar.
2. **Especificar:** descrever resultado esperado, casos de uso, limites e exemplos que distinguem
uma entrega correta de uma apenas plausível. Separar requisito de hipótese e preferência de solução.
3. **Escolher a solução:** examinar código e dados atuais, reaproveitar o que existe, registrar alternativas
relevantes, dependências, impacto em acesso/dados e estratégia de recuperação quando necessária.
4. **Executar em partes:** decompor por entregas utilizáveis ou verificáveis. Uma camada técnica isolada
pode ser necessária, mas deve explicitar qual capacidade permite e como será testada.
5. **Verificar:** confrontar cada critério com evidência adequada. Código local, mock, banco real, versão
publicada e plataforma externa comprovam coisas diferentes. Registrar o que não foi verificado.
6. **Publicar:** registrar versão entregue, testes, recibo de deploy e eventual pendência de operação.
Não apagar a divergência entre a spec e o que de fato foi entregue.
7. **Observar e reutilizar:** verificar uso e efeito quando mensuráveis, registrar lições e recuperar as
pertinentes na próxima ativação. Entrega publicada não é, sozinha, benefício de negócio comprovado.

O fluxo admite voltar à pergunta e revisar a solução. Descoberta durante a implementação não é
motivo para congelar uma spec errada: registrar a decisão, sua razão e a versão afetada. Se alterar
materialmente o escopo autorizado ou uma decisão do produto ainda aberta, alinhar com Pablo.
Não exigir uma confirmação repetida para cada arquivo ou passo já autorizado.

## Profundidade proporcional à mudança

| Situação | Especificação suficiente |
|---|---|
| Ajuste simples e reversível, como título ou cor | Pedido claro, local afetado, comportamento esperado e conferência proporcional |
| Evolução de uma função existente | Problema, recorte, cenários, dados, impacto, plano curto e verificação |
| Mudança transversal, como memória, permissões, migração ou publicação | Requisitos e decisões explícitos, contratos entre partes, falhas, transição, recuperação e validação antes de expandir |

Não criar testes que apenas repitam uma alteração de texto. Usar checks que possam detectar uma
falha relevante. Não criar documentos separados quando seções de um único arquivo resolvem.
AGENTS.md e notas canônicas já contêm princípios: referenciá-los, sem criar uma constituição concorrente.

## A ficha de uma boa spec

Uma pessoa ou agente deve conseguir responder:

| Campo | Pergunta que precisa resolver |
|---|---|
| Problema e evidência | O que está ruim ou faltando? Onde observamos isso? |
| Pessoa e decisão | Para quem melhoramos e qual decisão ou ação fica mais fácil? |
| Estado atual | O que já existe em código, dados e documentação? Em qual versão foi conferido? |
| Mudança esperada | O que o usuário conseguirá fazer ou perceber ao final? |
| Recorte | Qual menor entrega tem valor? O que fica para depois? |
| Cenários e critérios | Quais exemplos demonstram funcionamento, limites e erros relevantes? |
| Fontes e contratos | Quais dados, identificadores, versões, regras e acessos são necessários? |
| Decisões em aberto | O que impede escolher ou executar? Que evidência ou decisão destrava? |
| Plano | Como pretendemos fazer e quais dependências são reais? |
| Verificação e entrega | Que evidência confirma cada critério e como encontraremos a versão publicada? |
| Acompanhamento | Como saberemos se ajudou? O que pode virar aprendizado reutilizável? |

Não preencher lacunas com uma resposta inventada. “A definir” deve dizer se impede investigar,
desenhar ou executar. Um dado ausente não bloqueia toda a spec: pode exigir recorte menor ou teste de viabilidade.

## Quando está pronta para desenvolver

Uma spec pode avançar quando o propósito, o recorte e os critérios estão compreensíveis; as fontes
decisivas foram inspecionadas; dependências e dúvidas impeditivas foram tratadas; e a solução pode
ser executada e verificada dentro do escopo autorizado. Isso é prontidão, não certeza absoluta.

Para concluir a entrega, registrar comportamento implementado, critérios atendidos, checks relevantes,
limites e referência à versão entregue. Marcar caixas sem evidência não demonstra atendimento.
Concluir uma spec também não conclui automaticamente seu tema maior.

## Como isso se encaixa na tela atual

A seção já tem temas, prioridades legíveis, dependências, critérios, responsável/prazo opcionais,
histórico, avisos na Fila e links diretos. Essa base organiza o trabalho, mas ainda não representa
todo o ciclo de specs. Esta leitura foi confrontada com a implementação local que originou as entregas
publicadas dos PRs 63 a 65; não foi feita nesta pesquisa uma nova auditoria de cada registro do banco.

Como primeiro passo de uso, podemos colocar a ficha na descrição do tema e os critérios no campo
existente; a spec detalhada fica em Markdown versionado quando necessária. Registrar o link sem
duplicar versões conflitantes. O campo atual de nota relacionada não deve passar a significar ao mesmo
tempo nota de negócio, spec, PR e relatório de teste: esses vínculos merecem distinção na evolução da tela.

Como evolução de produto, proponho, ainda sem implementação:

- Separar a pergunta **“em que fase estamos?”** da pergunta **“qual o estado do trabalho?”**.
Em especificação/implementação/validação são fases; bloqueada ou cancelada são condições diferentes.
- Relacionar tema, specs e tarefas, preservando IDs, histórico e dependências existentes.
- Mostrar na ficha: especificação e versão, dúvidas decisivas, próximo passo, critérios e evidências,
PR/deploy e resultado observado. A leitura principal deve permanecer simples; detalhes ficam recolhidos.
- Fazer a Fila chamar atenção para decisão necessária, impedimento, revisão solicitada ou entrega
pronta para validar. Não criar avisos repetitivos só porque mais um arquivo foi gerado.

Não é necessário reconstruir a tela para começar o piloto. Tampouco basta renomear uma lista de
tarefas para afirmar que ela já oferece uma fila completa de SDD.

## Papel dos agentes

Pablo define intenção e resolve decisões de produto que não podem ser inferidas. O ADM enquadra,
distribui investigação e acompanha dependências. Especialistas pesquisam, questionam premissas e
propõem alternativas. Na implementação, o executor segue a spec pertinente e registra decisões.
O revisor confronta o resultado com os cenários e as fontes, em vez de apenas conferir se arquivos existem.

Quando vários agentes participarem, cada um deve saber qual pergunta ou entrega assume e qual
contrato compartilha. Paralelizar tarefas realmente independentes. Um problema ou nova oportunidade
pode retornar à investigação; não restringir o especialista a responder perguntas de conformidade.

A spec orienta execução, mas não obriga a fingir que toda hipótese foi demonstrada. Reutilizar as
lições aprovadas pertinentes e registrar uso/recusa. Resultados técnicos, lições operacionais e
aprendizados de negócio mantêm validações distintas, conforme [[Motor-de-Agentes-Loop-de-Memoria-2026-10]].

## Exemplo aplicado: uma entrega de agente rastreável na Fila

**Tema de origem:** Como os agentes trabalham com a Fila e a Wiki.

**Primeiro recorte proposto:** ao terminar uma investigação acionada por skill, permitir encontrar
no item de origem a entrega correspondente, suas evidências e a proposta de atualização de uma nota.
Não implementar todo o motor de memória, reorganizar a Wiki ou lançar testes A/B nesse recorte.

**Problema:** nossos testes produziram arquivos rastreáveis em outputs, mas isso não demonstra que
o operador encontra e revisa a entrega no contexto da Fila. A capacidade ponta a ponta ainda precisa
ser confrontada com os contratos atuais do app, para evitar duplicar o fluxo editorial existente.

**Comportamento esperado:** Pablo abre o item, entende a contribuição, consulta a evidência e sabe
qual decisão é necessária. A proposta continua separada da aplicação aprovada.

| Cenário | Critério observável | Evidência de verificação proposta |
|---|---|---|
| Execução encerrada com contribuição | Item de origem permite recuperar a execução e sua entrega correta | Cenário integrado com IDs e revisões conferidos |
| Proposta editorial preparada | Caminho, base e texto proposto são recuperáveis, sem sobrescrever a nota | Comparação de versões antes/depois e estado editorial |
| Análise inconclusiva | Limite e próxima verificação aparecem; não se inventa recomendação | Caso com fonte insuficiente e conferência do texto |
| Fonte ou nota mudou | Entrega anterior não se apresenta como atualização válida da nova revisão | Ensaio de mudança de revisão/base, sem forçar aplicação |
| Falha ou retomada | Repetir a operação prevista não duplica a contribuição | Caso de interrupção/reexecução, com contagem e referências |

**Perguntas em aberto:** quais vínculos e RPCs existentes já atendem o recorte? O que realmente
falta? Como representar os tipos novos de contribuição sem invalidar contratos existentes?
Essas perguntas fazem parte da especificação e pesquisa técnica, não de uma aprovação já obtida.

**Tarefas de execução candidatas:** inspecionar contratos e definir o recorte; escrever a spec
da integração faltante; implementar apenas a lacuna confirmada; verificar cenários; publicar quando
autorizado; acompanhar uma revisão real. Cada entrega deve levar ao mesmo resultado de ponta a ponta.

**Medida de valor inicial:** Pablo consegue localizar e decidir sobre a contribuição sem reconstruir
a conversa ou procurar arquivos manualmente? A resposta deve ser observada, não presumida pelo deploy.

## Piloto recomendado

Selecionar um tema relevante e um recorte verificável, usando o exemplo acima ou outro escolhido
por Pablo. A definição macro do Loop continua uma dependência para decisões centrais; preparar uma
spec não autoriza executar uma tarefa cujas dependências atuais ainda estejam pendentes.

Começar com um piloto, limitar trabalhos simultâneos e observar: ambiguidades resolvidas antes
de implementar, retrabalho por requisito, defeitos/reaberturas, tempo de revisão e utilidade percebida.
Sem baseline, não prometer um percentual de ganho. Medir também o esforço de especificar: excesso
de documento que não muda decisão é custo, não evidência de qualidade.

Só depois decidir se vale adicionar campos, fases e vínculos à tela ou adotar uma ferramenta.
O piloto ainda não foi executado e este método não foi incorporado automaticamente aos prompts.

## Template reutilizável

```markdown
# [Melhoria que queremos entregar]

## Por que vale fazer
Pessoa/decisão, problema e evidência.

## O que existe hoje
Código, dados e notas consultados, com versões e limites.

## O que muda neste recorte
Comportamento esperado e o que fica para depois.

## Exemplos e critérios de conclusão
Situação → comportamento esperado → como verificar.

## O que precisamos decidir ou descobrir
Dúvida, impacto e próximo passo para resolvê-la.

## Como pretendemos fazer
Alternativas relevantes, solução proposta, dependências e impactos.

## Entregas e verificação
Passos verificáveis, evidências esperadas e referência da versão entregue.

## O que aconteceu e o que reutilizar
Resultado observado, limites, mudanças da spec e lições candidatas.
```

## Referências e relações

- [GitHub Spec Kit: conceitos](https://github.com/github/spec-kit/blob/main/docs/concepts/sdd.md)
- [GitHub Spec Kit: processo e caminhos distintos de trabalho](https://github.com/github/spec-kit/blob/main/README.md)
- [Kiro: requisitos, desenho e tarefas](https://kiro.dev/docs/specs/)
- [OpenSpec: proposta, cenários e evolução de mudanças](https://github.com/Fission-AI/OpenSpec)
- [DORA: pequenos lotes e feedback](https://dora.dev/capabilities/working-in-small-batches/)

[[Backlog-Desenvolvimento-GaaS-Loop-2026-10]] · [[Motor-de-Agentes-Loop-de-Memoria-2026-10]]
· [[Loop-de-Aprendizado-Growth]] · [[MOC-Inteligencia-IA]] · [[Padrao-Editorial-Enciclopedia]]
