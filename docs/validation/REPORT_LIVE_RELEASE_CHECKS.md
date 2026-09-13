# Verificação da release de agosto

Base isolada: `origin/main` em `2b4d4884bd4dd6627b2eae42658b82f57979b29a`.
Node `24.11.1`, npm com `package-lock.json`, Deno `2.9.6`, Supabase CLI `2.117.0`.

Em 12/09/2026, a main limpa e a release apresentaram os mesmos 57 diagnósticos
TypeScript, usando a mesma instalação de dependências. A saída integral da main
está em `typescript-main-2b4d488.txt`. `npm run typecheck` continua sendo a checagem
completa e continua falhando enquanto essa dívida existir.

`npm run typecheck:release` compara caminho, código, mensagem e multiplicidade dos
diagnósticos. Mudanças de linha não alteram a identidade de um erro. Qualquer erro
adicional falha; erros resolvidos são aceitos. Não regenerar a referência a partir
da release para fazer o check passar.

Os testes de Report Live verificam contratos de dados e o protocolo de publicação.
Eles não certificam efeitos reais no Google nem a capacidade de restauração.
Homologação dos documentos vivos, PDF visual, backend e bundle público continuam
obrigatórios antes de declarar agosto entregue.

Resultado local em 13/09: 124 testes Vitest e 39 testes Node do Report Live
aprovados; checagem Deno e build Vite aprovados; regressão TypeScript sem novos
diagnósticos. A padronização de checkout
`*.sql text eol=lf` elimina diferenças CRLF/LF nas comparações de templates entre
Windows e Linux, sem alterar a lógica das migrations históricas.

Cinco testes SQL transacionais também passaram no banco vinculado: armazenamento
e checkpoints, recuperação do build, proteção de lease/watchdog, publicação por
geração com PDF antes da ativação e restrição RLS das tabelas centrais.

`npm audit fix` sem `--force` atualizou somente versões compatíveis e reduziu os
alertas de 24 para 8. Permanecem dependências de ferramentas locais Vite/Vitest,
o `uuid` transitivo do ExcelJS e o pacote `xlsx`, que não oferece correção no npm.
Trocas principais ou downgrade do ExcelJS foram recusados nesta release; nenhum
desses pacotes executa no worker Deno do Report Live.

O workflow de Pages depende agora do workflow reutilizável de validação. Ele faz
instalação limpa, testes, gate de tipos, checagem Deno e build. Isso ainda não
representa promoção de backend nem execução dos testes SQL de recuperação no CI.

A conta identificada pela interface autenticada foi configurada em 12/09 como
operador do Report Live: `pablo.castro@afinz.com.br`, usuário
`187810b7-9f30-4a0d-ba85-721aa000107b`. A alteração foi restrita à chave
`app_metadata.report_live_role` e confirmada por nova consulta. Claims em JWT
podem precisar de renovação; o backend usa `auth.getUser` para verificar a conta.

## Homologação de agosto

A publicação `54649269-7cce-460a-a87d-b4cc5f310a62`, versão 8, confirmou o run
`9bb55892-4b17-4f76-825a-0ac97c92b525` para 01/08/2026 a 31/08/2026. O ponteiro
ativo, o run e o job estão concluídos; `publication_valid` e o QA estão aprovados.

O PDF imutável contém 57 páginas e SHA-256
`b32ceb5e92b0e75f0615cdacf0bb4db2cb905055698c385c7f9926cc79877fb4`. Todas as
páginas foram renderizadas e revisadas visualmente. Não há páginas vazias nem
placeholders de gráfico. B2C e as séries numéricas indisponíveis da frente Copa
continuam explícitas em quadros vermelhos, sem zeros inventados.

A geração do PDF ocorre antes da ativação do deck e seleciona apenas as páginas
da geração alvo. A ativação confirmou 57 slides visíveis e nenhuma versão anterior
visível. A recuperação foi exercitada durante a homologação e os checkpoints usam
artefato derivado imutável, sem recalcular fontes.

## Segurança e operação

Em 13/09, RLS foi habilitada e o acesso anônimo removido de `activities`,
`paid_media_metrics` e `b2c_daily_metrics`. O CRUD autenticado existente foi
preservado para compatibilidade com os módulos atuais; funções de serviço mantêm
acesso pelo `service_role`.

`report-sync` v43 está ativo e exige autenticação. Download do PDF publicado é
permitido a usuários autenticados; geração, publicação, retomada e rollback exigem
`report_live_role` de operador ou administrador. A manutenção permanece ativa até
o frontend passar pelo workflow de `main` e ser confirmado na URL pública.
