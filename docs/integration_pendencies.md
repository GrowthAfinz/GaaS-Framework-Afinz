# Análise de Pendências na Integração de Dados do Media Analytics

Com base na arquitetura do sistema GaaS (Calendário Estratégico) e no diretório `paid-media-afinz`, identifiquei as seguintes pendências de integração e melhores práticas que precisam ser adequadas:

## 1. Divergência entre Storage vs Banco de Dados (Supabase)
Atualmente, o `PaidMediaAfinzApp.tsx` (linhas 36 a 62) sincroniza os relatórios do Meta Ads e Google Ads baixando o arquivo Excel mais recente de um **Bucket do Supabase (pasta 'media')** via `storageService`.
```typescript
const files = await storageService.listFiles('media');
const url = await storageService.getDownloadUrl('media/' + latestFile.name);
// Faz o Download e o Parse do Excel novamente no Client-Side
```

**Problema (Pendência):** 
O documento `SUPABASE_SCHEMA.md` define que deveria existir uma tabela especializada chamada `paid_media_metrics` no banco de dados para armazenar esses dados vitais de forma estruturada:
```sql
-- Tabela: paid_media_metrics
id (uuid), date (date), channel (text), campaign (text), objective (text), spend (numeric), impressions (int), clicks (int), conversions (int), cpa (numeric)
```
- **Falta o Post-Processing:** O arquivo é upado no Storage, mas **não há nenhuma rota ou Edge Function no backend que extraia as linhas desse Excel e salve na tabela relacional `paid_media_metrics`**.
- **Impacto na Performance:** Baixar o Excel inteiro e fazer o parser local no navegador toda vez que o usuário abre a aba (via `fileParser.ts`) custa performance e impede queries avançadas cruzando dados de CRM (`activities`) diretamente no banco.

## 2. Abordagem de Estado Global Fragmentada (Zustand)
No `useAppStore.ts`, foi criado o slot `paidMediaData` (linha 58), mas observando as entranhas do `FilterContext.tsx` do módulo:
```typescript
const { paidMediaData: rawDataFromStore, setPaidMediaData: setRawDataFromStore } = useAppStore();
```
**Problema (Pendência):**
Embora os dados vão para o Store Global após o parser local, a integração B2C vs Mídia (Cruzeamento) ainda não acontece nativamente sem o arquivo da nuvem. O `useAppStore` usa `persist` (IndexedDB), o que significa que o usuário que entra pode ver os dados da "última vez" misturados com a tentativa de re-sincronizar via Storage.
- Falta alterar a arquitetura do FileUpload: Em vez de apenas salvar o Excel no Bucket, deveria haver uma rotina que gravasse linha a linha na tabela `paid_media_metrics`.
- O Front-End deveria fazer um simples `SELECT * FROM paid_media_metrics WHERE date >= X` em vez de baixar o arquivo Excel.

## 3. Gestão de Metas Orçamentárias (`budgets` e `targets`)
O módulo Media Analytics permite criar orçamentos e metas, mas estes dados estão vivendo apenas no estado local/persistido:
```typescript
budgets: Budget[];
setBudgets: (bg: Budget[]) => void;
```
**Problema (Pendência):**
No `SUPABASE_SCHEMA.md` existe uma tabela `goals` que já cruza Cartões Gerados, Propostas e CAC Máximo. 
- Falta uma tabela (ou adição de colunas em `goals`) para acomodar `Spend_Max` (Orçamento) e Metas de `CPM/CTR/Conversions` para Mídia Paga, unificando a API de Orçamentos do aplicativo inteiro. Atualmente, se o usuário limpar o cache do navegador (IndexedDB), ele perde as metas de mídia configuradas no modal `CreateBudgetModal.tsx`.

## 4. O "Mapping" Condicional B2C vs Branding e Resultados vs Conversões
O novo `fileParser.ts` agora lida perfeitamente com a coluna "Resultados" transcrevendo-a para "Conversions" (quando a campanha for B2C ou Plurix).
**Pendência Futura de Data Quality:**
- Como a tabela do Facebook/Google pode vir com os cabeçalhos escritos ligeiramente diferentes (ex: `valor usado (brl)` vs `custo`), a manutenção do dicionário `METRICS_MAP` precisa de atenção constante.
- Se adotarmos a integração na tabela `paid_media_metrics`, o ideal é que esse Parse seja feito pelo Node.js numa function do Supabase. A function padronizará e fará Append (sem duplicar). Atualmente, a detecção de duplicidade é feita por "Fuzzy Logic" baseada em Spend no frontend (linha 218 do `fileParser.ts`). Isso é  frágil  se houver duas campanhas diferentes com exatamente o mesmo spend no mesmo dia.

## Plano de Ação Recomendado (Próximos Passos):
1. **Refatorar o Backend:** Criar/configurar a tabela `paid_media_metrics`.
2. **Atualizar `FileUpload.tsx`**: Quando a planilha for enviada, fazer o Parse local e enviar o Array JSON (batch insert) direto para a tabela `paid_media_metrics` via cliente Supabase, ao invés de salvar o Excel inteiro no Bucket.
3. **Mudar a Leitura:** Alterar o `PaidMediaAfinzApp.tsx` para não baixar o Excel via `storageService.getDownloadUrl()`, mas usar uma query rápida Supabase.
4. **Criar Tabela `paid_media_budgets`**: Para garantir persistência segura em banco do planejamento de metas e orçamentos inseridos lá na aba de Mídia.
