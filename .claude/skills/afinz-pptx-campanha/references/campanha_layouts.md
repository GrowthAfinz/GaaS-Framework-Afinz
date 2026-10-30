# Layouts do template Afinz — inventário completo

Este arquivo documenta os **34 layouts** disponíveis no master Afinz. O inventário foi
extraído via `python-pptx` do deck original de campanha (Visa + Copa do Mundo, em
produção, ago/2026, 48 slides / ~40MB). Para caber no limite de tamanho de uma skill
instalável, `assets/afinz_exemplo_campanha_visa_copa.pptx` guarda uma versão **enxuta**
desse deck: só os 6 slides reais mais leves (um por layout efetivamente usado), com os
nomes de arquivo originais preservados (`slide2.xml`, `slide3.xml`, `slide7.xml`,
`slide12.xml`, `slide19.xml`, `slide38.xml`) — os outros 42 slides e a mídia não
referenciada por eles foram removidos com o `clean.py` da skill `pptx`. Master, tema e
os 34 layouts (incluindo os não usados, como `capa copa`) ficam intactos — só o
conteúdo de exemplo foi reduzido.

Leia este arquivo **antes** de rodar `thumbnail.py` no template de campanha: mesmo
enxuto, gerar a grade de miniaturas pode ser lento em sandboxes com limite curto de
comando. Use esta tabela para já ir direto ao layout certo.

## Os 22 layouts que já existiam em `afinz_template_institucional.pptx`

Confirmado por comparação direta: o master de campanha é uma extensão do master
institucional — os dois compartilham 22 layouts idênticos (mesmo nome, mesma função).
Ou seja, **quem já usa o template institucional já sabe usar a maior parte deste**:

Capa · Capa Com Imagem PJ · 1_Capa Com Imagem PF · Slide respiro / Título ·
Sub-Capa / Seção · 2_Sub-Capa / Seção · 1_Sub-Capa / Seção · Agenda ·
Tópicos + Imagem · Slide Texto corrido + imagem · 1_Slide Texto corrido(bullets) + imagem ·
Slide portfólio fotos · Slide de Tabela · Slide Depoimento ·
Inserção de Mídias notebook · Inserção de Mídias celular · Gráfico + TXT ·
Ícones · Elementos de suporte · Timeline · 1_Timeline_V2 · Fechamento

## O que é realmente novo neste arquivo

Comparado ao template institucional, aparecem 12 layouts a mais — a maioria são
layouts default do PowerPoint (Título e Conteúdo, Cabeçalho da Seção, Duas Partes de
Conteúdo, Comparação, Somente Título, Em Branco, Conteúdo com Legenda, Imagem com
Legenda, Título e Texto Vertical, Texto e Título Vertical, Slide de Título) — não são
específicos da marca, evite usá-los quando um layout Afinz nomeado já resolve.

**O único layout genuinamente novo e específico de campanha é `capa copa`** — uma capa
temática de Copa do Mundo. Estrutura (via XML, `slideLayouts/slideLayout16.xml`):
título mestre + 2 placeholders de subtítulo + 1 retângulo de destaque + 1 imagem
(`image6.emf`, arte vetorial temática) + 1 retângulo secundário. Ainda não tinha sido
usada em nenhum slide real neste deck (o arquivo está "in progress").

**Padrão a generalizar:** para qualquer campanha sazonal/temática futura (Black Friday,
Dia das Mães, etc.), o padrão é duplicar essa lógica — capa própria da marca + 1 elemento
gráfico temático — em vez de recriar a capa padrão do zero. Ver `capa copa` como
referência de "capa sazonal".

## Quais layouts este deck de exemplo realmente usa (referência de preenchimento real)

Só 6 dos 34 layouts têm slides reais preenchidos neste deck — use-os como exemplo de
como uma campanha de verdade (parceria com Visa) preenche cada um:

| Layout | Slide de exemplo no arquivo enxuto | Outras instâncias no deck original completo |
|---|---|---|
| Slide de Título | 38 | 39, 40, 41, 42, 43 |
| Título e Conteúdo | 19 | 4, 11, 13, 26, 27... |
| Slide Texto corrido + imagem | 7 | 1, 6, 8, 9, 10... |
| Tópicos + Imagem | 2 | (única instância no deck original) |
| 1_Slide Texto corrido(bullets) + imagem | 3 | 5, 15, 17, 20, 21... |
| Slide de Tabela | 12 | 16, 18, 25, 47, 48 |

Para duplicar um desses (ver workflow da skill `pptx`):
```bash
python3 -c "import sys,zipfile; zipfile.ZipFile(sys.argv[1]).extractall('unpacked')" \
  assets/afinz_exemplo_campanha_visa_copa.pptx
python scripts/add_slide.py unpacked/ slide7.xml --after slide7.xml   # ex: "Slide Texto corrido + imagem"
```

## Achado de paleta — acento sazonal (não está no brand_spec original)

Rodando um histograma de cores `srgbClr` reais em todos os slides deste deck, além da
paleta padrão (`00C6CC` azul PF, `D3FF00` verde PJ, preto/branco/cinza), aparece um
**dourado recorrente e não documentado**: `C8A94A`, `7A5C00`, `FFC107`. Não é cor de
marca nem cor da Visa (a Visa não entra com cor própria neste deck — o co-branding é só
logo, a linguagem visual continua 100% Afinz). É um **acento temático da Copa do
Mundo** (associação com troféu/prêmio), usado por cima da paleta padrão, não no lugar
dela.

**Regra derivada para `apply_afinz_brand.py`:** ao aplicar a marca em um deck de
campanha sazonal, use `--extra-accent C8A94A,FFC107` para preservar o acento do tema —
sem isso, o script remapeia esse dourado para o azul/verde dominante e apaga a
identidade sazonal do slide.
