---
tags: [entidade, sfmc, data-extension, vai-de-visa, grupo, celula-teste]
tipo: entidade
camada: entidades
aliases: [VDV_APTOS, DE_VDV_BASE_ELEGIVEL, Base elegível Vai de Visa]
atualizado: 2026-11-09
status: a-validar
fonte: spec Vai de Visa (out/2026) adaptada; DE e query criadas no SFMC em 03/11/2026, operador
---

# DE `VDV_APTOS` (SFMC)

### `VDV_APTOS`

Preparar somente tratamentos aptos agora, com contato atual e alocação estável.

| Configuração | Referência atual |
|---|---|
| Grão | Uma linha por CPF da safra selecionada |
| Carga | Q_VDV_05_APTOS · Overwrite a cada preparação |
| Relação de envio | Enviável: CPF → SubscriberKey, com EMAIL EmailAddress; conferir no tenant |
| Origem | SAFRA INNER JOIN CRUZAMENTO recém-recalculada, _Subscribers e disponibilidade de tema/pool/catálogo. |
| Consumidor | Eventual envio manual após conferência e adaptação do template; não há envio automático nesta preparação. |
| Pasta | POOL DE OFERTAS VISA; External Key não registrada, conferir sem inferir pelo nome |
| Retenção / defaults | Não reconfirmados no tenant; não ativar expurgo automático por omissão. DT_RODADA é preenchida por query. |

| Campo | Tipo / tamanho de referência | PK | Nulo | Regra / origem |
|---|---|---|---|---|
| `CPF` | Text(50) | Sim | Não | Identidade do participante / SubscriberKey |
| `FIRST_NAME` | Text(50) | — | Sim | Nome do cadastro |
| `EMAIL` | EmailAddress(254) | — | Não | Contato do cadastro; revalidar espaços e supressões |
| `NR_CELULAR` | Phone(50) | — | Sim | Contato celular; não prova consentimento |
| `FL_BLOQ_CELULAR` | Number | — | Não | MAX do bloqueio móvel na origem |
| `CANAL` | Text(50) | — | Não | B2C ou B2B2C; agregação MAX no SQL |
| `VL_LIMITE_DISPONIVEL` | Decimal(18,2) | — | Não | Maior limite das linhas NORMAL |
| `DT_ULTIMA_COMPRA` | Date | — | Não | Atual de CRUZAMENTO |
| `VL_GASTO_12M` | Decimal(18,2) | — | Sim | Atual de CRUZAMENTO |
| `CD_GRUPO` | Text(50) | — | Não | Congelado na SAFRA |
| `CD_GRUPO_SECUNDARIO` | Text(50) | — | Sim | Congelado na SAFRA |
| `CD_REGRA_GRUPO` | Text(50) | — | Não | Literal V1_12M_REC6M; prioridade Família no SQL atual |
| `DS_CELULA_TESTE` | Text(20) | — | Não | Apenas SEG-A, SEG-B, GEN-A |
| `ID_SAFRA` | Text(50) | — | Não | Safra selecionada na query |
| `DT_ATUALIZACAO` | Date | — | Não | Preparação atual; não é DT_DISPARO nem DT_ENVIO |
| `NM_PARCEIRO` | Text(150) | — | Sim | PRODUTO normalizado somente com parceiro B2B2C único e sem B2C NORMAL |
| `NM_CARTAO` | Text(150) | — | Sim | NULL no SQL de 09/11; origem comercial pendente |
| `LOCALE` | Locale(5) | — | Não | Literal BR; conferir tipo |
| `ID_VERSAO_OFERTAS` | Text(60), referência a validar | — | Não | Rodada diária BF26_V1_AAAAMMDD |
| `ID_ENVIO` | Text(36) | — | Não | Token estável da SAFRA, não ID do send |

**Limites:** Sem SEG-C/GEN-C. Não há filtro de já recebeu a rodada anterior. Não contém DT_DISPARO nem cópia de DT_ENTRADA/DT_ENVIO. Repreparar se demorar a enviar, sem sobrescrever enquanto a audiência é consumida.

