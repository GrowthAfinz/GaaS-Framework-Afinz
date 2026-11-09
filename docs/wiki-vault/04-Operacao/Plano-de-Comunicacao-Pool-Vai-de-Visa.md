---
title: "Plano de Comunicação do Pool de Ofertas Visa"
tags: [operacao, fabrica-de-emails, plano-de-comunicacao, vai-de-visa, rentabilizacao, black-friday, ficha-de-produto]
tipo: operacao
camada: operacao
dominio: rentabilizacao
aliases: [Plano de Comunicação Vai de Visa, Plano VDV, Estratégia editorial Vai de Visa, Ficha de Produto Vai de Visa]
atualizado: 2026-11-09
status: a-validar
fonte: "estratégia Pool_de_Ofertas_Vai_de_Visa_Estrategia.pdf (operação, 03/11/2026); aba Estratégia de Ativação da spec da gestora; linha TEMA_BF26_V1 da carga BF26; código da Fábrica em origin/main (PR 76); consulta ao Supabase em 05/11/2026"
---

# Plano de comunicação do Pool Vai de Visa · revisão de 09/11

A comunicação apresenta as ofertas selecionadas para cada grupo, com benefício, forma de resgate, vigência e condições por marca. V1 e V2 compartilham catálogo e regra de seleção, com variação do hero e do envelope.

## Toques e experiência

V1 usa hero persona em B2C e V2 usa o cartão no respectivo toque. Parceiro B2B2C com arte usa sua arte; sem arte, fallback V2 da regra documentada. Até três ofertas válidas, com até seis candidatas para reservas. Primeiro card centralizado quando ímpar no desktop; mobile empilhado. Quatro cards é futuro.

O papel editorial de cada toque não define um schedule: a cadência recorrente provavelmente 2x/semana, dias e alternância V1/V2 continuam pendentes em 09/11. O intervalo 3–5 dias do desenho de 06/11 não deve ser executado como regra recorrente atual sem decisão. Nenhuma Send Activity faz parte da PREPARAÇÃO.

## Conteúdo e contrato do motor

TEMA/HERO ficam no BRIEFING de 41 colunas. Rodada do POOL e versão do tema são distintas. APTOS traz rodada em ID_VERSAO_OFERTAS; o motor precisa resolver VERSAO_TEMA antes de buscar envelope/hero. Fábrica/exportador/template ainda requerem adaptação, e Test Send do motor novo não foi comprovado. A carga relatada do briefing não é validação de toda renderização.

NM_CARTAO NULL exige fallback de cartão sem inferir ORIGEM; NM_PARCEIRO ambíguo exige fallback e validação comercial. V2 herda assunto/preheader do V1 quando vazio na lógica anterior; verificar na adaptação. Nome vazio usa saudação própria. Não adicionar GRUPO_2/SAFRA ao catálogo.

## Diretrizes e aceite

| Parte | Intenção | Conferência |
|---|---|---|
| Abertura | Explicar seleção de vantagens para usar com o cartão | Texto coerente com grupo/célula e sem promessas sem fonte |
| Cards | Marca, benefício, resgate e vigência compreensíveis | Link, cupom/“Pague com Visa”, reserva e condições corretos |
| Hero | Identidade do toque e do parceiro | V1/V2, parceiro único, sem arte e nome ausente na seedlist |
| Resultado | Avaliar compra e uso, com exposição reconciliada | SAFRA completa + envios reais + JobID/rodada e fonte IN |

Não dizer “exclusivas da Afinz”, não prometer “até 40 dias para pagar”, não citar oferta fora da vigência e manter legal de bebida quando aplicável. O limite ≥R$200 é de audiência; não representa filtro por preço de cada card.

O plano anterior, textos de assunto e cadastro da Fábrica ficam no histórico abaixo, datados e sem selo de adaptação ao POOL novo. [[Estrategia-Pool-de-Ofertas-Visa]] · [[Emails-Dinamicos-Vai-de-Visa]] · [[Rotacao-de-Ofertas-Vai-de-Visa]].



## 3. Canais e política de seleção

