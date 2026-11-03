# Design QA — Iniciativas por frentes de negócio

Data: 03/11/2026.

- Referência: `docs/design/iniciativas-referencia-aprovada.png` (1487 × 1058).
- Captura preliminar: `docs/design/iniciativas-implementacao-inicial.jpg`.
- O cabeçalho da fixture de QA é uma moldura de teste; a área de iniciativas usa componentes e CSS de produção.
- Persistência na fixture é simulada; os contratos reais do banco foram testados separadamente.
- A captura inicial tem escala diferente da referência e antecede a última calibração de CSS.
  Não foi usada para declarar equivalência visual ou conclusão do produto.
- Comparação final lado a lado: pendente.
- QA anterior de AppsFlyer preservado em `docs/design/design-qa-appsflyer-anterior.md`.

## Estado da verificação

Implementação local com layout de três colunas, navegação, percurso, contexto, pergunta,
trabalhos, formulários e registro de decisões. Build passou; 20 testes de navegação/modelo e
três testes SQL passaram. O gate TypeScript não encontrou erros novos.

A prévia carregou no Chrome e sua árvore de acessibilidade foi observada. Tentativas de
captura após a normalização falharam. Ao inspecionar a janela identificada da prévia,
o controle de navegação foi interrompido por não conseguir determinar a URL atual com
confiança suficiente para aplicar a política. Nenhum mecanismo alternativo foi usado
para contornar a interrupção.

## Superfícies de fidelidade

- Tipografia: escalas e família definidas, calibração final pendente.
- Espaçamento: grid e ritmo implementados; última revisão ainda sem captura válida.
- Cores: tokens locais definidos conforme teal, lilás, âmbar e divisórias da referência.
- Assets: ícones da biblioteca existente; marca/cabeçalho reais preservados na aplicação.
- Conteúdo: textos e estados reais diferem dos exemplos ilustrativos; decisões não foram fabricadas.

## O que falta antes de publicar

1. Retomar navegador autorizado e capturar implementação na mesma escala e resolução da referência.
2. Comparar os dois artefatos juntos e corrigir diferenças P0/P1/P2.
3. Testar favorito, troca de frente/iniciativa, próximo passo, etapa, decisão e correção.
4. Validar estados vazio/erro e responsividade em viewport pequeno.
5. Aplicar apenas dados de contexto confirmados, sem transformar ilustração em estado real.
6. Atualizar documentação da Wiki e publicar após os checks.

final result: blocked
