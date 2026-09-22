# Plano de relocação — operação do Report Live

**Decisão:** controles operacionais passam para `Aprendizado Growth > Report Live`. A aba `Relatórios` conserva somente consumo e downloads.

## 1. Estado atual

`RelatorioView` possui `Overview`, `Diário`, `Mensal` e `Relatórios`. No modo de relatórios, `ReportLiveCard` combina:

- estado da publicação;
- geração de candidata;
- progresso;
- publicação;
- downloads;
- links;
- operação de equipe.

Isso mistura consumo de output com release engineering.

## 2. Estado alvo

### `Relatórios`

Componente `ReportLiveOutputCard`:

- período e perfil publicados;
- data da publicação;
- abrir Report Live;
- baixar PDF;
- baixar PPTX quando disponível;
- abrir Slides/Sheets quando aplicável;
- mensagem clara quando não houver publicação.

Sem botões de build, certificação, publish, recovery ou equipe.

### `Aprendizado Growth > Report Live`

Componentes:

- `ReportLiveActivePublication`;
- `ReportLiveCandidatePanel`;
- `ReportLiveBuildProgress`;
- `ReportLiveCertificationSummary`;
- `ReportLivePublicationActions`;
- `ReportLiveHistory`;
- `ReportLiveArtifacts`;
- `ReportLiveRecoveryPanel`;
- configuração/equipe em seção secundária, preservando o comportamento existente.

## 3. Refactor planejado

Extrair de `ReportLiveCard`:

```text
useReportLiveRuntime()
useReportLiveMembership()
useReportLiveActivePublication()
useReportLiveCandidate()
useReportLiveActions()
useReportLivePolling()
```

Os componentes de consumo e operação compartilham hooks/serviço. Não duplicar polling, fetch ou regras de permissão.

## 4. Feed

Eventos materiais do pipeline:

- candidata certificada;
- build rejeitado/bloqueado;
- publicação iniciada;
- publicação concluída;
- publicação falhou;
- recovery concluído.

Checkpoints normais permanecem silenciosos e visíveis apenas no painel do job.

## 5. Report Live como projeção

Fases posteriores poderão projetar:

- apostas abertas;
- outcomes encerrados;
- aprendizados do ciclo;
- itens bloqueados;
- taxa de loops fechados.

Isso não autoriza a camada editorial a alterar objetos operacionais.

## 6. Compatibilidade

- endpoints atuais permanecem;
- pipeline imutável permanece;
- artefatos e ponteiro vivo permanecem;
- o link do Report Live permanece;
- URLs antigas da aba Relatórios continuam abrindo o output;
- qualquer deep-link para operação deve redirecionar para `Aprendizado Growth > Report Live`.

## 7. Sequência

1. extrair serviço/hooks sem mudar UX;
2. criar `ReportLiveOutputCard`;
3. criar `ReportLiveWorkspace` usando os mesmos hooks;
4. adicionar modo `learning`;
5. mover operações;
6. manter output em Relatórios;
7. validar fluxos existentes;
8. remover o componente monolítico somente depois da equivalência.

## 8. Critérios de aceite

- gerar, certificar, publicar e recuperar só aparecem no novo workspace;
- Relatórios continua oferecendo o output publicado;
- os dois contextos mostram a mesma publicação ativa;
- polling não é duplicado quando apenas uma área está montada;
- nenhum contrato de build/publicação muda;
- a movimentação não dispara run ou publicação;
- eventos materiais aparecem no feed uma única vez.
