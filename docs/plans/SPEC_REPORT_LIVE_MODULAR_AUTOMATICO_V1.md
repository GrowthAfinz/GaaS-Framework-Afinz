# SPEC — Report Live modular, confiável e automático
> Histórico: a próxima implementação deve seguir [SPEC_REPORT_LIVE_AGOSTO_2026_CLAUDE_CODE.md](SPEC_REPORT_LIVE_AGOSTO_2026_CLAUDE_CODE.md), que incorpora as decisões posteriores de Pablo: escopo completo, investigação/recuperação de agosto primeiro e marcos de publicação e produto separados. Em conflito de sequência ou escopo, prevalece a nova spec.

Versão: 1.0 — 09/09/2026
Status: pronta para implementação; decisões de produto alinhadas com Pablo; desenho técnico recomendado pela auditoria.
Escopo desta entrega de documentação: especificação e revisão prévia. Nenhum código de produto, banco ou destino Google foi alterado.

## 1. Missão e definição de sucesso

Evoluir o Report Live para um relatório modular no GaaS, com atualização automática, qualidade explícita por frente e exportação selecionável. Uma fonte indisponível não deve derrubar frentes independentes. Um número inválido não pode ganhar aparência de válido porque o relatório precisa atualizar.

O produto deve construir uma versão imutável das métricas e slides de todas as frentes ativas do perfil, mostrar o relatório completo no GaaS, atualizar automaticamente sua apresentação e permitir baixar PDF ou PPTX contendo apenas as frentes escolhidas, com contexto e avisos correspondentes.

A entrega está concluída quando o código está integrado à main, migrations e funções correspondentes estão implantadas, o frontend público serve a versão correta e uma execução real foi verificada de ponta a ponta, incluindo cenário parcial e exportação selecionada. Commit ou build verde isolados não encerram o trabalho.

## 2. Decisões do usuário e limites de autonomia

Decisões recebidas em 09/09/2026:
1. Spec completa, dividida em entregas.
2. Relatório parcial permitido. Seleção de frentes é um pilar de produto.
3. Atualizar diretamente o Slides; não exigir aprovação humana em cada atualização. Exibir avisos muito visíveis, incluindo quadro vermelho e possível motivo.
4. Liberdade para melhorar a arquitetura, inclusive questionar a stack.
5. A IA implementadora pode cuidar da implementação até integração na main e deploy. A atualização automática do relatório faz parte do comportamento autorizado.
6. Não trabalhar agora no refinamento individual de cada slide/frente.

A IA pode implementar, testar, criar migrations necessárias, integrar na main e implantar após cumprir os gates técnicos. Não pedir novamente aprovação genérica já concedida. Respeitar proteções de branch, credenciais e controles reais da plataforma; não desabilitá-los para concluir.

Esta autorização não implica apagar histórico, expurgar dados, abrir acesso público a dados privados, trocar a organização de destino ou contratar serviços pagos. Preservar alterações de outras frentes. Escolhas técnicas ordinárias desta spec não exigem nova rodada de perguntas.

A revisão prévia foi feita na spec. Uma revisão adicional do diff por Codex pode ser solicitada durante a execução, mas não é dependência oculta nem automação criada por este documento.

Fora desta entrega: redesenhar todos os slides, ajustar cada parceiro manualmente, trocar narrativas por um novo modelo de IA, criar uma central completa de ações/outcomes ou habilitar novo calendário recorrente sem configuração operacional. Preparar contratos para evolução, sem implementar esses produtos adjacentes.

## 3. Contexto de entrada e fontes obrigatórias

Workspace original: C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP.
Repositório Git do app: calendar-estrategico, dentro do workspace. Executar Git nesse diretório; não assumir que a pasta pai é a raiz Git correta.

Ler integralmente antes de implementar:
- AGENTS.md e CLAUDE.md aplicáveis.
- MASTER_DECK_SPEC.md.
- docs/AFINZ_GAAS_ONTOLOGY.md, localizando as notas do Report Live e os contratos CT-1 a CT-9.
- Afinz-CRM-Midia-Vault/08-Engenharia/Report-Live-Sheets-Slides.md.
- Afinz-CRM-Midia-Vault/08-Engenharia/Report-Live-Versionamento-e-Publicacao.md.
- Afinz-CRM-Midia-Vault/09-Inteligencia-IA/Agente-Report-Live-Handoff.md.
- outputs/report-live-audit/AUDITORIA_REPORT_LIVE_2026-07-23.md.
- calendar-estrategico/outputs/report-live-engineering-review-2026-09-09/PARECER_ENGENHARIA_REPORT_LIVE.md, evidence e offline-findings.json.
- Código e migrations abaixo. Os números de linha do parecer são localizadores históricos, não garantia após alterações.

