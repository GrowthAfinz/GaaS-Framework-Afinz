# Ficha do produto

Fonte: Plano de Comunicação do GaaS (ficha de produto e guardrails ativos). É a única fonte de fatos:
todo número, prazo, percentual ou benefício do e-mail precisa estar aqui. `validar_input.py` confere
com o mesmo texto que o GaaS usa na importação.

## +amigo (Plurix)

**Proposta de valor:** Um cartão Visa que faz o supermercado render mais e vale fora dele também.

**Público:** Topo de funil das 6 redes Plurix: EXCLUSIVAMENTE membros do Clube +amigo (regra de 02/10/2026, vale também para as réguas de topo de Dia e Bem Barato). Já compram nas lojas e já usam o Clube, tratar o Clube como algo que a pessoa já tem, nunca como novidade. Não pediram o cartão, não têm limite pré-aprovado e não demonstraram interesse. Estar no Clube não é requisito para pedir o cartão; a regra é de audiência da régua. Parte da base tem limite pré-aprovado: para essas pessoas, a faixa com o valor aparece em todos os e-mails do template V10.

**Tom de voz:** Direto e concreto. Fala de preço, de carrinho e do dia a dia, não de crédito nem de banco.

**Marca e redes:** Marca do programa, comum às 6 redes. Amigão, Boa, Paraná e Avenida assinam com o próprio nome e rodapé. Compre Mais e Superpão foram adquiridas e estão em transição de marca: comunicam só como +amigo até o nome novo ser definido.

### Diferenciais

- A partir de +5% em produtos selecionados (categorias variam por rede; carnes como exemplo)
- Até 40 dias para pagar
- É um cartão Visa, aceito no Brasil e no exterior
- Programa Você Bem: até 70% em consultas e exames (validar com o jurídico)
- Cartão virtual no app após aprovação
- Ofertas exclusivas do pool para quem tem o cartão (bloco 3 do V10)

### Benefícios e regras de citação

"Pode": cite como está. "Cuidado": cite seguindo a regra. "Checar": não cite sem confirmar com o analista.
"Não": nunca cite.

| Tipo | Benefício ou regra | Como citar | Citação | Valor exato | Severidade |
|---|---|---|---|---|---|
| benefit | Cartão virtual após aprovação | Se aprovado, o cartão virtual aparece no app para usar. Sempre condicionar à aprovação (sujeito a análise de crédito). | pode |   | advisory |
| eligibility | Cobertura familiar do Você Bem | Titular, cônjuge, filhos até 30 anos, pais e sogros. Sem carência e sem limite de uso. Citar sempre completo, nunca parcial. | pode |   | advisory |
| tone | Compre Mais e Superpão, redes em transição de marca | Não citar "Compre Mais" nem "Superpão" em assunto, pré-cabeçalho, copy, arte ou rodapé. Essas duas redes comunicam apenas como +amigo, em todos os 8 e-mails da régua, até o nome novo ser definido. As outras quatro, Amigão, Boa Supermercados, Paraná e Supermercados Avenida, seguem assinando com o próprio nome e com o rodapé da rede. | nao |   | hard_block |
| prohibited | Programa de pontos | Nenhuma peça pode mencionar acúmulo de pontos, resgate, vale compras por pontuação ou recompensa por uso. | nao |   | hard_block |
| legal | Sujeito a análise de crédito | Toda peça que convida a pedir o cartão precisa trazer o aviso na nota legal. | pode |   | hard_block |
| benefit | Até 40 dias para pagar | Sempre com o “até”: o prazo depende da data da compra e do vencimento da fatura. Nunca prometer 40 dias fixos. | cuidado |   | requires_review |
| claim | Categorias do +5% variam por rede | A copy é a mesma para as 6 redes: dizer só “a partir de +5% em produtos selecionados”, com carnes como exemplo. As categorias de cada rede ficam na imagem de benefícios (Boa: açougue e hortifrúti; Superpão: carnes e hortifrúti; Compre Mais e Avenida: carnes e básicos; Amigão e Paraná a confirmar). | cuidado |   | requires_review |
| claim | Comparação de preço | Só pode ser usado com aviso explícito de simulação ilustrativa e com o preço validado pela rede. O valor varia por bandeira. | pode |   | requires_review |
| claim | Limite pré-aprovado | Só pode citar limite quando o CPF tiver LIMITE preenchido na base (pré-aprovado). No template PLURIX V10 isso é automático: a faixa com o valor real aparece em todos os e-mails para quem tem limite. Para quem não tem, nenhuma peça pode prometer limite, aprovação ou valor. A nota legal de pré-aprovação precisa da validação do jurídico. | cuidado |   | requires_review |
| claim | Ofertas exclusivas do pool (bloco 3) | O bloco 3 do V10 mostra a oferta do dia do pool de ofertas da rede, em tom publicitário: “a partir de” o menor preço do dia, “em cidades e regiões participantes”, com a validade visível. O botão leva ao pedido do cartão. Não usar o texto legal regional da oferta. | cuidado |   | requires_review |
| benefit | Você Bem, até 70% | O percentual de até 70% e a lista de cobertura precisam de validação jurídica antes de virar copy. | pode |   | requires_review |