---
name: gaas-estrategias-implementaveis
description: Criar ou revisar notas de estratégia do GaaS com regras à vista em texto enxuto, fluxos detalhados e fichas recolhíveis com 100% do necessário para implementação, usando a página Visa como modelo. Usar para estruturar estratégia, documentação operacional e mockups dessas notas; complementar a skill geral de produto, sem substituir copy de campanha ou análise de resultados.
---

# Estratégias implementáveis no GaaS

## Resultado esperado

A nota deve permitir ao time entender a estratégia, discutir suas decisões e preparar sua implementação sem depender de uma explicação oral do autor. A página **Estratégia Pool de Ofertas Visa** é o modelo de referência de narrativa, profundidade, gráficos e apresentação. Usar somente a aparência do leitor não atende ao pedido.

Esta skill registra a orientação de Pablo de 06/11/2026: conteúdo próximo de uma enciclopédia, sem slogans ou frases clichês, com o máximo de detalhe relevante e aprofundamento por minimizações. Em 13/11/2026 Pablo ajustou: a nota não pode ser massante. A camada visível é enxuta e direta; a camada recolhível guarda 100% dos dados úteis para implementação e das regras. Modularidade significa separar módulos conectados por identidades e dependências; não reduzir o projeto a cartões genéricos.

## Referências e fontes

1. Leia a nota Visa e os documentos do projeto tratado. A nota canônica fica em `Afinz-CRM-Midia-Vault/05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md` e a cópia viva em `gaas_vault_notes` no Supabase (mesmo `relative_path`). O repositório é público e não guarda notas. Não editar a cópia do Supabase para corrigir a fonte.
2. Leia [references/modelo-visa.md](references/modelo-visa.md) para transferir o padrão para outra estratégia.
3. Para Seguros, leia [references/seguros-e-compatibilidade.md](references/seguros-e-compatibilidade.md). Ela localiza fontes e conflitos; não substitui a verificação das versões atuais.
4. As notas de DEs, automações e atividades são referências operacionais. Contratos conflitantes exigem explicitação da divergência; não resolver por omissão nem pelo documento mais antigo.

## Narrativa

Começar com definição concreta: o que a estratégia organiza, qual público/produto, qual resultado pretende avaliar e como funciona. Depois explicar escopo, regras e percurso; aprofundar em arquitetura, contratos, implementação e validação.

Usar parágrafos conectados, termos definidos antes do uso, títulos descritivos e tabelas para comparação. Explicar por que cada regra existe e o efeito de falhar nela. Densidade de conteúdo e clareza visual devem coexistir.

Evitar frases como “Duas entradas. Um percurso.”, “Da fonte à jornada.”, “Conectando oportunidades.”, “Inteligência que transforma.” e substituições equivalentes de conteúdo por slogan. Exemplo de título adequado: “Fluxo técnico da automação processos_seguros”. Remover a frase vazia, não apenas reformulá-la.

### Camada visível enxuta, camada recolhível completa

- **À vista:** definição, estado, regras e exceções, público e critérios, ciclo, orquestração, frentes de liberação, medição e pendências. Frases curtas, tabelas para comparar, sem repetir a mesma regra em várias seções.
- **Em `:::details`:** fluxo completo com contratos, mapa técnico, fichas de DE campo a campo, passo a passo de atividades, configuração, SQL, configuração de jornada, validação, critérios de aceite e monitoramento. Nada disso é cortado; só fica recolhido.
- **Uma nota só.** Não mover detalhe técnico para nota anexa criada para esvaziar a estratégia.
- **Sem texto padrão repetido.** Fichas com as mesmas linhas em todos os itens viram uma tabela de regras comuns mais a tabela do que é próprio de cada item.
- **Sem duplicar outra nota.** Conteúdo que já existe completo em outra nota (por exemplo SQL e inventário em `04-Operacao/`) vira link com uma linha do que está lá, só depois de conferir por script que o conteúdo é idêntico.
- **Conferência antes de entregar uma versão enxuta:** comparar por script a nota anterior com a nova (identificadores em código, linhas de tabela, wikilinks e números). Todo item ausente precisa estar reescrito com o mesmo conteúdo, consolidado numa tabela de regras comuns ou presente na nota linkada. Guardar a versão anterior como backup em `outputs/`.

## Módulos articulados

Adapte a ordem ao projeto, preservando os módulos aplicáveis:

- Definição, intenção, escopo e estado da operação.
- Percurso completo da base à medição, com regras, exceções e retornos.
- Público, elegibilidade, exclusões, alocação e prioridades.
- Experiência, comunicação e cadência, quando existirem.
- Automações: ordem, responsabilidades, fontes, destinos e dependências.
- Fichas das entidades/DEs: grão, chave, campos, tipos, nulidade, atualização e retenção.
- Fichas de atividades/queries: configuração, ação de gravação, SQL íntegro disponível e conferências.
- Critérios de aceite, casos de teste, medição e condições de liberação.
- Decisões abertas, responsáveis a definir, referências e data da evidência.
- Atividades reais vinculadas ao projeto, sem copiar as atividades de outro exemplo.

O nome técnico de um nó do diagrama deve localizar sua ficha. A ficha deve apontar para entradas, saídas, dependências e validação. Links e IDs fazem os módulos se articularem.

## Gramática dos fluxos

