# Revisão de evidências — investigação CRM

Data: 28/10/2026. Fonte consultada ao vivo: Supabase GaaS Framework Afinz, projeto `mipiwxadnpwtcgfcedym`. Snapshot principal lido em `2026-10-28T15:31:15.397887Z` (12:31:15 em São Paulo). Código inspecionado: `8c2abb1`.

## O que foi entregue

- Dois trabalhos de decisão, contrato de evidências, inventário de reuso e gates em [CRM_INVESTIGATION_CONTRACT_V1.md](CRM_INVESTIGATION_CONTRACT_V1.md).
- Perfil read-only de março a setembro nos dois escopos aceitos; contagens, cobertura por campo, template e grão. Um único statement compõe o snapshot do perfil.
- Reconciliação local de duas políticas de agregação, mantida separada do perfil principal.
- Dados quantitativos detalhados e referências dos runs existentes preservados em arquivos privados locais entregues no chat; não são fixtures de CI nem entram no bundle estático.

## Constatações que mudam a implementação

### 1. Identidade de execução precisa vir antes da recomendação

Em Proprietaria / Aprovados_nao_convertidos, há grupos de linhas com a mesma combinação de Activity Name, timestamp de disparo, BU e canal. Nos grupos repetidos de setembro, as dimensões selecionadas variam e a tupla de métricas selecionadas é igual dentro do grupo.

Isso demonstra ambiguidade de grão; não demonstra quais linhas são erradas, não autoriza remoção e não permite escolher automaticamente uma linha do grupo. Precisamos saber se são alocações aditivas ou repetição da mesma medida entre classificações. A chave candidata é justamente a usada pelo frontend para sinalizar grupos repetidos; não é necessariamente a identidade de negócio definitiva.

O observador soma todas as linhas do escopo em `growth_trigger_observation_inputs`. `results.logic.ts::duplicateIds` exclui todos os registros de um grupo repetido na população carregada. A consulta local confirma que as políticas podem divergir materialmente. A simulação local não é uma certificação do número exibido na UI: a UI pode carregar outros escopos que também colidam com a chave.

**Gate:** não promover a alta histórica de Proprietaria a recomendação de repetir antes de conciliar grão/população com a origem. Não invalidar ou reescrever silenciosamente o run congelado; exibir como observação sob a política original, com limite descoberto nesta revisão.

### 2. Comparação de CAC tem elegibilidade diferente da comparação de cartões

O run de setembro dispõe de referência T1 para os dois escopos. A referência T2 de Proprietaria está em `insufficient_sample`: os meses históricos presentes não atingem o mínimo de cartões previsto na regra. A ausência de março foi excluída como `no_activity`, não preenchida com zero.

**Gate:** um único badge de qualidade não pode liberar todas as métricas. A falta de referência de CAC não impede inspecionar os registros; impede classificar melhora/piora contra baseline válida. O grão ambíguo é um bloqueio adicional independente.

### 3. Cliques e conteúdo não sustentam o diagnóstico imaginado na pesquisa

Setembro não tem cliques preenchidos nas linhas dos dois escopos. Plurix/Negados não tem template_id nas execuções desse mês; Proprietaria tem cobertura de vínculo apenas parcial, embora os IDs preenchidos encontrem cadastro.

**Gate:** investigação inicial não deve explicar resultado por clique, copy ou template sem registro correspondente. Encontrar template no catálogo não prova a versão histórica utilizada. Pode-se abrir uma pendência de vínculo, não autovincular por nome ou slot atual.

### 4. Histórico existe, mas equivalência de público e oferta não está certificada

O perfil tem janela histórica suficiente para inspecionar meses disponíveis, com variação de volume, jornadas e canais. Somar Base Acionável não mede pessoas únicas; métricas de etapas preenchidas não provam coorte individual. Não se deve anunciar os seis meses como públicos/ofertas rigorosamente equivalentes só porque passaram na regra numérica.

**Gate:** referência de mediana é descritiva e versionada. Comparabilidade de negócio precisa de registro próprio, incluindo mudanças de mix e maturação.

### 5. Último disparo não comprova carga completa

O T5 atual de CRM usa a maior Data de Disparo de registros com status realizado/enviado. Isso mede recência de evento registrado, não conclusão da carga, completude das métricas ou atualização individual dos dois escopos. Os runs congelados do piloto foram lidos em torno de 00:41/00:42 de São Paulo; a consulta desta revisão é posterior e não deve receber a mesma data de leitura.

**Gate:** manter separadas data de evento, leitura, ingestão e maturação. Não converter `updated_at` em certificado de completude de um período.

## Matriz de disponibilidade inicial

| Evidência | Plurix / Negados | Proprietaria / ANC | Uso permitido |
|---|---|---|---|
| Histórico registrado e regra T1 | Disponível | Disponível, com grão ambíguo no alvo | Inspeção da observação e da referência; sem causalidade |
| Identidade candidata de setembro | Sem repetição dentro do recorte verificado | Repetições com dimensões diferentes | Priorizar conciliação da origem; sem deduplicação automática |
| Custo/cartão e referência T2 | Calculável sob política registrada | Sem referência T2 elegível e com ambiguidade de grão | Não comparar CAC onde bloqueado |
| Propostas e aprovados | Campos preenchidos no alvo | Campos preenchidos no alvo | Inspecionar etapas; validar população/grão antes de taxa |
| Cliques | Não preenchidos no alvo | Não preenchidos no alvo | Registrar indisponibilidade, não tratar como zero |
| Conteúdo por execução | Sem vínculo no alvo | Cobertura parcial | Mostrar vínculos explícitos, sem atribuir efeito da peça |
| População integral da origem | Não certificada | Não certificada | Limitar afirmações às linhas disponíveis |
| Conhecimento disponível na data histórica | Não reconstruído | Não reconstruído | Não classificar como backtest sem vazamento temporal |

## Sequência recomendada

1. Investigar a origem dos grupos repetidos e documentar a política canônica por métrica; preservar IDs e campos até confirmação.
2. Conciliar a população de Resultados e do observador com uma tabela de linhas incluídas/excluídas e motivos.
3. Implementar leitura e painel contextual sem IA para Plurix, permitindo abrir o caso bloqueado de Proprietaria com a pendência de grão visível.
4. Registrar conclusão/pendência antes de exigir aposta; reaproveitar aposta/outcome/memória após decisão válida.
5. Só então avaliar IA sob demanda e produção de candidatas em cortes separados.

## Consultas e limites

- [Perfil principal](investigation/pilot-evidence-read.sql): mesmas condições de escopo do piloto, timezone local, sete meses, métricas somadas identificadas como row_sum.
- [Reconciliação de políticas](investigation/grain-reconciliation-read.sql): simulação local, não consulta de um total corporativo correto nem teste da UI autenticada.
- Ausência de valores negativos e de inversões de contagem nas checagens de setembro não prova qualidade integral do dataset.
- O custo pode conter resíduos de precisão da origem; arredondar só na apresentação, sem alterar campos armazenados.
- Não foram alterados registros, candidatas, apostas, regras, cron ou funções. Na leitura, observação permanecia habilitada; estado operacional preservado no pacote privado.

## Conclusão de planejamento

Etapas 1 e 2 prontas para revisão. Há informação suficiente para desenhar uma investigação útil de Plurix e um fluxo explícito de pendência para Proprietaria. Ainda não há base para automatizar recomendação de repetir a operação ambígua ou diagnosticar efeito de conteúdo ausente.
