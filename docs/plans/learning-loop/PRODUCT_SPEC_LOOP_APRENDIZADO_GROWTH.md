# Product Spec — Loop de aprendizado Growth

**Versão:** 0.1
**Data:** 2026-09-22
**Status:** contrato de produto para implementação incremental

## 1. Problema

O GaaS possui dados, diagnósticos e um pipeline editorial confiável, mas a experiência ainda termina cedo demais: o sistema mostra performance ou publica um relatório, sem transformar consistentemente o sinal em compromisso operacional, resultado verificado e conhecimento reutilizável.

Consequências:

- recomendações podem permanecer sem execução ou cobrança;
- resultados não retornam ao contexto que originou a decisão;
- acertos, fracassos e premissas inválidas não calibram decisões futuras;
- investigações semelhantes são repetidas;
- o Report Live aparenta ser o produto, quando é um output editorial do sistema.

## 2. Objetivo

Transformar sinais de CRM Aquisição, Mídia Paga e Originação B2C em decisões rastreáveis, acompanhar sua execução, verificar outcomes e devolver o aprendizado ao próximo ciclo de decisão.

## 3. Proposta de valor

> O Loop de aprendizado Growth mostra o que merece atenção, transforma recomendações em apostas acompanháveis, verifica o que aconteceu e faz o GaaS lembrar no próximo caso semelhante.

## 4. Públicos e frequência

| Público | Frequência | Trabalho principal |
|---|---:|---|
| Operador/analista de Growth | diária | revisar fila, assumir apostas, registrar execução |
| Especialista CRM/Mídia/B2C | diária/semanal | investigar evidência e contestar diagnóstico |
| Liderança funcional | semanal | acompanhar portfólio, outcomes e bloqueios |
| Executivo | mensal | consumir Report Live e aprendizados consolidados |

O usuário principal do primeiro lançamento é o operador/analista de Growth.

## 5. Escopo inicial

### Frentes

- CRM Aquisição;
- Mídia Paga;
- Originação B2C.

### Unidades de análise

- frente;
- BU;
- parceiro;
- campanha;
- jornada;
- segmento;
- canal;
- métrica;
- período;
- run do Report Live.

### Áreas do produto

- Fila;
- Apostas;
- Outcomes;
- Memória;
- Report Live.

## 6. Job to be done

> Quando o sistema detectar uma mudança relevante, quero entender rapidamente o impacto e a evidência, assumir uma decisão quando fizer sentido e ser lembrado de verificar o resultado, para que o time não repita investigações nem trate opinião como aprendizado.

## 7. Loop canônico

```text
Observar → Entender → Decidir → Agir → Verificar → Aprender → Reaplicar
```

Mapeamento para o produto:

| Etapa | Objeto/experiência |
|---|---|
| Observar | post sistêmico na Fila |
| Entender | evidência, impacto, causa provável e confiança |
| Decidir | criação de Aposta |
| Agir | checklist e registro de execução |
| Verificar | Outcome calculado e revisado |
| Aprender | memória materializada automaticamente |
| Reaplicar | memória recuperada em um novo sinal/aposta |

## 8. North Star e drivers

### North Star

**Taxa de loops fechados**

```text
apostas elegíveis com outcome revisado e aprendizado persistido
----------------------------------------------------------------
apostas aprovadas cuja janela de verificação terminou
```

### Drivers

- tempo de sinal até aposta;
- apostas com contrato de outcome completo;
- taxa de execução;
- outcomes avaliados no prazo;
- outcomes contestados;
- aprendizados reapresentados;
- aprendizados efetivamente reutilizados;
- decisões repetidas apesar de memória aplicável;
- itens bloqueados por qualidade de dados.

## 9. Princípios

1. **Decisão antes de visual.** Um bloco que não altera decisão é secundário.
2. **Sistema publica; pessoas decidem.** O feed é sistêmico, mas a aposta representa compromisso humano.
3. **Ausência não é zero.** Resultado não verificável continua sendo outcome válido.
4. **Expectativa antes do resultado.** A crença original não pode ser reescrita após o fato.
5. **Todo resultado ensina.** Sucesso, fracasso, inconclusão e premissa inválida entram na memória.
6. **Memória tem escopo e validade.** Uma observação não vira verdade universal.
7. **Report Live é output.** A operação do ciclo acontece no GaaS.
8. **Automatizar depois de explicar.** O sistema mostra regra, fonte, janela e confiança.

## 10. Experiência em dois minutos

Ao abrir o workspace, o operador deve conseguir responder:

1. O que exige atenção agora?
2. Qual impacto estimado?
3. Qual evidência sustenta o sinal?
4. Existe aprendizado anterior aplicável?
5. Qual ação o sistema propõe?
6. A decisão já foi assumida por alguém ou por algum time?
7. Quais outcomes estão vencidos ou bloqueados?

## 11. Não objetivos iniciais

- rede social humana;
- posts manuais no feed;
- curtidas ou reações;
- chat com toda a memória;
- banco vetorial;
- agente autônomo executando campanhas;
- construtor genérico de workflows;
- sistema completo de experimentos;
- nova arquitetura de autenticação ou permissões;
- reescrita do renderer do Report Live;
- causalidade automática a partir de correlação.

## 12. Critério de produto viável

O produto só demonstra valor quando um ciclo real completa:

```text
sinal sistêmico
→ aposta
→ execução
→ outcome
→ aprendizado
→ reutilização posterior
```

Uma tela pronta sem esse ciclo não constitui aceite.
