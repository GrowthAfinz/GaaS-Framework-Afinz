---
tags: [estrategia,midia,deck,apresentacao,criativo,kv,vibe]
tipo: estrategia
camada: estrategia
atualizado: 2026-08-07
status: confirmado
fonte: deck-aprovado
---

# Deck do Plano de Mídias — Arquitetura de Referência

**Definição:** a arquitetura narrativa e de layout do deck de plano de mídia paga da Afinz,
consolidada na construção do plano de agosto de 2026 (transição Copa/Visa → Vibe). Referência
aprovada: `Plano_de_Midias_Afinz_Vibe_Ago26.pptx`, 14 slides.

**Skill que executa:** `afinz-pptx`, seção "Plano de Mídias — arquitetura de referência".

**Onde ela vive** — versionada no repositório, acessível a qualquer agente:

| Item | Caminho |
|---|---|
| Instruções | `.claude/skills/afinz-pptx/SKILL.md` |
| Guia de marca | `.claude/skills/afinz-pptx/brand_spec.md` |
| Template 22 layouts | `.claude/skills/afinz-pptx/assets/afinz_template_institucional.pptx` |
| Script de marca | `.claude/skills/afinz-pptx/scripts/apply_afinz_brand.py` |
| Ponto de entrada para agentes | `AGENTS.md` na raiz |

O Claude Code carrega como skill de projeto automaticamente. Codex e outros agentes leem o
`SKILL.md` como markdown comum — ele é autossuficiente e os caminhos internos são relativos à
pasta da skill.

## Os 14 slides, em três blocos

Divisórias no layout `Slide respiro / Título` separam os blocos e são o que permite conduzir a
apresentação falando.

| # | Slide |
|---|---|
| 1 | Capa |
| 2 | **Divisória: Estratégia mídia paga** |
| 3 | Objetivo e divisão de investimento por frente ativa |
| 4 | Peças e KVs |
| 5 | **Divisória: Estrutura de campanhas** |
| 6 a 9 | Uma frente por slide — Aquisição, Branding, Rentabilização, Seguros |
| 10 | **Divisória: Projeções e acompanhamento** |
| 11 | Projeção por campanha |
| 12 | Acompanhamento e decisão por métrica |
| 13 | O que fica fora deste ciclo |
| 14 | Próximos passos |

**Decisão de ordem:** criativo (slide 4) vem antes do detalhe das frentes. O deck estabelece o
que será dito antes de detalhar onde será veiculado — serve a reuniões com marketing na sala.

**Sem apêndice.** Material de apoio vira arquivo separado.

## Anatomia do slide de frente

Cinco blocos fixos, repetidos entre frentes de propósito: cada dono de área lê um slide só.

1. **Faixa de topo preta** — Verba mensal · Verba diária · Canais · KPI principal · Última etapa medida
2. **Duas colunas de plataforma** — logo, card de campanha com verba mensal
3. **Lista de conjuntos** — nome do grupo, verba do grupo, status em caixa colorida com texto
4. **Coluna de segmentação** (preta, à direita) — quem é cada audiência, em prosa. É o bloco que
   diferencia o deck de uma planilha exportada. Padrão herdado de deck de agência.
5. **Faixa de KVs** — cards numerados com conceito, quem recebe, novo ou acervo, formatos

## Cores por frente

| Frente | Tratamento |
|---|---|
| Aquisição | Ciano `#00C6CC` preenchido |
| Rentabilização | Ciano vazado |
| Branding / Brandformance | Verde `#D3FF00` preenchido |
| Seguros | Verde vazado |
| Plurix e standby | Preto |

Cheio e vazado agrupam por família: azul é a jornada do cartão, verde é marca e cross-sell.
Vermelho `#E74742` nunca identifica frente — só alerta e bloqueio. A cor se repete em cinco
lugares ao longo do deck, sempre a mesma.

## Modelo de decisão adotado — Messy Middle

O deck abandonou o funil linear. Adotou o ciclo de *Decoding Decisions* (Google e The
Behavioural Architects, 2020): **Exposição** envolve tudo, **Gatilhos** disparam, o laço
**Exploração ↔ Avaliação** é onde a decisão acontece, depois **Compra** e **Experiência**, que
realimenta o laço.

| Posição no ciclo | Frente |
|---|---|
| Exposição | Branding — lookalike e display contextual |
| Gatilhos | Serasa, aprovados e negados do CRM |
| Exploração | Branding — search de intenção e display em cupom e cashback |
| Avaliação | Brandformance — audiência exata levando à landing |
| Compra | Aquisição — Meta App e Display |
| Experiência | Rentabilização e Seguros |

