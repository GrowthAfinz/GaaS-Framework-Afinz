# Baselines da Operação — GaaS Insight Engine

Fonte: Vault Obsidian, snapshots 2026-06-08/10. Estes números são REFERÊNCIA HISTÓRICA —
o evidence pack traz os números vivos; os baselines servem para detectar desvio.

> Reidratação: rodar as queries do `Runbook-Vault-Vivo` (vault) ou re-extrair das views
> ponderadas e atualizar este arquivo junto com a data.

## Funil de aquisição fria (etapa Aquisicao) — snapshot 2026-06-08

| Etapa | Taxa baseline |
|---|---|
| Entrega | 90,0% |
| Abertura | 9,2% |
| Proposta | 11,8% |
| Aprovação | 58,0% |
| Conversão | 6,7% |

## Segmentos (etapas Aquisicao + Meio_de_Funil) — snapshot 2026-06-10

| Segmento | Etapa | Conversão | CAC | Papel |
|---|---|---|---|---|
| Abandonados | Meio funil | 6,1% | R$ 4,83 | melhor relação — alavanca principal |
| Aprovados_nao_convertidos | Meio funil | 16,4% | R$ 93,51 | converte alto, custo de incentivo alto |
| Negados | Meio funil | 16,7% | R$ 39,04 | converte 5x o topo, subescalado |
| Leads_Parceiros | Meio funil | 8,9% | R$ 13,55 | equilibrado |
| CRM | Aquisição | 3,3% | R$ 10,15 | aquisição fria, núcleo de volume Plurix |
| Base_Proprietaria | Aquisição | 2,6% | R$ 14,29 | aquisição fria B2C |

Regra: meio de funil converte ~4x a aquisição fria — NUNCA misturar no benchmark.

## Canais — snapshot 2026-06-10

| Canal | Custo unit. | Conversão | CAC | Leitura |
|---|---|---|---|---|
| E-mail | R$ 0,001 | 3,4% | R$ 6,56 | menor CAC; canal de volume frio |
| WhatsApp | R$ 0,420 | 7,3% | R$ 22,95 | maior conversão e volume; custo 420x e-mail |
| SMS | R$ 0,064 | 6,5% | R$ 24,61 | intermediário, CAC alto |
| Push | R$ 0,001 | 0,8% | — | ocioso (103 disparos) — baixa evidência |

Dispersão de CAC ~3,7x entre canais — alavanca central de alocação.

## Comparações canônicas (Dossiê §5)

| Comparação | Pergunta |
|---|---|
| Último dia fechado vs média dos 7 anteriores | houve quebra recente? |
| Últimos 7 dias vs 7 anteriores | há tendência consistente? |
| Campanha/segmento vs próprio padrão 28d | saiu do padrão próprio? |
| Safra atual vs safras comparáveis | a operação aprende? |

Regras: não comparar dia corrente incompleto; intervalos semiabertos; baixo volume → ampliar janela e reduzir confiança.

## Fatos estruturais conhecidos (contexto para narrativa)

- Operação total: ~18,7k cartões, ~R$ 270k investidos em CRM (jan/25–jun/26)
- Virada fev→mar/26 em Abandonados: CAC ÷3, conversão ×3,6 nos dois BUs — causa não documentada
- E-mail tem ZERO disparos no segmento Abandonados (lacuna conhecida)
- Reativação quase parada (3 disparos); Push ocioso
- WhatsApp concentra ~55% das emissões (10.344/18.715) — risco de concentração de canal
- Copa 2026 ("Bate Um Bolão", 15/abr–15/ago/26): sazonalidade — isolar na leitura para não distorcer a base
