---
tags: [engenharia, gaas, report-live, versionamento, publicacao, slides, supabase]
tipo: engenharia
camada: codigo
tipo_diataxis: explanation
atualizado: 2026-09-23
status: producao-v1
fonte: codex-gpt5
---

# Report Live — versionamento, certificação e publicação

Definição: o Report Live continua sendo **uma planilha-mestre e um único Google Slides vivo**. Versionar não significa criar cópias do deck; significa guardar os insumos e o blueprint de cada execução para que a publicação seja reproduzível, comparável e reversível.

Fonte editorial: `MASTER_DECK_SPEC.md`. Fonte operacional: [[Report-Live-Sheets-Slides]]. Handoff de contexto: [[Report-Live-V4-Growth-Context-Handoff-Codex]].

## Estado confirmado em 23/07/2026

- Pipeline: Supabase → Sheets mestre → Slides vivo → PDF privado.
- Sheet fixo: `1BYLpYzDvppMC32ITfbSQdejB3RSxOcAdJZteCd54nwA`.
- Deck fixo: `1iGAdoxp1yC91v9_Y0zCD0XHrkjZvUrikyLXbKP-_wv0`.
- Última execução verificada: run `d6d1a08b`, `publication_valid=true`.
- Resultado do run: 49 páginas; 47 `render`; 2 `render_com_limites`; 9 omitidas.
- Parceiros canônicos no run: Serasa, Plurix, Proprietária, Bem Barato e Dia. Nenhum capítulo `N/A`.
- Regra de parceiro: preservar `partner_raw`; derivar `canonical_partner`, motivo e confiança. Jornada não é fonte de parceiro.
- Regra institucional: `N/A` bruto pode representar cartão próprio B2C ou o próprio parceiro Plurix; por isso não deve ser descartado nem tratado automaticamente como parceiro externo.
- Custo CRM foi propagado pela fonte canônica de tarifas; C3, C6 e P1 voltaram a renderizar CAC sem fallback.
- Exportação de PDF já existe: Drive API → bucket privado `report-live` → URL assinada de sete dias em `report_runs.pdf_path`.

## Princípio de arquitetura

O deck é um **deployment target**, não a fonte de verdade. Uma execução publicável carrega seis versões independentes:

1. `source_version`: cutoffs, contagens, cobertura e hash dos dados.
2. `semantic_version`: taxonomia, parceiro canônico, métricas e regras.
3. `spec_version`: contrato editorial do Master Deck Spec.
4. `narrative_version`: textos, ações e limites de leitura.
5. `renderer_version`: design tokens, arquétipos e código de renderização.
6. `publication_version`: o estado efetivamente promovido ao deck vivo.

Mudanças em qualquer camada devem produzir um novo blueprint, mas só a fase `publish` altera o deck vivo.

## Máquina de estados

`queued → building → built → certifying → certified → publishing → published`

Saídas excepcionais:

- `rejected`: validação reprovada; não publica.
- `failed`: falha técnica; não publica.
- `superseded`: build válido substituído antes da publicação.
- `rolled_back`: publicação retirada e substituída por uma versão anterior certificada.

O status técnico da função e o status editorial da publicação são separados. `done` não pode significar automaticamente “publicado”.

## Contrato mínimo de persistência

| Entidade | Função |
|---|---|
| `report_runs` | identidade do build, seis versões, hashes, idempotência e estado |
| `report_run_sources` | snapshot de cada fonte, cutoff, cobertura, contagem e hash |
| `report_slide_blueprints` | representação imutável de cada slide antes do Google Slides |
| `report_validations` | testes automáticos, severidade, evidência e resultado |
| `report_publications` | histórico do que foi promovido ao único deck |
| `report_approvals` | aprovação ou rejeição humana quando exigida |
| `report_slide_runs` | elegibilidade, prontidão e confiança observadas no run |

Artefatos pesados ficam no bucket privado `report-live`:

`runs/<run_id>/source/`, `blueprints/`, `previews/`, `validation/` e `publication/`.

## Protocolo de execução

### 1. Build

- Adquirir lock por `report_profile × período`.
- Resolver uma `idempotency_key`.
- Ler fontes e gerar manifesto.
- Gerar tabs, narrativas determinísticas, ações-candidatas e blueprints.
- Calcular hashes canônicos.
- Persistir tudo sem alterar o deck vivo.

### 2. Certify

- Validar contratos CT-1 a CT-9.
- Reprovar null→0, delta contra missing, média simples de taxas e CPA sem evento.
- Validar campos obrigatórios por slide.
- Validar coerência entre prontidão, confiança e elegibilidade.
- Validar densidade, fontes mínimas e arquétipo visual.
- Comparar blueprint atual com a publicação anterior.

### 3. Publish

- Exigir build `certified`.
- Revalidar lock e hashes.
- Atualizar Sheets e o único deck vivo.
- Exportar PDF e registrar a publicação.
- Marcar a publicação anterior como `superseded`.

### 4. Rollback

- Selecionar uma publicação anterior `published` ou `superseded`.
- Reaplicar seu blueprint certificado no mesmo deck.
- Nunca recalcular dados durante rollback.
- Registrar quem, quando, motivo e publicação substituta.

## Idempotência e concorrência

- `idempotency_key = hash(profile + período + source_hash + semantic_version + spec_version + narrative_hash + renderer_version)`.
- Duas chamadas com a mesma chave retornam o mesmo build.
- Apenas uma publicação pode estar em curso por deck.
- Lock vencido pode ser recuperado; lock ativo não pode ser roubado.
- Toda escrita externa usa IDs determinísticos por `slide_instance_id`.

## Diff incremental

Cada slide possui:

- `data_hash`
- `narrative_hash`
- `visual_hash`
- `blueprint_hash`

O `blueprint_hash` classifica cada slide como adicionado, alterado, igual ou removido. O modo `diff` expõe essa comparação antes da publicação. Na primeira promoção, o renderer ainda faz reconstrução determinística de todo o conjunto gerenciado; o patch incremental por slide só deve ser habilitado depois que os canários comprovarem que ordem, links e IDs permanecem estáveis. O diff precisa ser legível: slide, campos alterados, impacto visual e severidade.

## Design system homologável

Direção aprovada: **tema claro Afinz**, derivado dos dois PPTX de referência; o tema escuro do app não é referência para a apresentação.

- Fundo: branco ou cinza muito claro.
- Texto: preto/grafite.
- Afinz ciano `#00C6CC` como cor primária.
- Lima `#D3FF00` reservado para takeaway, total ou destaque editorial; não usar como série comum.
- Séries: B2C/PF `#3B82F6` ou `#00C6CC`; B2B2C/PJ `#10B981`; Plurix `#A855F7`.
- Vermelho apenas para integridade ou direção inequivocamente ruim.
- Corpo mínimo: 11 pt; anexos: 9 pt. Nunca reduzir fonte para “fazer caber”.
- Fonte segura: Arial/Roboto. Lembra apenas após validar licença, instalação e fidelidade no PDF.

O renderer deve usar tokens e arquétipos, não coordenadas específicas por slide.

## Arquétipos iniciais

1. Capa/contrato.
2. Executive takeaway + KPIs.
3. Scorecard.
4. Série temporal/pacing.
5. Router/ranking.
6. Scatter de drivers.
7. Funil.
8. Matriz/heatmap.
9. Tabela analítica.
10. Action queue.
11. Quality gate.
12. Anexo técnico.

Cada slide declara seu arquétipo, nível de densidade, elementos obrigatórios, formato de missing e critério de aceite.

## P0 ainda aberto

1. Corrigir de forma estrutural o serializador posicional: missing deve manter sua coluna e nunca deslocar “anterior” para “atual”.
2. Fazer confiança e prontidão obedecerem ao estado real; slide bloqueado não pode carimbar `render`.
3. Corrigir C1: `run_manifest` e `core_kpis` precisam existir na fonte declarada, sem fallback silencioso.
4. Expor M3 como provisório enquanto aliases não estiverem certificados.
5. Corrigir A4: cobertura não pode mostrar 100% quando há campos sem consumidor ou exclusão justificada.
6. Formatar taxas pequenas sem arredondá-las visualmente para zero.
7. Substituir dumps monoespaçados e gráficos genéricos pelo design system claro e pelos arquétipos.

## Canários, golden run e caos

Canários iniciais: C0, C1, C3, C4, C8 e P4 Serasa. Eles cobrem contrato, narrativa, scorecard, série temporal, ação e funil.

- `golden run`: fixture estável com saída esperada por slide.
- `chaos run`: missing, zero real, cutoff divergente, parceiro não resolvido, taxa pequena, campanha sem ID e run concorrente.
- Nenhuma mudança de renderer é promovida sem passar pelos dois conjuntos.

## Critérios de aceite da primeira entrega

