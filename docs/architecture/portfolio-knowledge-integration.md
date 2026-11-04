# Dados, relatórios e conhecimento de portfólio

## Contrato e limites desta entrega

O catálogo canônico é `.claude/skills/gaas-portfolio-data-ingest/references/data-catalog.json`, versão 0.2.0. Os 21 datasets apontam para sete contratos de leitura, seus outputs e notas relacionadas. A projeção SQL do catálogo em `growth_data.report_contracts` é gerada e verificada por `scripts/build-portfolio-report-contracts.mjs`; não é uma segunda lista mantida à mão. Depois de aplicada esta migration, evoluir contratos por novas versões/migrations, sem editar o histórico aplicado.

`insurance.monthly/1` está implementado sobre snapshots existentes de Seguros. Os demais contratos estão `planned`: a relação com uma nota é `related_to`, sem dependência numérica ativa. O writer bruto e o read model universal sobre fatos normalizados continuam pendentes. Esta entrega não importa referências Office nem certifica dados reais.

## Uma leitura e três destinos

`gaas-report-data/1` contém contrato e versão, snapshot/hash, período/certificação, métricas com unidade/estado/origem, cobertura, limitações e metadados das fontes. Não contém células, fórmulas ou arquivos de entrada.

- **BI:** `report_data_read(snapshot,scope,include_rows=true)` fornece métricas e registros de comunicação necessários ao Diário. O adaptador de Seguros mantém os componentes existentes. Fontes completas são carregadas somente ao entrar em Relatórios, para revisão, cenários e exportação legada.
- **Wiki:** `report_data_note_index` lista dependências acessíveis uma vez; apenas notas vinculadas consultam `report_data_note_blocks`. O leitor genérico vive separado de `InsuranceWorkspace`, sem importar parser Office ou gráficos do BI. O bloco consulta a última versão certificada vinculada ao seu recorte congelado.
- **Office:** o adaptador `insuranceReportData` expõe os mesmos valores/estados do contrato ao renderer existente, sem recalcular métricas. O renderer ainda precisa do template e do pacote completo, carregados sob demanda. Cobertura numérica parcial de slides continua explícita; esta integração não completa os bindings de todos os XLSX/PPTX.

`products`, `metrics` e `periods` são listas declarativas validadas pelo backend. Não há SQL ou código em nota. `include_rows` só inclui registros para leitura sem recorte; os blocos da Wiki sempre recebem apenas métricas. Zero, ausência e não aplicável têm apresentações distintas. Razões e demais cálculos continuam nos contratos de métricas; nenhum renderer decide outra fórmula.

## Dependência não é wikilink

Wikilinks continuam representando contexto entre notas. `content_bindings` representa consumo numérico, ligado ao contrato e a `snapshot_bindings`; não inferir dependência por título, backlink ou proximidade no grafo.

O catálogo ativa apenas a nota `10-Resultados/Mecanicas/Seguros.md` para `insurance.monthly/1`, com cadastro LP, contratação confirmada e custo por contratação na janela completa. A ativação ocorre no primeiro snapshot. Contratação não é formulário enviado, emissão de cartão, incremento comprovado nem atribuição de canal.

Rentabilização, Ativação, Incentivo ao Uso, Crédito e Investimento, Pool e Visa estão mapeados como contexto dos contratos futuros. Não receberam números agregados de Seguros. Responsabilidade inicial de definição/revisão é do Time GaaS Afinz; o catálogo permite indicar responsáveis específicos sem inventar nomes.

A nota Seguros conserva seu bloco de resultados de CRM `renta`, que mede comunicações. O bloco governado de contratação tem identificação e fonte próprias. A integração não mistura os eventos nem modifica silenciosamente o recorte histórico do CRM.

## Certificação e revisão editorial

1. Construir snapshot mantém as validações e revisões de fonte existentes. Ainda não há atualização editorial automática.
2. Certificar congela dados e bindings. O trigger compara somente as métricas consumidas, período, semântica e limitações com a versão certificada anterior do mesmo binding.
3. Leitura idêntica recebe `note_impacts.status=not_applicable`; nenhum novo aviso. Havendo mudança, impactos ficam `ready` ou `conflict` e um `data_review` é incluído/revisado na Fila existente por nota e janela. O recibo guarda versão, fonte, recorte e valores anteriores/atuais. Não há chamada de IA.
4. Preparar texto usa `growth_loop_submit_note`: acesso, revisão do item, nota exata, hash-base, snapshot certificado e pacote pertencente ao autor são conferidos. A contribuição permanece pendente. A ação legada de Seguros também passa por essa RPC.
5. Aprovação não aplica nem resolve a nota. Somente a incorporação comprovada pelo fluxo existente de contribuição/sync muda o impacto para `applied` e resolve o item da revisão correspondente. Uma contribuição antiga não resolve revisão nova.
6. Se não há mudança editorial necessária, o revisor pode registrar justificativa em `report_data_review_unchanged`. O banco valida acesso/revisão/hash e impede encerrar enquanto houver contribuição pendente nessa revisão. Registra a decisão sem alterar texto ou dados.

Fechar/adiar um aviso continua sendo preferência individual; não conclui o trabalho. Nenhuma skill pode aprovar a própria contribuição ou declarar em nome do usuário que o texto dispensa revisão. O loop desabilitado impede a criação de novos avisos; os impactos de dados continuam registrados. Reprocessamento desses impactos exige retomar a integração de forma governada, sem criar um job de IA automático.

## Recibos e histórico

O plano local de inclusão traz contagens e `potential_consumers` apenas para candidatos novos. `reports_refreshed=false` impede confundir simulação com atualização. Entradas inteiramente ignoradas não geram previsão de impacto.

Datasets de leitura são identificados pelo snapshot imutável; arquivos já gerados continuam ligados à versão usada. O bloco dinâmico pode acompanhar uma certificação posterior enquanto uma exportação histórica permanece válida para seu corte anterior. A entrega de uma carga deve informar essas diferenças, sem afirmar nova geração/publicação de arquivo quando ela não aconteceu.

Retrospectivas mensais preservam recorte, evidências e decisões. Um resumo gerenciado pode ser substituído entre marcadores explícitos, preservando todo texto fora do bloco; não se anexa a mesma tabela repetidamente nem se reescreve histórico já revisado.

## Segurança e verificação

Tabelas de fatos, catálogo e impactos permanecem privadas, com RLS e sem grants de leitura direta ao navegador. As RPCs públicas são invoker; funções privilegiadas ficam no schema privado e verificam as memberships existentes. Leitores veem versões certificadas; analistas/publicadores podem revisar versões construídas. Usuários da Wiki sem membership de relatório recebem índice vazio.

`npm run test:portfolio-knowledge` executa contratos PostgreSQL em PGlite: escopo, ausência/zero, anonimato, drafts, certificação, idempotência, impacto, revisão antiga/nota errada, contribuição pendente e incorporação. `reportDataContract.test.ts` cobre apresentação de estados, conservação dos valores entre adaptadores e substituição de bloco sem apagar histórico.