E-mail, WhatsApp e SMS são canais principais da estratégia. O piloto separa parcelas sem sobreposição: cada CPF recebe no máximo um canal do Pool na mesma rodada. SEG-C e GEN-C ficam sem comunicação nos três canais. A alocação de grupo/célula permanece congelada na SAFRA; GEN-A usa a vitrine genérica, mas não representa comparação causal direta com SEG-B de outra população.

| Canal | Aptidão própria | Destino | Teto por rodada de envio |
|---|---|---|---|
| E-mail | Endereço disponível, sem bloqueio de e-mail, supressões/publication list e status de assinante conferidos | Links de oferta; CTAs finais a conferir | Orçamento e capacidade a definir |
| WhatsApp | Contato móvel, bloqueios/supressões próprios liberados e uso do app nos últimos 60 dias | LP personalizada da rodada | Até 5.000 mensagens |
| SMS | Contato móvel, bloqueios/supressões próprios liberados e uso do app nos últimos 60 dias | LP personalizada da rodada | Até 100.000 SMS |

Os tetos valem por rodada, sujeitos à elegibilidade e ao orçamento. Não são metas nem limites semanais. No SMS, destinatários, tentativas, reenvios e unidades faturadas/segmentos podem divergir: registrar cada unidade separadamente.

ULTIMO_ACESSO da CLIENTES ATIVOS é a referência de uso do app para os dois canais móveis. Normalizar a data para America/Sao_Paulo e comparar de hoje menos 60 dias até hoje, inclusive. Data inválida, ausente ou futura impede apenas a seleção móvel. O participante permanece na SAFRA e pode receber e-mail se elegível. DEVICE, modelo de aparelho e data de cadastro/importação não entram nesta regra. Usar o app não comprova uso de WhatsApp.

Permissões de uso/consentimentos dos canais foram confirmadas na definição do piloto. A execução continua respeitando os bloqueios e as supressões próprios: bloqueio de e-mail não é bloqueio de celular, e a consulta _Subscribers não pode excluir toda a audiência móvel.

:::details Sorteio, perfis e parâmetros pendentes
Sortear dentro de perfis relevantes, com grupo/célula, B2C/B2B2C e recência quando a fonte permitir. Aplicar a mesma política e probabilidade a SEG-A e SEG-B. Não priorizar maiores compradores no WhatsApp e interpretar o SMS residual como efeito do canal.

Pesos, cotas por perfil, tamanho da amostra, poder estatístico e pressão por pessoa seguem em aberto. O contrato usa ID_POLITICA_CANAL e ID_RODADA para identificar a regra; sem parâmetros aprovados, a simulação retorna “parâmetros pendentes” e não produz audiência. O módulo de simulação do GaaS não executa seleção no SFMC.

Evitar redistribuir silenciosamente participantes inelegíveis para preencher teto. Guardar a política, elegibilidade e contagens de cada perfil para interpretar diferenças de cobertura. A seleção de um CPF em um canal exclui os outros naquela rodada; rodadas futuras precisam respeitar a política de pressão ainda a definir.
:::

## 4. Experiência da LP dinâmica

WhatsApp e SMS levam à LP personalizada da rodada, baseada no layout Black Afinz de referência: https://cloud.relacionamento.afinz.com.br/blackafinz-v2. O banner da campanha é independente do hero do e-mail. A arte fixa pode ser usada inicialmente; URLs finais de imagem ainda precisam ser fornecidas.

A LP resolve a participação por ID_ENVIO opaco, sem CPF na URL, e preserva a rodada do link. Grupo e célula vêm da SAFRA no servidor, nunca de um grupo livre enviado pela URL. APTOS é sobrescrita e não pode ser a única origem de links antigos. O token de participação não identifica sozinho cada acesso ou disparo.

POOL define seleção/ordem; BRIEFING fornece benefício, foto, vigência, resgate e condições. SEG-A usa afinidade; SEG-B e GEN-A usam GENERICO. Inicialmente são três cards, com reservas entre seis candidatas. A cada acesso, revalidar atividade/vigência, compactar válidas e usar reservas. Link antigo mantém a rodada: não trocar silenciosamente para uma seleção nova.

