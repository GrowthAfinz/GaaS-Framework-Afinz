# Fluxo de Jornada — carregamento sob demanda

Implementado em 15/10/2026.

O operador escolhe Parceiro/B2C → Segmento → Jornada → Versão do pack e clica em **Abrir jornada**. A seleção anterior pode ser restaurada na sessão, mas não abre o grafo automaticamente.

- `read_journey_flow_directory()` retorna somente os identificadores dos packs e a classificação necessária aos seletores. Não consulta a visão de mensagens visuais nem retorna HTML, previews, fingerprints, grafo ou resultados.
- `read_journey_flow_detail(p_snapshot)` retorna os metadados de mensagens de uma única versão. É chamada junto com o manifesto somente após a abertura explícita. Mensagem completa, resultados e cobertura continuam sob demanda.
- O diretório cruza as classificações em conjunto, sem reprocessar o HTML por candidato. As correspondências exatas e aliases mantêm os mesmos nomes, canais e períodos de evidência. Não cria vínculos ou altera registros históricos.
- Todas as funções usam `security invoker`, autenticação e RLS existentes. O cache é restrito à sessão; importações e mudanças de vínculos o invalidam.
- Mudar um seletor fecha o fluxo anterior. Respostas antigas não repintam uma seleção nova. Falhas apresentam **Tentar novamente**.

Validação: contratos SQL com RLS, aliases e períodos; interação Playwright com serviços simulados; testes de navegação/cache/facetas; gate TypeScript e build de produção. O teste de interação pode ser executado com `node scripts/test-journey-progressive-ui.mjs` (requer Chromium do Playwright).

Medições em produção sob role `authenticated`, antes da publicação do frontend: diretório de 60 versões/176 ocorrências com 71.316 bytes em aproximadamente 587 ms; detalhe do maior pack em aproximadamente 605 ms. São medições pontuais de execução no banco, sem rede/renderização; não constituem SLA.
