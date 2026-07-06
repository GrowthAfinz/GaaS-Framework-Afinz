# Guia Prático: Testando o Sistema de Validação Progressiva

**Objetivo:** Testar manualmente a validação de campos mínimos e projeção progressiva

**Tempo Estimado:** 10-15 minutos

**Ambiente:** http://localhost:3003

---

## 📋 Checklist Rápido

- [ ] Servidor está rodando em http://localhost:3003
- [ ] DevTools aberto (F12)
- [ ] Console aberta (ver logs)
- [ ] Tab "Launch" ativa
- [ ] Modal "Programar Disparo" aberto

---

## 🧪 TESTE 1: Modal Vazio (Insufficient)

### Pré-requisitos
- Modal aberto
- Nenhum campo preenchido

### Ações

1. **Observar o Bloco 5 (Projeção IA)**
   - Procure pelo box com borda indigo
   - Deve mostrar um painel vazio com aviso amarelo

### Verificações

| Item | Esperado | Status |
|------|----------|--------|
| **Footer** | `⚠️ Preencha BU, Campanha, Canal, Volume` | ☐ OK |
| **Cor** | Fundo amarelo/amber | ☐ OK |
| **Métricas** | Não visíveis | ☐ OK |
| **Console** | Log "Aguardando campos mínimos" | ☐ OK |

### Console Details
```
Abra Console e procure por:
[AI Projection] Aguardando campos mínimos
{
  faltam: {
    bu: true,
    segmento: true,
    canal: true,
    baseVolume: true
  }
}
```

---

## 🧪 TESTE 2: Adicionar BU

### Ações

1. **Bloco 1 - Identification:**
   - Clique no campo **BU**
   - Selecione `B2C`

### Verificações

| Item | Esperado | Status |
|------|----------|--------|
| **Footer** | `⚠️ Preencha Campanha, Canal, Volume` | ☐ OK |
| **Campos Faltando** | 3 (Campanha, Canal, Volume) | ☐ OK |
| **Console** | Log atualizado | ☐ OK |

### Console Details
```
faltam: {
  bu: false,
  segmento: true,  ← agora false
  canal: true,
  baseVolume: true
}
```

---

## 🧪 TESTE 3: Adicionar Campanha

### Ações

1. **Bloco 1 - Identification:**
   - Clique no campo **CAMPANHA**
   - Digite ou selecione `CRM`

### Verificações

| Item | Esperado | Status |
|------|----------|--------|
| **Footer** | `⚠️ Preencha Canal, Volume` | ☐ OK |
| **Campos Faltando** | 2 (Canal, Volume) | ☐ OK |

---

## 🧪 TESTE 4: Adicionar Canal (Ainda Insuficiente!)

### Ações

1. **Bloco 1 - Identification:**
   - Clique no campo **CANAL**
   - Selecione `WhatsApp`

### Verificações

| Item | Esperado | Status |
|------|----------|--------|
| **Footer** | `⚠️ Preencha Volume` | ☐ OK |
| **Único Faltando** | Volume | ☐ OK |
| **Custo Canal** | R$ 0,420 (auto-preenchido) | ☐ OK |

### Console Details
```
Observe: Canal foi adicionado ao log, mas ainda insuficiente
faltam: {
  bu: false,
  segmento: false,
  canal: false,
  baseVolume: true  ← ÚLTIMO BLOQUEIO!
}
```

---

## 🧪 TESTE 5: Adicionar Volume (DESBLOQUEIO!)

### Ações

1. **Bloco 4 - Investment:**
   - Clique no campo **VOLUME**
   - Digite `7000`

### Verificações

| Item | Esperado | Status |
|------|----------|--------|
| **Readiness** | Estado muda para 'partial' | ☐ OK |
| **Footer** | `📊 Projeções básicas. Adicione Oferta e Jornada` | ☐ OK |
| **Cor Badge** | Azul | ☐ OK |
| **Métricas Aparecem** | Grid 3×3 com valores | ☐ OK |
| **Sample Size** | `Baseado em X disparos similares` | ☐ OK |

