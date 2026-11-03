# Report Live V2 — loop de aprendizado e memória

Data: 09/09/2026
Status: antecedente conceitual preservado; a direção vigente foi consolidada em [[Loop-de-Aprendizado-Growth]]. Não é spec executável.

> [!important] Atualização de 22/09/2026
> O novo planejamento preserva contexto, evidência, escopo, vigência e histórico, mas altera a promoção de memória: textos livres da IA continuam candidatos; outcomes estruturados e resolvidos materializam memória automaticamente. A especificação vigente está em [[Loop-de-Aprendizado-Growth]].

## Intenção de produto

O maior valor da V2 deve estar no backstage: transformar contexto de negócio, evidências e revisões em conhecimento reutilizável dentro e fora do Report Live. Evitar recomeçar cada análise do zero, sem transformar interpretações da IA em fatos automaticamente.

Loop proposto: **contexto vigente → evidências → interpretação → revisão → aprendizado registrado → reutilização**.

O relatório é um consumidor desse conhecimento. A mesma base poderá apoiar investigação de campanhas, planejamento, briefings e outras análises no GaaS. Não é necessário construir todos esses consumidores na primeira entrega.

## Três camadas com responsabilidades claras

1. **Contexto operacional:** definições e decisões documentadas no vault, com origem e vigência. Explica o que pode ser medido, comparado e interpretado em cada frente.
2. **Evidências históricas:** valores, cobertura, qualidade e referências à versão de dados usada na análise. A versão do relatório no GaaS/Supabase é a referência; Sheets, Slides, PDF e PPTX são representações.
3. **Memória revisada:** decisões, limitações e aprendizados com escopo e evidência. Textos gerados pela IA entram como candidatos, sujeitos a revisão antes da reutilização como conhecimento validado.

Evitar duas fontes editáveis concorrentes para a mesma regra. O vault pode continuar como fonte editorial de contexto; o sistema deve registrar qual versão foi usada, sem exigir sincronização bidirecional na primeira fase.

## Contexto encapsulado por frente

Preparar um pacote pequeno, identificável e versionado por frente, contendo:

- Frente, BU, canais, segmentos e campanhas ou regras de associação.
- Objetivo de negócio e etapa de funil.
- Métricas permitidas, fórmulas e definições de custo, CAC e CPA.
- Fontes e limites de cobertura e atribuição.
- Quebras de medição, exceções e condições que impedem comparações.
- Vigência e condições de aplicabilidade.
- Referências às notas de origem e versão do contexto.

Separar estratégia planejada de operação observada. A existência de uma campanha no planejamento não comprova sua execução. Valores ausentes não viram zero. CPA de plataforma não se torna CAC de CRM. Uma mudança de evento pode impedir comparação entre períodos.

O pacote é uma seleção governada do vault, não uma cópia integral em cada chamada de IA. A seleção inicial pode usar filtros explícitos por frente, canal, segmento e período.

## Memória mínima

Começar com quatro tipos:

| Tipo | Exemplo de uso |
|---|---|
| Decisão | Registrar uma definição de métrica e a partir de quando ela vale. |
| Limitação de medição | Impedir comparação entre eventos incompatíveis. |
| Aprendizado revisado | Preservar uma observação sustentada em campanhas comparáveis, com seus limites. |
| Pergunta aberta | Guardar uma hipótese e a evidência ainda necessária para avaliá-la. |

Cada registro precisa permitir responder: o que afirma, a que contexto se aplica, em quais evidências se apoia, quem revisou, quando vale e se foi substituído. Campos candidatos: tipo, texto, escopo, referências de evidência, versão do contexto, período observado, estado de revisão, autor/revisor e relação de substituição.

Não definir tabelas novas antes de inspecionar as estruturas existentes, incluindo `campaign_context`, `report_memory` e registros de insights/runs. Esses nomes são pontos de investigação, não uma confirmação de adequação ao desenho.

## Revisão e reutilização

Uma execução consulta o contexto e as memórias aplicáveis, analisa evidências e pode propor novos registros. A revisão aceita, corrige ou rejeita candidatos. Registros superados permanecem no histórico, mas deixam de orientar análises atuais fora de sua vigência.

