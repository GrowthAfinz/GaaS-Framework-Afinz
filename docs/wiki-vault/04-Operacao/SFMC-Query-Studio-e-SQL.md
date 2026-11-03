---
tags: [operacao, sfmc, sql, query-studio, automation-studio, armadilhas]
tipo: operacao
camada: operacao
aliases: [Query Studio, SQL no SFMC, Armadilhas Query Studio]
atualizado: 2026-11-03
status: confirmado
fonte: erros reproduzidos no Query Studio (Salesforce Labs) em 03/11/2026, operador
---

# SFMC — Query Studio e SQL

**Definição e propósito:** guia de como escrever e testar SQL no Marketing Cloud. O **Query Studio** (app gratuito da Salesforce Labs) roda um `SELECT` e mostra o resultado na tela, sem DE de destino. A **Query Activity** (Automation Studio) grava o resultado numa DE e é o que vai para produção. Os dois usam o dialeto SQL Server do SFMC, mas o Query Studio tem limitações próprias.

> Status: armadilhas 1–4 = `confirmado` (erro reproduzido em 03/11/2026); causa exata da 4 = `inferência`.

## Quando usar cada um

| Situação | Ferramenta |
|---|---|
| Explorar uma DE, contar, validar import, testar uma regra | Query Studio |
| Gerar audiência, alimentar jornada, rodar todo dia | Query Activity (Automation Studio), com DE de destino e ação Overwrite / Update |

## Armadilhas do Query Studio

| # | Sintoma | Causa | Como escrever |
|---|---|---|---|
| 1 | "The ORDER BY clause is invalid in views, inline functions, derived tables, subqueries…" | a query roda embrulhada numa subquery | `ORDER BY` só com `TOP`: `SELECT TOP 500 … ORDER BY qtd DESC` |
| 2 | "Unable to create temporary data extension: Non-whitespace before first tag" | a query vai dentro de um XML; `<` abre tag | evitar `<`, `<=`, `<>`; inverter (`b > a`) ou trocar `x <> ''` por `LEN(x) > 0` |
| 3 | "A field named limite_disponivel >= 200 and … already exists" | o nome da coluna é deduzido pela palavra `AS`; `CAST(… AS DATE)` confunde | usar `CONVERT(DATE, GETDATE())`; `AS` só para nomear coluna |
| 4 | `COUNT(DISTINCT CPF)` igual ao total de linhas mesmo com CPF repetido | observado 2× (MAPA_MCC e CLIENTES ATIVOS) | contar com `SELECT CPF … GROUP BY CPF` e ler o total no rodapé ("1 of N (**X rows**)") |

Outras regras: nome de DE com espaço vai entre colchetes (`[CLIENTES ATIVOS]`); DE compartilhada de outra BU usa `ENT.[nome]`; vale o **nome externo** da DE (Propriedades), não o nome exibido. Sessão longa expira: recarregar a página antes de suspeitar da query.

No Automation Studio as armadilhas 2 e 3 não se aplicam. `COUNT(DISTINCT CPF)` é usado em produção na automação de recência Plurix ([[Plurix-Recencia-Automation-e-Comunicacoes]]); a armadilha 4 é do Query Studio.

## Armadilhas também do Automation Studio (03/11/2026)

| Sintoma | Causa | Como escrever |
|---|---|---|
| "VALUES não é uma extensão de dados ou exibição de dados do sistema conhecida" | `CROSS APPLY (VALUES …)` não é suportado | uma subquery com `UNION ALL` (um bloco por categoria) e `ROW_NUMBER()` por cima |
| Horário 3 h atrás de Brasília | `GETDATE()` usa o servidor (UTC-6) | `DATEADD(HOUR, 3, GETDATE())` |
| Campo inexistente no destino | o SELECT precisa ter os nomes das colunas da DE de destino | alias (`b.PRI_NOME AS FIRST_NAME`); colunas calculadas (`DT_CARGA`) não precisam existir na origem |
| Valores 100× maiores após import | vírgula decimal lida como milhar | importar como texto e converter com `REPLACE` + `TRY_CONVERT` ([[DE-MAPA_MCC]]) |

`ROW_NUMBER() OVER (PARTITION BY … ORDER BY …)`, `TRY_CONVERT`, `NEWID()` e `NOT EXISTS` funcionam na Query Activity.

## Padrões reutilizáveis

**Uma linha por cliente com regras "qualquer linha" (CPF repetido):**

```sql
SELECT a.CPF
FROM [CLIENTES ATIVOS] a
GROUP BY a.CPF
HAVING MAX(CASE WHEN <condição de elegibilidade> THEN 1 ELSE 0 END) = 1   -- ao menos um cartão bom
   AND MAX(CASE WHEN a.bloqueio_email = 1 THEN 1 ELSE 0 END) = 0          -- nenhuma linha bloqueada
```
(No Query Studio, escrever a condição sem `<`.)

**Somar outra tabela por cliente sem duplicar:** juntar por conta a partir de `SELECT DISTINCT CPF, NR_CONTA`, depois `GROUP BY CPF`. Ver [[DE-MAPA_MCC]].

**Funil de filtros numa query só:** um `COUNT(CASE WHEN … THEN 1 END)` por etapa, acumulando condições. No Query Studio, só confiar em contagem por linha; para CPF, usar o padrão `GROUP BY`.

**Booleans:** comparar com `= 1` / `= 0`; agregar com `MAX(CASE …)`, porque bit não aceita `MAX` direto.

**Datas:** "últimos 30 dias" = `DATEADD(DAY,-30,CONVERT(DATE,GETDATE()))`. `GETDATE()` no SFMC é horário do servidor (não UTC-3) — irrelevante para janelas em dias, relevante para corte por hora.

## Relacionado

[[SFMC-Salesforce-Marketing-Cloud]] · [[MOC-SFMC-DEs-e-Automations]] · [[DE-CLIENTES_ATIVOS]] · [[DE-MAPA_MCC]] · [[DE-VDV_APTOS]] · [[Plurix-Recencia-Automation-e-Comunicacoes]]