Tipos/tamanhos e nulidade desta ficha combinam o contrato do pacote e referências anteriores. Onde não houve print/metadado atual, são referência de configuração a conferir, não certificação da DE criada.



:::details Atividade atual · Q_VDV_05_APTOS · SQL integral de 09/11
### Q_VDV_05_APTOS

**Finalidade:** Preparar somente tratamentos elegíveis agora na safra selecionada.

| Configuração | Valor |
|---|---|
| Tipo / automação | Query Activity · PREPARAÇÃO · passo 5 |
| Fonte | SAFRA INNER JOIN CRUZAMENTO + _Subscribers + POOL/BRIEFING |
| Destino / ação | VDV_APTOS · Overwrite |
| Pré-condições | CRUZAMENTO recalculada nesta execução; rodada e tema corretos; PK CPF e relação enviável CPF→SubscriberKey. |
| Conferência | Controles ausentes, somente safra atual, saída/retorno sem re-sorteio, contato atual e pelo menos três marcas válidas. |
| Limitação / recuperação | Sem PREP_FIM de quatro horas. Sem deduplicação do mesmo send. Não sobrescrever enquanto envia. Não usa DT_DISPARO. |
| Arquivo de referência | 05_Q_VDV_05_APTOS.sql |
| Estado | Montagem informada; execução completa pendente de validação. |

SQL integral preservado, sem regenerar a partir do pacote intermediário de duas automações:

```sql
SELECT
    s.CPF,
    c.PRI_NOME AS FIRST_NAME,
    c.EMAIL,
    c.NR_CELULAR,
    c.FL_BLOQ_CELULAR,
    c.CANAL,
    c.VL_LIMITE_DISPONIVEL,
    c.DT_ULTIMA_COMPRA,
    c.VL_GASTO_12M,
    s.CD_GRUPO,
    s.CD_GRUPO_SECUNDARIO,
    'V1_12M_REC6M' AS CD_REGRA_GRUPO,
    s.DS_CELULA_TESTE,
    s.ID_SAFRA,
    DATEADD(HOUR, 3, GETDATE()) AS DT_ATUALIZACAO,
    c.NM_PARCEIRO,
    c.NM_CARTAO,
    'BR' AS LOCALE,
    'BF26_V1_' + CONVERT(
        VARCHAR(8),
        CONVERT(DATE, DATEADD(HOUR, 3, GETDATE())),
        112
    ) AS ID_VERSAO_OFERTAS,
    s.ID_ENVIO
FROM VDV_SAFRA s
INNER JOIN VDV_CRUZAMENTO c
    ON c.CPF = s.CPF
WHERE
    s.ID_SAFRA = 'VDV_2026_11_BF'
    AND s.DS_CELULA_TESTE IN (
        'SEG-A',
        'SEG-B',
        'GEN-A'
    )
    AND LEN(LTRIM(RTRIM(c.EMAIL))) > 0
    AND NOT EXISTS (
        SELECT 1
        FROM _Subscribers sub
        WHERE
            sub.SubscriberKey = s.CPF
            AND sub.Status IN (
                'Unsubscribed',
                'Held'
            )
    )
    AND 1 = (
        SELECT COUNT(*)
        FROM BRIEFING_OFERTAS_VISA t
        WHERE
            t.TIPO = 'TEMA'
            AND t.VERSAO = 'BF26_V1'
            AND t.ATIVA = 1
            AND (
                t.INICIO IS NULL
                OR t.INICIO <= CONVERT(
                    DATE,
                    DATEADD(HOUR, 3, GETDATE())
                )
            )
            AND (
                t.FIM IS NULL
                OR t.FIM >= CONVERT(
                    DATE,
                    DATEADD(HOUR, 3, GETDATE())
                )
            )
    )
    AND EXISTS (
        SELECT 1
        FROM VDV_POOL_OFERTAS_GRUPO_POSICAO p
        INNER JOIN BRIEFING_OFERTAS_VISA o
            ON o.ID = p.OFERTA_ID
            AND o.TIPO = 'OFERTA'
        WHERE
            p.VERSAO = 'BF26_V1_' + CONVERT(
                VARCHAR(8),
                CONVERT(
                    DATE,
                    DATEADD(HOUR, 3, GETDATE())
                ),
                112
            )
            AND p.VERSAO_TEMA = 'BF26_V1'
            AND p.CELULA = 'TODAS'
            AND p.GRUPO = CASE
                WHEN s.DS_CELULA_TESTE IN (
                    'SEG-B',
                    'GEN-A'
                ) THEN 'GENERICO'
                ELSE s.CD_GRUPO
            END
            AND p.POSICAO BETWEEN 1 AND 6
            AND p.ATIVA = 1
            AND o.ATIVA = 1
            AND LEN(LTRIM(RTRIM(o.MARCA))) > 0
            AND LEN(LTRIM(RTRIM(o.FOTO))) > 0
            AND LEN(LTRIM(RTRIM(o.LINK))) > 0
            AND LEN(LTRIM(RTRIM(o.VALOR))) > 0
            AND (
                o.INICIO IS NULL
                OR o.INICIO <= CONVERT(
                    DATE,
                    DATEADD(HOUR, 3, GETDATE())
                )
            )
            AND (
                o.FIM IS NULL
                OR o.FIM >= CONVERT(
                    DATE,
                    DATEADD(HOUR, 3, GETDATE())
                )
            )
        GROUP BY p.GRUPO
        HAVING COUNT(
            DISTINCT UPPER(LTRIM(RTRIM(o.MARCA)))
        ) >= 3
    )
```
:::


