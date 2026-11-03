---
tags: [estrategia, midia-paga, vibe, aquisicao, rentabilizacao, branding, seguros, plurix, handoff]
tipo: handoff-estrategico
camada: estrategia
atualizado: 2026-08-05
status: confirmado-com-pendencias
fonte: briefing-negocio-e-workbook
---

# Plano de Mídias Afinz/Vibe — Handoff consolidado

> [!important] Leitura para outro chat
> Esta é a nota canônica para continuar o Plano de Mídias Afinz/Vibe. Ler esta nota inteira antes de propor campanhas, orçamento, audiência, tracking, apresentação ou alteração do workbook.

## Objetivo do plano

Organizar a mídia Afinz em cinco frentes com objetivos, audiências, destinos e mensuração independentes:

1. **Performance/Aquisição** — gerar cartões emitidos com qualidade de carteira.
2. **Rentabilização** — levar cartonistas ao App Afinz e estimular uso do cartão por meio da proposta Vibe.
3. **Branding** — construir a associação Afinz + Vibe e gerar progressão rastreável.
4. **Seguros** — operar cross-sell fechado e validar venda digital na lojinha.
5. **Plurix** — gerar início de proposta no App +amigo, separado do B2C Afinz.

Vibe é a proposta de valor transversal de benefícios e relacionamento. Não deve ser tratada apenas como troca visual da comunicação Copa/Visa.

## Decisão central

Aquisição opera em **mar fechado**. Uma única campanha Meta de promoção do App Afinz contém grupos separados para base proprietária B2C, meio de funil e Serasa Insights Hub. Google Display atua como piloto apenas com audiências elegíveis disponíveis no Google. Search não integra Aquisição.

Branding combina dois papéis: a audiência Serasa exata recebe Brandformance orientado à visita qualificada na Landing Vibe; o lookalike Serasa recebe campanha Meta de Reconhecimento otimizada para **lembrança estimada do anúncio**. Google Search captura intenção de marca/produto e Google Display opera em whitelist contextual.

Rentabilização utiliza cartonistas Afinz em Meta e Google Display. Seguros utiliza audiência fechada em Meta e Display, enquanto Google Search pode operar em mar aberto exclusivamente para a lojinha. Search valida intenção e conversão na fase 1; Performance Max permanece em `Standby`, com investimento zero, como fase 2 condicionada ao tracking certificado. Plurix permanece separada e pausada até revisão de criativos e validação de `StartTrial`.

## Regras inegociáveis

- Elegibilidade de Crédito precede canal, segmentação, criativo, oferta, lance e budget.
- Aquisição não usa público aberto.
- `Targeting` deve restringir a entrega; `Observation` não atende ao mar fechado.
- Expansão de audiência e optimized targeting devem permanecer desligados nas campanhas restritas.
- Whitelist controla **onde** o anúncio aparece; audiência controla **quem** recebe.
- Não existe audiência Serasa Insights Hub disponível no Google neste plano.
- Visita à LP não torna uma pessoa elegível para Aquisição por si só.
- Base proprietária, aprovados, negados, Serasa, cartonistas e Plurix permanecem identificáveis na mensuração.
- CPA ou conversão de plataforma não são CAC.
- Dados ausentes não podem ser convertidos em zero.
- Exceções exigem Pablo Prado como aprovador, justificativa, evidência e validade.

## Arquitetura de campanhas

### Performance/Aquisição

#### Meta — campanha B2C única

`AFINZ_AQUISICAO_VIBE_META_PROMOCAO_APP_B2C_170826`

Grupos: `b2c_proprietaria`; `meio_funil_aprovados + meio_funil_negados`; `serasa_insights_hub`. Aprovados e negados podem ser ativados juntos, mas permanecem separados no dado.

Destino: App Afinz/fluxo de solicitação. KPI herói: cartão emitido. Evento técnico: `fb_mobile_complete_registration`. Rótulo no Meta: **Concluir inscrição**. A equivalência com cartão emitido depende de reconciliação com AppsFlyer e Core.

