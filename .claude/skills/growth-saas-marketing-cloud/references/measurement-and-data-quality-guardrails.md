# Measurement and Data Quality Guardrails

## 1. Regra principal

Nenhuma recomendacao de growth deve esconder limite de dado.

Classificar evidencias como:

- confirmado: fonte completa, atual e metricas coerentes.
- direcional: util para leitura, mas com alguma limitacao.
- suspeito: divergencia, lacuna ou padrao inesperado.
- bloqueado: nao usar para conclusao/acao ate corrigir.

## 2. Dias fechados

Para relatorios e diagnosticos diarios, usar apenas dias fechados.

Nao comparar dia corrente parcial com historico fechado.

Se a fonte principal estiver atrasada ou incompleta, declarar antes de qualquer conclusao.

## 3. CRM aquisicao

Fonte central: `activities`.

Metricas aplicaveis:

- base
- entrega
- abertura
- clique
- propostas
- aprovados
- cartoes
- conversao
- custo
- CAC

Interpretar CAC somente quando houver resultado de cartao e custo coerente.

Conversao zero e resultado valido, nao dado ausente.

## 4. CRM rentabilizacao

Fonte central: `rentabilizacao_activities`.

Limitar leitura a:

- execucao
- entrega
- abertura
- clique

Nao inferir proposta, aprovacao, cartao, receita, CAC ou rentabilidade a partir de clique.

Excecao: Opt-in Copa Visa pode ser conversao promocional especifica da campanha, sem virar CAC/cartao.

## 5. Midia paga

Fonte central: `paid_media_metrics`.

Metricas de plataforma:

- CTR
- CPC
- CPM
- frequencia
- CPA de plataforma
- spend

CPA de plataforma nao e CAC de cartao.

Spend-to-card e correlacional se nao houver atribuicao individual fechada.

## 6. AppsFlyer

AppsFlyer ajuda a auditar origem, canal, campanha, publico, template e eventos.

Separar:

- clique
- install/abertura
- account_created
- proposal_submitted
- account_approved
- cartao emitido

`account_created` pode ser conversao operacional; `account_approved`/cartao e conversao de negocio.

## 7. Checks de qualidade

Antes de analisar ou recomendar:

- data maxima por fonte
- dias esperados vs presentes
- duplicidades por chave operacional
- nulos em dimensoes canonicas
- mudanca brusca no volume de linhas
- campanhas nao mapeadas
- spend sem conversao
- conversao com denominador ausente
- taxas acima de 100%

## 8. Baselines e comparacoes

Comparar apenas unidades compativeis:

- mesmo objetivo
- mesma etapa de funil
- mesmo canal ou canais comparaveis
- mesmo tipo de publico
- safra/janela coerente

Preferir:

- ultimo dia fechado vs media dos 7 anteriores
- ultimos 7 dias vs 7 anteriores
- mes acumulado vs meta/ritmo
- campanha/segmento vs historico proprio
- safra atual vs safras comparaveis

## 9. Copy de confianca

Usar linguagem explicita:

- `Alta confianca: fonte atualizada, baseline compativel e volume suficiente.`
- `Media confianca: fonte completa, mas baixa amostra.`
- `Baixa confianca: dado parcial ou comparacao direcional.`
- `Bloqueado: fonte principal atrasada; nao recomendar escala.`

## 10. Guardrails de recomendacao

Nao recomendar:

- escala com coleta incompleta
- corte de budget so por CPA se CAC/cartao nao estiver medido
- conclusao causal baseada em correlacao simples
- merge entre aquisicao e rentabilizacao sem aviso
- automacao de escrita sem governanca, RLS e rollback

Toda acao deve ter:

- motivo
- evidencia
- impacto esperado
- prazo ou janela
- dono quando aplicavel
- confianca
- criterio de sucesso