### Console Details
```
[AIOrchestrator] Matching Results
{
  totalMatches: 451,
  selectedLevel: 'medium' ou 'high',
  selectedMatches: 12-50,
  byLevel: { exact: 0, high: 12, medium: 143, ... }
}

[AI Projection] Projeções computadas
{
  readiness: 'partial',
  totalMatches: 12-50,
  confidence: 60-75%
}
```

### Valores Esperados

| Métrica | Valor Esperado | Tolerância |
|---------|----------------|------------|
| Volume | 7000 | Exato |
| Tx Conv | 2.0-5.0% | ±1% |
| Base Acion | 5400-5600 | ~78% do volume |
| Propostas | 140-350 | Volume × Tx Conv |
| Aprovados | 90-230 | Propostas × 0.65 |
| Cartões | 77-195 | Aprovados × 0.85 |
| CAC | R$ 15-40 | Custo / Cartões |
| Tx Entrega | 70-85% | ~80% típico |
| Tx Abertura | 25-40% | ~30% típico |

### Custo Esperado
```
Volume: 7000
C.U. Canal (WhatsApp): R$ 0,420
Custo Total Canal: 7000 × 0,420 = R$ 2.940,00

Bloco 4:
- C.U. Canal: R$ 0,420 ✅
- Custo Total Canal: R$ 2.940,00 ✅
- Custo Total Campanha: R$ 2.940,00 (sem oferta yet)
```

---

## 🧪 TESTE 6: Adicionar Oferta (Melhora Confiança)

### Ações

1. **Bloco 3 - Product & Offer:**
   - Clique em **OFERTA**
   - Selecione `Vibe`

### Verificações

| Item | Esperado | Status |
|------|----------|--------|
| **Readiness** | Muda para 'good' | ☐ OK |
| **Footer** | `📊 Projeções com boa confiança` | ☐ OK |
| **Cor Badge** | Verde (emerald) | ☐ OK |
| **Confidence** | Aumenta para 70-80% | ☐ OK |
| **Tx Conv** | Pode aumentar (Vibe melhora) | ☐ OK |
| **CAC** | Recalculado com custo oferta | ☐ OK |

### Console Details
```
[AI Projection] Projeções computadas
{
  readiness: 'good',  ← mudou de 'partial'
  confidence: 75-82%  ← aumentou
}
```

### Custo Esperado Atualizado
```
C.U. Oferta (Vibe): R$ 2,00
Custo Total Oferta: 7000 × 2,00 = R$ 14.000,00
Custo Total Campanha: R$ 2.940 + R$ 14.000 = R$ 16.940,00
```

---

## 🧪 TESTE 7: Adicionar Jornada (Melhora Mais)

### Ações

1. **Bloco 1 - Identification:**
   - Clique em **JORNADA**
   - Selecione uma jornada (ex: `Aquisição` ou `Retenção`)

### Verificações

| Item | Esperado | Status |
|------|----------|--------|
| **Readiness** | Pode mover para 'excellent' (se 3 importanti) | ☐ OK |
| **Confidence** | Aumenta mais | ☐ OK |
| **Sample Size** | Pode diminuir (matching mais específico) | ☐ OK |

---

## 🧪 TESTE 8: Adicionar Perfil Crédito

### Ações

1. **Bloco 3 - Product & Offer:**
   - Clique em **PERFIL CRÉDITO**
   - Selecione um perfil (ex: `Whitelist`)

### Verificações

| Item | Esperado | Status |
|------|----------|--------|
| **Readiness** | 'excellent' (agora tem 3+ importantes) | ☐ OK |
| **Footer** | `📊 Projeções de alta precisão` | ☐ OK |
| **Cor Badge** | Verde esmeralda (mais escuro) | ☐ OK |
| **Confidence** | 85-95% | ☐ OK |

