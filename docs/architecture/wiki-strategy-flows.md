# Fluxos e fichas técnicas na Wiki

Padrão compartilhado pelos modos Leitura e Notas: narrativa curta → mapa amplo → regras → ficha técnica expansível → evolução e fontes.

Use um bloco Markdown `mermaid` para o fluxo. A Wiki renderiza SVG com tema neutro, decisões em losangos, DEs em cilindros e agrupamentos por etapa. Escreva o estado (rodando, proposta, a confirmar) no rótulo; cor não substitui a evidência. Mantenha a visão completa quando as dependências forem importantes. O leitor pode ampliar, ajustar zoom e percorrer com as barras de rolagem; Escape fecha o diálogo e devolve o foco.

Não incluir scripts, links de ação ou configurações Mermaid nos documentos. O renderizador restringe essas entradas, sanitiza o SVG e carrega o motor apenas quando necessário. Erro de sintaxe mostra um aviso e permite consultar a definição, sem quebrar a página.

Para uma ficha expansível, use delimitadores em linhas próprias:

````markdown
:::details VDV_APTOS · contrato e configuração
### VDV_APTOS

Finalidade, grão, chave, tipos, campos, ação de gravação, estado e fonte.

```sql
-- SQL de referência, com versão e estado explícitos
SELECT CPF FROM VDV_APTOS
```
:::
````

Não aninhar delimitadores. O conteúdo conserva Markdown, tabelas, wikilinks e SQL, sem habilitar HTML arbitrário. Delimitadores dentro de cercas de código são literais. Use cabeçalhos de nível 3 ou inferior dentro das fichas, pois a leitura da Wiki divide as seções por nível 2. Cada conjunto oferece Expandir tudo/Recolher tudo. Links por âncora abrem a ficha que contém o destino.

DEs: finalidade, estado, pasta/BU, sendable, grão, chave, campos, tipos, tamanhos, obrigatoriedade, atualização, dependências, validações e fonte. Tamanho não comprovado deve ser indicado como a confirmar, não inventado.

Automation: nome, BU/MID, frequência, ordem sequencial, origem/destino, ação, anotações, SQL vigente versus proposto, conferências e critérios antes de ativação. Documentação publicada não comprova implantação nem autoriza execução.

Caso de referência: `05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md`, com fonte canônica no vault pai e cópia viva em `gaas_vault_notes`. O repositório é público e não guarda notas. Ao revisar: editar a fonte, executar bundle/lint e sincronizar o Supabase sem tombstones de inventário parcial. Não aplicar este modelo a todas as notas indiscriminadamente.
