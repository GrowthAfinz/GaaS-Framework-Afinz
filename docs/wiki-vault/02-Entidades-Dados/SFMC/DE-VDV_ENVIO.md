---
tags: [entidade, sfmc, data-extension, vai-de-visa, envio, sendable]
tipo: entidade
camada: entidades
aliases: [VDV_ENVIO, envio congelado Vai de Visa]
atualizado: 2026-11-03
status: confirmado
fonte: DE criada no SFMC em 03/11/2026; query a executar no dia do disparo, operador
---

# DE `VDV_ENVIO` (SFMC)

**Definição e propósito:** registro **congelado** de quem entrou em cada safra do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]], com grupo, célula e versão da vitrine do dia — **inclusive o controle, que não recebe nada**. É a DE de entrada da jornada e a base que a IN usa para medir.

## Diferença para a `VDV_APTOS`

| | [[DE-VDV_APTOS]] | `VDV_ENVIO` |
|---|---|---|
| Responde | quem pode receber agora | quem entrou em cada safra |
| Atualização | Overwrite a cada execução | só acrescenta CPFs novos da safra |
| Safras | só a atual | todas (PK CPF + safra) |
| Sendable | não | **sim** |

Sem o congelamento, um cliente do controle que perde o limite some da `VDV_APTOS` e a medição perde a base de comparação.

## Grão, chave e configuração

- **PK composta:** `CPF` + `ID_SAFRA`. **Sendable:** `CPF` → Chave de assinante. Pasta `POOL DE OFERTAS VISA`.
- **Campos (16):** `CPF` · `ID_SAFRA` · `FIRST_NAME` · `EMAIL` (**EmailAddress**) · `NR_CELULAR` Phone · `LOCALE` Locale (`BR`; Text impede elegibilidade de SMS, aprendizado da Recência Plurix) · `FL_BLOQ_CELULAR` · `CANAL` · `VL_LIMITE_DISPONIVEL` · `CD_GRUPO` · `CD_GRUPO_SECUNDARIO` · `DS_CELULA_TESTE` · `ID_VERSAO_OFERTAS` · `ID_ENVIO` (Text 36, ID aleatório para o link da LP no lugar do CPF) · `DT_ENTRADA` · `DT_ENVIO`.

## Query `Q_VDV_05_ENVIO`

Roda **só na automação CONGELAR**, uma vez, no dia do disparo, depois do Test Send. Ação **Atualizar**; o `NOT EXISTS` impede mudar a célula de quem já entrou.

```sql
SELECT
  a.CPF,
  a.ID_SAFRA,
  a.FIRST_NAME,
  a.EMAIL,
  a.NR_CELULAR,
  'BR' AS LOCALE,
  a.FL_BLOQ_CELULAR,
  a.CANAL,
  a.VL_LIMITE_DISPONIVEL,
  a.CD_GRUPO,
  a.CD_GRUPO_SECUNDARIO,
  a.DS_CELULA_TESTE,
  'BF26_V1' AS ID_VERSAO_OFERTAS,
  CONVERT(VARCHAR(36), NEWID()) AS ID_ENVIO,
  DATEADD(HOUR, 3, GETDATE()) AS DT_ENTRADA,
  CAST(DATEADD(HOUR, 3, GETDATE()) AS DATE) AS DT_ENVIO
FROM VDV_APTOS a
WHERE NOT EXISTS (
  SELECT 1 FROM VDV_ENVIO e
  WHERE e.CPF = a.CPF AND e.ID_SAFRA = a.ID_SAFRA
)
```

## Uso na jornada e na medição

- Entrada da jornada: `ID_SAFRA = 'VDV_2026_11_BF'` e `DS_CELULA_TESTE` em `SEG-A`, `SEG-B`, `GEN-A`. SMS/WhatsApp com o mesmo filtro + `FL_BLOQ_CELULAR = 0`.
- A IN recebe a DE **completa** (com SEG-C/GEN-C) e mede 30 dias a partir de `DT_ENVIO`, **pela célula sorteada**, não por quem abriu.

## Relacionado

[[DE-VDV_APTOS]] · [[DE-BRIEFING_OFERTAS_VISA]] · [[Emails-Dinamicos-Vai-de-Visa]] · [[Teste-Afinidade-MCC-vs-Generico]] · [[Automacao-VDV-Pool-de-Ofertas]]
