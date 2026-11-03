---
tags: [estrategia, regua, comunicacoes, ia, skill, roadmap]
tipo: estrategia
camada: estrategia
atualizado: 2026-08-17
status: proposto
fonte: operador
---

# Réguas Inteligentes — arquitetura proposta

**Definição:** desenho de como a skill `afinz-copy-aquisicao` (ou uma evolução dela) passa a responder a um pedido como *"me dá uma régua de carrinho abandonado"* já sabendo a estrutura real do funil — variantes de público, canais praticados, cadência esperada — em vez de tratar cada pedido como uma folha em branco. Motivado pelo pedido do Pablo em 2026-08-17 e viabilizado pelos dois datasets extraídos até aqui: [[Amostras-Comunicacoes-Reais]] (73 prints pessoais) e [[Templates-Vibe-Revisao-2026]] (61 templates da planilha oficial de revisão, com nomes reais e a matriz de régua planejada `Estrutura BAU CRM - OFERTA VIBE`).

## O problema que isso resolve

Hoje, pedir uma régua de comunicação depende inteiramente da memória de quem está escrevendo o briefing: quantos disparos tem Carrinho Abandonado, se existe separação Institucional/Ecred, quais canais essa etapa do funil realmente usa. Isso mora espalhado em três lugares que não conversam entre si — a planilha de governança, a cabeça de quem já rodou campanha antes, e (agora) os dados extraídos por LLM vision. O sintoma concreto: **113 dos 115 `communication_slots` estão `unmapped`** ([[communication_slots]]) — a estrutura de jornada existe, mas ninguém consolidou "isso é o que essa jornada precisa" de um jeito que a skill possa consultar antes de gerar copy.

## Duas camadas de dado, dois papéis diferentes

Réguas inteligentes precisam de dois tipos de conhecimento que **não devem ser misturados na mesma tabela**, porque um é estrutural (muda pouco) e o outro é criativo (muda toda campanha):

1. **Esqueleto da régua** — quantos disparos, em qual ordem, por quais canais, para quais parceiros, dado um segmento/etapa de funil. É estático relativamente: muda quando o time de CRM redesenha a jornada, não a cada campanha. Fonte real hoje: a aba `Estrutura BAU CRM - OFERTA VIBE`, que já é literalmente essa tabela — SEGMENTO × ETAPA FUNIL × CANAL × PARCEIRO → nº de disparos planejados (extraída em `estrutura_bau_regua.json`).
2. **Banco de exemplos de copy real** — o texto, oferta, CTA e tom que já rodaram para cada combinação de segmento/canal/disparo/variante. Isso muda a cada campanha e é o que dá "voz" à sugestão. Fonte: `Amostras-Comunicacoes-Reais` + `Templates-Vibe-Revisao-2026`, ambos já no schema comum (`texto_completo`/`oferta`/`cta`/`elementos_visuais`/`tom`).

A ideia central: **a skill nunca inventa o esqueleto, só preenche com exemplo real ou gera copy nova ancorada em padrão real**. Isso é uma extensão direta da regra não-negociável já existente na skill `gaas-governanca-comunicacoes` (nunca inventar `template_id`/`activity_name`) — aqui vira "nunca inventar estrutura de régua sem lastro na matriz BAU ou em `activities` real".

## O esqueleto, com dados reais de hoje

A partir de `Estrutura BAU CRM - OFERTA VIBE` (41 combinações), a régua de aquisição Vibe já está mapeada assim:

| Segmento | Etapa | Canais | Parceiros | Disparos |
|---|---|---|---|---|
| Topo de Funil | Topo | E-mail, SMS | Afinz, Plurix, Bem Barato, Dia | 8 |
| Repescagem | Meio de Funil | WhatsApp, SMS | Afinz, Plurix, Bem Barato | 4 |
| Upgrade | Meio de Funil | WhatsApp, SMS | Afinz, Plurix, Bem Barato | 4 |
| Carrinho Abandonado \| Diário | Reativação | WhatsApp, SMS, Push | Afinz, Plurix, Bem Barato | 3 |
| Carrinho Abandonado \| 21D | Reativação | WhatsApp, SMS, Push | Afinz, Plurix, Bem Barato | 3 |
| Carrinho Abandonado \| Sábado | Reativação | WhatsApp, SMS, Push | Afinz, Plurix, Bem Barato | 3 |

