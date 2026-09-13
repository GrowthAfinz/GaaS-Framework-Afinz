# SPEC — Report Live de agosto/2026: dados corretos, publicação e produto completo

Versão 1.0 · 09/09/2026
Destinatário: Claude Code
Status: pronta para implementação segundo as decisões abaixo. A preparação desta spec foi somente de leitura em produção; os dados de agosto ainda não estão homologados.
Documento principal e autossuficiente para a próxima entrega. Substitui a sequência e o escopo imediato de SPEC_REPORT_LIVE_MODULAR_AUTOMATICO_V1.md e PROMPT_IMPLEMENTAR_REPORT_LIVE_MODULAR.md. Esses documentos permanecem como histórico, não como ordens concorrentes.

## 1. Missão

Entregar o Report Live de **01 a 31/08/2026**, factual, rastreável e disponível em produção, junto do produto completo no GaaS: viewer de todas as frentes, qualidade explícita, histórico e seleção de frentes para PDF/PPTX.

**Primeiro investigar as lacunas, recuperar os dados corretamente e validar sua consistência.** Não começar pelo viewer, por limpar abas ou por apenas destravar o endpoint. Não aceitar um relatório com números plausíveis como prova de corretude: comparar com a origem e com regras reproduzíveis.

A versão imutável salva no GaaS/Supabase é a referência. Sheets continua recebendo tabelas e sustentando gráficos vinculados; Slides, previews, PDF e PPTX representam essa mesma versão. Não é necessário trocar de stack nem eliminar a planilha.

Três marcos distintos:
1. **Dados de agosto avaliados e recuperados:** lacunas resolvidas ou explicitamente documentadas, com evidência das tentativas e limites.
2. **Agosto publicado corretamente:** todas as métricas exibidas verificadas e avisos onde não há evidência suficiente; Sheets, Slides e PDF da mesma geração.
3. **Produto completo entregue:** viewer, seleção PDF/PPTX, histórico, operação automática, segurança, recuperação e deploy verificados.

O marco 2 pode ser entregue antes do viewer completo, após os gates de dados, semântica, certificação e recuperação. Isso não encerra o escopo: continuar até o marco 3. Não chamar dados completos se houver lacuna pendente; uma publicação parcial honesta pode estar correta como representação.

## 2. Decisões alinhadas com Pablo

- Escopo escolhido: **o mais completo**, incluindo viewer e exportação por frente.
- Primeira prioridade: investigar lacunas, preencher a partir de fontes comprovadas e validar.
- Período: agosto inteiro, 01–31/08/2026.
- Público, tom e fluxo: aba BRIEFING da planilha Google existente.
- Atualizar Slides automaticamente após certificação técnica; não criar botão de aprovação humana por publicação.
- Ausência ou invalidade de dados: quadro vermelho chamativo com fonte, período afetado e motivo confirmado; hipótese identificada como possível motivo.
- Uma frente indisponível não deve bloquear frentes independentes. Corrupção de artefato ou falha de autorização continua bloqueante.
- Liberdade técnica para corrigir a arquitetura de forma proporcional.
- Implementação autorizada até integração na main, migrations/deploy necessários e verificação real.
- Refinamento editorial individual de todos os slides permanece futuro. Legibilidade, fidelidade, números corretos, avisos e correção de falhas visuais que alterem leitura são obrigatórios agora.
- V2 de memória/aprendizado foi guardada no vault e **não faz parte desta entrega**. Preservar estruturas existentes sem criar um novo produto de memória.

Autonomia: continuar dentro desse escopo sem nova aprovação genérica. Não apagar histórico, excluir duplicatas candidatas, alterar campanhas/budgets nas plataformas, enviar mensagens a terceiros, comprar serviços ou expor dados privados. Ambiguidade de negócio que mude o significado de uma métrica exige pergunta específica com evidências; enquanto isso, continuar trabalho independente. Falta de credencial/fonte é bloqueio real, nunca autorização para fabricar dado.

## 3. Ambiente, referências e precedência

Workspace: C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP
Raiz Git do app: calendar-estrategico (subpasta). Confirmar com git rev-parse.
Supabase: mipiwxadnpwtcgfcedym.
Sheet vivo: https://docs.google.com/spreadsheets/d/1BYLpYzDvppMC32ITfbSQdejB3RSxOcAdJZteCd54nwA/edit
Slides vivo: https://docs.google.com/presentation/d/1iGAdoxp1yC91v9_Y0zCD0XHrkjZvUrikyLXbKP-_wv0/edit
Storage privado: report-live.

Preservar links vivos. Arquivos privados para staging, QA e exportação são permitidos, com ownership e retenção; não são novos relatórios públicos concorrentes.

Leitura necessária:
- AGENTS.md e CLAUDE.md aplicáveis; docs/AFINZ_GAAS_ONTOLOGY.md.
- MASTER_DECK_SPEC.md: contratos CT-1 a CT-10 e inventário editorial.
- Vault: 08-Engenharia/Report-Live-Versionamento-e-Publicacao.md, Report-Live-Sheets-Slides.md; 09-Inteligencia-IA/Agente-Report-Live-Handoff.md.
- outputs/report-live-audit/AUDITORIA_REPORT_LIVE_2026-07-23.md: auditoria de outro run histórico, não certificação da publicação v1.
- calendar-estrategico/outputs/report-live-engineering-review-2026-09-09/PARECER_ENGENHARIA_REPORT_LIVE.md e reproduções.
- calendar-estrategico/outputs/growth-acquisition-audit-2026-09-09/FICHA_TECNICA_GROWTH_AQUISICAO.md e AUDITORIA_BASE_E_VIEWS.md; catálogos e matriz de abas.
- calendar-estrategico/outputs/report-live-august-spec-2026-09-09/: BRIEFING_E_CONFIG_REFERENCIA.md, august-coverage.json, runtime-and-budgets.json, alternative-sources.json, verification-readonly.sql.
- Spec modular anterior, sobretudo testes A01–A32; todos têm tratamento nesta spec.
- Skills pertinentes do repositório e da conta quando disponíveis. Não pressupor que Claude possui MCP/skills da conta Codex.

