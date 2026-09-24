# Especificação para Claude Cowork — renderer PPTX/PDF do Report Live

**Status:** contrato de implementação para revisão  
**Público visual:** institucional Afinz  
**Output:** PPTX editável, PDF equivalente, thumbnails e relatório de QA  
**Fora do escopo:** Supabase, scheduler, banco, engine analítico, escolha de slides, publicação e interface do GaaS

## 1. Objetivo

Implementar um renderer local e determinístico que receba um `report-render-package.json` e produza slides completos, bem diagramados e fiéis à identidade Afinz. O renderer substitui Google Slides como destino visual. Ele não substitui o engine do Report Live.

"Slide completo" significa que toda página renderizada possui, quando aplicável:

1. título que identifica o assunto ou takeaway sustentado;
2. contexto de período, entidade e recorte;
3. valor principal formatado;
4. comparação e baseline declarados;
5. evidência visual apropriada;
6. narrativa de decisão;
7. limite de leitura;
8. confiança e estado de dado;
9. fonte, cutoff e `run_id` no rodapé;
10. notas do apresentador com procedência e campos usados.

Nenhum slide pode sair como placeholder, dump de JSON, tabela crua sem hierarquia ou caixa vazia escondendo campo obrigatório.

## 2. Fontes que devem ser lidas antes de implementar

Nesta ordem:

1. `.claude/skills/afinz-pptx/SKILL.md`;
2. `.claude/skills/afinz-pptx/brand_spec.md`;
3. `MASTER_DECK_SPEC.md`;
4. `Afinz-CRM-Midia-Vault/05-Estrategia/Report-Live-Arquitetura-Editorial.md`;
5. `supabase/functions/_shared/report-live-design.ts`;
6. `supabase/functions/report-sync/report-live-engine.ts`, somente projeção de perfis e `SlideRun`;
7. `supabase/functions/report-sync/report-live-versioning.ts`, somente blueprint e certificação;
8. `docs/plans/learning-loop/RELEASE_7C_EDITORIAL_SPEC.md`.

Em caso de divergência:

- semântica e elegibilidade: `MASTER_DECK_SPEC.md` e artefato do run;
- lista concreta de slides: `slides[]` recebido no pacote;
- marca: skill `afinz-pptx`;
- geometria-base: esta spec e `report-live-design.ts`;
- número ou veredito: pacote recebido, nunca interpretação do renderer.

## 3. Entregáveis

O trabalho do Claude termina com:

```text
report_live_renderer/
├── __main__.py
├── model.py
├── theme.py
├── formatting.py
├── charts.py
├── validation.py
├── archetypes/
│   ├── cover_contract.py
│   ├── executive_takeaway.py
│   ├── quality_gate.py
│   ├── scorecard.py
│   ├── time_series_pacing.py
│   ├── router_ranking.py
│   ├── driver_scatter.py
│   ├── funnel.py
│   ├── heatmap.py
│   ├── analytical_table.py
│   ├── action_queue.py
│   └── technical_annex.py
└── tests/
```

Comandos-alvo:

```bash
python -m report_live_renderer render \
  --package report-render-package.json \
  --template .claude/skills/afinz-pptx/assets/afinz_template_institucional.pptx \
  --output-dir dist/report-live

python -m report_live_renderer validate \
  --package report-render-package.json \
  --pptx dist/report-live/report-live.pptx \
  --pdf dist/report-live/report-live.pdf
```

Arquivos produzidos:

```text
dist/report-live/
├── report-live.pptx
├── report-live.pdf
├── manifest.json
├── qa-report.json
└── previews/page-001.png ... page-NNN.png
```

## 4. Contrato de entrada

O renderer recebe um pacote normalizado. Ele não consulta Supabase e não interpreta o artefato bruto.

