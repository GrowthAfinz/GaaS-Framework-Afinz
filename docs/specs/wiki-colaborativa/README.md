# Wiki colaborativa: plano de implementação

Versão 1.0 · 06/11/2026. Pedido: criar specs para planejar e implementar os ajustes na main e deixar evoluções futuras abertas em Correções e Melhorias.

Este pacote publica planejamento e registros SDD. Não declara a interface implementada nem altera permissões, schema ou conteúdo do vault. A main é o destino das entregas de implementação. O pedido atual autoriza publicar estas specs na main.

## Primeiro corte

| Spec | Entrega | Dependências |
|---|---|---|
| [WIKI-COLAB-01](WIKI-COLAB-01.md) | Layout compacto e atividades do piloto | Nenhuma |
| [WIKI-COLAB-02](WIKI-COLAB-02.md) | Persistência, versões e reconciliação com o vault | Nenhuma |
| [WIKI-COLAB-03](WIKI-COLAB-03.md) | Lápis em toda a nota e editor contextual | WIKI-COLAB-01, WIKI-COLAB-02 |
| [WIKI-COLAB-04](WIKI-COLAB-04.md) | QA integrado e release incremental na main | WIKI-COLAB-01, WIKI-COLAB-02, WIKI-COLAB-03 |

A UI compacta pode começar antes do backend; o lápis no corpo da nota só é liberado depois do salvamento versionado e da reconciliação. O aceite da entrega completa exige as quatro specs. Começar com a nota Visa, mantendo os mesmos dados e registros usados por Testes e Tarefas.

## Futuro aberto

| Spec | Evolução |
|---|---|
| [WIKI-COLAB-05](WIKI-COLAB-05.md) | Prova de compatibilidade BlockNote |
| [WIKI-COLAB-06](WIKI-COLAB-06.md) | Comentários, menções e sugestões por trecho |
| [WIKI-COLAB-07](WIKI-COLAB-07.md) | Blocos reutilizáveis e referências fixadas por versão |
| [WIKI-COLAB-08](WIKI-COLAB-08.md) | Criar atividade a partir do texto e modelos de estratégia |
| [WIKI-COLAB-09](WIKI-COLAB-09.md) | Coedição simultânea e presença |

Futuros ficam com feedback Aberto e trabalho SDD A planejar; não são recusados, aplicados ou priorizados para execução imediata. A prova BlockNote pode ser antecipada por decisão explícita sem comprometer a adoção. Usar JSON como armazenamento nativo só depois da decisão de modelo; Markdown e JSON não terão edições independentes.

## Contrato de aparência e interação

Manter identidade do GaaS: superfícies claras, slate, acento ciano/teal e Lucide. Introdução/intenção abertas; fichas, SQL e fontes recolhidos; bloqueios visíveis. Lápis 14–16 px, área de toque ~44 px, foco visível; setas e lápis separados. Texto edita no lugar; fonte/prévia para código e diagrama; painel lateral contextual único para atividade/histórico. Salvar/Cancelar e estados reais de gravação; abertura é preferência individual sem versão editorial. Respeitar reduced-motion, teclado, IME e mobile. Evitar caixas repetidas e preservar posição da leitura.

## Fontes e decisões

Código base verificado em origin/main 823d3fb. Componentes: VaultWorkspace, WikiNotesExplorer, WikiMarkdownSections, WikiDiagram, WikiPilotChecklist, WikiFeedbackBar e WikiDataBlocks. Persistência: gaas_vault_notes/revisions, growth_save_development_task e gaas_feedback_*. O schema vivo de registros foi consultado antes do cadastro.

Referências reais revisadas:

- [Motion: editor e adaptação de wikilinks](https://github.com/jiusanzhou/motion/blob/df5bbda7eb374cc01c0aa3e444b8286dab18bc50/client-web/src/components/editor/Editor.tsx). Conversões por regex não são garantia de fidelidade.
- [WorkLedger: link inline por identidade](https://github.com/gruberb/workledger/blob/16cbe6722c219e3657fee1861d5efd97442d2008/src/features/editor/specs/EntryLinkSpec.tsx).
- [Drafto: preservação do editor e mudanças externas](https://github.com/JakubAnderwald/drafto/blob/f8b0b329ddd1d896bf763ab68994a67333d6767c/apps/web/src/components/notes/note-editor-panel.tsx). UI de conflito não substitui revisão atômica no backend.
- [BlockNote: formatos e perdas na conversão](https://www.blocknotejs.org/docs/foundations/supported-formats).
- [BlockNote: blocos personalizados](https://www.blocknotejs.org/docs/features/custom-schemas/custom-blocks).

## Publicação e recuperação

Specs versionadas no Git e associadas a trabalhos do tipo spec no SDD. Correções e Melhorias recebe um item por spec, com URL do arquivo, escopo e dependências. Não alterar itens alheios ou iniciar processamento da fila. Não marcar feedback como aplicado pela simples publicação do documento.

manifest.json é o catálogo revisável do pacote; recibo de cadastro guarda IDs e links, sem credenciais. Registrar pela RPC existente com a identidade administrativa delegada configurada no ambiente. Reexecução consulta planning_key/spec_key e preserva registros existentes. Não criar migrations só para cadastrar planejamento.
