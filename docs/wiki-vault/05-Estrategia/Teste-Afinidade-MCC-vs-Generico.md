---
tags: [estrategia, experimento, teste, holdout, mcc, vai-de-visa, rentabilizacao]
tipo: estrategia
camada: estrategia
aliases: [Teste SEG GEN, Teste A/B/C Vai de Visa, Afinidade MCC vs genérico, SEG-A SEG-B SEG-C]
atualizado: 2026-11-09
status: a-validar
fonte: aba "Estratégia de Ativação" da spec Vai de Visa (gestora, out/2026); decisões de 03/11/2026, operador
---

# Teste de afinidade MCC versus genérico · Pool Visa

## 3. Grupos, células e unidade de comparação

Grupo descreve a classificação de afinidade feita na primeira entrada da safra; célula determina o tratamento experimental. APTOS mantém o grupo da SAFRA mesmo que o histórico de compras mude depois. CD_GRUPO_SECUNDARIO é diagnóstico, não a coluna GRUPO_2 de ofertas: ela não está vigente.

| Grupo | Critério no SQL entregue | Precedência |
|---|---|---|
| FAMILIA_PRESENTES | Pelo menos duas compras em Brinquedos nos agregados de 12 meses | Primeiro quando elegível, antes de quantidade/gasto dos outros grupos |
| MODA | Pelo menos duas compras em 12 meses e última compra em até seis meses | Depois de Família: quantidade, gasto e prioridade técnica |
| SAUDE_BELEZA | Mesmo limiar de quantidade e recência de Moda | Desempate técnico depois de Moda quando quantidade/gasto empatam |
| GENERICO | Não classificado nos três anteriores | Não significa ausência de todo consumo |

O código V1_12M_REC6M não representa “duas compras em seis meses”: a quantidade disponível é de 12 meses e a recência da última compra é de seis. Farmácia está em Saúde e Beleza; MCC não garante compra de cosmético. A definição da IN para parcelas e estornos continua pendente.

| População / célula | Proporção esperada | Seleção do e-mail | Comparação |
|---|---|---|---|
| Afinidade / SEG-A | 45% | POOL do CD_GRUPO | SEG-A × SEG-B no mesmo grupo: personalização |
| Afinidade / SEG-B | 45% | POOL GENERICO | Tratamento genérico dentro da população segmentada |
| Afinidade / SEG-C | 10% | Sem envio | Efeito de contato, respeitando cobertura e contaminação |
| Genérico / GEN-A | 90% | POOL GENERICO | GEN-A × GEN-C na população genérica |
| Genérico / GEN-C | 10% | Sem envio | Controle da população genérica |

Controle: ABS(CHECKSUM(CPF + 'VDV_CONTROLE') % 100) >= 90. Entre não controles segmentados, A/B usa CPF + ID_SAFRA com módulo 2. São proporções esperadas, não cotas exatas: verificar amostra e incerteza. Não chamar diferença entre grupos de efeito causal de personalização. O código fixo permite manter controle entre safras, mas essa política futura precisa de decisão explícita.

:::details Elegibilidade e agregação cadastral · efeito de cada regra
A CRUZAMENTO exige ao menos uma linha B2C/B2B2C que reúna STATUS NORMAL, DATA_ULTIMA_COMPRA nos últimos 30 dias e LIMITE_DISPONIVEL ≥ 200. A exclusão por bloqueio de e-mail e BLOQUEADO ATRASO olha as linhas do CPF dentro desse escopo de CANAL, não uma consulta universal a outras BUs. MAX(LEN(EMAIL)) > 0 na CRUZAMENTO não higieniza endereço; APTOS ainda exige contato não vazio após trim e exclui Unsubscribed/Held.

Nome, e-mail, celular e CANAL usam MAX. NM_PARCEIRO só é preenchido quando existe um único PRODUTO B2B2C NORMAL, normalizado, e nenhuma linha B2C NORMAL. Múltiplos vínculos ficam sem parceiro personalizado, até validar uma prioridade comercial. NM_CARTAO é explicitamente NULL. Não usar ORIGEM como nome comercial por dedução.

