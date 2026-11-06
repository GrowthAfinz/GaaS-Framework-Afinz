---
tags: [estrategia, seguros, cross-sell, segmentacao, cluster, seguro-celular, teste]
tipo: estrategia
camada: estrategia
aliases: [Segmentação de seguros, Cluster Seguro Celular, SEG_BASE_CPF]
atualizado: 2026-11-04
status: proposto
status_detalhe: perfil de posse calculado em 04/11/2026; clusters e teste propostos, ainda não executados
fonte: Query Studio 04/11/2026 (MAPA_SEGUROS × CLIENTES ATIVOS × MAPA_MCC); amostra DEVICE (100 linhas); operador; pesquisa externa 04/11/2026
---

# Segmentação de seguros e cluster do Seguro Celular

**Definição e propósito:** como escolher quem recebe qual oferta de seguro, começando pelo **Seguro Celular**, a partir dos dados que já temos no Marketing Cloud. Registra o perfil de quem já tem seguro, o que esse perfil permite ou não transferir para o Celular, os clusters propostos e o teste com controle.

> Status: perfil = `confirmado` (números de 04/11/2026). Interpretação de canal = informação do operador. Clusters e regra de decisão = `proposto`.

## Produto: Seguro Celular

Três planos com as mesmas coberturas; muda o teto da indenização (operador, 04/11/2026):

| | Essencial | Plus | Premium |
|---|---:|---:|---:|
| Mensalidade | R$ 28 | R$ 45 | R$ 64 |
| Roubo e furto qualificado | até R$ 1.500 | até R$ 2.500 | até R$ 3.500 |
| Danos acidentais (inclui tela e líquidos) | até R$ 300 | até R$ 500 | até R$ 600 |