- Reexecutar com a mesma chave não duplica run nem slides.
- Build bloqueado não alcança `publish`.
- Rollback reaplica um blueprint anterior sem consultar fontes.
- Prontidão, confiança e elegibilidade não se contradizem.
- C1, C3 e C6 não usam fallback indevido.
- Missing permanece na sua coluna.
- Tema claro e tipografia mínima aplicados aos canários.
- PDF e manifesto da publicação ficam associados ao run.
- O único link vivo continua o mesmo.

## Atividade paralela para Claude Code

Missão: fazer um **Red Team da arquitetura de versionamento do Report Live**, em modo somente leitura.

Ler `MASTER_DECK_SPEC.md`, esta nota, o handoff atual, a auditoria 44/44, migrations e as duas Edge Functions. Entregar em chat:

1. dez principais modos de falha;
2. avaliação de idempotência, concorrência e rollback;
3. schema mínimo suficiente e pontos de overengineering;
4. máquina de estados revisada;
5. matriz de invariantes por fase;
6. testes adversariais;
7. critérios objetivos de aceite.

Não editar arquivos, não executar migrations e não tocar no deck vivo. O objetivo é confrontar a implementação do Codex antes da promoção a produção.

## Decisão de rollout

Implementar por **arquétipo**, não por capítulo de parceiro:

1. fundação de versões e certificação;
2. canários;
3. arquétipos executivos;
4. arquétipos de parceiro;
5. mídia e B2C;
6. anexos;
7. publicação completa.

Isso permite evoluir um único renderer e aplicar o aprendizado a todos os slides equivalentes.

## Implementação executada em 23/07/2026

### Código e schema

- Migration local `20260724010000_report_live_versioned_publication.sql`.
- Módulo `report-live-versioning.ts` com hashes SHA-256, artefato imutável, idempotência, blueprints e validações.
- Runtime `report-sync/index.ts` separado em `build`, `certify`, `publish` e `rollback`; o modo completo preserva o botão único, mas passa pelo gate.
- Modo `diff` compara blueprints com a publicação anterior e registra o resumo na publicação.
- Lock exclusivo por deck com TTL e liberação em `finally`.
- Histórico em `report_publications`; PDF virou requisito de uma publicação concluída.
- `resume_structure` usa o fluxo versionado quando existe artefato; recuperação legada exige `allow_legacy_resume:true`.
- Design system compartilhado em `_shared/report-live-design.ts`, tema Afinz claro e arquétipos.
- Renderer atualiza também o spec de gráficos já existentes; não conserva silenciosamente o azul genérico.

### Correções analíticas

- C1 ganhou `VIEW_EXECUTIVE_READING` com `run_manifest` e `core_kpis`.
- `bloqueado_snapshot`, `bloqueado_fonte` e `bloqueado_produtor` não recebem mais `render` fora do core.
- Confiança varia por cobertura observada, cutoff e volume.
- A4 usa `unmapped` para campo ainda sem consumidor/exclusão; remove o 100% artificial.
- M3 declara `source_id` versus `alias_pending`.
- Percentuais menores que 0,1% usam três casas.

### QA local

- Bundle das duas Edge Functions: aprovado.
- TypeScript dos módulos puros: aprovado.
- Golden run: aprovado.
- Chaos run: reprovou corretamente tabela não retangular e fallback de C1.
- Build Vite de produção: aprovado.
- Skill `report-live-release-engineer`: criada e validada.
- Playbook atualizado: `outputs/report-live-playbook/Playbook_Report_Live_Afinz_GaaS_v1.2_Release_Engineering.docx`.

### Ambiente vivo preservado

Nenhuma migration ou Edge Function foi promovida nesta rodada. Produção permanece em `report-sync` v23 e `report-sync-v4-setup` v11. O último run confirmado continua `d6d1a08b`, com `publication_valid=true`, qualidade directional, 47 render, 2 com limites e 9 omitidos.

Motivo: a própria arquitetura nova exige red team, migration rastreada, certificação sem escrita e canários antes de alterar o único deck vivo.

### Limite de QA do Word

O DOCX abre e passou na auditoria estrutural (228 parágrafos, 57 tabelas, seção 14 antes do apêndice, sem placeholders). O renderizador LibreOffice não está instalado e a exportação COM do Word travou; portanto a v1.2 ainda não recebeu o gate visual página a página.

## Parecer Red Team reconciliado — 23/07/2026

O parecer do Claude identificou riscos reais, mas avaliou majoritariamente o runtime anterior à migration `20260724010000` e ao módulo `report-live-versioning.ts`. A decisão correta foi não aceitar nem rejeitar o parecer em bloco: cada achado foi confrontado com o código atual.

| Achado | Situação após reconciliação | Resposta implementada localmente |
|---|---|---|
| F1 — concorrência | Parcialmente resolvido antes; faltava exclusão global e heartbeat | `active_run` + índice único, HTTP 409, lock por deck renovável e watchdog |
| F2 — apaga antes de criar | Procedente e crítico | renderer cria a geração nova, relê a API, e só então remove a anterior |
| F3 — falha parcial não idempotente | Procedente | IDs por release + limpeza da geração parcial + restauração do artefato anterior |
| F4 — gate depois da mutação | Já resolvido no fluxo novo | build e certify antecedem qualquer escrita externa; regressão e edição manual também entram no preflight |
| F5 — sem ponteiro do live | Procedente | singleton `report_live_pointer`, atualizado no commit transacional |
| F6 — colisão por truncamento | Procedente | IDs curtos baseados em SHA-256; prefixo humano deixa de ser identidade |
| F7 — registry lido do Sheets/A1:J500 | Procedente | `VIEW_REGISTRY` é enviado do artefato certificado; fallback do Sheet é apenas recuperação explícita |
| F8 — memória sobrescrita por ciclo | Procedente | `report_run_memory` preserva histórico por `run_id`; `report_memory` vira só projeção legada do último ciclo |
| F9 — config `do nothing` | Procedente | migration aditiva usa merge `defaults || valor_existente`, preservando override e incorporando campos novos |
| F10 — sem watchdog | Procedente | função de stale + limpeza de locks + job `pg_cron` a cada cinco minutos |
| F11 — PDF mutável/expirável | Procedente | caminho imutável por publicação, SHA-256, contagem de páginas e URL assinada apenas como acesso temporário |

### Invariantes novos

1. Existe no máximo um `report_run` ativo.
2. Um build vazio, sem CRM ou sem slide renderizável nunca chega ao Google.
3. Queda material acima de 30% em slides ou cartões CRM exige aprovação `regression_override`.
4. Divergência entre o fingerprint do deck vivo e a última publicação exige `manual_edit_override`.
5. A geração anterior permanece visível até a nova estar completa.
6. O PDF precisa ter exatamente a mesma quantidade de páginas que o artefato tem de slides renderizáveis.
7. O ponteiro `live` só avança no commit transacional final.
8. Em falha depois da primeira escrita externa, o runtime reaplica o artefato anterior.

### Exemplo de funcionamento

Publicação A está viva com 49 slides. O run B é construído sem tocar no Google, certificado e comparado com A. Se B cair para 30 slides, a publicação para e pede aprovação. Se aprovado, o Sheet recebe o snapshot B; o Slides cria todos os objetos `rlv2` da geração B enquanto A continua presente. A API é relida, as narrativas são aplicadas, o fingerprint é calculado e o PDF é exportado. Apenas com 49 slides gerenciados e 49 páginas no PDF o commit marca B como `published`, A como `superseded` e move o `report_live_pointer`. Se qualquer etapa falhar antes do commit, B é removido e A é reaplicado.

### Testes locais

- Golden/chaos do contrato analítico: aprovado.
- 21 verificações Red Team: aprovado.
- Bundle das duas Edge Functions: aprovado.
- IDs longos semelhantes: sem colisão e estáveis.
- Snapshot vazio: bloqueado.
- Regressão material: bloqueada.
- Ordem create-before-delete: verificada no código.
- Registry silencioso via Sheet: proibido.

### Bloqueio honesto de promoção

`supabase db push --dry-run --linked` não chegou a validar a migration porque o projeto remoto possui versões antigas ausentes no diretório local. Nenhum `migration repair`, `db pull`, DDL ou deploy foi executado automaticamente. Antes da promoção é obrigatório reconciliar o histórico de migrations em uma janela controlada, validar a SQL num ambiente descartável, aplicar migration, fazer deploy e executar canários.

### Artefatos desta rodada

- `calendar-estrategico/scripts/verify-report-live-red-team.ts`
- `calendar-estrategico/supabase/functions/report-sync/report-live-versioning.ts`
- `calendar-estrategico/supabase/functions/report-sync/index.ts`
- `calendar-estrategico/supabase/functions/report-sync-v4-setup/index.ts`
- `calendar-estrategico/supabase/functions/_shared/report-live-design.ts`
- `calendar-estrategico/supabase/migrations/20260724010000_report_live_versioned_publication.sql`
- `outputs/report-live-playbook/Playbook_Report_Live_Afinz_GaaS_v1.3_Red_Team_Hardening.docx`

## Promoção executada — publicação v1

Em 23/07/2026, a fundação deixou de ser apenas local e foi promovida ao ambiente vivo com gates separados. O contrato de manter **um único Sheet e um único Slides vivo** foi preservado.