Exibir cupom somente quando aplicável, validade real, condições consultáveis e CTA de resgate. Visita à LP, clique de oferta e compra são eventos distintos. CPF e token não entram em GTM/GA4, dataLayer ou parâmetros de eventos. Controles não recebem os links de comunicação do Pool.

:::details Prévia integrada ao editor e pendências de CloudPages
O editor do Pool inclui prévia da LP, usando grupo/célula/data da amostra, rodada e desktop/mobile. Aceita CSV de nove colunas do POOL para conferir seleção e tema separadamente; a importação é local à prévia, sem alterar o contrato de seis colunas persistido pela Fábrica. O banner fica sinalizado como asset pendente até receber uma URL.

A prévia revalida ofertas e reservas com HTML escapado, links HTTPS e sem scripts de analytics. Ela é uma referência de conteúdo/layout, não uma CloudPage publicada. Ainda aplicar no SFMC: resolução segura de token+rodada, leitura da SAFRA/POOL/BRIEFING, supressões, assets, rastreio e testes reais. O shell HTML da página de marketing, isoladamente, não contém esse contrato dinâmico.
:::

### Medição, custos e ampliação de volume

Registrar por rodada/canal: participantes elegíveis, selecionados, destinatários previstos, mensagens previstas, destinatários efetivos, mensagens/tentativas realizadas, segmentos faturados de SMS, custo previsto e realizado. Preços unitários e orçamento ficam como parâmetros pendentes, sem estimativa inventada.

Acompanhar entrega, tráfego qualificado na LP/oferta, respostas quando cobertas, compras por fonte conciliada e custo. Clique ou volume enviado não comprovam incremento ou ROI. Comparar A/B dentro do mesmo grupo e política de canal; analisar desequilíbrio de exposição e perfis antes de atribuir efeito ao canal.

Há histórico individual de entregas/cliques/respostas de WhatsApp/SMS segundo a definição do piloto. Localização, cobertura e confiabilidade serão investigadas depois; isso não bloqueia o início do piloto e não significa integração pronta. Para a execução inicial, registrar os comprovantes disponíveis por rodada/canal e explicitar sua cobertura.

:::details Histórico anterior a 09/11 · não executar como instrução vigente
### Plano de Comunicação do Pool de Ofertas Visa

**Definição e propósito:** reúne num só lugar o que a aba **Plano de Comunicação** da [[Fabrica-de-Emails-GaaS|Fábrica de E-mails]] precisa saber para planejar a régua do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Pool de Ofertas - Vai de Visa]]: a estratégia da régua, o papel de cada e-mail, a Ficha de Produto, as regras do que pode ser dito e onde ficam os dados que alimentam cada campo. É o ponto de partida para quem vai construir ou preencher essa aba (pessoa ou IA).

> **Status por parte:** onde está cada dado e o estado do GaaS = `confirmado` (código e banco conferidos em 05/11/2026). Estratégia da régua, objetivo e teste = `confirmado` pelas fontes da iniciativa. Os textos do plano por e-mail, a Ficha de Produto e as regras abaixo são **proposta derivada das fontes**, marcada campo a campo, e precisam da validação da operação antes de virar cadastro.

### Por que esta nota existe

O vault já explica a operação do Pool com bastante detalhe (base, grupos, teste, DEs, template). O que faltava era a camada editorial: **o que cada e-mail precisa fazer e com qual argumento**. Sem isso a aba Plano de Comunicação fica vazia para o Pool, porque ela só mostra um produto quando existe pelo menos um plano de e-mail cadastrado para ele. Em 05/11/2026 a régua do Pool já aparece na caixa de e-mails (Rentabilização › Pool de Ofertas Visa › Black Friday), mas não tem régua, plano por e-mail nem Ficha de Produto no banco.

### Mapa de fontes (onde cada coisa já está)

