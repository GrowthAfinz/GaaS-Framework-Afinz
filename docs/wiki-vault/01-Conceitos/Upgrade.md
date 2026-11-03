---
tags: [conceito,campanha-tipo,meio-funil]
tipo: conceito
camada: negocio
atualizado: 2026-08-20
status: confirmado
fonte: gaas-supabase
---

# Upgrade (campanha-tipo)

**Definição:** a **campanha-tipo de fechamento** — reabordar quem já havia feito uma proposta, não concluiu o pedido e foi submetido a uma **nova análise** antes da campanha.

## Bifurcação pelo resultado da nova análise

A nova análise compara o limite atual com o limite anteriormente disponível e determina a comunicação:

- **`maior`** — houve aumento de limite. O cliente recebe a peça específica de aumento, destacando o novo limite verdadeiro quando o campo estiver disponível.
- **`menor`** — não houve aumento. O cliente recebe a mesma linha de comunicação da [[Repescagem]], com limite pré-aprovado e continuidade do pedido.

`maior` e `menor` são declarações operacionais associadas ao `activity_name`; não devem ser inferidas apenas pelo nome genérico da jornada.

Para os dois caminhos, o cliente ainda precisa concluir o pedido. CTA recomendado: **"Conclua seu pedido"**. Quando houver `%%LIMITE_CRD%%`, usar o limite verdadeiro; quando não houver, trabalhar o cartão e os benefícios sem inventar valor. A opção **"até R$ 6.000"** pode ser usada como variante de teste somente quando esse teto comercial estiver aprovado para a campanha.

## A chave (como aparece em cada camada)
| Camada | Valor |
|---|---|
| CRM (B2C e Plurix) | Segmento `Aprovados_nao_convertidos` + Etapa `Meio_de_Funil` |
| Relatório diarizado | bloco `UPGRADE B2C/PLURIX` |
| Meta hoje | `AFINZ_Upgrade_Niver_A/B` (~1k, out/25 — uma já INACTIVE) |
| Audiência proposta | `crm_b2c_upgrade_daily` · `crm_plurix_upgrade_daily` |
| AppsFlyer | `af_adset=aprovados_nao_convertidos` |

## Performance e canais
> 📊 Snapshot 2026-06-10. **Conversão 16,4%, mas CAC R$ 93,51** (o mais caro) — público pequeno (97 disparos; mín. Meta de 100–1.000 usuários é restrição real aqui) e oferta cara (foi o piloto do [[Vibe]] 100%). Canais: SMS/WhatsApp/E-mail equilibrados.

## Papel na rede
O dinheiro já foi gasto aprovando — cada conversão aqui tem custo marginal de crédito zero. O desafio é **CAC de incentivo**, não de mídia: candidato natural a [[Experimento|experimentos]] de oferta (Vibe %, em dobro). Em mídia, melhor uso é **retargeting de fechamento** + exclusão imediata pós-emissão (senão o CAC explode ainda mais).

## Relacionado
- [[Plataformas-de-Comunicação]] · [[Repescagem]] · [[Vibe]] · [[Ofertas]] · [[Segmentos]] · [[Ativacao-de-Audiencias-Diaria]]
