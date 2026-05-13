# Quick Start - Calendario Estrategico

Bem-vindo ao projeto Calendario Estrategico. Este guia ajudara voce a configurar o ambiente de desenvolvimento e rodar o projeto localmente.

---

## 1. Pre-requisitos

Certifique-se de ter instalado:
- **Node.js** (v18 ou superior)
- **npm** ou **yarn**
- **Git**

## 2. Instalação e Configuração

### Clone o Repositorio
```bash
git clone <url-do-repo>
cd calendar-estrategico
```

### Instale as Dependencias
```bash
npm install
```

### Configure as Variaveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto (baseado no `.env.example` se existir) com as credenciais do Supabase:

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_key_anonima
```

---

## 3. Rodando o Projeto

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

O aplicativo estara disponivel em `http://localhost:5173`.

---

## 4. Scripts Uteis

| Script | Descricao |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Compila o projeto para producao |
| `npm run preview` | Visualiza o build de producao localmente |
| `npm run lint` | Verifica erros de linting |

---

## 5. Estrutura de Documentacao

Para entender melhor o sistema, consulte a documentacao completa em `docs/`:

- **Arquitetura Geral:** `docs/architecture/SYSTEM_OVERVIEW.md`
- **Abas do Sistema:** `docs/tabs/*.md`
- **API e Banco de Dados:** `docs/api/SUPABASE_SCHEMA.md`
- **Guia do Desenvolvedor:** `CLAUDE.md` (na raiz)

---

## Troubleshooting Comum

**Erro de Conexao Supabase:**
Verifique se as variaveis de ambiente estao corretas e se o projeto Supabase nao esta pausado.

**Erro de Build:**
Limpe a cache (`rm -rf node_modules/.vite`) e tente novamente.
