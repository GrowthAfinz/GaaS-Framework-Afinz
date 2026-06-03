# SPEC: Atualizador Inteligente grava disparo que já existe na base (duplicação)

> Spec pronta para execução por outra IA. **Já validada contra o código real** —
> nomes de funções, linhas e variáveis abaixo são reais (não suposições).
> Repo: `calendar-estrategico` · Branch: `main`

---

## 1. Sintoma observado

No modal "Review Sheet" do Atualizador Inteligente, um disparo que **já está
gravado na tabela `activities` do Supabase** aparece como candidato gravável.

Caso real reportado:

| Campo | Arquivo novo (CSV) | Já existe na base |
|---|---|---|
| Jornada | `JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_COPA_PAD_JUN26` | `JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_COPA_PAD_MAIO26` |
| Activity name / Taxonomia | `afz_car_vis_aqs_wpp_ngd_d9refmaio_pontual` | (idêntico) |
| Canal | `WhatsApp` | `WhatsApp` |
| Data de Disparo | `2026-05-29` | `2026-05-29` |

A jornada foi renomeada no SFMC (MAIO26 → JUN26), mas o disparo físico é o mesmo.
Hoje o sistema marca `conflict`, porém ainda permite aceitar/gravar como novo →
**risco de duplicar a linha em `activities`.**

---

## 2. Causa raiz (CONFIRMADA no código)

São **dois bugs independentes**, ambos no fluxo de candidato:

### Bug A — `matchedActivity` nunca é populado → persistência sempre faz INSERT

- `src/services/intelligentUpdateService.ts`
  - Linha 33: o payload tem o campo opcional `matchedActivity?: Activity`.
  - Linha 271 (`applyConfirmedActivityChanges`): decide UPDATE vs INSERT via
    `const activityId = asDbActivityId(candidate.matchedActivity);` — se houver id,
    faz UPDATE; senão INSERT.
  - Linha 395: mesma lógica no caminho de auditoria.
- `src/components/admin/IntelligentFrameworkUpdate.tsx`
  - `buildCandidate` (linha 759) **calcula** `historicalSignatureMatches` (linha 779)
    — ou seja, JÁ TEM em mãos a(s) activity(ies) existente(s) na base com a mesma
    assinatura — mas o objeto retornado (linhas 806-849) **NÃO inclui
    `matchedActivity`**.
  - Consequência: o candidato chega na persistência com `matchedActivity = undefined`
    → `asDbActivityId(undefined)` → `null` → **sempre INSERT**, mesmo para disparo
    que já existe.

### Bug B — disparo existente com MESMA família de jornada não é bloqueado

- Em `buildCandidate`, o conflito só dispara quando há jornada **diferente**:
  - `historicalJourneys` (linha 780) filtra com `!isSameJourneyFamily(...)`.
  - `renamedJourneyConflict = conflictJourneys.length > 0` (linha 789).
- A flag `duplicate` (linha 796-797) usa `duplicateCount = importedKeyCount.get(metric.key)`,
  que conta **duplicatas dentro do próprio arquivo** (`metric.key` = novelty key
  com jornada), **não** contra a base.
- Portanto: se o disparo já existe na base com a **mesma** jornada (reimport do mesmo
  período), `renamedJourneyConflict = false` e `duplicateCount <= 1` →
  pode ser classificado como `new`/`ready`/`review` e **reinserido**.

### Assinaturas relevantes (já existem, reaproveitar)

- `buildDispatchSignature(activityName, channel, date)` (linha ~382):
  `normalizeKey(activityName) | canonicalChannel(channel) | toDateKey(date)`.
  **Esta é a chave anti-renomeação correta** (não inclui jornada).
- `buildHistoryIndex` (linha 671) já cria `byDispatchSignature: Map<string, Activity[]>`
  (linha 691-692). Use-o — não precisa criar índice novo.
- `metric.dispatchSignature` já vem pronto em cada `MetricRow`.

---

## 3. Comportamento esperado

Quando `historyIndex.byDispatchSignature.get(metric.dispatchSignature)` retornar
ao menos uma activity (o disparo já existe na base):

1. **Sempre** setar `matchedActivity = historicalSignatureMatches[0]` no candidato.
2. **Nunca** permitir INSERT para esse candidato — somente UPDATE do registro existente.
3. Classificar status:
   - Jornada diferente (renomeação) → `conflict` (mantém comportamento atual de detecção),
     com `conflictReason = 'renamed_journey_existing_dispatch'`.
   - Jornada igual/mesma família → `duplicate` (novo: hoje não é detectado contra a base).
4. No modal, deixar explícito: "Disparo já existe na base" + jornada da base vs jornada
   do arquivo + métricas da base vs do arquivo.
5. Ações permitidas para esses casos:
   - `Ignorar`
   - `Atualizar métricas do registro existente` (UPDATE no `matchedActivity.id`)
   - (opcional) `Atualizar jornada canônica` — troca a jornada salva pela nova.
6. **Não copiável por padrão** no botão "Copiar linhas" (evita duplicar no Excel/framework).
   Só copiar se o usuário marcar "incluir existentes".

---

## 4. Mudanças técnicas (passo a passo)

### 4.1 `src/components/admin/IntelligentFrameworkUpdate.tsx`

**(a) Em `buildCandidate` (linha 759):** após a linha 789 (`renamedJourneyConflict`),
adicionar detecção de disparo existente:

```ts
// historicalSignatureMatches já existe (linha 779)
const existingDispatch = historicalSignatureMatches[0]; // disparo já na base (mesma activity+canal+data)
const existsInBase = Boolean(existingDispatch);
```

**(b) Ajustar a decisão de `status` (linhas 794-804).** Inserir, ANTES do teste de
`renamedJourneyConflict`, o tratamento de existência na base. Lógica final desejada
(ordem importa):

```ts
const status: CandidateStatus = missingCritical
    ? 'error'
    : duplicateCount > 1
        ? 'duplicate'
        : existsInBase
            ? (renamedJourneyConflict ? 'conflict' : 'duplicate')
            : renamedJourneyConflict
                ? 'conflict'
                : missingHumanSuggestion
                    ? 'new'
                    : averageConfidence >= 80 ? 'ready' : 'review';
```

**(c) No objeto retornado (linhas 806-849):**
- Adicionar `matchedActivity: existingDispatch` (será `undefined` quando não existir —
  comportamento correto).
- Ajustar `conflictReason`:
  ```ts
  conflictReason: existsInBase
      ? (renamedJourneyConflict ? 'renamed_journey_existing_dispatch' : 'existing_dispatch')
      : (renamedJourneyConflict ? 'activity_name_channel_date' : undefined),
  ```
- Ajustar `basis`/`suggestion`/`fieldToReview` para refletir "Disparo já existe na base"
  quando `existsInBase` (texto amigável; não quebrar os ramos existentes).

> **Conferir o type `UpdateCandidate`** (mesmo arquivo, perto da linha 82): garantir que
> ele inclui `matchedActivity?: Activity`. Se não tiver, adicionar. O type do payload no
> service (`intelligentUpdateService.ts:33`) já tem.

**(d) Garantir que `matchedActivity` é repassado** ao montar o payload enviado ao service
(procurar onde os candidatos viram `IntelligentUpdateCandidatePayload` antes de
`applyConfirmedActivityChanges`). Incluir `matchedActivity` no mapeamento.

**(e) "Copiar linhas" (TSV):** localizar a função de cópia (busca por `copiar`/`TSV`/
`clipboard` no arquivo) e excluir por padrão candidatos com
`status === 'duplicate'` ou `conflictReason` começando com `existing` /
`renamed_journey_existing`. Adicionar flag opcional "incluir existentes".

**(f) UX do Review Sheet:**
- Em `STATUS_LABEL` (já existe, usado na linha ~2110), garantir rótulo claro para
  `duplicate` quando vier da base: algo como "Já existe".
- No bloco de detalhe de `conflict` (linha ~2563), quando
  `conflictReason === 'renamed_journey_existing_dispatch'`, mostrar:
  jornada da base (`matchedActivity.jornada`) vs jornada do arquivo (`candidate.journey`),
  e o CTA principal deve ser **"Atualizar existente"** em vez de "Aceitar disparo".
- O botão de aceitar/gravar (linhas ~2273 e ~2643) já desabilita para `duplicate`/`error`/
  `ignored`. Manter `duplicate` desabilitado para insert; habilitar apenas a ação de
  UPDATE.

### 4.2 `src/services/intelligentUpdateService.ts`

- `applyConfirmedActivityChanges` (linha ~271): a lógica `asDbActivityId(candidate.matchedActivity)`
  já está correta. Com o Bug A corrigido (matchedActivity populado), ela passará a fazer
  UPDATE automaticamente. **Adicionar guarda defensiva**: se
  `candidate.conflictReason === 'renamed_journey_existing_dispatch'`, só aplicar quando
  `candidate.accepted === true` (aceite humano explícito) — nunca em lote automático.
- Garantir que candidatos `duplicate` (existentes, sem mudança) **não** entrem no INSERT
  nem no UPDATE em lote — devem ser no-op a menos que o usuário escolha atualizar métricas.

---

## 5. Caso de teste obrigatório

Entrada (CSV Dinâmica BI):
- Jornada: `JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_COPA_PAD_JUN26`
- Activity: `afz_car_vis_aqs_wpp_ngd_d9refmaio_pontual`
- Canal: `WhatsApp` · Data: `2026-05-29`

Base (`activities`) já contém o mesmo activity+canal+data com jornada `..._MAIO26`.

Resultado esperado:
- [ ] Candidato **NÃO** aparece como `new`/`ready`.
- [ ] Status = `conflict` com `conflictReason = 'renamed_journey_existing_dispatch'`.
- [ ] `matchedActivity` populado com o registro da base.
- [ ] **NÃO** copiável por padrão no "Copiar linhas".
- [ ] **NÃO** faz INSERT em `activities`.
- [ ] Se aprovado pelo usuário → faz UPDATE no `matchedActivity.id`.
- [ ] Modal mostra: "Disparo já existe na base" + jornada base vs arquivo.

Segundo caso (mesma jornada — reimport idêntico):
- Mesmo activity+canal+data, jornada igual → status `duplicate`, no-op por padrão.

---

## 6. Validação

```bash
npm run build   # sem erros TS
npm run dev     # subir, abrir Configurações > Atualização Inteligente
```
Arrastar um CSV pequeno contendo o caso de teste e conferir os checkboxes da seção 5.

## 7. Observação de performance (secundária, não bloqueia o fix)

Se o app travar ao arrastar CSV grande: o parsing/orquestração roda na main thread.
Considerar mover `processDinamicaBI` para um Web Worker (já existe `src/workers/`),
paginar a renderização de candidatos e evitar `setState` com payload gigante de uma vez.
Tratar como tarefa separada.
