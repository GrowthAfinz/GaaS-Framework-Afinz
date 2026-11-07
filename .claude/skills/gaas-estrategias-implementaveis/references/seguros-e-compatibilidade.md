# Seguros: fontes e compatibilidade a conferir

Estas são referências documentais consultadas em 06/11/2026, não prova do estado atual do SFMC.

## Fontes no vault

- `05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md`: decisões de 06/11; mensal por produto e trigger MCC; coexistência assimétrica; parâmetros independentes de intervalo entre produtos e inatividade; formulário suspende oferta, posse confirmada encerra aquisição.
- `04-Operacao/Automacao-Processos-Seguros.md`: integração Athena/S3, passos nomeados, estruturas propostas e SQLs do desenho de 04/11. Mesmo os passos 1–5 exigem reconfirmação de ativação no documento.
- `02-Entidades-Dados/SFMC/DE-MAPA_SEGUROS.md`: grão por CPF, campos de posse e suas lacunas; semântica das flags precisa de validação.
- `02-Entidades-Dados/SFMC/DE-MAPA_MCC.md`: grão por conta, agregados de 12 meses; atualização sob demanda a confirmar; última data não identifica cada compra.
- `05-Estrategia/Segmentacao-Seguros-Celular.md`: desenho anterior de clusters e respectivas limitações.

## Compatibilizações necessárias

| Desenho anterior | Desenho posterior / risco | Como apresentar |
|---|---|---|
| SEG_BASE_CPF e clusters de Celular | Elegibilidade e seis entradas mensal/trigger do desenho de 06/11 | Mapear reaproveitamento e mudanças, sem declarar equivalência |
| SEG_REGUA_CONTROLE proposto no passo 10 | SEGUROS_CONTROLE_CPF no desenho novo | Decisão de migração/contrato pendente, sem criar duas verdades |
| Controle de 10% e critérios de recência/ticket no SQL de 04/11 | Ordem/controle/intervalos ainda abertos na nota de 06/11 | Não herdar parâmetros silenciosamente |
| MAPA_MCC agregada por conta | Trigger D+1 precisa de fonte, cadência e identidade de evento | Explicitar impedimento técnico e definição requerida |
| Flags de posse Mulher e Celular insuficientes no diagnóstico | Supressão por posse é regra da estratégia | Mostrar lacuna como bloqueio de validação, não assumir zero/ausência como não posse |
| Limiar histórico de contagem em Verification | Volume e completude atuais não reconfirmados | Mostrar o mecanismo; datar e reconfirmar o parâmetro antes de implementar |

## Cadeia documentada, sem selo de produção

1. query_lp_seguros_athena · Query · LP_SEGUROS_GERAL → LP_SEGUROS_ATHENA · Substituir.
2. extracao_seguros_para_athena · Extract.
3. extracao_seguros_para_athena_utf8 · File Convert.
4. transferencia_lp_seguros · File Transfer.
5. Importação S3 Mapa Seguros · Import · mapa_seguro.csv → MAPA_SEGUROS · Sobrescrever.
6. VER_SEG_MAPA_CONTAGEM · Verification proposta · limite a reconfirmar.
7. Q_SEG_06_MOVIMENTO · Query proposta · SEGUROS_MOVIMENTO_LOG · Atualizar.
8. Q_SEG_07_SNAPSHOT · Query proposta · MAPA_SEGUROS_ONTEM · Substituir.
9. Q_SEG_08_BASE_CPF · Query proposta do desenho anterior · SEG_BASE_CPF · Substituir; compatibilização pendente.

A seleção mensal/trigger e os marcadores do desenho novo precisam de especificação compatibilizada; não receber nomes de Query Activities fabricados. O mapa do cliente não substitui esse inventário técnico e o inventário não substitui as regras da estratégia.
