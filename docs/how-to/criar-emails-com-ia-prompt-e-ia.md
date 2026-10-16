# Criar e ajustar e-mails com IA (Fábrica de E-mails > Prompt e IA)

Ciclo completo sem migration: o GaaS exporta uma skill, a IA escreve e mostra a prévia, o
arquivo volta para o GaaS, que valida, mostra a régua inteira e grava como rascunho.

## 1. Exportar o pacote

1. Comunicação > Fábrica de E-mails > aba **Prompt e IA** > passo **Exportar pacote**.
2. Marque as réguas (a V2 TOPO DE FUNIL DINÂMICO já vem marcada). Sem régua, sai só a skill.
3. Formato:
   - **Skill .zip** (padrão): Claude, ChatGPT e Claude Code. Leva scripts e esqueletos de prévia.
   - **Markdown único**: qualquer IA, sem prévia.
4. Clique em **Baixar**. O explorador ao lado mostra cada arquivo antes do download.

O que vai no zip (`gaas-emails-<parceiro>/`):

| Arquivo | Conteúdo |
|---|---|
| `SKILL.md` | Papel, fluxo e regras fixas (formato Agent Skills) |
| `references/produto.md` | Ficha do produto e guardrails, com como citar cada benefício |
| `references/escrita.md` | Campos editoriais, limites, faixa de limite, botões, conferência |
| `references/blocos.md` | Catálogo do segundo bloco com exemplos reais |
| `references/contrato.md` | O JSON campo a campo |
| `references/regua-<segmento>.md` | Estratégia, e-mails, textos atuais, aberturas já usadas, imagens |
| `assets/reguas/<segmento>.json` | Estado atual da régua no formato do contrato (ponto de partida) |
| `assets/previa/` | Esqueletos renderizados pelo template real, um por e-mail e rede |
| `scripts/` | `content_blocks.py`, `validar_input.py`, `montar_previa.py` |

## 2. Usar na IA

- **Claude:** Personalizar > Skills > enviar o zip. Precisa da execução de código ligada.
- **ChatGPT:** crie um Projeto, envie o zip e cole as instruções do passo 2 (botão Copiar).
- **Claude Code:** descompacte em `.claude/skills/`.

A IA pergunta o que falta, escreve, roda `validar_input.py` e entrega **dois PNGs**
(`previa/quadro_celular.png` e `previa/quadro_desktop.png`) com a régua inteira lado a lado.
Depois do "aprovado", entrega `input_gaas_emails_<segmento>_<AAAAMMDD>.json`.

O PNG usa o Playwright (`pip install playwright` e `python -m playwright install chromium`).
Sem ele, a IA entrega os quadros em HTML.

### Arte do header

Em e-mail novo (ou quando o tema do header muda), a skill propõe 2 ou 3 direções de arte: reaproveitar
uma arte aprovada ou criar uma nova. Para a nova, entrega o prompt pronto e os arquivos para anexar
(cartão oficial, tirado do vetor do guia de marca, e duas artes de estilo). Você gera no Gemini ou no
ChatGPT e sobe a imagem na conversa; `preparar_arte.py` encaixa no header (1247 x 977, borda esquerda
no azul #4A5BA6) e mostra as opções lado a lado no e-mail. Se o cartão sair alterado, a skill refaz
pelo caminho B: a IA gera só a cena e o script coloca o cartão oficial. A arte final vai junto com o
JSON; a URL entra depois de subir no SFMC (pendência de revisão no arquivo).

## 3. Importar e aprovar

1. Passo **Importar e aprovar**: solte o JSON ou cole o conteúdo.
2. Confira o resumo (novas, alteradas, bloqueios, revisar, conflitos).
3. Na **régua com a proposta**, troque de rede, celular ou desktop e com ou sem nome. Clique numa coluna
   para ver a conferência, as diferenças campo a campo e o que o GaaS preencheu.
4. **Aprovar e gravar rascunhos**. Tudo entra como rascunho, com a proveniência (arquivo, sha256,
   modelo) e uma versão no histórico. E-mail que estava pronto volta para rascunho (a tela avisa).

## Regras que o GaaS aplica na importação

- Campos governados (links, UTM, assinatura, nota legal, rodapé, logo, cores, tamanhos, datas) nunca
  vêm da IA: e-mail existente mantém os seus; e-mail novo herda do anterior da mesma rede, trocando
  `S{semana}D{dia}` e `_EMAIL{n}_`.
- `{no_mercado}` vira "no Amigão", "no Avenida", "no Boa", "no Paraná" ou "no seu supermercado"
  (Compre Mais e Superpão, em transição de marca, nunca são citadas).
- Fato fora da ficha do produto bloqueia. Header e assunto longos só pedem revisão.
- Sem `secondBlock`, o e-mail existente mantém o segundo bloco atual.
- Template não muda por esse fluxo: AMPscript continua em fixture + migration revisada.

Código: `src/modules/dynamic-email/export/skillPack.ts`, `components/PromptAiWorkspace.tsx`,
`domain/emailInput.ts`, `domain/emailInputPlan.ts`, `services/emailInputService.ts` e
`scripts/email-factory/{content_blocks,validar_input,montar_previa}.py`.
