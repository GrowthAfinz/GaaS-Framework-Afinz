# SDD · Segmentação de seguros e régua rotativa (Seguro Celular, Bem-estar Mulher, Residencial 24h)

Data: 04/11/2026. Estado: proposta alinhada com o time de CRM, ainda não implementada no SFMC.
Iniciativa no GaaS: **Cross-sell de seguros** (Testes e Tarefas). Notas canônicas no vault:
`05-Estrategia/Segmentacao-Seguros-Celular.md`, `02-Entidades-Dados/SFMC/DE-MAPA_SEGUROS.md`,
`04-Operacao/Automacao-Processos-Seguros.md`.

Esta especificação descreve trabalho no Salesforce Marketing Cloud (DEs, queries e automation).
Não altera código do app. As queries ficam em `sql/` como referência versionada.

## Problema

Os três seguros ofertados por LP (Celular, Mulher, Residencial) disputam a mesma base de clientes
ativos, sem regra de quem recebe o quê, sem histórico de contato por seguro e sem medição de venda
por CPF. A `MAPA_SEGUROS` só diz o que o cliente tem hoje, e não tem Celular nem Mulher.

## Resultado esperado

1. Uma base por CPF com elegibilidade, grupo (engajado, boas-vindas, gatilho) e controle de 10%.
2. Um gatilho de 1 contato quando o cliente troca de modelo de aparelho (Seguro Celular).
3. Uma régua mensal rotativa: 30 dias por seguro + 15 de pausa, um seguro por vez por CPF.
4. Um log diário de entradas e saídas de cada seguro, para medir venda e cancelamento contra o controle.

## Decisões (04/11/2026)

| Tema | Decisão | Motivo |
|---|---|---|
| Modelo de comprador | Residencial 24h (8.830 na MAPA) | único seguro vendido pela oferta digital com posse medida; Dental, AP e Proteção Completa vêm do call; Você Bem é adesão automática |
| Engajado | compra no cartão + app nos últimos 30 dias | índice ~1,9× no Residencial; MCC por categoria não diferenciou |
| Boas-vindas | primeira conta com até 60 dias | permitido vender seguro logo após a emissão; o call já converte nessa janela |
| Gatilho Celular | aparelho novo com modelo diferente do anterior do mesmo CPF | MCC não isola compra de celular (4812 misturado; marketplaces em "fora do MVP"); "aparelho novo" sozinho pega reinstalação (43% na amostra) |
| Limite | não usado | o seguro não é cobrado na fatura |
| Plano | a pessoa escolhe na LP | a DEVICE escolhe quem recebe o Celular e mede plano escolhido × faixa do aparelho |
| Controle | `ABS(CHECKSUM(CPF + 'SEG_CEL_CONTROLE') % 100) >= 90` | semente própria, diferente do Vai de Visa |
| Contato | 2 e-mails + 1 SMS por seguro; WhatsApp só em boas-vindas, gatilho e quem clicou | WhatsApp é ~85% do custo |

## Régua rotativa

| Perfil | 1ª etapa | 2ª | 3ª |
|---|---|---|---|
| Mulher com aparelho apto | Celular | Mulher | Residencial |
| Homem com aparelho apto | Celular | Residencial | — |
| Mulher sem aparelho apto | Mulher | Residencial | — |
| Homem sem aparelho apto | Residencial | — | — |

- Aderiu ou já tem → pula a etapa. `ENT.sem_interesse`, atraso ou controle → fora de todas.
- O gatilho tem prioridade e conta como a etapa Celular.
- A confirmar com o time de CRM: mulheres sem aparelho apto começam pelo Mulher ou pelo Residencial.

DE proposta `SEG_REGUA_CONTROLE` (PK `CPF`): `PRODUTO_ATUAL`, `DT_ENTRADA`, `DT_SAIDA_PREVISTA`,
`PRODUTOS_JA_RECEBIDOS`, `MOTIVO_SAIDA`, `DS_GRUPO`. Query a escrever depois do alinhamento da ordem.

## Aparelhos aptos ao Seguro Celular

Smartphone; usado nos últimos 90 dias; Android 13+ ou iOS 17+; valor estimado acima de ~R$ 600.
Faixas por marca e código de modelo em `sql/Q_SEG_DEVICE_PLANO.sql`. Amostra de 100 (08/2025):
Essencial 41, Plus 9, Premium 16, fora 33, a mapear 1.

## Automation `processos_seguros`

Passos 1–5 existentes (LP → Athena e import da MAPA). Propostos: 6 verificação de contagem
(< 600 mil para a automação), 7 `Q_SEG_06_MOVIMENTO`, 8 `Q_SEG_07_SNAPSHOT`, 9 `Q_SEG_08_BASE_CPF`,
10 régua (`SEG_REGUA_CONTROLE`). Cada um em passo próprio. Primeira ativação: rodar o snapshot
sozinho antes de ligar o diff.

## Tarefas (Fila do GaaS)

| Chave | Tarefa |
|---|---|
| `SEG-MAPA-MULHER` | Celular e Mulher na MAPA_SEGUROS |
| `SEG-AUTO-MOVIMENTO` | verificação, log de movimentos e snapshot |
| `SEG-BASE-CPF` | base por CPF com grupos e controle |
| `SEG-REGUA-ROTATIVA` | DE de-para e passo de régua; gatilho de troca de aparelho |
| `SEG-DEVICE-IN` | DEVICE atualizada, CPF texto, histórico por CPF, LGPD |
| `SEG-IN-SINAIS` | MCC 4812 em coluna própria; troca de CEP; MCC de construção |
| `SEG-CONFIRMAR-PRODUTOS` | Você Bem, Proteção Completa, flags, regras da seguradora |
| `SEG-CALL-BASE` | registro de ligações do call por CPF |

## Critérios de aceite

- Query de conferência mostra tamanho de engajado, boas-vindas e controle por produto.
- Primeiro log diário com dezenas a centenas de linhas, sem saídas em massa.
- A DE de régua nunca mantém o mesmo CPF em dois seguros ao mesmo tempo.
- Toda saída de régua tem `MOTIVO_SAIDA` preenchido.
- O controle não recebe nenhum contato de seguro.

## Medição do lançamento

Funil: impactado → abertura/clique → visita à LP → adesão e plano escolhido → efetivação (apólice)
→ permanência 30/60/90 dias. Um A/B por mês (com adesão perto de 0,1%, ~80 mil por braço):
regra do aparelho, canal com e sem WhatsApp, copy personalizada.

## Fora de escopo

Mudanças no app, criação de jornadas no SFMC, alteração das LPs, preço e regras da seguradora.
