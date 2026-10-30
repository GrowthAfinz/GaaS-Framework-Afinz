# Taxonomia de Réguas — estrutura conhecida por segmento

Referência para quando o pedido for uma **régua** (conjunto de disparos ao longo do tempo para um segmento), não uma peça avulsa — ex.: "me dá uma régua de carrinho abandonado". Fonte: matriz `Estrutura BAU CRM - OFERTA VIBE` (planilha de governança `REVISÃO VIBE.xlsx`, 2026-08-17) + nomes reais de template extraídos da mesma planilha. Dataset completo (61 templates + a matriz) está no vault em `02-Entidades-Dados/Templates-Vibe-Revisao-2026/` e `05-Estrategia/Reguas-Inteligentes-Arquitetura.md`, se o repositório estiver conectado.

**Regra**: nunca inventar o esqueleto de uma régua (nº de disparos, canais) sem lastro nesta tabela ou em `activities` real. Se o segmento pedido não estiver aqui, avisar que não há estrutura confirmada e perguntar, em vez de estimar.

## Esqueleto conhecido (segmento × canais × nº de disparos)

| Segmento | Etapa | Canais praticados | Parceiros | Nº disparos |
|---|---|---|---|---|
| Topo de Funil | Topo | E-mail, SMS | Afinz, Plurix, Bem Barato, Dia | 8 |
| Repescagem | Meio de Funil | WhatsApp, SMS | Afinz, Plurix, Bem Barato | 4 |
| Upgrade | Meio de Funil | WhatsApp, SMS | Afinz, Plurix, Bem Barato | 4 |
| Carrinho Abandonado \| Diário | Reativação | WhatsApp, SMS, Push | Afinz, Plurix, Bem Barato | 3 |
| Carrinho Abandonado \| 21D | Reativação | WhatsApp, SMS, Push | Afinz, Plurix, Bem Barato | 3 |
| Carrinho Abandonado \| Sábado | Reativação | WhatsApp, SMS, Push | Afinz, Plurix, Bem Barato | 3 |

Carrinho Abandonado **não é um segmento único** — são 3 réguas paralelas com propósito diferente (rotina diária vs. reativação de quem parou há 21 dias vs. disparo de fim de semana), mesma contagem de disparos (3) mas potencialmente ganchos diferentes. Se o usuário pedir "régua de carrinho abandonado" sem especificar, pergunte qual (ou ofereça as três).

## Variante de público — dimensão ortogonal ao segmento

Dentro de cada célula da tabela acima, os templates reais mostram divisão adicional por origem do lead, visível nos próprios nomes de template:

- `institucional` — lead que veio direto pelo funil próprio Afinz.
- `srsa` — lead de Serasa.
- `ac` — lead de Consumidor Positivo (parceiro de dados).
- `bpc` / `bsp` — lead de Bom pra Crédito.
- `ecred` — variante Ecred (parceiro/canal de originação diferente).
- `neg` / `ngd` — segmento Negados (crédito recusado, reengajamento).
- `nov` / `upo` — Upgrade de limite.

Ao montar uma régua, pergunte quais variantes o usuário quer cobrir (ou infira, se ele já especificou a origem do lead). Não assuma que "carrinho abandonado" = só Institucional — Ecred é uma variante real e documentada.

## Como usar isto numa resposta de régua

1. Resolver o segmento contra a tabela acima; se tiver sub-jornadas (caso Carrinho Abandonado), perguntar/oferecer as opções.
2. Sugerir os canais já praticados por aquele segmento (não perguntar do zero "quais canais existem" — a tabela já responde isso); confirmar quais o usuário quer nesta rodada.
3. Perguntar/confirmar variante(s) de público.
4. Para cada combinação canal × disparo × variante, checar se há exemplo real em `references/exemplos_reais.md` ou no dataset do vault (`Templates-Vibe-Revisao-2026`) — usar como referência de tom/estrutura, nunca copiar valor de oferta desatualizado sem avisar (valores de créditos Vibe já mudaram entre campanhas, ex. R$100 → R$200 em versões mais recentes).
5. Gerar a copy nova ancorada no padrão observado, sinalizando explicitamente quais peças têm precedente real e quais foram geradas sem exemplo direto.
6. Fechar com o checklist de compliance padrão da skill e o "próximo passo" de sempre.

## Relacionado

Ver `references/exemplos_reais.md` para os padrões de copy observados (CTA duplo, nomenclatura de produto por BU, campos de personalização por canal). Ver `references/parceiros.md` para nomes de produto co-brandados por BU.