Sem franquia, carência de 30 dias, vigência de 12 meses, 1 acionamento por cobertura. Regra de plano proposta: **o menor plano cujo teto de roubo cobre o valor atual do aparelho**. Depende da [[#DEVICE|base DEVICE]].

## O que a MAPA permite comparar

O único comprador **da oferta digital** com volume na [[DE-MAPA_SEGUROS]] é o **Residencial 24h (8.830 CPFs)**. Dental, AP e Proteção Completa são vendidos por **call / recuperação** e medem quem passou por esse canal. O Você Bem entra grátis e passa a ser cobrado (adesão automática). Mulher e Celular não estão na MAPA.

## Perfil de posse (📊 04/11/2026, 644.666 CPFs)

Índice = taxa de posse na faixa ÷ taxa geral × 100. Taxas gerais: voluntário 3,83% · Residencial 1,37% · Dental 2,89% · AP 1,16% · Proteção Completa 7,21%.

### Tempo de conta separa os canais

| Tempo de conta | Residencial | Dental | AP | Proteção Completa |
|---|---:|---:|---:|---:|
| < 6 meses | **0** | **179** | **210** | 66 |
| 6–12 meses | 18 | 120 | 148 | 66 |
| 1–2 anos | 132 | 100 | 86 | 113 |
| 2 anos ou mais | **168** | 92 | 92 | 141 |

Dental e AP concentrados em conta nova = venda do call na abertura. Residencial só em conta antiga = efeito de **quem a régua escolheu** (desde mar/2026), não necessariamente de propensão. Por isso o tempo de conta **não** entra como critério do cluster do Celular.

### MCC indica engajamento, não afinidade

Índice do Residencial por compra na categoria, só dentro da CLIENTES ATIVOS: viagem 208 · pet 204 · eletrodomésticos 194 · eletrônicos 193 · moda 169 · saúde e beleza 160. Eletrodomésticos (montar a casa) deveria liderar no Residencial e não lidera. **Qualquer categoria levanta qualquer seguro na mesma proporção**: o sinal é "usa o cartão". Afinidade por categoria não foi demonstrada.

### Engajamento é o eixo principal

| Sinal | Voluntário | Residencial |
|---|---:|---:|
| Compra nos últimos 30 dias | 164 | 192 |
| App nos últimos 30 dias | 142 | 152 |
| Sem app | 59 | 42 |
| Nunca comprou / fora da Ativos | 56 | 38 |

### Demais dimensões

- **Idade:** pico em 45–59 (voluntário 126, Residencial 125); abaixo de 35, cerca de 60. O benchmark de mercado do seguro celular é ~30 anos (Alper, via CQCS). **Não transferir idade.**
- **Gênero (`SUPOSTO_GENERO`):** masculino 130 × feminino 84 no voluntário, puxado pelo AP (194). Residencial praticamente igual (105 × 98).
- **Limite disponível:** abaixo de R$ 200 = 175; R$ 3 mil ou mais = 66. Confundido com conta nova (limite inicial baixo + venda do call). Não usar sem controlar por tempo de conta.
- **Canal:** B2C 140 × B2B2C 98 no voluntário; Residencial igual (121 × 123).
- **Você Bem:** quem tem = 144 no voluntário. Provável efeito de canal ou tipo de cartão; controlar.

Cada índice foi lido isoladamente; engajamento, MCC e app são correlacionados entre si. Falta um cruzamento multivariado para separar os efeitos.

## O que transfere para o Celular

| Variável | Transfere? | Uso |
|---|---|---|
| Engajamento (compra + app em 30 dias) | sim | eixo do cluster |
| Momento (compra recente em eletrônicos, ticket alto) | só como hipótese | célula própria para testar |
| Momento de entrada (cartão novo) | hipótese apoiada pelo call (Dental 5,2% das contas < 6m) | célula própria |
| Idade, gênero, limite, tempo de conta | não | cortes de leitura do resultado |

## Clusters (`CD_CLUSTER_CELULAR` na `SEG_BASE_CPF`)

Precedência de cima para baixo; cada CPF cai em um só. Query em [[Automacao-Processos-Seguros]].

| Cluster | Regra | Papel |
|---|---|---|
| `Y_ATRASO` | alguma conta do CPF em `BLOQUEADO ATRASO` | fora |
| `X_LEAD_RECENTE` | preencheu a LP de Celular em 90 dias | régua de carrinho, não de oferta |
| `D_BOAS_VINDAS` | primeira conta aberta há até 60 dias | testa o momento de entrada |
| `B_MOMENTO` | engajado + eletrônicos em até 60 dias com ticket médio 12m ≥ R$ 500 | testa o gatilho de troca de aparelho |
| `A_ENGAJADO` | compra e app nos últimos 30 dias | núcleo, replica o comprador do Residencial |
| `Z_DEMAIS` | o resto | sem oferta ativa na fase 1 |

Decisões de desenho:
- A versão inicial tinha um cluster C (engajado jovem, 25–44). Ele se sobrepunha ao A; a idade passou a ser **corte de leitura** dentro de A, B e D.
- O A não exige conta com 1 ano ou mais: o padrão de tempo do Residencial reflete quem foi alvo da régua.
- Vender seguro logo após a emissão do cartão é permitido (operador, 04/11/2026). O D usa isso.
- `FL_JANELA_COBRANCA_VB` marca quem está perto do fim do período grátis do Você Bem (150 a 240 dias de conta). Fica como flag para ler reclamação, não como exclusão.
- **Controle:** 10% fixo por CPF, `ABS(CHECKSUM(CPF + 'SEG_CEL_CONTROLE') % 100) >= 90`. A semente é diferente da do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]] para os dois controles não caírem nas mesmas pessoas.
- **Pressão de contato:** o call oferece Dental, AP e Proteção Completa a contas novas. Enquanto não houver o registro das ligações por CPF, o D convive com esse risco. Ver [[Anti-Overlap-Pressão-de-Contato]].

## Atualização 04/11/2026 (tarde): gatilho, régua rotativa e aparelhos

Decisões e ajustes depois da conversa com o time de CRM. Valem por cima da seção de clusters acima onde houver conflito.

**O que mudou**
- **Limite saiu.** O seguro não é cobrado na fatura do cartão (operador). Do cadastro ficam só `STATUS = 'NORMAL'` e nenhuma conta em atraso.
- **O plano não é imposto.** Na LP do Celular a pessoa escolhe Essencial, Plus ou Premium. A DEVICE decide **quem** recebe o Celular e, depois, mede se o plano escolhido bate com a faixa do aparelho.
- **MCC não identifica compra de celular.** A categoria eletrônicos junta 4812 (loja de telefonia) com 5732, 5734, 5045 e 5946. As compras em Magalu, Casas Bahia, Amazon e Mercado Livre caem em 5311, 5964 e 5999, no grupo "fora do MVP" (ver [[MCC]]). O cluster `B_MOMENTO` por eletrônicos fica **substituído** pelo gatilho de troca de aparelho; o MCC vira só reforço.

**Duas formas de contato**
| | Gatilho | Régua mensal |
|---|---|---|
| Quando | a pessoa trocou de aparelho | ciclo da base elegível |
| Contato | 1 contato do Seguro Celular no D+1 | 2 e-mails + 1 SMS por seguro; WhatsApp só no boas-vindas, no gatilho e para quem clicou |
| Convivência | tem prioridade e conta como a etapa Celular da pessoa | quem recebeu o gatilho não recebe Celular de novo na régua |