**Ressalva registrada no deck:** o estudo descreve categorias de escolha aberta. Cartão de
crédito tem uma camada acima do ciclo — elegibilidade de crédito. Por isso o plano opera em
lista própria: não é limitação de alcance, é a aplicação da recomendação do próprio estudo de
encurtar a distância entre gatilho e compra.

**Brandformance ≠ Branding.** Brandformance é tráfego para audiência qualificada, medido por
visita à landing. Branding é reconhecimento, medido por lembrança estimada. O deck separa os
dois. Ver [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado).

## Modelo criativo — KV, desdobre e peça

Três níveis, nunca confundir:

- **KV** — a ideia visual original. É o trabalho de criação e serve o **território de mensagem**,
  não o grupo de anúncio.
- **Desdobre** — o mesmo KV em outro formato. É execução.
- **Peça** — o arquivo final que entra na plataforma, direcionado ao grupo.

**Territórios (chamados de gatilhos no deck):** Solicitar cartão · Retomar pedido · Avaliar ·
Lembrar · Usar · Proteger. Grupos do mesmo território dividem o KV e mudam apenas copy e
destino. Se cada grupo tivesse KV próprio, a produção dobraria para dizer as mesmas seis coisas.

**Formatos de desdobre:** Meta 4:5 (1080×1350) · Meta 9:16 (1080×1920) · Display 1:1
(1200×1200) · Display 1,91:1 (1200×628). Vídeo só no Meta — o Display responsivo trabalha com
imagem, logo e texto.

**Regra do número de desdobres** — formatos por canal × tipos de peça:
Meta e Display sem vídeo → 4 · Meta e Display com vídeo → 6 · só Meta com vídeo → 4.
A regra precisa estar escrita no slide, senão 4 e 6 parecem arbitrários.

**Search não gera KV visual** — são títulos e descrições. Declarar se é revisão de copy
existente ou criação do zero.

**Com o time de criação, falar em KV estático e vídeo, não em desdobre.** Eles produzem
conceito e vídeo; desdobre é adaptação.

## Regras de dado que o deck impõe

- **Três categorias:** todo número é *realizado*, *projetado* ou *pendente*, e o slide diz qual.
  Projeção leva selo próprio. "Pendente" nunca vira estimativa.
- **Baseline própria antes de benchmark externo.** Conferir CPM e CTR contra
  [paid_media_metrics](#mídia-paga) do período anterior. Se bater, dizer no slide que bate.
- **Não comparar CPA de plataforma com CAC de CRM.** CRM ativa base já adquirida, mídia paga
  compra alcance novo. Ver [CAC](#cac).
- **Não somar unidades heterogêneas.** Arquivo de Meta, asset de Display responsivo, asset
  textual de Search e asset group de PMax são quatro moedas. Não existe "total de peças".
- **Verba é mensal, ritmo é diário.** A tabela mostra verba mensal e verba diária (mensal ÷ 31).
- **Nenhum nome próprio.** Responsabilidade é sempre área.
- **"Regras", nunca "guardrail".**

## Verificação de integridade antes de escrever qualquer slide

Rotina que surgiu de erros reais na construção do plano de agosto:

1. Contagem real de campanhas e grupos, incluindo buracos de numeração.
2. Soma das verbas por frente contra o total declarado.
3. IDs cruzados entre abas — quando divergirem, usar o **nome operacional** e registrar a
   divergência. Na v6 os IDs de Branding não batiam entre as abas 01/02 e a 05.
4. Grupos simultaneamente com direito de uso aprovado e status pronto.

Reportar os achados antes de continuar.

## Processo que funcionou

**Produzir um contra-roteiro antes de montar.** O roteiro da aba `04_Roteiro_PPT` é ponto de
partida, não especificação. Foi essa inversão que gerou o valor: o roteiro original não tinha
projeção, não tinha flighting, não tinha território de mensagem e colocava budget no slide 11.

**Se o usuário já editou uma versão, editar o arquivo dele — não regenerar.** Ele adiciona
logos, divisórias e correções de texto que se perdem numa regeração.

## Erros que custaram retrabalho

- Apontar para o arquivo errado por usar nome fixo em vez de padrão de busca.
- Transformar todo slide em tabela porque a fonte é planilha.
- Somar arquivos de Meta com assets de Display.
- Quebrar uma frente em várias linhas por causa de uma coluna de situação — se a coluna sair,
  a quebra perde o motivo.
- Bandas de rodapé de largura total colidindo com o logo do template.
- Cinza claro em card, que o script de marca transforma em preto.
- Inventar prazos e fases que a planilha não tem sem marcar como proposta.

## Relacionado

- [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado) ·
  [Plano-de-Midias-Afinz-Vibe-Handoff](#plano-de-midias-afinz-vibe-handoff) ·
  [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria) ·
  [Segmentos](#segmentos) · [Mídia-Paga](#mídia-paga) · [Vibe](#vibe)
