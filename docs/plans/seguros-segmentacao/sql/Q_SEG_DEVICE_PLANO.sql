/* Q_SEG_DEVICE_PLANO (proposta, 04/11/2026)
   Classifica o aparelho principal de cada CPF em faixa de plano do Seguro Celular.
   Supõe a DEVICE entregue pela IN com o JSON já aberto em colunas (DEVICE_ENTRADA) e OS_MAJ numérico.
   Faixas de valor = estimativa de preço de usado, a validar. Se CROSS APPLY não rodar no SFMC,
   repetir LOWER(d.MODELO) em cada linha do CASE. */
SELECT
  RIGHT('00000000000' + CAST(d.CPF AS VARCHAR(11)), 11) AS CPF,
  d.MARCA AS MARCA, d.MODELO AS MODELO, d.OS AS OS, d.OS_VERSAO AS OS_VERSAO,
  d.DT_PRIMEIRO_VISTO AS DT_PRIMEIRO_VISTO, d.DT_ULTIMO_EVENTO AS DT_ULTIMO_EVENTO,
  CASE
    WHEN d.DT_ULTIMO_EVENTO < DATEADD(DAY,-90,GETDATE()) THEN 'FORA_SEM_USO'
    WHEN d.OS = 'iOS'     AND d.OS_MAJ < 17 THEN 'FORA_ANTIGO'
    WHEN d.OS = 'Android' AND d.OS_MAJ < 13 THEN 'FORA_ANTIGO'
    WHEN m.M LIKE 'iphone1[4-9],%' OR m.M LIKE 'iphone2_,%' THEN 'PREMIUM'
    WHEN m.M LIKE 'iphone13,%' THEN 'PLUS'
    WHEN m.M LIKE 'iphone12,%' THEN 'ESSENCIAL'
    WHEN m.M LIKE 'iphone%' THEN 'FORA_ANTIGO'
    WHEN m.M LIKE 'sm-s%' OR m.M LIKE 'sm-f%' THEN 'PREMIUM'
    WHEN m.M LIKE 'sm-g99%' THEN 'PLUS'
    WHEN m.M LIKE 'sm-a[0-9][0-3]%' THEN 'FORA_ANTIGO'
    WHEN m.M LIKE 'sm-a0[4]%' THEN 'FORA_VALOR'
    WHEN m.M LIKE 'sm-a[5-9]%' THEN 'PLUS'
    WHEN m.M LIKE 'sm-a%' OR m.M LIKE 'sm-m%' THEN 'ESSENCIAL'
    WHEN m.M LIKE '%edge%' OR m.M LIKE '%razr%' THEN 'PREMIUM'
    WHEN m.M LIKE 'moto g[7-9][0-9]%' THEN 'PLUS'
    WHEN m.M LIKE 'moto g[0-6][0-9]%' THEN 'ESSENCIAL'
    WHEN m.M LIKE 'moto%' OR m.M LIKE 'motorola%' THEN 'FORA_ANTIGO'
    WHEN d.MARCA LIKE '%xiaomi%' AND m.M LIKE '2[3-9][0-9][0-9]%' THEN 'ESSENCIAL'
    WHEN d.MARCA LIKE '%xiaomi%' THEN 'FORA_ANTIGO'
    WHEN d.MARCA LIKE '%lge%' THEN 'FORA_ANTIGO'
    ELSE 'ESSENCIAL'
  END AS PLANO_DEVICE
FROM DEVICE_ENTRADA d
CROSS APPLY (SELECT LOWER(d.MODELO) AS M) m
