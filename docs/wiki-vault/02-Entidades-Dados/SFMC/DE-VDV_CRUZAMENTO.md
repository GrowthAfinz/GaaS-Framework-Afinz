---
tags: [entidade, sfmc, data-extension, vai-de-visa, base-apta]
tipo: entidade
camada: entidades
aliases: [VDV_CRUZAMENTO, cruzamento Vai de Visa]
atualizado: 2026-11-09
status: a-validar
fonte: DE criada e query validada no SFMC em 03/11/2026, operador
---

# DE `VDV_CRUZAMENTO` (SFMC)

### `VDV_CRUZAMENTO`

Recalcular a aptidão e os dados correntes do CPF antes de selecionar participantes e audiência.

| Configuração | Referência atual |
|---|---|
| Grão | Uma linha por CPF |
| Carga | Q_VDV_03_CRUZAMENTO · Overwrite |
| Relação de envio | Não enviável |
| Origem | CLIENTES ATIVOS + MAPA_MCC por NR_CONTA, com DISTINCT CPF, NR_CONTA. |
| Consumidor | VDV_SAFRA para novas participações e VDV_APTOS para aptidão/contato atual. |
| Pasta | POOL DE OFERTAS VISA; External Key não registrada, conferir sem inferir pelo nome |
| Retenção / defaults | Não reconfirmados no tenant; não ativar expurgo automático por omissão. DT_RODADA é preenchida por query. |

| Campo | Tipo / tamanho de referência | PK | Nulo | Regra / origem |
|---|---|---|---|---|
| `CPF` | Text(50) | Sim | Não | Identidade do participante / SubscriberKey |
| `PRI_NOME` | Text(50) | — | Sim | MAX de PRI_NOME por CPF |
| `EMAIL` | EmailAddress(254) | — | Não | Contato do cadastro; revalidar espaços e supressões |
| `NR_CELULAR` | Phone(50) | — | Sim | Contato celular; não prova consentimento |
| `FL_BLOQ_CELULAR` | Number | — | Não | MAX do bloqueio móvel na origem |
| `CANAL` | Text(50) | — | Não | B2C ou B2B2C; agregação MAX no SQL |
| `NM_PARCEIRO` | Text(150) | — | Sim | PRODUTO normalizado somente com parceiro B2B2C único e sem B2C NORMAL |
| `NM_CARTAO` | Text(150) | — | Sim | NULL no SQL de 09/11; origem comercial pendente |
| `VL_LIMITE_DISPONIVEL` | Decimal(18,2) | — | Não | Maior limite das linhas NORMAL |
| `DT_ULTIMA_COMPRA` | Date | — | Não | MAX de DATA_ULTIMA_COMPRA; regra de entrada exige compra em 30 dias |
| `QT_MODA` | Number | — | Sim | Soma das quantidades da MAPA por contas distintas do CPF |
| `VL_MODA` | Decimal(18,2) | — | Sim | Soma dos valores da MAPA; SQL preserva negativos |
| `DT_ULT_MODA` | Date | — | Sim | Maior data da categoria nas contas do CPF |
| `QT_SAUDE_BELEZA` | Number | — | Sim | Soma das quantidades da MAPA por contas distintas do CPF |
| `VL_SAUDE_BELEZA` | Decimal(18,2) | — | Sim | Soma dos valores da MAPA; SQL preserva negativos |
| `DT_ULT_SAUDE_BELEZA` | Date | — | Sim | Maior data da categoria nas contas do CPF |
| `QT_ELETRODOM` | Number | — | Sim | Soma das quantidades da MAPA por contas distintas do CPF |
| `VL_ELETRODOM` | Decimal(18,2) | — | Sim | Soma dos valores da MAPA; SQL preserva negativos |
| `DT_ULT_ELETRODOM` | Date | — | Sim | Maior data da categoria nas contas do CPF |
| `QT_ELETRONICOS` | Number | — | Sim | Soma das quantidades da MAPA por contas distintas do CPF |
| `VL_ELETRONICOS` | Decimal(18,2) | — | Sim | Soma dos valores da MAPA; SQL preserva negativos |
| `DT_ULT_ELETRONICOS` | Date | — | Sim | Maior data da categoria nas contas do CPF |
| `QT_BRINQUEDOS` | Number | — | Sim | Soma das quantidades da MAPA por contas distintas do CPF |
| `VL_BRINQUEDOS` | Decimal(18,2) | — | Sim | Soma dos valores da MAPA; SQL preserva negativos |
| `DT_ULT_BRINQUEDOS` | Date | — | Sim | Maior data da categoria nas contas do CPF |
| `QT_VIAGEM` | Number | — | Sim | Soma das quantidades da MAPA por contas distintas do CPF |
| `VL_VIAGEM` | Decimal(18,2) | — | Sim | Soma dos valores da MAPA; SQL preserva negativos |
| `DT_ULT_VIAGEM` | Date | — | Sim | Maior data da categoria nas contas do CPF |
| `QT_PET` | Number | — | Sim | Soma das quantidades da MAPA por contas distintas do CPF |
| `VL_PET` | Decimal(18,2) | — | Sim | Soma dos valores da MAPA; SQL preserva negativos |
| `DT_ULT_PET` | Date | — | Sim | Maior data da categoria nas contas do CPF |
| `VL_GASTO_12M` | Decimal(18,2) | — | Sim | Soma das nove categorias com ISNULL de cada valor; LEFT JOIN sem MAPA pode deixar NULL |

