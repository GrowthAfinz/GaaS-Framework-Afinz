---
tags: [editorial, contexto-ia, onboarding, governanca]
tipo: referencia
camada: meta
atualizado: 2026-10-02
status: confirmado
fonte: operador
---

# Padrão Editorial da Enciclopédia

**Definição:** contrato de profundidade das notas para ensinar pessoas novas e fornecer contexto verificável a IAs sobre os serviços internos de Growth.

## Propósito e público

Cada nota deve ser compreensível por si só e apontar para as fontes de aprofundamento. O leitor não precisa conhecer siglas, decisões antigas ou a estrutura do repositório. Explicar uma sigla no primeiro uso e distinguir conceitos próximos. Profundidade significa responder às dúvidas relevantes, com evidência; quantidade de texto não é critério de qualidade.

## Estrutura comum

1. Definição e propósito: o que é, qual problema resolve e quando usar.
2. Contexto: público, produto, lugar no fluxo e conceitos próximos.
3. Funcionamento: entradas, saídas, passos, dependências e responsabilidades.
4. Regras: escopo, condições, exceções, restrições e consequências.
5. Aplicação: exemplo datado ou sintético, checklist e recuperação de erros.
6. Medição: critério de conclusão e resultado, quando aplicável.
7. Evidências: fonte, data de corte, versão e o que foi de fato verificado.
8. Lacunas: o que falta, efeito no trabalho, fonte necessária e dono a confirmar.
9. Relações: pré-requisitos, regras usadas, exemplos e próximo passo por wikilink.

## Blocos específicos por tipo

| Tipo | Conteúdo indispensável |
|---|---|
| Produto | identidade, valor, público, benefício/condição, claims, objeções, tarifas a validar, marca e CTA |
| Serviço/processo | quando usar, entradas, entrega, procedimento, dono, critérios de conclusão e erros |
| Conceito/dimensão | definição, diferenças, exemplos, uso nos sistemas e limites |
| Entidade de dados | grão, chaves, origem, atualização, campos, joins, ausência e acesso |
| Engenharia | contrato, componentes, versão, operação, falhas e evidência de deploy |
| Performance/evidência | janela, cobertura, método, resultado, limitações e interpretação |
| Estratégia | decisão, premissas, hipótese, alternativas, teste e estado de implementação |

## Proveniência e atualização

Preservar o frontmatter existente e a compatibilidade do leitor. `atualizado` representa a revisão editorial. Acrescentar `revisado_em`, `publico` e outros campos apenas quando úteis, sem inventar responsável ou data de validação. Estados mistos devem ser explicados por seção: uma nota pode conter contrato confirmado e pendência comercial.

Uma regra tem um lugar canônico; outras notas explicam sua aplicação e apontam para ele. Histórico fica identificado como histórico. Não adicionar uma conclusão de “confirmado” a toda a nota só porque o texto foi revisado.

## Como registrar lacunas

Formato recomendado: **questão → impacto → evidência necessária → responsável ou dono a confirmar**. Exemplo: “Mensalidade aplicável à rede não validada → impede citar valor → contrato/tabela vigente → Produto, dono nominal a confirmar”. Informação faltante não vira zero, aprovação, gratuidade ou promessa.

## Critérios de qualidade

- Uma pessoa nova consegue explicar o assunto e localizar o próximo passo.
- Uma IA consegue distinguir regra vigente, exemplo, proposta e pendência.
- Um procedimento identifica entradas e condições de conclusão.
- Todo número vivo tem data e origem; toda alegação comercial tem escopo/condição.
- Links novos resolvem para alvo único; anexos permanecem identificados como arquivos locais.
- Nenhuma nota fabrica evidência para preencher uma seção.

## Relacionado

- [[Enciclopedia-Servicos-Growth]] · [[Fontes-e-Proveniencia-Growth]]
- [[Runbook-Vault-Vivo]] · [[Changelog-do-Vault]]
