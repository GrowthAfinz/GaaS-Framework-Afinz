# Relatórios | Seguros

Implementação isolada do domínio de Seguros, acessível em Análise → Relatórios | Seguros, com rota própria `?view=relatorio-seguros`. Aquisição permanece em Relatórios | Aquisição, na rota histórica `?view=relatorio`. Não depende de registros CRM para abrir e não mistura o total da companhia com os produtos digitais.

O BI de Seguros mantém o layout claro, cabeçalho teal, cards e cores do GaaS, com filtros próprios de versão, produto e período. Os filtros globais de CRM, BU e frente não aparecem nesta rota. Abre a versão certificada mais recente disponível, ou a última versão em revisão quando ainda não há certificação. A visão geral inclui contratações, cadastros, investimento, custo por contratação, etapas da LP e evolução mensal por produto. Valores agregados incompletos continuam ausentes e custo consolidado usa soma dos custos dividida pela soma das contratações.

O template visual canônico está documentado em [report-workspace.md](report-workspace.md). As cinco abas primárias são compartilhadas com Aquisição. Gráficos temporais e tabelas são alimentados por um adaptador próprio de Seguros, sem renomear emissões/cartões. Fontes, ingestão, revisão, cenários e exportações ficam dentro de Relatórios; não são abas paralelas ao BI. O diário usa somente os registros CRM com data e canal conhecidos; contratações mensais não são rateadas em dias ou atribuídas a canais/produtos por nomes semelhantes.

A conversão de negócio de Seguros é a contratação confirmada após o formulário da LP. Cadastro enviado é etapa intermediária; não é venda. O contrato atual lê as contratações agregadas do XLSX e não prova o evento individual de confirmação nem um funil sequencial de pessoas. Essa limitação permanece visível até existir fonte de confirmação com identificador, data e status próprios. Cartão emitido continua exclusivo do domínio de Aquisição.

## Fluxo implementado

1. Selecionar as planilhas de performance e Radar. O parser preserva células, fórmulas, estados ausentes, notas de origem e hashes dos arquivos.
2. Revisar o pacote local: visão geral, jornada, canais, evolução, carteira, cenários, diferenças entre versões e fontes.
3. Um membro ativo `analyst`, `publisher` ou `admin` pode salvar os originais no bucket privado e criar um snapshot versionado. Nenhuma ingestão publica um relatório.
4. `publisher` ou `admin` revisa as ressalvas e certifica ou rejeita o snapshot. Erros de fórmula e caches ausentes não podem ser dispensados. A certificação preserva o histórico e bloqueia alterações dos fatos aceitos.
5. Exportar cópias dos XLSX originais e do comitê de 30/10/2026 usando edição OOXML. O pacote contém manifesto, hashes e estado `review_required`. Pode ser arquivado no armazenamento privado, com QA pendente.
6. Vincular notas existentes da Wiki aos próximos snapshots. O bloco de dados consulta somente snapshots certificados associados à nota. A proposta textual usa o fluxo existente de knowledge packs/contributions; nunca aprova nem incorpora a própria proposta.

## Contrato de dados

A migration `20261104032148_insurance_data_foundation.sql` é autocontida. Cria o schema privado `growth_data`, contratos de fonte, lotes, registros originais, populações, produtos, métricas, revisões, cinco famílias de fatos, snapshots, vínculos, impactos em notas, responsabilidades, artefatos e revisão de certificação. Integra `report_runs`, `report_frozen_inputs` e `report_run_sources` existentes. As RPCs públicas são invoker; funções internas verificam a identidade e as memberships existentes no banco. Não há grants de tabelas brutas ao cliente, políticas públicas de arquivos ou permissões baseadas em metadados editáveis do usuário.

Valores distinguem zero observado, ausente, não aplicável e erro. Taxas são recalculadas apenas com denominadores compatíveis; não são médias de percentuais. Identidades provisórias dos disparos permanecem restritas ao lote: nomes semelhantes não provam duplicidade entre arquivos. Toda revisão conserva a fonte.

