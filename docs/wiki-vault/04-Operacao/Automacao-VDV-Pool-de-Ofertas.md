---
tags: [operacao, sfmc, automation-studio, vai-de-visa, runbook]
tipo: operacao
camada: operacao
aliases: [Automação Vai de Visa, POOL DE OFERTAS VISA - PREPARAÇÃO, POOL DE OFERTAS VISA - CONGELAR, VDV_POOL_OFERTAS]
atualizado: 2026-11-03
status: confirmado
fonte: automações criadas no Automation Studio em 03/11/2026; runbook VDV_Automacao_Preparacao.pdf (local), operador
---

# Automações do Pool de Ofertas - Vai de Visa

**Definição e propósito:** como a base do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]] é montada no Automation Studio. São **duas automações** com riscos diferentes: a de preparação pode rodar quantas vezes for preciso; a de congelamento roda uma vez por safra, no dia do disparo.

> Status: PREPARAÇÃO montada em 03/11/2026 (4 passos) e em primeira execução; CONGELAR a montar. Runbook com anotações e queries em PDF local (`VDV_Automacao_Preparacao.pdf`).

## Visão geral

| Automação | Passos | Quando | Risco fora de hora |
|---|---|---|---|
| **POOL DE OFERTAS VISA – PREPARAÇÃO** | `Q_VDV_02_MAPA` → `Q_VDV_03_CRUZAMENTO` → `Q_VDV_04_APTOS` → `Q_VDV_06_FUNIL` | quantas vezes quiser | nenhum (Overwrite) |
| **POOL DE OFERTAS VISA – CONGELAR** | `Q_VDV_05_ENVIO` → `Q_VDV_06_FUNIL` | 1× no dia do disparo, após Test Send | congela grupo e célula |

A numeração dos nomes segue o fluxo completo (01 import, 02 MAPA, 03 cruzamento, 04 aptos, 05 envio, 06 funil), não a posição em cada automação. Um passo por etapa, porque cada query depende da anterior. Pasta `my automations/MCC`.

## Passos e anotações

| Atividade | Destino | Ação | Anotação (campo Anotações) |
|---|---|---|---|
| `IMP_VDV_01_MAPA_ENTRADA` *(ainda não incluído)* | [[DE-MAPA_MCC\|MAPA_MCC_ENTRADA]] | Overwrite | Importa o arquivo MAPA_MCC do SFTP como texto para MAPA_MCC_ENTRADA, sem converter valores. Overwrite a cada execução; aspas duplas marcadas. |
| `Q_VDV_02_MAPA` | [[DE-MAPA_MCC\|MAPA_MCC]] | Overwrite | Converte a MAPA_MCC_ENTRADA (texto) para MAPA_MCC: vírgula decimal vira ponto e datas dd/mm/aaaa viram Date. Carimba DT_CARGA no horário de Brasília. |
| `Q_VDV_03_CRUZAMENTO` | [[DE-VDV_CRUZAMENTO]] | Overwrite | Monta a base apta (1 linha por CPF): NORMAL, compra em 30 dias, limite ≥ R$ 200, e-mail ok, sem atraso; soma compras por categoria da MAPA via NR_CONTA. |
| `Q_VDV_04_APTOS` | [[DE-VDV_APTOS]] | Overwrite | Define grupo (MODA, SAUDE_BELEZA, FAMILIA_PRESENTES ou GENERICO) e célula do teste: controle fixo de 10% e A/B por safra. Grava em VDV_APTOS. |
| `Q_VDV_05_ENVIO` (CONGELAR) | [[DE-VDV_ENVIO]] | Atualizar | Congela na VDV_ENVIO os aptos da safra, inclusive o controle, só para CPFs novos. Roda uma vez no dia do disparo. |
| `Q_VDV_06_FUNIL` | [[DE-VDV_FUNIL]] | **Atualizar** | Registra as contagens de cada etapa e a proporção de células por grupo em VDV_FUNIL, com status OK/ALERTA. Acumula histórico a cada execução. |

As queries completas estão nas notas de cada DE. Horários gravados em Brasília (`DATEADD(HOUR, 3, GETDATE())`, servidor do MC em UTC-6).

## Import do arquivo da IN (pendente)

O passo `IMP_VDV_01_MAPA_ENTRADA` não foi incluído: a `MAPA_MCC_ENTRADA` foi carregada manualmente em 03/11/2026. **Enquanto o import não entrar na automação, uma atualização do arquivo no SFTP não é capturada.** Configuração prevista: arquivo `MAPA_MCC.csv`, delimitador `;`, aspas duplas marcadas, mapeamento por cabeçalho, Overwrite.

## Ordem de execução

1. Executar a PREPARAÇÃO (Executar uma vez; **sem ativar agendamento** por enquanto).
2. Conferir a [[DE-VDV_FUNIL]]: nenhum ALERTA; tamanho de cada grupo; células perto de 45/45/10.
3. Montar e aprovar e-mail e Test Send.
4. Executar a CONGELAR no dia do disparo; jornada entra pela `VDV_ENVIO`.

## Relacionado

[[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] · [[MOC-SFMC-DEs-e-Automations]] · [[SFMC-Query-Studio-e-SQL]] · [[Plurix-Recencia-Automation-e-Comunicacoes]] (padrão ENTRADA → CRUZAMENTO → APTOS → FUNIL)
