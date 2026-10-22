# Fechar e adiar o aviso de meta herdada

O aviso do Launch Planner oferece três decisões independentes:

- **X:** oculta o aviso para aquele usuário, mês e revisão das metas herdadas.
- **Lembrar mais tarde (24h):** oculta durante 24 horas e reaparece ao vencer o prazo,
  inclusive se a página continuar aberta. Foco/visibilidade reavaliam o relógio após suspensão.
- **Confirmar metas:** mantém a operação existente de confirmação; fechar/adiar não a executa.

As preferências são locais ao navegador, em `localStorage`, sob
`gaas.inherited-goal-notice.v1`. A chave inclui usuário autenticado, mês de destino, mês de
origem e valores da meta. Trocar usuário, mês, origem ou valores reexibe o aviso. Sem usuário
ou armazenamento disponível, a ação funciona em memória. Não altera metas, `herdada_de`,
KPIs ou dados no Supabase. Eventos de armazenamento sincronizam abas do mesmo navegador.

O botão X tem nome acessível e as ações de ocultar/adiar ficam desabilitadas durante uma
confirmação em andamento. Em largura menor, os botões quebram linha sem sobrepor o título.

## Validação

`src/utils/inheritedGoalNoticePreference.test.ts` cobre isolamento por usuário/mês/revisão,
expiração exata e armazenamento inválido/bloqueado.

Com o Vite ativo em `127.0.0.1:4317`, executar:

```powershell
node scripts/qa-inherited-goal-notice.mjs
```

O QA usa sessão fictícia em navegador isolado e intercepta todas as requisições Supabase.
Cobre fechamento, recarregamento, mudança de meta/mês, adiamento, avanço de 24h e layout
de 390px; verifica que nenhuma requisição de escrita é emitida. As capturas ficam em
`tmp/inherited-goal-notice-qa/`.
