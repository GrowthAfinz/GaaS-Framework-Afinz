# GROWTH BRAIN AFINZ — Especificação Técnica Completa

> **Documento de contexto para desenvolvimento com Gemini 3 / Antigravity**
> Versão: 3.1 | Janeiro 2026
> Autor: Pablo (Growth Analyst @ Afinz)

---

## 1. VISÃO DO PRODUTO

### 1.1 O que é o Growth Brain

O Growth Brain Afinz é o **"cérebro operacional"** da aquisição de cartões de crédito do banco. **Não é** apenas um calendário de disparos, nem apenas um painel de BI, nem apenas um "Excel bonito".

### 1.2 Problema que Resolvemos

O Operator Owner (estrategista de Growth) precisa responder diariamente:
- "O que está rodando hoje?" (Launch Planner - ✅)
- "Onde estão os gargalos?" (Funis e KPIs - ✅)
- "Qual combo Canal+Oferta+Segmento está queimando dinheiro?" (Analytics - ✅)
- "Como estamos vs. mês passado?" (Resultados - ✅)
- "O que eu deveria disparar agora para bater meta?" (Orientador - 🚧)

---

## 2. STATUS DE IMPLEMENTAÇÃO (RESUMO)

| Módulo | Status | Notas |
|--------|--------|-------|
| **Launch Planner** | ✅ Pronto | Calendário interativo com filtros e detalhes. |
| **Analytics (Resultados)** | ✅ Pronto | Dashboards, metas vs realizado. |
| **Originação B2C** | ✅ Pronto | Análise de Share, KPIs de conversão. |
| **Jornada & Disparos** | ✅ Pronto | Gráficos temporais de evolução. |
| **Framework Explorer** | ✅ Pronto | Tabela completa editável. |
| **Diário de Bordo** | ✅ Pronto | Sistema de notas com tags e persistência. |
| **Orientador (IA)** | 🚧 Beta | Recomendações básicas implementadas. |

---

## 3. ARQUITETURA DE DADOS

### 3.1 Framework de Aquisição (Fonte da Verdade)
O sistema consome CSVs baseados no Framework de Aquisição:
- **40+ colunas** de dados
- Histórico completo de campanhas

### 3.2 Dimensões Principais
- **BU**: B2C, B2B2C, Plurix
- **Canal**: E-mail, SMS, WhatsApp, Push
- **Segmento**: CRM, Cartonistas, Abandonados, etc.
- **Parceiro**: Proprietaria, Serasa, etc.
- **Oferta**: Padrao, Vibe, Limite, etc.

---

## 4. MANUAL DE OPERAÇÃO TÉCNICA (PLAYBOOK)

### 4.1 Launch Planner (Control Tower)
O coração da operação. Um calendário visual 6x7 que agrupa disparos por Data e Business Unit.

**Lógica de Renderização:**
- **Grid Inteligente:** Detecta automaticamente o último mês com dados disponíveis ("Safra Recente") e navega para ele no load inicial.
- **Priority Rendering:** Se o dado possui `safraKey` (YYYY-MM), ele é renderizado na visão dessa safra. Caso contrário, usa a `dataDisparo`.
- **Células de Dia:**
  - `Hover`: Dispara um card flutuante com sumário executivo (Total Cartões, CAC, Custo).
  - `Click`: Abre o modal `DailyDetailsModal`, listando todas as activities (campanhas) individuais daquele dia.
  - **Indicadores (Dots):** Cores representam a BU dominante do dia (Azul=B2C, Verde=B2B2C, Roxo=Plurix).

**Interações Críticas:**
- **Drag & Drop:** *[Feature em Roadmap]* Para mover disparos de dia.
- **Edit Activity:** No modal de detalhes, clique no ícone de lápis para editar a data de disparo ou observações.

### 4.2 Arquitetura de Analytics (Resultados)
Painel executivo focado em "Meta vs Realizado".

**Fórmulas de KPIs:**
1.  **CPA / CAC Global:**
    `Σ (Custo Total das Campanhas) / Σ (Cartões Emitidos)`