[[Estrategia-Pool-de-Ofertas-Visa]] · [[Automacao-VDV-Pool-de-Ofertas]]



### Delta multicanal · aplicação manual no SFMC pendente

As seis SQLs integrais nesta nota são referência da montagem orientada a e-mail. CRUZAMENTO filtra e-mail/bloqueio_email globalmente; APTOS consulta _Subscribers e não transporta ULTIMO_ACESSO. Elas não implementam a política multicanal aprovada.

Manter uma PREPARAÇÃO MAPA → CRUZAMENTO → SAFRA → POOL → APTOS → FUNIL e as mesmas entidades. APTOS continua única, com uma linha por CPF por rodada e seleção de canal identificável; sem DE extra de audiência ou histórico de rotação.

| Destino | Delta proposto | Efeito / conferência |
|---|---|---|
| CRUZAMENTO | + FL_BLOQ_EMAIL Number, ULTIMO_ACESSO Date, DT_REF_ELEGIBILIDADE Date; EMAIL passa a aceitar NULL | Aptidão comum sem veto global de e-mail. Transportar bloqueios separados e uso real do app. 32 → 35 campos de referência. |
| SAFRA | EMAIL deve aceitar NULL; preserva 18 campos e PK CPF+ID_SAFRA | Incluir participantes móveis sem e-mail e controles; manter grupo/célula/token. Canal não é re-sorteio experimental. |
| APTOS | + CANAL_ENVIO Text(20), ID_RODADA Text(60), ID_POLITICA_CANAL Text(60), ULTIMO_ACESSO Date, FL_BLOQ_EMAIL Number, FL_APTO_EMAIL/FL_APTO_WHATSAPP/FL_APTO_SMS Number, DT_REF_ELEGIBILIDADE Date; EMAIL anulável | 20 → 29 campos de referência. Uma escolha por CPF/rodada, supressão por canal, app 60 dias só nos móveis. Campos de política/rodada obrigatórios no contrato novo. |
| POOL / BRIEFING | Mantêm nove / 41 campos | Reutilizar seleção e conteúdo na LP; não criar entidades de hero/tema. |
| FUNIL | Mantém 11 campos; novas linhas de diagnóstico | Canal, sobreposição, controle excluído, data futura, app inválido, total por rodada e teto; proporções por célula continuam na SAFRA. |