#### Google Display — piloto condicionado

`AFINZ_AQUISICAO_VIBE_GOOGLE_DISPLAY_MAR_FECHADO_170826`

- Audiências: base proprietária e meio de funil elegível disponível no Google.
- Não incluir Serasa Insights Hub.
- `Targeting` restritivo; optimized targeting e expansão desligados.
- Whitelist e exclusões aprovadas.
- Search de Aquisição removido.

#### Recuperação de proposta — Standby

`AFINZ_AQUISICAO_VIBE_META_APP_CARRINHO_PROPOSTA_STANDBY_DDMMYY`

Público: iniciou proposta e não emitiu cartão. Destino: deep link de retomada. Investimento atual: zero. Ativação condicionada à reconciliação entre `StartTrial`, conclusão e CRM.

### Branding e Brandformance

#### Meta — Brandformance Serasa exata

`AFINZ_BRANDING_VIBE_META_TRAFEGO_SERASA_EXATA_170826`

- Público: Serasa Insights Hub exata e autorizada.
- Objetivo: Tráfego; otimização para visualizações da página de destino.
- Destino: Landing Vibe dedicada.
- KPI herói: visita qualificada.
- Racional: maior probabilidade esperada de aprovação; hipótese a validar no Core.
- Papel: apresentar Vibe e criar progressão rastreável para App, proposta, aprovação e cartão.

#### Meta — lembrança de marca

`AFINZ_BRANDING_VIBE_META_LEMBRANCA_LOOKALIKE_SERASA_170826`

- Público: lookalike autorizado da audiência Serasa.
- Objetivo técnico: Reconhecimento.
- Meta de desempenho: maximizar lembrança do anúncio.
- KPI herói: lembrança estimada do anúncio.
- Apoios: alcance, frequência, CPM e saturação.
- Confiança: direcional.
- Não chamar a métrica modelada de Brand Lift ou incrementabilidade causal.

#### Google — intenção e contexto

- `AFINZ_BRANDING_VIBE_GOOGLE_SEARCH_INTENCAO_170826` — busca de marca, produto e benefícios para a Landing Vibe.
- `AFINZ_BRANDING_VIBE_GOOGLE_DISPLAY_WHITELIST_170826` — descoberta contextual em sites aprovados de cupons, cashback, benefícios e comparação.

Brandformance combina construção de marca e progressão mensurável. No plano Afinz, a campanha Serasa exata é o principal caso de Brandformance; a campanha lookalike é Branding orientado à lembrança.

### Rentabilização

- `AFINZ_RENTABILIZACAO_VIBE_META_TRAFEGO_APP_170826` — cartonistas, destino no App/deep link.
- `AFINZ_RENTABILIZACAO_VIBE_GOOGLE_DISPLAY_WHITELIST_170826` — Customer Match de cartonistas + whitelist.

Objetivo: levar cartonistas ao App e estimular uso pela proposta Vibe. KPI de negócio: uso certificado. Proxy: acesso qualificado ao App. Guardrails: frequência, opt-out, match rate e entrega fora da lista.

### Seguros

#### Cross-sell fechado

- `AFINZ_SEGUROS_META_LEADS_CARTONISTAS_FECHADO_170826` — cartonistas, leads.
- `AFINZ_SEGUROS_GOOGLE_DISPLAY_CARTONISTAS_FECHADO_WHITELIST_170826` — Customer Match de cartonistas + whitelist.
- `AFINZ_SEGUROS_META_VENDAS_SITE_ECOM_FECHADO_170826` — e-commerce futuro, base Afinz fechada e elegível.

#### Lojinha — fase 1

`AFINZ_SEGUROS_GOOGLE_SEARCH_LOJINHA_MAR_ABERTO_170826`

