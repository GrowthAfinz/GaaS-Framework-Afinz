# ADR-004 — Dimensão canônica de parceiro e faixa histórica como fundação do Report Live

**Status:** revisada em 2026-09-13 (**v2**) após verificação bloqueante do Codex contra o código do engine. Aguardando execução da Fase 1. Nenhum código de produção alterado.
**Contexto gerador:** auditoria do PDF de produção candidata de agosto/2026 (run `9bb55892`) + inventário das tabelas de memória no Supabase `mipiwxadnpwtcgfcedym`.

> **Histórico de revisão.** A v1 desta ADR propunha uma regra de parceiro **inferida por reconciliação numérica**, não lida no código. O passo 0 bloqueante do prompt do Codex mandou conferir contra `report-live-engine.ts` antes de materializar; a conferência mostrou que a regra inferida **não era equivalente** à real. A v2 substitui a regra inferida pela regra fiel. Registro do episódio na seção 7 — o gate funcionou como desenhado e evitou propagar uma regra errada para todos os consumidores.

---

## 1. Contexto

O motor do Report Live está sólido: build durável, certificação, publicação por geração, PDF antes da ativação, recuperação testada. Nada nesta ADR toca nisso.

O problema está na camada acima, e tem uma causa única: **o relatório não tem memória**. Toda leitura é uma foto contra a foto anterior.

### 1.1 O delta mensal isolado inverte o sinal da história

O deck de agosto informa que o CAC da Serasa caiu 18% contra julho. A série de seis meses mostra o oposto:

| mês | mar | abr | mai | jun | jul | ago |
|---|---:|---:|---:|---:|---:|---:|
| CAC Serasa | 2,93 | 5,25 | 5,08 | 4,89 | 8,79 | 7,21 |

**+146% no semestre**, com volume estável (887–1.155 cartões). O parceiro mais eficiente está ficando caro e o relatório comunica boa notícia.

### 1.2 Sem faixa, uma taxa isolada induz a conclusão errada

Taxa de finalização (aprovados → cartões) da Proprietária:

| mês | mar | abr | mai | jun | jul | ago |
|---|---:|---:|---:|---:|---:|---:|
| finalização | 46,7% | 54,9% | **12,5%** | **17,1%** | 53,8% | **58,6%** |

Os 58,6% de agosto são o **melhor mês do semestre**, não um gargalo. A anomalia real é maio/junho — em junho, 5.749 aprovados produziram 973 cartões — e nunca apareceu em nenhum report.

### 1.3 A dimensão de parceiro do deck não existe como dado consultável

O engine deriva o parceiro canônico **em tempo de leitura, em TypeScript**, e o resultado nunca é persistido. A função é `resolvePartner()` em `supabase/functions/report-sync/report-live-engine.ts` (≈linha 184), aplicada uma única vez antes de qualquer agrupamento (≈linhas 893–897).

A regra real, com precedência do sinal mais forte para o mais fraco:

1. **Parceiro explicitamente preenchido e diferente de `N/A`** → preservado **literalmente**, qualquer que seja o valor. Motivo `EXPLICIT_PARTNER`, confiança alta.
2. **`BU = 'Plurix'` com evidência contextual** → `Plurix`. A evidência é o token `(^|_)(plu|plx|plurix)` no Activity Name **ou** a string `plurix` no nome da jornada — este segundo caso cobre a jornada de carrinho assistido, cujo activity é o genérico `afz_..._grl_`. Motivo `BU_PLURIX_SELF_ATTRIBUTION`, confiança alta.
3. **`BU = 'B2C'` sem parceiro externo** → `Proprietaria`, porque é base própria da Afinz. Motivo `B2C_INSTITUTIONAL_OWN_BASE` quando o Activity Name casa `institucional|inst(?![a-z])`, senão `B2C_CAMPAIGN_TWIN_MATCH`. Confiança alta.
4. **Nada disso** → permanece `N/A`, motivo `UNRESOLVED`, **confiança baixa**, e cai na faixa de integridade.

O comentário do código registra uma advertência que precisa sobreviver a qualquer reimplementação: **a jornada não é fonte confiável de parceiro**. O token `_NA_` aparece tanto em jornadas da Proprietária quanto em `N/A` real, e em Serasa a quarta posição é cadência (`CARRINHO`/`21D`/`SAB`). O sinal confiável é BU + prefixo do Activity Name; o teste sobre a jornada existe apenas como confirmação adicional no caso específico de Plurix.

**Saúde da regra no semestre mar–ago/2026** (4.331 disparos):

