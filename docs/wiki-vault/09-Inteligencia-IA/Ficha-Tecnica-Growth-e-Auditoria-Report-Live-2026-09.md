---
tags: [growth, aquisicao, crm, midia, auditoria, report-live]
tipo: handoff
atualizado: 2026-09-09
status: diagnostico-com-limites
fonte: vault-supabase-sheets-codigo
---

# Ficha técnica de growth e auditoria Report Live — setembro de 2026

Solicitação de Pablo: preparar contexto de segmentos/campanhas por canal e por frente antes de auditar os dados e as views. Não criar nesta fase uma camada estruturada de storytelling/memória de IA.

## Entregáveis

- [Ficha técnica por frente e canal](<../../calendar-estrategico/outputs/growth-acquisition-audit-2026-09-09/FICHA_TECNICA_GROWTH_AQUISICAO.md>).
- [Auditoria da base e das views](<../../calendar-estrategico/outputs/growth-acquisition-audit-2026-09-09/AUDITORIA_BASE_E_VIEWS.md>).
- Inventários CSV, exceções com IDs, SQL somente de leitura e exportação original do Sheets na mesma pasta.

## Evidência de 09/09/2026

Inventário: 7.444 registros de aquisição CRM; 8.664 de rentabilização/Seguros; 7.756 métricas de mídia. Catálogo com 957 combinações de jornada/dimensões e 28 combinações plataforma/nome de campanha.

Sheets acessado pelo Chrome autenticado e exportado sem alterações: 121 abas, 82 vazias. Entre 93 abas VIEW_/VP_, 66 vazias, incluindo scorecard integrado, manifesto e registro de views. A última edição indicada pela interface é de 25/08 pelo bot. Perfil e fontes V1 apontam junho; publicação registrada no banco permanece julho. A causa exata da perda exige correlação histórica, mas o Sheets atual não é uma cópia íntegra comprovada da publicação v1.

Nas views legadas preenchidas, 998 controles: 967 valores reconciliados e 31 ausentes dos dois lados. Isso confirma aritmética nos controles executados contra as fontes internas; não certifica semântica, dados atuais ou julho histórico.

Banco: 440 custos nulos; 774 CACs armazenados divergentes de custo/cartões (> R$0,02); 375 grupos de chave candidata repetida, dos quais 330 com valores diferentes. Não deduplicar nem recalcular em massa sem diagnóstico. Componentes de custo não têm cobertura completa para homologar sua soma.

Código: fonte insurance contém toda rentabilizacao_activities e a view não restringe Seguros; reprodução com base 100 Seguros + 900 B2C retornou 1.000. Classificação por COPA no nome também absorve campanha de aquisição. Views legadas contam linhas como campanhas (B2C: 115 linhas, 4 nomes).

## Continuidade

Recuperar snapshot/artefato histórico de julho e reconciliar antes de declarar a publicação certa ou errada; investigar exceções por frente/canal; corrigir semântica e integridade antes de nova publicação. Auditoria somente de leitura: nenhum deploy, refresh, limpeza, alteração de custo ou publicação efetuado.
