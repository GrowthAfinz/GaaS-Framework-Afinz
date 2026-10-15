# Fluxo de Jornada — carregamento sob demanda

Implementado em 15/10/2026.

O operador escolhe Frente → Parceiro/Público → Segmento → Jornada → Versão do pack e clica em **Abrir jornada**. A seleção anterior pode ser restaurada na sessão, mas não abre o grafo automaticamente.

- `read_journey_flow_directory()` retorna somente os identificadores dos packs e a classificação necessária aos seletores. Não consulta a visão de mensagens visuais nem retorna HTML, previews, fingerprints, grafo ou resultados.
- `read_journey_flow_detail(p_snapshot)` retorna os metadados de mensagens de uma única versão. É chamada junto com o manifesto somente após a abertura explícita. Mensagem completa, resultados e cobertura continuam sob demanda.
- O diretório cruza as classificações em conjunto, sem reprocessar o HTML por candidato. As correspondências exatas e aliases mantêm os mesmos nomes, canais e períodos de evidência. Não cria vínculos ou altera registros históricos.
- Todas as funções usam `security invoker`, autenticação e RLS existentes. O cache é restrito à sessão; importações e mudanças de vínculos o invalidam.
- Mudar um seletor fecha o fluxo anterior. Respostas antigas não repintam uma seleção nova. Falhas apresentam **Tentar novamente**.

Validação: contratos SQL com RLS, aliases e períodos; interação Playwright com serviços simulados; testes de navegação/cache/facetas; gate TypeScript e build de produção. O teste de interação pode ser executado com `node scripts/test-journey-progressive-ui.mjs` (requer Chromium do Playwright).

Medições em produção sob role `authenticated`, antes da publicação do frontend: diretório de 60 versões/176 ocorrências com 71.316 bytes em aproximadamente 587 ms; detalhe do maior pack em aproximadamente 605 ms. São medições pontuais de execução no banco, sem rede/renderização; não constituem SLA.


## Classificação da navegação — 15/10/2026

- Frente respeita as BUs selecionadas no cabeçalho global. B2C usa o seletor **Público / origem**; B2B2C usa **Parceiro**. O primeiro item é Todos os públicos/parceiros.
- Plurix apresenta **N/A** num bloco cinza não interativo. Selecionar a frente já habilita o segmento; não existe divisão por bandeira ou parceiro.
- Proprietaria/Proprietária e Institucional são o mesmo público de navegação, **Institucional**, conforme definição explícita do usuário. Valores ausentes ou N/A de outras frentes continuam sem identificação; não são convertidos automaticamente em Institucional.
- Identificação no nome do pack é fallback para frente/segmento e tokens explícitos de parceiro. Templates e revisões continuam disponíveis como fontes. Revisão de público da mensagem pode diferir do histórico: nenhuma classificação da peça é aplicada aos resultados de uma execução.
- O diretório mantém apenas metadados leves. O serviço associa a identidade da jornada às mensagens sem novas consultas. Conteúdo e grafo só são lidos após Abrir jornada.
- O acesso **Classificação pendente** preserva packs com campos faltantes. Packs parcialmente identificados também aparecem na frente conhecida em Todos os públicos/parceiros. Ausência de histórico não impede a consulta ao pack.
- Uma jornada compartilhada pode aparecer em mais de um público. O grafo completo é preservado; mensagens do recorte são destacadas e as demais permanecem acessíveis.
- No leitor da comunicação, **Classificação e fontes** distingue nome do pack, classificação da mensagem e valores registrados no histórico. O cache continua por sessão; seleções são salvas na chave v3 sem abertura automática.

Validação adicional: testes de alias Institucional, Plurix N/A, revisão versus execução, pares de BU/parceiro sem combinações inventadas, fallback do pack, pendentes e acesso ao grafo por público; interação em desktop/mobile com filtros globais, retry e respostas atrasadas. Auditoria somente de leitura do diretório real: 60 snapshots, sem mensagens inacessíveis pela navegação normal ou pelo acesso de pendências.
