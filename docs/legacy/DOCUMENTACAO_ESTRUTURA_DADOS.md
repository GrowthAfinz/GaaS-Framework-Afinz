# Documentação da Estrutura de Dados do Framework

Este documento detalha a estrutura de dados esperada pelo Calendário Estratégico, incluindo as colunas do CSV, regras de validação e tipos de dados.

## Formato do Arquivo CSV

- **Encoding:** `Latin-1` (ISO-8859-1) ou `CP1252`.
- **Delimitador:** Ponto e vírgula (`;`).
- **Linhas vazias:** São ignoradas automaticamente.

## Colunas Obrigatórias

O sistema espera as seguintes colunas no arquivo CSV. O sistema é flexível e aceita algumas variações nos nomes das colunas (sinônimos), normalizando-os internamente (ignorando maiúsculas/minúsculas e acentos).

### Identificação e Contexto

| Coluna Principal | Sinônimos Aceitos | Tipo de Dado | Descrição |
| :--- | :--- | :--- | :--- |
| **Activity name / Taxonomia** | - | Texto | Identificador único da atividade/campanha. |
| **Data de Disparo** | - | Data (DD/MM/YYYY ou YYYY-MM-DD) | Data em que a atividade ocorre. |
| **Canal** | - | Texto | Canal de comunicação (ex: Email, SMS). |
| **BU** | - | Texto (Enum) | Unidade de Negócio. Valores aceitos: `B2C`, `B2B2C`, `Plurix`. |
| **Segmento** | - | Texto | Segmento do público alvo. |
| **Jornada** | - | Texto | Nome da jornada a qual a atividade pertence. |
| **Parceiro** | - | Texto | Nome do parceiro envolvido. |
| **Ordem de Disparo** | `Ordem do Disparo`, `Ordem`, `Step`, `Etapa` | Número | Ordem sequencial da atividade na jornada. |
| **Tipo de Oferta** | `Tipo Oferta`, `Oferta` | Texto | Detalhes da oferta apresentada. |
| **Safra** | `Ciclo`, `Mes`, `Mês` | Texto (MM/YYYY) | Mês/Ano de referência da campanha. |

### KPIs (Indicadores de Performance)

| Coluna Principal | Sinônimos Aceitos | Tipo de Dado | Descrição |
| :--- | :--- | :--- | :--- |
| **Base Enviada** | `Base Total` | Número | Total de clientes na base alvo. |
| **Base Entregue** | `Base Acionável`, `Base Acionavel` | Número | Total de clientes efetivamente contactados. |
| **Taxa de Entrega** | - | Porcentagem | % de sucesso na entrega. |
| **Propostas** | - | Número | Quantidade de propostas geradas. |
| **Taxa de Proposta** | - | Porcentagem | % de conversão em propostas. |
| **Aprovados** | - | Número | Quantidade de propostas aprovadas. |
| **Taxa de Aprovação** | - | Porcentagem | % de aprovação das propostas. |
| **Emissões** | `Cartões Gerados`, `Cartoes Gerados` | Número | Quantidade de cartões emitidos. |
| **Taxa de Finalização** | - | Porcentagem | % de finalização do processo. |
| **Taxa de Conversão** | - | Porcentagem | % de conversão final. |
| **Taxa de Abertura** | - | Porcentagem | % de abertura (para emails). |
| **CAC** | - | Moeda (R$) | Custo de Aquisição por Cliente. |
| **Custo Total Campanha** | - | Moeda (R$) | Custo total investido na campanha. |

## Regras de Validação e Tratamento

1.  **Normalização de Nomes:**
    *   Nomes de colunas são normalizados removendo espaços extras e caracteres especiais para comparação.
    *   Exemplo: `Taxa de Abertura ` (com espaço) é tratado igual a `Taxa de Abertura`.

2.  **Validação de Linhas:**
    *   **Activity Name:** Não pode ser vazio.
    *   **Data de Disparo:** Deve ser uma data válida.
    *   **BU:** Deve ser uma das opções válidas (`B2C`, `B2B2C`, `PLURIX`). Se for inválida, a linha é ignorada e um aviso é gerado no console.

3.  **Tratamento de Valores:**
    *   **Números:** Aceita formatos como `1.000,00` (PT-BR) ou `1000.00` (EN-US).
    *   **Porcentagens:** Aceita `95%`, `0.95` ou `95`.
    *   **Moedas:** Remove símbolos como `R$` e espaços antes de converter.

## Estrutura de Dados Interna (TypeScript)

Internamente, os dados são mapeados para as seguintes interfaces (definidas em `src/types/framework.ts`):

```typescript
export interface Activity {
  id: string;          // Mapeado de 'Activity name / Taxonomia'
  dataDisparo: Date;   // Mapeado de 'Data de Disparo'
  canal: string;
  bu: BU;              // 'B2C' | 'B2B2C' | 'Plurix'
  segmento: string;
  parceiro: string;
  jornada: string;
  ordemDisparo?: number;
  oferta?: string;
  safraKey?: string;   // Formato YYYY-MM para agrupamento
  kpis: KPIs;          // Objeto contendo todos os indicadores numéricos
}
```

## Erros Comuns

*   **Arquivo Vazio:** O sistema alerta se o CSV não contiver dados.
*   **Colunas Faltando:** O sistema lista exatamente quais colunas obrigatórias não foram encontradas.
*   **Encoding Incorreto:** Se caracteres especiais (acentos) aparecerem corrompidos, verifique se o arquivo foi salvo como `Latin-1` ou `ANSI` (comum no Excel), e não `UTF-8`.
