# Referencia: Services

**Diretorio:** `src/services/`
**Total:** 13 Services

---

## Core Services

### `activityService.ts`
Gerenciador principal de entidades de atividade.
- `getAll()`: Busca todas as atividades.
- `save(activity)`: Cria ou atualiza.
- `syncFrameworkActivities()`: Sincroniza dados importados do CSV para a tabela principal.
- `delete(id)`: Remove uma atividade.

### `dataService.ts`
Camada de abstracao de dados gerais.
- `fetchB2CData()`: Busca metricas B2C diarias.
- `fetchPaidMediaData()`: Busca dados de midia paga.
- `upsertGoal()` / `getGoals()`: Gerencia metas.

### `storageService.ts`
Interacao com Supabase Storage.
- `uploadFile(file, path)`: Faz upload de arquivos.
- `downloadFile(path)`: Recupera URL de download.
- `deleteFile(path)`: Remove arquivo.
- `listFiles(folder)`: Lista conteudo de pasta.

### `versionService.ts`
Orquestra o versionamento de dados.
- `createVersion(file, metadata)`: Cria nova versao (BD + Storage).
- `activateVersion(id)`: Define versao ativa e dispara sync.
- `listVersions()`: Historico completo.

### `supabaseClient.ts`
Instancia singleton do cliente Supabase.
- Configura URL e Anon Key.
- Expoe o cliente tipado para uso nos outros services.

---

## ML Services (Pipeline AI)

### `ml/AIOrchestrator.ts`
Facade para o sistema de ML.
- Unifica chamadas para os engines de predicao e similaridade.

### `ml/dataProcessor.ts`
ETL para dados de ML.
- Prepara features.
- Normaliza valores.

### `ml/similarityEngine.ts`
Calculo de similaridade vetorial/atibutos.
- Implementa logica de distancia entre campanhas.

### `ml/predictionEngine.ts`
Modelos preditivos.
- Regressao e estatistica basica para previsoes.

### `ml/causalAnalyzer.ts`
Analise de causa-raiz.
- Identifica drivers de performance.

### `ml/explanationGenerator.ts`
NLG (Natural Language Generation).
- Gera textos explicativos para os insights.

---

## Padrao de Implementacao

Todos os services seguem o padrao singleton ou modulo exportado, com tratamento de erros padronizado.

```typescript
// Exemplo de metodo padrao
export const activityService = {
  async getAll(): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*');
      
      if (error) throw error;
      return mapDataToModel(data);
    } catch (e) {
      console.error('Error fetching activities:', e);
      return [];
    }
  }
};
```
