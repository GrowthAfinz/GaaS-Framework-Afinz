---
tags: [conceito,campanha-tipo,meio-funil]
tipo: conceito
camada: negocio
atualizado: 2026-08-20
status: confirmado
fonte: gaas-supabase
---

# Repescagem (campanha-tipo)

**Definição:** a **campanha-tipo de segunda chance** — reabordar quem fez uma proposta, não foi aprovado naquele momento e depois **já passou por uma nova análise de crédito**, recebendo inclusive um limite pré-aprovado.

## Estado real do cliente e regra de comunicação

- A nova análise de crédito já aconteceu antes da entrada na campanha; a copy pode dizer **"pré-aprovado"** e, quando disponível, informar o limite verdadeiro da pessoa.
- A conclusão ainda depende da jornada final, especialmente da validação antifraude/biometria. Uma biometria inválida pode impedir a emissão mesmo com limite pré-aprovado.
- Por isso, **"sujeito à análise de crédito" continua obrigatório**: é a ressalva operacional adotada pela Afinz para uma aprovação com probabilidade muito alta, mas ainda não irrevogável.
- O texto não deve relembrar a negativa anterior. A narrativa começa na nova oportunidade: limite pré-aprovado + continuidade do pedido.
- CTA recomendado: **"Peça seu cartão"** ou equivalente de continuidade, sem prometer emissão garantida.

## A chave (como aparece em cada camada)
| Camada | Valor |
|---|---|
| CRM (B2C e Plurix) | Segmento `Negados` + Etapa `Meio_de_Funil` |
| Relatório diarizado | bloco `REPESCAGEM B2C/PLURIX` |
| Meta hoje | `AFINZ_Negados_Orgânicos_21_05_2025` (230–271k, congelada), `AFINZ_Repescagem_Niver_A/B` (~1k, out/25), `AFINZ_Serasa_Repescagem_05_05_2025` |
| Audiência proposta | `crm_b2c_repescagem_daily` · `crm_plurix_repescagem_daily` |
| AppsFlyer | `af_adset=negados` |

## Performance e canais
> 📊 Snapshot 2026-06-10. **Conversão 16,7% (5x o topo), CAC R$ 39** — converte muito bem, mas caro. Canal núcleo: **WhatsApp** (98 disparos/3.146 cartões); SMS e E-mail secundários. 199 disparos no total — bloco **subescalado** vs potencial.

## Papel na rede
É o melhor argumento para mídia paga coordenada: a base de Negados no Meta (230k+) está congelada há 13 meses enquanto o CRM trabalha o segmento toda safra — sincronizar diariamente fecha esse vão. Timing importa: reabordar perto da reavaliação de crédito ([[Perfis-de-Crédito]]).

## Relacionado
- [[Plataformas-de-Comunicação]] · [[Topo-de-Funil]] · [[Upgrade]] · [[Segmentos]] · [[Ativacao-de-Audiencias-Diaria]] · [[Performance-por-Segmento]]
