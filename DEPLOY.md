# Guia de Deploy no Vercel

Este guia passo a passo ajudará você a publicar o projeto `calendar-estrategico` no Vercel de forma segura e correta.

## ⚠️ Importante: Configuração do Git

Detectamos que o diretório raiz do seu usuário (`C:\Users\Pablo Prado`) está configurado como um repositório Git. Isso não é recomendado para este projeto. Vamos configurar um repositório Git isolado apenas para esta aplicação.

### Passo 1: Inicializar Git no Projeto

Abra o terminal na pasta do projeto e execute os seguintes comandos:

```bash
# 1. Navegue para a pasta do projeto (se já não estiver nela)
cd "c:\Users\Pablo Prado\OneDrive\Área de Trabalho\ACALENDARIO APP\calendar-estrategico"

# 2. Inicialize um novo repositório Git
git init

# 3. Adicione os arquivos do projeto
git add .

# 4. Faça o primeiro commit
git commit -m "Commit inicial: Configuração do projeto"
```

## Passo 2: Publicar no GitHub

Para fazer o deploy no Vercel, a maneira mais fácil é conectar seu projeto a um repositório no GitHub.

1.  Acesse [github.com/new](https://github.com/new) e crie um novo repositório (ex: `calendar-estrategico`).
2.  **Não** marque as opções de adicionar README, .gitignore ou licença (já temos isso localmente).
3.  Copie o comando para enviar um repositório existente. Será algo parecido com:

```bash
git remote add origin https://github.com/SEU_USUARIO/calendar-estrategico.git
git branch -M main
git push -u origin main
```

4.  Execute esses comandos no seu terminal.

## Passo 3: Deploy no Vercel

1.  Acesse [vercel.com](https://vercel.com) e faça login (pode usar sua conta do GitHub).
2.  Clique em **"Add New..."** -> **"Project"**.
3.  Na lista "Import Git Repository", encontre o repositório `calendar-estrategico` que você acabou de criar e clique em **"Import"**.
4.  **Configurações de Build**:
    *   **Framework Preset**: Vite
    *   **Root Directory**: `./` (padrão)
    *   **Build Command**: `npm run build` (padrão)
    *   **Output Directory**: `dist` (padrão)
    *   **Install Command**: `npm install` (padrão)
5.  Clique em **"Deploy"**.

## Verificação

Após o deploy, o Vercel fornecerá uma URL (ex: `calendar-estrategico.vercel.app`). Acesse essa URL para verificar se a aplicação está funcionando corretamente.

---

**Nota**: Se você encontrar erros de build no Vercel, verifique os logs no dashboard do Vercel e compare com o build local (`npm run build`).

## Compartilhando Acesso

### 1. Para Usuários (Acesso à Aplicação)
A URL gerada pelo Vercel (ex: `https://calendar-estrategico-pyfzvywkq-pablooos-projects.vercel.app/`) é pública. Você pode enviá-la para qualquer pessoa e elas poderão acessar a aplicação.

### 2. Para Desenvolvedores (Acesso ao Código)
Se você quer que outra pessoa ajude a desenvolver ou manter o código, você precisa usar o GitHub:

1.  Siga o **Passo 2** acima para colocar seu código no GitHub.
2.  No seu repositório do GitHub, vá em **Settings** > **Collaborators**.
3.  Clique em **Add people** e digite o e-mail ou usuário do GitHub da pessoa.
4.  Ela receberá um convite e poderá clonar o repositório e enviar alterações.

### 3. Para Gerentes (Acesso ao Vercel)
Se você quer que outra pessoa possa ver os logs de deploy ou alterar configurações no Vercel:

1.  No dashboard do Vercel, vá em **Settings** > **Members**.
2.  Convide a pessoa por e-mail (note que dependendo do plano, pode haver custos ou limites para membros da equipe).

## Regra Operacional: deploy sempre pela `main`

Este sistema deve ser publicado sempre a partir da branch `main`, pois o banco e os fluxos de producao estao alinhados a ela.

Fluxo recomendado:

1. Desenvolver em branch de trabalho.
2. Validar localmente (`npm run build`).
3. Abrir PR para `main` e revisar.
4. Fazer merge na `main`.
5. Confirmar que o deploy puxou o commit mais recente da `main`.
