---
tags: [evolucao, template, criativo, ideia, llm]
tipo: evolucao
camada: evolucao
atualizado: 2026-07-15
status: implementado
fonte: operador
---

# Galeria de Templates

> [!success] Evolução entregue em 2026-07-15
> A galeria passou a ser a entrada principal de **Comunicações → Performance do Conteúdo**, com seleção de segmento, leitura visual do `template_id`, rascunhos sob demanda e insights acionáveis.

## O que entrou no produto
- **Galeria como visão padrão**; Visão Geral e Tabela permanecem como leituras complementares.
- **Seleção de segmento antes das peças**, exibindo nome corrigido e etapa do funil de forma compacta.
- **Rascunhos desligados por padrão**, com controle explícito `off/on`.
- **Chips semânticos do Template ID**, traduzindo público, canal, campanha, segmento e ordem do disparo.
- **Caixa curta de insight e sugestão de análise**, conectada ao score e ao diagnóstico da peça.
- **Modal de detalhe corrigido**, acima do cabeçalho do GaaS, com fechamento reposicionado e identidade visual mais legível.

## Guardrails de governança implementados
- A identidade estrutural de público/BU tem precedência sobre similaridade textual e score.
- Campanhas `BB`, `BBT`, `B2B2C` e jornadas com `CRM` não podem sugerir ou vincular templates `B2C`.
- O identificador canônico continua preservado nos dados; a tradução ocorre apenas na camada visual.
- Matches rejeitados permanecem explicáveis e disponíveis para revisão humana.

Detalhamento operacional, auditoria e próximos passos: [[Performance-do-Conteudo-GaaS]].

**Definição:** página no GaaS para **navegar pelas imagens dos templates e compará-los**, com extração de conteúdo via LLM no momento do armazenamento. Materializa a pergunta de negócio do conceito [[Template]] (*qual criativo gerou resposta?*) e a oportunidade aberta em [[Eficiência-de-Criativo]].

## Arquitetura proposta (conversa 2026-06-11)

### Armazenamento — Supabase Storage (Free dá conta)
- **Duas renditions por template**: preview WebP leve (~100 KB) para a grade da galeria + full WebP legível (qualidade 80, ~200–400 KB para e-mail inteiro) para leitura em zoom.
- Conta: ~1.000 templates ≈ 300–400 MB de 1 GB do plano Free; egress 5 GB/mês com CDN cobre 7 usuários com folga (thumbnail + lazy loading, full-res sob demanda).
- Válvula de escape se escalar: Cloudflare R2 (10 GB free) trocando só a URL base.
- ⚠️ Nunca hotlinkar imagens do CDN do Meta ([[ad_creatives]]) — as URLs **expiram**. Sempre copiar para o bucket próprio.

### Extração via LLM (skill / agendamento)
No upload, o template passa por análise de imagem que grava campos estruturados na tabela de templates:
- `texto_completo` (o conteúdo legível — tira da imagem a responsabilidade de ser "lida")
- `oferta`, `promocional` (conecta com a chave de intenção `(Oferta, Promocional)` do sistema de experimentos)
- `cta`, `elementos_visuais`, `tom`
- **Chave inferida do template** `jornada+canal+ordem+oferta+promocional` (mecanismo da [[Entidades-v2|v2]]: confiança <80% → fila de revisão humana, padrão [[gaas_update_runs]])
- Hash/similaridade para detectar **reuso** do mesmo criativo entre disparos (ex.: D1 = D11, hoje invisível)

### Comparação
A comparação acontece por **dados estruturados** (filtro por CTA, agrupamento por oferta, diff de copy entre disparos), não só por imagens lado a lado. A galeria vira camada de inteligência de criativo do CRM, paralela ao que [[ad_creatives]] já é para mídia paga.

