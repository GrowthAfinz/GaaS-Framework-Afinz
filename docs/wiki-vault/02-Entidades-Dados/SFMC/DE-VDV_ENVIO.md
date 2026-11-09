---
tags: [entidade, sfmc, data-extension, vai-de-visa, envio, sendable]
tipo: entidade
camada: entidades
aliases: [VDV_ENVIO, envio congelado Vai de Visa, VDV_SAFRA]
atualizado: 2026-11-09
status: a-validar
fonte: DE criada no SFMC em 03/11/2026; query a executar no dia do disparo, operador
---

# DE `VDV_SAFRA` (SFMC)

### `VDV_SAFRA`

Acumular participantes elegíveis na primeira entrada, congelando grupo, célula e token, inclusive para controles.

| Configuração | Referência atual |
|---|---|
| Grão | CPF × ID_SAFRA |
| Carga | Q_VDV_04_SAFRA · Update com NOT EXISTS por CPF + ID_SAFRA |
| Relação de envio | Mantém a configuração enviável relatada (CPF → SubscriberKey), mas não é a audiência operacional: contém controles |
| Origem | VDV_CRUZAMENTO da execução atual. |
| Consumidor | APTOS e IN (todos os tratamentos e controles). |
| Pasta | POOL DE OFERTAS VISA; External Key não registrada, conferir sem inferir pelo nome |
| Retenção / defaults | Não reconfirmados no tenant; não ativar expurgo automático por omissão. DT_RODADA é preenchida por query. |

| Campo | Tipo / tamanho de referência | PK | Nulo | Regra / origem |
|---|---|---|---|---|
| `CPF` | Text(50) | Sim | Não | Identidade do participante / SubscriberKey |
| `ID_SAFRA` | Text(50) | Sim | Não | VDV_2026_11_BF no SQL atual |
| `FIRST_NAME` | Text(50) | — | Sim | Nome do cadastro |
| `EMAIL` | EmailAddress(254) | — | Não | Contato do cadastro; revalidar espaços e supressões |
| `NR_CELULAR` | Phone(50) | — | Sim | Contato celular; não prova consentimento |
| `LOCALE` | Locale(5) | — | Não | Literal BR; verificar tipo Locale no tenant |
| `FL_BLOQ_CELULAR` | Number | — | Não | MAX do bloqueio móvel na origem |
| `CANAL` | Text(50) | — | Não | B2C ou B2B2C; agregação MAX no SQL |
| `NM_PARCEIRO` | Text(150) | — | Sim | PRODUTO normalizado somente com parceiro B2B2C único e sem B2C NORMAL |
| `NM_CARTAO` | Text(150) | — | Sim | NULL no SQL de 09/11; origem comercial pendente |
| `VL_LIMITE_DISPONIVEL` | Decimal(18,2) | — | Não | Maior limite das linhas NORMAL |
| `CD_GRUPO` | Text(50) | — | Não | Grupo escolhido na primeira entrada; permanece congelado |
| `CD_GRUPO_SECUNDARIO` | Text(50) | — | Sim | Segundo grupo da classificação inicial; diagnóstico |
| `DS_CELULA_TESTE` | Text(20) | — | Não | SEG-A/B/C ou GEN-A/C; não re-sortear |
| `ID_VERSAO_OFERTAS` | Text(60), referência a validar | — | Não | Tema de entrada BF26_V1; semântica diferente de APTOS |
| `ID_ENVIO` | Text(36) | — | Não | NEWID na primeira inclusão; token da participação/LP |
| `DT_ENTRADA` | Date | — | Não | Carimbo da primeira inclusão com DATEADD(HOUR,3,GETDATE()) |
| `DT_ENVIO` | Date | — | Sim | CONVERT(DATETIME,NULL); não preencher como se tivesse havido envio |

**Limites:** Não sobrescrever nem atualizar a alocação existente. Saída da audiência não apaga participação. DT_ENVIO deve aceitar NULL. O nome antigo VDV_ENVIO permanece como alias documental, não ordem para criar outra DE.

Tipos/tamanhos e nulidade desta ficha combinam o contrato do pacote e referências anteriores. Onde não houve print/metadado atual, são referência de configuração a conferir, não certificação da DE criada.