**Limites:** Sem cadastro de parceiro único confiável, NM_PARCEIRO fica NULL. NM_CARTAO permanece NULL. Nome, e-mail e CANAL por MAX não resolvem comercialmente múltiplos vínculos. Não normaliza CPF por si só.

Tipos/tamanhos e nulidade desta ficha combinam o contrato do pacote e referências anteriores. Onde não houve print/metadado atual, são referência de configuração a conferir, não certificação da DE criada.



:::details Atividade atual · Q_VDV_03_CRUZAMENTO · SQL integral de 09/11
### Q_VDV_03_CRUZAMENTO

**Finalidade:** Reavaliar público e contato; somar contas sem multiplicar por cartão.

| Configuração | Valor |
|---|---|
| Tipo / automação | Query Activity · PREPARAÇÃO · passo 2 |
| Fonte | CLIENTES ATIVOS + MAPA_MCC |
| Destino / ação | VDV_CRUZAMENTO · Overwrite |
| Pré-condições | MAPA convertida e carteira atual; BU e fontes corretas. |
| Conferência | Uma linha por CPF, filtros por linha/CPF exercitados, MAX de parceiro e contatos auditado. |
| Limitação / recuperação | NM_CARTAO NULL. Múltiplos vínculos não resolvidos. O relógio do filtro de 30 dias deve ser confrontado com o carimbo +3 das demais queries. |
| Arquivo de referência | 02_Q_VDV_03_CRUZAMENTO.sql |
| Estado | Montagem informada; execução completa pendente de validação. |

SQL integral preservado, sem regenerar a partir do pacote intermediário de duas automações:

