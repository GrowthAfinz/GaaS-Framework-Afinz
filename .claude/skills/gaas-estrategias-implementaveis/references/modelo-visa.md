# Como transferir o modelo Visa

## Fonte e interpretação

Referência: `05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md`. A versão deve ser conferida no início do trabalho. A correção de Pablo é explícita: a primeira nota é modelo de profundidade e narrativa, não só uma skin visual. As decisões de negócio de Visa não viram regras de outros produtos.

## O que aproveitar

| Camada Visa | Função do padrão | Transferência para outro projeto |
|---|---|---|
| Introdução e estado da operação | Define o mecanismo e o limite da evidência | Definir o objeto e distinguir desenho de implantação |
| Intenção estratégica | Liga regra e desenho à pergunta de negócio | Explicar resultado pretendido, público e escopo |
| Percurso completo | Preserva toda a lógica, inclusive caminhos sem envio | Mostrar regras, exclusões, retornos e resultado |
| Público e células | Define unidade, seleção, tratamento e controle | Explicar grão, precedência e alocação aplicáveis |
| Experiência editorial | Conecta seleção, conteúdo, intervalo e restrições | Documentar a experiência concreta quando existir |
| Mapa técnico | Identifica automações, atividades, passos e ordem | Usar nomes documentados, destinos e precedência |
| Fichas de DE | Permite preparar as estruturas e conferir o contrato | Campos, PK, tipos, nulidade, ação e origem |
| Fichas de atividades e SQL | Permite configurar e testar cada etapa | SQL disponível completo, configuração e conferências |
| Medição e validações | Distingue diagnóstico, conversão e efeito | Denominadores, janelas, provas e limitações |
| Fontes e decisões | Preserva rastreabilidade | Origem, data, mudanças e questões abertas |

O agrupamento PREPARAÇÃO/DISPARO da Visa é exemplo de automações com dependências. Não copiar seus nomes, percentuais de controle, critérios monetários, prazos, número de cards ou tarefas para Seguros.

## Anatomia do mapa técnico

- Container nomeia a automação ou a fase, com estado documental.
- Nó nomeia o passo/atividade e seu tipo ou destino.
- Setas mostram dependências reais. Atividades sequenciais não ficam no mesmo passo se o ambiente executa aquele passo em paralelo.
- Nós de dados têm nome e grão quando relevantes.
- Ramos de decisão exibem condições e destinos, inclusive descarte ou espera.
- Retornos explicam quem grava o estado, em qual entidade e para qual próximo ciclo.
- A ficha vinculada resolve o detalhe que não cabe legivelmente no nó.

## Exemplo de ficha, sem afirmar execução

Atividade documentada: Q_SEG_06_MOVIMENTO. Tipo: Query Activity. Desenho de origem: processos_seguros, passo 7 no documento de 04/11. Fontes: MAPA_SEGUROS e MAPA_SEGUROS_ONTEM. Destino: SEGUROS_MOVIMENTO_LOG. Ação documentada: Atualizar. Chave documentada: CPF + PRODUTO + DT_DETECCAO. Dependência: import → verificação de fonte → diff → snapshot, em passos separados. Primeira execução exige snapshot inicial. SQL e resultados esperados devem acompanhar a ficha. Implantação e compatibilidade com o desenho novo: a validar.

## Critério de qualidade

Se o nome de uma atividade aparece apenas no desenho, falta articulação. Se a ficha tem SQL sem origem, destino e ação, falta configuração. Se há um fluxo bonito que omite bloqueios/saídas, falta lógica. Se dados propostos aparecem como reais, falta precisão. Corrigir na camada apropriada, sem reduzir a profundidade das demais.
