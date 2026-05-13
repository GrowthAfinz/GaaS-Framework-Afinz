# TAB: Configuracoes

**Rota:** `/configuracoes`
**Componente Principal:** `ConfiguracoesView.tsx`
**Categoria:** FRAMEWORK

---

## Overview

A aba Configuracoes e o painel administrativo do sistema. Permite gerenciar versoes de dados, configurar metas mensais, visualizar informacoes de armazenamento e realizar operacoes de manutencao.

---

## Features

- Gerenciamento de versoes de dados
- Upload de novas versoes
- Ativacao/restauracao de versoes
- Configuracao de metas mensais por BU
- Visualizacao de uso de storage
- Informacoes de autenticacao
- Operacoes de manutencao

---

## Arquitetura de Componentes

```
ConfiguracoesView.tsx
├── UserInfoSection
│   ├── UserAvatar
│   ├── UserName
│   └── LogoutButton
│
├── DataVersionSection
│   ├── CurrentVersionInfo
│   ├── UploadNewVersion
│   │   ├── FileDropzone
│   │   └── VersionMetadata
│   ├── VersionHistoryList
│   │   └── VersionItem
│   │       ├── VersionInfo
│   │       └── VersionActions
│   └── StorageUsage
│
├── GoalsManager.tsx
│   ├── MonthSelector
│   ├── BUTabs
│   └── GoalInputs
│       ├── CartoesMetaInput
│       ├── PedidosMetaInput
│       └── CACMaxInput
│
└── DataMigration.tsx
    ├── MigrationStatus
    └── MigrationActions
```

---

## Componentes Principais

### ConfiguracoesView.tsx
Componente principal que organiza todas as configuracoes.

**Secoes:**
1. Informacoes do Usuario
2. Versoes de Dados
3. Metas Mensais
4. Migracao de Dados

### GoalsManager.tsx
Gerenciador de metas mensais.

**Funcionalidades:**
- Selecionar mes de referencia
- Alternar entre BUs
- Definir meta de cartoes
- Definir meta de pedidos/aprovacoes
- Definir CAC maximo permitido
- Salvar metas

### DataMigration.tsx
Ferramenta para migracao e sincronizacao de dados.

**Operacoes:**
- Sync Framework -> Supabase
- Sync Metas -> Supabase
- Limpar dados locais
- Resetar para versao inicial

---

## Gerenciamento de Versoes

### Visao Geral
O sistema mantem historico de versoes dos dados Framework para permitir rollback e auditoria.

### Informacoes por Versao
```typescript
{
  id: string;
  filename: string;
  row_count: number;
  is_active: boolean;
  description?: string;
  created_at: string;
  storage_path: string;
}
```

### Operacoes Disponiveis

**Upload Nova Versao:**
1. Arrastar arquivo CSV
2. Informar nome da versao
3. Opcionalmente adicionar descricao
4. Escolher se ativa automaticamente
5. Confirmar upload

**Ativar Versao:**
1. Selecionar versao na lista
2. Clicar "Ativar"
3. Versao anterior desativada
4. Dados sincronizados com Supabase

**Restaurar Versao:**
1. Selecionar versao na lista
2. Clicar "Restaurar"
3. Dados carregados no app
4. Nao altera Supabase ate ativar

**Deletar Versao:**
1. Selecionar versao (nao ativa)
2. Clicar "Deletar"
3. Confirmar exclusao
4. Arquivo removido do storage

**Download Versao:**
1. Selecionar versao
2. Clicar "Download"
3. CSV baixado

---

## Fluxo de Dados

```
[Upload Nova Versao]

User arrasta CSV
         │
         ▼
FileDropzone captura arquivo
         │
         ▼
useCSVParser valida formato
         │
         ▼
User preenche metadata
         │
         ▼
versionService.uploadVersion()
├─ storageService.uploadFile()
└─ Cria registro em framework_versions
         │
         ▼
[Se ativar]
         │
         ▼
versionService.activateVersion()
├─ Desativa versao atual
├─ Ativa nova versao
└─ activityService.syncFrameworkActivities()
```

```
[Salvar Metas]

User seleciona mes e BU
         │
         ▼
User informa metas
         │
         ▼
GoalsManager.handleSave()
         │
         ▼
useMetaStore.setMeta()
         │
         ▼
localStorage persiste
         │
         ▼
dataService.upsertGoal()
         │
         ▼
Supabase sincroniza
```

---

## Hooks e Services Utilizados

| Hook/Service | Funcao |
|--------------|--------|
| `useVersionManager` | Gerencia versoes |
| `useGoals` | Gerencia metas |
| `versionService` | CRUD de versoes |
| `storageService` | Upload/download arquivos |
| `dataService` | Sync com Supabase |

---

## Casos de Uso

### 1. Atualizar Dados do Framework
1. Exportar CSV atualizado do Salesforce
2. Acessar Configuracoes
3. Arrastar CSV para area de upload
4. Informar nome (ex: "Framework Jan 2026")
5. Marcar "Ativar apos upload"
6. Confirmar
7. Dados atualizados em todo o sistema

### 2. Reverter para Versao Anterior
1. Acessar lista de versoes
2. Encontrar versao desejada
3. Clicar "Ativar"
4. Confirmar
5. Sistema volta ao estado da versao

### 3. Definir Metas do Mes
1. Acessar GoalsManager
2. Selecionar mes
3. Clicar na aba da BU
4. Informar meta de cartoes
5. Informar meta de pedidos
6. Informar CAC maximo
7. Clicar "Salvar"
8. Repetir para outras BUs

### 4. Verificar Uso de Storage
1. Visualizar barra de uso
2. Identificar versoes antigas
3. Deletar versoes desnecessarias
4. Liberar espaco

### 5. Sincronizar com Supabase
1. Acessar DataMigration
2. Clicar "Sincronizar Tudo"
3. Aguardar conclusao
4. Verificar status de sucesso

---

## Configuracoes de Metas

### Estrutura
```typescript
interface MetaMensal {
  id: string;           // "2026-02-B2C"
  mes: string;          // "2026-02"
  bu: BU;
  cartoes_meta: number;
  pedidos_meta: number;
  cac_max: number;
  created_at: string;
  updated_at: string;
}
```

### Persistencia
- **Local:** localStorage (`growth-brain-metas`)
- **Remoto:** Supabase tabela `goals`

### Validacoes
- Cartoes meta: >= 0
- Pedidos meta: >= 0
- CAC max: > 0

---

## Storage e Limites

### Supabase Storage
- **Bucket:** app-data
- **Pasta:** framework_versions/
- **Limite:** Depende do plano Supabase

### Informacoes Exibidas
- Espaco utilizado (MB)
- Numero de versoes
- Versao ativa atual
- Data ultima atualizacao

---

## Arquivos Relacionados

- `src/components/ConfiguracoesView.tsx`
- `src/components/admin/GoalsManager.tsx`
- `src/components/admin/DataMigration.tsx`
- `src/services/versionService.ts`
- `src/services/storageService.ts`
- `src/hooks/useVersionManager.ts`
- `src/hooks/useGoals.ts`
- `src/store/useMetaStore.ts`

---

**Ultima Atualizacao:** 2026-02-02
