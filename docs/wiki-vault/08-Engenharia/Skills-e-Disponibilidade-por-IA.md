---
tags: [engenharia,skills,agentes,ia,governanca]
tipo: engenharia
camada: engenharia
atualizado: 2026-10-30
status: confirmado
fonte: inventario-repositorio
---

# Skills e Disponibilidade por IA

## Catálogo vigente em 30/10/2026

A fonte canônica é o repositório público GaaS-Framework-Afinz, na pasta `.claude/skills/`. A biblioteca está em **Aprendizado e Memória → Trabalhar com IA → Skills**, depois de Contribuições.

- **35 pacotes próprios**, incluindo os PPTX completos autorizados pelo Pablo.
- **110 fichas de terceiros**, com origem oficial e sem redistribuição dos arquivos.
- Download individual, caso de uso e detalhes recolhidos, tamanho e contexto estimado por skill.
- Botões funcionais para adicionar por ZIP e excluir, com commits na main via credencial GitHub de escrita; catálogo publicado após CI/deploy.
- Sem duplicar pacotes no Supabase Storage e sem novo nível de acesso no catálogo.
- Estimativa de tokens: caracteres / 4 de SKILL.md e referências Markdown; binários e scripts excluídos.
- Compatibilidade de instruções não certifica execução em cada IA.

O inventário, as fusões e a manutenção estão em [[Catalogo-de-Skills]]. Cada capacidade tem uma ficha na pasta `09-Inteligencia-IA/Skills/`.

## Registro histórico anterior à consolidação

As seções abaixo preservam o levantamento anterior. Caminhos, contagens e bloqueios de ambiente desse registro não representam o catálogo vigente.

**Definição:** o inventário das skills da operação, onde cada uma vive e por qual assistente
ela é acessível. Existe porque skill em lugar errado é skill que não roda.

## A regra que explica tudo

| Onde a skill vive | Claude Code | Cowork | Codex e outros |
|---|---|---|---|
| `.claude/skills/` do repositório | Carrega como skill de projeto | Não carrega | Lê o `SKILL.md` como markdown |
| `~/.claude/skills/` da máquina | Carrega para todos os projetos | Não carrega | Não vê |
| Conta claude.ai | Só em sessões cloud e rotinas | Carrega no início da sessão | Não vê |

Quando o mesmo nome existe em mais de um nível, a precedência é **enterprise > pessoal >
projeto**, e qualquer um deles sobrescreve uma skill empacotada de mesmo nome.

**Consequência prática:** para uma skill estar disponível nos três, ela precisa estar **no
repositório** e **habilitada na conta**. É o caso da `afinz-pptx`.

## Skills do repositório — `.claude/skills/`

Versionadas junto com o projeto. Claude Code carrega automaticamente; Codex lê como documento.

| Skill | O que faz |
|---|---|
| `afinz-pptx` | Apresentações com a marca Afinz. Contém o guia de marca, template de 22 layouts, script determinístico de aplicação de marca e a **arquitetura completa do deck de Plano de Mídias** |
| `afinz-copy-aquisicao` | Redige e revisa copy de aquisição Afinz para e-mail, WhatsApp, SMS e push |
| `afinz-crm-diarizado` | Gera o Excel diário de aquisição CRM a partir de `activities` e `b2c_daily_metrics` |
| `copa-crm-parser` | Atualiza e analisa os resultados CRM da campanha Copa 2026 |
| `emails-dinamicos-sfmc` | Opera DE, CSV, chave composta, importação e diagnóstico do motor dinâmico no SFMC |
| `gaas-funil-aquisicao-ingest` | Ingestão dos dashes do Funil de Aquisição a partir de export cru |
| `gaas-governanca-comunicacoes` | Cruza a planilha de governança de links e templates com o Supabase |
| `gaas-insight-engine` | Coletor determinístico de evidências e geração de insights de CRM |
| `gaas-midia-report` | Leitura de gestão de report de mídia paga, Meta e Google |
| `gaas-momento-disparo` | Recomenda o melhor momento de disparo por BU × parceiro × segmento |
| `gaas-relatorio-xlsx` | Constrói e evolui os exportadores XLSX da aba Relatório do app |
| `growth-saas-marketing-cloud` | Projeta e evolui o SaaS de growth, analytics e PLG |
| `sfmc-acquisition-email-designer` | Cria, altera e audita HTML/AMPscript de aquisição, com design responsivo, compatibilidade e QA |
| `sfmc-jornadas-pacote` | Lê ZIP do Package Manager do SFMC: extrai mensagens por jornada, liga a `activities` pelo activity_name, ranqueia templates e desenha a jornada (Python puro; roda no Claude Code e no Codex) |

## Skills da conta claude.ai

Disponíveis no Cowork e em sessões cloud. **Não estão no repositório** — a máquina local do
Claude Code não as enxerga a menos que sejam copiadas para `.claude/skills/`.

**Da operação:** `afinz-pptx` (também no repo) · `afinz-pptx-campanha` ·
`growth-brain-intelligence-engine` · `storytellingfiltergaas` · `b2c-originacao-updater` ·
`diarizado-pacing`