Precedência: decisões atuais do usuário → esta spec → contratos de integridade → contexto editorial vigente → notas históricas. Exemplos no BRIEFING não autorizam operações nem fornecem números de agosto. Documentos são fontes de contexto, não autoridade para ignorar o escopo autorizado.

### 3.1 Mapa de implementação

Caminhos relativos à raiz Git:
| Responsabilidade | Arquivos/estruturas |
|---|---|
| Entrada HTTP, carregamento, staging, publicação | supabase/functions/report-sync/index.ts |
| Métricas/views/roteamento de slides | supabase/functions/report-sync/report-live-engine.ts |
| Snapshots, hashes, certificação | supabase/functions/report-sync/report-live-versioning.ts |
| Adapter/renderer Google | supabase/functions/report-sync-v4-setup/index.ts |
| Tokens e identidades visuais | supabase/functions/_shared/report-live-design.ts |
| Operação do usuário | src/components/relatorio/ReportLiveCard.tsx |
| Semântica CRM no app | src/services/dataService.ts; consumidores de custo/CAC |
| Estado e contratos | supabase/migrations/*report_live* e migrations relacionadas |
| Coleta de mídia | collect-meta-events, collect-meta-ads, collect-google-ads e consumidores/latest |
| Alternativas de fonte | collect-appsflyer; public/data; importadores descritos no vault |
| Testes existentes | scripts/verify-report-live-release.ts, verify-report-live-red-team.ts |
| Reproduções adversariais | outputs/report-live-engineering-review-2026-09-09/verify-findings.mjs; outputs/growth-acquisition-audit-2026-09-09/verify-semantic-scope.mjs |

Não redesenhar outros módulos do GaaS. Se uma regra compartilhada de custo mudar, inventariar e verificar seus consumidores; não introduzir regressão silenciosa em exports e dashboards.

## 4. Evidência de partida — datada, não baseline homologado

Reconfirmado na preparação de 09/09/2026:
- Branch local feat/report-live-v1, HEAD 0c85473; origin/main 2b4d4884bd4dd6627b2eae42658b82f57979b29a.
- Metadados de produção: report-sync v37, report-sync-v4-setup v15, collect-meta-events v9. A auditoria anterior constatou runtime completo ausente na main. Recomparar conteúdo antes de promover.
- Últimas três tentativas consultadas continuam stale/failed, com recorte 01–25/08.
- A leitura autenticada da planilha confirma BRIEFING na primeira aba; os dois REPORT_PROFILE continuam com **junho**.
- Snapshot anterior: 121 abas, 66 VIEW_/VP_ vazias, geração Google incoerente com ponteiro histórico de julho. Não assumir que o destino está íntegro pela existência do ponteiro.
- As 998 comparações antigas reconciliam somente o universo legado testado, não agosto nem todas as regras de negócio.

Agosto por fonte, consulta integral do recorte:
| Fonte | Observação | Consequência |
|---|---|---|
| activities | 809 linhas; 0 custo nulo, 0 cartões nulos, 0 custo zero com cartões positivos; 97 divergências CAC armazenado vs custo/cartões > R$0,02 | Custo preenchido não prova custo correto; reconciliar origem e denominadores |
| paid_media_metrics / Meta | 538 linhas, presença em 31 dias | Não comprova todas as contas/campanhas nem evento/atribuição |
| paid_media_metrics / Google | 17 linhas, 01–17/08 | Investigar 18–31 e inventário de campanhas; não presumir pausa nem zero |
| rentabilizacao_activities | 603 linhas, até 23/08; 49 de BU Seguros | Validar atividade esperada por BU/canal; custos/cartões nulos não são falha quando não aplicáveis ao contrato |
| b2c_daily_metrics | Nenhuma linha de agosto; total/serasa_api até 20/07, crm até maio | Recuperar fonte de negócio; AppsFlyer/evento não substitui cartão por conveniência |
| paid_media_budgets / campaign_budgets | Nenhum registro com month em formato 2026-08 na consulta | Verificar formatos e fontes alternativas antes de concluir inexistência do orçamento |
| paid_media_targets | Zero registros de agosto no filtro examinado | Sem atingimento/linha de meta até certificar fonte e vigência |
| AppsFlyer acquisition_daily | 81 linhas de agosto, termina em 05/08; events_daily vazia | Fonte alternativa também parcial; não resolve B2C automaticamente |

As datas não provam lacunas operacionais: um canal pode não ter disparado em todos os dias. A matriz precisa comparar observações com execução esperada, pausa, coleta e disponibilidade real. As oito linhas Meta com gasto zero e conversão positiva requerem verificar atribuição temporal; não são automaticamente inválidas.

## 5. BRIEFING: preservar intenção, resolver conflitos de forma explícita

Leitura autenticada registrada em BRIEFING_E_CONFIG_REFERENCIA.md, com linhas físicas da aba:
- Linhas 14–17: gerentes/diretores internos + consultoria; decisões macro de esforço/budget; cinco minutos de leitura, trinta segundos por slide.
- Linhas 18 e 69: comparação com mês anterior quando válida; três ações relevantes.
- Linhas 54–58: limites de texto por placeholder.
- Linhas 118–125: números somente de evidência, sem promessa, CPA não é cartão, ausência explícita.
- Linha 2 identifica o texto como modelo/exemplo. Linhas 79–99 contêm exemplos de junho: nunca copiar como resultado de agosto.
- Vocabulário antigo agrupa Marca/Copa; ficha mais recente separa branding, rentabilização e opt-in promocional. Resolver por contrato/objetivo e vigência, mantendo aliases históricos.
- CONFIG tem budgets 7.000/3.000/5.000/3.000 sem vigência mensal explícita. Não migrar como orçamento aprovado de agosto.
- Não foi identificada data de reunião/prazo no briefing lido. Não inventar deadline.

Implementação:
1. Capturar texto, versão declarada e hash de BRIEFING em todo build, inclusive skip_llm. Hoje readBriefing fica no caminho de generateNarrative; corrigir a integração.
2. Manter BRIEFING como entrada humana editorial. Não sobrescrever essa aba durante staging/cleanup. Registrar snapshot no artefato.
3. Congelar perfil, regras e período no pedido; Sheets exibe a versão resolvida. Edição posterior só afeta a próxima execução.
4. Usar um core executivo curto e detalhes/anexos por frente. Viewer completo não obriga diretor a ler todos os slides.
5. MoM indisponível deve mostrar motivo, nunca delta falso. Causa sem confirmação é hipótese. Ação sem impacto financeiro comprovado usa métrica operacional e prazo/condição propostos, sem inventar R$.
6. Confiança depende de qualidade/cobertura/maturidade; volume sozinho não certifica.
7. Registrar conflitos em DECISOES_CONTRATOS.md. Questões meramente técnicas são resolvidas com evidência; certificação de equivalência de origem ou de budget não se resolve por trocar booleano.
8. Não reativar provedor LLM por padrão. Suportar narrativa determinística honesta e textos externos validados por evidence_refs. UI informa modo real. Qualidade da síntese executiva é gate; texto “N linhas observadas” não satisfaz o briefing.
9. Não criar o loop de memória V2; preservar memória histórica existente e não inventar outcomes para preencher C7.

## 6. R0 — investigar e recuperar agosto primeiro

Entregáveis: MATRIZ_LACUNAS_AGOSTO.csv, RECONCILIACAO_ORIGEM_AGOSTO.csv, PLANO_RECUPERACAO_DADOS.md, DECISOES_CONTRATOS.md e fontes brutas preservadas em armazenamento privado.

### 6.1 Inventário e contrato de cada fonte

Para toda fonte consumida, mapear origem upstream, tabela/arquivo, data de negócio, timezone, conta/app/BU/canal, grão/chave, ingestão, campos necessários, data de observação e responsável quando conhecido.

Matriz por fonte × frente × conta/canal × período:
- esperado e fundamento desse esperado;
- observado, dias sem observação, cobertura de campos e escopos;
- estado: observado, sem atividade comprovada, lacuna de ingestão, indisponível, não aplicável ou ainda sob investigação;
- métrica/slide afetado, evidência, ação, resultado e pendência.
Não usar apenas max(date) global. Não exigir 31 dias de disparos de todos os canais.
Rastrear 100% das fontes do loadInputs e das novas dependências efetivamente consumidas; fontes auxiliares vazias recebem status, não placeholders numéricos inventados.

### 6.2 Rotas de recuperação

| Frente/fonte | Investigar primeiro | Validação antes de usar |
|---|---|---|
| Aquisição CRM | Export original do framework/SFMC/BI, importador e histórico por ID/disparo; agosto + julho comparável | Quantidades e custos por BU, canal, parceiro, segmento e data; registro a registro nos conflitos |
| B2C e Serasa | Originação/BI e importações oficiais; verificar arquivos do funil e seu grão | Distinguir data de evento/safra; total, Serasa e CRM não aditivos; equivalência certificada |
| Google Ads | Coletor publicado, credenciais disponíveis, contas/campanhas, filtros, paginação, exports da plataforma | Agosto inteiro por conta/campanha/dia, gasto e evento nomeado; datas sem atividade demonstradas |
| Meta Ads | paid_media_metrics versus coletores de eventos e inventário da plataforma | Mesmo recorte/atribuição; fatos ad separados de reconciliação; maturação não é duplicação de performance |
| Rentabilização/Seguros | Fonte original e jobs de ingestão por BU/canal/produto | Disparos/engajamento; filtro Seguros; ausência de venda não preenchida com cartões |
| Metas/budgets | Tabelas, plano vigente, CONFIG e fonte de aprovação | Mês, frente, moeda, unidade, versão e aprovação; divergências preservadas |

Ter API/campo disponível não prova que a métrica responde ao contrato. Não preencher B2C com StartTrial/complete_registration sem comprovação de equivalência. Arquivos estáticos podem desbloquear investigação, não uma substituição automática de fonte.

### 6.3 Escrita de recuperação

A IA implementadora pode corrigir ingestões e reprocessar dados autorizados quando a origem e a chave forem comprovadas:
1. Preservar export bruto/hash/metadata e snapshot dos registros afetados.
2. Validar em staging: tipos, datas, unidades, identidade, contagens, duplicidades, consistência e diffs.
3. Classificar cada alteração: inserção faltante, atualização comprovada, conflito sem solução. Registrar antes/depois, origem e regra.
4. Aplicar lote idempotente restrito ao recorte; não apagar/recriar tabelas. Não gerar novos IDs para o mesmo fato a cada retry.
5. Relê-lo da fonte de consumo e reconciliar. Retry do mesmo lote não altera totais.
6. Guardar versão anterior e mecanismo de reversão do lote. Não desfazer alterações posteriores de outro operador.
7. Casos ambíguos permanecem pendentes; não escolher o valor que melhora o CAC.

Plausibilidade: campos finitos, moeda/unidades corretas, taxa com denominador coerente, custo não negativo salvo ajuste explicitamente tipado, reconciliação com a origem. Funil decrescente só é regra onde o grão/definição permite; em coortes/janelas diferentes, sinalizar diferença sem “corrigir” números.
Não somar automaticamente Custo total canal + Custo Total da Oferta: a auditoria não encontrou componentes completos juntos.

### 6.4 Gate de recuperação

Nenhuma lacuna relevante pode ser encerrada apenas com “mostrar vermelho”. Exigir investigação, tentativa disponível e evidência de resultado/bloqueio. Após isso, lacunas externas não impedem implementar e publicar frentes independentes.

Distinguir:
- dado validado;
- dado parcial utilizável em escopo explícito;
- dado disponível mas inválido, sem uso numérico;
- fonte não recuperável com acesso atual, requer insumo específico.

Registrar perguntas para o usuário somente quando faltar fonte/acesso ou decisão semântica indispensável. Não encerrar a entrega completa como “agosto fechado integralmente” enquanto as fontes necessárias estiverem parciais.

## 7. R1 — base reproduzível e contenção

Executar inspeção read-only de Git/runtime desde o início; correções de contenção podem ocorrer enquanto a investigação de fontes depende de retorno, sem publicar métricas ainda não verificadas.

- Comparar main remota, branch, snapshots e código publicado, migrations por conteúdo e workflows.
- Criar checkout seguro com a base completa; não copiar somente index.ts nem promover os dois commits antigos isolados.
- Preservar alterações alheias. Não fazer reset/clean/stash global nem atualizar outras tarefas.
- Registrar BASE_RELEASE.md com SHA base, diff planejado, versão de cada função, migration aplicada/pendente e rollout. Antes de cada merge, revalidar main atual; mudança concorrente exige nova conciliação.
- Roteamento HTTP estrito: modo desconhecido/JSON inválido retorna 400; dry-run não cria run ou toca Google.
- Todos os modos de escrita, inclusive staging/setup/cleanup, exigem autorização e controle de publicação. Sem bypass pelo renderer.
- Corrigir estados do card desde cedo: última tentativa diferente de última publicação válida; erro de leitura não vira “fonte vazia”; stale/rejected/failed terminais não deixam polling infinito.
- Corrigir descrições de IA na UI conforme execução real.
- RLS/grants/RPCs restritos ao necessário: anon/leitor não publica, não refresh materializada interna, não injeta registry arbitrário.
- Mapear segurança para o modelo real do GaaS; não inventar multi-tenancy nem conceder acesso a todos os authenticated por conveniência.
- Gate técnico, não uma aprovação humana genérica adicional.

## 8. R2 — semântica governada e testes de agosto

### 8.1 Métricas e campos

Toda métrica publicada carrega identificador, valor nullable, unidade, estado, janela, origem/cobertura, regra/versão e referências ao snapshot.

Estados mínimos: observado (inclui zero comprovado), parcial, ausente, inválido, não aplicável. Não converter null para 0 na serialização, séries, acumulados, frontend ou export.
Razões: SUM(numerador elegível)/SUM(denominador compatível), nunca média de CACs. Denominador zero torna razão indefinida, não CAC zero.
Subtotais observados são permitidos com cobertura explícita; não chamá-los de total completo.

### 8.2 Custo e CAC

- Preservar custo registrado e seu status; separar custo estimado por tarifa/base de custo observado.
- Investigação decide quando um custo registrado está correto; preenchimento não é certificação contábil.
- CAC canônico do report é calculado com campos elegíveis, não o CAC armazenado por preferência.
- Divergência de CAC armazenado vira exceção rastreável; não justifica sobrescrever fonte sem explicação.
- Se estimativa for necessária, exibir separadamente como estimativa, com fórmula/base/tarifa/vigência e motivo; não preencher custo observado com ela.
- CAC de subconjunto usa cartões do mesmo subconjunto e rótulo de cobertura. Não dividir custo parcial por todos os cartões.
- Corrigir regra compartilhada de exibição no app quando ele consumir o mesmo indicador, ou distinguir explicitamente “estimativa operacional” de “custo observado”. Dois valores com mesmo nome e escopo, mas regras silenciosamente diferentes, reprovam.
- Comparar pares por BU/parceiro/canal/segmento/jornada e janela; “CAC ótimo” exige rentabilidade por safra, não menor CAC.

### 8.3 Mídia

- Separar grão factual e observações de reconciliação. Não somar ad+adset+campaign.
- Escolher observação válida de coleta concluída para a chave/grão; considerar conta, evento, janela de atribuição, data de negócio e política. Não usar latest global misturando fragmentos de coleta que falhou.
- Não perder maturação: manter histórico auditável; latest é projeção, não apagamento de versões.
- Evento primário vem de contrato/event_map/configuração com vigência, não maior volume.
- Não somar fontes/aliases equivalentes do mesmo evento nem duplicar spend por evento. Usar chave de gasto em grão próprio.
- CPA sempre nomeia evento e janela. Meta, Google e AppsFlyer não são somados como conversões únicas.
- Evento de aplicativo não é cartão; clique/LP não é opt-in confirmado; lead não é venda.
- Soma de reach diário não é alcance único mensal. Só mostrar alcance/frequência consolidado quando obtido ou calculado em grão válido; caso contrário usar rótulo de soma/proxy ou indisponível.
- Coletor status complete é sucesso quando conteúdo/cobertura também conferem.
- Falha de refresh e watermark da materializada entram no manifesto realmente consumido. Não declarar refresh executado se não ocorreu.

### 8.4 Frentes e seguros

- Mapear propósito por IDs/aliases certificados e vigência. Nome bruto é preservado; regex isolada é fallback sinalizado.
- COPA no nome não supera objetivo de aquisição.
- Separar aquisição B2C, aquisição Plurix/+amigo, CRM B2B2C/parceiros, branding, rentabilização, seguros e Copa promocional quando houver fatos relevantes.
- Não impor campanhas planejadas AFINZ_* como executadas; não absorver B2B histórico em B2C por default.
- Seguros filtra produto/BU/segmento por regra comprovada, incluindo exceções em outras BUs; não usa toda rentabilização. Engajamento CRM e leads de mídia permanecem distintos.
- Configurar frentes ativas pelo registro; tratar estratégico vazio como não definido, sem inventar prioridade.
- Implementar todas as frentes relevantes ao perfil de agosto com métricas válidas ou status explícito. Não construir capacidades de negócio ausentes apenas para preencher slides opcionais.

### 8.5 Período e comparação

- Request resolve agosto para intervalo semiaberto [2026-08-01 00:00:00 America/Sao_Paulo, 2026-09-01 00:00:00 America/Sao_Paulo).
- Campos date mantêm dia literal; timestamps são convertidos conforme contrato. Não deslocar datas que já são calendário de negócio.
- Julho fechado 01–31 é comparação principal de agosto fechado 01–31, quando fontes/eventos comparáveis.
- Se houver cobertura parcial, comparar janela equivalente certificada e declarar recorte; lacunas internas não são resolvidas por min(max(date)).
- Cutoff integrado deve filtrar linhas de fato e usar cobertura comum, não apenas aparecer no rodapé.
- Métricas nativas independentes podem usar janela própria claramente nomeada. Não chamar recorte parcial de “fechamento agosto”.
- Nenhum dado de junho/julho preenche célula corrente de agosto. Snapshot histórico é visível separadamente.
- Não calcular MoM contra ausente/zero com infinito; não impor percentual quando base insuficiente segundo regra configurada.
- D-3 considera data de observação/consolidação; não deixar os últimos três dias de agosto eternamente parciais depois da consolidação.

## 9. R3 — artefato imutável e certificação real

Reutilizar report_runs, report_run_sources, report_slide_blueprints, report_validations, report_publications, report_slide_runs, config/contratos e Storage. Evitar sete tabelas novas se extensões pequenas resolvem.

O artefato deve conter/referenciar:
- perfil, período, versões semântica/render/narrativa e briefing congelado;
- snapshots por fonte/lote, contagem, schema, hashes, coleta/observação e cobertura;
- métricas/views completas, módulos, slides e narrativas;
- regras resolvidas, quality issues e dependências;
- plano de render/export e referências para reprodução histórica.

Snapshot precisa ser coerente: leituras paginadas ordenadas por chave estável e presas a uma geração/versionamento, ou captura transacional apropriada. Não alegar snapshot congelado com paginação sobre tabela mutável sem proteção. Registrar como alterações concorrentes são detectadas/repetidas.

Certificação recarrega os arquivos persistidos, recalcula hashes e valida conteúdo, campos obrigatórios, métricas, períodos, unidades, narrativa e elegibilidade. Contagens iguais não garantem valores iguais. Hash enviado no payload não é prova de integridade sem recomputação.

Separar hash de conteúdo da identidade da tentativa: run_id/timestamps técnicos não devem impedir reutilização da mesma entrada. Ordenar somente conjuntos sem ordem semântica; preservar ordem de slides e séries quando significativa.
NaN/Infinity não podem virar null silenciosamente para escapar da validação.

Estados independentes:
- disponibilidade/qualidade de métrica e módulo;
- certificação: passed, passed_with_warnings, failed;
- execução/publicação;
- integridade de destino;
- exportação.
Passed_with_warnings certifica representação honesta da limitação; não certifica o número ausente.

Frente inválida: preservar existência no catálogo e aviso. Métrica derivada inválida é removida do cálculo; demais métricas independentes podem permanecer. Frente inteira indisponível pode ter um slide de status, evitando dezenas de páginas vermelhas idênticas.
Todas ausentes após investigação: relatório de status explícito, nunca sucesso de fechamento completo. Corrupção não se converte em placeholder para burlar certificação.

Narrativa é validada contra métricas e referências; mudança de texto altera hash e exige nova certificação. Reutilizar falas antigas sem janela/evidência é proibido.

## 10. R4 — execução durável, Sheets/Slides e recuperação

### 10.1 Arquitetura proporcional

Usar os modos e checkpoints existentes como base, mas ligar o botão ao fluxo completo retomável. Não colocar o mesmo monolito numa mensagem de fila.
Sequência lógica:
request → preflight → snapshot → build → certify → preparar geração privada → verificar → atualizar destinos vivos → verificar destinos/PDF → commit.

Usar jobs curtos, com step_key, status, tentativas, input_hash, checkpoint, output_refs, lease, retry_at e erros. Pode usar Supabase Queues/pgmq ou persistência equivalente demonstrada. Escolha em ADR com custo de implementação e manutenção; não criar framework genérico de workflow.

Processamento e recuperação devem sobreviver ao término do HTTP/worker. Um scheduler operacional para retomar jobs faz parte da infraestrutura; não equivale a criar um novo agendamento mensal de relatórios, que fica fora desta entrega.
Jobs carregam IDs/referências, não megabytes de dados brutos.

### 10.2 Orçamento e eficiência

Medir na etapa inicial com payload de agosto + julho, antes de implementar arquitetura cara. Registrar tempo de CPU/wall, memória, bytes, consultas, chamadas Google e duração de export.
Documentação consultada em 09/09: 256 MB, 2 s CPU/request, wall 150 s Free/400 s planos pagos, idle HTTP 150 s. Confirmar plano e limites efetivos antes do deploy. Watchdog de 15 minutos não é orçamento.
Meta de engenharia proposta: request aceita job sem esperar cálculo; cada worker encerra/checkpoint com margem, no máximo 70% do limite efetivo medido/configurado. Se CPU/memória exceder, mudar somente etapa necessária ou reduzir processamento por lote. Não aumentar timeout como única correção.

Limitar consultas a fontes/campos/períodos consumidos, preservando a janela de comparação. Não copiar todo histórico em cada run. Materializada pode continuar como projeção otimizada; corrigir critérios de latest e política do coletor, sem apagar maturação. Limpeza de abas órfãs vem por último e não é requisito para publicar.

### 10.3 Exclusividade e efeitos externos

- Um controlador autorizado por destino, lease renovável, owner e fencing monotônico.
- Transições/commit condicionais ao owner, predecessor e versão esperados.
- Registrar intenção antes de mutação e efeito confirmado depois.
- Resposta ambígua exige consulta/reconciliação, não retry cego de create/delete.
- Fencing no banco não cancela chamada Google em trânsito. Documentar limite e impedir nova promoção enquanto houver efeito pendente inconclusivo.
- Usar controle de revisão Google onde disponível. Edições humanas inesperadas provocam conflito explícito.
- Não alegar atomicidade entre Postgres, Sheets e Slides. Durante atualização, GaaS mostra integridade “atualizando”; downloads usam geração privada imutável.

### 10.4 Charts e identidade

Views e gráficos continuam no Sheets, alimentados pelas métricas certificadas. Slides atualiza gráficos vinculados somente após escrita/verificação das ranges. Dados/labels/escalas/rodapés devem corresponder ao artefato.
Inventariar sheetId, chartId, slide_instance_id e objectId; título de aba não é identidade suficiente.
Atualizações de slides existentes devem preservar IDs e conteúdo humano não gerenciado sempre que suportado. Não trocar run_id por slide_instance_id cegamente no algoritmo de criação.
Provar em canário duas atualizações mantendo links internos/externos e comentários relevantes; comparar conteúdo/estrutura. Caso algum elemento precise ser substituído, inventariar e preservar referências antes da migração; se a API não permite preservar intervenção humana, registrar bloqueio específico, não alegar preservação.
Limpar apenas objetos comprovadamente pertencentes ao renderer; nunca apagar slides manuais desconhecidos.

### 10.5 Recuperação

Antes de mutação viva, guardar geração anterior reconstruível (incluindo assets/fontes/renderer necessários) e reconciliar estado real do Google.
Julho precisa de investigação histórica a partir do report-build.json e snapshots do run e549d750-1ad1-4ac0-9852-c53aa10a7328. A auditoria de 44 páginas de outro run não homologa a publicação posterior de 38.
Não usar o Sheets atual como backup certificado. Se predecessor não for recuperável, produzir primeiro candidato privado de agosto verificado e um plano explícito de recuperação para ele; não promover com rollback fictício.
Recuperador independente: retomar geração certificada ou restaurar anterior; verificar conteúdo real; registrar recovered/recovery_failed. Preservar incidentes no histórico.
Nunca marcar published antes de verificar destinos obrigatórios e PDF completo correspondente. Falha posterior em download selecionado tem estado próprio, sem desfazer publicação íntegra.

## 11. R5 — viewer completo e exportação por frente

Viewer usa manifesto/preview de versão imutável, não iframe do deck vivo como única fonte.
- Header: agosto, versão, última publicação válida, última tentativa e qualidade.
- Core executivo e navegação por todas as frentes ativas, incluindo indisponíveis; detalhes/anexos acessíveis.
- Por frente/slide: título legível, preview, janela, estado e botão de detalhes de qualidade.
- Aviso vermelho contém fonte, intervalo, impacto e motivo; possível causa identificada. Não depender só da cor.
- Estados de carregamento, vazio legítimo, erro, recuperação e conflito distinguíveis. Acesso por teclado e responsividade.
- Histórico por versão, com indicação de regras antigas/homologação; não apresentar versão antiga como resultado atual.
- Atualizar inicia execução automática; polling termina e mostra ação apropriada em estados terminais.

Export:
1. Selecionar uma ou mais frentes e formato PDF/PPTX. Default pode ser todas; síntese executiva é recorte opcional claramente identificado.
2. Fixar version_id/content_hash no clique.
3. Resolver capa, índice, avisos e dependências de contexto; não recalcular números.
4. Gerar em apresentação/artefato privado dessa geração; nunca apagar/reordenar o deck vivo para atender seleção.
5. Ajustar resumo ao recorte: sem conclusões sobre frentes omitidas; referências internas válidas.
6. PDF/PPTX abrem/renderizam, com ordem e quantidade de páginas corretas, texto legível, fontes/avisos/links e tabelas preservados.
7. Cache por versão+seleção canônica+formato+renderer/política; autorização em todo acesso, inclusive cache hit. URLs assinadas curtas, sem persistir como identidade do arquivo.
8. Seleção vazia rejeitada; indisponível selecionada produz status. Erro de tamanho/export não gera arquivo ready.

**Spike de PPTX cedo, entrega obrigatória ao final.** Usar Google Drive export como primeira opção. PDF/PPTX requerem QA visual; não basta download 200. Gráficos exportados podem ser representações estáticas: não prometer vínculo/editabilidade equivalente ao Google; registrar comportamento real. Não criar segundo renderer só por preferência.
Drive files.export documenta limite de 10 MB de conteúdo exportado. Se deck completo exceder: investigar caminho suportado (ou composição de partes verificadas) antes de declarar impossibilidade; seleção menor não substitui a obrigação do export completo sem comunicar limitação real.

## 12. R6 — testes, rastreabilidade e critérios de aceite

Manter MATRIZ_ACEITE.md com status, comando/caso, evidência e versão do código para cada linha. A matriz abaixo cobre a spec anterior A01–A32, amplia recuperação e corrige omissões. Testes de defeito atuais devem virar testes do comportamento correto; assertions que confirmam bug e buscas por strings não homologam release.

| ID | Cenário | Resultado exigido |
|---|---|---|
| T01 | Inventário de fontes/frentes/campos/slides | Todos classificados com consumidor, regra ou exclusão/status justificado |
| T02 | Agosto vs abas configuradas em junho | Agosto no request/artefato/Google/download; nenhuma data legada herdada |
| T03 | Falta de B2C/Google/renta | Investigação e tentativa documentadas antes de usar aviso; frentes independentes preservadas |
| T04 | Recovery de lote repetido | Mesma origem/chave não duplica nem regride dado mais recente |
| T05 | Alteração de registro de origem | Diff antes/depois e proveniência; rollback não apaga edição posterior |
| T06 | Dias sem disparo vs falha de ingestão | Estados distintos com evidência do esperado |
| T07 | 97 divergências CAC e chaves candidatas | Exceções por ID; nenhuma deduplicação/reescrita sem regra comprovada |
| T08 | Custo ausente/zero/estimado | Estados preservados em todos os níveis e acumulados |
| T09 | Custo parcial, cartões completos | Nenhum CAC com universos incompatíveis |
| T10 | Dois CACs/canais com pesos diferentes | Razão de somas, não média simples |
| T11 | ad=10, adset=10, campaign=10; gasto=300 | Resultado factual=10 e CPA do evento=30 |
| T12 | page_view=100, StartTrial governado=10 | Primário continua StartTrial |
| T13 | Coleta falha após lote; coleta válida anterior | Latest não mistura fragmentos inválidos; maturação mantida |
| T14 | Campanha AQUISICAO com COPA no nome | Classificação pelo propósito governado; não entra em opt-in |
| T15 | Seguros base 100 + B2C renta base 900 | Seguros=100; teste de exceção Seguro em outra BU segue regra explícita |
| T16 | Budget CONFIG sem vigência, meta ausente | Nenhuma meta de agosto inferida, nem ação monetária inventada |
| T17 | Antes/depois do cutoff e buraco interno | Filtro e cobertura realmente aplicados; janela declarada correta |
| T18 | UTC/local e datas de calendário | Dia correto, semiaberto sem perder registros com frações de segundo |
| T19 | Julho parcial/evento incompatível | MoM bloqueado/limitado com motivo, sem tendência causal falsa |
| T20 | Briefing, inclusive skip_llm | Snapshot/hash capturado; exemplos de junho nunca viram dado de agosto |
| T21 | Alterar valor mantendo hash antigo | Certificação reprova; nenhuma mutação viva |
| T22 | Campo obrigatório ausente/linha curta/NaN | Reprova cálculo ou representa status certificado; não desloca coluna |
| T23 | Mesmo input, outro run_id/ordem de conjunto | Hash de conteúdo estável; ordem semântica preservada |
| T24 | Contrato inactive, nova frente, perfil distinto | Catálogo/render respeitam registro; sem hardcode de 38 páginas |
| T25 | B2C ausente, demais válidos | Atualização automática com aviso; integrado indisponível |
| T26 | Todas as fontes indisponíveis, artefato íntegro | Relatório de status identificado; não “fechamento completo” |
| T27 | dry-run, modo inválido, JSON inválido | Sem run full e sem efeitos externos |
| T28 | Stage/setup fora do controlador | Acesso rejeitado sem efeitos |
| T29 | anon/leitor/operador/worker | Permissões reais testadas, inclusive RPCs/storage/export |
| T30 | Lease expirado e worker atrasado | Sem promoção concorrente; chamada pendente reconciliada |
| T31 | Matar worker após cada classe de escrita | Recuperador independente retoma/restaura e verifica |
| T32 | Resposta ambígua em create/commit | Não duplica, não promove duas versões, identifica resultado real |
| T33 | Artefato anterior inacessível | Bloqueio seguro/plano candidato comprovado; nunca rollback fictício |
| T34 | Edição humana e dois updates de slides | Conflito tratado, IDs/links/comentários preservados conforme canário |
| T35 | Refresh falha; status complete | Manifesto honesto; complete não vira incidente sozinho |
| T36 | Frontend stale/rejected/recovery_failed/erro de leitura | Polling finito e estado/ação corretos; última versão separada |
| T37 | Queda real com fonte completa | Publica queda sem aprovação arbitrária baseada em percentual |
| T38 | Dois usuários e seleções diferentes | Export isolado, mesmo valor por métrica, Google vivo intacto |
| T39 | Download histórico durante atualização | Um único hash/versão; sem gráficos da geração nova |
| T40 | Seleção vazia/indisponível e capa/índice | Regras de contexto corretas, sem links quebrados |
| T41 | PDF/PPTX completo e por frente | Conteúdo e QA visual aprovados, não só arquivo abre |
| T42 | Export > limite, URL expirada, cache não autorizado | Erro explícito/reemissão autorizada; nenhum arquivo truncado ready |
| T43 | Dados/views de agosto | 100% das métricas renderizadas reconciliadas com cálculo independente e snapshot |
| T44 | Séries e gráficos | Labels, unidades, datas, missing e valores conferem com ranges/artefato |
| T45 | Narrativa/core executivo | Sem telemetria como insight, números sem fonte, causa inventada ou ação sem suporte |
| T46 | Performance | Etapas com margem medida; request curto; retomada sem monolito oculto |
| T47 | Histórico de julho | Veredito por snapshot/versão correta; inconclusivo explicitado, sem recalcular passado com base atual |
| T48 | Deploy e produção | SHA/migrations/funções/bundle conferidos; agosto real e downloads verificados |

Reconciliador independente não pode chamar o mesmo agregador que está testando. Usar SQL/Python independente e fixtures manuais com expected explícito.
Contagens inteiras exigem igualdade; dinheiro em precisão interna definida exige igualdade após regra decimal ou tolerância técnica documentada. Apresentação arredondada admite só a diferença de arredondamento da unidade exibida, não tolerância genérica que esconda diferença material.
Para Sheets, registrar endereços físicos (A1/range), sheetId/chartId e slide_instance_id. O logical_row do CSV antigo não é endereço físico.
Não exigir reauditar toda tabela da organização: 100% do universo de agosto e julho comparável consumido, todas as métricas/views que chegam ao usuário, todos os estados e contratos em escopo.
Renderizar todas as páginas do PDF de agosto para integridade/legibilidade. Verificar PPTX completo e recortes representativos. Golden images só onde ajudam a proteger contrato; não iniciar projeto de polimento slide a slide.

### 12.1 Rastreabilidade de achados anteriores

| Origem | Cobertura |
|---|---|
| F01 roteamento; F07 staging | R1/R4; T27–T28 |
| F02 grão/evento; F13 coletor | R0/R2/R4; T11–T13 |
| F03 missing/custo | R0/R2; T07–T10 |
| F04 cutoff | R2; T17–T19 |
| F05 certificação | R3; T20–T23 |
| F06 recuperação; F09 runtime | R4; T30–T34/T46 |
| F08 segurança | R1/R5; T29/T42 |
| F10 idempotência | R3; T23/T32 |
| F11 refresh | R2; T35 |
| F12 UI | R1/R5; T36 |
| F14 config/perfil/contratos | R2/R3/R5; T16/T24/T37 |
| S01–S02 período/falso zero | R2/R3; T02/T08/T25 |
| S03–S04 eventos/contagem de campanhas | R2; T11–T14/T43 |
| S05–S07 seguros/unidades/funil/alcance | R2; T15/T43/T44 |
| E01–E03 engine | R2/R3; T08/T11/T14/T15/T21 |
| Crítica: urgência e escopo | Marcos 1–3; publicar após R4 sem esperar viewer |
| Crítica: main divergente | R1 e R7; T48 |
| Crítica: PPTX e IDs | Spike R4/R5; T34/T41 |
| Crítica: julho não auditado | R4; T47 |
| Crítica: motor de workflow/custos | ADR e benchmark R4; T46 |
| Crítica: UI promete IA | R1/R5; T20/T36/T45 |

## 13. R7 — integração, deploy e conclusão

Ordem:
1. R0 investigação/recuperação; inspeção read-only de base em paralelo lógico.
2. R1 contenção e base reproduzível.
3. R2/R3 cálculo, snapshot e certificação.
4. R4 recuperação/QA em destino privado, depois publicação real de agosto (marco 2).
5. R5 viewer/export completos; spike PPTX feito antes para detectar limites.
6. R6 validação contínua + R7 deploy correspondente e verificação completa (marco 3).

Implementar em commits/etapas revisáveis. Antes da main: diff, migration plan, testes, orçamento e recovery evidenciados. Não esperar revisão de um agente que não foi criado. Pablo pode pedir revisão intermediária a Codex, sem torná-la dependência oculta.

Migrations expansivas/compatíveis; comparar conteúdo remoto/local antes de db push/repair. Conferir permissões e consumidores existentes. Não reescrever migration histórica já aplicada.
Deploy não se resume ao frontend: Edge Functions e migrations devem corresponder ao SHA/artefato integrado. Confirmar workflows reais e app público. Não adicionar um cron mensal arbitrário.

Verificação final:
- Uma publicação real de agosto após recuperação e gates.
- Sheets/Slides/PDF/preview/exports da mesma versão; avisos realmente visíveis.
- Artefato, perfil, briefing, hash, cutoffs, quality issues, publicação e links rastreáveis.
- Dados originais/recoveries preservados e relatório de exceções resolvidas/pendentes.
- Segurança e recuperação ensaiadas; operação documentada.
- Viewer e PDF/PPTX completos e selecionados verificados.
- Atualizar vault de engenharia e recompilar python scripts/bundle_vault.py na raiz do workspace.
- Entregar RELATORIO_RELEASE_AGOSTO.md com SHA, migrations, versões das funções, run/publication IDs, hashes, URLs autorizadas, matriz de aceite e limites.

Não declarar conclusão integral se testes em escopo falharem, PPTX estiver faltando ou lacunas recuperáveis não forem investigadas. Em bloqueio externo, separar software concluído, publicação parcial correta e fechamento factual ainda incompleto. Continuar o que não depende do bloqueio.

## 14. Referências técnicas verificadas e riscos residuais

- [Supabase Edge Functions — limites](https://supabase.com/docs/guides/functions/limits): orçamento por runtime e plano; revalidar antes de implementar.
- [Supabase Queues](https://supabase.com/docs/guides/queues): opção de transporte durável, sem remover a necessidade de idempotência externa.
- [Google Drive files.export](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/export): limite documentado de conteúdo exportado.
- [Google Slides batchUpdate](https://developers.google.com/workspace/slides/api/reference/rest/v1/presentations/batchUpdate): requests agrupados e controle de revisão; sem transação entre produtos.

Riscos ainda não resolvidos pela preparação desta spec:
- Acesso/disponibilidade de fontes upstream completas para agosto.
- Validade dos custos registrados e equivalência B2C/CRM.
- Orçamentos/meta de agosto com aprovação e vigência.
- Reconstrução integral do pacote histórico de julho.
- Fidelidade PPTX e preservação efetiva de comentários no adapter escolhido.
- Certificação de cada célula/gráfico/slide de agosto: será executada sobre o candidato implementado, não sobre a planilha legada.

Esta spec consolida as análises relevantes e explicita sua cobertura; não afirma que a revisão documental já corrigiu dados, auditou todos os sistemas externos ou homologou o relatório em produção.
