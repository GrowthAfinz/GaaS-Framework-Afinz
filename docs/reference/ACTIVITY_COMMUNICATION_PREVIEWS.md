# Prévia da comunicação nos detalhes do disparo

## Superfícies

O bloco recolhível **Comunicação vinculada → Ver comunicação** está integrado ao modal diário,
ao detalhe do Explorador (Framework atual), ao painel lateral legado do Framework e ao detalhe
por disparo de Relatórios. Expandir e ampliar preservam o contexto da tela de origem.

## Identidade e origem

`activityCommunicationContext` conserva a execução (`raw.id`, quando disponível), Activity Name,
data, jornada, canal e Template ID com a caixa original. O nome não identifica uma execução.
Relatórios passa a própria `sourceActivity` da linha clicada; não procura a primeira atividade
de mesmo nome. O clique na tabela em tela cheia fecha o overlay para mostrar o detalhe correto.

`readActivityPreview` consulta somente o ID selecionado, reutiliza `readContents(templateId)` e
`resolvePreview`, e não propõe nem grava vínculos. Para esse leitor, a prioridade é a versão
atual aprovada do pacote; na ausência dela, HTML ou imagem do catálogo. O canal precisa coincidir.
Não são fornecidos candidatos nem conteúdo de outra ocorrência como fallback.

O rótulo **Arte atual cadastrada** e a origem distinguem a prévia atual de uma comprovação
da versão enviada historicamente. Variáveis de exemplo continuam identificadas pelo visualizador.

## Carregamento e estados

- Nenhuma consulta de comunicação enquanto o bloco estiver recolhido.
- Sem Template ID: ausência explícita, sem tentativa de adivinhar o vínculo.
- Sem conteúdo: motivo do resolvedor e atalho para Cadastro e templates.
- Erro de consulta ou arquivo: erro explícito e atualização manual; não se transforma em ausência.
- Respostas atrasadas não podem reaparecer após trocar de execução ou recolher o bloco.
- Atualização por `sfmc-package-changed` e botão **Atualizar prévia**.
- HTML em cache considera o hash/atualização do catálogo. Imagens incluem a revisão na URL da
  prévia, preservando o token assinado, para evitar arte antiga após substituir o mesmo arquivo.
- Ampliação usa `PreviewModal`, incluindo Escape, gestão de foco e indicação de origem.

O atalho para cadastro carrega jornada, atividade, canal e UUID disponível. `returnTab` permite
voltar à aba de origem sem alterar os filtros globais. Estado local de seleção do detalhe pode
ser reconstruído ao voltar; a abertura da prévia em si não navega nem desmonta o detalhe.

## Validação reproduzível

```powershell
npm test
npm run typecheck:release
npm run build
```

Para o QA visual, iniciar o servidor em outro terminal:

```powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4317 --strictPort --open false
```

E executar:

```powershell
node scripts/qa-activity-previews.mjs
```

O script usa componentes reais com dados simulados e intercepta as requisições do Supabase.
Não exige credenciais e não grava dados em produção. Cobre consulta sob demanda, identidade por
execução, estados de ausência/erro, nova tentativa, ampliação/Escape, largura de 390px, atualização
de HTML no mesmo caminho, falha de imagem, atalho sem reset de filtros e as superfícies integradas.
Evidências PNG ficam em `tmp/activity-preview-qa/`. Este QA não substitui UAT autenticada.

## Fora deste corte

Completar peças ausentes na ingestão de pacotes, executar AMPscript/briefings, alterar atribuição
histórica e substituir arquivos do catálogo. Não há migration nem alteração nas políticas de acesso.