## Decisões abertas
- [ ] **Pipeline de captura** (o gargalo real): quem screenshota o template do SFMC, quando, e com que convenção de nome. Sem isso, galeria e LLM ficam sem matéria-prima.
  > 📎 Achado 2026-08-12: já existe um arquivo manual candidato a matéria-prima — pastas pessoais do Pablo `WHATSAPP AQUISIÇÃO COPA` (organizada por BU→Segmento/Etapa→variante de audiência, onda Copa 2026) e `COMUNICAÇÕES` (organizada por ano→BU→Segmento→Canal, com material de 2025). Ainda **não resolve** a decisão — três problemas ficaram claros na amostragem (12 imagens vistas, não é cobertura completa): (1) proveniência mista — parte dos prints da pasta Copa parece ser envio de teste/QA (nomes "Pablo"/"Pietra", limites com cara de placeholder), não confirmadamente disparo real pra base, então não dá pra tratar 1:1 como "o que já rodou"; (2) o canal indicado pela pasta nem sempre bate com o conteúdo real (um print de push estava dentro da árvore de WhatsApp); (3) os dois lotes têm formato de captura diferente (2025 mostra tags de merge cruas tipo `%%FirstName%%`, 2026/Copa mostra valores já preenchidos) — qualquer prompt de extração por LLM precisa lidar com as duas formas. Antes de promover isso a pipeline oficial, definir um campo de status de proveniência (ex. `preview_manual` vs `confirmado_disparo`) pra não inflar `communication_slots.coverage_status` com QA.
  > 📎 Atualização 2026-08-17: rodada a extração completa (não mais amostra) nas 73 imagens das duas pastas — dataset bruto salvo em [[Amostras-Comunicacoes-Reais|02-Entidades-Dados/Amostras-Comunicacoes-Reais]] (`dataset_completo.json` + `afinz_briefing_dataset.csv`, schema com `texto_completo`/`oferta`/`promocional`/`cta`/`elementos_visuais`/`tom` — os mesmos campos já especificados na seção "Extração via LLM" acima). Números confirmam os problemas apontados no achado anterior, agora na base inteira: **53/73 (73%) com indício de teste/QA**, **6/73 com canal da pasta divergente do canal real** (todas em `B2C/CARRINHO/DIÁRIO`, marcadas WhatsApp mas são push). Nenhuma linha foi vinculada a `template_id` — a tabela usa `template_id` como chave primária `NOT NULL` com validação de formato, então não dá pra promover essas linhas pra `communication_templates` sem atribuir um `template_id` real vindo da planilha de governança primeiro. O dataset está pronto como insumo; a decisão de pipeline oficial continua aberta.
  > 📎 Atualização 2026-08-17 (2): segunda fonte, de qualidade bem melhor — a planilha oficial de revisão `REVISÃO VIBE.xlsx` (upload do Pablo), que usa o recurso "imagem na célula" do Excel moderno (não drawings antigos; `openpyxl` não lê isso, foi preciso parsear `xl/richData` + `xl/metadata.xml` na mão). Extraídos os 61 templates embutidos, religados às suas linhas de origem em 4 abas (2 atuais + 2 históricas/"old", cobrindo justamente o "reuso invisível" citado acima: **106 referências de imagem em só 61 arquivos = 27 criativos reaproveitados em mais de uma linha**, agora seguível campo a campo). Diferença crucial para o blocker de `template_id`: **todos os 61 registros já têm o nome real do template no Salesforce** (`nome_template_salesforce`), e só 6/61 (10%) têm indício de teste/QA — muito mais limpo que o lote de screenshots pessoais. Ainda é candidato, não confirmado 1:1 contra `communication_templates.template_id` (não pular a validação humana da `gaas-governanca-comunicacoes`), mas é o melhor insumo disponível hoje para começar a fechar os 113 slots `unmapped` de [[communication_slots]]. Dataset em [[Templates-Vibe-Revisao-2026|02-Entidades-Dados/Templates-Vibe-Revisao-2026]]; a mesma planilha também trouxe a matriz de régua planejada (`Estrutura BAU CRM - OFERTA VIBE`), usada como base da proposta em [[Reguas-Inteligentes-Arquitetura]].
- [ ] Onde roda a análise LLM: skill no Cowork (sob demanda/agendada) vs edge function.
- [ ] Tabela própria `templates` (promover Template a entidade) vs campos em [[activities]].
- [ ] Padrão de qualidade da rendition full (legibilidade de e-mail longo em mobile).

## Relacionado
- [[Template]] · [[Eficiência-de-Criativo]] · [[ad_creatives]] · [[Criativos]] · [[Experimento]] · [[Entidades-v2]] · [[Decisões-Abertas]] · [[Amostras-Comunicacoes-Reais]] · [[Templates-Vibe-Revisao-2026]] · [[Reguas-Inteligentes-Arquitetura]]