E cruzando com os nomes reais de template em `Templates-Vibe-Revisao-2026`, a variante de público (que a matriz acima não mostra, porque é uma dimensão ortogonal) já aparece nos nomes: `institucional`, `ecred`, `srsa`, `ac`, `bpc`/`bsp`, `neg`/`ngd` — ou seja, dentro de cada célula da tabela acima ainda existe uma sub-divisão por origem do lead que precisa ser perguntada ou inferida.

## Fluxo proposto: "me dá uma régua de X"

1. **Resolver o segmento pedido contra o esqueleto.** Se o usuário disser "carrinho abandonado" sem especificar, a skill já sabe que existem 3 sub-jornadas (Diário/21D/Sábado) com cadência igual (3 disparos) mas propósito diferente — e pergunta qual (ou sugere as três, se o pedido for amplo).
2. **Perguntar canais, com sugestão pré-preenchida.** A skill já sabe que Carrinho Abandonado historicamente usa WhatsApp + SMS + Push (a matriz BAU); pergunta "quer os 3 ou só alguns?" em vez de perguntar do zero "quais canais existem para isso?".
3. **Perguntar/inferir variante de público.** Se o segmento tiver variantes conhecidas (Institucional/Ecred/Serasa), perguntar quais entram na régua — ou, se o usuário já disse "cliente que veio do Serasa", pular a pergunta.
4. **Para cada combinação (canal × disparo × variante), buscar exemplo real no banco de copy.** Se existir um registro com segmento+canal+ordem de disparo compatível em `Templates-Vibe-Revisao-2026` ou `Amostras-Comunicacoes-Reais`, usar como referência de tom/estrutura/CTA — nunca copiar oferta desatualizada sem avisar (ex.: valores antigos tipo R$100 vs R$200 em créditos Vibe, que já mudaram entre imagens do mesmo dataset).
5. **Gerar a copy nova ancorada no padrão**, explicitando no output quais peças têm exemplo real por trás e quais são geradas sem precedente direto (honestidade sobre o lastro, igual ao que já fazemos nas respostas de copy avulsa).
6. **Deixar explícito o que falta confirmar**: se a régua pedida usa uma combinação sem exemplo real no dataset (ex.: 21D + Push + Ecred), dizer isso abertamente em vez de fingir que existe precedente.

## O que falta para isso funcionar de ponta a ponta

- **Consolidar os dois datasets num índice único, pesquisável por segmento/canal/ordem/variante.** Hoje são dois JSONs separados com schemas ligeiramente diferentes (um tem `variante_publico` explícito, o outro tem a variante embutida no nome do template). Próximo passo natural: normalizar os dois para o mesmo schema.
- **Confirmar com o Pablo se `nome_template_salesforce` pode virar candidato oficial de `template_id`** — hoje é só um candidato forte, não validado contra a planilha de governança formal (`gaas-governanca-comunicacoes`).
- **Cobrir os canais e etapas que ainda não têm nenhum exemplo real capturado** (a matriz BAU tem 41 combinações; os dois datasets combinados cobrem uma fração disso — vale mapear o gap explicitamente antes de prometer cobertura total).
- **Decidir onde esse índice mora**: arquivo de referência dentro da skill (`references/reguas.md` ou `.json`) para uso imediato em qualquer conversa, versus uma tabela Supabase (mais rica, mas exige o pipeline de LLM na ingestão que ainda está em aberto — ver [[Galeria-de-Templates]]).

## Relacionado

- [[Templates-Vibe-Revisao-2026]] · [[Amostras-Comunicacoes-Reais]] · [[communication_slots]] · [[communication_templates]] · [[activities]] · [[Estrategia-Multicanal-Vibe-Mar-Fechado]] · [[Galeria-de-Templates]] · skill `afinz-copy-aquisicao`