Compra em 30 dias usa GETDATE no SQL de CRUZAMENTO; carimbos/rodada e a recência de categoria usam DATEADD(HOUR,3,GETDATE()). Preservamos as SQLs recebidas: conferir a convenção de fuso e a fronteira de dia no tenant antes de homologar, sem trocar o offset por suposição.
:::

## 9. Medição e operação assistida

A VDV_SAFRA é a base de visualização dos grupos e células. Ela mantém os participantes e controles, inclusive quem saiu de APTOS por inaptidão. Para acompanhar a exposição, essa base deve ser conciliada com os envios reais por JobID, rodada e toque. ID_ENVIO identifica a participação e o acesso à LP; cada disparo precisa de seu próprio vínculo de rastreio.

SEG-A × SEG-B, dentro do mesmo grupo alocado, é a comparação de personalização. Tratamentos × seus controles avaliam contato sob condições comparáveis e cobertura conhecida. GEN-A × GEN-C mede o contato na população genérica. Abertura/clique são diagnóstico; compra por marca/MCC e gasto vêm de fonte da IN/Visa conciliada. Gateway de pagamento pode esconder a marca; MCC não identifica o item. O contrato final de compra, tratamento de parcelas/estornos e janelas precisa da IN.

As leituras D+7/D+15/D+30 vêm do desenho anterior e continuam referências de acompanhamento, não um contrato final adaptado à audiência recorrente. É preciso definir data de referência também para controle, múltiplas exposições e safras sobrepostas. Não substituir ausência de exposição por zero ou usar apenas quem abriu como população causal.

:::details Como interpretar as dez etapas do FUNIL
| Ordem / etapa | Interpretação correta |
|---|---|
| 1 MAPA_ENTRADA | Fonte vazia gera ALERTA; contagem não prova referência nova |
| 2 MAPA_TRATADA | Confere vazio, quantidade, centavos e máximo de Moda; limites históricos são heurísticas |
| 3 CRUZAMENTO | Base elegível vazia alerta |
| 4 SAFRA_TOTAL | Participação acumulada, inclusive controles; não é público que recebe hoje |
| 5 SAFRA | Proporção por grupo/célula na população alocada; tolerância de três pontos percentuais pode alertar amostra pequena |
| 6 POOL | Conta marcas válidas nas posições 1–6 para quatro grupos, inclusive grupos sem oferta |
| 7 APTOS_TOTAL | Público preparado vazio alerta; não prova envio |
| 8 APTOS | Conferência da safra e das células tratadas presentes |
| 9 APTOS_INVALIDOS | Zero é o resultado bom desta etapa; uma ou mais linhas exigem diagnóstico |
| 10 ELEGIVEL_SMS | INFO: contato celular disponível, sem validar consentimento ou configuração SMS |

O agrupamento de SAFRA só mostra células existentes: completar a matriz de cinco células esperadas na conferência para detectar ausentes. PCT_ETAPA_ANTERIOR, apesar do nome, é a fração de uma célula no grupo nessa etapa, não uma conversão de funil. O alerta não cancela um envio e não existe gate automático novo nesta entrega.
:::

:::details Recuperação por estágio da preparação
1. Antes de repetir, guardar execução, fontes/referências, contagens, versão da rodada e mensagem de erro. Não reimportar um arquivo incompleto por cima da última fonte válida.
2. Falha em MAPA/CRUZAMENTO: corrigir entrada/tipos e repetir a sequência com fontes consistentes. Reexecutar tratamento não renova o arquivo IN.
3. SAFRA já gravada: conferir novas chaves e alocações; não apagar participantes para re-sortear. O NOT EXISTS é parte do contrato.
4. POOL já presente ou parcial: a Q08 não o completa. Diagnosticar chaves e referencial, preservar as rodadas anteriores e decidir uma correção controlada; não alterar silenciosamente conteúdo de rodada usada.
5. APTOS falhou ou ficou antiga: reparar a causa e preparar de novo antes do envio, garantindo que nenhum consumidor esteja lendo a DE durante Overwrite.
6. FUNIL falhou: não assumir sucesso dos passos anteriores nem execução completa pelo fato de haver APTOS. Conferir cada destino e corrigir o log. Um alerta conhecido precisa de justificativa explícita antes de qualquer liberação assistida.
:::