```ts
type ReportRenderPackage = {
  schema_version: "1.0";
  run_id: string;
  profile: "executivo_mensal" | "deep_dive";
  period: { start: string; end: string; data_through: string };
  publication: {
    generated_at: string;
    spec_version: string;
    semantic_version: string;
    renderer_version: string;
  };
  source_cutoffs: Record<string, string | null>;
  quality_status: "confirmed" | "directional" | "suspect" | "blocked";
  slides: RenderSlide[];
};

type RenderSlide = {
  slide_instance_id: string;
  slide_code: string;
  display_order: number;
  section: "core" | "partner" | "media" | "b2c" | "conditional" | "annex";
  archetype: string;
  title: string;
  subtitle?: string | null;
  partner?: string | null;
  audience: string;
  eligibility: "render" | "render_com_limites";
  confidence: "confirmed" | "directional" | "suspect" | "blocked";
  narrative: {
    takeaway: string;
    evidence: string[];
    action?: string | null;
    limitation: string;
  };
  visual: ArchetypePayload;
  provenance: {
    source_view: string | null;
    evidence_refs: string[];
    window_label: string;
    source_cutoffs: Record<string, string | null>;
    data_hash: string;
  };
};
```

O array `slides[]` já chega projetado e ordenado. O renderer deve produzir exatamente uma página para cada item, sem reordenar, promover, omitir ou criar slides.

Cardinalidade esperada:

- `executivo_mensal`: 12 slides;
- `deep_dive`: 31 slides.

Qualquer outra quantidade é erro bloqueante de contrato.

## 5. Inventário completo

O renderer deve suportar todos os códigos que podem entrar nos dois perfis:

| Família | Códigos |
|---|---|
| Core | C0, C1, C2, C3, C4, C5, C6, C7, C8 |
| Parceiro | P1, P2, P3, P4, P5, P6, P7 |
| Mídia | M1, M2, M3, M4, M5, M6, M7 |
| B2C | B1, B2, B3 |
| Condicionais ativos | K-SEG, K-TPL, K-EXP, K-QLT |
| Anexo | A1, A2, A3, A4, A5, A6, A7 |

`K-VISA` está aposentado e não pode reaparecer em novos renders.

Os dez arquétipos editoriais do vault são implementados como doze contratos de renderer. A separação de `driver_scatter`, `heatmap` e `technical_annex` evita condicionais visuais escondidas dentro de um renderer genérico.

## 6. Anatomia comum

Canvas: 16:9, `720 × 405 pt`, equivalente ao template institucional `13,333" × 7,5"`.

Zonas:

```text
y 0–90     cabeçalho, título, contexto e status
y 100–355  evidência visual + narrativa
y 371–405  rodapé de procedência
```

Margem horizontal: 28 pt. Nenhum elemento pode invadir o rodapé ou a área reservada ao logo.

Todo slide de conteúdo deve ter:

- código discreto do slide;
- título;
- contexto do período e entidade;
- chip de confiança;
- corpo visual;
- takeaway ou leitura da decisão;
- limitação quando `render_com_limites`;
- rodapé com fonte, janela, cutoff e run.

## 7. Contratos por arquétipo

### 7.1 `cover_contract`

Uso: C0.

- capa institucional escura;
- nome Report Live;
- período e perfil;
- manchete do período, sem inventar conclusão;
- dados considerados até;
- status geral de qualidade;
- versão e `run_id` discretos;
- sem tabela, gráfico ou texto longo.

### 7.2 `executive_takeaway`

Uso: C1.

- um KPI âncora com valor, delta e baseline;
- até três movimentos materiais;
- para cada movimento: sinal, impacto, evidência e limite;
- até uma ação principal;
- nenhum número calculado pelo texto.

### 7.3 `quality_gate`

Uso: C2, M6, B3 e K-QLT.

- estado por fonte;
- cutoff nativo e gap;
- cobertura/comparabilidade;
- bloqueios claramente separados de dado ausente;
- impacto operacional e ação de recuperação;
- nunca transformar falha de coleta em desempenho zero.

### 7.4 `scorecard`

Uso: C3 e P1.

- no máximo três métricas;
- cada métrica exibe valor, delta, baseline, faixa e veredito;
- números formatados em pt-BR;
- pequena série histórica quando fornecida;
- hierarquia visual entre KPI principal e apoios;
- sem grade de cards genérica ocupando toda a página.