| Motivo | Linhas | Cartões |
|---|---:|---:|
| `EXPLICIT_PARTNER` | 2.424 | 9.982 |
| `BU_PLURIX_SELF_ATTRIBUTION` | 1.439 | 4.876 |
| `B2C_CAMPAIGN_TWIN_MATCH` | 225 | 998 |
| `B2C_INSTITUTIONAL_OWN_BASE` | 242 | 58 |
| `UNRESOLVED` | **1** | **0** |

A regra resolve 99,98% das linhas do período.

**O problema.** A resolução existe só em memória, durante o build. Não há coluna, não há view — `VIEW_PARTNER_RESOLUTION`, citada no comentário do engine, é uma aba do Sheets, **não uma view do Postgres** (verificado: não existe em `information_schema`). Consequência: qualquer pessoa que consulte `activities` direto chega a números diferentes do deck publicado, e não há como auditar a procedência da resolução em SQL.

O risco é maior do que parece porque a composição **virou entre julho e agosto**: em julho a Proprietária era 373 registros com parceiro literal + 100 resolvidos por BU; em agosto, **0 literais + 912 resolvidos por BU**. `Parceiro = 'N/A'` passou a carregar 56% de todos os cartões, contra 32% em julho e 38% em junho.

> Procedência: essa regressão do N/A é o resultado não acompanhado de uma recomendação emitida pelo próprio sistema em junho ("reduzir parceiro N/A a <10%"), que nunca teve outcome verificado. Ver Fase 3 do SDD.

### 1.4 Bug de grão em canais

`VP_<parceiro>_CHANNELS` devolve grão de jornada, não de canal: o slide de canais da Proprietária mostra WhatsApp 3×, SMS 3× e E-mail 2× — dez barras para quatro canais reais. É `group by` errado, não escolha de design.

### 1.5 Semântica de funil incompatível na Serasa

Propostas (25.608) **maiores** que base acionável (21.721) em agosto — taxa de 118%, e 186% em março. Aprovação entre 99,1% e 99,9% em todos os seis meses. É lead externo pré-qualificado. O arquétipo de funil aplicado à Serasa desenha um funil que cresce e não sinaliza nada.

---

## 2. Decisão

**2.1** Materializar a resolução em **três colunas geradas** (`GENERATED ALWAYS AS ... STORED`) em `activities`: `parceiro_canonico`, `parceiro_canonico_motivo` e `parceiro_canonico_confianca` — replicando fielmente `resolvePartner()`, sem alterar a regra. O valor bruto de `"Parceiro"` e `"BU"` permanece intocado.

Materializar as três, e não só o parceiro, porque o engine produz as três e a procedência é o que distingue "resolvido com confiança" de "não mapeado". Reduzir a uma coluna reintroduziria o problema que a v1 desta ADR tinha: uma categoria de destino sem explicação.

**2.2** Criar a view `v_aquisicao_mensal_canonico` com a série mensal por parceiro canônico **e a faixa móvel dos 6 meses anteriores** (mín, máx) para cada métrica material. Fonte única da régua de comparação, do veredito de anomalia e do critério de permanência de slide.

**2.3** **Teste de equivalência SQL ↔ TypeScript no CI.** Item novo e não negociável — ver seção 4.

**2.4** Corrigir o grão de `VP_<parceiro>_CHANNELS` para uma linha por canal.

**2.5** Expor marcador de semântica de funil não-padrão por parceiro, em vez de aplicar o mesmo arquétipo a todos.

---

## 3. Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Só uma view canônica, sem coluna | Não impede que alguém consulte `activities` direto e chegue a outro número — que é o risco central. |
| Coluna normal + trigger | Mais superfície de falha; a coluna pode divergir se o trigger falhar. A expressão depende só de colunas da própria linha, então a coluna gerada cobre sem manutenção. |
| Backfill de `"Parceiro"` | Reescreve dado bruto, viola "preservar o valor bruto ao lado da dimensão canônica" e não se mantém nas próximas cargas. |
| Fazer o engine persistir o que já calcula | **Arquiteturalmente a melhor** — elimina a duplicação da regra. Mas exige tocar no engine, que está fora de escopo nesta fase. Registrada como evolução futura (seção 6). |
| Faixa calculada no renderer | Cada consumidor reimplementa e diverge. A faixa precisa ser a mesma para o slide, o veredito e a verificação de recomendação. |

---

## 4. O risco que a regra real introduz — e como neutralizá-lo

