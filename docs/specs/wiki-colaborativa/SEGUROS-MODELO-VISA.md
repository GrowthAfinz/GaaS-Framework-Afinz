# Seguros: narrativa e fichas no modelo Visa

07/11/2026. Pablo autorizou continuar a implementação na main após corrigir a direção: Visa é referência de profundidade, narrativa e diagramas, além da aparência do leitor.

## Entrega

A nota de Seguros passa a explicar o percurso mensal/trigger e sua convivência, elegibilidade, DEVICE, controles de ciclo, automações, contratos de DE, atividades, SQLs disponíveis, configuração, validação, recuperação, medição e decisões pendentes. São dez tópicos, 34 fichas recolhíveis, três fluxos Mermaid e três SQLs completos de referência. O conteúdo técnico local anterior foi preservado, incluindo 153 linhas de campos de DE. Os SQLs do desenho anterior são identificados como referência e não homologação do desenho novo.

O mapa técnico identifica as atividades documentadas de `processos_seguros` e os passos propostos para mensal/trigger. O fluxo de movimento/snapshot de 04/11 fica separado, com sua compatibilidade explicitada. Não são criadas nem ativadas estruturas no SFMC.

As fichas recolhíveis recebem lápis próprio no leitor de estratégias. A edição substitui somente o trecho selecionado, preserva o restante da seção e rejeita uma âncora que mudou. O histórico, controle de revisão, recuperação do rascunho e permissões existentes continuam sendo usados. Não há alteração de RLS ou liberação de edição para novos perfis.

Os mapas longos têm altura inicial limitada e rolagem, além da ampliação existente. A nota mantém tópicos responsivos, superfícies claras, cantos retos e botão neutro de adição.

## Skill reutilizável

`gaas-estrategias-implementaveis` registra a narrativa enciclopédica, a gramática dos fluxos Visa, os contratos de fichas e a separação entre evidência, proposta e implantação. Inclui referências de Visa e de compatibilidade de Seguros, entrada no catálogo de skills e ficha no vault. A skill também foi instalada na conta local.

## Validação

- Testes de modelo/leitor: preservação de Mermaid e SQL, edição isolada, rejeição de âncora obsoleta e proteção de fichas vizinhas.
- Playwright local, com autorização explícita: renderização dos três Mermaid, lápis, prévia, salvar, cancelar, ampliação e zoom. Sem erros de página ou de renderização de fluxo; viewport de 390 px sem overflow horizontal da página. A persistência dessa conferência usa fixture local, não comprova uma gravação no SFMC.
- TypeScript de release sem novas regressões; catálogo de 38 skills validado por integridade e segurança de publicação.
- Vault recompilado e lint executado. O drift anterior das demais notas permanece fora desta entrega; não sincronizar o vault inteiro para publicar estas duas notas.
- O gate de CI e o deploy da main permanecem necessários antes de declarar a publicação concluída.

## Publicação da fonte

Sincronizar somente Seguros e a ficha da skill. Baseline remoto de Seguros: `46be8bd44fa3c365c59f50427b37e89543016965cee42be1ddcffd29d104e24b`, nota `25931632-8994-4550-8333-290419fd9a15`. Antes da gravação, comparar hash e ausência de documento operacional concorrente. Usar a RPC de upsert existente para preservar a revisão anterior, sem finalizar uma sincronização integral que possa apagar outras notas.

Coedição simultânea, comentários, menções, BlockNote e ampliação das permissões de edição continuam nas specs futuras abertas. Esta entrega não as implementa.