| Assunto | Onde está | Observação |
|---|---|---|
| Objetivo, frentes, fases, base elegível, números | [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] | 130.175 CPFs aptos na fase 1 (03/11/2026) |
| Desenho do teste (SEG-A, SEG-B, GEN-A, controle), KPIs, janelas | [[Teste-Afinidade-MCC-vs-Generico]] | fonte: aba "Estratégia de Ativação" da spec da gestora |
| Categoria de compra e grupos de afinidade | [[MCC]] · [[DE-MAPA_MCC]] · [[DE-VDV_APTOS]] | grupo e célula ficam congelados por safra em [[DE-VDV_ENVIO]] |
| Automação que prepara a base | [[Automacao-VDV-Pool-de-Ofertas]] | SQL e ordem dos passos |
| Template, regras do e-mail, histórico de versões do layout | [[Emails-Dinamicos-Vai-de-Visa]] | V1 persona e V2 cartão, mesmo template |
| Catálogo, tema e heros (41 colunas) | [[DE-BRIEFING_OFERTAS_VISA]] | `TIPO` = OFERTA, TEMA ou HERO |
| Vitrine por versão, grupo, célula e posição | [[DE-MOVIMENTO_OFERTAS_VISA]] | o que cada grupo viu, base da medição |
| Produto e benefícios do cartão | [[Cartao-Afinz-Visa]] · [[Beneficios-e-Vigencia]] · [[Pode-Dizer-Nao-Pode-Dizer]] | Vai de Visa aparece como benefício da bandeira |
| Como escrever a Ficha de Produto | [[Ficha-de-Produto-Guia]] | regras de redação que a IA segue |
| Mecânica de rentabilização e como medir | [[Incentivo-ao-Uso]] | Pool Visa é variante dessa mecânica |

**Arquivos locais do operador** (não versionados no vault, só referência de origem): `Pool_de_Ofertas_Vai_de_Visa_Estrategia.pdf` e a versão para o time, `Exemplos_de_ofertas_Vai_de_Visa_Estrutura_de_campanhas.xlsx` (catálogo Visa + abas da gestora), `Ofertas_novembro_2_VDV_2.xlsx` (fonte da carga BF26), `SPEC_CODEX_Fabrica_Vai_de_Visa.md` (spec da entrega 1).

### Estado no GaaS (05/11/2026, conferido no banco)

| O quê | Onde | Valor |
|---|---|---|
| Catálogo, tema e heros da BF26 | `dynamic_email_vdv_briefing` | 89 linhas: 66 ofertas (60 ativas), 1 tema, 22 heros |
| Vitrine BF26_V1 | `dynamic_email_vdv_movimento` | 16 linhas (4 grupos, posições 1 a 4) |
| Os dois e-mails da régua | `dynamic_email_briefings`, com `briefing_data.__editor.kind = 'vdv'` | E-mail 1 · persona (V1) e E-mail 2 · cartão (V2), `partner = 'Afinz Visa'`, `segment = 'Pool de Ofertas Visa'`, `week_key = 'Black Friday'` |
| Template-fonte | `dynamic_email_template_slots` | `builtin-vdv-pool` (vigente); `builtin-vdv-v1` e `builtin-vdv-v2` ficam como histórico |
| Salvar conteúdo + e-mail juntos | função `save_vdv_factory` | uma transação, com controle de versão |
| Estratégia da régua | `dynamic_email_ruler_strategies` | **nenhuma** para o Pool (as 8 existentes são de Aquisição) |
| Plano por e-mail | `dynamic_email_email_strategies` | **nenhum** (os 53 existentes são de Bem Barato, Dia, Institucional B2C e Plurix) |
| Ficha de Produto e regras | `dynamic_email_product_contexts` e `dynamic_email_product_guardrails` | **nenhuma** (só existe a do +amigo) |

Migrations aplicadas em produção em 05/11/2026: `20261105211607_dynamic_email_vai_de_visa` e `20261105222653_vdv_native_factory`.

> **Vigente no template da Fábrica:** o e-mail mostra **até 3 ofertas válidas** e lê até 6 posições da vitrine; a partir da 4ª, as posições funcionam como reserva quando uma oferta vence ou fica inativa. Notas mais antigas falam em 4 ou 6 cards; vale o template.

### Como a aba Plano de Comunicação guarda os dados

A aba lê três tabelas e liga tudo ao e-mail pela chave `campaign_group_id`:

