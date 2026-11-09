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