Os registros antigos abaixo preservam as hipóteses e janelas propostas, mas não comprovam execução. A prioridade FAMILIA_PRESENTES, SAFRA acumulada e audiência recorrente descritas acima prevalecem na revisão de 09/11.



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
### Teste: afinidade por MCC × oferta genérica

**Definição e propósito:** desenho de [[Experimento|experimento]] do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]] que responde duas perguntas ao mesmo tempo: (1) **escolher a oferta pela categoria em que o cliente compra vende mais do que mandar as mesmas ofertas para todos?** (2) **a campanha gera compra que não aconteceria de qualquer jeito?** O desenho pode ser reaproveitado por qualquer campanha de rentabilização com personalização.

> Status: desenho = `confirmado` pela spec; execução = `a-validar` (não iniciado).

### Hipótese

Clientes com afinidade de compra em uma categoria convertem mais quando recebem ofertas dessa categoria do que quando recebem ofertas genéricas (top Visa), e ambos convertem mais que um controle sem envio. Ver [[Hipótese]].

### Células

Separar a base em dois tipos de cliente:

| Tipo | Célula | % do grupo | Recebe | Pergunta |
|---|---|---:|---|---|
| **SEG** — tem afinidade (b1–b7) | **SEG-A** | 45% | 4 ofertas da sua categoria (filtradas pelo limite) | segmentar converte mais que o genérico? |
| | **SEG-B** | 45% | 4 ofertas genéricas | base de comparação da segmentação |
| | **SEG-C** | 10% | nada (controle) | a campanha gera venda incremental? |
| **GEN** — sem afinidade | **GEN-A** | 90% | 4 ofertas genéricas | o disparo genérico funciona para quem não tem perfil? |
| | **GEN-C** | 10% | nada (controle) | incrementalidade do genérico |

Exemplo sintético: a Maria compra muito em Moda (b1). Se cair em SEG-A, recebe Zattini, Hering, Puma, Riachuelo; em SEG-B, Nike, Movida, Decolar, oBoticário; em SEG-C, nada.

### Regras de entrada e desempate

- Moda, Saúde e Beleza, Pet (alta frequência): ≥ 2 compras em 6 meses. Eletrodomésticos, Eletrônicos, Brinquedos, Viagem (baixa): ≥ 2 compras em 12 meses.
- Mais de um grupo: mais compras na janela → maior gasto em 12 meses → prioridade (Moda 1, Saúde e Beleza 2, Viagem 3, Eletrodomésticos 4, Pet 5, Eletrônicos 6, Brinquedos 7).
- Sem grupo → Genérico. Casa, Presentes, Alimentos e Bebidas, Educação e Varejo não têm grupo próprio.

### Decisão `V1_12M_REC6M` (03/11/2026)

A [[DE-MAPA_MCC]] só tem quantidade em 12 meses. Regra aplicada para os grupos de alta frequência: **≥ 2 compras em 12 meses E última compra na categoria ≤ 6 meses**. Gravar `CD_REGRA_GRUPO = 'V1_12M_REC6M'` em cada cliente.

**Por que o teste continua válido:** a comparação SEG-A × SEG-B acontece **dentro do mesmo grupo**, com sorteio aleatório. Uma regra de entrada menos precisa afeta as duas células igualmente: o teste não fica viesado, só pode medir um lift menor (afinidade diluída). Erro conservador, aceitável no MVP.

### Primeiro teste (safra `VDV_2026_11_BF`, decisão de 03/11/2026)

Só três grupos, com 3 ofertas cada: **MODA**, **SAUDE_BELEZA** e **FAMILIA_PRESENTES** (afinidade de Brinquedos); o resto cai no **GENERICO**. Vitrines em [[DE-BRIEFING_OFERTAS_VISA]]. FAMILIA_PRESENTES tende a ser pequeno (5,9% das contas compram Brinquedos): ler como indício.