---

## 🧪 TESTE 9: Verificar Transição Completa

### Objetivo
Ver a sequência completa de mudanças de estado

### Ações (em sequência)

1. **Estado Inicial:** `insufficient` (modal vazio)
   - Footer: warning amarelo

2. **Após BU:** `insufficient`
   - Faltando: Campanha, Canal, Volume

3. **Após Campanha:** `insufficient`
   - Faltando: Canal, Volume

4. **Após Canal:** `insufficient`
   - Faltando: Volume (último bloqueio!)

5. **Após Volume:** `partial` ✅ **DESBLOQUEIO!**
   - Badge azul aparece
   - Métricas aparecem

6. **Após Oferta:** `good`
   - Badge muda para verde
   - Sample size pode mudar

7. **Após Jornada + Perfil:** `excellent`
   - Badge verde esmeralda
   - Projeções mais precisas

### Verificações Finais

| Transição | Console Log | Footer Badge |
|-----------|-------------|--------------|
| Vazio → BU | "Aguardando" | "⚠️ Campanha, Canal, Volume" |
| BU → Campanha | "Aguardando" | "⚠️ Canal, Volume" |
| Campanha → Canal | "Aguardando" | "⚠️ Volume" |
| Canal → Volume | "Projeções computadas" | "📊 Parcial" (azul) |
| Volume → Oferta | "Projeções computadas" | "📊 Boa" (verde) |
| Oferta → Jornada | "Projeções computadas" | "📊 Excelente" (esmeralda) |

---

## 🧪 TESTE 10: Verificar Precisão de Cálculos

### Validar CAC

**Cenário:**
- Volume: 7000
- Canal: WhatsApp (R$ 0,420/unidade)
- Oferta: Vibe (R$ 2,00/unidade)
- Tx Conv: 3.5%
- Taxa Aprovação: 65%
- Taxa Finalização: 85%

**Cálculos Esperados:**
```
Propostas = 7000 × 3.5% = 245
Aprovados = 245 × 0.65 = 159
Cartões = 159 × 0.85 = 135

Custo Total = (7000 × 0.420) + (7000 × 2.00)
            = 2.940 + 14.000
            = 16.940

CAC = 16.940 / 135 = R$ 125,48
```

**Verificações:**
```
Verificar Bloco 5:
- Cartões Gerados: ~135 ☐
- CAC: ~R$ 125 ☐

Verificar Bloco 4:
- Volume: 7000 ☐
- C.U. Canal: R$ 0,420 ☐
- C.U. Oferta: R$ 2,00 ☐
- Custo Total Canal: R$ 2.940,00 ☐
- Custo Total Oferta: R$ 14.000,00 ☐
- Custo Total Campanha: R$ 16.940,00 ☐
```

---

## 🧪 TESTE 11: Validar Matching

### Console Analysis

**Abra o console e procure:**

```
[AIOrchestrator] Matching Results
{
  totalMatches: ???,        ← Quantos matches encontrou
  selectedLevel: 'high',    ← Nível de matching (exact > high > medium > low > fallback)
  selectedMatches: ???,     ← Quantos foram selecionados
  byLevel: {
    exact: 0,      ← Exato match (100 compatível)
    high: 12,      ← High match (70-90%)
    medium: 143,   ← Medium match (50-70%)
    low: 296,      ← Low match (30-50%)
    fallback: 0    ← Fallback (< 30%)
  }
}
```

**Interpretação:**

| selectedLevel | Significado | Confiança |
|---------------|-------------|-----------|
| exact | Matching perfeito (raríssimo) | 95%+ |
| high | Muito bom matching | 85-90% |
| medium | Bom matching | 70-75% |
| low | Matching fraco | 50-60% |
| fallback | Muito fraco (pior caso) | < 40% |