Tipos/tamanhos são proposta de contrato a conferir antes de editar/recriar DE. Não sobrescrever dados existentes para trocar PK/nulidade. Conferir export/backup, impacto nos consumidores e teste em cópia. A SQL de referência e-mail fica preservada; o arquivo Q_VDV_03_CRUZAMENTO_MULTICANAL_PROPOSTA.sql prepara a aptidão comum, mas depende dos campos novos e não é a seleção final de canal.

Para a APTOS multicanal, faltam pesos/cotas/pressão aprovados e a ligação das supressões de WhatsApp/SMS à fonte real. O contrato executável de simulação está em poolChannels.ts: só aceita política explícita, exclui controles, separa bloqueios, aplica a janela de app e os tetos e atribui no máximo um canal. O sorteio da simulação não é declarado equivalente ao CHECKSUM do SFMC. Não substituir a query real por uma escolha arbitrária de pesos.

## 3. Canais e política de seleção

E-mail, WhatsApp e SMS são canais principais da estratégia. O piloto separa parcelas sem sobreposição: cada CPF recebe no máximo um canal do Pool na mesma rodada. SEG-C e GEN-C ficam sem comunicação nos três canais. A alocação de grupo/célula permanece congelada na SAFRA; GEN-A usa a vitrine genérica, mas não representa comparação causal direta com SEG-B de outra população.

| Canal | Aptidão própria | Destino | Teto por rodada de envio |
|---|---|---|---|
| E-mail | Endereço disponível, sem bloqueio de e-mail, supressões/publication list e status de assinante conferidos | Links de oferta; CTAs finais a conferir | Orçamento e capacidade a definir |
| WhatsApp | Contato móvel, bloqueios/supressões próprios liberados e uso do app nos últimos 60 dias | LP personalizada da rodada | Até 5.000 mensagens |
| SMS | Contato móvel, bloqueios/supressões próprios liberados e uso do app nos últimos 60 dias | LP personalizada da rodada | Até 100.000 SMS |

Os tetos valem por rodada, sujeitos à elegibilidade e ao orçamento. Não são metas nem limites semanais. No SMS, destinatários, tentativas, reenvios e unidades faturadas/segmentos podem divergir: registrar cada unidade separadamente.

ULTIMO_ACESSO da CLIENTES ATIVOS é a referência de uso do app para os dois canais móveis. Normalizar a data para America/Sao_Paulo e comparar de hoje menos 60 dias até hoje, inclusive. Data inválida, ausente ou futura impede apenas a seleção móvel. O participante permanece na SAFRA e pode receber e-mail se elegível. DEVICE, modelo de aparelho e data de cadastro/importação não entram nesta regra. Usar o app não comprova uso de WhatsApp.

Permissões de uso/consentimentos dos canais foram confirmadas na definição do piloto. A execução continua respeitando os bloqueios e as supressões próprios: bloqueio de e-mail não é bloqueio de celular, e a consulta _Subscribers não pode excluir toda a audiência móvel.

:::details Sorteio, perfis e parâmetros pendentes
Sortear dentro de perfis relevantes, com grupo/célula, B2C/B2B2C e recência quando a fonte permitir. Aplicar a mesma política e probabilidade a SEG-A e SEG-B. Não priorizar maiores compradores no WhatsApp e interpretar o SMS residual como efeito do canal.

Pesos, cotas por perfil, tamanho da amostra, poder estatístico e pressão por pessoa seguem em aberto. O contrato usa ID_POLITICA_CANAL e ID_RODADA para identificar a regra; sem parâmetros aprovados, a simulação retorna “parâmetros pendentes” e não produz audiência. O módulo de simulação do GaaS não executa seleção no SFMC.

Evitar redistribuir silenciosamente participantes inelegíveis para preencher teto. Guardar a política, elegibilidade e contagens de cada perfil para interpretar diferenças de cobertura. A seleção de um CPF em um canal exclui os outros naquela rodada; rodadas futuras precisam respeitar a política de pressão ainda a definir.
:::

