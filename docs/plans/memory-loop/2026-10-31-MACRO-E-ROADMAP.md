# Agentes como motor de execução do Loop de Memória

Registro consolidado em 31/10/2026. Direção de produto definida com Pablo; arquitetura em planejamento.
Os agentes não são um projeto quase finalizado: são uma camada de execução generativa em experimentação,
destinada a sustentar o Loop de Memória, com foco inicial em Fila e Wiki.

## O ciclo macro

**Pedido via skill → ativação e releitura → interpretação de gatilho e resultados → investigação e execução
generativa → revisão/aplicação autorizada → aprendizado → reutilização em nova ativação.**

A ativação é o pedido explícito de Pablo ao Claude Code ou Codex. A plataforma pode organizar dados,
avisos e filas, mas não inicia uma LLM autonomamente. Uma nova ativação recupera a base atual e o contexto
relevante, identifica o que mudou e seleciona trabalhos. Não exige reler todo o vault quando as leituras
recentes permanecem úteis; registrar o que foi relido e o que foi herdado.

Interpretação conecta sinal, histórico e pergunta de negócio. Gatilho determinístico, hipótese gerada por
LLM e eventual modelo preditivo são coisas diferentes; não afirmar que o último já existe. Execução
generativa investiga, formula hipóteses, cruza regiões e propõe enriquecimento coordenado de notas.
A aprovação humana vale para um conjunto de conteúdo exato. Aplicação, verificação e resultados
alimentam o aprendizado e o contexto de uma próxima ativação, que pode ter fluxo e prompts revisados.

## Fila e Wiki como superfícies prioritárias

Fila é a entrada operacional: o que merece atenção, por qual evidência, em qual contexto e qual próximo
trabalho precisa ser feito. Wiki é o conhecimento estruturado que sustenta interpretação e recebe as
contribuições revisadas. Os agentes precisam fechar esse circuito: trabalho na Fila, investigação,
proposta de conhecimento, decisão, versão de nota e retorno ao item de origem.

O resultado desejado não é apenas um relatório de conformidade. É uma descoberta sustentada, conexão
útil, hipótese testável, oportunidade ou lacuna com plano concreto de obtenção. Correção editorial tem
valor, mas não demonstra sozinha enriquecimento analítico. Nenhuma novidade deve ser fabricada para
cumprir quota. Uma investigação negativa pode ser útil se elimina uma alternativa ou melhora a decisão.

## Papéis e memória

O ADM possui visão global, distribui missões com justificativa, acompanha impactos, avalia todas as
entregas e registra considerações e erros próprios. Especialistas mantêm foco regional e autonomia de
investigação em leitura; podem contestar, perguntar e seguir pistas pertinentes. O Editor integra os
achados em texto didático, com fontes, ressalvas e implicação prática, e avalia a coordenação do ADM.

Cada papel terá uma nota e histórico completo, sem limite editorial arbitrário de tamanho. Para a
consulta por LLM, índices e sínteses referenciadas podem selecionar contexto sem apagar esse histórico.
Papel, contrato/prompt e executor/modelo são identidades distintas. Registrar missões, fontes, entregas,
avaliações, trocas, hipóteses, falhas, lições candidatas e uso de memória, sem raciocínio interno oculto.

Separar três camadas: episódios operacionais dos agentes; lições candidatas/aprovadas para orientar
trabalho futuro; conhecimento de negócio ou aprendizado por outcome com sua própria validação.
A avaliação do ADM não torna uma hipótese verdadeira nem uma ação eficaz. O reuso precisa registrar
qual lição foi recuperada, aplicada ou recusada e o que aconteceu. Feedback dentro de uma execução não
prova aprendizado persistente. Reprogramar o ciclo não significa permitir autoalteração de permissões.

## Direção de cada tela