### Sorteio implementado: duas camadas

| Camada | Código | Pergunta |
|---|---|---|
| Controle 10% | fixo `VDV_CONTROLE` | o programa gera uso a mais? (permite controle perene) |
| A × B 50/50 | por safra (`VDV_2026_11_BF`) | personalizar funciona neste tema? |

Se a decisão for sortear o controle a cada safra, basta trocar o código fixo pelo da safra. Implementação em [[DE-VDV_APTOS]].

### Princípios de execução

1. **Sortear depois do filtro do canal principal** (e-mail). Se o sorteio incluir quem nunca poderia receber, o controle fica com gente inalcançável e o lift sai inflado.
2. **Semente fixa** sobre o CPF (ex.: `ABS(CHECKSUM(CPF)) % 100`), para a célula ser a mesma em toda execução.
3. **Congelar grupo e célula no envio.** A base é recalculada, a célula de quem já entrou no teste não.
4. SMS/WhatsApp entram como reforço **dentro das mesmas células**, nunca como célula nova.

### KPIs

| KPI | Definição | Fonte |
|---|---|---|
| Abertura e clique | aberturas e cliques ÷ envios (SEG-A, SEG-B, GEN-A) | Marketing Cloud |
| Conversão na oferta | % de clientes com compra no estabelecimento da oferta até 30 dias após o envio | `DE_VDV_RESPOSTA` |
| Conversão na categoria | % com compra em MCC da categoria até 30 dias | `DE_VDV_RESPOSTA` |
| Gasto incremental | gasto médio da célula − gasto médio do controle | `DE_VDV_RESPOSTA` |
| Lift da segmentação | conversão SEG-A − conversão SEG-B, por grupo | `DE_VDV_RESPOSTA` |
| Descadastro | opt-outs ÷ envios | Marketing Cloud |

Janela de conversão: 30 dias após o envio. Na Black Friday todo mundo compra mais, por isso o controle é obrigatório.

### Limites da medição

- **Nome do estabelecimento é frágil:** compra online pode vir como gateway (`PAGSEGURO*`, `MP*`), e a conversão na oferta sai subestimada justamente no canal das ofertas. A conversão na categoria (por [[MCC]]) é mais robusta.
- **Caminho melhor:** na [[Iniciativa-Copa-2026|Copa 2026]] a fonte da verdade foi o BI da Visa (`copa_visa_daily`). Pedir à Visa dado de resgate por oferta/cupom no mesmo formato resolveria a atribuição.
- **Grupos pequenos** (b3, b4, b5) podem não ter volume para ler incrementalidade com 10% de controle. Ler o lift desses grupos como indício.
- **Grupo b2 inflado por farmácia** (MCC misto): o lift de b2 mede mais farmácia que beleza.

### Safras e acompanhamento

- Campanha **perene**; cada tema é uma safra (`ID_SAFRA`, ex.: `VDV_2026_11_BF`). Grupo e célula congelados por safra em [[DE-VDV_ENVIO]].
- **Leituras:** D+7 e D+15 (acompanhamento) e **D+30 (oficial)**, sempre pela célula sorteada.
- **Saídas da IN:** relatório agregado (safra × grupo × célula) e, proposto, resultado por cliente de volta no MC (`VDV_RESULTADO`) para virar ação (repique, não repetir oferta, Viagem → seguro).
- **Safras sobrepostas (proposta):** leitura por safra atribui a compra à **última safra recebida**; leitura do programa compara recebeu × controle perene **por mês**.

### Regra de decisão (proposta)

Segmentar nas próximas ondas quando SEG-A > SEG-B com significância nos grupos com volume (b1, b2), e SEG-A/SEG-B > SEG-C. Sem lift: manter genérico e reavaliar o critério de afinidade. Usar o calculador de significância do Diário de Bordo (aba Experimentos do GaaS).

### Relacionado

[[Experimento]] · [[Hipótese]] · [[Sistema-de-Experimentacao-Referencias]] · [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] · [[DE-VDV_APTOS]] · [[MCC]] · [[Incentivo-ao-Uso]]
:::