### Estado vivo confirmado

- Run publicado: `e549d750-1ad1-4ac0-9852-c53aa10a7328`.
- Publicação: `c6d86570-9b50-4b53-85fc-f1acaac888cd`, versão `1`.
- Edge Functions: `report-sync` v34 e `report-sync-v4-setup` v12.
- Ponteiro `report_live_pointer`: movido apenas no commit final.
- Sheet vivo: `1BYLpYzDvppMC32ITfbSQdejB3RSxOcAdJZteCd54nwA`.
- Slides vivo: `1iGAdoxp1yC91v9_Y0zCD0XHrkjZvUrikyLXbKP-_wv0`.
- PDF imutável: `runs/e549d750-1ad1-4ac0-9852-c53aa10a7328/publications/c6d86570-9b50-4b53-85fc-f1acaac888cd.pdf`.
- PDF: 38 páginas, 1.081.278 bytes, SHA-256 `47f0534327067120b20ab4150979060178f07495d3096df5a417d82fbce616f3`.

### Resultado do build e da certificação

- 18 fontes versionadas.
- 47.178 linhas brutas preservadas em snapshots imutáveis.
- 988 linhas em views derivadas.
- 48.166 linhas efetivamente preparadas no Sheet.
- 58 instâncias avaliadas: 36 `render`, 2 `render_com_limites` e 20 `omitir_bloqueado`.
- 38 slides publicados e 38 páginas confirmadas no PDF.
- 16 gráficos vinculados atualizados.
- 8 validações de certificação aprovadas, incluindo CRM obrigatório, fontes não vazias, tabelas retangulares, narrativa presente, coerência prontidão/confiança/elegibilidade, C1 sem fallback e gate de qualidade.

### Evolução criada durante o rollout

O primeiro build monolítico gerou um JSON de 47,7 MB. A causa era a duplicação das bases brutas dentro do artefato principal, com `media_actions` sozinho ocupando cerca de 31,5 MB. O formato foi substituído por:

1. manifesto de build com aproximadamente 300 KB;
2. snapshot separado por fonte;
3. fontes grandes divididas em lotes de 500 linhas;
4. hashes e contagens no manifesto;
5. preparação do Sheet por checkpoint: core, uma fonte por vez e commit de contagem;
6. publicação do deck somente após `sheet_staged`.

Essa separação respeita o limite de 150 segundos das Edge Functions. Uma falha em uma fonte pode ser repetida sem reconstruir ou reescrever as demais.

### Fluxo operacional em produção

`build → certify → stage_sheet_core → stage_sheet_source × N → stage_sheets_commit → publish → PDF → commit`

- `build` não toca no Google.
- `certify` usa manifesto, hashes, blueprints e regras de qualidade.
- Cada `stage_sheet_source` é idempotente e escreve uma aba completa com `_snapshot_row_number`.
- `stage_sheets_commit` confere a contagem de cada aba contra o snapshot.
- `publish` cria a nova geração de slides antes de remover a anterior, atualiza narrativas e gráficos, exporta PDF e só então move o ponteiro live.

### QA visual da publicação v1

O PDF de 38 páginas foi renderizado e revisado integralmente. Não há página faltante, placeholder `Add a series`, `undefined`, `NaN`, `#REF!` ou gráfico vazio no C6. O tema claro Afinz, os chips de confiança, o roteamento, os funis, o scatter e a estrutura por arquétipo estão ativos.

Limite editorial explícito: a fundação visual é funcional, mas ainda não é o acabamento final do Master Deck Spec. C3 e parte dos slides P1/anexos ainda mostram a view como texto tabular; várias leituras laterais permanecem determinísticas e genéricas. A próxima fase é reconstrução visual por arquétipo, slide a slide, sem reabrir a arquitetura de publicação.

### Próxima frente

1. Scorecard real para C3, com cards, deltas e estados de dado.
2. Resultado/contribuição P1 com KPIs e waterfall, sem dump textual.
3. Tabelas analíticas Afinz para anexos e qualidade.
4. Narrativas `Sinal → Impacto → Causa → Evidência → Ação → Confiança` específicas por slide.
5. Golden images e critérios de aceite para 100% dos 38 slides publicados.

## Revisão de engenharia — 09/09/2026

Auditoria de código da branch `feat/report-live-v1` (HEAD `0c85473`), código obtido das Edge Functions publicadas e consultas somente de leitura ao Supabase. Não houve deploy, migration, refresh, limpeza ou publicação Google.

Parecer e reproduções locais: [Parecer de engenharia do Report Live](<../../calendar-estrategico/outputs/report-live-engineering-review-2026-09-09/PARECER_ENGENHARIA_REPORT_LIVE.md>).

- Produção confirmada em `report-sync` v37 / `report-sync-v4-setup` v15; ponteiro permanece na publicação v1 `c6d86570`, run `e549d750`. O código publicado corresponde ao snapshot `wip/report-live-local-snapshot-20260903`; `main` ainda não representa esse runtime completo.
- A publicação de julho foi iniciada com `run_mode=build`; os aproximadamente 838 segundos do ciclo não comprovam uma única invocação longa. O watchdog de 15 minutos não é o limite da Edge Function.
- Manifestos de agosto e setembro retornaram `blocked`: B2C termina em 20/07, sem cutoff nesses períodos. A otimização de leitura não elimina esse bloqueio.
- Reproduções offline confirmaram: `cleanup_sheet_tabs` cai no fluxo `full`; M3 soma níveis ad/adset/campaign; pacing converte custo ausente em zero; scorecard integrado ignora seu cutoff; certificação aceita alteração de valores sem revalidar hashes; idempotência varia com `run_id`.
- O rollback externo depende de `catch` no worker; watchdog não restaura Sheets/Slides. Os modos de staging escrevem na planilha viva fora do lock/gates de publicação. Integridade atual do Google não foi aferida nesta rodada.
- As tabelas `report_*` têm RLS; a materializada e a RPC de refresh têm acessos anon/authenticated que precisam ser restringidos. O card não trata `stale` como terminal.

Próxima sequência recomendada: reconciliar base publicável → corrigir roteamento/acesso/estados → semântica e certificação executável → etapas duráveis e recuperação independente → recuperação assistida com fontes válidas → limpeza por inventário revisado → evolução editorial. Os commits `2c623d0` e `b3427bd` não devem ser promovidos isoladamente como solução completa.

Esta revisão é evidência posterior às declarações históricas de garantia acima; não equivale a correção implementada nem a nova homologação visual.

## Spec de implementação alinhada com Pablo — 09/09/2026

Após a auditoria, Pablo definiu: escopo completo; atualização automática do Slides; publicação parcial por frente com avisos vermelhos e motivo conhecido/possível; seleção de frentes para download; liberdade de arquitetura; autorização para a IA implementadora integrar na main e fazer deploy. O refinamento individual de slides fica para outra etapa.

Essas decisões substituem a sugestão anterior de aprovação humana em cada publicação e de bloqueio global por ausência de B2C. Integridade continua obrigatória: métricas inválidas não são publicadas como números; a frente indisponível é representada por aviso certificado. Falha de escrita no Google deve ser exposta no GaaS, sem prometer que o aviso chegou ao destino.

Desenho recomendado: artefato modular imutável como referência, GaaS como viewer/catálogo, Google como destino/renderer, exportações privadas por seleção e execução durável com recuperação independente. Preservar links vivos na transição. PDF/PPTX selecionados não devem alterar o deck vivo nem recalcular indicadores.

- [Spec completa e critérios de aceite](<../../calendar-estrategico/docs/plans/SPEC_REPORT_LIVE_MODULAR_AUTOMATICO_V1.md>).
- [Prompt para a IA implementadora](<../../calendar-estrategico/docs/plans/PROMPT_IMPLEMENTAR_REPORT_LIVE_MODULAR.md>).

Status: documentação preparada e revisada; implementação, deploy e nova publicação não executados nesta rodada. A spec contém entregas D0–D7 e aceitação A01–A32, incluindo rastreabilidade dos achados F01–F14.

## Reconciliação de dados e Sheets — 09/09/2026

Ver [[Ficha-Tecnica-Growth-e-Auditoria-Report-Live-2026-09]] e seus entregáveis. A leitura autenticada do Sheets resolveu uma incerteza anterior: 66 abas VIEW_/VP_ estão vazias e as fontes/perfil preenchidos não representam uma geração única compatível com o ponteiro de julho. Isso exige recuperação verificada; não basta presumir rollback porque a publicação v1 continua registrada.

A auditoria também separou aritmética legada reconciliada de erros semânticos, custos/CAC inconsistentes e dados históricos alterados. Nenhuma correção ou publicação foi executada.

## Direção futura da V2 — memória e aprendizado

Pablo aprovou guardar o planejamento em [[Report-Live-V2-Loop-de-Aprendizado-e-Memoria]]. A proposta separa contexto versionado do vault, evidências históricas e memória revisada, com reutilização dentro e fora do Report Live. A revisão de memória não bloqueia publicação automática. Status: planejamento futuro, sem implementação e sem ampliação automática do próximo prompt de desenvolvimento.

