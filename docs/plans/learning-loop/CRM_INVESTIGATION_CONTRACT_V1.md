# Investigação CRM — contrato de produto e evidências v1

Data: 28/10/2026. Base inspecionada: `8c2abb1` (PR 56). Estado: planejamento das etapas 1 e 2 concluído; interface e persistência de investigação ainda não implementadas.

## Objetivo e limites

Transformar uma pergunta de negócio em uma investigação verificável, aproveitando Resultados, Fila, Apostas, Outcomes e Memória. A investigação deve poder começar manualmente em Resultados, sem depender de um alerta.

Escopo inicial: CRM-92fbd40403 (Plurix / Negados / Plurix) e CRM-a695575900 (B2C / Aprovados_nao_convertidos / Proprietaria). Setembro/2026 é o período fechado inicial; março a agosto são a janela histórica disponível no piloto. Outubro é apenas um caso de mês aberto, sem previsão ou diagnóstico mensal de performance.

Esta entrega não altera dados, regras, migrations, funções ou interface, não chama LLM e não ativa candidatas. Resultados quantitativos privados ficam fora do Git. O perfil live é uma reconstrução do estado atual, não um backtest com o conhecimento disponível na data histórica.

## 1. Dois trabalhos prioritários

| Fluxo | Investigar mudança de resultado | Repetir ou ajustar execução CRM |
|---|---|---|
| Pessoa | Pablo como revisor inicial; papel de analista CRM/Growth | Operador CRM e revisor Growth |
| Cadência | Semanal e fechamento mensal | Planejamento semanal e revisão do ciclo fechado |
| Pergunta | A diferença merece investigação e qual verificação vem primeiro? | Existe evidência suficiente para propor repetição, ajuste ou teste? |
| Unidade | Operação × mês; drill-down por execução, jornada e canal | Execução identificada no período e conteúdo efetivamente associado |
| Métrica principal | Cartões registrados; custo por cartão somente quando elegível | Cartões e custo por cartão no contexto comparável; drivers conforme cobertura |
| Drivers | Registros de execução, volume acionado, propostas, aprovados e mix | Público, canal, oferta, posição, conteúdo e resultados comparáveis |
| Saída humana | Investigar, esperado, solicitar dado ou propor aposta | Propor repetição, ajuste, teste ou aguardar evidência |
| Limite | Diferença não é perda recuperável nem causa comprovada | Desempenho observado não prova efeito do template |

Repetição de campanha, publicação de conteúdo e orçamento continuam fora da execução deste módulo. Registrar uma aposta não dispara uma campanha.

## 2. Reaproveitamento e lacunas verificadas no código

| Responsabilidade | Componente/contrato existente | Reuso e lacuna |
|---|---|---|
| Histórico e filtros CRM | `results/resultsService.ts`, `results.types.ts`, `ResultsWorkspace.tsx` | Reaproveitar contexto; nova leitura deve ser filtrada no servidor e consistente. O paginador atual confere contagens, mas não garante snapshot transacional contra updates concorrentes. |
| Métricas e cortes | `results/crmAnalysis.ts`, `results.logic.ts`, `CrmComparisons.tsx` | Reaproveitar definições após reconciliação de grão. Não copiar somas ou política de exclusão sem conferir. |
| Evidências do sinal | `feed/GrowthFeedInspector.tsx`, `growthFeed.types.ts` | Reusar procedência e limites; hipótese não deve ser apresentada como causa confirmada. |
| Observação determinística | `growth_trigger_observation_runs` e `_shared/growth-trigger-runtime.ts` | Vincular run/hash; distinguir a leitura congelada da fonte consultada agora. |
| Decisão sobre candidata | `growth_signal_decisions` e `bets/growthBetService.ts` | Contrato atual é accepted/rejected/merged de candidata. Não usar para investigação manual sem candidata. |
| Aposta e snapshot | `growth_bets`, `growth_evidence_snapshots`, timeline | Reusar quando houver ação, baseline e janela válidas; nunca criar aposta só para guardar uma pergunta. |
| Retrospectiva | `growth_result_retrospectives`, `appendRetrospective` | Pode guardar conclusão mensal revisada. Não basta para representar todo o ciclo aberto de investigação. |
| Outcomes | `outcomes/growthOutcomeService.ts` e contratos de Release 4 | Reusar agenda/verificação depois de execução registrada; ausência de execução não é fracasso. |
| Memória e reuso | `memory/growthMemoryService.ts`, Release 6 | Recuperar aprendizado com validade e escopo; não duplicar biblioteca nem promover hipótese a aprendizado validado. |
| Comunicação | `results/WikiCommunications.tsx`, `wikiCommunications.logic.ts` | Reusar preview e vínculo explícito; vínculo de slot atual não prova peça histórica utilizada. |