A regra da v1 era trivial. A regra real é **contextual**: depende de regex sobre Activity Name e jornada. Replicá-la em SQL cria **duas implementações da mesma regra, em duas linguagens**. Se `resolvePartner()` evoluir, a coluna gerada diverge silenciosamente — e a divergência aparece como número diferente entre o deck e qualquer consulta, que é exatamente o problema que esta ADR existe para resolver.

**Mitigação obrigatória, em duas camadas.** A v2 desta ADR especificava "comparar o dataset completo de `activities` no CI". Isso foi **reprovado na verificação** e estava errado por dois motivos independentes:

- *Inviável:* o CI hoje é um único workflow que instala, builda e publica, sem nenhum secret configurado; `activities` está sob RLS. Não há como o CI ler a tabela.
- *Metodologicamente inferior:* o risco a neutralizar é **mudança de código**, não mudança de dados. Se as duas implementações são equivalentes para todo input possível, continuam equivalentes para dados futuros — a menos que alguém mude uma delas. E o dataset de produção cobre mal justamente os ramos perigosos: `UNRESOLVED` tem 1 linha em 4.331 e parceiro explícito fora da lista tem **zero** ocorrências no semestre. Validar contra produção repetiria exatamente o erro que derrubou a v1: confundir "os casos que aconteceram" com "os casos que a regra distingue".

**Camada 1 — equivalência de regra, no CI, sem banco de produção.** Job com serviço Postgres em container (mesma major do Supabase), tabela mínima com o DDL real das colunas geradas, uma matriz de casos sintéticos cobrindo cada ramo e cada fronteira, e comparação com a saída de `resolvePartner()` nos três campos. Zero credencial, zero dado de produção, segundos de execução. Qualquer divergência quebra o build.

A matriz precisa cobrir, no mínimo: parceiro explícito comum **e um valor nunca visto**; `N/A` em caixas e com espaços; parceiro vazio e nulo; `BU=Plurix` com token no Activity Name, com `plurix` só na jornada, e **sem nenhum dos dois** (deve permanecer não resolvido); token Plurix em posição que o `(^|_)` não aceita; `BU=B2C` com `institucional`, com `inst_`, e com **`instalacao`** — este último é a fronteira do negative lookahead e deve cair em `B2C_CAMPAIGN_TWIN_MATCH`, não em `B2C_INSTITUTIONAL_OWN_BASE`; BU vazia e BU de outra frente.

**Camada 2 — reconciliação em dados reais, dentro do build.** O build já carrega as linhas do período e já executa `resolvePartner()`. Comparar, ali, o resultado da função com o valor da coluna gerada nas linhas do snapshot, e emitir **bloqueio de qualidade** em caso de divergência. Custo marginal zero, acontece onde o acesso ao dado já é legítimo e auditado, e cobre o dataset evolutivo — que era a preocupação correta por trás do requisito original.

**Rejeitado:** provisionar credencial de leitura de produção como secret do GitHub Actions. Conflita com POL002-00 (dado de produção fora de dev/CI), amplia a superfície de um CI que hoje não tem nenhum secret, e entrega menos cobertura de ramo do que casos sintéticos. Sem esse teste em duas camadas, a decisão 2.1 não deve ser implementada.

Pontos de atenção na tradução JS → SQL:

- `String(x ?? "").trim()` → `coalesce(btrim(x), '')`; a checagem `raw && raw.toUpperCase() !== 'N/A'` vira `<> '' and upper(...) <> 'N/A'`.
- `/(^|_)(plu|plx|plurix)/i` → `~* '(^|_)(plu|plx|plurix)'`.
- `/institucional|inst(?![a-z])/i` → `~* 'institucional|inst(?![a-z])'`. O negative lookahead **é suportado** pelo Postgres (ARE) e foi verificado rodando contra a base. Ainda assim, esse token afeta apenas o **motivo**, nunca o parceiro — se houver qualquer diferença de dialeto, ela fica contida na coluna de motivo e não contamina os agrupamentos.
- `confianca` é hoje função direta do motivo (`UNRESOLVED` → baixa, resto → alta). Materializar mesmo assim, para não obrigar o consumidor a conhecer essa dependência.

---

## 5. Consequências

**Positivas.** A faixa histórica passa a existir como dado, habilitando régua, veredito determinístico e verificação de outcome. Qualquer consulta direta passa a bater com o deck. A procedência da resolução vira auditável em SQL pela primeira vez.

**Custos e riscos.**

