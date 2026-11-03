---
tags: [operacao,gaas,email,fabrica-de-emails,produto,ficha,guardrail,llm]
tipo: operacao
camada: operacao
atualizado: 2026-10-02
status: confirmado
fonte: operador
---

# Ficha de Produto — guia de redação

**Para que serve:** a Ficha de Produto é o card no topo da aba **Plano de Comunicação** da [[Fabrica-de-Emails-GaaS]]. É o "suco do produto" — o que uma pessoa (ou uma IA) precisa saber para escrever ou revisar qualquer e-mail daquele produto sem abrir mais nada. Alimenta `dynamic_email_product_contexts` (identidade) e `dynamic_email_product_guardrails` (benefícios + regras).

**Quem preenche:** analista de CRM na tela, ou uma IA autorizada a ler o Supabase, sob pedido no chat (nunca automático). Toda gravação é versionada.

---

## Princípios

1. **Escreve para quem não conhece o produto.** Nunca pressuponha contexto. Quem lê a ficha pode nunca ter visto uma peça desse cartão.
2. **Fonte para tudo.** Cada afirmação citável tem `evidence` (quem/o quê confirma) e, quando existe, `source_url`. Classifique a fonte: `oficial` (site/material do produto), `terceira` (blog, imprensa), `interno` (planilha/decisão Afinz).
3. **Data em benefício de campanha.** Todo benefício com fim conhecido nasce com `valid_to` preenchido — senão nunca expira sozinho e vira informação morta. Ver [[Beneficios-e-Vigencia]].
4. **Explique fronteiras e diferenças.** Evitar assumir Vibe no +amigo, percentual de desconto no Bem Mais ou programa de pontos ativo. Diferenciar Clube, cartão, benefício e promoção com a regra aplicável.
5. **Vocabulário do cliente, não da operação.** "supermercado", não "rede parceira". "seu limite", não "linha de crédito pré-aprovada".
6. **Curto onde dá, longo onde precisa.** Proposta de valor = 1 frase. Contexto de marca = vários parágrafos.

---

## Campos da identidade (`dynamic_email_product_contexts`)

### `value_proposition` — proposta de valor
Uma frase. **O benefício central + a âncora mental do cliente.** Responde: "por que essa pessoa quer isso?". Não é slogan, é a tese.
> ✅ *"Desconto extra dentro do supermercado que a pessoa já frequenta. O '+' é literal: soma sobre a oferta do Clube. Ancora em compra do mês, não em crédito."*
> ❌ *"O melhor cartão para você."*

### `differentiators` — diferenciais (lista, um por linha)
3 a 6 itens. O que esse produto tem que os concorrentes (ou os outros cartões Afinz) não têm, em forma de bullet citável.

### `tone_of_voice` — tom de voz
**Como falar e como NÃO falar.** Palavras a usar, palavras a evitar, nível de formalidade, quem é o sujeito da frase. Se há uma decisão de vocabulário registrada (ex.: "dizer supermercado, não rede parceira" — Pablo, 20/08/2026), ela vai aqui, com data.

### `eligible_audience` — público elegível
Quatro coisas, sempre:
1. **quem é** (comportamento, relação com o produto);
2. **o que conhece** e **o que NÃO conhece** (ex.: "conhece a loja, não conhece a Afinz");
3. **o tamanho do público endereçável, quando conhecido** — número agregado real, com origem, data e critério de elegibilidade. Se ausente, registrar `não disponível` e a consulta necessária; nunca reutilizar número ilustrativo. **Não confundir** com a base total do Clube/programa de fidelidade;
4. **ressalvas de elegibilidade** (praça, restrição de bandeira, pré-requisito que NÃO existe).

### `brand_context` — contexto de marca
**Vários parágrafos, não uma frase.** Cobre:
- **história e origem** da marca — de onde veio, o que era antes (ex.: "Clube Amigão virou +amigo em abr/2025");
- **posicionamento** — o que a marca representa, o lugar que ocupa na cabeça do cliente;
- **relação com o parceiro e com o emissor** — quem assina o quê. Ex.: "+amigo é uma marca da Plurix; o site do produto não cita a Afinz como emissor; a Afinz aparece só no benefício 'Você Bem (Afinz)'";
- **arquitetura de marca** — se há sub-marcas, bandeiras, assinaturas (ex.: 8 bandeiras Plurix, cada uma com rodapé próprio);
- **o que a marca NÃO é** — associações a evitar;
- **transições em curso** — marcas sendo absorvidas, renomeadas, descontinuadas.

### `provenance` / `source_url`
De onde veio a ficha. Data da última pesquisa. URL da fonte principal.

---

## Campos de cada regra e benefício (`dynamic_email_product_guardrails`)

Comum a benefício e regra:

| Campo | O que escrever |
|---|---|
| `title` | a frase do benefício/regra, curta e citável |
| `rule_text` | o que fazer / não fazer. Para benefício: a formulação recomendada + condições. Para regra: a instrução ("Não citar X em assunto, pré-cabeçalho, copy, arte ou rodapé") |
| `severity` | `hard_block` (bloqueia publicação) · `requires_review` (exige validação humana) · `advisory` (orientação) |
| `allowed_status` | `allowed` · `conditional` · `blocked` — o gate de publicação |
| `evidence` | **quem ou o quê confirma.** Ex.: "Confirmado pelo Pablo em 20/08/2026" · "Site oficial do Clube +amigo" · "Régua antiga vendia isso no E-mail 5; o vault registra que o produto não tem esse programa" |
| `source_url` | link, quando existe |
| `valid_from` / `valid_to` | janela de vigência. `valid_to` vazio = sem fim conhecido |