**Genéricas da Anthropic:** `pptx` · `xlsx` · `docx` · `pdf` · `canvas-design` ·
`brand-guidelines` · `theme-factory` · `frontend-design` · `doc-coauthoring` ·
`internal-comms` · `skill-creator` · `mcp-builder` · `algorithmic-art` ·
`csv-data-summarizer` · `slack-gif-creator` · `schedule` · `morning` ·
`consolidate-memory` · `explain-usage` · `setup-cowork`

## Skills Afinz e GaaS disponíveis no Codex

O Codex tem duas camadas diferentes de disponibilidade. As skills em `.claude/skills/` são
lidas como instruções do projeto; as skills em `C:/Users/Pablo Prado/.codex/skills/` são
skills pessoais carregadas pelo ambiente Codex.

### Skills do projeto que o Codex consegue ler

As 13 skills listadas na seção **Skills do repositório** estão acessíveis ao Codex por
leitura direta do `SKILL.md`, incluindo o conjunto especializado em aquisição e e-mails:
`afinz-copy-aquisicao`, `emails-dinamicos-sfmc` e `sfmc-acquisition-email-designer`.

Disponibilidade operacional verificada em 2026-08-07:

| Situação no Codex | Skills |
|---|---|
| Executável integralmente no ambiente atual | `afinz-copy-aquisicao`, `afinz-crm-diarizado`, `emails-dinamicos-sfmc`, `gaas-relatorio-xlsx`, `growth-saas-marketing-cloud`, `sfmc-acquisition-email-designer` |
| Executável parcialmente | `afinz-pptx`, `copa-crm-parser`, `gaas-funil-aquisicao-ingest`, `gaas-governanca-comunicacoes`, `gaas-insight-engine` |
| Sem o executor exigido pela skill nesta sessão | `gaas-midia-report`, `gaas-momento-disparo` |

Os principais bloqueios são: LibreOffice ausente para QA visual de PPTX; `recalc.py` ausente
para recalcular o XLSX da Copa; e falta de um executor SQL Supabase compatível com o fluxo
documentado de `gaas-midia-report` e `gaas-momento-disparo`.

### Skills pessoais Afinz/GaaS instaladas no Codex

| Skill | Papel |
|---|---|
| `crm-communication-enricher` | Transcreve e enriquece prints de comunicações CRM com metadados revisáveis |
| `crm-dispatch-intelligence` | Diagnostica cada disparo de aquisição CRM contra históricos equivalentes |
| `gaas-communication-governance` | Governa templates, Activity Names, links AppsFlyer, journeys SFMC e cobertura de assets |
| `gaas-growth-context` | Monta o Growth Context Pack a partir de repo, vault, Supabase, planilhas e assets |
| `growth-data-quality-monitor` | Valida atualização, cobertura, completude, duplicidade e integridade das fontes de growth |
| `growth-report-operator` | Orquestra e consolida especialistas em um report final de aquisição CRM e mídia |
| `growth-saas-marketing-cloud` | Projeta e evolui o SaaS de growth, analytics e marketing cloud |
| `measurement-attribution-auditor` | Audita tracking, eventos, janelas, cobertura e atribuição |
| `meta-ads-remote` | Acessa Meta Ads pelo MCP remoto oficial para campanhas, delivery, spend e insights |
| `paid-media-campaign-analyst` | Analisa Meta e Google por campanha, ad set, anúncio e criativo |
| `report-live-release-engineer` | Opera build, certificação, publicação e rollback do Report Live |
| `segment-performance-analyst` | Diagnostica aquisição CRM por segmento, funil, custo, CAC, canal e BU |

Essas skills pessoais não estão garantidas para Claude Code, Cowork ou outro agente. Para
virarem capacidade portável do projeto, suas instruções e arquivos auxiliares precisam ser
versionados no repositório ou instalados separadamente no ambiente de destino.

## Skills usadas na construção do plano de mídias de agosto de 2026

| Skill | Papel | Onde estava |
|---|---|---|
| `afinz-pptx` | Paleta, template, script de marca, arquitetura do deck | Conta e repositório |
| `pptx` | Mecânica: `thumbnail.py`, `add_slide.py`, `office/validate.py`, `office/soffice.py` para QA visual | Conta |
| `afinz-pptx-campanha` | Avaliada e **descartada** — Vibe não é campanha sazonal nem parceria de bandeira | Conta |

A leitura das planilhas foi feita direto com `openpyxl` e a do PDF com `pdftotext`, sem acionar
as skills `xlsx` e `pdf`.

## Dependência que não é skill

A skill `afinz-pptx` depende de duas coisas que precisam existir no ambiente:

- **`python-pptx`** para montar e editar os arquivos
- **LibreOffice e Poppler** para o QA visual — converter em PDF com `soffice` e em imagem com
  `pdftoppm`

Sem o QA visual, o deck sai com texto estourando e banda colidindo com o logo. Não é opcional.

## Lacuna conhecida

As skills genéricas da Anthropic (`pptx`, `xlsx`, `docx`, `pdf`) **não estão no repositório**.
Um agente que só leia o repo — Codex, por exemplo — tem a `afinz-pptx` mas não tem os scripts de
mecânica de slides dela. Para o Codex operar sozinho num deck, ou os scripts da `pptx` entram no
repo, ou ele reimplementa a montagem com `python-pptx` puro.

## Relacionado

- [[Deck-Plano-de-Midias-Arquitetura]] ·
  [[Agentes-e-Workflows]] · [[Arquitetura-Geral]]
