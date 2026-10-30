# Contrato do arquivo: gaas-emails-input/1

Nome do arquivo: `input_gaas_emails_<segmento>_<AAAAMMDD>.json`. Esquema completo em
`assets/contrato.schema.json`; exemplo válido em `assets/exemplo_input.json`.

- `contract`: sempre "gaas-emails-input/1". `status`: sempre "draft".
- `generatedBy`: `tool` ("claude", "chatgpt" ou "outro"), `model` (nome do modelo) e `generatedAt` (ISO-8601 com fuso).
- `source`: `kind` "conversa" ou "planilha"; `file` com o nome da planilha, quando houver.
- `ruler`: copie de `assets/reguas/<segmento>.json` (segment, partner, tpCampanha, templateSlotId).
- `emails[]`: um item por e-mail que muda.
  - `sequence` ("E-mail N") e `weekKey` ("Semana N"). E-mail novo usa o próximo número da régua.
  - `fields`: campo -> `{ "value", "origin", "source", "justification"? }`. `origin`: "ia" (escrito por você
    na conversa), "xlsx" (copiado da planilha; `source` = "Aba!Célula"), "inferred" (regra aplicada; exige
    `justification`) ou "missing" (valor que falta; `value` vazio).
  - `secondBlock`: lista de blocos (`references/blocos.md`). Obrigatório em e-mail novo; ausente em e-mail
    existente, o GaaS mantém o segundo bloco atual.
  - `networkOverrides`: rede -> campos, só quando uma rede precisa de texto próprio.
  - `factsUsed`: todo fato citado ("40 dias", "5%", "Visa"). Cada um precisa estar na ficha do produto.
- `pendencies[]`: o que depende do analista. `severity` "blocker" ou "review", `scope` (ex.: "E-mail 4"),
  `field` opcional e `message`.

A importação no GaaS separa o resultado em **Bloqueia** (não grava) e **Revisar** (o analista decide),
mostra a prévia de cada e-mail em cada rede e a diferença campo a campo para o que já existe.
Tudo entra como rascunho, com histórico de versões.