---
tags: [engenharia, gaas, componentes]
tipo: engenharia
camada: codigo
tipo_diataxis: reference
atualizado: 2026-06-08
status: legado
fonte: codigo-gaas
status_original: confirmado
legado_desde: 2026-10-29
---

# Componentes por Aba

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver a documentação do repositório (`calendar-estrategico/docs/`) e o [[08-Engenharia/MOC-Engenharia|MOC de engenharia]].

Definição precisa: o roteamento é por estado (`viewSettings.abaAtual` no Zustand), resolvido por um bloco de `{activeTab === '...' && <View/>}` em `src/App.tsx`. Não há react-router.

O detalhe completo — árvore de componentes por aba, mapa aba→componente raiz, tabelas de peso — vive no repo: pasta [`calendar-estrategico/docs/reference/tabs/`](../../calendar-estrategico/docs/reference/tabs/) e a visão de arquitetura em [`calendar-estrategico/docs/explanation/system-overview.md`](../../calendar-estrategico/docs/explanation/system-overview.md).

**Ponto de atenção para quem navega o produto por fora do código:** hoje são **11 abas** na navegação, não 9 como o CLAUDE.md ainda registra — faltam lá `relatorio` (Relatório) e `explorador` (Explorador Avançado). `midia-paga` (Media Analytics) é renderizada fora do layout principal, como um mini-app à parte com identidade visual própria — ver [[Módulo-Paid-Media-Afinz]].

## Relacionado
- [[Arquitetura-Geral]]
- [[Modal-de-Disparo]]
- [[Modelo-de-Estado]]
- [[Originação-B2C]]
- [[MOC-Engenharia]]
