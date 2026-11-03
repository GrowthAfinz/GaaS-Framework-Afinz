---
tags: [evolucao, gaas, comunicacoes, template, ux, governanca]
tipo: evolucao
camada: evolucao
atualizado: 2026-07-15
status: implementado
fonte: produto-e-codigo
---

# Performance do Conteúdo no GaaS

**Definição:** camada de navegação, comparação e diagnóstico das peças de CRM em **Comunicações → Performance do Conteúdo**, conectando criativo, Template ID, Activity Name, segmento, jornada e resultado.

## Avanços entregues em 2026-07-15

### Navegação orientada à peça
- A **Galeria** passou a ser a aba inicial.
- Visão Geral e Tabela continuam disponíveis para síntese e análise tabular.
- A seleção de **segmento** acontece antes da exibição das peças, com nome normalizado e etapa do funil ao lado.
- Filtros por canal, busca e segmento trabalham sobre o mesmo recorte.
- **Rascunhos ficam ocultos por padrão** e aparecem apenas quando o operador liga o controle.

### Inteligência acionável
- Inclusão de uma caixa compacta de **insight e sugestão de análise**.
- Cards mantêm score, abertura, CTR, cartões e CAC estimado, com diagnóstico visual do principal gargalo.
- A visão geral prioriza peça campeã e ações sugeridas; o detalhe permite aprofundar score, funil e evolução.

### Tradução visual do Template ID
Quando a peça é nomeada diretamente pelo identificador, o produto prioriza chips legíveis sem alterar a identidade canônica:

- `b2c_email_copa_bsp_S3D01` → **B2C · E-mail · Copa · Base Proprietária · Semana 3 · Disparo 1**
- `b2c_wpp_copa_ngd_D3` → **B2C · WhatsApp · Copa · Negados · Disparo 3**

A regra foi aplicada nos pontos em que a leitura rápida é mais importante: galeria, tabela, ranking, peça campeã, ações sugeridas e modal de detalhe. O código original continua acessível como referência técnica.

### Modal de detalhe
- Overlay elevado acima do cabeçalho global, eliminando a sobreposição visual com o GaaS.
- Área útil ampliada para preview e indicadores.
- Botão de fechar movido para uma posição previsível no canto superior direito.
- Cabeçalho de identidade mais estável, priorizando chips e contexto da peça.

## Correção da inteligência de match

O matcher passou a aplicar **compatibilidade estrutural antes do score de similaridade**:

1. Extrai público/BU do Activity Name, jornada e Template ID.
2. Dá precedência aos sinais `bb`, `bbt`, `b2b2c` e `crm` sobre tokens genéricos de campanha.
3. Rejeita candidatos de identidade incompatível antes de calcular ou exibir a sugestão.
4. Mantém a justificativa do match visível para validação humana.

Isso impede que campanhas do Banco do Brasil/B2B2C, cujo `CRM` pertence a esse universo, sejam interpretadas como disparos B2C apenas por compartilharem canal, campanha ou ordem.

## Auditoria da base

Foi encontrado e corrigido um vínculo cruzado:

- Activity Name: `afz_car_bbt_aqs_email_bsp_disp1s2copa_pontual`
- vínculo incorreto: `b2c_email_copa_bsp_S2D01`
- vínculo corrigido: `bb_email_copa_crm_S2D01`

Após a correção, a validação não encontrou outros cruzamentos **BB/B2B2C × B2C** no recorte auditado.

## Evidência de implementação
- `40f3efb` — aprofundamento do matcher e correção do vínculo na base.
- `6244d37` — tradução visual do Template ID e correções do modal.
- Alterações publicadas na `main`, com build da aplicação e do GitHub Pages validados.

## Próximos avanços recomendados
- [ ] Criar monitor recorrente de incompatibilidades estruturais entre Activity Name, jornada e Template ID.
- [ ] Exibir quantidade de peças sem vínculo por segmento, evitando que um segmento desapareça silenciosamente da seleção.
- [ ] Criar fila de templates ativos sem preview/criativo vinculado.
- [ ] Medir uso de Galeria, Visão Geral, Tabela, filtros e abertura do detalhe.
- [ ] Evoluir o insight para comparar cada peça com pares do mesmo segmento, etapa de funil e canal.

## Relacionado
- [[Galeria-de-Templates]] · [[Template]] · [[Taxonomia-Activity-Name]] · [[Eficiência-de-Criativo]] · [[Decisões-Tomadas]]
