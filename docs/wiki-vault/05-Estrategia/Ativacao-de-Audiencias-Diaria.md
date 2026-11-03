---
tags: [estrategia,audiencias,midia,sfmc,aws,ativacao]
tipo: estrategia
camada: estrategia
atualizado: 2026-08-04
status: confirmado
fonte: pesquisa-externa
---

# Ativação de Audiências Diária (SFMC → S3 → Meta/Google)

**Definição:** o pipeline decidido (2026-06-10) para sincronizar **diariamente** as 6 bases de meio/topo de funil — **Topo de Funil / Repescagem / Upgrade × B2C e Plurix** — como Custom Audiences (Meta) e Customer Match (Google).

## Restrição de crédito vigente

Decisão confirmada em 04/08/2026: aquisição via CRM e mídia paga opera apenas com **mar fechado**. Para o plano Vibe, o escopo de aquisição é:

- Base_Proprietaria B2C (`b2c_topo`).
- Meio de funil combinado: Aprovados_nao_convertidos + Negados, preservando a identificação dos subgrupos.
- Audiência digital comprada no Insights Hub Serasa, mantida como origem separada e como aproximação mais externa permitida.

Cartonistas pertencem à Rentabilização. Seguidores e lookalike da audiência Serasa pertencem ao Branding e não devem ser reaproveitados como aquisição sem nova decisão do time de Crédito. Contrato completo em [[Estrategia-Multicanal-Vibe-Mar-Fechado]].

## As 6 audiências (mapeamento [[Segmentos]] × [[Etapa-de-Aquisição]])
| Audiência | Regra |
|---|---|
| `b2c_topo` | Base_Proprietaria + Aquisicao (Parceiro Proprietaria) |
| `b2c_repescagem` | Negados + Meio_de_Funil |
| `b2c_upgrade` | Aprovados_nao_convertidos + Meio_de_Funil |
| `plurix_topo` | CRM + Aquisicao |
| `plurix_repescagem` | Negados + Meio_de_Funil |
| `plurix_upgrade` | Aprovados_nao_convertidos |

## Rotas avaliadas (pesquisa 2026-06-10)
| Rota | Custo | Veredito |
|---|---|---|
| **A — Salesforce nativo** (Advertising Studio → Data 360 Ad Audiences) | US$ 2.000/mês; **não renovável após 15/ago/2026** (sunset → Data Cloud) | só se Data Cloud já estiver no contrato |
| **B — Lake AWS + APIs diretas** ✅ | ~R$ 0 (centavos de AWS) | **escolhida** — conversa com GaaS/MCPs existentes |
| **C — Ferramenta paga** (LeadsBridge Pro; Hightouch/Census US$ 350/mês) | dezenas–centenas US$/mês | plano B sem manutenção de código |

## Desenho da Rota B
1. **SFMC → S3** (time de dados): AppFlow connector SFMC (só leitura, agendado) ou Automation Studio Data Extract; snapshot diário completo por audiência.
2. **Normalização + hash na origem**: e-mail trim/lowercase e telefone E.164 (+55, só dígitos) → **SHA-256**; `external_id` interno fica em claro (spec Meta).
3. **Push (GaaS)**: Meta Marketing API `usersreplace` (MCP já expõe `ads_create_custom_audience`/`ads_update_custom_audience_users`); Google via **Data Manager API** (OAuth, sem developer token) — ⚠️ upload de Customer Match pela Google Ads API antiga foi descontinuado (tokens dormentes bloqueados desde abr/2026); builds novos nascem na Data Manager API.
4. **Auditoria** no Supabase (contagens, match rate, freshness) + naming alinhado à [[Taxonomia-Activity-Name]] e ao `af_adset` do [[AppsFlyer-Tracking-CRM]].

## Requisitos das plataformas
- **Meta:** verificação de negócio + termos de Custom Audience + system user token; mín. 100 usuários (1.000 p/ performance).
- **Google:** conta em boa situação de policy; lista com ≥100 membros atualizados em 540 dias; sem trava de gasto mínimo documentada hoje.
- **LGPD:** dado sai hasheado, mas é compartilhamento com terceiro p/ publicidade — exige base legal/consentimento na origem, exclusão de opt-outs e aprovação DPO. Liga com [[Anti-Overlap-Pressão-de-Contato]] e [[Governança-de-Dados]].

## Pendências
> ⚠️ A validar: entrega do contrato de dados pelo time de BI/dados (bucket, IAM, horário, flag de consentimento); aprovação DPO; verificação de negócio Meta; OAuth Data Manager API.

## Relacionado
- [[SFMC-Salesforce-Marketing-Cloud]] · [[AppsFlyer-Tracking-CRM]] · [[Segmentos]] · [[Mídia-Paga]] · [[Estrategia-Multicanal-Vibe-Mar-Fechado]] · [[Decisões-Tomadas]] · [[Decisões-Abertas]] · [[Governança-de-Dados]]