## Próxima implementação: agosto correto e produto completo — 09/09/2026

Pablo confirmou: escopo mais completo (viewer, histórico, PDF/PPTX por frente), prioridade inicial de investigar lacunas, recuperar dados corretamente e validar, período 01–31/08/2026 e público/tom da primeira aba BRIEFING do Sheets. A memória V2 permanece futura. A atualização automática com avisos explícitos permanece autorizada.

Documento principal para Claude Code: [SPEC_REPORT_LIVE_AGOSTO_2026_CLAUDE_CODE.md](../../calendar-estrategico/docs/plans/SPEC_REPORT_LIVE_AGOSTO_2026_CLAUDE_CODE.md). Substitui a sequência imediata do handoff modular anterior. Três marcos: dados investigados/recuperados; agosto publicado após gates técnicos; produto completo verificado. A publicação correta pode preceder o término do viewer, sem encerrar a implementação contratada.

Preparação somente de leitura em produção: BRIEFING autenticado confirma gerentes/diretores internos e consultoria, leitura executiva de cinco minutos; REPORT_PROFILE ainda aponta junho. A spec preserva síntese executiva e detalhe por frente. Valores de exemplo e budgets sem vigência no Sheets não homologam agosto.

Consulta de agosto: activities tem 809 linhas e 97 divergências de CAC armazenado versus custo/cartões; B2C sem agosto; Google até 17/08; rentabilização até 23/08. Datas de cobertura não provam dias operacionais faltantes: comparar execução esperada e origem. Novas evidências e SQL em calendar-estrategico/outputs/report-live-august-spec-2026-09-09/. Reproduções dos defeitos de engine/certificação reexecutadas; nenhuma correção de produto ou publicação feita nesta preparação.

## Execução assumida pelo Codex — 11/09/2026

Estado posterior à preparação acima: implementação em andamento na branch `codex/report-live-august-durable`. Registro operacional: [REPORT_LIVE_TAKEOVER_CODEX_2026-09-10.md](../../calendar-estrategico/docs/plans/REPORT_LIVE_TAKEOVER_CODEX_2026-09-10.md).

Migration `20260910171740_report_live_durable_build_steps.sql` aplicada: captura imutável, jobs por etapa, leases e autenticação privada do worker. A candidata isolada `report-sync-build-candidate` aceita somente build/worker; não publica no Google. Primeira execução `fe7dc078-821b-42b9-b2da-3464f6ba0a03` completou persistência e certificação técnica, sem ativação/publicação. A v2 foi implantada em 11/09, com nova execução `cf3e78c5-51ed-44f3-b0e8-f11ef4819659` ainda em validação.

Atualização da execução: candidata v2 `cf3e78c5-51ed-44f3-b0e8-f11ef4819659` concluiu todas as etapas e certificação técnica (pg_net 390–395), permanece inativa e com publicação pendente. Quatorze testes locais passaram. O ajuste mais recente de B1 (validar CRM e B2C em suas respectivas linhas, não somar B2C parcialmente preenchido como completo) foi feito após o deploy v2 e ainda precisa entrar no próximo candidato. Cobertura: ausência versus zero, CAC parcial, cutoff, identidade de artefato, adulteração após build, contratos obrigatórios, manifesto do snapshot e independência de CRM em relação à ausência de B2C. Ainda faltam recuperação independente da publicação, QA Google/PDF, testes operacionais de retomada, viewer/exportações e integração na main. Endpoint canônico, renderer vivo e documentos Google não foram promovidos nesta etapa.

Reconciliação de agosto: 809 linhas CRM, 2.849 cartões e custo registrado 45.391,037184; 555 linhas de mídia e gasto 13.157,740061. Isso valida os totais contra as fontes, não resolve automaticamente as 97 divergências de CAC armazenado nem certifica atribuição.

Consulta Meta somente leitura: campanha governada `120250049222750723` não retorna linhas em 25/08; 24 e 26/08 retornam eventos residuais com gasto observado zero. Ausência em 25/08 permanece ausência. Fonte governada de eventos cobre uma de oito campanhas Meta em agosto; nomes com prefixo Fábrica de Vendas têm anúncios distintos e não autorizam fusão por semelhança. Nenhum backfill ou ajuste de custo foi aplicado por hipótese.

### Proteções de retomada e candidata v3 — 11/09

Migration `20260911230725_report_live_build_transition_guards.sql` aplicada: transições válidas, snapshot/checkpoint/artefato obrigatórios nas etapas correspondentes, conclusão com certificação ou duplicata identificada. Teste SQL de integração passou e reverteu integralmente as simulações: rejeição de token errado, lease expirado, salto de etapa e checkpoint inválido; retomada com novo token; exclusividade de claim; limite de tentativas. Isso não equivale a teste de interrupção durante escrita Google.

Candidate v3 (`semantic=1.2.2`) implantado. Run `9bb55892-4b17-4f76-825a-0ac97c92b525` completou refresh, captura, cálculo, persistência e certificação (396–401). B1 mostra apenas as métricas B2C como ausentes, preservando CRM. Testes HTTP negaram acesso sem autenticação e rotas de publicação no candidato isolado.

Código de publicação agora revalida hashes/fontes/contratos no ponto comum anterior às escritas, inclusive para rollback, mas o endpoint canônico ainda não recebeu essa alteração. Card do GaaS foi ajustado localmente para distinguir build certificado de publicação confirmada e respeitar `active_run`; não houve deploy do frontend. Permanecem pendentes publicação durável com recuperação independente, QA Google/PDF, produto completo e main.

### Preservação e comparação do Google — 12/09

Inspeção do candidate v4 (somente leitura Google, pg_net 402) comparou 69 tabelas com agosto: nenhuma coincide integralmente; duas abas ainda não existem. Evidência detalhada no registro operacional e em `calendar-estrategico/outputs/report-live-takeover-2026-09-10/publication-audit-2026-09-12.json`. Valores/fórmulas das abas afetadas, metadados e JSON Slides foram salvos e relidos no Storage privado com hash verificado. Esta evidência preserva o estado anterior, mas não comprova restauração automática.

Protocolo de publicação por etapas implementado e testado com efeitos simulados; comparação célula a célula distingue missing/zero e detecta resíduos. Total de 20 testes Node passou. Migration `20260912031223_report_live_publication_steps.sql` aplicada para checkpoints, leases, reserva exclusiva do deck e pausa após falhas; testes SQL passaram com rollback integral das simulações. Ainda falta conectar esse protocolo ao executor Google e à retomada operacional. Canonical publisher permanece v38; nenhuma publicação Google foi executada nesta rodada.

### Release isolada e proteções operacionais — 12/09

Implementação ativa em `.codex-worktrees/report-live-production`, branch `codex/report-live-production`, sobre main `2b4d488`. Registro atualizado em [takeover da release isolada](../../.codex-worktrees/report-live-production/docs/plans/REPORT_LIVE_TAKEOVER_CODEX_2026-09-10.md). Conta identificada no GaaS autenticado e configurada somente como operador do Report Live. Node 24.11.1, Deno 2.9.6 e CLI 2.117.0 padronizados; frontend e Deno com instalações separadas. Testes: 124 Vitest e 24 Node aprovados; build e Deno aprovados. Há 57 erros TypeScript reproduzidos também na main; gate bloqueia novos erros e documenta a dívida. CI/Pages localmente configurado, ainda sem promoção.

Candidate v6 somente build/inspeção implantado. Backup inspecionado confirmou 55 slides: 38 gerenciados e 17 modelos legados `v4sld_*` ainda com placeholders. Nos 38 gerenciados: 250 formas e 16 gráficos vinculados. Publicação precisa retirar os modelos antigos de forma recuperável; contagem apenas dos slides novos é insuficiente. Backup novo inclui tipos de célula, pois valores renderizados não distinguem fórmula de texto literal iniciado em `=`. Exportação local de PDF passa a preservar/reutilizar bytes e download histórico deixa de reexportar o deck vivo; narrativa/gráficos só podem alterar a geração correspondente.

Migration `20260912194845_report_live_worker_lease_guards.sql` aplicada: posse do worker por oito minutos e watchdog sem interferência em jobs duráveis, inclusive pausados. Teste SQL com run sintético e rollback confirmou reserva, posse e limpeza após conclusão. Nenhum job de publicação real foi criado, nem documento Google alterado. Executor completo, restauração demonstrada, manutenção, RLS, agendamento, homologação e deploy na main permanecem abertos.

### Fundação de dados — contrato mensal v1.6 — 13/09

Migration `20260913233223_report_live_monthly_series_quality_contract.sql` aplicada e registrada no projeto GaaS Framework Afinz. `v_aquisicao_mensal_canonico` passou a marcar mês fechado/parcial e dias cobertos, filtrar as faixas por denominador mínimo 30 com contadores de meses válidos por métrica e separar a série Serasa no corte de regime de 01/02/2026. O corte é uma limitação de medição: antes e depois dele, "aprovado" representa patamares incompatíveis e não pode compor a mesma faixa histórica.

