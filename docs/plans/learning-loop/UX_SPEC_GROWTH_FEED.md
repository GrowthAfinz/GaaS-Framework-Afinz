# UX Spec — Aprendizado Growth e feed sistêmico

**Versão:** 0.1
**Entrada:** `Relatórios > Aprendizado Growth`
**Tela inicial:** Fila

## 1. Arquitetura de informação

```text
Aprendizado Growth
├── Fila
├── Apostas
├── Outcomes
├── Memória
└── Report Live
```

Todas as áreas são projeções dos mesmos objetos e eventos. Não devem existir cinco backlogs ou motores independentes.

## 2. URL e preservação de contexto

Formato planejado:

```text
/relatorios?view=learning&section=feed
/relatorios?view=learning&section=bets&item=<uuid>
/relatorios?view=learning&section=outcomes&item=<uuid>
/relatorios?view=learning&section=memory&item=<uuid>
/relatorios?view=learning&section=report-live
```

Filtros, ordenação e item aberto devem sobreviver ao compartilhamento e ao retorno do drawer.

## 3. Cabeçalho

Exibir apenas indicadores acionáveis:

- sinais aguardando decisão;
- apostas em andamento;
- outcomes vencendo;
- outcomes atrasados;
- itens bloqueados por dados.

Cada indicador aplica filtro na área correspondente. Não exibir big number sem período e comparação.

## 4. Fila/feed

### 4.1 Papel

A Fila é a interface principal. Ela explica o movimento do sistema e oferece o próximo passo. Apenas produtores sistêmicos escrevem nela.

### 4.2 Tipos de post

| Tipo | Gatilho | Ação principal |
|---|---|---|
| `signal_detected` | regra encontrou desvio/oportunidade | transformar em aposta |
| `recommendation_created` | diagnóstico produziu recomendação | revisar contrato |
| `data_quality_blocked` | evidência insuficiente | abrir recuperação |
| `bet_created` | sinal aceito | abrir aposta |
| `bet_updated` | estado/checklist alterado | abrir timeline |
| `execution_recorded` | execução confirmada | acompanhar janela |
| `outcome_due` | janela chegou ao fim | revisar outcome |
| `outcome_evaluated` | sistema calculou veredito | confirmar/contestar |
| `learning_created` | outcome revisado | consultar aprendizado |
| `learning_expired` | validade venceu | abrir memória |
| `report_candidate_generated` | build certificado | abrir candidata |
| `report_published` | ativação concluída | abrir Report Live |
| `report_blocked` | build/publicação bloqueado | abrir diagnóstico |

### 4.3 Anatomia do post

Todo post declara:

- tipo;
- frente;
- timestamp;
- título humano;
- resumo;
- impacto;
- evidência;
- confiança;
- entidade/escopo;
- estado;
- uma ação principal;
- no máximo duas ações secundárias.

Modelo:

```text
[Sinal] [CRM Aquisição] [Confiança média]                   há 2h

Serasa perdeu finalização em Abandonados via WhatsApp

Impacto: 184 cartões abaixo da faixa esperada.
Evidência: 14.392 aprovados; finalização 3,1%; faixa 4,0%–4,6%.
Limite: comparação restrita ao regime iniciado em fev/2026.

[Transformar em aposta] [Abrir evidências]
```

### 4.4 Ordenação

**Prioridade**

```text
impacto × urgência × confiança ÷ esforço
```

O score bruto pode ordenar, mas a interface também exibe o motivo.

**Recentes**

`occurred_at desc`.

**Relevância**

Peso por compatibilidade com filtros ativos, estado aberto, entidade, frente, vigência e memórias aplicáveis. Não depende de seguidores ou preferências sociais.

### 4.5 Agrupamento

Atualizações repetitivas de um mesmo objeto formam um grupo:

```text
7 atualizações na aposta "Revisar sequência de Abandonados"
```

Publicação normal de checkpoints técnicos fica silenciosa. O feed destaca conclusão, bloqueio, falha ou alteração material.

### 4.6 Interações excluídas

- posts humanos;
- curtidas;
- reações;
- comentários no feed;
- compartilhamento social;
- seguidores.

Ações de workflow continuam permitidas.

## 5. Apostas

### 5.1 Visão principal

Tabela compacta com ordenação e filtros:

| Aposta | Frente | Métrica | Expectativa | Janela | Time/owner | Estado |
|---|---|---|---|---|---|---|

### 5.2 Drawer

- hipótese;
- evidência congelada;
- ação;
- baseline;
- expectativa;
- critério de sucesso;
- janela;
- time/owner opcional;
- checklist;
- atualizações;
- comentários internos;
- anexos/links;
- histórico;
- aprendizado usado;
- outcome associado.

### 5.3 Colaboração

Comentários existem somente dentro da aposta. Não transformar essa área em gerenciador de projetos completo no primeiro corte.

## 6. Outcomes

Buckets:

- vencem hoje;
- atrasados;
- aguardando dados;
- prontos para revisão;
- confirmados;
- contestados;
- não verificáveis.

O drawer confronta contrato e observado:

| Contrato | Observado |
|---|---|
| baseline | valor medido |
| expectativa | desvio |
| direção | direção realizada |
| janela | cobertura disponível |
| escopo | execução real |

Ações: `Confirmar veredito` e `Contestar`. Confirmar ou contestar produz evento no feed. Depois da resolução, o sistema materializa memória automaticamente.

## 7. Memória

### 7.1 Visão principal

Biblioteca pesquisável por:

- frente;
- entidade;
- parceiro;
- canal;
- segmento;
- campanha;
- métrica;
- regime;
- classificação;
- confiança;
- vigência.

### 7.2 Estados visuais

- confirmado;
- direcional;
- contraditório;
- inconclusivo;
- invalidado;
- expirado;
- substituído.

### 7.3 Edição

Não haverá editor rico no MVP. A interface permite consulta e navegação. Alterações solicitadas via LLM/Supabase criam nova revisão e preservam a anterior.

## 8. Report Live

Exibir:

- publicação ativa;
- candidata atual;
- build e certificação;
- QA;
- histórico;
- geração/publicação/recuperação;
- links e downloads;
- apostas, outcomes e aprendizados projetados.

Os detalhes estão em `REPORT_LIVE_RELOCATION_PLAN.md`.

## 9. Filtros persistentes

- período;
- frente;
- BU;
- parceiro;
- canal;
- segmento;
- campanha;
- time/owner;
- confiança;
- estado.

Filtros ativos aparecem como chips removíveis. Nenhum item some sem que o motivo seja auditável.

## 10. Estados sistêmicos

Toda área define:

- loading com skeleton real;
- empty explicativo;
- error com recuperação;
- stale;
- partial;
- blocked;
- conflict;
- reviewed.

## 11. Notificações

Somente no GaaS:

- badges de contagem;
- destaque na Fila;
- indicador de outcome vencido;
- indicador de Report Live bloqueado/publicado.

Sem e-mail, Teams, push ou integração externa no primeiro lançamento.