:::details Histórico anterior a 09/11 · não executar como instrução vigente
### DE `VDV_APTOS` (SFMC)

**Definição e propósito:** a "foto de hoje" do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]]: cada CPF apto com seu **grupo de afinidade** e sua **célula do teste**. É recalculada a cada execução. Quem efetivamente entra numa safra é gravado em [[DE-VDV_ENVIO]].

> Nome anterior no planejamento: `DE_VDV_BASE_ELEGIVEL` (spec da gestão). Renomeada em 03/11/2026 para seguir o padrão `ENTRADA → CRUZAMENTO → APTOS → FUNIL` da Recência Plurix.

### Grão, chave e origem

- **Grão:** CPF. **PK:** `CPF`. **Não sendable** (contém o controle; enviar por engano invalida o teste).
- **Origem:** Query `Q_VDV_04_APTOS` sobre [[DE-VDV_CRUZAMENTO]]. Ação **Overwrite**.

### Campos (15)

`CPF` Text(50) · `FIRST_NAME` Text(50) · `EMAIL` EmailAddress · `NR_CELULAR` Phone · `FL_BLOQ_CELULAR` Number · `CANAL` Text(50) · `VL_LIMITE_DISPONIVEL` Decimal(18,2) · `DT_ULTIMA_COMPRA` Date · `VL_GASTO_12M` Decimal(18,2) · `CD_GRUPO` Text · `CD_GRUPO_SECUNDARIO` Text · `CD_REGRA_GRUPO` Text · `DS_CELULA_TESTE` Text · `ID_SAFRA` Text · `DT_ATUALIZACAO` Date.

`FIRST_NAME` (e não `PRI_NOME`) para padronizar com a `VDV_ENVIO`; o alias está na query.

### Grupos do 1º teste (safra VDV_2026_11_BF)

| `CD_GRUPO` | Regra de entrada | Afinidade usada |
|---|---|---|
| `MODA` | ≥ 2 compras em 12 meses **e** última ≤ 6 meses | MCC Moda |
| `SAUDE_BELEZA` | ≥ 2 compras em 12 meses **e** última ≤ 6 meses | MCC Saúde e Beleza (inclui farmácia) |
| `FAMILIA_PRESENTES` | ≥ 2 compras em 12 meses | MCC Brinquedos (inclui vestuário infantil) |
| `GENERICO` | não entrou em nenhum | — |

Desempate: mais compras → maior gasto → MODA, SAUDE_BELEZA, FAMILIA_PRESENTES. O segundo colocado vira `CD_GRUPO_SECUNDARIO`. Regra registrada como `CD_REGRA_GRUPO = 'V1_12M_REC6M'` (ver [[Teste-Afinidade-MCC-vs-Generico]]). Viagem, Pet, Eletro e Eletrônicos ficaram fora do 1º teste: quem tem só essas afinidades cai no Genérico.

### Sorteio da célula (duas camadas)

| Camada | Cálculo | Resultado |
|---|---|---|
| Controle 10% | `ABS(CHECKSUM(CPF + 'VDV_CONTROLE') % 100) >= 90` — **código fixo** | `SEG-C` / `GEN-C`; serve tanto para controle perene quanto por safra |
| A × B | `ABS(CHECKSUM(CPF + 'VDV_2026_11_BF') % 2)` — **código da safra** | `SEG-A` / `SEG-B` 50/50 entre os não-controle |

Esperado: grupos 45/45/10; Genérico 90/10. Conferência automática na etapa `APTOS` da [[DE-VDV_FUNIL]].

### Query `Q_VDV_04_APTOS`

O SFMC **não aceita `CROSS APPLY (VALUES …)`**; a versão final usa `UNION ALL` (ver [[SFMC-Query-Studio-e-SQL]]).