```sql
SELECT
    e.CPF,
    e.PRI_NOME,
    e.EMAIL,
    e.NR_CELULAR,
    e.FL_BLOQ_CELULAR,
    e.CANAL,
    e.NM_PARCEIRO,
    e.NM_CARTAO,
    e.VL_LIMITE_DISPONIVEL,
    e.DT_ULTIMA_COMPRA,
    m.QT_MODA,
    m.VL_MODA,
    m.DT_ULT_MODA,
    m.QT_SAUDE_BELEZA,
    m.VL_SAUDE_BELEZA,
    m.DT_ULT_SAUDE_BELEZA,
    m.QT_ELETRODOM,
    m.VL_ELETRODOM,
    m.DT_ULT_ELETRODOM,
    m.QT_ELETRONICOS,
    m.VL_ELETRONICOS,
    m.DT_ULT_ELETRONICOS,
    m.QT_BRINQUEDOS,
    m.VL_BRINQUEDOS,
    m.DT_ULT_BRINQUEDOS,
    m.QT_VIAGEM,
    m.VL_VIAGEM,
    m.DT_ULT_VIAGEM,
    m.QT_PET,
    m.VL_PET,
    m.DT_ULT_PET,
    m.VL_GASTO_12M
FROM (
    SELECT
        a.CPF,
        MAX(a.PRI_NOME) AS PRI_NOME,
        MAX(a.EMAIL) AS EMAIL,
        MAX(a.NR_CELULAR) AS NR_CELULAR,
        MAX(
            CASE
                WHEN a.bloqueio_celular = 1 THEN 1
                ELSE 0
            END
        ) AS FL_BLOQ_CELULAR,
        MAX(a.CANAL) AS CANAL,
        CASE
            WHEN COUNT(DISTINCT
                CASE
                    WHEN a.CANAL = 'B2B2C'
                        AND a.STATUS = 'NORMAL'
                    THEN NULLIF(
                        UPPER(LTRIM(RTRIM(a.PRODUTO))),
                        ''
                    )
                END
            ) = 1
            AND MAX(
                CASE
                    WHEN a.CANAL = 'B2C'
                        AND a.STATUS = 'NORMAL'
                    THEN 1
                    ELSE 0
                END
            ) = 0
            THEN MAX(
                CASE
                    WHEN a.CANAL = 'B2B2C'
                        AND a.STATUS = 'NORMAL'
                    THEN UPPER(LTRIM(RTRIM(a.PRODUTO)))
                END
            )
            ELSE NULL
        END AS NM_PARCEIRO,
        CONVERT(VARCHAR(150), NULL) AS NM_CARTAO,
        MAX(
            CASE
                WHEN a.STATUS = 'NORMAL'
                THEN a.LIMITE_DISPONIVEL
            END
        ) AS VL_LIMITE_DISPONIVEL,
        MAX(a.DATA_ULTIMA_COMPRA) AS DT_ULTIMA_COMPRA
    FROM [CLIENTES ATIVOS] a
    WHERE a.CANAL IN ('B2C', 'B2B2C')
    GROUP BY a.CPF
    HAVING
        MAX(
            CASE
                WHEN a.STATUS = 'NORMAL'
                    AND a.DATA_ULTIMA_COMPRA >= DATEADD(
                        DAY,
                        -30,
                        CONVERT(DATE, GETDATE())
                    )
                    AND a.LIMITE_DISPONIVEL >= 200
                THEN 1
                ELSE 0
            END
        ) = 1
        AND MAX(
            CASE
                WHEN a.bloqueio_email = 1 THEN 1
                ELSE 0
            END
        ) = 0
        AND MAX(
            CASE
                WHEN a.STATUS = 'BLOQUEADO ATRASO' THEN 1
                ELSE 0
            END
        ) = 0
        AND MAX(LEN(a.EMAIL)) > 0
) e
LEFT JOIN (
    SELECT
        c.CPF,
        SUM(mp.qtd_moda) AS QT_MODA,
        SUM(mp.vlr_moda) AS VL_MODA,
        MAX(mp.dt_ultima_compra_moda) AS DT_ULT_MODA,
        SUM(mp.qtd_saude_beleza) AS QT_SAUDE_BELEZA,
        SUM(mp.vlr_saude_beleza) AS VL_SAUDE_BELEZA,
        MAX(mp.dt_ultima_compra_saude_beleza) AS DT_ULT_SAUDE_BELEZA,
        SUM(mp.qtd_eletrodomesticos) AS QT_ELETRODOM,
        SUM(mp.vlr_eletrodomesticos) AS VL_ELETRODOM,
        MAX(mp.dt_ultima_compra_eletrodomesticos) AS DT_ULT_ELETRODOM,
        SUM(mp.qtd_eletronicos) AS QT_ELETRONICOS,
        SUM(mp.vlr_eletronicos) AS VL_ELETRONICOS,
        MAX(mp.dt_ultima_compra_eletronicos) AS DT_ULT_ELETRONICOS,
        SUM(mp.qtd_brinquedos) AS QT_BRINQUEDOS,
        SUM(mp.vlr_brinquedos) AS VL_BRINQUEDOS,
        MAX(mp.dt_ultima_compra_brinquedos) AS DT_ULT_BRINQUEDOS,
        SUM(mp.qtd_viagem) AS QT_VIAGEM,
        SUM(mp.vlr_viagem) AS VL_VIAGEM,
        MAX(mp.dt_ultima_compra_viagem) AS DT_ULT_VIAGEM,
        SUM(mp.qtd_pet) AS QT_PET,
        SUM(mp.vlr_pet) AS VL_PET,
        MAX(mp.dt_ultima_compra_pet) AS DT_ULT_PET,
        SUM(
            ISNULL(mp.vlr_moda, 0)
            + ISNULL(mp.vlr_saude_beleza, 0)
            + ISNULL(mp.vlr_eletrodomesticos, 0)
            + ISNULL(mp.vlr_eletronicos, 0)
            + ISNULL(mp.vlr_brinquedos, 0)
            + ISNULL(mp.vlr_viagem, 0)
            + ISNULL(mp.vlr_pet, 0)
            + ISNULL(mp.vlr_fora_mvp, 0)
            + ISNULL(mp.vlr_nao_mapeado, 0)
        ) AS VL_GASTO_12M
    FROM (
        SELECT DISTINCT
            CPF,
            NR_CONTA
        FROM [CLIENTES ATIVOS]
    ) c
    INNER JOIN MAPA_MCC mp
        ON c.NR_CONTA = mp.nr_conta
    GROUP BY c.CPF
) m
    ON e.CPF = m.CPF
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
### DE `VDV_CRUZAMENTO` (SFMC)

**Definição e propósito:** base apta do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]] com **uma linha por CPF**: contato, limite e compras por categoria nos últimos 12 meses. É a entrada do cálculo de grupo e célula em [[DE-VDV_APTOS]].

### Grão, chave e origem

- **Grão:** CPF. **PK:** `CPF`. **Sendable:** não. Pasta `POOL DE OFERTAS VISA`.
- **Origem:** Query `Q_VDV_03_CRUZAMENTO` (passo 2 da automação de preparação, ver [[Automacao-VDV-Pool-de-Ofertas]]), sobre [[DE-CLIENTES_ATIVOS]] + [[DE-MAPA_MCC]]. Ação **Overwrite**.

### Campos (30)

`CPF` Text(50) · `PRI_NOME` Text(50) · `EMAIL` EmailAddress · `NR_CELULAR` Phone · `FL_BLOQ_CELULAR` Number · `CANAL` Text(50) · `VL_LIMITE_DISPONIVEL` Decimal(18,2) · `DT_ULTIMA_COMPRA` Date · para cada categoria MODA, SAUDE_BELEZA, ELETRODOM, ELETRONICOS, BRINQUEDOS, VIAGEM, PET: `QT_` Number, `VL_` Decimal(18,2), `DT_ULT_` Date · `VL_GASTO_12M` Decimal(18,2).

### Regras aplicadas

1. Entra o CPF com **ao menos um cartão** `STATUS = 'NORMAL'`, compra nos últimos 30 dias e `LIMITE_DISPONIVEL ≥ 200`, `CANAL` B2C ou B2B2C.
2. Sai se **qualquer** linha do CPF tiver `bloqueio_email = True` ou `STATUS = 'BLOQUEADO ATRASO'`, ou se não houver e-mail.
3. `bloqueio_celular` vira `FL_BLOQ_CELULAR` (filtra só SMS/WhatsApp).
4. Compras da MAPA somadas por CPF a partir de `SELECT DISTINCT CPF, NR_CONTA` (não multiplicar pela quantidade de cartões da conta).

### Query `Q_VDV_03_CRUZAMENTO`

```sql
SELECT
  e.CPF, e.PRI_NOME, e.EMAIL, e.NR_CELULAR, e.FL_BLOQ_CELULAR, e.CANAL,
  e.VL_LIMITE_DISPONIVEL, e.DT_ULTIMA_COMPRA,
  m.QT_MODA, m.VL_MODA, m.DT_ULT_MODA,
  m.QT_SAUDE_BELEZA, m.VL_SAUDE_BELEZA, m.DT_ULT_SAUDE_BELEZA,
  m.QT_ELETRODOM, m.VL_ELETRODOM, m.DT_ULT_ELETRODOM,
  m.QT_ELETRONICOS, m.VL_ELETRONICOS, m.DT_ULT_ELETRONICOS,
  m.QT_BRINQUEDOS, m.VL_BRINQUEDOS, m.DT_ULT_BRINQUEDOS,
  m.QT_VIAGEM, m.VL_VIAGEM, m.DT_ULT_VIAGEM,
  m.QT_PET, m.VL_PET, m.DT_ULT_PET,
  m.VL_GASTO_12M