### 7.5 `time_series_pacing`

Uso: C4, M1 e B2.

- um único gráfico principal;
- realizado e período equivalente;
- meta somente quando certificada;
- gaps de coleta aparecem como quebra, nunca zero;
- eixo, unidade e período declarados;
- nota de parcialidade para mês aberto.

### 7.6 `router_ranking`

Uso: C5, M2 e M3.

- ranking ordenado;
- volume, variação, posição na faixa e status;
- materialidade e confiança visíveis;
- no máximo oito linhas no corpo;
- excedente vai para anexo, nunca é comprimido até ficar ilegível.

### 7.7 `driver_scatter`

Uso: C6.

- eixos explicitamente nomeados;
- bolha codifica volume;
- linha de referência apenas quando certificada;
- rótulos dos pontos materiais;
- legenda curta;
- takeaway diferencia eficiência com escala de baixa amostra.

### 7.8 `funnel`

Uso: P4, M4 e B1.

- taxas recebem protagonismo;
- absolutos aparecem como apoio;
- cada etapa declara numerador e denominador;
- `lead_pre_qualificado` usa volume e conversão final, sem funil enganoso;
- funis B2C/CRM/Serasa permanecem paralelos;
- etapa missing permanece interrompida.

### 7.9 `heatmap`

Uso: P3 e A1.

- eixos e unidade legíveis;
- valor dentro da célula quando houver espaço;
- escala semântica documentada;
- missing, zero observado e n/a visualmente distintos;
- sem gradiente que sugira bom/ruim quando a métrica não tiver direção favorável.

### 7.10 `analytical_table`

Uso: C7, P2, P5, P6, M5, K-SEG, K-TPL e K-EXP.

- tabela editável;
- cabeçalho persistente e alinhamento numérico;
- no máximo oito linhas no corpo;
- top N declarado;
- activity names são decodificados para canal, segmento, oferta e ordem;
- C7 separa `outcome`, `aprendizado_do_loop` e `memoria_curada`;
- memória curada declara que não constitui validação causal.

### 7.11 `action_queue`

Uso: C8, P7 e M7.

- buckets Agir hoje, Acompanhar e Investigar;
- sinal, impacto, evidência, ação, confiança, owner, prazo e métrica;
- aposta e candidata do engine permanecem objetos distintos;
- no máximo seis itens em C8 e um item nos slides locais;
- nenhum item aparece como causalidade comprovada sem outcome.

### 7.12 `technical_annex`

Uso: A2–A7.

- densidade maior, sem quebrar legibilidade;
- corpo mínimo de 9 pt;
- paginação da tabela dentro do próprio conjunto de slides recebido;
- definições, regras e logs preservados;
- nenhuma simplificação que altere o contrato auditável.

## 8. Marca e tema

- usar o template institucional versionado;
- aplicar `apply_afinz_brand.py --audience institucional` no arquivo final;
- fundo escuro em capa e divisórias;
- fundo claro nos slides analíticos;
- azul `#00C6CC` e verde `#D3FF00` equilibrados como marca;
- vermelho apenas para bloqueio ou quebra de integridade;
- BU continua sendo a dimensão semântica do dado quando o pacote fornecer cor própria;
- Calibri como fonte gravada, Lembra apenas como ideal de marca;
- logo sem distorção;
- nenhum resíduo de tema default do Office.

O renderer não pode usar a cor de marca para sobrescrever uma cor semântica declarada no pacote.

## 9. Gráficos e editabilidade

- tabelas devem permanecer editáveis;
- textos e formas devem permanecer editáveis;
- gráficos podem ser nativos ou SVG, mas o mesmo contrato deve produzir aparência equivalente no PPTX e no PDF;
- um gráfico principal por slide;
- no máximo quatro séries visíveis;
- eixos, nomes de série, unidade, escala e formato numérico são obrigatórios;
- percentual armazenado como fração deve aparecer como percentual;
- taxa varia em pontos percentuais; volume e custo variam em percentual;
- CPA sempre nomeia o evento e nunca recebe o rótulo CAC.

