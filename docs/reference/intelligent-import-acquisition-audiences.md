# Importação de aquisição: público, janela e aliases

Atualizado em 2026-10-15. Implementação: `intelligentImportRouting.ts`,
`IntelligentFrameworkUpdate.tsx` e `intelligentUpdateService.ts`.

## Contrato

| Público | Segmento | Subgrupos | Etapa |
|---|---|---|---|
| Repescagem | Negados | Subdivisão comprovada / N/A | Meio_de_Funil |
| Upgrade | Aprovados_nao_convertidos | Subdivisão comprovada / N/A | Meio_de_Funil |
| Topo | CRM / Base_Proprietaria conforme a origem | Preservar subdivisão | Aquisicao |
| Carrinho diário | Abandonados | Diario | Reativacao |
| Carrinho 7D | Abandonados | Abandonados D-7 | Reativacao |
| Carrinho >7 até 21 dias | Abandonados | Abandonados D-21 A D>7 | Reativacao |

B2C e Plurix são BUs; Bem Barato usa BU B2B2C e Parceiro Bem Barato.
Plurix mantém Parceiro N/A. A mudança não cria colunas nem preenche siglas,
modalidades de produto ou elegibilidade sem fonte governada.

## Precedência e preservação

- Janela explícita 21D/21DIAS vence cadência `diario` e nome genérico sábado.
- 7D e 21D explícitos simultâneos bloqueiam o candidato para revisão.
- D0/D2/D7/D21 da sequência não indicam idade do público.
- Sábado/fim de semana segue a convenção 7D, mas não sobrescreve um histórico
  curado 21D sem janela explícita. Cadência diária não apaga uma janela já conhecida.
- `JOR_AQUISICAO` e `JOR_AQS` têm a mesma identidade para matching. A eleição
  escolhe uma grafia e associa o UUID existente, evitando uma segunda inserção.
- `JOR_AQS_CP` e descendentes continuam fora de aquisição; `JOR_AQS_CPA` não é CP.
- As variantes Plurix `NA_ABD_CARRINHO_SAB_SET_26`, `CARRINHO21D_SET_26` e
  `CARRINHO21D_OUT26` só são resolvidas automaticamente quando compartilham
  activity/canal/data e a activity explicita a janela 21D. A jornada 21D de período
  mais recente vence. Empates continuam em revisão.
- Na atribuição D0–D2, a grafia exata da jornada tem prioridade sobre o alias,
  inclusive no fallback ECRED-API, para evitar somar duas cópias do resultado.
- Alteração apenas de subgrupo ou etapa gera refresh. A persistência recebe a
  lista de dimensões efetivamente alteradas; não reaplica oferta, produto ou
  perfil sugeridos pelo histórico durante esse refresh.
- Ausência de performance permanece ausente/null; zero explícito continua zero.

## Correção histórica aplicada

Projeto `mipiwxadnpwtcgfcedym`; execução auditável
`0ccaadca-5c9d-4047-9628-9b5960f726d5` em `gaas_update_runs`.

- 81 correções de Subgrupos: B2C 66; Plurix 15.
- 41 correções de etapa ANC: B2C 25; BB 2; Plurix 14.
- 5 novos disparos Plurix 21D, provenientes de 3 Activity Names e 6 aliases de
  jornada descartados. Totais: enviados 1.307, entregues 1.204, propostas 27,
  aprovados 13, cartões 7. São métricas atribuídas pelo contrato do importador.
- Os 122 registros existentes preservaram UUID, métricas e todos os campos fora
  de Subgrupos/Etapa/updated_at, com assertiva por linha na mesma transação.
- Um caso B2C de 06/04/2026 ficou em revisão: activity
  `afz_car_vis_aqs_wpp_car_disparo1sabado(apiserasa)_20260406`, histórico 21D e
  apenas sinal de sábado no nome. O valor anterior foi preservado.

O histórico guarda before_payload/after_payload por registro. Para desfazer,
preparar patch inverso somente das dimensões alteradas, conferir o estado atual
contra after_payload e executar em transação. Os inserts devem ser tratados
separadamente e nunca removidos se já tiverem recebido atualização posterior.

## Validação

Testes de integração cobrem aliases de prefixo, colisões SAB/21D, atualização pelo
mesmo UUID, separação entre janela e sequência, ECRED-API, ausência versus zero e
preservação dos campos não alterados. O CSV (61) foi reprocessado sem gravação:
após a correção, os cinco disparos novos são reconhecidos como duplicados,
mantendo os mesmos UUIDs. Isso não certifica completude de todo o CSV nem substitui
a revisão dos avisos gerais de performance sem âncora.
