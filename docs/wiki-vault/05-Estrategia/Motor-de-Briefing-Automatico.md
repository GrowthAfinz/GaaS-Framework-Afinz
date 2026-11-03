---
tags: [estrategia,ia,briefing,copy,guardrail,arquitetura]
tipo: estrategia
camada: estrategia
atualizado: 2026-10-02
status: inferência
fonte: pesquisa-externa
---

# Motor de Briefing Automático

**Definição:** a arquitetura proposta para que uma IA monte o briefing de comunicação sozinha — lendo segmento, parceiro e produto da nossa própria base, e passando por guardrails determinísticos e contra-visão adversarial antes de entregar.

> Origem: pedido do Pablo em 19/08/2026 — *"deveria ser capaz de ler o segmento, saber o tom, ver o parceiro, saber os benefícios ativos, traçar o perfil, e propor briefing com contra-visão através de guardrails. Como desenvolver a partir de 100% da nossa base?"*
>
> Primeiro protótipo aplicado: 14 briefings Plurix (Repescagem Padrão / Upgrade Padrão).

## O problema real

Escrever uma régua hoje é reunir contexto na mão toda vez. Isso falhou de três jeitos observados:

1. **Benefício morto.** O programa de pontos Plurix encerrou em 01/07/2026. Nada na nossa base marcava validade de benefício — só descobrimos porque alguém foi checar fonte externa.
2. **Régua redundante.** 8 toques na mesma pessoa alternando canal. Sem controle de argumento, viram 8 mensagens dizendo a mesma coisa.
3. **Compliance sem contexto de crédito.** Repescagem já passou por nova análise e pode ter limite pré-aprovado, mas ainda exige "sujeito à análise de crédito" por causa da etapa final de antifraude/biometria. Upgrade depende do resultado declarado da nova análise (`maior` ou `menor`). Copiar uma peça sem resolver esse estado pode prometer emissão garantida ou comunicar o argumento errado.

## As 6 camadas

| Camada | O que faz | Matéria-prima que já temos | Lacuna |
|---|---|---|---|
| **1. Contexto** | Dado (BU, Parceiro, Segmento, Canal), monta tom, guidelines ✅/❌, nome de produto, regra de co-branding, nº de disparos | `03_SEGMENTOS_ESTRATEGIAS.md`, [[Dicionario-de-Produtos]], `estrutura_bau_regua.json`, guia de marca do parceiro | Nenhuma — ligável hoje |
| **2. Benefícios vigentes** | Só permite citar benefício com vigência aberta | [[Beneficios-e-Vigencia]] | ✅ **resolvida em 20/08/2026** |
| **3. Estilo derivado de dados** | Puxa as N peças reais do mesmo parceiro+segmento como few-shot, em vez de descrever tom em prosa | [[Amostras-Comunicacoes-Reais]] (73 peças), [[Templates-Vibe-Revisao-2026]] (61) | **Pipeline de captura contínua** — hoje é snapshot manual |
| **4. Guardrails determinísticos** | Regras binárias em código, antes de qualquer LLM | [[Pode-Dizer-Nao-Pode-Dizer]], limites por canal, [[Formatacao-WhatsApp-Variaveis-e-Espacamento]] | **Virar linter executável**, não checklist que o humano lê e esquece |
| **5. Contra-visão** | 2-3 juízes com lentes distintas tentando refutar; aprova por maioria | As próprias peças reais servem de baseline | **Juiz de redundância de régua** — ninguém faz, e é o que salva régua longa |
| **6. Saída** | Uma linha por `template_id`: copy, tamanho medido, link montado, rastro de evidência, flag de confiança | Protótipo entregue | — |

## Camada 4 — as regras que já dá para codificar hoje

```
SMS      → sem acento (acento joga para UCS-2 e o limite cai de 160 para 70)
SMS      → ≤160 chars COM o link já encurtado
WhatsApp → variável é {{n}}, nunca %%TAG%%
WhatsApp → CTA duplo obrigatório, saída sempre "Não tenho interesse agora"
WhatsApp → nenhum {{n}} reusado para dois campos distintos
Repescagem → bloqueia "negado", "recusado", "sua situação melhorou"
Repescagem → permite "pré-aprovado" e limite verdadeiro, mas exige "sujeito à análise de crédito"
Repescagem → não promete emissão: antifraude/biometria ainda pode impedir a conclusão
Upgrade    → resolve primeiro o resultado declarado no activity_name: `maior` ou `menor`
Upgrade maior → comunica aumento e limite verdadeiro quando disponível
Upgrade menor → reutiliza a linha de Repescagem
+amigo   → bloqueia "pontos" e "Vibe"
Bem Mais → bloqueia "veja seu saldo no app" e "adira pelo app"
Qualquer → benefício citado tem que existir em Beneficios-e-Vigencia com STATUS=VIGENTE
Qualquer → nome de produto tem que bater com o parceiro
Qualquer → nunca "anuidade grátis"
Qualquer → bloqueia "até 40 dias para pagar" enquanto não houver fonte oficial vigente e rastreável
Produto elegível ao Vibe → Vibe é a âncora/diferencial da proposta de valor, não benefício secundário
Topo de funil B2C SMS → 4 disparos, 1 por semana, durante 4 semanas
```

## Regras de limite, CTA e cálculo para SMS/Push

