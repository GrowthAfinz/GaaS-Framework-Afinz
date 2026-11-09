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
