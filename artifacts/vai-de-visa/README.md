# Vai de Visa na Fábrica — entrega 1

A Fábrica mantém o catálogo, tema, heros e movimentos das duas DEs de conteúdo. Não armazena audiência e não chama o SFMC nem APIs de IA.

## Regra alinhada com Pablo

- Até **3** ofertas válidas, percorrendo as posições 1 a 6 em ordem. A posição 4 também passa a ser reserva.
- Uma oferta inválida é pulada; as seguintes ocupam seu lugar.
- Desktop: com 3 cards, primeiro centralizado e outros dois na linha seguinte; com 2, lado a lado; com 1, centralizado.
- Mobile: uma oferta por linha, mesma ordem, mesma largura.
- `TODAS` entra somente quando não há movimento ativo para a célula específica; não é acionado por ofertas inválidas.
- Sem tema ou sem oferta válida: diagnóstico bloqueante e nenhum e-mail renderizado.

## Como revisar

1. Abrir Fábrica → **Pool Vai de Visa**. Antes da migration, **Carregar exemplos BF26** permite revisar localmente sem salvar dados.
2. Importar os CSVs fornecidos: 89 linhas de briefing e 16 de movimento. Avisos de logo/foto e ofertas inativas não bloqueiam salvar.
3. Revisar catálogo, tema, heros e vitrines. Alterações só são persistidas por **Salvar**. A origem muda para `import` ao importar e `gaas` ao editar.
4. Selecionar V1/V2 e cada uma das 6 amostras; revisar assunto, pré-cabeçalho, hero, célula, cards e posições de origem. A sexta amostra simula 01/12/2026 e bloqueia o envio.
5. Duplicar BF26_V1 para uma nova versão. Copia tema, heros e movimento; preserva o catálogo compartilhado.
6. Exportar catálogo completo e movimento da versão. UTF-8 sem BOM, vírgula, CRLF, datas ISO, booleanos True/False. Os arquivos permanecem sujeitos à validação real de importação na BU do SFMC.
7. Exportar HTML e copiar assunto/pré-cabeçalho completo. A guarda `@VDVInicializado` permanece no bloco inicial.

A prévia do briefing também detecta `@VDVInicializado`, recebe as variáveis resolvidas e bloqueia o export de aquisição com a mensagem solicitada. Os slots VDV completos são registrados pela migration, sem torná-los principais.

## Aplicação manual

Aplicar `supabase/migrations/20261105211607_dynamic_email_vai_de_visa.sql` no projeto GaaS Framework Afinz. **Não aplicada por esta entrega.**

A migration é aditiva/idempotente, cria as duas tabelas com RLS equivalente a `dynamic_email_header_variants`, auditoria e RPCs `SECURITY INVOKER`. Cada lote por DE executa numa transação, usando a versão esperada. Conflitos exigem recarregar/reconciliar. Briefing e movimento são lotes separados; se um lote falhar após outro salvar, a tela mantém o resultado confirmado do lote anterior.

## Diferenças frente aos anexos

- A spec e os HTMLs originais previam até 4 cards e o último ímpar centralizado. Substituído pela decisão posterior de até 3, primeiro centralizado no desktop e coluna no mobile.
- O HTML original não substituía `{NOME}` em `INTRO`, embora a spec incluísse esse token. Acrescentado o Replace no HTML exportado e no espelho, mantendo os campos atuais intactos.
- Os TXT recebidos são referências originais de 4 ofertas. **Não usá-los no envio novo**: copiar o envelope derivado do HTML atualizado na interface.
- Expectativas de paridade passam a ser Moda = Puma/Riachuelo/Decathlon e SEG-B = Movida/Alura/Oceane. Movida e Puma, respectivamente, ficam como reservas na posição 4.
- O fallback por célula considera linhas **ativas**, como no AMPscript recebido.

## Evidências e limites

- `npm test`: 102 arquivos / 673 testes passaram; depois foram acrescentados 4 casos e os 35 testes de VDV passaram.
- `npm run build`: passou.
- `npm run typecheck:release`: passou, sem novos erros. `tsc --noEmit` completo continua com dívida anterior do repositório; não é um aceite verde integral.
- `node scripts/test-vai-de-visa-sql.mjs`: PostgreSQL local via PGlite; reaplicação, RLS, auditoria, rollback de lote e conflito de versão passaram.
- `node scripts/qa-vai-de-visa.mjs`: gera prints V1/V2 × 6 cenários, mais mobile; verifica geometria desktop/mobile. Rodar testes de VDV antes para gerar os HTMLs de prévia.
- `node scripts/qa-vai-de-visa-editor.mjs`: cria um harness temporário do componente real, verifica montagem, personalização, troca de toque, skip e duplicação; bloqueia acesso ao Supabase durante o teste.
- Prints em `screenshots/`. As imagens de skip representam o diagnóstico esperado; nenhum e-mail vazio é considerado válido.
- Prévia Chromium não comprova Outlook ou execução de lookup no tenant. Importação nas DEs e Preview/Test Send continuam pendentes.

## Referências

A planilha `references/Ofertas_novembro_2_VDV_2.xlsx` contém as abas Novembero, TEMA, HEROS, MOVIMENTO, CSV_BRIEFING, CSV_MOVIMENTO e LEIA-ME. Os CSVs anexados são os fixtures usados na validação; a planilha não é um importador adicional nesta entrega.
