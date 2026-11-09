SELECT
    'VDV_2026_11_BF' AS ID_SAFRA,
    DATEADD(HOUR, 3, GETDATE()) AS DT_EXECUCAO,
    f.NR_ORDEM,
    f.ETAPA,
    f.CD_GRUPO,
    f.DS_CELULA_TESTE,
    f.QTD,
    f.PCT_ETAPA_ANTERIOR,
    f.VL_CONTROLE,
    f.DS_STATUS,
    f.DS_OBS
FROM (
    SELECT
        1 AS NR_ORDEM,
        'MAPA_ENTRADA' AS ETAPA,
        'TOTAL' AS CD_GRUPO,
        'TODAS' AS DS_CELULA_TESTE,
        COUNT(*) AS QTD,
        CAST(NULL AS DECIMAL(7,4)) AS PCT_ETAPA_ANTERIOR,
        CAST(NULL AS DECIMAL(18,2)) AS VL_CONTROLE,
        CASE
            WHEN COUNT(*) > 0 THEN 'OK'
            ELSE 'ALERTA'
        END AS DS_STATUS,
        CAST(
            CASE
                WHEN COUNT(*) = 0
                THEN 'Entrada vazia, conferir importacao'
            END
            AS VARCHAR(200)
        ) AS DS_OBS
    FROM MAPA_MCC_ENTRADA

    UNION ALL

    SELECT
        2,
        'MAPA_TRATADA',
        'TOTAL',
        'TODAS',
        COUNT(*),
        NULL,
        MAX(vlr_moda),
        CASE
            WHEN COUNT(*) = 0 THEN 'ALERTA'
            WHEN COUNT(*) <> (
                SELECT COUNT(*)
                FROM MAPA_MCC_ENTRADA
            ) THEN 'ALERTA'
            WHEN SUM(
                CASE
                    WHEN vlr_moda - FLOOR(vlr_moda) <> 0
                    THEN 1 ELSE 0
                END
            ) = 0 THEN 'ALERTA'
            WHEN MAX(vlr_moda) > 500000 THEN 'ALERTA'
            ELSE 'OK'
        END,
        CASE
            WHEN COUNT(*) = 0
            THEN 'Mapa tratado vazio'
            WHEN COUNT(*) <> (
                SELECT COUNT(*)
                FROM MAPA_MCC_ENTRADA
            )
            THEN 'Quantidade diferente da entrada'
            WHEN SUM(
                CASE
                    WHEN vlr_moda - FLOOR(vlr_moda) <> 0
                    THEN 1 ELSE 0
                END
            ) = 0
            THEN 'Sem centavos em Moda, conferir conversao'
            WHEN MAX(vlr_moda) > 500000
            THEN 'Valor maximo de Moda acima do esperado'
            ELSE NULL
        END
    FROM MAPA_MCC

    UNION ALL

    SELECT
        3,
        'CRUZAMENTO',
        'TOTAL',
        'TODAS',
        COUNT(*),
        NULL,
        NULL,
        CASE
            WHEN COUNT(*) > 0 THEN 'OK'
            ELSE 'ALERTA'
        END,
        CASE
            WHEN COUNT(*) = 0
            THEN 'Nenhum cliente elegivel no cruzamento'
            ELSE NULL
        END
    FROM VDV_CRUZAMENTO

    UNION ALL

    SELECT
        4,
        'SAFRA_TOTAL',
        'TOTAL',
        'TODAS',
        COUNT(*),
        NULL,
        NULL,
        CASE
            WHEN COUNT(*) > 0 THEN 'OK'
            ELSE 'ALERTA'
        END,
        'Participantes acumulados, inclusive controles'
    FROM VDV_SAFRA
    WHERE ID_SAFRA = 'VDV_2026_11_BF'

    UNION ALL

    SELECT
        5,
        'SAFRA',
        s.CD_GRUPO,
        s.DS_CELULA_TESTE,
        COUNT(*),
        CAST(
            CAST(COUNT(*) AS DECIMAL(18,4))
            / NULLIF(t.QTD_GRUPO, 0)
            AS DECIMAL(7,4)
        ),
        NULL,
        CASE
            WHEN s.CD_GRUPO IN (
                'MODA',
                'SAUDE_BELEZA',
                'FAMILIA_PRESENTES'
            )
            AND s.DS_CELULA_TESTE IN (
                'SEG-A',
                'SEG-B',
                'SEG-C'
            )
            THEN
                CASE
                    WHEN ABS(
                        CAST(COUNT(*) AS DECIMAL(18,4))
                        / NULLIF(t.QTD_GRUPO, 0)
                        - CASE
                            WHEN s.DS_CELULA_TESTE IN (
                                'SEG-A',
                                'SEG-B'
                            ) THEN 0.45
                            ELSE 0.10
                          END
                    ) > 0.03
                    THEN 'ALERTA'
                    ELSE 'OK'
                END
            WHEN s.CD_GRUPO = 'GENERICO'
                AND s.DS_CELULA_TESTE IN (
                    'GEN-A',
                    'GEN-C'
                )
            THEN
                CASE
                    WHEN ABS(
                        CAST(COUNT(*) AS DECIMAL(18,4))
                        / NULLIF(t.QTD_GRUPO, 0)
                        - CASE
                            WHEN s.DS_CELULA_TESTE = 'GEN-A'
                            THEN 0.90
                            ELSE 0.10
                          END
                    ) > 0.03
                    THEN 'ALERTA'
                    ELSE 'OK'
                END
            ELSE 'ALERTA'
        END,
        'Proporcao na safra, conferir desvios e celulas ausentes'
    FROM VDV_SAFRA s
    INNER JOIN (
        SELECT
            CD_GRUPO,
            COUNT(*) AS QTD_GRUPO
        FROM VDV_SAFRA
        WHERE ID_SAFRA = 'VDV_2026_11_BF'
        GROUP BY CD_GRUPO
    ) t
        ON t.CD_GRUPO = s.CD_GRUPO
    WHERE s.ID_SAFRA = 'VDV_2026_11_BF'
    GROUP BY
        s.CD_GRUPO,
        s.DS_CELULA_TESTE,
        t.QTD_GRUPO

    UNION ALL

    SELECT
        6,
        'POOL',
        g.GRUPO,
        'TODAS',
        COUNT(DISTINCT
            CASE
                WHEN o.ID IS NOT NULL
                THEN UPPER(LTRIM(RTRIM(o.MARCA)))
            END
        ),
        NULL,
        NULL,
        CASE
            WHEN COUNT(DISTINCT
                CASE
                    WHEN o.ID IS NOT NULL
                    THEN UPPER(LTRIM(RTRIM(o.MARCA)))
                END
            ) >= 3
            THEN 'OK'
            ELSE 'ALERTA'
        END,
        'Marcas validas nas posicoes 1 a 6, minimo 3'
    FROM (
        SELECT 'MODA' AS GRUPO

        UNION ALL

        SELECT 'SAUDE_BELEZA'

        UNION ALL

        SELECT 'FAMILIA_PRESENTES'

        UNION ALL

        SELECT 'GENERICO'
    ) g
    LEFT JOIN VDV_POOL_OFERTAS_GRUPO_POSICAO p
        ON p.GRUPO = g.GRUPO
        AND p.VERSAO = 'BF26_V1_' + CONVERT(
            VARCHAR(8),
            CONVERT(DATE, DATEADD(HOUR, 3, GETDATE())),
            112
        )
        AND p.VERSAO_TEMA = 'BF26_V1'
        AND p.CELULA = 'TODAS'
        AND p.ATIVA = 1
        AND p.POSICAO BETWEEN 1 AND 6
    LEFT JOIN BRIEFING_OFERTAS_VISA o
        ON o.ID = p.OFERTA_ID
        AND o.TIPO = 'OFERTA'
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
    GROUP BY g.GRUPO

    UNION ALL

    SELECT
        7,
        'APTOS_TOTAL',
        'TOTAL',
        'TODAS',
        COUNT(*),
        NULL,
        NULL,
        CASE
            WHEN COUNT(*) > 0 THEN 'OK'
            ELSE 'ALERTA'
        END,
        'Audiencia preparada, nao comprova envio'
    FROM VDV_APTOS

    UNION ALL

    SELECT
        8,
        'APTOS',
        a.CD_GRUPO,
        a.DS_CELULA_TESTE,
        COUNT(*),
        NULL,
        NULL,
        CASE
            WHEN SUM(
                CASE
                    WHEN a.ID_SAFRA = 'VDV_2026_11_BF'
                        AND a.DS_CELULA_TESTE IN (
                            'SEG-A',
                            'SEG-B',
                            'GEN-A'
                        )
                    THEN 0
                    ELSE 1
                END
            ) = 0
            THEN 'OK'
            ELSE 'ALERTA'
        END,
        'Audiencia por grupo e celula'
    FROM VDV_APTOS a
    GROUP BY
        a.CD_GRUPO,
        a.DS_CELULA_TESTE

    UNION ALL

    SELECT
        9,
        'APTOS_INVALIDOS',
        'TOTAL',
        'TODAS',
        COUNT(*),
        NULL,
        NULL,
        CASE
            WHEN COUNT(*) = 0 THEN 'OK'
            ELSE 'ALERTA'
        END,
        'Esperado zero, safra, rodada, contato ou alocacao invalidos'
    FROM VDV_APTOS a
    LEFT JOIN VDV_SAFRA s
        ON s.CPF = a.CPF
        AND s.ID_SAFRA = a.ID_SAFRA
    WHERE
        a.ID_SAFRA IS NULL
        OR a.ID_SAFRA <> 'VDV_2026_11_BF'
        OR a.DS_CELULA_TESTE IS NULL
        OR a.DS_CELULA_TESTE NOT IN (
            'SEG-A',
            'SEG-B',
            'GEN-A'
        )
        OR a.ID_VERSAO_OFERTAS IS NULL
        OR a.ID_VERSAO_OFERTAS <> 'BF26_V1_' + CONVERT(
            VARCHAR(8),
            CONVERT(DATE, DATEADD(HOUR, 3, GETDATE())),
            112
        )
        OR a.EMAIL IS NULL
        OR LEN(LTRIM(RTRIM(a.EMAIL))) = 0
        OR s.CPF IS NULL
        OR s.CD_GRUPO IS NULL
        OR a.CD_GRUPO IS NULL
        OR s.CD_GRUPO <> a.CD_GRUPO
        OR s.DS_CELULA_TESTE IS NULL
        OR s.DS_CELULA_TESTE <> a.DS_CELULA_TESTE
        OR a.DT_ATUALIZACAO IS NULL
        OR CONVERT(DATE, a.DT_ATUALIZACAO) <> CONVERT(
            DATE,
            DATEADD(HOUR, 3, GETDATE())
        )

    UNION ALL

    SELECT
        10,
        'ELEGIVEL_SMS',
        'TOTAL',
        'TODAS',
        COUNT(*),
        NULL,
        NULL,
        'INFO',
        'Contato celular disponivel, nao valida consentimento SMS'
    FROM VDV_APTOS
    WHERE
        ID_SAFRA = 'VDV_2026_11_BF'
        AND FL_BLOQ_CELULAR = 0
        AND LEN(LTRIM(RTRIM(NR_CELULAR))) > 0
        AND DS_CELULA_TESTE IN (
            'SEG-A',
            'SEG-B',
            'GEN-A'
        )
) f