Não criar um sistema paralelo com tabelas genéricas `evidence`, `decision`, `action` e `learning`. A necessidade comprovada é registrar investigação antes da candidata. Proposta mínima para a etapa 3: uma identidade de investigação e revisões append-only, referenciando evidências, retrospectivas e apostas existentes. O DDL só será definido após conferir permissões e invariantes desses contratos; não foi implantado nesta etapa.

## 3. Contrato do pacote de evidências

### Identidade e tempo

- `schema_version`, `investigation_id` (somente após persistir), `revision` e `contract_version`.
- `question_type`: `result_change` ou `execution_review`.
- `scope`: operation_id, BU, segmento, parceiro canônico e filtros explícitos de canal/jornada/execução.
- `period`: início inclusivo, fim exclusivo, timezone America/Sao_Paulo, `closed` ou `open`.
- `source_read_at`: instante real da leitura; `knowledge_mode`: `current_reconstruction` ou `as_known_then`.
- `source_snapshot_hash`, referências de origem e, se houver sinal, `observation_run_id` e input_hash.
- `data_cutoff`: separar último evento de negócio, última alteração de linha, última ingestão comprovada e janela de maturação. Desconhecido permanece null, com motivo.
- Mudança material nos dados cria revisão e marca a anterior desatualizada; não substitui decisão histórica silenciosamente.

### População, identidade de execução e qualidade

- Identidade física: `activities.id`. Identidade candidata de execução: activity_name + Data de Disparo completa + BU + Canal. Isso é um agrupamento de investigação, não uma chave aprovada de deduplicação.
- Registrar row_count, candidate_execution_key_count, grupos repetidos, dimensões e métricas variantes, status de execução e linhas excluídas por motivo.
- Grão: `verified`, `ambiguous` ou `not_assessed`, com evidência de validação. Nunca descartar linhas por similaridade sem contrato da origem.
- Distinguir integralidade de campos nas linhas presentes de integralidade da população esperada. Não declarar população completa sem manifesto/reconciliação da origem.
- A soma de Base Acionável mede exposições registradas, não pessoas únicas entre disparos.

### Métricas

Cada métrica contém nome, unidade, valor nullable, numerador/denominador quando aplicável, known_rows, total_rows, status, fonte e motivo de bloqueio.

- Status por evidência: `observed`, `partial`, `blocked`, `unavailable`; não existe confiança única que libere tudo.
- Cartões: soma registrada apenas para grão validado; quando ambíguo, mostrar row_sum técnico e bloquear total operacional/conclusão.
- Custo por cartão: soma de Custo Total Campanha / soma de Cartões Gerados, com ambas as populações completas e compatíveis e denominador positivo. Não é CAC corporativo de aquisição nem média de CAC de linhas.
- Propostas/aprovados: mesma população e janela; taxas exigem cobertura e denominador válido. Contagens não provam coorte individual ou maturação idêntica.
- Cliques/aberturas: falta de registro não vira zero. Sem denominador governado não produzir CTR comparável entre canais.
- Nenhuma taxa agregada deve ser média simples de taxas de linhas.

### Comparação

- Preservar a referência original da observação (mediana histórica e meses elegíveis/excluídos) como referência descritiva versionada.
- Separar elegibilidade numérica de comparabilidade de negócio: oferta, mix de público, safra, canais, maturação e calendário. O gatilho atual não certifica todos esses fatores.
- Diferença contra mediana não é intervalo de confiança, uplift, perda atribuída ou oportunidade recuperável.
- Para decomposição aditiva, usar dois períodos/populações explícitos, categorias mutuamente exclusivas e totais reconciliados. Não somar medianas por categoria para explicar uma mediana do total.
- Dimensões diferentes são visões alternativas, não parcelas somáveis entre si; template ou catálogo não pode multiplicar linhas de resultado em join.
- Comparação de mês aberto fica indisponível neste corte. Nenhuma projeção linear ou faixa esperada inventada.

### Conteúdo e memória

- Separar `template_id` registrado na execução, template encontrado, versão/hash do conteúdo e prova temporal do vínculo.
- Slot atual ou nome semelhante é sugestão contextual, não prova histórica. Sem vínculo confirmado, não concluir que uma peça explica a performance.
- Memória recuperada inclui origem, período, escopo, validade e razão de aplicabilidade. Memória curada não equivale a evidência experimental.

### Fatos, hipóteses e decisões

- Fato deve referenciar evidência existente e valores recalculáveis; evidência citada tem de sustentar a frase, não apenas existir.
- Hipótese é opcional; precisa de observação compatível, alternativas, próximo teste e condição que a enfraquece. Nenhuma quota fixa de hipóteses.
- Próxima verificação pode ser humana; indicar dado disponível versus coleta ainda necessária.
- Decisão proposta: `investigate`, `expected`, `request_data`, `propose_bet` ou `no_action`; autor, justificativa, revisão da evidência e data são obrigatórios ao persistir.
- `request_data` só registra pendência; não envia mensagens. `propose_bet` prepara o contrato existente para confirmação explícita.
- Sem informação suficiente, abstém-se da conclusão afetada e permite verificações independentes.

