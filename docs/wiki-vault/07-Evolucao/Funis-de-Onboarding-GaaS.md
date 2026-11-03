---
tags: [funil, onboarding, serasa, app, midia-paga, gaas]
tipo: evolucao
camada: produto
atualizado: 2026-07-22
status: confirmado
fonte: codigo-gaas-e-validacao-operador
---

# Funis de Onboarding GaaS

## Estado atual

A aba **Análise → Funil de Aquisição** virou uma central com três leituras independentes:

1. **Funil Onboarding - Apps** — visão padrão e primeira opção; lê App completo, B2C + B2B2C e Plurix.
2. **Funil Onboarding - Serasa** — originação via API Serasa.
3. **Funil Onboarding - Mídia Paga** — campanhas B2C de App Install e StartTrial atribuído pela Meta.

As fontes não são somadas como se fossem um único funil causal. Cada visão preserva população, janela, granularidade e confiança próprias.

## Padrão visual validado

- referência técnica próxima de Excel/Power BI, com alta densidade e pouca ornamentação;
- cabeçalho contextual integrado ao seletor de funil;
- Funil completo antes da Evolução do funil;
- gráfico combinado com barras de volume e linhas de taxas no mesmo eixo temporal;
- Diária como abertura padrão, com Semanal e Mensal dentro do módulo;
- seletores retos e compactos para Volumes e Taxas;
- até quatro linhas de taxa simultâneas;
- gráfico continua exibindo taxas quando todos os volumes são removidos;
- linhas sem animação, com alto contraste e pontos vazados;
- detalhe diário com data, dia da semana, variação D-1, destaque de desvios, ordenação e exportação;
- ausência permanece vazia e nunca vira zero silenciosamente.

## Funil Apps

Fonte atual: snapshot TSV derivado do histórico manual do App Afinz.

Etapas disponíveis:

`Digitação CPF → Início onboarding → Geolocalização → Fotos documento → Biometria → Endereço → Personalização → Assinatura → Cartão concluído`

Recortes:

- **Funil Completo**: população total quando existe medida total certificada;
- **B2C + B2B2C**: `MARC_PLURIX = NAO`;
- **Plurix**: `MARC_PLURIX = SIM`.

Limite confirmado: a fonte separa Plurix do restante, mas não separa B2C de B2B2C. A medida `APROVADO` da etapa 1 foi excluída porque superava a entrada e não era compatível com a sequência. Para os recortes sem denominador, a taxa é omitida.

## Funil Serasa

Leitura operacional da API Serasa com volumes, taxas compatíveis e detalhe diário. O título canônico na interface é **API Serasa - Funil de Aquisição**.

APP e total conciliado permanecem fora dessa visão enquanto não houver correlação diária certificada entre fontes.

## Funil Mídia Paga

Escopo: família B2C App Install, preservando a atribuição Meta por fase.

Funil de decisão certificado:

`Impressão → Clique no link → Instalação → Sessão no app → App aberto/checkout → StartTrial atribuído`

As campanhas equivalentes de App Install podem compor topo e meio quando pertencem à mesma família de objetivo. StartTrial só aparece quando a campanha realmente retorna o indicador certificado.

Métricas de eficiência adicionadas: investimento, CPI e custo por início de proposta. Nunca chamar CPA de plataforma de CAC de cartão.

## Regra de leitura

- confirmado: evento, fórmula, janela e fonte reconciliados;
- direcional: leitura útil, mas com cobertura ou semântica ainda limitada;
- bloqueado: não usar em decisão até instrumentação ou fonte produtiva existir.

## Próximos passos

- substituir o snapshot do App por ingestão governada e recorrente;
- obter AppsFlyer como fonte do StartTrial total, onboarding concluído, split pago/orgânico e SubmitApplication;
- instrumentar `Card order completed` / SubmitApplication para fechar o fundo do funil;
- criar síntese Growth apenas com sinais comparáveis, mantendo drill para os três funis.

## Relacionado

- [[Funil-Onboarding-Arquitetura-e-Ingestao]]
- [[MOC-Midia-Paga]]
- [[Decisões-Tomadas]]
- [Handoff Codex-Claude](../09-Inteligencia-IA/Handoff-Codex-Claude-Funil-Meta.txt)

