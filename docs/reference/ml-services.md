# Referencia: Servicos de ML e AI

**Modulo:** `src/services/ml`
**Pipeline:** AIOrchestrator
**Finalidade:** Projecoes, recomendacoes e analise causal

---

## Arquitetura do Pipeline

O sistema utiliza um pipeline de ML orquestrado que processa dados historicos para gerar predicoes em tempo real.

```
Request (Dispatch Modal)
       │
       ▼
AIOrchestrator
       │
       │ (1. Pre-processamento)
       ├─► dataProcessor
       │
       │ (2. Busca de Similaridade)
       ├─► similarityEngine
       │
       │ (3. Predicao de KPIs)
       ├─► predictionEngine
       │
       │ (4. Analise Causal)
       ├─► causalAnalyzer
       │
       │ (5. Explicacao)
       └─► explanationGenerator
               │
               ▼
        Response (Projecao JSON)
```

---

## Componentes Principais

### 1. `AIOrchestrator.ts`
Controlador central que coordena a execucao dos servicos de ML.

**Metodos:**
- `getFieldProjection(field, context)`: Gera projecao para um campo especifico durante o preenchimento do formulario.
- `getCampaignProjection(campaignData)`: Gera projecao completa para uma campanha configurada.

### 2. `dataProcessor.ts`
Responsavel pela limpeza e transformacao de dados.

**Funcionalidades:**
- Normalizacao de nomes de campanhas
- Tratamento de outliers
- Codificacao de variaveis categoricas (One-Hot Encoding simplificado)
- Preparacao de datasets para treino/inferencia

### 3. `similarityEngine.ts`
Encontra campanhas historicas similares a campanha atual.

**Algoritmo:**
- Utiliza **Cosseno de Similaridade** ou **Distancia Euclidiana** ponderada.
- Pesos ajustaveis por atributo (ex: Segmento tem peso maior que Dia da Semana).
- Retorna Top K campanhas mais parecidas.

### 4. `predictionEngine.ts`
Motor de inferencia para estimar KPIs futuros.

**Modelos:**
- **Media Ponderada por Similaridade:** Estima KPIs baseando-se na media das campanhas similares, ponderada pelo score de similaridade.
- **Regressao Linear (Simplificada):** Para tendencias temporais.

**KPIs Preditos:**
- Taxa de Entrega
- Taxa de Abertura
- Taxa de Clique
- Taxa de Conversao
- Volume de Cartoes
- CAC

### 5. `causalAnalyzer.ts`
Identifica fatores que influenciam positiva ou negativamente o resultado.

**Analise:**
- Compara a campanha atual com a media do cluster.
- Identifica desvios significativos em atributos chave (ex: "Horario 18:00 tem performance 20% superior").

### 6. `explanationGenerator.ts`
Traduz os resultados numericos para linguagem natural.

**Exemplo de Saida:**
> "Esta projecao baseia-se em 5 campanhas similares do ultimo semestre. O fator 'Canal: WhatsApp' contribui positivamente para a taxa de conversao estimada de 2.5%."

---

## Hooks de Integracao

### `useFieldProjection.ts`
Hook React que conecta a UI ao pipeline de ML.

**Uso:**
```typescript
const { projection, loading } = useFieldProjection(fieldName, formValues);
```
- Monitora mudancas no formulario.
- Debounce de requests (evita sobrecarga).
- Retorna objeto de projecao formatado para tooltips.

### `useRecommendationEngine.ts`
Hook para a aba "Orientador".

- Processa todo o historico em background.
- Gera scores de oportunidades.
- Ordena melhores combinacoes.

---

## Modelagem de Dados ML

### Input (Contexto)
```typescript
{
  bu: string;
  segmento: string;
  canal: string;
  jornada: string;
  dataHora: Date;
  oferta?: string;
}
```

### Output (Projecao)
```typescript
{
  predictedValue: number;
  confidence: number; // 0-100
  similarCampaigns: Activity[];
  factors: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    strength: number;
  }[];
  explanation: string;
}
```

---

## Configuracao e Tuning

Parametros ajustaveis em `src/config/mlConfig.ts`:
- `SIMILARITY_THRESHOLD`: Limiar minimo para considerar similar (ex: 0.7).
- `TOP_K_NEIGHBORS`: Numero de vizinhos a considerar (ex: 5).
- `WEIGHTS`: Pesos dos atributos na similaridade.

---

## Limitacoes Atuais

- Processamento rodando 100% no client-side (navegador).
- Baseado em estatistica descritiva e similaridade, nao em Deep Learning.
- Depende da qualidade e volume do historico disponivel no Supabase.