Recomendação: usar SVG para séries e distribuições, reduzindo divergência entre PowerPoint e PDF. Se o renderer optar por gráfico nativo, deve acrescentar testes de workbook, eixos e formato.

## 10. Overflow e densidade

Ordem obrigatória de resolução:

1. resumir texto sem remover evidência ou limite;
2. reduzir linhas ao top N declarado;
3. mover detalhe para notas do apresentador;
4. usar variante compacta prevista para o arquétipo;
5. falhar com erro de overflow.

O renderer não pode:

- reduzir corpo abaixo de 11 pt, ou 9 pt no anexo;
- cortar texto silenciosamente;
- esconder limitação;
- remover fonte/cutoff;
- criar slide adicional sem que ele exista em `slides[]`.

## 11. Estados de dado

Preservar quatro estados:

- `valor_observado`: valor normal;
- `zero_observado`: `0`, com semântica de zero real;
- `missing`: `—` e nunca participa de delta;
- `nao_aplicavel`: `n/a`.

Slides `render_com_limites` devem continuar completos, mas com a limitação visível. O renderer nunca recebe `omitir_bloqueado`; se receber, deve falhar o pacote.

## 12. Notas do apresentador

Cada slide deve registrar:

- `run_id` e `slide_instance_id`;
- `source_view`;
- janela e cutoffs;
- `evidence_refs`;
- hash do dado;
- definição de métricas não óbvias;
- limitação completa quando o corpo usar uma forma resumida.

## 13. QA e certificação local

Gates bloqueantes:

1. PPTX abre e possui o número esperado de slides;
2. PDF abre e possui o mesmo número de páginas;
3. ordem e `slide_instance_id` correspondem ao pacote;
4. nenhum texto estoura caixa ou canvas;
5. nenhuma shape invade rodapé ou logo;
6. fonte mínima respeitada;
7. nenhum texto obrigatório fica vazio;
8. todo gráfico tem eixo/unidade/séries;
9. toda tabela cabe e preserva cabeçalho;
10. nenhum null aparece como zero;
11. checksums do PPTX, PDF e previews são gerados;
12. todas as páginas são renderizadas para imagem e inspecionadas visualmente.

O `qa-report.json` deve listar cada slide, erros, warnings e evidência dos checks automáticos.

## 14. Fixtures obrigatórias

Implementar pelo menos:

- perfil executivo com 12 slides;
- deep dive com 31 slides;
- mês corrente parcial;
- Serasa em `lead_pre_qualificado` e regime incomparável;
- parceiro com amostra insuficiente;
- C7 sem outcomes, mas com memória curada;
- C8 com uma aposta e uma candidata;
- falha de freshness;
- missing, zero observado e n/a na mesma fixture;
- tabela no limite de oito linhas;
- texto no limite da caixa.

## 15. Critérios de aceite

- os perfis completos de 12 e 31 slides são gerados a partir do mesmo pacote-base;
- todas as páginas têm estrutura completa, procedência e limite de leitura;
- o renderer não consulta Google nem Supabase;
- o renderer não recalcula métricas nem seleciona slides;
- PPTX e PDF correspondem ao mesmo `run_id` e conteúdo;
- o arquivo segue a marca institucional Afinz;
- os testes e o QA visual são reproduzíveis por comando;
- um golden run real é comparado ao PDF vigente antes da integração;
- nenhum upload ou publicação ocorre como parte deste trabalho.

## 16. Condições para parar e reportar

Pare antes de continuar se:

- o pacote não trouxer dado suficiente para um elemento obrigatório;
- a template institucional não puder ser usada sem perda do slide master;
- a conversão para PDF trocar fontes ou quebrar gráficos;
- uma regra exigir recalcular números;
- a cardinalidade divergir de 12/31;
- a solução depender de Google ou de edição manual pós-render.

Reporte a lacuna com `slide_code`, campo ausente, impacto e menor alteração contratual necessária.