1. **Régua** (`dynamic_email_ruler_strategies`): nome, descrição, frente (`business_front`, que aceita `acquisition` e `monetization`), família e tipo de jornada, objetivo, público, estágio, transformação narrativa, objeções, intensidade comercial e critério de sucesso.
2. **Plano por e-mail** (`dynamic_email_email_strategies`): as 11 diretrizes da ficha (papel na régua, objetivo, objeção trabalhada, mensagem-chave, proposta de valor, benefício principal, benefícios complementares, prova, ação esperada, estratégia de CTAs, hierarquia visual), mais nome funcional, assunto e pré-cabeçalho planejados, estados e proveniência por campo.
3. **Ficha de Produto e regras** (`dynamic_email_product_contexts` + `dynamic_email_product_guardrails`): proposta de valor, diferenciais, público, tom, contexto de marca e a lista de benefícios e regras com severidade e status de citação.

As pílulas de produto do topo saem do campo `partner` dos planos por e-mail. Para o Pool aparecer, o plano precisa usar o mesmo parceiro dos e-mails (`Afinz Visa`).

**Granularidade no Pool:** a unidade editorial é o toque (E-mail 1 e E-mail 2) dentro da campanha (Black Friday). Tema, heros, vitrine e catálogo são compartilhados entre os dois toques, então o plano descreve a intenção do toque e a Ficha descreve o produto; nenhum dos dois deve repetir as 89 linhas de conteúdo.

### Planejado × executado no Pool

A comparação atual da aba foi feita para o contrato de Aquisição (mensagem-chave × `ASSUNTO`, objetivo × `PRE_CABECALHO`, benefício × `COPY_1_PRETO`, CTA × `TITULO_CTA`/`LINK_CTA`). No Pool, os campos "executados" vêm do tema da versão e da vitrine:

| Diretriz do plano | Campo executado no Pool | De onde vem |
|---|---|---|
| Mensagem-chave | assunto do toque | `ASSUNTO` (V1) ou `ASSUNTO_V2`, que herda o do V1 quando vazio |
| Objetivo do e-mail | pré-cabeçalho do toque | `PREHEADER` ou `PREHEADER_V2` |
| Benefício principal | abertura + cards | `INTRO` do tema e as ofertas resolvidas na amostra |
| Estratégia de CTAs | botão e links dos cards | `CTA` do tema e `LINK` de cada oferta (alias por marca e posição) |
| Hierarquia visual | hero do toque | hero V1 (persona), V2 (cartão) ou do parceiro |

### Estratégia da régua (proposta para `dynamic_email_ruler_strategies`)

| Campo | Proposta | Base |
|---|---|---|
| Nome | Pool de Ofertas Visa | nome da régua na caixa da Fábrica |
| Frente | `monetization` (Rentabilização) | iniciativa |
| Família / tipo de jornada | Rentabilização / Pool de Ofertas Visa | árvore da Fábrica |
| Objetivo | aumentar o uso do cartão Afinz Visa em compras de parceiros da bandeira, não vender cartão novo | iniciativa e PDF de estratégia |
| Público | clientes Afinz Visa B2C e B2B2C ativos (compra nos últimos 30 dias), conta NORMAL, limite disponível a partir de R$ 200 e e-mail liberado; fase 1 com 130.175 CPFs | iniciativa |
| Estágio | cliente ativo, pós-aquisição | iniciativa |
| Transformação narrativa | de "tenho o cartão" para "uso o cartão Afinz Visa quando tem vantagem nas marcas que eu já compro" | proposta |
| Objeções | "essas ofertas não são para mim"; "não sei como usar o cupom"; "já tenho outro cartão para essas compras" | proposta |
| Intensidade comercial | média: vitrine de ofertas com prazo (Black Friday até 30/11), sem pressão de crédito | proposta |
| Critério de sucesso | conversão em compra na oferta ou na categoria até 30 dias, comparada ao controle; ganho da personalização = SEG-A menos SEG-B por grupo. Abertura e clique são diagnóstico | [[Teste-Afinidade-MCC-vs-Generico]] |

### Plano por e-mail da campanha Black Friday (proposta)

Legenda de proveniência: **[C]** confirmado na carga ou nas decisões; **[P]** proposta derivada, a validar.