Mapa da implementação atual:
| Responsabilidade | Caminho dentro de calendar-estrategico |
|---|---|
| HTTP, carregamento, build, staging, publicação, recuperação | supabase/functions/report-sync/index.ts |
| Agregações, métricas, views, slides, narrativa determinística | supabase/functions/report-sync/report-live-engine.ts |
| Artefatos, hashes, certificação | supabase/functions/report-sync/report-live-versioning.ts |
| Renderer Google | supabase/functions/report-sync-v4-setup/index.ts |
| Tokens/contrato visual | supabase/functions/_shared/report-live-design.ts |
| UI | src/components/relatorio/ReportLiveCard.tsx |
| Migrations | supabase/migrations/*report_live* e migrations relacionadas a mídia |
| Verificações existentes | scripts/verify-report-live-release.ts e scripts/verify-report-live-red-team.ts |
| Reproduções adicionais | outputs/report-live-engineering-review-2026-09-09/verify-findings.mjs |

Projeto Supabase: mipiwxadnpwtcgfcedym.
Destinos existentes a preservar na transição:
- Sheet: 1BYLpYzDvppMC32ITfbSQdejB3RSxOcAdJZteCd54nwA
- Slides: 1iGAdoxp1yC91v9_Y0zCD0XHrkjZvUrikyLXbKP-_wv0
- Bucket privado: report-live

Estado observado na auditoria, a reconfirmar antes de deploy:
- Branch feat/report-live-v1, HEAD 0c85473; origin/main 2b4d4884bd4dd6627b2eae42658b82f57979b29a.
- Produção report-sync v37 e report-sync-v4-setup v15; main não continha três arquivos do runtime publicado.
- Última publicação registrada v1 c6d86570-9b50-4b53-85fc-f1acaac888cd, run e549d750-1ad1-4ac0-9852-c53aa10a7328; tentativa posterior falhou.
- CRM até 08/09, mídia até 03/09, B2C até 20/07. Manifestos integrados de agosto/setembro bloqueados.
- 469.136 observações brutas de eventos e 50.754 linhas na materializada, que estava uma coleta atrás.
- Algumas migrations têm nomes equivalentes com timestamps diferentes no remoto.
Esses fatos são evidência datada, não valores fixos para código ou critérios de negócio.

Precedência: decisões do usuário nesta spec substituem a proposta anterior de aprovação manual e bloqueio global por B2C. Contratos de integridade permanecem. Notas históricas não substituem verificação atual.

## 4. Decisão de arquitetura: o relatório pertence ao GaaS

### 4.1 Alternativas e escolha

| Alternativa | Benefício | Custo/limite | Decisão |
|---|---|---|---|
| Sheets/Slides como centro, filtrar removendo páginas do deck vivo | Pouca mudança inicial | Corrida entre usuários, perda de contexto, exportação altera o relatório compartilhado | Rejeitada |
| Artefato modular imutável no Supabase; GaaS como catálogo/viewer; Google como renderer e destino | Reaproveita stack e layouts; separa cálculo, apresentação e exportação | Exige contratos, jobs e manifestos | Adotar nesta entrega |
| HTML/SVG como renderer principal + worker dedicado para PDF/PPTX | Mais controle do produto e escalabilidade visual | Fidelidade PPTX, fontes e segundo renderer aumentam escopo | Manter como alternativa futura, exigir benchmark antes da troca |
| Novo backend inteiro fora do Supabase | Liberdade operacional | Migração grande sem corrigir automaticamente semântica | Não necessário agora |

A provocação central é retirar do Google Slides a função de banco de dados e de coordenador. A versão do relatório no GaaS é a referência; Slides, PDF e PPTX são representações dela.

Preservar os links Google atuais por compatibilidade, sem torná-los restrição da arquitetura interna. São permitidos arquivos privados de geração/exportação, registrados e com retenção controlada. Eles não são novos links públicos concorrentes.

### 4.2 Componentes e separação

1. Fonte e snapshot: consultas governadas, água-marca de coleta completa, período e versões.
2. Engine puro: snapshots → métricas tipadas → módulos → blueprints. Sem escrita Google.
3. Certificador: valida integridade e política de apresentação, incluindo placeholders de indisponibilidade.
4. Orquestrador durável: controla etapas, tentativas, leases, recuperação e promoção.
5. Renderers/adapters: Google Slides/Sheets, manifesto do viewer e exportações.
6. GaaS: catálogo de frentes, qualidade, navegação, seleção, downloads, histórico e operação.

Usar Supabase/Postgres/Storage para estado e artefatos. Avaliar pgmq para fila; ele estava disponível, não instalado, na auditoria. Jobs curtos podem continuar nas Edge Functions. Se render/exportação exceder limites comprovados, mover somente esse worker para um runtime adequado, mantendo contratos. Não mover o monolito inteiro para uma mensagem de fila.

Primeira entrega deve registrar um ADR com a escolha, medidas de duração/tamanho e razões para eventual desvio. Liberdade técnica não é licença para adiar os defeitos de dados enquanto se reescreve a stack.

## 5. Modelo modular e escolha de frentes

### 5.1 Construção e seleção são operações distintas

Construir logicamente todas as frentes ativas no perfil do relatório, a partir de uma geração comum e congelada. Reutilizar módulos cujo conteúdo não mudou, com proveniência explícita. Não preencher números em frentes sem dados.

Um módulo deve conter: module_id estável, nome, ordem, versão de contrato, dependências de fontes/métricas, disponibilidade, instâncias de slides, referências de evidência e qualidade. Inventariar IDs atuais; não codificar a lista de 38 slides como limite.

Perfis definem o universo de módulos e regras de leitura. Seleção de exportação define uma projeção de um relatório já construído. São objetos distintos: trocar os módulos do PDF não deve alterar CPA, CAC ou cutoff.

O viewer começa mostrando todas as frentes ativas, inclusive as indisponíveis. Permitir filtrar a navegação e selecionar frentes para exportar. Não esconder por padrão a existência de uma frente com problema.

Dependências são tipadas:
- cálculo: uma métrica integrada exige fontes e janelas compatíveis;
- contexto: exportar uma frente exige sua nota de período/qualidade;
- apresentação: capa e índice dependem das frentes selecionadas.
Selecionar mídia não deve incluir automaticamente todos os slides de CRM só porque uma referência é compartilhada.

### 5.2 Regra para módulos inválidos

Degradar no menor escopo seguro:
- Métrica ausente: omitir o número e seus derivados; manter outros números independentes se o contrato os permitir.
- Slide sem suas métricas essenciais: renderizar quadro de indisponibilidade no lugar da análise.
- Frente sem qualquer slide analítico válido: renderizar um único slide de status para essa frente; evitar dezenas de slides vermelhos repetidos. A lista completa das instâncias permanece consultável no viewer.
- Frente válida: renderizar normalmente, independentemente de B2C.
- Métrica integrada sem B2C: indisponível; não renomear uma soma CRM+mídia como resultado integrado.

Uma fonte histórica de julho não pode aparecer como resultado de agosto. O histórico fica acessível separadamente. Por padrão, não preencher lacunas de uma geração nova com métricas antigas dentro do mesmo slide. Reuso incremental só é permitido se dados, período, observação e contrato continuam válidos e isso está registrado.

### 5.3 Exportações

Requisito desta entrega: seleção por frente e PDF. Implementar também PPTX usando o mesmo manifesto quando o adapter Google existente permitir; tratar suporte PPTX como parte da aceitação e declarar bloqueio técnico real se não puder ser entregue. Não criar um segundo renderer somente para atender PPTX.

Pipeline recomendado:
1. Fixar report_version/artifact_hash na requisição.
2. Validar autorização e seleção no servidor.
3. Resolver slides e dependências de contexto, em ordem estável.
4. Construir apresentação privada de exportação a partir do artefato certificado ou de uma geração privada imutável correspondente.
5. Incluir capa do recorte, índice atualizado, avisos das frentes selecionadas e referências necessárias.
6. Exportar PDF/PPTX, validar, armazenar privadamente e emitir URL temporária autorizada.

Nunca excluir/reordenar páginas do Slides vivo para atender um download. Nunca copiar o deck vivo mutável e presumir que corresponde ao artefato solicitado. O PDF selecionado não deve ser simplesmente um recorte cego que mantém sumário ou conclusões sobre frentes excluídas.

Export cache key: artifact_hash + seleção ordenada/canônica + formato + renderer_version + versão da política de contexto. Separar cache do TTL de URLs assinadas. Cache hit também exige autorização.

Seleção vazia retorna erro de validação sem criar export. Frente indisponível selecionada entra como slide de status. Capa e avisos essenciais não podem ser removidos pelo filtro. Links internos são refeitos ou convertidos em referências legíveis; não deixar destinos inexistentes.

Exportações grandes: verificar limites documentados e tamanho real. Se ultrapassar capacidade, retornar erro explícito e sugestão de reduzir frentes, sem arquivo truncado nem link inválido. Divisão automática só com partes identificadas e manifesto completo.

## 6. Qualidade de dados e avisos visíveis

### 6.1 Estados independentes

Não usar um booleano certified ou status global para representar tudo:
- metric_state: observed | partial | missing | invalid | not_applicable.
- module_state: ready | partial | unavailable | disabled.
- certification: passed | passed_with_warnings | failed.
- publication_state: queued | publishing | verifying | published | recovery_required | recovering | recovery_failed | failed | superseded.
- destination_integrity: verified | updating | unknown | degraded.
- export_state: queued | running | ready | failed | expired.
Os nomes podem se adaptar ao schema legado, mas os conceitos devem permanecer separados e compartilhados entre backend/UI.

Dados incompletos conhecidos podem produzir certificação passed_with_warnings: a certificação aprova a representação honesta da limitação, não inventa validade da métrica. Corrupção de artefato, falta de autorização e inconsistência de geração produzem failed.

### 6.2 Contrato mínimo de métrica e problema

MetricValue:
- metric_id, value:number|null, unit, state;
- period_requested, period_used, timezone, source_watermark;
- numerator/denominator e seus escopos quando houver razão;
- observed_count, expected_count, coverage:number|null e método da cobertura;
- source_refs, lineage_hash, policy_version, issue_ids.

Se o esperado não puder ser determinado, coverage=null com motivo; nunca 100% por ausência de evidência. Zero observado deve ter prova de cobertura/semântica de zero.

QualityIssue:
- issue_id, code, severity, scope_type/id;
- user_title, observed_fact, impact, possible_cause, cause_confidence;
- affected_period, last_valid_data_at, detected_at, next_action;
- evidence_refs e erro técnico sanitizado restrito à operação.

Exemplo de aviso: “B2C indisponível neste período. Último dado disponível: 20/07/2026. As métricas de originação e o consolidado integrado não foram calculados. Possível motivo: ausência de ingestão para o período; causa ainda não confirmada.”

### 6.3 Apresentação do aviso

Quadro vermelho de alto contraste para missing/invalid essencial, com ícone e texto; cor não é o único sinal. Exibir na frente/slide afetado, no resumo geral e na exportação correspondente. Parciais utilizáveis também devem ter aviso destacado de cobertura e datas.

Não inventar causa com IA. “Não foi possível confirmar a causa” é resposta válida. Não exibir tokens, SQL sensível, PII ou stack trace no slide. Ajustar texto para caber; detalhes extensos ficam em página/área de qualidade, com resumo suficiente no próprio slide.

Uma falha de Google pode impedir o próprio aviso de chegar ao Google. Nesse caso, mostrar no GaaS que a versão anterior continua visível e que a integridade externa está desconhecida, com última verificação. Não prometer um quadro novo em um serviço que não aceitou escrita.

## 7. Correções semânticas obrigatórias

1. Mídia: separar ad factual de adset/campaign de reconciliação. Dimensões incluem conta, campanha, source, evento, janela e período. Usar event_map/is_primary_measure e política versionada para evento primário; maior volume nunca decide denominador.
2. CPA sempre nomeia o evento. Não equivale a CAC CRM ou atribuição causal de cartões. Famílias/janelas não somam silenciosamente.
3. Agregadores preservam missing e partial. Custos parciais não dividem por cartões de um universo incompatível. Razões agregadas usam SUM/SUM sobre escopo elegível.
4. Zero observado é diferente de dado ausente, inclusive diário e acumulado. Não usar ?? 0 para dado não observado.
5. Views nativas usam cutoff próprio; views integradas usam interseção válida e explicitamente calculada. Aplicar o filtro às linhas, não só ao texto.
6. Baselines usam dias equivalentes e cobertura compatível. Conversão de timestamps usa America/Sao_Paulo, não apenas slice da string UTC.
7. Manifesto de qualidade deve descrever exatamente o snapshot consumido, inclusive materializada e última coleta completa incorporada.
8. Refresh tem resultado persistido. Falha pode tornar módulo parcial/indisponível, nunca gerar mensagem automática de sucesso.
9. Contratos active=false e perfis têm efeito real. Campos obrigatórios são requisitos lógicos mapeados a métricas, não contagem de células preenchidas.
10. Corrigir complete tratado como incidente e paginação dos logs; ler últimos registros com ordenação e desempate únicos.
11. Configuração de regressão e atribuição precisa ser aplicada. Queda legítima de negócio não deve bloquear publicação por si; inconsistência/ruptura de fonte gera issue fundamentada.
12. Narrativa determinística continua disponível. Não reativar Gemini por padrão. Narrativa não fornece números novos e não pode dizer “completo” quando a evidência é parcial.

Coletor: preservar maturação de atribuição e reconsulta histórica necessária. Separar tentativa, observação alterada e latest de coleta completa. Não duplicar payload idêntico a cada run sem necessidade; não promover coleta parcial que depois falha. Manter histórico existente, sem expurgo nesta entrega.

## 8. Artefatos e certificação executável

Artefato imutável contém manifestos de fontes/módulos, métricas, tabelas, blueprints, narrativas, issues, versões de schema/engine/renderer, assets necessários e hashes. O renderer consome esse artefato, não recalcula a partir do Sheets vivo.

Separar execution_id/run_id de content_hash. Hash semântico exclui relógios de tentativa e IDs operacionais, mas inclui versões/políticas que mudam o significado, período, água-marca relevante, conteúdo e ordenação canônica. Erros/avisos que alteram o relatório também invalidam cache semântico.

Nova tentativa com mesmo conteúdo reutiliza build; exportação tem idempotência própria. Retry de publicação não cria outra versão por causa de timeout de resposta.

Certificador deve:
- validar schema, tipos, hashes recalculados e referências;
- verificar fórmulas e linhagem das métricas críticas;
- aplicar requisitos lógicos de cada slide;
- conferir cutoffs, estados, cobertura e compatibilidade de razões;
- impedir que métrica invalid/missing apareça como número;
- validar texto de limitação e placeholder obrigatório;
- validar seleção/perfil, slide IDs e dependências;
- distinguir aviso publicável de erro de integridade impeditivo.

Um snapshot com dado problemático conhecido pode gerar placeholder certificado; um artefato alterado depois do build não pode ser “degradado” para escapar de reprovação. Armazenar tentativas de certificação em histórico append-only, vinculadas ao hash exato.

Arquivos históricos legados devem ser identificados por versão e nunca marcados automaticamente como certificados pelas regras novas. Definir compatibilidade explícita de leitura e recuperação sem reescrever fatos históricos.

## 9. Orquestração, concorrência e recuperação

### 9.1 Fluxo normal automático

request → preflight → snapshot → build_modules → certify → render_generation → verify_generation → promote → verify_destinations → commit → exports/cache.

Não existe etapa de aprovação humana padrão. Build e certify continuam sem alterar o destino vivo. Uma solicitação de “Atualizar relatório” enfileira o fluxo; não bloqueia HTTP esperando todas as etapas.

Cada job carrega IDs, não os dados completos. Persistir step_key, attempt, input_hash, status, checkpoint, output_refs, started_at, heartbeat_at, completed_at, error_code, retry_at. Unicidade por geração/etapa/input_hash impede duplicação. Resultado deve ser persistido antes de confirmar a mensagem.

Retry com backoff/jitter e limite, respeitando rate limits; falha permanente vai para estado acionável. Recuperação roda independentemente do worker que falhou.

### 9.2 Leases e limites de garantia

Lock/lease exclusivo por destino com owner_token, expiração e fencing_version monotônica. Verificar posse em cada transição e antes de mutação. Renovação e commit usam comparação condicional. Commit exige predecessor esperado e geração verificada.

Um fencing token em Postgres sozinho não cancela uma requisição Google já em trânsito. Evitar workers sobrepostos; controlar revisão do destino quando disponível; registrar a intenção antes da chamada; após resposta ambígua ou expiração, reconciliar o efeito externo antes de admitir promoção concorrente. Documentar limites e testar.

Toda escrita no alvo vivo, inclusive staging e cleanup, passa pelo controlador. Desativar entradas legadas que permitam bypass; modo desconhecido/JSON inválido retorna 400, nunca full. dry-run não insere run nem chama Google.

### 9.3 Promoção e recuperação

Preparar/verificar geração privada antes de alterar a viva. Preservar artefato anterior e sua versão de renderer/assets; falha em carregá-lo bloqueia preflight quando existe publicação anterior. Primeira publicação tem caminho explícito sem predecessor.

Preferir operações agrupadas e controle de revisão no adapter Google, sem assumir transação global entre Sheets, Slides e banco. Registrar conteúdo/revisões esperados. Uma batch isolada não torna o fluxo inteiro atômico.

Na falha após mutação:
1. Marcar recovery_required e integridade unknown/degraded.
2. Recuperador identifica último efeito confirmado e respostas ambíguas.
3. Retomar geração segura ou restaurar anterior com artefato histórico, conforme journal.
4. Verificar conteúdo, não apenas IDs/contagens.
5. Registrar recovered ou recovery_failed com evidências e próxima ação.

Não marcar published antes de confirmar destinos obrigatórios. Exportação sob demanda possui estado próprio: falha em um PDF personalizado não desfaz uma publicação já íntegra. Evidência de renderização usada para liberar a geração é gate anterior à promoção; não confundir com todo download futuro.

Slides/Sheets manuais: comparar revisão/hashes. Edição concorrente inesperada gera conflito explícito e interrompe promoção com estado visível, sem sobrescrever silenciosamente. Não usar “atualizar direto” como autorização para destruir edições humanas não inventariadas.

Limpeza de abas antigas só após recuperação verificada, com IDs exatos, inventário de dependências e execução idempotente. Não é pré-requisito para desempenho; parar de escrever já reduz custo.

## 10. Persistência e interfaces

Reutilizar report_runs, report_publications, registros de contratos/configuração e Storage. Não criar modelo paralelo sem mapear migração.

Entidades novas ou extensões necessárias:
| Entidade lógica | Conteúdo/invariante |
|---|---|
| report_versions | artefato imutável, período, perfil, content_hash, versões, quality_summary |
| report_module_results | geração+módulo únicos, estado, hashes, slides, issues, cutoffs |
| report_steps | geração/publicação+etapa+input_hash, checkpoint e tentativas |
| report_quality_issues | escopo e evidências, sem secrets/PII |
| report_exports | versão, seleção canônica, formato, hash, status, path privado |
| publication journal | intenções/efeitos externos, revisão, lease, compensação |
| report_certification_attempts | resultado imutável por tentativa/hash |

Nomes físicos são proposta; evitar duplicar informações já bem representadas em report_artifacts/blueprints. Criar índices para jobs elegíveis, histórico por relatório, módulos por versão e chave de exportação. Integridade referencial e transições devem ser garantidas no servidor.

Interfaces de comportamento, com schema versionado e validação:
- requestReport(period, profile, idempotency_key) → 202 com run_id.
- getReportStatus(run_id) → tentativa + publicação atual + integridade externa.
- getReport(version_id) → módulos, slides e qualidade autorizados.
- requestExport(version_id, module_ids, format) → 202 ou cache autorizado.
- getExport(export_id) → status e URL assinada quando pronto.
- retry/recover → operação autorizada e auditada.
Pode manter endpoint legado como adapter estrito. Não aceitar registry/blueprint arbitrário do navegador para renderer.

Erros públicos incluem código estável, mensagem, escopo e retryable. Ex.: INVALID_SELECTION, SOURCE_UNAVAILABLE, ARTIFACT_INTEGRITY_FAILED, DESTINATION_CONFLICT, EXPORT_TOO_LARGE. Erro de transporte não vira fonte vazia sem issue.

## 11. Segurança e privacidade

Reusar modelo de acesso do GaaS, com capacidades explícitas: reader, operator e worker, mapeadas aos papéis reais. Reader consulta e exporta apenas relatórios permitidos; operator solicita atualização/recuperação; worker promove internamente. Publicação automática usa serviço autorizado, não usuário anônimo.

- Revogar SELECT anon/authenticated da materializada quando a fonte é interna.
- Revogar EXECUTE herdado de PUBLIC/anon/authenticated da função SECURITY DEFINER de refresh; limitar ao serviço necessário, com search_path seguro.
- Verificar autenticação e autorização nos handlers; verify_jwt não equivale a papel de operador.
- Renderer interno exige publication_id, hash certificado e posse válida.
- RLS e grants coerentes para relatórios, módulos, issues e exports; testar acesso cruzado entre usuários/escopos.
- Bucket privado, URLs assinadas curtas geradas sob demanda, sem persistir URL assinada como identidade do arquivo.
- Nunca incluir chaves no frontend; não usar user_metadata editável para autorização.
- Logs sanitizados e evidências de auditoria sem exposição desnecessária.
- Arquivos privados de exportação só são removidos pelo job que comprova ownership e retenção. Não deletar destinos vivos nem arquivos desconhecidos.

A dívida das outras tabelas públicas sem RLS é registrada separadamente; não ampliar esta entrega para corrigir todo o banco sem avaliar os consumidores.

## 12. Experiência mínima no GaaS

Evoluir ReportLiveCard e componentes dedicados, preservando padrões do app:
- Última atualização tentada, versão disponível e integridade do Google visíveis separadamente.
- Botão “Atualizar relatório” inicia fluxo automático; explicar estado atual e permitir nova tentativa quando apropriado.
- Estados stale/rejected/failed/superseded não mantêm polling infinito nem bloqueiam controles como execução ativa.
- Lista de frentes com disponibilidade, período efetivo e contagem de slides.
- Visualização completa por frente, com render/preview de cada slide e detalhes de qualidade. Carregamento progressivo/virtualizado para muitos slides.
- Seleção de frentes, total de páginas, “Baixar PDF” e “Baixar PPTX”; mostrar geração em andamento e erro recuperável.
- Download fixa a versão no clique. Atualização concorrente não mistura versões dentro do arquivo.
- Visão geral do recorte calculada sobre módulos escolhidos; não reutilizar conclusões globais incompatíveis.
- Histórico permite abrir versão anterior identificada, sem apresentá-la como atual.

Avisos vermelhos e componentes de indisponibilidade são escopo visual obrigatório. Refinar layouts e narrativa de cada slide não é. Validar legibilidade, responsividade, foco/teclado e ausência de transbordamento nos componentes novos.

## 13. Plano de implementação e gates

| Entrega | Trabalho | Gate de saída |
|---|---|---|
| D0 Base reproduzível | Reconciliar main, branch, snapshot publicado, migrations e workflows; inventariar IDs/contratos | Checkout reconstrói runtime pretendido; mapa SHA→artefato→deploy e plano de migração |
| D1 Contenção | Roteamento estrito, segurança, estados frontend, impedir staging fora do controlador | Dry-run/invalid não mutam; acesso negado funciona; UI sai de stale |
| D2 Dados e módulos | Correções semânticas, snapshots, dependências, perfil e quality issues | Métricas adversariais corretas; B2C ausente preserva CRM/mídia |
| D3 Certificação e artefatos | Hashes, contratos executáveis, placeholders, idempotência, renderer desacoplado do Sheet | Corrupção bloqueia; parcial honesto certifica; reprodução sem consultar fonte viva |
| D4 Execução automática | Jobs, leases, journal, promoção/recovery, telemetria | Encerramento forçado e reentrega não corrompem destino; recuperação independente comprovada |
| D5 Viewer e exportação | Frentes selecionáveis, avisos, PDF/PPTX privados, cache | Seleção preserva números/contexto e não altera Google vivo |
| D6 Coleta e eficiência | latest de coleta completa, payload dedup, leitura limitada e watermark | Sem perda de maturação; coleta parcial não promove; recursos dentro dos limites |
| D7 Release | Integração main, migrations, Edge Functions, frontend, smoke e documentação | Versões reais conferidas, publicação e export reais verificadas, runbook e evidências entregues |

Implementar incrementalmente em branches/commits pequenos, preservando outras alterações. Não promover commits históricos isoladamente só porque reduzem I/O. D1 pode ser release corretiva independente se não depender dos novos contratos; não habilitar fluxo automático novo antes dos gates D2–D5.

Agendamento: reutilizar gatilhos existentes inventariados; não criar novo cron recorrente arbitrário. A ação manual “Atualizar” já deve percorrer o fluxo até publicação sem aprovação. Preparar integração com coleta concluída para habilitação posterior configurada; impedir um report por cada linha/evento de ingestão.

## 14. Matriz obrigatória de aceitação

| ID | Cenário | Resultado esperado |
|---|---|---|
| A01 | cleanup confirm=false, modo desconhecido, JSON inválido | Nenhum run full/Google; invalid retorna 400 |
| A02 | 10 resultados ad + 10 adset + 10 campaign, gasto 300 | Resultado factual 10; CPA do evento 30 |
| A03 | page_view 100 e start_trial 10 configurado como primário | Denominador continua start_trial |
| A04 | Custo ausente com 10 cartões | Custo/CAC ausentes, nunca 0; aviso nas views derivadas |
| A05 | Parte dos custos ausente | Cobertura explícita; razão somente no escopo compatível ou indisponível |
| A06 | 10 cartões antes do cutoff e 20 depois | Integrado 10; nativo pode 30, com janela própria |
| A07 | Evento UTC cruza data local; baseline parcial | Dia America/Sao_Paulo e dias comparáveis corretos |
| A08 | B2C ausente; CRM/mídia válidos | Atualiza automaticamente; B2C em quadro vermelho; integrado indisponível |
| A09 | Todas as fontes ausentes, infraestrutura/artefato íntegros | Publica relatório de status sem números; nunca substitui por zeros |
| A10 | Valor alterado mantendo hashes antigos | Certificação falha, nenhuma promoção |
| A11 | Campo obrigatório ausente | Placeholder certificado ou slide reprova; nunca gráfico analítico válido |
| A12 | Mesma entrada, run_id diferente e ordem de linhas diferente | Mesmo content_hash; versão reutilizável |
| A13 | Refresh falhou/materializada atrasada | Manifesto reflete falha/água-marca real e política do módulo |
| A14 | Contrato inactive e profile diferente | Módulos/slides corretos; nenhum inactive renderizado |
| A15 | Coletor retorna complete | Sucesso, não incidente |
| A16 | Duas publicações, lease expirado, worker atrasado | Sem promoção concorrente; resposta ambígua reconciliada |
| A17 | Falha após cada escrita/clear/página/narrativa/commit | Recovery independente restaura ou retoma e verifica conteúdo |
| A18 | Artefato anterior inacessível; restore falha | Preflight bloqueia ou recovery_failed visível; nada declarado íntegro |
| A19 | Stage legado fora do controlador | Rejeitado sem alterar destino |
| A20 | Reader tenta atualizar; anon chama refresh/renderer | Acesso negado sem efeitos |
| A21 | Usuário acessa export de outro escopo | Acesso negado, inclusive cache hit/URL |
| A22 | Selecionar mídia e depois CRM; dois usuários simultâneos | Downloads isolados; números estáveis; deck vivo intacto |
| A23 | Frente indisponível selecionada; seleção vazia | Quadro de status incluído; vazio rejeitado |
| A24 | Export histórico durante atualização atual | Uma única versão/hash por arquivo |
| A25 | PDF/PPTX selecionados | Ordem, páginas, capa, avisos e links corretos; abrir/renderizar com sucesso |
| A26 | Export acima do limite ou resposta truncada | Erro explícito; nenhum arquivo marcado ready |
| A27 | UI recebe stale/built/certified/rejected/recovery_failed | Estados coerentes, polling controlado, ações apropriadas |
| A28 | Coleta parcial falha após alguns lotes | Latest certificado não incorpora fragmento; retry sem duplicação inútil |
| A29 | Queda real de negócio com dados completos | Publica resultado e sinal; não bloqueia por limite arbitrário |
| A30 | Google indisponível | GaaS mostra falha/integridade desconhecida; versão anterior identificada |
| A31 | Nova frente adicionada ao registro | Aparece no catálogo e export sem hardcode no card |
| A32 | Deploy final | main SHA, funções, migrations e bundle público correspondem às evidências |

Transformar as reproduções atuais em testes do comportamento correto. As assertions de defeito no verify-findings.mjs não são testes verdes da nova implementação. Testes por presença de strings não comprovam contratos, concorrência nem recuperação.

Executar unitários de engine/contratos; integração SQL/RLS; adapters Google em destinos privados de teste; encerramento real do worker em ambiente controlado; E2E do fluxo no app; renderização de PDF/PPTX e avisos. Não exigir golden visual de todos os slides que não foram redesenhados; exigir QA dos estados novos e amostras representativas, além de integridade global.

Medições obrigatórias: duração e retries por etapa, linhas/bytes lidos, tamanho de artefato/export, chamadas Google, cache hit, tempo de recuperação e idade das fontes. Antes do merge, fixar orçamentos a partir do plano efetivo e benchmark real. Cada etapa deve ter margem em relação aos limites de runtime; o watchdog de 15 minutos não é orçamento da Edge Function.

## 15. Release, reversibilidade e evidências

Antes de promover:
1. Reconfirmar Git, Supabase e integridade atual do Google; o ponteiro no banco não prova que o destino está íntegro.
2. Mapear migrations locais/remotas por conteúdo. Não rodar db push/repair mecanicamente.
3. Criar migrations com CLI apropriada, versionar e testar caminho de upgrade. Preferir expand/contract e compatibilidade legada; não apagar histórico.
4. Executar verificações da matriz e npm run build; executar checagem TypeScript/Deno/lint aplicável e separar dívida preexistente de regressão.
5. Rodar advisors e testes de autorização.
6. Validar recuperação em destinos de teste antes de tocar o vivo.
7. Guardar artefato e release anterior utilizáveis; documentar rollback de código e compensação de dados/destinos.

Integrar na main pelo mecanismo permitido pelo repositório. Deploy deve incluir migrations, Edge Functions e frontend na ordem compatível; merge não presume deploy automático do Supabase.

Depois:
- Conferir funções/código implantados, migration history, app público e SHA.
- Executar relatório real parcial com dados disponíveis, sem fabricar B2C.
- Verificar conteúdo do Sheets/Slides contra o artefato e exportações.
- Conferir avisos no Google, GaaS e arquivos.
- Registrar version_id, run_id, publication_id, hashes, links autorizados, testes, screenshots/PDFs e limites restantes.
- Atualizar vault e recompilar com python scripts/bundle_vault.py.
- Entregar relatório de release. Se gate falhar, registrar pendência específica e continuar correção; não declarar completo só porque está na main.

## 16. Rastreabilidade da auditoria

| Achado do parecer | Requisito desta spec |
|---|---|
| F01 roteamento | D1, A01/A19 |
| F02 grão/evento | Seção 7, A02/A03 |
| F03 missing | Seções 6–7, A04/A05 |
| F04 cutoff | Seção 7, A06/A07 |
| F05 certificação | Seção 8, A10/A11 |
| F06 recuperação | Seção 9, A17/A18/A30 |
| F07 staging/lock | Seção 9, A16/A19 |
| F08 segurança | Seção 11, A20/A21 |
| F09 runtime | D4/D6, medições e workers curtos |
| F10 idempotência | Seção 8, A12 |
| F11 refresh | Seção 7, A13 |
| F12 frontend | Seção 12, A27 |
| F13 coletor | D6, A28 |
| F14 contratos/config | Seções 5/7, A14/A15/A29/A31 |

## 17. Referências técnicas verificadas na preparação

- [Limites de Edge Functions](https://supabase.com/docs/guides/functions/limits): worker tem limite de duração, memória e CPU; duração de ciclo do report não equivale à duração de uma invocação.
- [Supabase Queues](https://supabase.com/docs/guides/queues): base para avaliar fila durável; a aplicação continua responsável pela idempotência dos efeitos externos.
- [Formatos de exportação do Google Drive](https://developers.google.com/workspace/drive/api/guides/ref-export-formats): apresentações suportam PDF e PPTX.
- [files.export](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/export): verificar limites e opções suportadas; não depender de parâmetros de seleção de páginas não documentados.
- [presentations.batchUpdate](https://developers.google.com/workspace/slides/api/reference/rest/v1/presentations/batchUpdate): operações agrupadas e controle de escrita devem ser usados dentro dos limites do serviço, sem inferir transação entre serviços.

A IA implementadora deve consultar documentação atual antes de escolher APIs/flags. As referências acima sustentam capacidades técnicas; as escolhas de arquitetura são recomendações de engenharia desta spec.
