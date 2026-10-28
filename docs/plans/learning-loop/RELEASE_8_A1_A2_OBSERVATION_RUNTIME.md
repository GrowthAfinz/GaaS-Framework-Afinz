# Release 8 — A1/A2: piloto de observação executável

## Aceite e limites

O A0 está registrado em `RELEASE_8_A0_ACCEPTANCE_2026-10-28.md`. São somente duas operações confirmadas; o seed amplo de 103 operações não faz parte desta implantação. O manifesto restrito é `release8/pilot-approved.json`, com seed reproduzível em `release8/pilot-seed.sql`.

A entrega permite avaliar e acompanhar o piloto no backend e no monitor da Fila. Não cria eventos, candidatas ou apostas, não altera métricas de origem, não ativa T3/T4, não publica relatório e não altera o job Google parado ou o ponteiro vivo. A3 (produtor de candidatas/episódios) e a prova do loop real permanecem etapas próprias.

## Executor

`growth-trigger-observer` tem autenticação própria: JWT validado por `auth.getUser` mais membership ativa de analyst/publisher/admin para reavaliar; worker somente com credencial interna já existente e validada no banco. Gateway JWT desligado é necessário para a credencial interna opaca, não dispensa a autenticação no corpo. Viewer não executa e anon não lê avaliações.

O executor consulta agregados consistentes por operação/mês via RPC, usa o motor puro existente, verifica integridade do artefato certificado para T6 e persiste entrada/saída com hashes e versões. Fonte/escopo/mês não viram zero por ausência. Falha de T6 não fabrica delta ou bloqueia indevidamente avaliações independentes de T1/T2/T5.

A configuração numérica é imutável e vinculada explicitamente por versão de configuração aos IDs de regra. Não há seleção ambígua entre todas as versões históricas. Repetição com entrada equivalente reaproveita o mesmo run; uma saída diferente para a mesma identidade é rejeitada. Consulta de dados, tentativa e resultado têm estados diferentes.

T6 permanece no grão de parceiro, derivado das abas congeladas e confrontado com o mesmo parceiro na base atual. O monitor explicita esse grão. Não há atribuição da revisão a uma das duas operações.

## Execução automática em observação

Triggers AFTER STATEMENT em activities enfileiram períodos afetados dos dois escopos, na mesma transação da escrita de origem. Fila só fica visível ao worker após commit; rollback de uma carga também desfaz sua marcação. Um período é marcado no máximo uma vez por transação, mesmo quando a RPC faz múltiplos UPDATEs internos.

Mudança de mês histórico reavalia o próprio mês e até seis meses seguintes, respeitando o limite do mês atual. Mês aberto permanece sem veredito de performance. Rajadas são agrupadas por período; lease e revisão impedem perder uma carga que chegue durante o cálculo. Tentativa que falha não avança checkpoint e tem até três tentativas automáticas, com erro visível. Reavaliação manual só consome a marcação que sua leitura cobriu e não toma lease ativo de outro worker.

A agenda a cada cinco minutos consome a fila e garante uma observação diária do último mês fechado e do mês aberto. T5 não depende de nova chegada; T6 é revisto também nessa rotina diária. A mudança de uma operação fora do piloto não dispara sua avaliação de performance. Os eventos são unidades transacionais confirmadas; uma importação dividida em múltiplas transações não recebe certificado fictício de completude do arquivo inteiro.

O cron nasce desabilitado e a configuração nasce pausada. A sequência de implantação é schema → seed restrito → função → habilitar observação → smoke autenticado → habilitar cron. A credencial existente é reutilizada sem aparecer em frontend, logs ou arquivos. A rotação dessa credencial deve continuar sendo governada no mecanismo existente.

## Monitor na Fila

Mostra observação, período avaliado, dois recortes, estados por métrica, valores/medianas disponíveis, frescor das seis fontes/partições e disponibilidade da revisão certificada. O mês corresponde ao fim da seleção da tela, não soma vários meses como uma avaliação única. “Atualizar” relê; “Reavaliar observação” executa com a sessão do operador autorizado.

“Ainda não avaliado”, “atualização pendente”, “em andamento”, “falha automática”, “dados incompletos”, “mês aberto” e “sem desvio detectado” são distintos. Um resultado anterior não esconde uma nova carga pendente. O monitor não aumenta o contador da Fila nem transforma diagnóstico em aposta.

## Gates e recuperação

Testes do motor mais os testes sintéticos de runtime cobrem autenticação/roles, ausência de baseline verificável, escopo aprovado, imutabilidade, deduplicação, RLS, rollback da ingestão, histórico de seis meses, leases e corrida de nova carga durante processamento. Testes de UI cobrem estados de atualização e ausência. Não há fixture com linhas individuais de produção.

Para pausar, desabilitar `observation_enabled` e o cron específico; manter runs/configurações/histórico. Não apagar tabelas, alterar fontes ou restaurar Google como tentativa de rollback deste componente. O smoke verifica dois runs (mês fechado e aberto), idempotência, erro 401/403 sem credencial, leitura por membership e preservação de candidatas/apostas/ponteiro.

Status de código, CI, implantação e smoke deve ser registrado no PR e na evidência da release; merge sozinho não equivale à implantação deste runtime.
