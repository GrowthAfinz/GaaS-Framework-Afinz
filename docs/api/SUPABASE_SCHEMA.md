# Referencia: Schema do Supabase

**Banco de Dados:** PostgreSQL (via Supabase)
**Projeto:** Calendario Estrategico
**Versao:** 1.0

---

## Overview

O banco de dados utiliza 5 tabelas principais para armazenar todo o historico de atividades, metricas B2C, dados de midia paga, metas e versoes de framework.

---

## Tabelas

### 1. `activities` (Tabela Principal)
Armazena todas as atividades de disparo de campanhas, tanto importadas do framework (historico) quanto criadas no calendario (GaaS).

**Colunas:**
| Nome | Tipo | Descricao |
|------|------|-----------|
| `activity_name_taxonomia` | `text` (PK) | Identificador unico (Taxonomia Salesforce) |
| `data_disparo` | `date` | Data de execucao |
| `bu` | `text` | Business Unit |
| `canal` | `text` | Canal utilizado |
| `segmento` | `text` | Segmento alvo |
| `jornada` | `text` | Jornada do cliente |
| `status` | `text` | Rascunho, Scheduled, Enviado, Realizado |
| `oferta` | `text` | Tipo de oferta |
| `promocional` | `text` | Codigo promocional |
| `base_enviada` | `integer` | Volume de envio |
| `base_entregue` | `integer` | Volume entregue |
| `taxa_abertura` | `numeric` | Taxa de abertura (%) |
| `taxa_clique` | `numeric` | Taxa de clique (%) |
| `propostas` | `integer` | Numero de propostas |
| `aprovados` | `integer` | Numero de aprovados |
| `emissoes` | `integer` | Numero de cartoes emitidos |
| `custo_unitario` | `numeric` | Custo por disparo |
| `custo_total` | `numeric` | Custo total da campanha |
| `prog_gaas` | `boolean` | True se criado no app (Launch Planner) |
| `created_at` | `timestamp` | Data de criacao |

**Indices:**
- `idx_activities_data` (data_disparo)
- `idx_activities_bu` (bu)
- `idx_activities_status` (status)

---

### 2. `b2c_daily_metrics`
Armazena metricas agregadas diarias da originacao B2C total para comparacao com CRM.

**Colunas:**
| Nome | Tipo | Descricao |
|------|------|-----------|
| `data` | `date` (PK) | Data de referencia |
| `propostas_total` | `integer` | Propostas B2C Total do dia |
| `emissoes_total` | `integer` | Emissoes B2C Total do dia |
| `conversao_percent` | `numeric` | Taxa de conversao diaria |
| `created_at` | `timestamp` | Data de importacao |

---

### 3. `paid_media_metrics`
Armazena dados de performance de midia paga (Meta, Google, etc.).

**Colunas:**
| Nome | Tipo | Descricao |
|------|------|-----------|
| `id` | `uuid` (PK) | Identificador unico |
| `date` | `date` | Data da veiculacao |
| `channel` | `text` | Meta Ads, Google Ads, TikTok |
| `campaign` | `text` | Nome da campanha |
| `objective` | `text` | Objetivo (Conversao, Alcance) |
| `spend` | `numeric` | Valor gasto no dia |
| `impressions` | `integer` | Impressoes |
| `clicks` | `integer` | Cliques |
| `conversions` | `integer` | Conversoes (Install App) |
| `cpa` | `numeric` | Custo por aquisicao |

---

### 4. `goals`
Armazena metas mensais por Business Unit.

**Colunas:**
| Nome | Tipo | Descricao |
|------|------|-----------|
| `id` | `text` (PK) | Formato "YYYY-MM-BU" |
| `mes` | `text` | "YYYY-MM" |
| `bu` | `text` | BU da meta |
| `cartoes_meta` | `integer` | Meta de emissoes |
| `pedidos_meta` | `integer` | Meta de propostas |
| `cac_max` | `numeric` | Teto de CAC |
| `updated_at` | `timestamp` | Ultima edicao |

---

### 5. `framework_versions`
Mantem registro das versoes de CSV importadas.

**Colunas:**
| Nome | Tipo | Descricao |
|------|------|-----------|
| `id` | `uuid` (PK) | ID da versao |
| `filename` | `text` | Nome do arquivo original |
| `storage_path` | `text` | Caminho no Bucket |
| `row_count` | `integer` | Numero de linhas |
| `is_active` | `boolean` | Se e a versao atual |
| `description` | `text` | Descricao opcional |
| `created_at` | `timestamp` | Data de upload |

---

## Row Level Security (RLS)

O projeto utiliza RLS para garantir seguranca dos dados.

**Policies Padrao:**
1. **Leitura Publica (Anon):**
   - Permitir SELECT em todas as tabelas para usuarios anonimos (dashboard publico).
   
2. **Escrita Restrita:**
   - Em producao, requer autenticacao.
   - Em desenvolvimento, policies permissivas podem estar ativas (`true`).

```sql
-- Exemplo de Policy
CREATE POLICY "Enable read access for all users" ON "public"."activities"
AS PERMISSIVE FOR SELECT
TO public
USING (true);
```

---

## Buckets (Storage)

### `app-data`
Bucket privado para armazenamento de arquivos de sistema.

**Pastas:**
- `framework_versions/`: Arquivos CSV de cada versao salva.
- `temp/`: Arquivos temporarios de processamento.

---

## Queries Uteis

### Sync Framework
Para limpar dados antigos e reinserir nova versao:
```sql
-- Remove apenas dados importados (mantem GaaS)
DELETE FROM activities WHERE prog_gaas = false;
```

### Analise de Duplicatas
```sql
SELECT activity_name_taxonomia, COUNT(*)
FROM activities
GROUP BY activity_name_taxonomia
HAVING COUNT(*) > 1;
```

### Metricas Mensais
```sql
SELECT 
  DATE_TRUNC('month', data_disparo) as mes,
  SUM(cartoes_gerados) as total_cartoes
FROM activities
GROUP BY 1
ORDER BY 1 DESC;
```