- `ADD COLUMN ... GENERATED ... STORED` reescreve a tabela. Volume pequeno (4.331 disparos no semestre; ≈7,4k registros de aquisição no total), mas exige janela e migration rastreada.
- As expressões precisam ser IMMUTABLE — são (`case/when`, `btrim`, `upper`, `~*` sobre colunas da própria linha).
- Duplicação da regra em duas linguagens, neutralizada pelo teste da seção 4.
- Se `resolvePartner()` mudar, as colunas exigem `DROP`/`ADD` — custo aceitável em troca de não ter a regra reimplementada em N consultas ad hoc.

**Não muda.** Motor determinístico, máquina de estados, certificação, contrato de imutabilidade, publicação por geração, RLS aplicado em 13/09. **A regra de resolução não é alterada** — apenas replicada.

---

## 6. Evolução futura registrada

Fazer o engine **persistir** `canonical_partner`/`reason`/`confidence` no snapshot ou numa tabela de resolução, e a coluna gerada ser aposentada em favor dessa fonte única. Elimina a duplicação de vez. Exige autorização separada para tocar no engine e deve ser avaliada depois que a Fase 1 estiver estável.

---

## 7. Registro do episódio de verificação

A v1 afirmava que a regra era `Parceiro in (Serasa, Bem Barato, Dia)` literal · `BU=Plurix → Plurix` · `Parceiro='Proprietaria' or (BU='B2C' and Parceiro='N/A') → Proprietaria` · `else 'Outros'`.

Essa regra reproduziu **exatamente** os cinco parceiros do run `9bb55892` em agosto (988 · 912 · 698 · 158 · 93) e no equivalente de julho (939 · 473 · 625 · 217 · 36), além do total do período. Dez de dez números, em dois meses independentes — e ainda assim **não era a regra**.

Coincidiu porque, no recorte observado, não havia parceiro explícito fora da lista de três, nem `BU=Plurix` sem evidência contextual, nem parceiro nulo em B2C. Divergências materiais:

| Caso | Engine | ADR v1 |
|---|---|---|
| Parceiro explícito não listado | preserva o valor bruto | converteria para `Outros` |
| `BU=Plurix` sem evidência contextual | permanece não resolvido | converteria para `Plurix` |
| `BU=B2C` com parceiro vazio | `Proprietaria` | converteria para `Outros` |
| Não resolvido | `N/A` + motivo + confiança baixa | `Outros`, sem procedência |

**Lição a carregar para as próximas fases:** reconciliação numérica valida *resultado*, não *regra*. Quando uma regra vai ser materializada — isto é, passa a valer para dados futuros e não só para os observados — a fonte tem que ser o código, não a coincidência. O passo bloqueante deve continuar existindo em toda spec que materialize lógica derivada.

Para o registro: a série de 6 meses publicada no vault foi reconferida com a regra fiel e **não muda** — divergência de zero cartões em todos os meses e parceiros. O erro estava na regra, não nos números.

---

## 8. Guardrails herdados (não negociáveis)

- Ausência não é zero. Não resolvido é estado explícito com motivo, nunca uma categoria de descarte.
- CPA de plataforma ≠ CAC de CRM.
- **Taxa sempre calculada da soma**, nunca média das taxas armazenadas — a auditoria de 09/09 achou 774 CACs gravados divergentes de custo/cartões.
- Não deduplicar nem recalcular em massa sem diagnóstico — 375 grupos de chave candidata repetida, 330 com valores diferentes.
- Não somar níveis de hierarquia de mídia como fatos independentes.
- Variação de taxa em pontos percentuais, nunca em %.
- Veredito exige amostra: variação de taxa sobre volume baixo é ruído.

---

## 9. Relacionado

- `SDD_REPORT_LIVE_EVOLUCAO_EDITORIAL.md` — spec das três fases.
- `CODEX_PROMPT_fundacao_dados_report_live.md` — prompt de execução da Fase 1 (v2, com o passo 0 já resolvido).
- Vault: `02-Entidades-Dados/Dimensao-Canonica-de-Parceiro.md` · `06-Performance/Serie-Historica-Aquisicao-Mar-Ago-2026.md` · `05-Estrategia/Report-Live-Arquitetura-Editorial.md` · `09-Inteligencia-IA/Report-Live-Loop-de-Outcome.md`
- Vault: `08-Engenharia/Report-Live-Enciclopedia.md` — contratos de dados que não se negociam.
- `supabase/functions/report-sync/report-live-engine.ts` — `resolvePartner()` (≈184), aplicação em `buildReport()` (≈893–897).