| Tela | Papel desejado e estado da decisão |
|---|---|
| Fila | Prioridade: entrada de trabalho, contexto, avisos e acompanhamento do retorno das análises |
| Wiki | Prioridade: conhecimento didático, conectado e atualizado; reorganização de Assuntos a planejar |
| Testes e Tarefas | Central futura de tarefas, investigações e testes multiformato; o cadastro de desenvolvimento é um passo próprio, não finalização de A/B |
| Report Live | Direção futura: geração assíncrona de PPTX via Claude Code e skill Afinz, depois disponibilização no GaaS |
| Apostas | Diretriz do Pablo: descontinuar a aba após integrar capacidades importantes em Testes e Tarefas, conservando histórico |
| Outcomes | Papel futuro aberto; proposta abaixo é sugestão, não decisão concluída |
| Registros | Redesenho completo para evolução do Loop e fichas/históricos de agentes, separado de memória comercial validada |

### Assuntos e interpretação analítica

Planejar uma organização com menos páginas canônicas, mais completas e didáticas. Unir contexto,
conceitos, regras, operação, dependências, evolução temporal e referências recentes. Resultados devem
aparecer em escala de vários meses, com datas de consulta, cobertura, comparabilidade e limites.
Menos páginas não autoriza apagar histórico nem enxugar a Wiki de Resultados. Conservar fontes em
seções históricas ou anexos, rever links e geradores e definir migração antes de editar derivados.

### Testes A/B e cross-sell

O modelo atual não é uma central de testes finalizada. Planejar atributos para diferentes formatos,
frentes e canais: hipótese, grupo, unidade de alocação, exposição, população, janela, métrica, baseline,
critério, qualidade, execução e decisão. Cross-sell de seguros entra no escopo, com dados novos ainda
pendentes de apresentação por Pablo. Não declarar venda ou receita a partir de abertura/clique.
O desenho pode avançar; instrumentação e execução dependem das fontes e contratos ainda ausentes.

### Report Live, PPTX e Google Sheets

É tecnicamente viável ler uma planilha Google como insumo, congelar dados e gerar PPTX fora do Google
Slides. A API de Sheets oferece leitura de intervalos com escopo somente leitura. A viabilidade do
fluxo específico ainda precisa de protótipo e validação; não houve geração ou upload neste trabalho.

Direção a planejar: pedido → snapshot de dados (inclusive Sheets quando apropriado) → geração pelo
Claude Code com a skill afinz-pptx → revisão numérica, de marca e visual → arquivo versionado → upload
ao GaaS → recibo e histórico. O processamento é assíncrono. Planilha é insumo de leitura, não editor
do PPTX; o pipeline Google Slides API não será alterado nesta etapa.

Fonte da capacidade de leitura: [Google Sheets, spreadsheets.values.get](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get).

### Sugestão para Outcomes

Conservar a função de verificação, mesmo se a tela mudar: execução ocorreu? O que foi observado e em
qual janela? Que limitações impedem concluir? Qual decisão humana foi tomada? O que pode orientar
outra ativação? Uma possibilidade é uma visão de **Verificação e Aprendizados**, ligada às tarefas e
experimentos, apresentando resultados revisados e pendências de medição. Tela própria, nome e integração
ainda serão avaliados. Concluir tarefa não é validar hipótese; ausência de execução não é resultado negativo.

## Prioridades de planejamento

1. P0: contrato macro do ciclo e integração dos agentes com Fila–Wiki (MEM-01, MEM-02).
2. P1: testar contribuição investigativa CRM, planejar Assuntos e Registros, especificar testes
multiformato/cross-sell e autoridade Wiki/PC (MEM-03 a MEM-06, MEM-11), respeitando dependências.
3. P2: migração de Apostas, papel de Outcomes, Report Live/PPTX, protótipo Sheets e reuso entre ativações
(MEM-07 a MEM-10, MEM-12). Prioridade não define prazo nem autoriza executar tudo agora.

O backlog detalhado terá objetivos, dependências e critérios. Responsáveis e datas não foram inventados.
Pablo autorizou um cadastro completo de tarefas de desenvolvimento no GaaS, inclusive avisos na Fila.
Isso não autoriza antecipar as reformas funcionais descritas nas tarefas.

## Evolução desta conversa