:::details Atividade atual · Q_VDV_04_SAFRA · SQL integral de 09/11
### Q_VDV_04_SAFRA

**Finalidade:** Incluir novos participantes e controles; congelar alocação, tema de entrada e token.

| Configuração | Valor |
|---|---|
| Tipo / automação | Query Activity · PREPARAÇÃO · passo 3 |
| Fonte | VDV_CRUZAMENTO + VDV_SAFRA (NOT EXISTS) |
| Destino / ação | VDV_SAFRA · Update |
| Pré-condições | PK CPF+ID_SAFRA; 18 campos compatíveis; DT_ENVIO aceita NULL. |
| Conferência | Prioridade Família, controle fixo e A/B conferidos; nova execução não altera participante existente nem duplica chave. |
| Limitação / recuperação | ID_SAFRA e tema são literais da revisão atual. NEWID só deve gerar token de novas inclusões. Não equivale a safra fechada ou envio executado. |
| Arquivo de referência | 03_Q_VDV_04_SAFRA.sql |
| Estado | Montagem informada; execução completa pendente de validação. |

SQL integral preservado, sem regenerar a partir do pacote intermediário de duas automações:

```sql
SELECT
    b.CPF,
    'VDV_2026_11_BF' AS ID_SAFRA,
    b.PRI_NOME AS FIRST_NAME,
    b.EMAIL,
    b.NR_CELULAR,
    'BR' AS LOCALE,
    b.FL_BLOQ_CELULAR,
    b.CANAL,
    b.NM_PARCEIRO,
    b.NM_CARTAO,
    b.VL_LIMITE_DISPONIVEL,
    ISNULL(g.G1, 'GENERICO') AS CD_GRUPO,
    g.G2 AS CD_GRUPO_SECUNDARIO,
    CASE
        WHEN ABS(CHECKSUM(b.CPF + 'VDV_CONTROLE') % 100) >= 90
        THEN
            CASE
                WHEN g.G1 IS NULL THEN 'GEN-C'
                ELSE 'SEG-C'
            END
        WHEN g.G1 IS NULL THEN 'GEN-A'
        WHEN ABS(
            CHECKSUM(b.CPF + 'VDV_2026_11_BF') % 2
        ) = 0 THEN 'SEG-A'
        ELSE 'SEG-B'
    END AS DS_CELULA_TESTE,
    'BF26_V1' AS ID_VERSAO_OFERTAS,
    CONVERT(VARCHAR(36), NEWID()) AS ID_ENVIO,
    DATEADD(HOUR, 3, GETDATE()) AS DT_ENTRADA,
    CONVERT(DATETIME, NULL) AS DT_ENVIO
FROM VDV_CRUZAMENTO b
LEFT JOIN (
    SELECT
        r.CPF,
        MAX(
            CASE WHEN r.RN = 1 THEN r.GRUPO END
        ) AS G1,
        MAX(
            CASE WHEN r.RN = 2 THEN r.GRUPO END
        ) AS G2
    FROM (
        SELECT
            u.CPF,
            u.GRUPO,
            ROW_NUMBER() OVER (
                PARTITION BY u.CPF
                ORDER BY
                    CASE
                        WHEN u.GRUPO = 'FAMILIA_PRESENTES' THEN 0
                        ELSE 1
                    END,
                    u.QT DESC,
                    u.VL DESC,
                    u.PRIORIDADE ASC
            ) AS RN
        FROM (
            SELECT
                c.CPF,
                'MODA' AS GRUPO,
                c.QT_MODA AS QT,
                c.VL_MODA AS VL,
                1 AS PRIORIDADE
            FROM VDV_CRUZAMENTO c
            WHERE
                c.QT_MODA >= 2
                AND c.DT_ULT_MODA >= DATEADD(
                    MONTH,
                    -6,
                    CONVERT(
                        DATE,
                        DATEADD(HOUR, 3, GETDATE())
                    )
                )

            UNION ALL

            SELECT
                c.CPF,
                'SAUDE_BELEZA' AS GRUPO,
                c.QT_SAUDE_BELEZA AS QT,
                c.VL_SAUDE_BELEZA AS VL,
                2 AS PRIORIDADE
            FROM VDV_CRUZAMENTO c
            WHERE
                c.QT_SAUDE_BELEZA >= 2
                AND c.DT_ULT_SAUDE_BELEZA >= DATEADD(
                    MONTH,
                    -6,
                    CONVERT(
                        DATE,
                        DATEADD(HOUR, 3, GETDATE())
                    )
                )

            UNION ALL

            SELECT
                c.CPF,
                'FAMILIA_PRESENTES' AS GRUPO,
                c.QT_BRINQUEDOS AS QT,
                c.VL_BRINQUEDOS AS VL,
                3 AS PRIORIDADE
            FROM VDV_CRUZAMENTO c
            WHERE c.QT_BRINQUEDOS >= 2
        ) u
    ) r
    GROUP BY r.CPF
) g
    ON b.CPF = g.CPF
WHERE NOT EXISTS (
    SELECT 1
    FROM VDV_SAFRA s
    WHERE
        s.CPF = b.CPF
        AND s.ID_SAFRA = 'VDV_2026_11_BF'
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
### DE `VDV_ENVIO` (SFMC)

**Definição e propósito:** registro **congelado** de quem entrou em cada safra do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]], com grupo, célula e versão da vitrine do dia — **inclusive o controle, que não recebe nada**. É a DE de entrada da jornada e a base que a IN usa para medir.

### Diferença para a `VDV_APTOS`

| | [[DE-VDV_APTOS]] | `VDV_ENVIO` |
|---|---|---|
| Responde | quem pode receber agora | quem entrou em cada safra |
| Atualização | Overwrite a cada execução | só acrescenta CPFs novos da safra |
| Safras | só a atual | todas (PK CPF + safra) |
| Sendable | não | **sim** |

Sem o congelamento, um cliente do controle que perde o limite some da `VDV_APTOS` e a medição perde a base de comparação.

### Grão, chave e configuração

- **PK composta:** `CPF` + `ID_SAFRA`. **Sendable:** `CPF` → Chave de assinante. Pasta `POOL DE OFERTAS VISA`.
- **Campos (16):** `CPF` · `ID_SAFRA` · `FIRST_NAME` · `EMAIL` (**EmailAddress**) · `NR_CELULAR` Phone · `LOCALE` Locale (`BR`; Text impede elegibilidade de SMS, aprendizado da Recência Plurix) · `FL_BLOQ_CELULAR` · `CANAL` · `VL_LIMITE_DISPONIVEL` · `CD_GRUPO` · `CD_GRUPO_SECUNDARIO` · `DS_CELULA_TESTE` · `ID_VERSAO_OFERTAS` · `ID_ENVIO` (Text 36, ID aleatório para o link da LP no lugar do CPF) · `DT_ENTRADA` · `DT_ENVIO`.

### Query `Q_VDV_05_ENVIO`

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

### Uso na jornada e na medição

- Entrada da jornada: `ID_SAFRA = 'VDV_2026_11_BF'` e `DS_CELULA_TESTE` em `SEG-A`, `SEG-B`, `GEN-A`. SMS/WhatsApp com o mesmo filtro + `FL_BLOQ_CELULAR = 0`.
- A IN recebe a DE **completa** (com SEG-C/GEN-C) e mede 30 dias a partir de `DT_ENVIO`, **pela célula sorteada**, não por quem abriu.

### Mudanças propostas em 05/11/2026

- Campos novos `NM_PARCEIRO` (parceiro B2B2C do cartão NORMAL, `UPPER(TRIM(PRODUTO))`) e `NM_CARTAO` (nome do cartão; coluna da `CLIENTES ATIVOS` a confirmar pela query 0, provisório `ORIGEM`). Usados no hero do parceiro e no `{CARTAO}` do e-mail.
- Safra e versão de conteúdo vindas do tema vigente da [[DE-BRIEFING_OFERTAS_VISA]] (queries 04 e 05).
- Query alterada e ordem dos passos: [[Automacao-VDV-Pool-de-Ofertas]].

### Relacionado

[[DE-VDV_APTOS]] · [[DE-BRIEFING_OFERTAS_VISA]] · [[Emails-Dinamicos-Vai-de-Visa]] · [[Teste-Afinidade-MCC-vs-Generico]] · [[Automacao-VDV-Pool-de-Ofertas]]
:::