| Diretriz | E-mail 1 · persona (V1) | E-mail 2 · cartão (V2) |
|---|---|---|
| Papel na régua | [P] abrir a safra com a vitrine de ofertas do grupo do cliente | [P] reforço dias depois, trazendo o cartão para o centro e a mesma vitrine |
| Objetivo do e-mail | [P] gerar o primeiro clique numa oferta e a compra com o cartão | [P] converter quem não usou a oferta no primeiro toque |
| Objeção trabalhada | [P] "essas ofertas não são para mim" (resposta: vitrine escolhida pela categoria em que o cliente compra) | [P] "vou deixar para depois" (resposta: prazo da Black Friday e cupom pronto) |
| Mensagem-chave | [C] assunto: "Ofertas Black Afinz 2026 do seu {CARTAO}! 💳💙" | [C] herda o assunto do V1 enquanto `ASSUNTO_V2` estiver vazio; [P] diferenciar para o cartão |
| Proposta de valor | [P] desconto em marcas parceiras da Visa pagando com o cartão Afinz Visa | igual ao V1 |
| Benefício principal | [P] até 3 ofertas selecionadas para o perfil de compra do cliente, com cupom ou condição de pagamento com Visa | igual ao V1 |
| Benefícios complementares | [C] cupom pronto no card; validade de cada oferta; ofertas filtradas pelo limite do cliente (regra da base) | igual ao V1 |
| Prova ou sustentação | [C] cards com marca, valor do desconto, complemento e cupom; bloco "Condições das ofertas" com as regras de cada parceiro | igual ao V1 |
| Ação esperada | [C] clicar em "Aproveitar oferta" e comprar com o cartão Afinz Visa | igual ao V1 |
| Estratégia de CTAs | [C] um botão por card, com link rastreado por versão, toque, grupo, posição e oferta | igual ao V1 |
| Hierarquia visual | [C] hero persona (ou o do parceiro B2B2C) → saudação com nome → abertura → grade de cards (o primeiro centralizado quando o número é ímpar) → condições | [C] hero cartão (ou o do parceiro) → mesma sequência |

Pré-cabeçalho planejado dos dois toques **[C]**: "Confira as ofertas exclusivas que selecionamos para você!" (ver a regra sobre "exclusivas" abaixo).

**Regra de hero [C]:** B2C recebe V1 no e-mail 1 e V2 no e-mail 2; B2B2C com arte cadastrada recebe a arte do parceiro nos dois; B2B2C sem arte recebe o V2 nos dois.

### Ficha de Produto (proposta para `dynamic_email_product_contexts`)

Seguir o [[Ficha-de-Produto-Guia]]. Proposta de conteúdo:

- **Produto:** Pool de Ofertas Vai de Visa · **Parceiro:** `Afinz Visa` (igual ao dos e-mails, para a pílula aparecer).
- **Proposta de valor:** ofertas de marcas parceiras da Visa (desconto, cupom ou condição pagando com Visa), escolhidas pela categoria em que o cliente costuma comprar e filtradas pelo limite disponível, para usar com o cartão Afinz Visa.
- **Diferenciais:** vitrine personalizada por afinidade de compra · campanha perene, com tema novo a cada safra (Black Friday, Natal, Copa) · ofertas do catálogo oficial Vai de Visa.
- **Público elegível:** ver a régua; fase 2 prevê Plurix / Cartonistas ([[Publico-Cartonistas]]).
- **Tom:** o da marca Afinz (próximo, "100% a fim de te ver bem"), com foco em vantagem prática e prazo, sem urgência agressiva.
- **Contexto de marca:** o catálogo é da bandeira Visa (programa Vai de Visa), não da Afinz; a Afinz seleciona e entrega as ofertas para os seus clientes. Black Friday aparece como "Black Afinz" no tema da BF26.

### Regras do que pode ser dito (proposta para `dynamic_email_product_guardrails`)