Específico de **benefício** (`guardrail_type = 'benefit'`, colunas da migration `20260904120000`):

| Campo | O que escrever |
|---|---|
| `category` | uma de: `desconto · cashback · prazo · saude · seguro · cartao_virtual · aceitacao · frete · sorteio · pontos · vibe · app · atendimento · outro`. É a chave que compara benefícios entre produtos |
| `value_exact` | o número **literal como a fonte publica** — "a partir de +5% off", "até 70%", "R$100". Não normalize, não arredonde |
| `citation_status` | `pode` · `cuidado` (condicional) · `checar` (falta confirmar) · `nao` |
| `source_type` | `oficial` · `terceira` · `interno` |
| `applies_to` (jsonb) | escopo opcional. Vazio = vale para todo o produto. Chaves: `frentes`, `objetivos`, `estagios`, `produtos`, `bandeiras`. Ex.: `{ "bandeiras": ["dom_olivio"] }` para um desconto que só a Dom Olívio pratica |

---

## Barra de qualidade — a ficha "atende bem" quando:

- [ ] a proposta de valor cabe numa frase e um estranho entende o produto só com ela;
- [ ] o **tamanho do público endereçável** tem fonte/data, ou a ausência e sua implicação estão registradas;
- [ ] o contexto de marca tem pelo menos 3 parágrafos e diz de onde a marca veio;
- [ ] existe pelo menos uma frase começando com "**Nunca**" ou "**Não citar**" (o que o produto não tem/não pode);
- [ ] todo benefício com valor tem `value_exact` preenchido;
- [ ] todo benefício de campanha tem `valid_to`;
- [ ] toda regra `hard_block` tem `evidence` que explica **por que** ela existe;
- [ ] nenhuma afirmação citável está sem `evidence`.

---

## Fonte de verdade

### Como ler a ficha com segurança — revisão 02/10/2026

A ficha operacional da Fábrica e o dicionário do vault são materiais complementares. O primeiro registra configuração editável com versões; o segundo explica produto, regras e fontes. Divergência deve ser registrada e reconciliada conforme [[Fontes-e-Proveniencia-Growth]], sem apagar overrides operacionais.

Na consulta ao projeto `mipiwxadnpwtcgfcedym` em 02/10/2026, há **um contexto ativo**, para **+amigo / Plurix**, e **sete guardrails ativos**. A existência de fichas dos quatro cartões no vault não significa quatro contextos operacionais já cadastrados. Não criar ausência como produto inexistente.

O público de topo do +amigo foi atualizado no registro operacional em 02/10: membros do Clube, sem cartão/proposta no recorte descrito e sem limite declarado. A restrição é da régua; não muda a elegibilidade universal para solicitar. Marcas Compre Mais e Superpão estão bloqueadas para comunicação nominal no escopo da régua, com assinatura +amigo até definição de nova marca.

### Procedimento de revisão da ficha

1. Ler identidade, proposta de valor e escopo da régua.
2. Conferir cada benefício em fonte datada e aplicável à rede/praça.
3. Conferir guardrails ativos, vigência e severidade; `allowed` com evidência fraca não basta para certificar claim.
4. Registrar público conhecido e lacunas agregadas, sem dados pessoais.
5. Confrontar com a ficha canônica do produto e registrar conflitos.
6. Alterar registro operacional somente no escopo autorizado, preservando versão; enriquecer o vault com interpretação e fonte.

### Lacunas confirmadas

Não há contexto ativo dos outros três cartões na consulta. Os sete guardrails do +amigo não possuem URL de fonte preenchida. Cobertura familiar do Você Bem está `allowed` com evidência baseada em peça antiga; o percentual/cobertura também possui regra de revisão. Falta confirmação comercial específica antes de usar a abrangência completa. Responsável nominal e tamanho atualizado da audiência não foram recuperados nesta revisão.

O sync da planilha mencionado abaixo continua **roadmap**: a presença de campos `source` não demonstra um sincronizador implantado.

`Dicionario_Produtos_Afinz_v3.xlsx` (aba `Beneficios` + docs de produto) é a verdade para benefícios e vigência. O sync `gaas-produto-benefits-sync` (roadmap) só toca linhas com `source = 'xlsx'`. Uma linha editada na tela vira `source = 'gaas'` e fica imune ao sync até alguém mandar "voltar a seguir a planilha".

## Relacionado

- [[Enciclopedia-Servicos-Growth]] · [[Briefing-e-Regua-de-Aquisicao]] · [[Fontes-e-Proveniencia-Growth]]

- [[Fabrica-de-Emails-GaaS]] — a aba onde a ficha vive
- [[Beneficios-e-Vigencia]] — o esquema de benefício com vigência (fonte de verdade)
- [[Pode-Dizer-Nao-Pode-Dizer]] — proibições por produto
- [[Dicionario-de-Produtos]] — os quatro cartões
- [[Emails-Dinamicos-SFMC]] · [[Cartao-Amigo-Afinz-Visa]]