Seguir os fluxos da Visa: agrupamentos identificam automações/fases; nós identificam atividades ou entidades; decisões explicitam condições e ramos; setas indicam sequência, dependência e retorno. Incluir grão e destino quando mudarem a compreensão.

No mapa técnico, usar nomes reais de automações, passos e atividades quando documentados, seus tipos, ações e estados. Uma cadeia de verbos genéricos como “validar → selecionar → executar” não substitui esse mapa. Se o nome ou a configuração não existe, marcar “a definir” ou “proposta de nome”; não fabricar implantação.

Separar fluxo de negócio de pipeline técnico, mantendo os vínculos entre ambos. Preservar toda a lógica relevante: condições de entrada/saída, caminhos sem envio, descarte, precedência, dependências sequenciais, falhas, retornos e medição. Nunca achatar um fluxo só para caber numa imagem.

Preferir o renderer de diagramas já usado pela Visa (Mermaid/controles do GaaS) para manter o mapa ampliável e a fonte editável. Usar base clara, tipografia legível, nós e agrupamentos de cantos retos, bordas finas slate e teal discreto nos controles. Não usar uma coleção de cartões ilustrativos como substituto do fluxo. Um mapa grande pode ter rolagem e ampliação; preservar também a navegação responsiva.

## Fichas implementáveis

Para DE: nome, finalidade, origem, destino, grão, PK, sendability e relação de envio, tipos/tamanhos, obrigatório/nulo, definição do campo, regra de transformação, ação de carga e retenção. Ausências ficam marcadas como definição pendente.

Para atividade: nome, tipo, automação/passo, estado e evidência, finalidade, fontes, destino, ação de gravação, chave, dependências, parâmetros, regra, SQL completo disponível, primeira execução, reexecução/idempotência, testes, resultado esperado e limitações. SQL proposto não recebe selo de homologado.

Não inventar campos, tipos, nomes, BU/MID, schedules, SQL ou valores para completar um mockup. Separar contrato documentado, execução comprovada, proposta, inferência e lacuna. Número histórico leva data/fonte; não vira parâmetro vigente automaticamente.

## Edição e apresentação

Índice lateral por tópicos; no celular, índice expansível. Minimizações escondem profundidade, não removem conteúdo. Setas e lápis são ações separadas. Edição, inclusão, exclusão, ordenação, restauração e histórico devem respeitar os contratos existentes e suas permissões. Remover da nota não equivale a apagar um registro de tarefa.

**Como o app monta a página** (`src/components/vault/strategy/strategyModel.ts`): cada `## ` vira um bloco; o resumo do topo são os 2 primeiros parágrafos antes do primeiro `##` (3 na nota de Seguros), então eles precisam se sustentar sozinhos. Visa e Seguros recebem automaticamente o bloco de Atividades pelo `relative_path`, que não pode mudar. `:::details Título` vira bloco recolhível editável; não colocar `###` repetindo o título logo depois.

O botão de adicionar usa tratamento neutro, sem verde chamativo. Manter a identidade do GaaS, a leitura contínua e a posição da nota ao navegar no índice. Referências externas e detalhes técnicos devem permanecer consultáveis.

## Entrega e aprovação

Quando criar ou alterar a estrutura narrativa/visual dessas páginas, apresentar primeiro um mockup com texto e detalhes técnicos representativos. A validação precisa cobrir **narrativa, profundidade, diagramas e interação**, não apenas cores. Distinguir visual ilustrativo de conteúdo disponível, sem tratar o mockup como especificação técnica homologada.

Na etapa de mockup, criar apenas materiais locais de revisão e a skill solicitada. Não alterar a página viva, dados, permissões, main ou deploy. A aprovação anterior de outra direção não autoriza a nova proposta. Após a validação do usuário, implementar somente o escopo aprovado, comparar com a referência e seguir os checks/deploy autorizados do projeto.

## Publicação na Wiki e versão de trabalho

Editar o arquivo do vault não muda a página. A Wiki só muda depois do sync, e o sync só acontece com "pode sincronizar" (ou autorização equivalente) explícito do Pablo; publicar só as notas do escopo, nunca as outras que estiverem diferentes no `vault_lint`.

O app pode guardar uma **versão de trabalho** própria da estratégia em `gaas_wiki_pilot_documents` (histórico em `gaas_wiki_pilot_revisions`), criada quando alguém edita, reordena ou mexe nas atividades pela página. Quando ela existe, a página mostra essa versão, não a fonte: depois do sync aparece o aviso "A fonte do vault mudou", a edição fica travada e "Reconhecer fonte e preservar edição" **mantém a versão de trabalho**, sem adotar o texto novo. Antes de publicar, consultar se existe linha para a nota (`select d.revision, d.source_hash, n.content_hash from gaas_wiki_pilot_documents d join gaas_vault_notes n on n.id=d.note_id where n.relative_path = '...'`). Sem linha, a página é montada direto da fonte e o sync basta. Com linha, avisar o Pablo antes de sincronizar e combinar como a nova fonte entra na versão de trabalho.

Depois de editar a nota: preservar o fim de linha da nota (LF ou CRLF), rodar `python scripts/bundle_vault.py` e `python scripts/vault_lint.py`, sincronizar quando autorizado e conferir a página publicada.

Ao concluir a revisão, perguntar: “Outro profissional consegue montar e conferir a operação com o documento e suas referências? Se não, quais definições e evidências ainda faltam?” Uma lacuna explícita com seu efeito é mais útil que uma falsa especificação completa.