Os dados de referência produzem 718 disparos, 42 resultados, 14 medidas de tráfego, 28 investimentos e 90 observações de carteira. São contagens de registros tipados, não pessoas ou vendas. O IPP usa apólices por conta viva. Os cenários financeiros do arquivo são hipóteses históricas, não receita reconhecida.

## Exportação e limites explícitos

O XLSX é editado dentro do pacote original, preservando fórmulas, estilos, imagens, gráficos e extensões. O hash deve corresponder à fonte carregada. A geração não reconstrói o workbook a partir de tabelas simplificadas.

O PPTX principal mantém os 21 slides e atualiza os elementos de Seguros contratados nos slides 8–10, incluindo tabelas, caches dos gráficos e rótulos digitais. Textos adicionais podem ser editados pelos alvos de shape existentes. As demais frentes continuam com seu conteúdo histórico até receberem contratos e fontes próprios. A apresentação de 16/10 é referência histórica; não é um segundo template de geração suportado.

Todas as abas dos XLSX ficam preservadas na fonte e no staging. Isso não significa que toda fórmula do Radar tenha uma interpretação de negócio certificada: a primeira normalização de carteira cobre `Base Seguros`. Novos layouts e períodos exigem evolução do contrato atual de sete meses. Datas de lançamento não estabelecem coortes; outubro é parcial e as quebras de tracking continuam visíveis.

Os testes provam conservação estrutural dos pacotes e cálculos contratados. A fidelidade visual final requer abrir as cópias em Excel/PowerPoint e revisar a renderização; não foi certificada por renderização Office automatizada. O gerador sempre entrega material para revisão. O publicador vivo do Google Sheets/Slides não é acionado por este módulo.

## Validação e operação local

```powershell
npm ci
npm run test:insurance
npm run typecheck:release
npm run build

# Testes com os arquivos reais, mantidos fora do Git:
$env:INSURANCE_FIXTURE_DIR = 'C:/Users/Pablo Prado/Downloads'
npm run test:insurance

# Exportação local sem autenticação ou chamadas de rede:
node scripts/insurance-export.mjs '<performance.xlsx>' '<radar.xlsx>' --pptx '<comite-30102026.pptx>' --out artifacts/insurance-local
```

Os testes SQL executam em PostgreSQL descartável via PGlite, incluindo permissões, idempotência, estados, certificação e imutabilidade. Os testes Office com referências reais são opcionais e não enviam os arquivos a serviços externos. `scripts/insurance-preview.html` é um harness local de desenvolvimento com pacote gerado, sem sessão nem gravação; não integra o fluxo publicado. `artifacts/insurance-local` é ignorado pelo Git.

Para ativar em ambiente compartilhado, revisar e aplicar a migration no projeto correto antes de disponibilizar o frontend. Esta entrega de código não aplica migrations remotas, não altera notas e não publica arquivos vivos.

## Ativação em 04/11/2026

Migration aplicada no projeto mipiwxadnpwtcgfcedym, versão remota 20261104032148. Verificação: 24 tabelas com RLS, zero grants de tabelas a anon/authenticated, oito RPCs invoker sem execução anônima e bucket privado de 30 MB. Os avisos informativos de RLS sem políticas refletem o bloqueio intencional do acesso bruto; o cliente usa somente as operações governadas. Nenhum novo aviso de segurança ERROR/WARN associado a Seguros foi identificado. A carga de referência foi validada localmente; não foi salva ou certificada em produção. A validação visual publicada foi interrompida pelo controle de computador por não confirmar a URL do Chrome. Nenhuma nota ou apresentação viva foi publicada.
# Integração com a Wiki

O contrato leve, o catálogo de dependências e o fluxo editorial estão descritos em [portfolio-knowledge-integration.md](portfolio-knowledge-integration.md). Essa integração usa os snapshots existentes; não constitui o writer bruto universal nem completa os renderers Office.