**Gatilho de troca de aparelho:** aparelho novo **com modelo diferente** do aparelho anterior do mesmo CPF. Só "aparelho novo" não basta: na amostra, 43% dos aparelhos apareceram nos últimos 90 dias, em boa parte por reinstalação do app. Depende da DEVICE atualizada e com histórico por CPF.

**Régua rotativa (DE de-para CPF × seguro):** cada etapa dura 30 dias, com 15 dias de pausa entre etapas.

| Perfil | 1ª etapa | 2ª | 3ª |
|---|---|---|---|
| Mulher com aparelho apto | Celular | Mulher | Residencial |
| Homem com aparelho apto | Celular | Residencial | — |
| Mulher sem aparelho apto | Mulher | Residencial | — |
| Homem sem aparelho apto | Residencial | — | — |

Aderiu ou já tem o seguro → pula a etapa. "Não tenho interesse" (`ENT.sem_interesse`), atraso ou controle → sai de todas. Campos propostos da DE: `CPF`, `PRODUTO_ATUAL`, `DT_ENTRADA`, `DT_SAIDA_PREVISTA`, `PRODUTOS_JA_RECEBIDOS`, `MOTIVO_SAIDA`, `DS_GRUPO`. Roda como passo da [[Automacao-Processos-Seguros|processos_seguros]], com a mesma lógica de sequência das réguas de topo.

> Ponto a confirmar: na conversa com o time, a proposta foi "sem aparelho apto → Residencial primeiro". Na tabela acima, mulheres sem aparelho apto começam pelo Mulher, para o produto não ficar parado no 1º ciclo.

**Aparelhos aptos ao Seguro Celular** (`proposto`; a regra da seguradora não muda a seleção agora, segundo o operador)
1. É smartphone (Android ou iOS).
2. Usado nos últimos 90 dias.
3. Sistema atual: Android 13 ou mais, iOS 17 ou mais.
4. Valor estimado acima de ~R$ 600 (abaixo disso, o Essencial custa mais de metade do aparelho por ano).

| Marca | Essencial (até R$ 1.500) | Plus (até R$ 2.500) | Premium (até R$ 3.500) | Fora |
|---|---|---|---|---|
| Apple (`iPhoneNN,x`) | iPhone 11 (`12,x`) | iPhone 12 (`13,x`) | iPhone 13 ou mais novo (`14,x`+) | XS/XR ou anterior |
| Samsung (`sm-a` + linha + geração) | A0x 2023+, A1x, A2x, M | A5x, S21 FE | S (`sm-s`), Fold/Flip (`sm-f`) | linha A de 2022 ou antes |
| Motorola | g0x a g6x | g7x, g8x | Edge, Razr | moto g(9), One |
| Xiaomi (código `AAMM…`) | 2023 ou depois | tabela por série | — | 2022 ou antes |

Amostra de 100 aparelhos (DEVICE de 08/2025): Essencial 41 · Plus 9 · Premium 16 · fora 33 · a mapear 1. Faixas = estimativa de preço de usado, a validar.

**Projeção (estimativa, 04/11/2026):** base ~433 mil; engajado ~160 mil (130–190 mil); boas-vindas ~17 mil em estoque e ~8,5 mil novos por mês; ~240 mil sem oferta na fase 1. Pessoas por seguro no engajado, sem o controle: ciclo 1 Celular ~96 mil, Mulher ~30 mil, Residencial ~18 mil; ciclo 2 Mulher ~60 mil, Residencial ~66 mil; ciclo 3 Residencial ~60 mil. Custo ~R$ 8 mil por ciclo (2 e-mails + 1 SMS) + ~R$ 2 mil/mês de WhatsApp. Adesão esperada: 0,05% a 0,15% dos impactados (hipótese).

**Lançamento do Celular: o que medir e testar**
- Funil: impactado → abertura/clique → visita à LP → **adesão e plano escolhido** → **efetivação (apólice)** → permanência em 30, 60 e 90 dias.
- Sempre: controle de 10% e comparação entre engajado, boas-vindas e gatilho, cada um contra seu controle.
- Um A/B por mês (com adesão perto de 0,1%, separar 0,10% de 0,15% pede ~80 mil por braço): mês 1, teste da regra do aparelho (10% dos "fora" recebem); mês 2, canal (com e sem WhatsApp); mês 3, copy personalizada pelo aparelho.

**Residencial × Celular:** o Residencial ainda não tem gatilho de momento. Candidatos: troca de CEP no cadastro e MCC de material de construção e móveis (5200, 5211, 5712) como categoria própria. Pedido à IN.

