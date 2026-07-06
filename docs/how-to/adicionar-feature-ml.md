# Como adicionar uma feature de ML

1. Os serviços de ML ficam em `src/services/ml/`
2. `AIOrchestrator` coordena o pipeline
3. Novas features devem seguir o padrão similarity/prediction/explanation
4. Atualizar o hook `useFieldProjection` para integração com o formulário