- **Meio de funil:** quando `%%LIMITE_CRD%%` estiver disponível, usar o limite verdadeiro da pessoa.
- **Topo de funil ou fonte sem limite declarado:** não inventar personalização. Uma alegação como **"até R$ 6.000"** é uma variante de teste válida somente com teto comercial aprovado.
- **Topo de funil B2C:** estruturar a mensagem com Vibe como âncora da proposta de valor e diferencial do produto; benefícios funcionais entram como sustentação.
- **Régua de SMS de topo de funil B2C:** gerar exatamente **4 SMS**, com **1 disparo por semana durante 4 semanas**. A progressão semanal deve variar o argumento sem perder a âncora Vibe.
- **Prazo de pagamento:** excluir **"até 40 dias para pagar"** de qualquer copy. A alegação permanece bloqueada até existir fonte oficial vigente, rastreável e validada.
- **Repescagem:** CTA-base `Peça seu cartão`.
- **Upgrade:** CTA-base `Conclua seu pedido`.
- Até os links definitivos serem governados, produzir a copy com `%%LINK_CONTINUAR%%`; o SMS final precisa ser recontado com o link encurtado real.
- As condições comerciais do Vibe pertencem ao checklist de copy/compliance. **Não entram como premissa nos cálculos de priorização ou performance desta régua**, conforme decisão operacional de 20/08/2026.

## Camada 5 — as três lentes

- **Compliance** — a peça afirma algo que ninguém confirmou? (ex.: *"sua oferta expira"*)
- **Marca** — soa como as peças reais **deste** parceiro, ou soa como copy genérica de banco?
- **Redundância de régua** — este toque repete argumento de outro toque da **mesma** régua?

O terceiro é o que ninguém faz e é justamente o que impede 8 toques de virarem 8 mensagens iguais.

> **Ressalva honesta:** LLM-as-judge é sensível a posição, verbosidade e formulação do prompt ([arXiv 2506.09443](https://arxiv.org/html/2506.09443v3)). Por isso a camada 4 tem que capturar **tudo que é binário** — o juiz só cuida do que é genuinamente subjetivo. **Juiz não substitui regra.**

## Achados de base que viraram regra

- **Topo de funil B2C SMS tem cadência definida em 20/08/2026:** 4 disparos, sendo 1 por semana durante 4 semanas. Para outras réguas, `d1..d8` continua representando ordem de disparo sem intervalo universal; a cadência precisa ser definida por jornada.
- **A BAU conta disparos POR CANAL.** Repescagem = 4 WhatsApp + 4 SMS. A régua de 8 toques alternados **não contradiz** a BAU — é a mesma coisa intercalada. Upgrade previa 4+4 e a planilha tem 3+3.
- **O link AppsFlyer completo não cabe em SMS** — 148 chars (Negados) e **163** (Upgrade), contra limite de 160. Sem encurtador, régua de SMS é inviável.
- **SMS reais são escritos sem acento de propósito** ("Ultimos dias", "ja sou cliente") para caber em GSM-7.
- **Estado de crédito confirmado em 20/08/2026:** Repescagem já passou por nova análise e tem limite pré-aprovado; a ressalva de análise permanece pela validação antifraude/biometria. Upgrade também passa por nova análise e bifurca por `activity_name`: `maior` recebe aumento de limite; `menor` recebe a linha de Repescagem.

## Referências externas

- [Extract a Brand Voice Guide So AI Writes Like You Do](https://www.digitalapplied.com/blog/extract-brand-voice-guide-ai-content-2026)
- [How to train in-house LLMs on brand voice — Search Engine Land](https://searchengineland.com/guide/how-to-train-in-house-llms-on-brand-voice)
- [LLM-as-a-judge: complete guide — Evidently AI](https://www.evidentlyai.com/llm-guide/llm-as-a-judge)
- [LLMs Cannot Reliably Judge (Yet?) — arXiv 2506.09443](https://arxiv.org/html/2506.09443v3)

## Relacionado

- [[Dicionario-de-Produtos]] · [[Beneficios-e-Vigencia]] · [[Pode-Dizer-Nao-Pode-Dizer]]
- [[Formatacao-WhatsApp-Variaveis-e-Espacamento]] · [[Reguas-Inteligentes-Arquitetura]] · [[Regua-Vibe-Ativacao]]
- [[Galeria-de-Templates]] · [[Skills-do-Projeto]] · [[Vault-como-Contexto]] · [[Estrategia-de-Contexto]]

## Aplicação operacional — revisão editorial 02/10/2026

### Como ler esta arquitetura

As seis camadas combinam fatos, protótipo e propostas. A existência de uma regra em prosa não demonstra linter, juiz ou geração operacional implantados. [[Briefing-e-Regua-de-Aquisicao]] é a intenção editorial; [[Fabrica-de-Emails-GaaS]] descreve a implementação documentada; [[Servico-Emails-Dinamicos]] descreve a execução completa.

### Conflito comercial a reconciliar

A referência `.claude/skills/produtos-afinz/references/plurix-cartao-mais-amigo.md`, com pesquisa de setembro, admite até 40 dias condicionado ao ciclo para +amigo. O bloqueio amplo nesta nota foi registrado antes. Não liberar a promessa nem generalizar entre cartões: confirmar fonte vigente e escopo de aplicação com Produto. Registrar resultado na ficha/benefício canônico. A revisão editorial de 02/10 não resolveu a condição por pesquisa externa.

### Contexto operacional atual

O GaaS contém contexto ativo e sete guardrails do +amigo na consulta de 02/10. Essa leitura confirma cadastro; não prova suficiência comercial das evidências. Ver [[Fontes-e-Proveniencia-Growth]] para regra de audiência, marca e Você Bem.