## 4. Experiência da etapa 3

Entrada principal: Resultados CRM → selecionar escopo/período → Investigar. Entrada secundária futura: Fila → abrir sinal → Investigar, somente após a ativação própria de candidatas.

1. Cabeçalho com pergunta, operação, período, referência e limites materiais.
2. O que sabemos: métricas elegíveis e cobertura; origem acessível.
3. O que mudou: cortes disponíveis e comparações aprovadas, preservando filtros.
4. O que falta verificar: lacunas acionáveis, com pedido/dono registrado se houver.
5. Decisão e próximos passos; histórico/revisões abaixo.

O monitor técnico de gatilhos passa a uma área recolhida de diagnóstico em uma implementação posterior. Estado de fila vazia deve explicar ausência de produção ativa; não afirmar ausência de problemas no negócio.

## 5. Critérios de aceite da primeira investigação

- Abrir manualmente sem candidata e sem criar aposta.
- Reproduzir a referência do run original, mas mostrar divergências de leitura atual e de política de grão.
- Plurix/Negados: permitir inspeção de setembro e comparação descritiva; impedir explicação por clique/template ausente.
- Proprietaria/ANC: mostrar ambiguidade do grão antes de qualquer recomendação de repetir; não renomear soma de linhas como total validado.
- Fonte atrasada só bloqueia as conclusões dependentes dela. Evento recente não certifica ingestão completa.
- Ausência, zero, custo sem cartões, mês aberto, revisão tardia, template sem versão histórica e mudança de mix têm comportamento explícito.
- Registro humano preserva autor, versão de evidências e justificativa; abrir tela não altera estado externo.
- Sessão do usuário e autorização devem valer para toda leitura e referência. Um link não amplia acesso; contextos futuros de IA seguem as mesmas permissões.
- Snapshot consistente, paginação e conciliação por grão são requisitos antes de persistir decisão quantitativa.
- LLM, cron adicional, novas candidatas, correções da origem e automação de campanha estão fora deste aceite.

## 6. Sequência de implementação e gates

1. **Reconciliação de grão e números:** investigar origem das linhas repetidas, comparar chaves/medidas/dimensões e conciliar regras do observador e de Resultados. Não há autorização para remover ou corrigir registros nesta etapa.
2. **Leitura de evidências:** contrato tipado + serviço read-only com snapshot/filtros/coverage e testes sintéticos dos casos de bloqueio e identidade.
3. **Investigação sem IA:** painel contextual + persistência mínima para decisões pré-candidata, aproveitando retrospectivas e apostas onde compatível.
4. **Piloto humano:** casos de queda, alta, estabilidade, ausência, mudança de público e correção tardia; medir se a investigação produziu verificação/decisão útil.
5. **IA sob demanda:** somente após evidências utilizáveis. Medir ganho contra versão sem IA, fidelidade de cada afirmação, abstenção e custo. Provedor/credenciais ficam para esse corte.
6. **Integração com candidatas:** etapa própria posterior; preservar o escopo e os gates da Release 8.

Não adotar novo broker, worker externo ou busca vetorial neste corte. A fila vigente já existe; mudanças de infraestrutura devem responder a requisito medido.

## 7. Questões em aberto com destino definido

| Questão | Como resolver | O que bloqueia |
|---|---|---|
| Linhas com mesmas métricas e dimensões distintas são aditivas? | Confrontar carga/auditoria e contrato da origem BI; revisão de Pablo apenas se a evidência técnica não resolver | Recomendação quantitativa de repetir Proprietaria/ANC |
| Por que Resultados e observador usam populações diferentes? | Reconciliação explícita das políticas de agrupamento/exclusão; mostrar waterfall de linhas, sem eleger um total por conveniência | Totais comuns à investigação |
| Qual janela de maturação de cartões e propostas? | Documentar com origem; atualizações tardias distinguem estado atual e conhecimento histórico | Comparação causal/ritmo de mês aberto |
| Que peça foi realmente utilizada? | Vínculo por execução e versão temporal; não inferir pelo slot atual | Recomendação por conteúdo |
| Como medir utilidade? | Decisão justificada, próxima verificação concreta e tempo para chegar nela; clique não é prova de valor | Ampliação do piloto e uso de IA |

## Evidência da etapa 2

Consulta read-only reproduzível: [investigation/pilot-evidence-read.sql](investigation/pilot-evidence-read.sql).
Diagnóstico, inventário de cobertura e próximos passos: [CRM_INVESTIGATION_EVIDENCE_REVIEW_2026-10-28.md](CRM_INVESTIGATION_EVIDENCE_REVIEW_2026-10-28.md).