Evidência no banco: agosto permanece reconciliado; Bem Barato usa cinco meses válidos na finalização e não incorpora o mês de 100% com quatro aprovados; Serasa agosto usa seis meses válidos, faixa de finalização de 2,41% a 5,28% e regime pós-fevereiro; setembro soma 46 disparos e 103 cartões, está marcado como parcial e tem até 11 dias cobertos. O teste SQL transacional passou sem escrita de dados. Após assumir a baseline v44 completa, o gate oficial reconfirmou **57 diagnósticos TypeScript preexistentes**, sem nenhum novo; os 38 do checkout antigo eram efeito do descompasso, não redução de dívida.

O fechamento de deploy foi interrompido antes de commit nessa inspeção: a função publicada `report-sync` v44 divergia materialmente do checkout. O baseline publicado continha módulos de geração, arquivo imutável e recuperação ausentes localmente, e portar o checkout diretamente removeria centenas de linhas do `index.ts`. Nenhum deploy, publicação Google ou push foi feito enquanto essa divergência não estava reconciliada.

### Reconciliação da v44 como fonte soberana — 13/09

Decisão aprovada por Pablo: quando o checkout divergir da Edge Function ativa, a **v44 sobrescreve o checkout, nunca o contrário**. O inventário no sentido publicado → local mostrou aproximadamente 1.299 linhas publicadas que seriam perdidas: 830 no `index.ts`, 8 no engine, 63 na policy, 12 na publicação, 37 no versionamento, além de 191 linhas de geração, 128 de recuperação, 21 de arquivo imutável e 9 do `deno.json` ausentes localmente. Essas linhas implementam publicação recuperável, gerações isoladas, PDF antes da ativação, RBAC e autenticação resiliente do worker; não são código órfão.

Os acréscimos locais foram isolados antes da substituição. A parte legítima e nova era exclusivamente a Fundação de Dados: equivalência SQL↔TypeScript no manifesto, correção do grão de canais, alerta `UNRESOLVED` com cartões e contrato mensal v1.6. O restante era implementação antiga das mesmas capacidades — exportação do deck vivo, publicação sem `activate`, staging/resume monolíticos e autenticação `operator/admin` — já substituída pela v44. Não foi encontrada terceira categoria nem funcionalidade inédita a preservar.

A extração MCP da função ativa foi confirmada byte a byte contra `origin/main` no commit `22973ef` (`feat(report-live): support team roles (#6)`). Portanto, a dívida real era uma branch operacional antiga, não ausência total no repositório. A release foi reconstruída sobre `origin/main`, com um commit marcador próprio de baseline antes de reaplicar o patch da Fase 1. Esse procedimento é obrigatório em futuras recuperações: inventariar e preservar o delta local, provar a identidade do runtime publicado e só então aplicar mudanças novas.

Resultado da promoção: baseline explícita no commit `38845f4`; Fundação de Dados no commit `02400e4`; branch `codex/report-live-data-foundation-release` publicada no remoto; `report-sync` v45 ativa com `verify_jwt=false`, import map preservado e hash de bundle `552647f014766697909063a597349f683af35e261203ce13ec2cfca373a9b66c`. A fonte baixada após o deploy corresponde exatamente, arquivo por arquivo, ao checkout de release. O health check público respondeu 200 com fundação, Google auth, IDs de Sheet/Slides e service key presentes; nenhuma publicação Google ou novo run foi disparado por essa verificação. O job PostgreSQL 17 de equivalência está acoplado ao workflow de validação e executará em pull request; localmente, a mesma matriz de 16 fronteiras passou em PostgreSQL 17.5.

### Integração da Fase 1 e preservação do checkout antigo — 13/09

