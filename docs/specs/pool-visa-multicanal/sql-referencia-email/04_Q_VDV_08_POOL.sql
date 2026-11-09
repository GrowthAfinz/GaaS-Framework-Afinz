SELECT
    'BF26_V1_' + CONVERT(
        VARCHAR(8),
        CONVERT(DATE, DATEADD(HOUR, 3, GETDATE())),
        112
    ) AS VERSAO,
    p.GRUPO,
    'TODAS' AS CELULA,
    p.POSICAO,
    p.OFERTA_ID,
    1 AS ATIVA,
    CASE
        WHEN p.GRUPO = 'GENERICO' THEN 'COMPLETAR'
        WHEN p.FAIXA = 1 THEN 'GRUPO'
        WHEN p.FAIXA = 2 THEN 'DESCOBERTA'
        ELSE 'COMPLETAR'
    END AS MOTIVO,
    CONVERT(
        DATE,
        DATEADD(HOUR, 3, GETDATE())
    ) AS DT_RODADA,
    'BF26_V1' AS VERSAO_TEMA
FROM (
    SELECT
        f.GRUPO,
        f.OFERTA_ID,
        f.FAIXA,
        ROW_NUMBER() OVER (
            PARTITION BY f.GRUPO
            ORDER BY
                f.FAIXA,
                f.ULTIMA_RODADA,
                ISNULL(
                    f.FIM,
                    CONVERT(DATE, '20991231', 112)
                ),
                f.OFERTA_ID
        ) AS POSICAO
    FROM (
        SELECT
            r.GRUPO,
            r.OFERTA_ID,
            r.FIM,
            r.ULTIMA_RODADA,
            CASE
                WHEN r.GRUPO = 'GENERICO' THEN 1
                WHEN r.PROPRIA = 1
                    AND r.RN_TIPO <= 2 THEN 1
                WHEN r.PROPRIA = 0
                    AND r.RN_TIPO = 1 THEN 2
                ELSE 3
            END AS FAIXA
        FROM (
            SELECT
                d.GRUPO,
                d.OFERTA_ID,
                d.FIM,
                d.PROPRIA,
                d.ULTIMA_RODADA,
                ROW_NUMBER() OVER (
                    PARTITION BY
                        d.GRUPO,
                        d.PROPRIA
                    ORDER BY
                        d.ULTIMA_RODADA,
                        ISNULL(
                            d.FIM,
                            CONVERT(DATE, '20991231', 112)
                        ),
                        d.OFERTA_ID
                ) AS RN_TIPO
            FROM (
                SELECT
                    c.GRUPO,
                    c.OFERTA_ID,
                    c.FIM,
                    c.PROPRIA,
                    c.ULTIMA_RODADA,
                    ROW_NUMBER() OVER (
                        PARTITION BY
                            c.GRUPO,
                            UPPER(LTRIM(RTRIM(c.MARCA)))
                        ORDER BY
                            c.PROPRIA DESC,
                            c.ULTIMA_RODADA,
                            ISNULL(
                                c.FIM,
                                CONVERT(DATE, '20991231', 112)
                            ),
                            c.OFERTA_ID
                    ) AS RN_MARCA
                FROM (
                    SELECT
                        gg.GRUPO,
                        o.ID AS OFERTA_ID,
                        o.MARCA,
                        o.FIM,
                        CASE
                            WHEN gg.GRUPO = 'GENERICO' THEN 0
                            WHEN o.GRUPO = gg.GRUPO THEN 1
                            ELSE 0
                        END AS PROPRIA,
                        ISNULL(
                            h.ULTIMA_RODADA,
                            CONVERT(DATE, '19000101', 112)
                        ) AS ULTIMA_RODADA
                    FROM (
                        SELECT 'MODA' AS GRUPO

                        UNION ALL

                        SELECT 'SAUDE_BELEZA' AS GRUPO

                        UNION ALL

                        SELECT 'FAMILIA_PRESENTES' AS GRUPO

                        UNION ALL

                        SELECT 'GENERICO' AS GRUPO
                    ) gg
                    CROSS JOIN BRIEFING_OFERTAS_VISA o
                    LEFT JOIN (
                        SELECT
                            GRUPO,
                            OFERTA_ID,
                            MAX(DT_RODADA) AS ULTIMA_RODADA
                        FROM VDV_POOL_OFERTAS_GRUPO_POSICAO
                        WHERE
                            POSICAO BETWEEN 1 AND 3
                            AND ATIVA = 1
                            AND VERSAO_TEMA = 'BF26_V1'
                            AND DT_RODADA < CONVERT(
                                DATE,
                                DATEADD(HOUR, 3, GETDATE())
                            )
                        GROUP BY
                            GRUPO,
                            OFERTA_ID
                    ) h
                        ON h.GRUPO = gg.GRUPO
                        AND h.OFERTA_ID = o.ID
                    WHERE
                        o.TIPO = 'OFERTA'
                        AND o.ATIVA = 1
                        AND LEN(
                            LTRIM(RTRIM(o.MARCA))
                        ) > 0
                        AND LEN(
                            LTRIM(RTRIM(o.FOTO))
                        ) > 0
                        AND LEN(
                            LTRIM(RTRIM(o.VALOR))
                        ) > 0
                        AND LEN(
                            LTRIM(RTRIM(o.LINK))
                        ) > 0
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
                ) c
            ) d
            WHERE d.RN_MARCA = 1
        ) r
    ) f
) p
WHERE
    p.POSICAO <= 6
    AND NOT EXISTS (
        SELECT 1
        FROM VDV_POOL_OFERTAS_GRUPO_POSICAO z
        WHERE z.VERSAO = 'BF26_V1_' + CONVERT(
            VARCHAR(8),
            CONVERT(DATE, DATEADD(HOUR, 3, GETDATE())),
            112
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