## Medição

| KPI | Definição | Fonte |
|---|---|---|
| Lead | preenchimento da LP de Celular em 30 dias | `LP_SEGUROS_GERAL` |
| Venda | entrada de Celular em 30 dias | `SEGUROS_MOVIMENTO_LOG` (depende do Celular entrar na MAPA) |
| Incremental | taxa do tratamento − taxa do controle, por cluster | idem |
| Permanência | venda sem saída em 90 dias | idem |
| Reclamação | opt-out e reclamação por cluster | Marketing Cloud / SAC |

Enquanto a venda do Celular não chegar à MAPA, a medição para no lead. **Lead não é venda.**

Regra de decisão (proposta): escalar o cluster com incremental positivo e significativo sobre o controle; comparar A × B para decidir se o gatilho de eletrônicos vale régua própria, e D × A para decidir se o Celular entra na jornada de ativação.

## DEVICE

Amostra de 100 linhas recebida em 04/11/2026 (`cpf` + JSON com sistema, marca, modelo, versão, datas de primeiro e último uso). Problemas: CPF numérico sem zero à esquerda (32%), foto de 09/08/2025, 17% sem datas, dado com cara de antifraude (finalidade a validar na LGPD). Uso previsto: escolher o plano (modelo → valor → teto) e excluir aparelho de valor residual muito baixo. Fora da `SEG_BASE_CPF` até a IN entregar a base completa e atual.

## Referências externas

- Gatilho de evento × perfil: listas por evento tiveram resposta 56% maior e ROI 17% maior (Sia Partners, bancassurance).
- Propensão × uplift: no caso de cross-sell de um banco, o top 30% por propensão gerou incremental praticamente nulo; o uplift triplicou a venda incremental (Stochastic Solutions). Por isso o controle é obrigatório.
- Seguro celular no Brasil: 830 mil celulares roubados ou furtados em 2025 (Anuário de Segurança Pública); comprador de ~30 anos, Sudeste, Apple e Samsung, ticket médio ~R$ 65 (Alper); sinistralidade < 1% (Porto).
- Preços públicos da loja (04/11/2026): SOS Dental R$ 14,90; Básico + SOS Dental R$ 24,90; Super + SOS Dental R$ 44,90; Máximo + Assistência 24h + SOS Dental R$ 69,90. Anuidade do cartão até R$ 360/ano.

## Lacunas e pendências

- (04/11 tarde) DEVICE com histórico de aparelhos por CPF → sem isso o gatilho confunde reinstalação com troca → IN / time de CRM.
- (04/11 tarde) MCC 4812 em coluna própria; troca de CEP; MCC de construção e móveis → gatilhos de Celular e Residencial → IN.
- (04/11 tarde) Celular antes ou depois da Black Friday, ou excluindo quem recebeu o Vai de Visa → pressão de contato na mesma base → Growth + gestão.
- (04/11 tarde) Ordem da 1ª etapa para mulheres sem aparelho apto (Mulher × Residencial) → alinhar com o time de CRM.

- Celular e Mulher fora da MAPA → venda não medida → `SEG-MAPA-MULHER` → time de dados.
- Registro de ligações do call por CPF (oferta, resultado) → sem exclusão por recusa nem janela entre canais → área de call / recuperação.
- Regra de cobrança do Você Bem e da Proteção Completa → área de seguros.
- DEVICE completa e atual, com CPF como texto e JSON aberto → IN; finalidade LGPD → Segurança.
- Idade máxima do aparelho e exigência de nota fiscal no Seguro Celular → seguradora.
- Cruzamento multivariado (engajamento × tempo de conta) no Residencial → tamanho real do A.

## Relacionado

Spec no repositório do GaaS: `docs/plans/seguros-segmentacao/SDD_SEGUROS_SEGMENTACAO_E_REGUA.md` (queries em `sql/`). Tarefas na Fila: `SEG-MAPA-MULHER`, `SEG-AUTO-MOVIMENTO`, `SEG-BASE-CPF`, `SEG-REGUA-ROTATIVA`, `SEG-DEVICE-IN`, `SEG-IN-SINAIS`, `SEG-CONFIRMAR-PRODUTOS`, `SEG-CALL-BASE`.


[[DE-MAPA_SEGUROS]] · [[Automacao-Processos-Seguros]] · [[10-Resultados/Mecanicas/Seguros|Seguros]] · [[MCC]] · [[DE-CLIENTES_ATIVOS]] · [[DE-MAPA_MCC]] · [[Teste-Afinidade-MCC-vs-Generico]] · [[Anti-Overlap-Pressão-de-Contato]]