2.  **Conversão Global:**
    `Σ (Cartões Emitidos) / Σ (Propostas ou Cliques)` *[Depende do canal]*
3.  **Projeção Linear:**
    `(Total Realizado / Dias Corridos) * Dias no Mês`
    *Calculado apenas se o mês não encerrou.*

**Mecanismo de Metas:**
- As metas são armazenadas no `localStorage` por chave de mês `goal_YYYY-MM`.
- **Gauge Charts:** Mostram visualmente o % de atingimento.
  - *Vermelho*: < 70%
  - *Amarelo*: 70% - 99%
  - *Verde*: >= 100%

### 4.3 Originação B2C (Deep Dive)
Módulo especializado para análise de eficiência do canal CRM frente ao todo.

**Conceitos Chave:**
- **Share CRM:** Percentual de cartões B2C que vieram de campanhas de CRM.
  - Fórmula: `(Cartões CRM / Total Emissões B2C) * 100`
- **Limiar de Alerta:** Configurado em `useAppStore`. Se Share < Limite (ex: 20%), o gráfico fica vermelho/alerta.
- **Drill-Down Semanal:** O gráfico de barras "Cartões por Dia" permite clique na barra para abrir o detalhe daquela semana específica.

### 4.4 Lab de Growth (Diário & Experimentos)
Sistema híbrido de documentação (Notes) e gestão de hipóteses (Experiments).

**A. Diário (Logbook)**
- **Uso:** Registrar anomalias ("Sistema caiu"), eventos externos ("Feriado") ou disparos manuais não rastreados.
- **Persistência:** `localStorage` -> key `growth_diary_entries`.
- **Tags:** Obrigatório selecionar BU e Segmento para facilitar busca futura.

**B. Gestor de Experimentos (Kanban)**
- **Fluxo:** Hipótese -> Em Andamento -> Aprendizado.
- **Card de Experimento:**
  - *Hipótese:* O que esperamos que aconteça? (ex: "Mudar copy aumenta CTR")
  - *Conclusão:* O que realmente aconteceu? (Dado quantitativo).
- **Significância:** *[Feature Beta]* Calculadora Chi-Square integrada para validar se o resultado é estatisticamente relevante.

---

## 5. ESPECIFICAÇÃO TÉCNICA

### 5.1 Stack
- **Frontend**: React 18, TypeScript, Vite
- **Estilização**: Tailwind CSS (Dark Mode default)
- **Estado**: Zustand + Context API
- **Charts**: Recharts
- **Dados**: Papaparse (CSV) + Zod (Validation)

### 5.2 Estrutura de Pastas
```
src/
├── components/       # UI Components
├── hooks/            # Business Logic & Data Access
├── types/            # TypeScript Interfaces
├── utils/            # Helper functions
├── store/            # Global State Management
└── ...
```

---

## 6. BACKLOG & ROADMAP

### Concluído (Fase 1 & 2)
- [x] Infraestrutura e Setup
- [x] Launch Planner completo
- [x] Filtros globais avançados
- [x] Dashboard de Resultados
- [x] Originação B2C (Análise de Share)
- [x] Diário de Bordo (Notas)
- [x] Gráficos de Jornada

### Em Progresso (Fase 3 - Inteligência)
- [ ] Refinamento do algoritmo de pontuação do Orientador
- [ ] Exportação avançada de relatórios (PDF/PNG)
- [ ] Integração com backend (preparação)

### Futuro (Fase 4 - Enterprise)
- [ ] Autenticação corporativa (SSO)
- [ ] Banco de dados relacional
- [ ] Integração direta com API do Salesforce/Data Lake
- [ ] Multi-usuário com permissões

---

## 7. COMO CONTRIBUIR

1. Leia `README.md` para setup.
2. Siga o padrão de commits.
3. Use dark mode para desenvolvimento.
4. Mantenha os componentes funcionais (stateless quando possível).

---

**Documento Vivo - Atualize conforme o projeto evolui.**
