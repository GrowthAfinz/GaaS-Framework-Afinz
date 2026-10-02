# Resultados, evolução e retrospectivas
## Acesso e navegação
Framework → Aquisição abre o explorador. Framework → Aprendizado e Memória abre Resultados. Wiki permanece ao lado da Fila; sua entrada Resultados abre o dossiê no mesmo contexto. Os demais exploradores continuam em Explorar.
URL: `?view=learning&section=results&result_domain=crm&result_month=2026-09`. Filtros usam `result_bu/segment/partner/channel/campaign/type`; o retorno de uma aposta preserva esses valores.
## Contratos
- CRM: `activities`, leitura completa e paginada. Medidas: cartões, propostas, custo registrado e razão pareada. Dimensões: BU, segmento, parceiro canônico, canal. Grupos com mesma Activity Name/data/BU/canal são excluídos preventivamente, antes dos filtros. Nenhum registro original é alterado.
- Mídia: `paid_media_metrics`. Medidas: cliques, impressões, investimento registrado e CTR recalculado. Plataforma e campanha. Alias único fornece identidade canônica, sem certificar objetivo/evento. Linhas com cliques maiores que impressões não entram no CTR. Conversões de plataforma, alcance/frequência, CPA e cartões não são intercambiáveis.
- B2C: `b2c_daily_metrics`. Total é a população padrão; Serasa e CRM registrado têm dossiês independentes. Não somar essas populações. O dashboard existente também passa a ignorar componentes CRM no bucket total.
- Dias fechados em America/Sao_Paulo. Comparação com o mês anterior usa o mesmo dia de corte, limitado ao tamanho do mês. Dias ausentes não são zero e cobertura é explícita.
- Somas usam valores não nulos, finitos e não negativos; nenhuma medida conhecida gera null. Taxas usam pares compatíveis, não média de percentuais. Meses sem linhas permanecem lacunas.
- Paginação reconcilia contagem inicial/final e quantidade recebida. Uma falha em qualquer página rejeita a leitura completa. Isso não é um snapshot transacional do banco; alterações simultâneas de valores podem exigir atualização.
- Cache de cinco minutos em memória, por usuário e domínio. Sem dados operacionais no bundle ou localStorage dessa funcionalidade.
## Retrospectivas
`growth_result_retrospectives`: domínio × escopo normalizado × primeiro dia do mês × revisão. Campos: observação, interpretação, aprendizado provisório, próxima ação e evidências. Um snapshot agregado da leitura acompanha a revisão.
Leitura/escrita exige autenticação; autor é auth.uid(). UPDATE e DELETE não são concedidos e o trigger impede mutações. A RPC `growth_append_result_retrospective` serializa revisões por escopo/período e rejeita gravação baseada em revisão anterior. Histórico exibe as últimas 50 versões.
Retrospectiva não publica automaticamente um aprendizado validado em Memória. A ação segue por aposta contextual (`results_dossier`), execução, outcome e validação do loop existente.
## Validação
`npm test`, `npm run typecheck:release`, `npm run build`.
SQL real em PostgreSQL: `node --test scripts/test-growth-results-dossiers.mjs`, incluído no gate de CI. Verifica RLS, anonimato, autoria, versões, conflitos, imutabilidade, escopo e aposta contextual.
QA visual isolado usa dados sintéticos, sem gravar no Supabase. Não é certificação do resultado de negócio.
## Conhecimento canônico
Racional operacional: `Afinz-CRM-Midia-Vault/07-Evolucao/Resultados-Evolucao-e-Retrospectivas.md`. Definições permanecem no vault; retrospectivas são registros operacionais versionados, separados da memória validada.