| Tipo | Regra | Severidade proposta | Evidência |
|---|---|---|---|
| Alegação | Não dizer que as ofertas são da Afinz ou exclusivas da Afinz: o catálogo é da Visa e vale para portadores Visa. "Exclusivas" (do pré-cabeçalho atual) só no sentido de "selecionadas para você"; revisar a palavra | requer revisão | aba Orientações do catálogo Visa |
| Legal | Ofertas e cupons são de responsabilidade de cada parceiro, sujeitos a disponibilidade e às regras de cada loja (rodapé obrigatório) | bloqueia | `RODAPE_CONDICOES` da BF26 e aba Orientações do catálogo |
| Legal | Oferta de bebida alcoólica leva "Venda proibida para menores de 18 anos. Beba com moderação." (ex.: Evino) | bloqueia | condições da oferta `NOV26_EVINO` |
| Elegibilidade | Não prometer oferta a quem não tem limite: a base exige limite disponível a partir de R$ 200 | bloqueia | regra da base |
| Alegação | Não citar valor ou cupom fora da vigência da oferta (`INICIO`/`FIM`); oferta vencida não aparece | bloqueia | regra do template |
| Tom | Ofertas "Só com Visa" sem cupom usam "Pague com Visa" como forma de resgate (ex.: Movida) | orientação | `RESGATE = PAGAR_COM_VISA` |
| Alegação | Não usar "até 40 dias para pagar" | bloqueia | [[Cartao-Afinz-Visa]] |
| Visual | O nome do cartão segue a ordem: correção do hero do parceiro, depois `NM_CARTAO`, depois "cartão Afinz Visa" | orientação | regra do template |

### Lacunas e pendências

- Plano por e-mail, Ficha e regras desta nota são proposta → precisam de validação para virar cadastro → operação.
- Intervalo entre o E-mail 1 e o E-mail 2 e se o V2 vai só para quem não clicou → define o papel do V2 → operação, na criação da jornada.
- `ASSUNTO_V2` e `PREHEADER_V2` vazios na BF26 → o V2 repete o envelope do V1 → decidir se o reforço ganha assunto próprio → operação.
- A aba Plano de Comunicação compara o executado com colunas de Aquisição → no Pool a comparação precisa ler o tema e a vitrine (tabela acima) → Codex.
- Nome da jornada no SFMC ainda não fechado (proposta `JOR_RENT_POOL_OFERTAS_VAIDEVISA`) → sem ele o resultado não se liga a `rentabilizacao_activities` → operação.
- 79 mil clientes ativos sem limite de R$ 200 ficam fora → possível régua sem oferta → gestora.

### Operação no SFMC: automações, SQL e BU (05/11/2026)

Para a aba Plano de Comunicação explicar como o Pool funciona por trás do e-mail:

| Assunto | Onde está |
|---|---|
| BU do SFMC (BU pai "Banco Afinz", MID a confirmar), pastas, automações, cada passo com anotação e SQL completo | [[Automacao-VDV-Pool-de-Ofertas]] |
| Como as ofertas giram entre os grupos a cada disparo (acervo → regra → vitrine → histórico), decisões e decisões abertas | [[Rotacao-de-Ofertas-Vai-de-Visa]] |
| Público de cada disparo (safra congelada ∩ apto hoje, sem controle) | [[DE-VDV_DISPARO]] |
| Memória da rotação e base da medição por marca | [[DE-VDV_VITRINE_HISTORICO]] |
| Mapa de todas as DEs e automações do Pool | [[MOC-SFMC-DEs-e-Automations]] |

Resumo para o plano da régua: **2 disparos por semana**, a vitrine é recalculada a cada disparo por grupo (2 ofertas do grupo + 1 de descoberta, com reservas), marca de dois grupos circula nos dois e nenhum cliente fica sem oferta. O E-mail 1 e o E-mail 2 usam o mesmo template; o que muda é o hero (e, se aprovado, a alternância por disparo).

### Relacionado

[[Fabrica-de-Emails-GaaS]] · [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] · [[Emails-Dinamicos-Vai-de-Visa]] · [[Teste-Afinidade-MCC-vs-Generico]] · [[DE-BRIEFING_OFERTAS_VISA]] · [[DE-MOVIMENTO_OFERTAS_VISA]] · [[Ficha-de-Produto-Guia]] · [[Cartao-Afinz-Visa]] · [[Incentivo-ao-Uso]]
:::

