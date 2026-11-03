---
tags: [operacao,sfmc,integracao]
tipo: operacao
camada: operacao
atualizado: 2026-11-03
status: confirmado
fonte: gaas-supabase
---

# SFMC — Salesforce Marketing Cloud

**Definição:** a **plataforma real de disparo** das campanhas de CRM. O GaaS planeja e analisa; o SFMC **executa** o envio de e-mail, SMS, WhatsApp e push.

## Contexto
Cada [[Disparo]] que vira linha em [[activities]] foi, na origem, executado no SFMC. A fronteira de integração hoje é **manual/semi-automática**: resultados saem do SFMC/BI, são colados/subidos e passam pela [[Ingestão-de-Dados|ingestão com revisão humana]]. O GaaS não dispara direto no SFMC (ainda) — o `tsvGenerator` do wizard de disparo gera TSV para colar lá.

## Implicações
- A [[Taxonomia-Activity-Name]] é a chave que reconcilia o que foi planejado no GaaS com o que o SFMC retornou.
- Acesso a dado **individual** (CPF) vive no SFMC, não no GaaS — daí o [[Anti-Overlap-Pressão-de-Contato|anti-overlap]] real depender dessa integração (ver [[Decisões-Abertas]]).

## Relacionado
- [[Servico-Emails-Dinamicos]] · [[Briefing-e-Regua-de-Aquisicao]] · [[Fontes-e-Proveniencia-Growth]]
- [[Disparo]] · [[activities]] · [[Ingestão-de-Dados]] · [[Modal-de-Disparo]] · [[Anti-Overlap-Pressão-de-Contato]] · [[AppsFlyer-Tracking-CRM]] · [[Emails-Dinamicos-SFMC]]
- Pacotes e integração (out/2026): [[SFMC-Package-Manager-e-Pacotes]] · [[SFMC-Integracao-API-Roadmap]] · [[Comunicacoes-Pacote-SFMC-Catalogo]] · [[Auditoria-Jornadas-SFMC-2026-10]]

## Funcionamento para quem está chegando

**Data Extension (DE)** é a tabela de dados usada pelo SFMC. **Content Builder** armazena conteúdo/HTML do e-mail. **AMPscript** lê dados e monta conteúdo personalizado. **Journey Builder** organiza entrada, esperas, decisões, atualização de dados e envio. **Test Send** envia amostras para verificar a peça real.

No motor documentado, a DE de audiência contém o destinatário e o estado da sequência; a DE de briefing contém conteúdo por produto, campanha e sequência. A chave de conteúdo não é o CPF. O destinatário fornece os três valores de busca; o template procura o briefing correspondente e verifica vigência.

## Entradas, saídas e fronteira operacional

| Etapa | GaaS | SFMC |
|---|---|---|
| Planejamento | produto, estratégia, briefing e versão | configuração da jornada aplicável |
| Conteúdo | simulação, ativos referenciados e CSV | DE de briefing e template do Content Builder |
| Público | contexto agregado e critérios | audiência individual, elegibilidade e supressões |
| Teste | QA editorial/técnico e prévia | Test Send de personalização/renderização |
| Execução | registros de planejamento | entrada e disparo da jornada |
| Resultado | ingestão e análise reconciliada | logs/resultados, conforme integração |

O fluxo documentado não demonstra um conector automático de publicação/disparo. Uma funcionalidade cadastrada no GaaS não comprova configuração equivalente no SFMC.

## Checklist antes de operar

1. Confirmar BU, estrutura e chaves das DEs; validar o desenho de carga antes de sobrescrever audiência de produção.
2. Conferir correspondência das chaves e datas da campanha.
3. Validar template ativo e leitura de `SEQUENCIA`: dados congelados da jornada podem não refletir `Update Contact`.
4. Importar com contrato da BU e conferir contagem e amostras.
5. Executar Test Send por sequência/assinatura afetada e registrar evidência.
6. Conferir jornada, filtros, ativação/reentrada e supressões para envio real.
7. Em falha, preservar arquivo, versão e erro; corrigir a causa antes de reenviar ou recarregar base.

## Importação de arquivos em Data Extensions (regra canônica)

Vale para qualquer DE, não só para o e-mail dinâmico. Casos reais: briefing de e-mails (03/09/2026) e [[DE-MAPA_MCC]] (03/11/2026).

| Armadilha | Sintoma | Prevenção |
|---|---|---|
| Formato de data | muitos "Data inválida" — e, pior, linhas aceitas com **dia e mês trocados** sem erro | conferir o formato do arquivo e configurar o import; pedir `yyyy-MM-dd` na origem. Teste: se os erros batem com "linhas com dia > 12", é inversão |
| "Respeitar aspas duplas" | colunas desalinhadas ou arquivo inteiro rejeitado | marcar sempre; a opção **desmarca a cada novo import** |
| Separador | coluna toda desalinhada | conferir `;` × `,` no arquivo e no wizard |
| .xlsx | não importa | Import Activity só lê CSV/TXT delimitado |
| Ação | linhas antigas permanecem | Overwrite para foto do período; Adicionar/Atualizar só para incremento |
| Zero à esquerda | CPF/conta não cruzam | campos de identificador como Text |

Depois de importar, validar com uma query de contagem e faixa de datas ([[SFMC-Query-Studio-e-SQL]]). Mapa das DEs: [[MOC-SFMC-DEs-e-Automations]].

## Evidências e lacunas — revisão 02/10/2026

Esta revisão cruzou notas, código da Fábrica e Supabase; não inspecionou sessão SFMC. [[Emails-Dinamicos-Plurix]] conserva o teste histórico de 10/08. Configuração atual das DEs, testes posteriores, reentrada, pressão de contato e responsáveis nominais devem ser confirmados pelo operador. A conclusão operacional só vale para o recorte que possui essa evidência.
