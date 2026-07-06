# TAB: Campanhas (Framework)

**Rota:** `/framework`
**Componente Principal:** `FrameworkView.tsx`
**Categoria:** FRAMEWORK

---

## Overview

A aba Campanhas (Framework) e o editor de dados brutos do sistema. Permite visualizar, buscar, filtrar e editar os dados importados do Framework Growth. Inclui sistema de versionamento para controle de alteracoes.

---

## Features

- Visualizacao tabular de todos os dados
- Busca por texto em qualquer coluna
- Ordenacao por qualquer coluna
- Edicao inline de valores
- Versionamento de dados
- Historico de versoes
- Restauracao de versoes anteriores
- Download/export de versoes

---

## Arquitetura de Componentes

```
FrameworkView.tsx
├── SearchBar
├── ColumnSelector
│
├── DataTable
│   ├── TableHeader (sortable)
│   ├── TableRows
│   │   └── EditableCell
│   └── Pagination
│
├── VersionHistoryDrawer.tsx
│   ├── VersionList
│   │   └── VersionItem
│   └── VersionActions
│       ├── Restore
│       ├── Download
│       └── Delete
│
└── SaveVersionModal.tsx
    ├── VersionName
    ├── Description
    └── SaveButton
```

---

## Componentes Principais

### FrameworkView.tsx
Componente principal que gerencia a visualizacao e edicao de dados.

**Responsabilidades:**
- Renderizar tabela de dados
- Gerenciar busca e ordenacao
- Coordenar edicoes
- Integrar com versionamento

### DataTable
Tabela interativa com os dados do framework.

**Funcionalidades:**
- Scroll horizontal para todas as colunas
- Ordenacao ao clicar no header
- Celulas editaveis
- Highlight de busca

### VersionHistoryDrawer.tsx
Drawer lateral com historico de versoes.

**Informacoes por Versao:**
- Nome da versao
- Data de criacao
- Numero de linhas
- Descricao
- Status (ativa/inativa)

### SaveVersionModal.tsx
Modal para salvar nova versao.

**Campos:**
- Nome da versao (obrigatorio)
- Descricao (opcional)
- Checkbox: Ativar versao

---

## Sistema de Versionamento

### Conceito
Cada versao representa um snapshot dos dados em um momento. Permite:
- Reverter alteracoes indesejadas
- Comparar versoes
- Manter historico de mudancas

### Estrutura de Versao
```typescript
interface FrameworkVersion {
  id: string;
  filename: string;
  storage_path: string;
  row_count: number;
  is_active: boolean;
  description?: string;
  created_at: string;
}
```

### Operacoes

**Salvar Nova Versao:**
1. Faz upload do CSV atual para Storage
2. Cria registro na tabela framework_versions
3. Opcionalmente ativa a versao

**Ativar Versao:**
1. Desativa versao atual
2. Ativa versao selecionada
3. Sincroniza dados para tabela activities

**Restaurar Versao:**
1. Baixa arquivo do Storage
2. Processa CSV
3. Atualiza useAppStore
4. Marca como versao ativa

**Deletar Versao:**
1. Remove arquivo do Storage
2. Remove registro do banco
3. Nao permite deletar versao ativa

---

## Fluxo de Dados

```
CSV Upload (CSVUpload.tsx ou Storage)
         │
         ▼
useFrameworkData() processa
         │
         ▼
useAppStore.setFrameworkData()
         │
         ▼
FrameworkView renderiza tabela
         │
         ▼
User edita celula
         │
         ▼
EditableCell atualiza valor local
         │
         ▼
User clica "Salvar Versao"
         │
         ▼
SaveVersionModal coleta info
         │
         ▼
versionService.uploadVersion()
├─ Upload CSV para Storage
└─ Cria registro em framework_versions
         │
         ▼
Se "Ativar": activityService.syncFrameworkActivities()
         │
         ▼
VersionHistoryDrawer atualiza lista
```

---

## Hooks Utilizados

| Hook | Funcao |
|------|--------|
| `useFrameworkData` | Carrega dados do framework |
| `useVersionManager` | Gerencia versoes |
| `useAppStore` | Estado global |

---

## Casos de Uso

### 1. Buscar Campanha Especifica
1. Digitar texto na barra de busca
2. Tabela filtra linhas que contem o texto
3. Resultados destacados

### 2. Ordenar por Coluna
1. Clicar no header da coluna
2. Primeira vez: ordem ascendente
3. Segunda vez: ordem descendente
4. Terceira vez: sem ordenacao

### 3. Editar Valor
1. Clicar na celula
2. Celula entra em modo edicao
3. Alterar valor
4. Pressionar Enter ou clicar fora
5. Valor atualizado localmente

### 4. Salvar Versao
1. Fazer alteracoes desejadas
2. Clicar "Salvar Versao"
3. Informar nome e descricao
4. Marcar "Ativar" se desejado
5. Confirmar

### 5. Restaurar Versao Anterior
1. Abrir drawer de versoes
2. Localizar versao desejada
3. Clicar "Restaurar"
4. Confirmar acao
5. Dados restaurados

### 6. Exportar Versao
1. Abrir drawer de versoes
2. Clicar "Download" na versao
3. Arquivo CSV baixado

---

## Colunas do Framework

A tabela exibe todas as 41 colunas do Framework Growth:

**Identificacao:**
- Activity name / Taxonomia
- Data de Disparo
- Data Fim
- Disparado?

**Dimensoes:**
- BU
- Canal
- Segmento
- Parceiro
- Jornada
- Ordem de disparo
- Safra
- Perfil de Credito

**Ofertas:**
- Produto
- Oferta
- Promocional
- Oferta 2
- Promocional 2

**Metricas Base:**
- Base Total
- Base Acionavel
- % Otimizacao de base

**Financeiro:**
- Custo Unitario Oferta
- Custo Total da Oferta
- Custo unitario do canal
- Custo total canal
- Custo Total Campanha
- CAC

**Taxas:**
- Taxa de Entrega
- Taxa de Abertura
- Taxa de Clique
- Taxa de Proposta
- Taxa de Aprovacao
- Taxa de Finalizacao
- Taxa de Conversao

**Resultados:**
- Cartoes Gerados
- Aprovados
- Propostas

---

## Integracao com Supabase

### Tabela: activities
Armazena os dados sincronizados do framework.

### Tabela: framework_versions
Armazena metadados das versoes.

### Storage: app-data
Armazena arquivos CSV das versoes.

### Sync Flow
```
framework_versions.is_active = true
         │
         ▼
activityService.syncFrameworkActivities()
├─ Deleta registros com prog_gaas = false
└─ Insere novos registros do CSV
         │
         ▼
activities atualizada
```

---

## Arquivos Relacionados

- `src/components/FrameworkView.tsx`
- `src/components/VersionHistoryDrawer.tsx`
- `src/components/SaveVersionModal.tsx`
- `src/services/versionService.ts`
- `src/services/activityService.ts`
- `src/hooks/useVersionManager.ts`
- `src/hooks/useFrameworkData.ts`

---

**Ultima Atualizacao:** 2026-02-02