FROM (
  SELECT a.CPF,
    MAX(a.PRI_NOME) AS PRI_NOME,
    MAX(a.EMAIL) AS EMAIL,
    MAX(a.NR_CELULAR) AS NR_CELULAR,
    MAX(CASE WHEN a.bloqueio_celular = 1 THEN 1 ELSE 0 END) AS FL_BLOQ_CELULAR,
    MAX(a.CANAL) AS CANAL,
    MAX(CASE WHEN a.STATUS = 'NORMAL' THEN a.LIMITE_DISPONIVEL END) AS VL_LIMITE_DISPONIVEL,
    MAX(a.DATA_ULTIMA_COMPRA) AS DT_ULTIMA_COMPRA
  FROM [CLIENTES ATIVOS] a
  WHERE a.CANAL IN ('B2C','B2B2C')
  GROUP BY a.CPF
  HAVING
    MAX(CASE WHEN a.STATUS = 'NORMAL' AND a.DATA_ULTIMA_COMPRA >= DATEADD(DAY,-30,CONVERT(DATE,GETDATE())) AND a.LIMITE_DISPONIVEL >= 200 THEN 1 ELSE 0 END) = 1
    AND MAX(CASE WHEN a.bloqueio_email = 1 THEN 1 ELSE 0 END) = 0
    AND MAX(CASE WHEN a.STATUS IN ('BLOQUEADO ATRASO') THEN 1 ELSE 0 END) = 0
    AND MAX(LEN(a.EMAIL)) > 0
) e
LEFT JOIN (
  SELECT c.CPF,
    SUM(mp.qtd_moda) AS QT_MODA, SUM(mp.vlr_moda) AS VL_MODA, MAX(mp.dt_ultima_compra_moda) AS DT_ULT_MODA,
    SUM(mp.qtd_saude_beleza) AS QT_SAUDE_BELEZA, SUM(mp.vlr_saude_beleza) AS VL_SAUDE_BELEZA, MAX(mp.dt_ultima_compra_saude_beleza) AS DT_ULT_SAUDE_BELEZA,
    SUM(mp.qtd_eletrodomesticos) AS QT_ELETRODOM, SUM(mp.vlr_eletrodomesticos) AS VL_ELETRODOM, MAX(mp.dt_ultima_compra_eletrodomesticos) AS DT_ULT_ELETRODOM,
    SUM(mp.qtd_eletronicos) AS QT_ELETRONICOS, SUM(mp.vlr_eletronicos) AS VL_ELETRONICOS, MAX(mp.dt_ultima_compra_eletronicos) AS DT_ULT_ELETRONICOS,
    SUM(mp.qtd_brinquedos) AS QT_BRINQUEDOS, SUM(mp.vlr_brinquedos) AS VL_BRINQUEDOS, MAX(mp.dt_ultima_compra_brinquedos) AS DT_ULT_BRINQUEDOS,
    SUM(mp.qtd_viagem) AS QT_VIAGEM, SUM(mp.vlr_viagem) AS VL_VIAGEM, MAX(mp.dt_ultima_compra_viagem) AS DT_ULT_VIAGEM,
    SUM(mp.qtd_pet) AS QT_PET, SUM(mp.vlr_pet) AS VL_PET, MAX(mp.dt_ultima_compra_pet) AS DT_ULT_PET,
    SUM(ISNULL(mp.vlr_moda,0) + ISNULL(mp.vlr_saude_beleza,0) + ISNULL(mp.vlr_eletrodomesticos,0) + ISNULL(mp.vlr_eletronicos,0) + ISNULL(mp.vlr_brinquedos,0) + ISNULL(mp.vlr_viagem,0) + ISNULL(mp.vlr_pet,0) + ISNULL(mp.vlr_fora_mvp,0) + ISNULL(mp.vlr_nao_mapeado,0)) AS VL_GASTO_12M
  FROM (SELECT DISTINCT CPF, NR_CONTA FROM [CLIENTES ATIVOS]) c
  INNER JOIN MAPA_MCC mp ON c.NR_CONTA = mp.nr_conta
  GROUP BY c.CPF
) m ON e.CPF = m.CPF
```

### Validação

> 📊 03/11/2026: **130.175** CPFs; 99,8% com conta na MAPA. O total muda a cada carga diária da CLIENTES ATIVOS.

### Mudanças propostas em 05/11/2026

- Campos novos `NM_PARCEIRO` (parceiro B2B2C do cartão NORMAL, `UPPER(TRIM(PRODUTO))`) e `NM_CARTAO` (nome do cartão; coluna da `CLIENTES ATIVOS` a confirmar pela query 0, provisório `ORIGEM`). Usados no hero do parceiro e no `{CARTAO}` do e-mail.
- Safra e versão de conteúdo vindas do tema vigente da [[DE-BRIEFING_OFERTAS_VISA]] (queries 04 e 05).
- Query alterada e ordem dos passos: [[Automacao-VDV-Pool-de-Ofertas]].

### Relacionado

[[DE-VDV_APTOS]] · [[DE-CLIENTES_ATIVOS]] · [[DE-MAPA_MCC]] · [[Automacao-VDV-Pool-de-Ofertas]] · [[MOC-SFMC-DEs-e-Automations]]
:::

