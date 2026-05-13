# Registros de Decisões de Arquitetura (ADR)

Este documento rastreia as decisões técnicas importantes tomadas durante o desenvolvimento do Growth Brain, seus contextos, consequências e planos de migração futura.

## 1. Armazenamento de Dados

| Status | Decisão | Contexto | Consequências | Plano de Migração (Fase 4) |
| :--- | :--- | :--- | :--- | :--- |
| **Aceito** | Usar `localStorage` para persistência de Notas e Metas | Precisamos de persistência entre sessões sem a complexidade de subir um backend/banco de dados na Fase 1. | Dados ficam presos ao navegador/máquina do usuário. Limpar cache apaga dados. Não permite colaboração real. | Migrar para banco de dados relacional (PostgreSQL) com API (Node/FastAPI). |

## 2. Fonte da Verdade (Framework)

| Status | Decisão | Contexto | Consequências | Plano de Migração (Fase 4) |
| :--- | :--- | :--- | :--- | :--- |
| **Aceito** | Upload manual de CSV (Parse no Frontend) | Os dados vêm de planilhas Excel/CSV extraídas de outros sistemas. O processamento local é rápido e seguro para MVPs. | Usuário precisa fazer upload toda vez ou manter o arquivo local. Não há sincronização automática com a fonte original. | Integração direta via API com Salesforce/Data Lake ou upload para bucket S3 com processamento em background. |

## 3. Autenticação e Usuários

| Status | Decisão | Contexto | Consequências | Plano de Migração (Fase 4) |
| :--- | :--- | :--- | :--- | :--- |
| **Aceito** | Usuário Único (Hardcoded "Pablo") | O foco inicial é validar a ferramenta com o Owner principal. Implementar Auth agora seria over-engineering. | Não há distinção de quem criou notas ou editou dados. Sem perfis de permissão. | Implementar sistema de Autenticação (Auth0, Firebase ou SSO Corporativo) e tabela de Usuários no banco. |

## 4. Validação de Dados

| Status | Decisão | Contexto | Consequências | Plano de Migração (Fase 4) |
| :--- | :--- | :--- | :--- | :--- |
| **Aceito** | Validação Schema-on-Read (Zod no Frontend) | O CSV pode vir com erros. Validamos ao ler para garantir que a UI não quebre. | A validação acontece no cliente, consumindo CPU do usuário se o arquivo for gigante (>50MB). | Manter validação no front para UX, mas adicionar validação robusta no Backend ao receber dados. |

## 5. Estilização e UI

| Status | Decisão | Contexto | Consequências | Plano de Migração (Fase 4) |
| :--- | :--- | :--- | :--- | :--- |
| **Aceito** | Tailwind CSS + Dark Mode Default | Ferramenta de uso prolongado requer conforto visual. Tailwind acelera desenvolvimento. | Código fica acoplado às classes utilitárias. | Manter. Tailwind é padrão de mercado e escala bem. Criar Design System tokens se necessário. |

---

## Histórico de Revisões

| Data | Versão | Autor | Notas |
| :--- | :--- | :--- | :--- |
| Nov 2025 | 1.0 | Antigravity | Criação inicial dos registros para o MVP. |