O PR [#7](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/7) integrou a Fundação de Dados na `main` pelo merge commit `4dbb770325c68d1849babd5552edd07647dc1773`. No pull request, o job `validate` passou em 1m15s, junto com os checks do Vercel. Depois do merge, o workflow de `main` também passou integralmente: testes de frontend e Report Live, matriz de 16 casos SQL↔TypeScript em PostgreSQL, gate dos 57 diagnósticos TypeScript preexistentes, checks das Edge Functions, build de produção e deploy do GitHub Pages. Evidências: [job do PR](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/actions/runs/34793076649/job/103820869242) e [workflow pós-merge](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/actions/runs/34793175708).

A working copy definitiva passou a ser o clone `ACALENDARIO APP/.codex-worktrees/report-live-foundation-main`, em `main` limpa no commit `4dbb770`. O worktree temporário usado na release não é mais a base de continuidade.

O checkout antigo `calendar-estrategico`, branch `codex/report-live-august-durable`, **não pode ser descartado ainda**. A auditoria final separou três grupos:

1. Os arquivos modificados do runtime (`report-sync`, setup, card e workflow) são versões anteriores das capacidades recuperadas da v44; não contêm patch novo da Fase 1 a resgatar.
2. `docs/plans/CODEX_PROMPT_camada_editorial_2a.md` existe somente como arquivo não rastreado nesse checkout e não entrou no PR #7. Ele precisa ser incorporado deliberadamente antes de iniciar a Fase 2a.
3. `supabase/functions/report-live-meta-preview/index.ts`, as seções correspondentes de `supabase/config.toml` e diversos artefatos/evidências em `artifacts/` e `outputs/` também existem apenas localmente. São trabalho anterior ou evidência histórica, fora do escopo da Fase 1; devem ser arquivados ou reconciliados separadamente, nunca apagados junto com o checkout.

Consequência operacional: a Fase 1 está fechada e protegida no CI, mas a Fase 2a não deve começar usando o checkout antigo nem antes de o prompt exclusivo ser preservado numa branch rastreada.

### Recuperação documental, função Meta e arquivo morto — 13/09

A limpeza anterior à Fase 2 foi executada na working copy definitiva `.codex-worktrees/report-live-foundation-main`, branch `codex/report-live-recovery-docs-meta-preview`.

O commit documental `d956a2f` recuperou cinco contratos ainda vivos: ADR-003, SDD e índice da reconciliação AppsFlyer×Activities, a spec modular do Report Live e o prompt vigente da Fase 2a. O inventário `docs/plans/RECOVERY_NONVERSIONED_DOCUMENTS_2026-09-13.md` registra, arquivo a arquivo, os sete prompts e fotografias operacionais que não foram promovidos por estarem executados ou superados.

A Edge Function `report-live-meta-preview` foi confirmada ACTIVE no Supabase, versão 1, `verify_jwt=false`, bundle `e90dd3786c0b1c2fdf0303a30ee1357ea8db46c80a57648f1ef0f960487bf807`. A fonte publicada foi baixada e prevaleceu sobre a cópia local: havia uma diferença real no campo `spend` quando a API devolvia zero linhas. O commit baseline final `a10568b` preserva exatamente a fonte publicada, após normalização de quebras de linha, e a configuração de JWT; `deno check` passou.

Os 112 arquivos de evidência bruta do Report Live não foram adicionados ao Git. Foram movidos para `ACALENDARIO APP/archives/report-live-evidence-2026-09-13`, dentro do OneDrive, preservando 14.797.324 bytes e o multiconjunto de hashes SHA-256. O destino guarda `artifacts/report-live`, as pastas `outputs/report-live-*` inventariadas e o XLSX de export do audit de growth.

O checkout antigo `calendar-estrategico` foi marcado como arquivo morto: branch local renomeada para `archive/calendar-estrategico-original-20260913` e aviso `ARQUIVO_MORTO_NAO_USAR.md` na raiz. Ele não é base de desenvolvimento, commit ou deploy; permanece apenas para consulta de histórico ainda não descartado.

### Fase 2a — inventário bloqueante do renderer v45 — 13/09

O `SlideBlueprint` atual é um envelope de integridade, não um schema executável de layout. Ele preserva identidade do slide, fonte, elegibilidade, confiança, narrativa, contagem e hash dos dados, mais um contrato visual mínimo (`archetype`, `density`, versão, tema e corpo mínimo). Título, seção, público, ordem e fonte usada pelo renderer vêm de `VIEW_REGISTRY`, montada a partir de `report_slide_contracts`; a tabela vem das abas certificadas do artefato. O renderer não consome `slide_blueprints` para decidir geometria.

A composição do slide está codificada em `report-sync-v4-setup/index.ts`: slide em branco, cabeçalho/título/chip, uma área esquerda que recebe um único gráfico vinculado ou uma prévia textual, bloco fixo de leitura à direita e rodapé. Não existe primitiva `createLine` nem tabela nativa no renderer. Os gráficos são criados no Google Sheets a partir de um mapa fixo por `slide_code` e inseridos no Slides com `createSheetsChart` em modo `LINKED`.

`_shared/report-live-chart-policy.ts` não é uma política editorial ou de escolha de gráfico. Ela contém somente `usableNumericSeries`: reconhece séries com ao menos um valor numérico utilizável, preserva zero e números formatados e impede a criação de shells vazios. Tipo, domínio, séries, cor e posição continuam no setup.

Decisão bloqueante: desenhar valor, delta, série e faixa diretamente no Slides exigiria ampliar substancialmente o modelo de elementos, os IDs/checagens de completude, a geometria por arquétipo e a recuperação. A rota compatível com a arquitetura existente é **Sheets-backed**: valor e delta como formas/texto estáveis; série e faixa como gráfico preparado em aba de geração certificada e vinculado ao Slides. Essa rota ainda exige extensão incremental do contrato de gráfico para linha/faixa, mas não reescrita do renderer. Nenhum código da Fase 2 foi iniciado antes desta decisão.

Os dois perfis também não existem como projeções hoje. `report_profile` entra no run, manifesto e identidade do artefato, porém não filtra contratos, slides ou o `VIEW_REGISTRY`; todo contrato ativo é expandido e o único registry alimenta o único deck/PDF vivo. Para a Fase 2c, será necessária uma camada estrutural de projeção de saída que selecione e ordene slides por perfil sem recalcular nem alterar o artefato certificado de origem.

### Fase 2a — contrato editorial Sheets-backed — 14/09

A implementação da Fase 2a parte da branch `codex/report-live-editorial-2a-sheets`, no worktree definitivo. O componente mensal é uma única função determinística: recebe a linha corrente de `v_aquisicao_mensal_canonico` e as demais linhas do mesmo snapshot imutável, e devolve valor, delta, faixa, veredito e séries. As sete ramificações do contrato resultam em seis rótulos de veredito porque os dois casos de amostra fina compartilham `amostra_insuficiente`; mês aberto não ganha veredito novo.

A view mensal passa a ser capturada atomicamente em `report_frozen_inputs` e preservada em Storage como a fonte `monthly_acquisition`. O renderer não reconstitui esses números a partir de `activities`. Setembro pode entrar como ponto da série, mas `mes_fechado=false` suprime delta e veredito. Quando a janela cruza `regime_serie`, somente o regime atual é desenhado, sem bordas nem delta, junto da `limitacao_medicao`.

O Sheets recebe duas famílias de ranges de geração, não uma aba por parceiro: `VIEW_EDITORIAL_MONTHLY_CHARTS` para scorecards e funis CRM e `VIEW_EDITORIAL_PACING_CHARTS` para a linha diária acumulada. `VIEW_EDITORIAL_CHART_REGISTRY` associa cada slide ao bloco exato, às séries e aos eixos. O pacing sobrepõe os mesmos dias corridos do mês anterior e só inclui meta quando existir certificação explícita.

O limite permanece um gráfico vinculado por slide. A verificação anterior à ativação agora confere os IDs dos elementos editoriais, a cardinalidade do gráfico no slide, o `chartId`/`spreadsheetId` declarado no manifesto e a existência da fonte na aba física da geração. Um gráfico sem manifesto, ausente ou cuja fonte foi apagada bloqueia a progressão; `refreshSheetsChart` continua executado no passo de narrativa.

### Fase 2a — candidato certificado e mantido fora do ar — 14/09

O primeiro build real da revisão, run `87ce550f-1045-49d3-bebb-88b0b628c729`, foi rejeitado antes de tocar o Google porque `VIEW_EDITORIAL_MONTHLY_CHARTS` continha linhas de preenchimento não retangulares. O gate `tables.rectangular` foi o único bloqueio; hashes, identidade dos 57 slides e a fonte imutável `monthly_acquisition` passaram. A correção normalizou todas as linhas das famílias técnicas para a maior largura da tabela e adicionou regressão específica no teste de integração.

A revisão corrigida está nos commits `ae61b1f` e `2a03f1a`, PR `#9`. O Actions passou com 51 testes do Report Live, 124 testes gerais, `deno check`, build Vite e gate de TypeScript sem acréscimo sobre a dívida registrada de 57 diagnósticos. No Supabase ficaram ACTIVE `report-sync` v47, bundle `9e047fe5156f138963d71a4f3cc63e41b038ec946c082d373d6de73cd780dff0`; `report-sync-v4-setup` v22, bundle `6fd0e78a065effa858a387f4b3c678e282348927b9e1b362787824b5ed643d27`; e `report-sync-build-candidate` v21, bundle `204d9251268f47f3a5222cb56d009e03119d3473fe4340a7dc57d498395fdb30`.

O run substituto `5137402b-145d-44bf-8c10-08d926a71842`, período 01–31/08/2026, foi construído e certificado com spec `2a.0` e renderer `2.1-editorial-2a`. A geração física `5137402b_a64853cc` contém todas as abas ocultas com dimensões verificadas. Os 57 slides ficaram ocultos e a checagem reconciliou 33 de 33 gráficos vinculados com seus chart IDs, spreadsheet ID e objetos de origem. O PDF isolado tem 57 páginas, 2.328.823 bytes e SHA-256 `6f828cadb67c49cda5629fbfbb3390179b26bed90e9fef2a986248a4d87a0ded`. Além do objeto imutável no Storage, uma cópia de revisão foi preservada em `ACALENDARIO APP/archives/report-live-evidence-2026-09-13/phase-2a/report-live-2a-candidate-aug-2026.pdf`.

A inspeção visual cobriu C4 e todos os P1/P4 afetados. C4 mostra realizado e os mesmos dias corridos do mês anterior, sem inventar meta; P1 mostra cartões e CAC com valor, delta, faixa e veredito; P4 mantém as três taxas no funil padrão e reduz Serasa a cartões mais finalização, com a limitação de lead pré-qualificado explícita. Não foram observados cortes, sobreposições ou glifos quebrados nas páginas afetadas.

Não houve ativação. O job `9443c1fd-f942-4f94-898d-da813a69f5fd`, versão candidata 12, foi pausado em `activate`, com `google_state=staging`. O ponteiro vivo continuou na publicação `54649269-7cce-460a-a87d-b4cc5f310a62`, run `9bb55892-4b17-4f76-825a-0ac97c92b525`. O cron `report-live-worker` foi religado depois de o candidato ser marcado `paused=true`; portanto ele não pode ativar a geração sem uma decisão explícita.

Escopo de layout desta fatia: C4 recebe pacing em linha; P1 recebe scorecard de cartões e CAC; P4 padrão recebe as três taxas com absolutos em apoio; P4 `lead_pre_qualificado` recebe cartões e finalização, sem desenho de funil. Os slides de mídia/B2C que compartilham nomes genéricos de arquétipo não foram convertidos para a régua CRM, porque não consomem a view mensal canônica.

Validação local antes do PR: 50 testes Node do Report Live, 124 Vitest, `deno check`, build Vite e gate TypeScript com 57 diagnósticos preexistentes e zero novos. Este registro ainda não afirma deploy, staging visual, publicação ou ativação; essas evidências devem ser acrescentadas somente após execução real.

## Perfis, outcome e retenção — implementação candidata de 15/09

O renderer e o blueprint agora compartilham a mesma geometria pura por arquétipo. A certificação exige cardinalidade exata de 12 slides para `monthly_report`/`executivo_mensal` e 31 para `deep_dive`, além do contrato completo de cada gráfico editorial. Isso mantém a candidata isolada e transforma divergência de eixo, formato ou range em bloqueio antes da ativação.

A retenção ganhou plano conservador na rota interna `cleanup_sheet_tabs`: mantém no mínimo a publicação viva e a geração anterior, só classifica releases conhecidas com estado `superseded` ou `rolled_back`, e opera em dry-run por padrão. A execução exige o token explícito `DELETE_SUPERSEDED_GENERATIONS`; remove apenas abas e slides gerenciados dessas releases. Banco, snapshots, blueprints e PDFs imutáveis nunca entram no plano. Objetos desconhecidos não são reivindicados.

A migration editorial publicada no banco tinha versão `20260914125155`, enquanto o checkout conservava `20260914120000`; o arquivo local foi renomeado para refletir o histórico remoto. Nenhum `migration repair` em massa foi executado.

Estado: 56 testes do Report Live, `deno check`, build e gate TypeScript local verdes; implantação, build candidato e QA do PDF ainda precisam de evidência própria.

## Prova vertical do renderer Office — 15/09

Foi implementada uma alternativa Python isolada para avaliar a saída do Report Live sem Google Sheets/Slides. Ela consome exclusivamente o artefato imutável certificado e cria um render plan comum, traduzido para PPTX por `python-pptx` e para PDF direto por ReportLab. Não recalcula métricas, não roda o engine e não altera publicação.

O recorte real usa o run certificado `ac206b6a-5f82-4188-a184-186b425b7f5f`: C0, C4 e P1 Serasa. C3 foi descartado da prova porque não existe nos perfis certificados e sua view integrada não contém dados. O PPTX foi aberto e renderizado pelo Microsoft PowerPoint: três slides, um gráfico de linha nativo/editável e nenhuma sobreposição visual. O PDF tem três páginas 16:9 e foi rasterizado e inspecionado integralmente. Conteúdo, geometria, eixos e cores coincidem; marcadores/ticks variam entre os motores. A validação estrutural confirma os mesmos títulos nos dois formatos.

A aquisição do input ganhou o modo interno `export_artifact`, que emite URL assinada curta somente para run certificado. O modo está ACTIVE no `report-sync` v51, `verify_jwt=false` com autenticação própria, bundle `bb45648f1915f413dfee18d6597f56c4c691cd12840fcad698a8476759384cbf`. A prova ainda não é um renderer de produção: o PDF usa Helvetica enquanto o PPTX usa Calibri; template e logo da skill Afinz precisam virar assets rastreados; o template completo gera um PPTX de aproximadamente 11 MB; e faltam os demais arquétipos, seleção por frente, cache, upload privado, job e UI.

Decisão atual: **viável como renderer alternativo, sem aprovar troca integral**. O próximo gate é um piloto de 12 slides com fonte/assets empacotados, QA das 12 páginas em PowerPoint e PDF e zero divergência de conteúdo/contrato. Google permanece como renderer vivo até esse aceite.

Durante a prova, o job Google `d763d844-98ff-4b24-a762-f151561b21a7` foi mantido pausado na fase `narrative`; a última falha observada é API 400 em `refreshSheetsChart`, pois o gráfico declarado não foi encontrado na planilha. Não houve ativação e o deck vivo de 57 slides foi preservado.

### Piloto mensal completo do renderer Office — 15/09

O segundo gate usou o artefato imutável certificado do run `c543aaa3-0bd9-440a-ba3d-6404cc112d97`, `content_hash` `a082adf24b3bd1d1a37aa14d3f3158e0b4b45221548435e9882a58214ec8fe9e`, período agosto/2026, perfil `monthly_report`. O renderer produziu a projeção inteira declarada pelo artefato: `c0`, `c1`, `c4`, `c7`, `c8`, `m1`, `m2`, `b1`, `p1_serasa`, `p1_proprietaria`, `p1_plurix` e `p1_bem_barato`.

O PPTX contém três gráficos nativos/editáveis. A validação confrontou seus dados internos com o render plan: 31 pontos em cada uma das duas séries do `c4` e cinco valores nos rankings `m1` e `m2`. Estados ausentes não foram convertidos em zero ou inferência: `c7` expõe ausência de janelas encerradas, `c8` expõe fila vazia, `b1` mantém B2C indisponível e `m1` registra orçamento ausente em 5/5 linhas, bloqueando o cálculo de pacing.

QA visual completo: o Microsoft PowerPoint abriu e rasterizou 12/12 slides em 1920×1080; o Poppler rasterizou 12/12 páginas do PDF; todas as 24 imagens foram inspecionadas individualmente sem corte, sobreposição ou glifo quebrado. O PPTX passou no gate estrutural com 12 slides, 44 partes de relacionamento, três gráficos e zero achados; a geometria confirmou canvas 13,3333×7,5 pol., 16:9, fólio correto e Calibri nos 163 usos observados. O PDF mantém 12 páginas de 960×540 pt.

Evidência binária: PPTX com 11.090.826 bytes e SHA-256 `c86a671185848a5f0f95c40be7a5671b7cbc414b41b971a70d3eed582c7450a8`; PDF com 27.539 bytes e SHA-256 `94e215955668e2c7836117e3c0d8672111294a8eaf6c79f758629061c210189b`. Gates locais: quatro testes do renderer Office, 57 testes Report Live, 124 Vitest, `deno check`, build Vite e gate TypeScript com 57 diagnósticos preexistentes e zero novos.

Decisão atual: a arquitetura fica aprovada para evoluir como **exportação mensal alternativa**, mas não para substituir o renderer vivo. Bloqueios restantes: versionar/empacotar template, logo e uma fonte redistribuível comum a PPTX/PDF; controlar a divergência inerente ao PDF direto; implementar worker, cache, upload privado e UI; e decidir a cobertura do perfil `deep_dive` de 31 slides. O job Google continua pausado e nenhuma ativação foi executada.

## Planejamento do Loop de aprendizado Growth — 22/09

Foi iniciado na branch `codex/growth-learning-planning`, a partir de `origin/main` em `2fd889c`, o pacote de especificação do novo workspace **Aprendizado Growth**. Nesta rodada não houve migration, mudança de código, build, deploy ou publicação.

O contrato foi consolidado no commit documental `2d11718` (`docs: specify Growth learning loop workspace`), com 13 arquivos e 1.871 linhas no pacote `docs/plans/learning-loop/`.

Decisão de arquitetura: o Report Live preserva o nome como output editorial. Seus controles operacionais de geração, certificação, publicação e recovery serão movidos para `Aprendizado Growth > Report Live`; a aba `Relatórios` manterá somente consumo e downloads. O pipeline imutável não será reescrito.

O produto opera `Fila | Apostas | Outcomes | Memória | Report Live`. A Fila é um feed sistêmico; todo outcome resolvido materializa memória versionada, com vigência. A primeira implementação deve limitar-se ao workspace e à relocação do Report Live, antes de criar schema novo.

Fonte consolidada: [[Loop-de-Aprendizado-Growth]] e `docs/plans/learning-loop/INDEX.md`.

## Release 1 do Aprendizado Growth — 22/09

A branch `codex/growth-learning-release-1`, criada da `main` após o merge do PR #12 (`24720c2`), implementa apenas a fundação de navegação e a relocação operacional aprovadas. O corte está registrado no commit `2804c82` (`feat: add Growth learning workspace foundation`).

O componente do Report Live agora diferencia dois contextos sem alterar endpoints ou payloads:

- `Relatórios`: publicação ativa, links e PDF;
- `Aprendizado Growth > Report Live`: validação, geração, candidata, progresso, publicação e equipe.

A consulta da publicação ativa foi separada da consulta da execução mais recente. Assim, uma candidata certificada não substitui visualmente o output oficial antes do commit de publicação. Na inspeção read-only, ambos os contextos reconciliaram a publicação v8 de agosto/2026; apenas a área operacional exibiu a candidata certificada pendente.

Não houve migration, alteração de Edge Function, build de relatório, certificação, publicação ou escrita em artefato vivo. Abrir ou alternar a navegação não chama nenhum comando mutável.

Evidência visual não versionada: `ACALENDARIO APP/artifacts/learning-loop/release-1/`. Detalhes e gates: `docs/plans/learning-loop/RELEASE_1_IMPLEMENTATION.md`.

### Promoção para a main

O PR #13 foi mergeado em 22/09/2026 como `aadbae0`. O workflow `Deploy to GitHub Pages` (`35745047325`) repetiu todos os gates da `main` e concluiu o deploy em 2m24s. O Vercel também promoveu o mesmo SHA com sucesso.

Na superfície pública `https://growthafinz.github.io/GaaS-Framework-Afinz/`, a página de autenticação respondeu normalmente e carregou o bundle `index-BXG_xLnS.js` com HTTP 200. O bundle publicado contém `Aprendizado Growth`, `Report Live publicado` e o contrato de navegação `report-live`. Como a área funcional é autenticada, a inspeção visual interna em produção permanece pendente de UAT com sessão de usuário; não houve comando mutável do Report Live nesta promoção.

## Feed operacional do Report Live — Release 2 de 22/09

A Release 2 do Aprendizado Growth cria uma projeção read-only dos eventos materiais do pipeline sem alterar o renderer, os artefatos imutáveis ou a máquina de publicação. Runs certificados produzem `report_candidate_generated`; falha, rejeição, stale ou publicação falha produzem `report_blocked`; apenas uma publicação com `status=published`, `google_state=active` e `qa_status=passed` produz `report_published`.

Os produtores são triggers transacionais e idempotentes. Eles escrevem snapshots em `growth_feed_events`, que rejeita `UPDATE` e `DELETE`; a UI lê `growth_feed_v` com RLS para usuários autenticados. O backfill inicial preservou 9 transições de candidata, 24 bloqueios e a única publicação ativa. Isso não muda ponteiro, candidata, geração física, Slides, Sheet ou PDF.

Fonte rastreada: migration `20260922160601_growth_feed_release_2.sql`, alinhada ao histórico remoto, e `docs/plans/learning-loop/RELEASE_2_IMPLEMENTATION.md`. A migration foi publicada; o PR #14 passou no Actions (`35752793973`), inclusive em PostgreSQL 17 limpo, e a interface permanece na branch `codex/growth-learning-release-2` somente até o merge explícito.

### Promoção do feed para a main

O PR #14 foi mergeado como `1584d17`. O workflow da `main` (`35753479391`) passou e publicou no GitHub Pages; o deployment de produção do Vercel também concluiu. O bundle público `index-D3eybt62.js` contém os contratos da Release 2. Esta promoção não executou build, certificação, publicação ou alteração de ponteiro do Report Live; apenas expôs sua projeção operacional no feed já materializado.

## Aprendizado Growth — Release 3B publicada em 22/09/2026

O PR #17 foi mergeado na `main` como `e9db756` e o workflow `35803398333` concluiu validação e deploy. A migration `growth_bets_release_3b` foi aplicada antes da interface para evitar uma janela em que o frontend consultasse views ou RPCs ainda inexistentes.

O contrato adiciona decisão única e imutável por recomendação, checklist operacional e comandos auditáveis para rejeitar, mesclar, comentar, registrar execução e mudar estado. A crença e a evidência congeladas na Release 3A permanecem imutáveis. Apenas mudanças materiais produzem `bet_updated`; comentários ficam restritos à timeline da aposta.

A reconciliação pós-migration confirmou `security_invoker` em `growth_bets_operational_v` e `growth_signal_decisions_v`, RPCs inacessíveis ao papel `anon`, ausência de escrita direta para `authenticated` e contagens iniciais zeradas. Nenhum sinal ou aposta sintética foi persistido. O bundle público `index-DglFengp.js` respondeu HTTP 200 com as superfícies da Release 3B.

O teste SQL executado novamente durante o fechamento documental encontrou que `created_at` é estável dentro da transação e, portanto, não ordena múltiplos updates do mesmo comando. A correção `growth_bet_timeline_sequence` adicionou uma identidade monotônica à timeline; a projeção usa essa sequência para escolher o último estado de execução. O PR #18 (`4a195e4`) e o workflow `35813046109` fecharam a correção sem alterar o gate esperado.

## Aprendizado Growth — Release 4 publicada em 23/09/2026

O PR #19 foi mergeado na `main` como `a473a27`; o workflow pós-merge `35815961161` validou e publicou o GitHub Pages. O Supabase registrou `20260923034804_growth_outcomes_release_4`, alinhado ao arquivo de migration rastreado.

O avaliador quantitativo do Report Live não foi duplicado. `evaluateMaturedOutcomes()` continua responsável por ler a view contratada e comparar direção/expectativa. A camada Growth liga o outcome à aposta e aplica o gate de execução: uma ação não concluída não pode ser classificada como hipótese refutada. O veredito do sistema permanece separado da confirmação ou contestação humana.

A agenda `growth_outcomes_due_v` deriva vencimento da janela em data de São Paulo e usa `security_invoker`. A RPC `growth_review_outcome` preserva o veredito calculado, exige motivo na contestação e fecha a aposta apenas após confirmação ou resolução. O feed diferencia `execution_recorded` e `outcome_evaluated`; a materialização de `outcome_due` fica reservada para produtor agendado futuro, sem escrita escondida ao abrir a tela.

Não houve alteração, build, certificação ou publicação de Google Slides/Sheets/PDF nesta release. O Report Live atuou apenas como produtor determinístico de outcome; o output editorial vivo permaneceu intacto.

## Aprendizado Growth — Release 6 publicada em 23/09/2026

O PR #23 foi mergeado na `main` como `ec223da`; o workflow `35907261008` validou e publicou o GitHub Pages. O Supabase recebeu primeiro as migrations remotas `20260923180746_growth_learning_reuse_release_6` e `20260923180940_growth_learning_reuse_candidate_index`, evitando que o frontend chamasse contratos ainda inexistentes.

A Release 6 não altera renderer, build, certificação, publicação ou ponteiro do Report Live. Ela fecha a reutilização no workspace Aprendizado Growth: matching exato por dimensões, decisão explícita `reused`/`discarded`, snapshot append-only da revisão consultada, bloqueio de memória vencida/contestada/substituída e taxa de reuso.

Nos dez candidatos reais mais recentes o resultado foi zero matches, coerente com o contrato de não sugerir por mera coincidência de frente. Nenhum sinal, aposta ou aplicação sintética foi persistido. O bundle público `index-DBXuWFmr.js` foi verificado por HTTP 200 e contém os dois RPCs e a nova superfície de memória.

Fonte consolidada: [[Loop-de-Aprendizado-Growth]] e `docs/plans/learning-loop/RELEASE_6_REUSE_SPEC.md`.

## Aprendizado Growth — Release 7A publicada em 23/09/2026

O PR #25 foi mergeado na `main` como `9a0786a` e o fechamento documental do PR #26 levou a `main` a `cceac11`. O workflow pós-merge `35913808430` repetiu todos os gates, incluindo o novo contrato SQL contextual em PostgreSQL 17, e publicou o GitHub Pages.

A mudança não toca o pipeline editorial do Report Live. Ela permite iniciar uma aposta em Relatórios → Overview, Diário, Mensal e Funis, congelando tela, rota, período, filtros, entidade e referência visual no mesmo agregado de aposta já governado. Hipótese, ação, baseline, expectativa e critério continuam decisões explícitas; cancelar não grava rascunho.

O Supabase registrou `20260923200039_growth_context_entry_release_7a`. Os RPCs contextuais são acessíveis por `authenticated`, negados a `anon`, e o matcher da Release 6 agora possui um núcleo comum para candidatos da Fila e contextos analíticos. Nenhuma aposta sintética foi persistida durante a reconciliação.

O bundle público `index-C4JyqINd.js` respondeu HTTP 200 e contém as duas entradas de criação e os contratos remotos. Não houve build, certificação, publicação, recovery ou alteração de ponteiro, Sheet, Slides ou PDF do Report Live. A projeção editorial do ciclo permanece reservada para a Release 7C.

Fonte consolidada: [[Loop-de-Aprendizado-Growth]] e `docs/plans/learning-loop/RELEASE_7A_IMPLEMENTATION.md`.

## Contrato assíncrono do renderer promovido à main — 24/09/2026

A Release 7C foi promovida primeiro pelo PR #29, merge `42e0fba`. Em seguida, o PR #30 promoveu o pacote do renderer assíncrono como `e92e581`. A ordem preserva a projeção editorial de apostas, outcomes e memórias que o pacote de renderização consome.

O pacote versiona o JSON Schema de `ReportRenderPackage`, o adaptador puro `BuiltReport -> ReportRenderPackage`, três fixtures sintéticas cobrindo os doze arquétipos e o golden estrutural da publicação de agosto com 57 páginas. O golden não contém as linhas do artefato imutável e não pode ser usado como relatório operacional. A diferença histórica de 62 blueprints para 57 páginas está reconciliada: `K-EXP` e quatro instâncias `P6` eram `omitir_bloqueado`; `K-VISA` permanece apenas como histórico aposentado.

O workflow pós-merge `36008622133` concluiu todos os gates e o deploy do GitHub Pages. O Vercel também marcou o SHA `e92e58184d209a0fb7d9fbdb6e18c50cf442e4e4` como publicado. A superfície pública respondeu HTTP 200 com o bundle `index-DzP4WOf1.js`, contendo `Aprendizado Growth` e `Report Live`.

Esta promoção não aplicou migration, não publicou Edge Function, não acionou build/certificação/publicação do Report Live e não alterou ponteiro, Storage, Sheet, Slides ou PDF vivo. O próximo gate é externo ao deploy: o Claude Cowork deve entregar `SLIDE_COVERAGE_MAP.csv` e `SLIDE_COVERAGE_REVIEW.md` para aceite de produto antes da implementação completa do renderer.

## Perfil mensal completo e aceite da cobertura — 25/09/2026

O mapa das 57 páginas foi entregue e aceito. A decisão resultante não fixa 48, 31 ou 12 páginas: `monthly_full`, também acessado pelo alias histórico `monthly_report`, passa a ser o output operacional de cardinalidade dinâmica. `executivo_mensal` e `deep_dive` permanecem derivados opcionais.

As fusões mensais aprovadas são: P7 e M7 em C8, B3 em C2, P2 em P1 quando houver somente um segmento, B2 em B1 enquanto a série diária estiver indisponível e K-TPL como cobertura em C2 mais ação material em C8/Aprendizado Growth. K-VISA permanece aposentado. K-QLT só pode ler incidentes dentro da janela do relatório.

O gate de certificação deixa de comparar a contagem com números mágicos. Ele valida cobertura do core C0–C8, presença dos blocos parceiro/mídia/B2C/anexo, unicidade de `slide_instance_id`, aplicação das fusões e ausência de K-VISA. O pacote destinado ao renderer mantém o gate mais forte: as 57 páginas históricas precisam estar contabilizadas com destino e justificativa.

Pacotes de produção passam a exigir narrativa estruturada (`takeaway`, evidências e limite) e contrato explícito para os arquétipos de gráfico. O renderer não pode inventar série, eixo, cor, formato ou range.

O artefato imutável certificado de agosto foi exportado por dispatcher interno, sem expor o token do worker e sem alterar publicação. Identidade: run `9bb55892-4b17-4f76-825a-0ac97c92b525`, path `runs/9bb55892-4b17-4f76-825a-0ac97c92b525/blueprints/report-build.json`, `content_hash` `0033ccb3d907a383e47e725c2a1b8f0e263e40f4b9279a451450f29edf5f213a`. A cópia local é lastro ignorado pelo Git; o objeto no Storage continua sendo a fonte de verdade.

Fonte normativa no repo: `docs/plans/report-live-async/PRODUCT_DECISIONS_2026-09-25.md`.
