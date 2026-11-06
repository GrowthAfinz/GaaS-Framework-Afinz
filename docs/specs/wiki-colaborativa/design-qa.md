# Design QA · Visa editorial

Status: passed · 06/11/2026

Referência: mockup 1 aprovado por Pablo. Comparação visual conjunta, referência e screenshot lado a lado, em .local-qa/screenshots/comparison.jpg. Evidências locais desktop-final.jpg, tablet-final.jpg e mobile-final.jpg; fixtures não entram no deploy.

A direção foi preservada: navegação à esquerda, documento branco amplo, hierarquia editorial, lime na ação principal, teal nos links, bordas retas, divisórias finas e ações mínimas. O conteúdo real é maior que o texto ilustrativo do mockup; mantém todos os grupos e regras da estratégia. A navegação global real do app continua existente; a fixture usa apenas um cabeçalho representativo.

## Correções realizadas

- P2: excesso de altura no início: metadados compactados, detalhes operacionais sob minimização e três atividades iniciais com Ver mais.
- P2: edição aberta permitia outra ação: bloqueio de ações simultâneas e proteção de recolhimento.
- P2: link de tarefa nova sem ID: ocultado até salvar.
- P2: popover da fonte escapava no celular: ancoragem ajustada para a largura do cabeçalho.
- P2: recuperação de rascunho: texto preservado em sessionStorage por usuário/nota, confirmação sobre versão divergente.
- P2: largura do cabeçalho sintético de QA em mobile: corrigida a fixture; documento mede 383/383 px e tablet 1017/1017 px de viewport/scrollWidth.

Sem P0/P1/P2 pendentes nesta superfície verificada. P3 aceito: altura maior que o mockup devido aos grupos reais, metadados de auditoria e resumo completo. O mockup não é usado como fonte de conteúdo nem para inventar responsáveis.

## Interações

Adicionar seção com tabela, salvar, excluir, restaurar revisão anterior e restaurar fonte original: verificados. Adicionar atividade, remover da nota e consultar a revisão resultante: verificados. Rascunho recuperado após reload e cancelamento: verificados. Teclado Control+Home e foco dos controles; mobile 390x844, tablet 1024x900 e desktop 1440x1024. Console sem erros na fixture.

Limite da evidência: UI de QA usa persistência local injetada; os contratos de persistência/autorização são testados separadamente em SQL. Não representa teste de envio ou implantação no SFMC.
