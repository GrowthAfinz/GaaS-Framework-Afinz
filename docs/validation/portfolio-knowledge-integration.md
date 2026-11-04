# Validação · integração de portfólio e Wiki · 04/11/2026

## Entrega verificada

- Migration `20261104171150_portfolio_knowledge_contracts.sql` aplicada no projeto `mipiwxadnpwtcgfcedym`. Arquivo inicialmente criado pelo CLI e nome alinhado à versão efetivamente registrada pelo conector.
- Sete contratos registrados: `insurance.monthly/1` pronto para snapshots; seis contratos futuros marcados `planned`. Os 21 datasets do catálogo estão relacionados a consumidores.
- Os nove caminhos de notas usados no mapa foram confrontados com a projeção ativa da Wiki e existem.
- Contagens após a aplicação: zero snapshots, zero bindings, zero impactos e zero itens `data_review`. Não houve carga, certificação, criação de proposta editorial ou alteração de notas reais.
- A skill 0.2.0 foi copiada para a instalação local e seus seis arquivos foram comparados por SHA-256.

## Contratos e regressão

- Frontend: 641 testes aprovados em 101 arquivos, incluindo preservação de ausência/zero/N/A, adaptadores BI/Office e blocos gerenciados sem perda do histórico.
- Contratos SQL de integração: 12 testes aprovados; dois testes de arquivos reais são condicionais à presença dos fixtures privados. O teste específico de projeção com arquivos reais foi executado separadamente e aprovado.
- Regressão da Fila existente: sete testes aprovados.
- Fundação e Office com os arquivos reais: nove testes aprovados. O pacote preserva fórmulas, gráficos, mídia, estilos e identidade dos templates; geração repetida produz o mesmo resultado.
- Planejador incremental: cinco testes aprovados. Sem candidatos novos, não há consumidores potenciais nem alegação de refresh.
- TypeScript: sem novos erros; baseline existente de 57 erros, cinco resolvidos. Build de produção aprovado.
- Skill validada com `quick_validate.py`; projeção catálogo/SQL conferida com `build-portfolio-report-contracts.mjs --check`.

## Volume da leitura

Nos XLSX reais de referência, o teste comparou todas as métricas e os registros diários/portfólio por igualdade entre a leitura antiga e a projeção nova:

| Payload | Bytes JSON |
|---|---:|
| Snapshot completo | 2.182.367 |
| Leitura leve com os registros necessários ao BI | 328.841 |

Redução de 85%. É comparação de payload serializado local; não é medição de latência do app em produção. A Wiki não solicita os registros diários nem as células do workbook.

## Segurança e limites

Conferência no banco após aplicar: `authenticated` não lê diretamente `growth_data.report_contracts`; `anon` não executa `report_data_read`; membros autenticados executam a RPC de leitura; o navegador não executa `sync_report_note_impacts`. O índice sem sessão de usuário retorna lista vazia.

Advisors antes/depois não apresentaram novos erros ou warnings de segurança. Houve apenas a informação adicional de RLS sem políticas na nova tabela privada, intencionalmente sem grants diretos e acessível por funções governadas. Referência: [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). Achados preexistentes de outras áreas não foram modificados por esta entrega.

Os testes de certificação e incorporação são locais/sintéticos. O fluxo com dados reais na Wiki de produção ainda depende da primeira carga certificada. O writer bruto universal e os bindings Office restantes continuam pendentes; a entrega não deve ser apresentada como ingestão completa das referências nem como publicação do PPTX vivo.