**A revisão da memória não bloqueia a atualização automática do relatório.** São fluxos distintos. Uma hipótese pode aparecer como hipótese no relatório sem ser promovida a aprendizado validado.

Repetição de uma afirmação em vários relatórios não é evidência independente. Uma conclusão não pode se validar por citar outra narrativa gerada a partir dos mesmos dados. Conflitos entre memórias devem ficar explícitos e exigir resolução, sem prevalência silenciosa da mais recente.

Exemplo ilustrativo: uma alteração no evento de aquisição limita a comparação entre períodos. O contexto registra a quebra e sua vigência; o relatório aplica a restrição; uma investigação futura recupera a mesma limitação com sua fonte. Isso reaproveita conhecimento sem reaprender a regra a cada análise.

## Evolução incremental sugerida

1. **Contexto reutilizável:** pacote por frente, referências e versão usada em cada análise.
2. **Memória revisável:** candidatos, revisão simples e histórico de substituição.
3. **Reutilização entre períodos:** recuperação por aplicabilidade e registro das memórias usadas; validar também um consumidor fora do Report Live.

Piloto sugerido, ainda não escopo fechado: aquisição B2C e seguros, por terem objetivos e restrições diferentes. Expandir somente após demonstrar utilidade.

Critérios para uma futura spec: reproduzir o contexto de uma análise passada; impedir uso de memória fora do escopo/vigência; preservar evidência e revisão; não promover hipótese automaticamente; refletir correções sem apagar o histórico; reutilizar contexto em outro fluxo sem duplicar regras.

## Fora do escopo imediato

- Banco vetorial, múltiplos agentes e infraestrutura genérica de memória sem necessidade demonstrada.
- Aprendizado autônomo de regras ou alterações automáticas de campanhas.
- Metadados extensos de storytelling por slide.
- Refinamento editorial slide a slide.

A recuperação do Report Live, a semântica de custo/CAC, a certificação e a coerência entre versão salva e destinos continuam como trabalho anterior à expansão. A memória não corrige dados ou contratos defeituosos por interpretação.

## Relação com a próxima implementação

Pablo pediu para guardar esta direção para o futuro e voltar ao próximo prompt `.md` para a IA codar. Esta nota **não amplia automaticamente o escopo da próxima entrega**.

A spec modular existente precisa ser reconciliada com as discussões posteriores: separar recuperação/confiabilidade da evolução do produto e desta V2 de memória. O próximo prompt deve declarar entregáveis concretos, exclusões, testes, evidências de conclusão e limites de deploy, sem carregar todas as ideias futuras como obrigações imediatas.

Referências:

- [[Report-Live-Versionamento-e-Publicacao]]
- [[Ficha-Tecnica-Growth-e-Auditoria-Report-Live-2026-09]]
- [Spec modular existente](../../calendar-estrategico/docs/plans/SPEC_REPORT_LIVE_MODULAR_AUTOMATICO_V1.md)
- [Prompt existente para implementação](../../calendar-estrategico/docs/plans/PROMPT_IMPLEMENTAR_REPORT_LIVE_MODULAR.md)

## Prompt preservado para retomar a V2

> Planeje a V2 do Report Live como um loop de aprendizado e memória reutilizável dentro e fora do relatório. Leia a spec existente, esta nota, a ficha técnica de growth e os contratos relevantes do código e dos dados. Separe o que já existe, o que precisa de correção e o que é evolução futura. Proponha uma arquitetura incremental baseada em contexto versionado por frente, evidências rastreáveis e memórias revisadas. Inspecione as estruturas existentes antes de criar novas. Defina o modelo mínimo de contexto e memória, seleção por escopo e vigência, revisão, conflitos, substituição e rastreabilidade. Preserve a publicação automática com avisos de indisponibilidade; a revisão de memória deve ser independente. Apresente mudanças necessárias na spec, fases, exemplos concretos e critérios de aceite. Evite banco vetorial, múltiplos agentes e aprendizagem autônoma sem justificar uma necessidade real. Não implemente nesta etapa de planejamento.
