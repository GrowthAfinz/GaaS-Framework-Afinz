# Contrato de importação XLSX → Fábrica (`fabrica-xlsx-import/1`)

Implementação: `src/modules/dynamic-email/domain/xlsxImport.ts` (validação Zod, expansão,
diff de reimportação). Exemplo real: `examples/topo-crm3-import-payload.json`.

## Fluxo

1. O marketing escreve a aba editorial da régua (ex.: "TOPO CRM 3").
2. A IA lê por rótulo (`scripts/email-factory/xlsx_to_import_payload.py`) e completa com
   cadastros governados, registrando a origem de cada campo.
3. `validateImportPayload` valida forma e conteúdo (mesmas regras do editor, incluindo
   `MENSAGEM_LIMITE`). Erro bloqueia; aviso vira pendência.
4. `planImport` compara com o GaaS e decide por campo. Nada é sobrescrito em silêncio.
5. Grava como **rascunho** (`status = draft`), com `import_source` e versão no histórico.

## Payload

| Bloco | Conteúdo |
|---|---|
| `contract`, `status` | `fabrica-xlsx-import/1` e sempre `draft` |
| `source` | arquivo, aba, sha256, data da leitura, modelo que leu |
| `ruler` | nome visual, `segment` (separa a régua no GaaS), `tpCampanha` (vai para o CSV e o lookup), classificação de negócio, produto, template |
| `touches[]` | `sequence`, `weekKey`, `shared` (comum às redes) e `variants[]` (só o que muda por rede) |
| campo | `{ value, origin: xlsx/governed/inferred/missing, source, justification? }` |
| `pendencies[]` | `blocker` ou `review`, escopo, campo, mensagem |

Regras: `inferred` exige justificativa; `missing` exige valor vazio. Nunca inventar
benefício, condição, link, imagem, vigência ou elegibilidade.

## Chave estável e reimportação

`importKey = SEGMENTO|SEQUENCIA|REDE` (ex.: `CRM 3|E-mail 1|AMIGAO`), guardada em
`dynamic_email_briefings.import_source` com a base da planilha. Na reimportação, para cada campo:

| Situação | Decisão |
|---|---|
| planilha = GaaS | nada a fazer |
| só a planilha mudou | aplica |
| só o GaaS mudou | mantém o GaaS |
| os dois mudaram | conflito: mantém o GaaS até alguém decidir |

## Régua e chave do SFMC

O `segment` isola a régua **no GaaS**. O `tpCampanha` é o valor técnico do lookup. Duas réguas
do GaaS podem ter o mesmo `tpCampanha` quando só uma vai para o SFMC (caso de
TOPO DE FUNIL (CRM) 3, que exporta `CRM`). O editor avisa e a exportação bloqueia as duas no mesmo CSV.
