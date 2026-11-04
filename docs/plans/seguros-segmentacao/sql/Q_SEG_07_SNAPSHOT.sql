/* Q_SEG_07_SNAPSHOT
   Passo 8 da processos_seguros, SEMPRE em passo separado e DEPOIS do Q_SEG_06_MOVIMENTO.
   Guarda a foto de hoje para o diff de amanhã.
   Destino: MAPA_SEGUROS_ONTEM   Ação: SUBSTITUIR
   Primeira vez: rodar SOZINHA (Executar uma vez) antes de ligar o passo 7. Sem isso, o primeiro diff
   registra todos os detentores atuais como ENTRADA. */
SELECT
  RIGHT('00000000000' + CPF, 11)          AS CPF,
  afinz_assit_residencial_24h             AS afinz_assit_residencial_24h,
  afinz_sos_dental_dia_e_noite            AS afinz_sos_dental_dia_e_noite,
  acidente_pessoal_completo               AS acidente_pessoal_completo,
  acidentes_pessoais_assistencias         AS acidentes_pessoais_assistencias,
  seguro_combo_protecao_completa          AS seguro_combo_protecao_completa,
  voce_bem_saude_super                    AS voce_bem_saude_super,
  vbs_ate_6meses                          AS vbs_ate_6meses,
  seguro_diaria_internacao_hospitalar     AS seguro_diaria_internacao_hospitalar,
  CAST(GETDATE() AS DATE)                 AS DT_FOTO
FROM MAPA_SEGUROS
