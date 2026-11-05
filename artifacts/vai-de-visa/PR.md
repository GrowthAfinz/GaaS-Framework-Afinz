# Pool Vai de Visa na Fábrica

A Fábrica passa a editar as duas DEs de conteúdo do Vai de Visa e a simular os dois toques sem executar lookups no SFMC. Oferta inválida é pulada e as reservas sobem até completar **3 cards**. No desktop, o primeiro fica centralizado acima dos outros dois; no mobile, os três ficam em coluna.

Inclui catálogo, tema, heros, vitrines por versão/célula, duplicação de versão, importação/exportação CSV, HTMLs atualizados e envelope completo. A prévia mostra assunto, pré-cabeçalho, hero, célula e posições escolhidas; sem tema/ofertas válidas, bloqueia o envio. Briefings VDV não exportam o CSV de aquisição.

## Validação

- CSVs anexados: **89 + 16 linhas**, sem erro de contrato; preservação de emoji, acento e ordem no round-trip.
- Suíte completa: **673 testes / 102 arquivos** passaram; os **35 testes VDV** passaram após acrescentar 4 casos complementares.
- Build e `typecheck:release` passaram. O `tsc` integral mantém erros preexistentes do projeto, sem novos diagnósticos.
- Migration reaplicada em PostgreSQL local/PGlite: RLS, auditoria, controle otimista e rollback de lote passaram.
- QA Chromium dos dois toques × 6 amostras, geometria desktop/mobile e interação no editor passou.

## Como testar

Abrir Fábrica → Pool Vai de Visa → Carregar exemplos BF26 (somente local) ou importar os CSVs fornecidos. Selecionar cada amostra e alternar V1/V2. A amostra vencida bloqueia o envio. Alterar uma oferta, reordenar posições, duplicar a versão e exportar os CSVs. Após aplicar a migration, testar Salvar/Recarregar e conflito entre duas sessões.

## Diferenças da fonte recebida

1. Limite de 4 substituído por **3** e primeiro ímpar centralizado, conforme alinhamento posterior com Pablo. A posição 4 passa a ser reserva.
2. O HTML recebido não resolvia `{NOME}` em INTRO, embora previsto na spec. HTML e espelho agora resolvem.
3. `TODAS` só entra quando não há movimento **ativo** específico, conforme AMPscript.
4. Os TXT originais de pré-cabeçalho ficam apenas como referência. Usar o envelope extraído dos HTMLs atualizados na Fábrica.

**Aplicação manual pendente:** `20261105211607_dynamic_email_vai_de_visa.sql`. Nenhuma alteração aplicada no Supabase e nenhuma chamada ao SFMC ou API de IA. A importação real nas DEs e o Test Send ainda precisam ser validados no tenant.

Detalhamento operacional e prints: [artifacts/vai-de-visa](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/codex/vai-de-visa-factory/artifacts/vai-de-visa).

## Prints dos seis cenários

| Cenário | V1 | V2 |
|---|---|---|
| Moda SEG-A | [print](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/V1-sample-1-desktop.png) | [print](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/V2-sample-1-desktop.png) |
| Saúde SEG-B → GENERICO | [print](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/V1-sample-2-desktop.png) | [print](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/V2-sample-2-desktop.png) |
| Família SIPOLATTI | [print](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/V1-sample-3-desktop.png) | [print](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/V2-sample-3-desktop.png) |
| Parceiro sem hero | [print](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/V1-sample-4-desktop.png) | [print](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/V2-sample-4-desktop.png) |
| GEN-A sem nome | [print](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/V1-sample-5-desktop.png) | [print](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/V2-sample-5-desktop.png) |
| Vencidas → diagnóstico de skip | [print](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/V1-sample-6-desktop.png) | [print](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/V2-sample-6-desktop.png) |

[Mobile V1](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/V1-sample-1-mobile.png) · [Mobile V2](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/V2-sample-1-mobile.png) · [Editor](https://github.com/growthafinz/GaaS-Framework-Afinz/blob/codex/vai-de-visa-factory/artifacts/vai-de-visa/screenshots/editor-desktop.png)