**Benchmark Esperado:**
- Para BU + Segmento + Canal: `high` ou `medium`
- Sample selecionado: 10-50 matches
- Total histórico: 400-500 activities

---

## 🧪 TESTE 12: Testar Edge Cases

### Case 1: Volume = 0

**Ações:**
1. Preencha todos os campos
2. Volume: `0`

**Esperado:**
- ❌ Bloqueado (insufficient)
- ✅ Footer: "⚠️ Preencha Volume"

### Case 2: Volume Negativo

**Ações:**
1. Volume: `-100`

**Esperado:**
- ❌ Bloqueado (insufficient)
- Número negativo não é válido

### Case 3: Volume Muito Alto

**Ações:**
1. Volume: `1000000`

**Esperado:**
- ✅ Projeta (não há limite superior)
- Métricas absolutas muito altas
- CAC pode ser muito baixo

### Case 4: Limpar Volume

**Ações:**
1. Preencha Volume: `7000` → projeções aparecem
2. Delete o volume (deixe vazio)

**Esperado:**
- ✅ Projeções desaparecem
- ✅ Volta para insufficient
- ✅ Footer mostra warning

### Case 5: Adicionar/Remover Oferta

**Ações:**
1. Preencha campos mínimos → `partial`
2. Adicione Oferta → `good`
3. Remova Oferta → volta para `partial`

**Esperado:**
- ✅ Readiness muda dinamicamente
- ✅ Projeções atualizam

---

## 🧪 TESTE 13: Performance

### Objetivo
Verificar se o sistema responde rápido

### Ações

1. **Preencher Volume (primeira vez)**
   - Marca: Momento 0
   - Espera projeções aparecerem
   - Marca: Momento 1
   - **Tempo Esperado:** 500-1500ms (primeiro load + match + project)

2. **Mudar Oferta**
   - Marca: Momento A
   - Seleciona outra Oferta
   - Marca: Momento B
   - **Tempo Esperado:** 50-200ms (só re-projection, sem re-init)

3. **Mudar Jornada**
   - Marca: Momento X
   - Seleciona outra Jornada
   - Marca: Momento Y
   - **Tempo Esperado:** 50-200ms

### Performance Checklist

| Operação | Esperado | Status |
|----------|----------|--------|
| Primeiro Load | < 1.5s | ☐ |
| Re-projection | < 200ms | ☐ |
| UI Responsiva | Sem travamento | ☐ |
| Console Sem Erros | Nenhum erro | ☐ |

---

## 📊 Relatório de Testes

### Template para Documentar Resultados

```
DATA: _______________
TESTER: _____________

TESTES REALIZADOS:
☐ Teste 1: Modal Vazio
☐ Teste 2: Adicionar BU
☐ Teste 3: Adicionar Campanha
☐ Teste 4: Adicionar Canal
☐ Teste 5: Adicionar Volume
☐ Teste 6: Adicionar Oferta
☐ Teste 7: Adicionar Jornada
☐ Teste 8: Adicionar Perfil
☐ Teste 9: Transição Completa
☐ Teste 10: Precisão de Cálculos
☐ Teste 11: Validar Matching
☐ Teste 12: Edge Cases
☐ Teste 13: Performance

PROBLEMAS ENCONTRADOS:
[ ] Nenhum
[ ] Menor (UI/UX)
[ ] Crítico (Lógica)

Descrever:
_________________________________
_________________________________

NOTAS:
_________________________________
_________________________________

APROVAÇÃO:
☐ Tudo OK - Sistema pronto
☐ Problemas - Necessita correção
```

---

## 🎯 Sucesso!

Se todos os testes passarem ✅, o sistema está funcionando corretamente!

**Proximas Passos:**
1. Rodar em produção
2. Monitorar logs de erros
3. Coletar feedback dos usuários
4. Iterar baseado em uso real

---

**Fim do Guia Prático**
