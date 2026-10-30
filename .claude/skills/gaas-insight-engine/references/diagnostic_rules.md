# Regras de Diagnóstico — GaaS Insight Engine

Fonte: nota `Dossie-Mestre-Operacao-CRM-Midia` do Vault Obsidian (AFINZ_GAAS_ONTOLOGY.md).
Estas regras são DURAS. Insights que as violem devem ser descartados antes da publicação.

## 1. Narrativa obrigatória

Todo insight segue a cadeia: **Sinal → Impacto → Causa provável → Evidência → Ação → Confiança**

- **Sinal**: o que mudou ou está fora do padrão (1 frase, com o número central)
- **Impacto**: volume/R$/meta em jogo, sempre quantificado a partir do evidence pack
- **Causa provável**: hipótese SEM declarar causalidade — usar "provável", "candidata a causa". Correlação não é causa.
- **Evidência**: números do pack citados literalmente
- **Ação**: reversível, mensurável, com critério de sucesso explícito (campo `criterio_sucesso`)
- **Confiança**: vem pré-calculada do evidence pack (volume de execução). NUNCA alterar.

## 2. Motor de diagnóstico (sinal → diagnóstico inicial → ação)

| Sinal | Diagnóstico inicial | Ação |
|---|---|---|
| Fonte atrasada | falha de coleta/ingestão | corrigir fonte antes de concluir qualquer coisa |
| Disparos caem e taxas ficam estáveis | volume/execução | revisar calendário e base |
| Entrega cai | base, canal ou fornecedor | conferir rejeições e operação |
| Abertura/CTR cai | criativo, oferta ou saturação | revisar e testar variação |
| Propostas caem com engajamento estável | fricção pós-clique | investigar jornada |
| Aprovação cai | mix ou qualidade do público | decompor por segmento e perfil |
| Conversão cai com aprovação estável | finalização | revisar fluxo e follow-up |
| CAC sobe por custo | mix mais caro | ajustar canal e orçamento |
| CAC sobe por queda de cartões | deterioração do funil | localizar a etapa que quebrou |
| Frequência sobe e CTR cai | saturação provável | renovar criativo / reduzir pressão |
| Meta abaixo do ritmo | produção insuficiente | priorizar por impacto esperado |
| Segmento eficiente perde volume | oportunidade não explorada | recuperar cobertura |
| Canal zerado em segmento forte | lacuna de cobertura | testar canal de baixo custo no bloco |

## 3. Severidade (por critério material, NUNCA por % isolado)

| Severidade | Critério |
|---|---|
| `critico` | fonte principal indisponível, produção zerada, risco material de meta, ou lacuna estrutural no maior ativo da operação |
| `alto` | deterioração consistente com impacto elevado, ou oportunidade de grande magnitude com evidência forte |
| `medio` | mudança material localizada ou reversível; aprendizado a documentar |
| `baixo` | oscilação pequena, baixa amostra, ou item informativo de monitoramento |

Variação de 15% abre investigação mas NÃO define severidade. Pesar: impacto absoluto, meta, amostra, recorrência, baseline, fonte.

## 4. Confiança (calculada em código — volume de execução)

| Confiança | Condição |
|---|---|
| `alta` | ≥10 disparos E ≥10k de base acionável na célula analisada |
| `media` | ≥3 disparos |
| `baixa` | abaixo disso, ou comparação correlacional |

Regra da Ontologia-v2: confiança vem do volume de EXECUÇÃO, não de conversão — conversão zero é resultado válido.

## 5. Priorização

`prioridade = impacto(0-10) × urgência(0-3) × confiança(1-3) / esforço(1-3)`

- confiança: alta=3, media=2, baixa=1 (vem do pack)
- impacto: magnitude em cartões/R$ relativa à operação
- urgência: 3 = perda ativa acontecendo agora; 2 = janela de captura limitada; 1 = estrutural sem prazo
- esforço: 1 = ajuste de régua/configuração; 2 = mudança de processo; 3 = projeto/dependência externa
- Justificar impacto/urgência/esforço em 1 linha no campo `evidencia.priorizacao`

## 6. Guardrails (violação = descartar o insight)

1. NUNCA comparar aquisição fria com meio de funil no mesmo benchmark (conversão difere ~4x). Todo gargalo de funil é calculado DENTRO da mesma etapa de aquisição.
2. Conversão zero é resultado válido, não dado ausente.
3. Não declarar causalidade baseada só em correlação.
4. Não usar média geral sem decompor o mix (números do pack já são ponderados sum/sum).
5. CAC subindo: SEMPRE verificar a decomposição (efeito custo vs efeito cartões) antes de diagnosticar.
6. Ausência de dado não significa ausência de produção — sinalizar como qualidade de dado, não como queda.
7. Não recomendar escala com coleta incompleta.
8. Não otimizar só CAC sacrificando volume — a função objetivo é CAC ótimo (rentabilidade), não CAC mínimo.
9. Toda ação tem dono implícito (operator owner), prazo implícito (próxima safra) e critério de sucesso EXPLÍCITO.

## 7. Limites de output

- Máximo 12 insights por run. Se houver mais sinais, cortar pelos de menor prioridade.
- Insights de severidade `baixo`: máximo 2 por run (anti-ruído).
- Cada insight referencia APENAS números presentes no evidence pack.