Mar aberto permitido exclusivamente para intenção de busca por seguros. Destino: lojinha/site e-commerce. Função: validar termos, oferta, páginas, checkout, compra e qualidade comercial.

#### Lojinha — fase 2

`AFINZ_SEGUROS_GOOGLE_PMAX_LOJINHA_MAR_ABERTO_STANDBY_DDMMYY`

- Tipo: Performance Max.
- Status: `Standby`.
- Investimento: `0%` / `R$ 0`.
- Função futura: escala multicanal.
- Gates: compra como conversão primária; receita/valor enviados; checkout validado; ativos completos; volume para aprendizado; URLs e exclusões aprovadas.
- PMax não é Search ampliado: distribui em múltiplos inventários Google.

### Plurix

`PLURIX_AQUISICAO_MAIS_AMIGO_META_STARTTRIAL_280826`

- Grupos: base própria e meio de funil Plurix.
- Destino: App +amigo.
- Evento: `StartTrial` = início de proposta.
- Status: pausada.
- Gate: revisão de criativos e validação do evento.
- Resultados e budget separados do B2C Afinz.

## Mensuração

| Frente | KPI herói | Proxy | Confiança/limite |
|---|---|---|---|
| Aquisição | Cartões emitidos | Início de proposta/clique para App | Confirmar após reconciliação AppsFlyer + plataformas + Core |
| Rentabilização | Cartonistas com uso certificado | Acesso qualificado ao App | Bloqueado até evento de uso certificado |
| Branding | Lembrança estimada + visitas qualificadas à LP | Alcance, frequência, clique para App | Direcional; sem Brand Lift ou causalidade |
| Seguros | Leads qualificados e vendas da lojinha | Lead/início de compra | Separar fechado, Search aberto e futura PMax |
| Plurix | Inícios de proposta | Instalação do App | Bloqueado até revisão de evento e criativos |

## Nomenclatura

- Campanhas, grupos e anúncios usam `_`, sem espaços.
- O anúncio termina com a data de criação.
- Padrão: `MARCA_FRENTE_TEMA_PLATAFORMA_OBJETIVO_PUBLICO_DATA`.
- Itens sem data usam `DDMMYY`.

## Itens em Standby

- Recuperação/carrinho de proposta B2C.
- Performance Max da lojinha de Seguros — investimento zero.
- Criteo.
- DV360.

## Workbook de referência

Arquivo mais recente validado:

`C:\Users\Pablo Prado\OneDrive\Área de Trabalho\PROJETOS IA\ACALENDARIO APP\outputs\019fcf91-e8dd-7e00-b9e1-a93df03cf30e\Plano_de_Midias_Afinz_Vibe_v5.xlsx`

Abas: `00_Resumo_Estrategico`; `01_Plano_de_Midias`; `02_Audiencias_e_Grupos`; `03_Mensuracao_e_QA`; `04_Roteiro_PPT`.

O budget e a distribuição preenchidos pertencem ao usuário. Não redistribuir ou inventar investimento sem solicitação.

## Próximas validações

1. Direito de uso e ativação da Serasa e do lookalike.
2. Eventos e destinos definitivos, incluindo deep links.
3. Reconciliação de `fb_mobile_complete_registration` com cartão emitido no Core.
4. Evento certificado de uso para Rentabilização.
5. Compra, receita e checkout da lojinha de Seguros.
6. Criativos, claims Vibe e validades.
7. Match rate e entrega fora da lista em campanhas fechadas.
8. Volume necessário antes de liberar PMax.

## Relacionado

- [[Estrategia-Multicanal-Vibe-Mar-Fechado]]
- [[Vibe]]
- [[Ativacao-de-Audiencias-Diaria]]
- [[Mídia-Paga]]
- [[Objetivos-de-Campanha]]
- [[AppsFlyer-Tracking-CRM]]
- [[Anti-Overlap-Pressão-de-Contato]]
- [[Ontologia-v2]]