```sql
SELECT
  b.CPF, b.PRI_NOME AS FIRST_NAME, b.EMAIL, b.NR_CELULAR, b.FL_BLOQ_CELULAR, b.CANAL,
  b.VL_LIMITE_DISPONIVEL, b.DT_ULTIMA_COMPRA, b.VL_GASTO_12M,
  ISNULL(g.G1, 'GENERICO') AS CD_GRUPO,
  g.G2 AS CD_GRUPO_SECUNDARIO,
  'V1_12M_REC6M' AS CD_REGRA_GRUPO,
  CASE
    WHEN ABS(CHECKSUM(b.CPF + 'VDV_CONTROLE') % 100) >= 90
      THEN CASE WHEN g.G1 IS NULL THEN 'GEN-C' ELSE 'SEG-C' END
    WHEN g.G1 IS NULL THEN 'GEN-A'
    WHEN ABS(CHECKSUM(b.CPF + 'VDV_2026_11_BF') % 2) = 0 THEN 'SEG-A'
    ELSE 'SEG-B'
  END AS DS_CELULA_TESTE,
  'VDV_2026_11_BF' AS ID_SAFRA,
  DATEADD(HOUR, 3, GETDATE()) AS DT_ATUALIZACAO
FROM VDV_CRUZAMENTO b
LEFT JOIN (
  SELECT r.CPF,
    MAX(CASE WHEN r.RN = 1 THEN r.GRUPO END) AS G1,
    MAX(CASE WHEN r.RN = 2 THEN r.GRUPO END) AS G2
  FROM (
    SELECT u.CPF, u.GRUPO,
      ROW_NUMBER() OVER (PARTITION BY u.CPF ORDER BY u.QT DESC, u.VL DESC, u.PRIORIDADE ASC) AS RN
    FROM (
      SELECT c.CPF, 'MODA' AS GRUPO, c.QT_MODA AS QT, c.VL_MODA AS VL, 1 AS PRIORIDADE
      FROM VDV_CRUZAMENTO c
      WHERE c.QT_MODA >= 2 AND c.DT_ULT_MODA >= DATEADD(MONTH, -6, CAST(GETDATE() AS DATE))
      UNION ALL
      SELECT c.CPF, 'SAUDE_BELEZA', c.QT_SAUDE_BELEZA, c.VL_SAUDE_BELEZA, 2
      FROM VDV_CRUZAMENTO c
      WHERE c.QT_SAUDE_BELEZA >= 2 AND c.DT_ULT_SAUDE_BELEZA >= DATEADD(MONTH, -6, CAST(GETDATE() AS DATE))
      UNION ALL
      SELECT c.CPF, 'FAMILIA_PRESENTES', c.QT_BRINQUEDOS, c.VL_BRINQUEDOS, 3
      FROM VDV_CRUZAMENTO c
      WHERE c.QT_BRINQUEDOS >= 2
    ) u
  ) r
  GROUP BY r.CPF
) g ON b.CPF = g.CPF
```

### Lacunas e pendências

- Tamanho de FAMILIA_PRESENTES ainda não medido → define se o grupo fica no teste → ler a etapa APTOS do funil → operação.
- Controle perene × por safra → hoje fixo (`VDV_CONTROLE`), trocar o código se a decisão for sortear por safra → gestão ([[Decisões-Abertas]]).

### Mudanças propostas em 05/11/2026

- Campos novos `NM_PARCEIRO` (parceiro B2B2C do cartão NORMAL, `UPPER(TRIM(PRODUTO))`) e `NM_CARTAO` (nome do cartão; coluna da `CLIENTES ATIVOS` a confirmar pela query 0, provisório `ORIGEM`). Usados no hero do parceiro e no `{CARTAO}` do e-mail.
- Safra e versão de conteúdo vindas do tema vigente da [[DE-BRIEFING_OFERTAS_VISA]] (queries 04 e 05).
- Query alterada e ordem dos passos: [[Automacao-VDV-Pool-de-Ofertas]].

### Relacionado

[[DE-VDV_CRUZAMENTO]] · [[DE-VDV_ENVIO]] · [[DE-VDV_FUNIL]] · [[Teste-Afinidade-MCC-vs-Generico]] · [[Automacao-VDV-Pool-de-Ofertas]]
:::