1. Reconstrução cronológica do GaaS por GitHub e vault e publicação da nota histórica.
2. Proposta de agentes fixos por regiões, com ADM e Editor, gatilhos e atualização coordenada.
3. Direção aceita: aprovação simples por conjunto, Wiki primeiro e PC depois; pausa só na publicação;
sem necessidade inicial de edição local concorrente; consultar fonte comercial antes de perguntar.
4. Tese do Pablo: cada agente usa o conhecimento das notas sob sua perspectiva e registra evolução;
ADM tem histórico próprio e avalia toda entrega. Essa tese permanece em desenvolvimento.
5. Pesquisa e leitura contextual das camadas de Engenharia, IA e skills: 73 notas, sem afirmar leitura
integral de todo o vault naquela etapa. Relatórios locais e manifesto de cobertura preservados.
6. Claude preparou leitura declarada de 482 notas, mapa de oito regiões, 11 contratos e delegação ADM;
sessão foi interrompida. Retomada encontrou esses artefatos, sem entregas de especialistas naquela pasta.
A cobertura é registro dos leitores, não prova automática de compreensão de todo o acervo.
7. Codex preparou exp-2: templates, coordenador local, integridade, recuperação e skill de projeto.
Doze testes locais passaram. Isso verifica infraestrutura, não qualidade de descoberta.
8. Execução exp2-20261031-01: passagem assistida pelo mesmo executor, seis propostas e dois recortes
CRM bloqueados. Não era um teste de especialistas independentes; propostas não foram aplicadas.
9. Execução exp2-20261031-02: três especialistas em sessões separadas e Editor separado; seis perguntas
respondidas, revisão textual e ensaio de três substituições/acréscimo numa cópia de communication_templates.
Vault ficou intacto. Fontes eram compartilhadas; não demonstrou independência estatística ou diversidade de modelos.
10. Limites registrados: não houve ranking de comunicações, prova de produção SFMC, benefício comercial
ou aprendizado persistente. ADM antecipou achado sem confirmar baseline e recebeu U=2 do Editor;
o registro e a qualificação posterior da cronologia foram preservados.
11. Pablo criticou foco excessivo em auditoria. Diagnóstico aceito: missão estreita, exploração subordinada,
r2 restrita e avaliação sem contribuição de negócio separada. Preparada proposta exp-3 investigativa,
ainda não executada. Foco confirmado: melhorar jornadas e comunicações de aquisição CRM.
12. Direção macro desta atualização: agentes como motor generativo do Loop, ativado por skill, com Fila e
Wiki prioritárias, backlog de reformas das telas e reuso entre ativações como capacidade ainda a testar.

## Artefatos e limites de implementação

Arquivos locais, fora da projeção Wiki:
- outputs/gaas-agentes-wiki-20261031/ARQUITETURA_E_PROMPTS_PARA_REVISAO_EXTERNA.md: contratos e missão usados.
- outputs/gaas-agentes-wiki-20261031/REVISAO_INVESTIGATIVA_EXP3.md: diagnóstico e prompt investigativo.
- outputs/gaas-agentes-wiki-20261031/experimento-20261031/runs/: entregas e testes exp-2.
- outputs/gaas-loop-macro-20261031/: tarefas, publicação e verificação desta consolidação.

A existência desses artefatos não significa motor de atualização, nova central A/B, nova tela Registros,
migração de Apostas, Outcomes redesenhado ou novo Report Live implementados. Os detalhes dessas reformas
ficam para planejamento posterior, como solicitado. O backlog é o mecanismo para não perdê-los.

## Relações

[[Loop-de-Aprendizado-Growth]] · [[Experimento-Agentes-Wiki-2026-10-31]] · [[Operacao-Fila-Notificacoes-Notas-de-Resultado]]
· [[MOC-Inteligencia-IA]] · [[Evolucao-Cronologica-GaaS-2026-10]]


## SDD GaaS: linguagem e objetivo do menu

A área de desenvolvimento dentro de Testes e Tarefas passa a se chamar **SDD GaaS**. O objetivo é priorizar melhorias, transformar análises em especificações claras e acompanhar a evolução do GaaS. Temas recebem títulos diretos; prioridades são apresentadas como Começar por aqui, Na sequência e Mais adiante. Identificadores técnicos permanecem internos, sem alterar dependências, critérios ou histórico.
