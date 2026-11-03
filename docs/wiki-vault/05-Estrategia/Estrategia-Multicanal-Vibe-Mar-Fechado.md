---
tags: [estrategia,midia,crm,audiencias,vibe,mar-fechado]
tipo: estrategia
camada: estrategia
atualizado: 2026-08-04
status: confirmado
fonte: briefing-negocio
---

# Estratégia Multicanal Vibe com Mar Fechado

> [!important] Estado consolidado
> Para a arquitetura atual de campanhas, decisões de Branding, Seguros, Plurix, eventos, nomenclatura e itens em Standby, ler [[Plano-de-Midias-Afinz-Vibe-Handoff]].

**Definição:** arquitetura de audiência, destino e papel de canal para a transição de Copa/Visa para [[Vibe]], com aquisição restrita a públicos elegíveis de **mar fechado** por decisão do time de Crédito.

## Regra-âncora de elegibilidade

- CRM e mídia paga de aquisição não podem operar prospecção aberta.
- Todo público de aquisição deve respeitar o universo de **mar fechado**, chamado operacionalmente de **audiência de aquário**.
- A restrição existe para preservar a saúde da carteira de crédito e deve anteceder segmentação, canal, oferta, criativo, lance e budget.
- Lookalikes só entram onde houver autorização explícita nesta estratégia; não herdam automaticamente elegibilidade de aquisição.
- Origem de audiência deve permanecer identificável. Base proprietária, meio de funil e audiência Serasa não podem ser somadas como se fossem uma única fonte.

## Arquitetura por frente

| Frente | Audiência permitida | Papel | Destino principal | Limite de leitura |
|---|---|---|---|---|
| Aquisição | `b2c_topo`: Base_Proprietaria B2C | Escala dentro do universo elegível já conhecido | App Afinz / fluxo de solicitação do cartão | Instalação ou evento de plataforma não equivale a cartão |
| Aquisição | Meio de funil conjunto: Aprovados_nao_convertidos + Negados | Recuperar intenção e conduzir à nova solicitação ou conclusão elegível | App Afinz / fluxo de solicitação do cartão | Manter subgrupos identificáveis para diagnóstico, mesmo se ativados em uma audiência conjunta |
| Aquisição | Audiência digital comprada no Insights Hub Serasa | Aproximação mais externa possível dentro da política de mar fechado | App Afinz / fluxo de solicitação do cartão | Fonte Serasa deve permanecer separada de CRM e base proprietária |
| Rentabilização | Cartonistas Afinz | Levar ao App Afinz e influenciar ativação e uso do cartão | App Afinz, preferencialmente por deep link autenticado | Até existir evento pós-clique certificado, mídia é avaliada até clique/visita qualificada |
| Branding | Seguidores Afinz + lookalike da audiência comprada Serasa | Construir marca e apresentar a proposta Afinz/Vibe | Página de produto no site Afinz | Não tratar visita ao site como aquisição ou rentabilização |

## Função estratégica de Vibe

[[Vibe]] deve ser uma prova concreta da promessa de benefícios da Afinz, não apenas uma troca visual da campanha [[Copa-2026]]. A marca-mãe continua sendo Afinz; Vibe organiza o território de benefícios, engajamento e uso.

| Frente | Papel de Vibe | Mensagem a construir |
|---|---|---|
| Aquisição | Diferencial para pedir o cartão | Baixar o App Afinz, solicitar o cartão e acessar um ecossistema de benefícios |
| Rentabilização | Razão para voltar ao App e usar o cartão | Descobrir, ativar e usar benefícios disponíveis para cartonistas |
| Branding | Demonstração da proposta de valor | Afinz é mais que crédito: oferece benefícios que acompanham a vida do cliente |

Claims específicos, equivalência monetária de Vibes, condições de cupom, parceiros, validade e aplicativo necessário devem ser confirmados antes de publicação.

## Leitura do site Afinz em 04/08/2026

O site atual sustenta três territórios compatíveis com a entrada de Vibe:

1. **Marca:** “35 anos oferecendo soluções de A a Z” e “Afinz, juntos fazemos mais”.
2. **Produto:** “Muito mais que um cartão de crédito, benefícios que cuidam de você”.
3. **Uso:** cartão Visa internacional, App Afinz, Programa Você Bem e vantagens Visa.

### Destinos recomendados

- **Aquisição:** página `https://afinz.com.br/para-voce/cartao-de-credito/` ou deep link oficial de solicitação.
- **Rentabilização:** App Afinz/deep link da ação; evitar página institucional genérica quando a ação esperada ocorre no aplicativo.
- **Branding:** página de produto Afinz preparada para a narrativa Vibe.

### Pendências para a virada

- A home e a página do cartão ainda exibem Copa/Visa e precisam ser atualizadas antes de receber tráfego Vibe.
- A página do cartão já possui o território “benefícios que ninguém tem” e o Programa Você Bem. A entrada de Vibe deve explicar complementaridade para não criar competição ou confusão entre programas.
- A comunicação deve distinguir **App Afinz** de eventual **App Vibe** e declarar em qual deles cada ação acontece.
- Branding deve levar a uma página que explique produto e benefício; aquisição deve preservar CTA direto de solicitação.

## Mensuração por frente

### Aquisição

- KPI de negócio: proposta, aprovação e cartão quando a ligação com a origem estiver certificada.
- Drivers: clique, instalação, abertura do app, início e conclusão do fluxo.
- Cortes obrigatórios: origem da audiência, segmento de crédito, plataforma, campanha, adset e criativo.
- Proibição: CPA de plataforma não é CAC.

### Rentabilização

- KPI provisório: alcance na base, frequência, clique e visita qualificada/deep link aberto.
- KPI futuro: evento oficial de ativação ou uso, depois de certificado.
- Proibição: não inferir uso do cartão, receita ou rentabilidade a partir de clique.

### Branding

- KPI: alcance qualificado, frequência, CPM, visualização de vídeo e visita engajada à página de produto.
- Diagnósticos: crescimento de audiência própria, busca de marca e evolução de tráfego direto quando mensuráveis.
- Proibição: clique ou visita não equivalem a aquisição.

## Governança de audiência

- Registrar `audience_source`: `b2c_proprietaria`, `meio_funil`, `serasa_insights_hub`, `cartonistas`, `seguidores` ou `lookalike_serasa`.
- Registrar `credit_policy`: `mar_fechado` em toda campanha de aquisição.
- Manter Aprovados_nao_convertidos e Negados identificáveis no dado, mesmo quando a plataforma receber uma audiência combinada.
- Aplicar exclusões entre aquisição, rentabilização e branding para reduzir sobreposição e pressão.
- Preservar consentimento, opt-out, base legal, freshness e match rate de cada lista.

## Decisões ainda necessárias

1. Regra técnica e responsável pela certificação de mar fechado em cada origem.
2. Critérios de seleção e atualização da audiência comprada no Insights Hub Serasa.
3. Janela, proporção e política de expansão do lookalike Serasa para branding.
4. Mecânica comercial e claims aprovados de Vibe.
5. Página Vibe e deep links finais por frente.
6. Eventos oficiais de solicitação, ativação e uso.
7. Budget e metas separados para aquisição, rentabilização e branding.

## Relacionado

- [[Vibe]] · [[Ativacao-de-Audiencias-Diaria]] · [[Segmentos]] · [[Etapa-de-Aquisição]] · [[Anti-Overlap-Pressão-de-Contato]] · [[AppsFlyer-Tracking-CRM]] · [[Mídia-Paga]] · [[Objetivos-de-Campanha]] · [[Ontologia-v2]]
