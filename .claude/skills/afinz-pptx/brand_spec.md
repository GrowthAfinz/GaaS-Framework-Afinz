# Especificação de Marca — Afinz

Extraído do *Guia de Marca Afinz Institucional 2024 (agosto)*. Fonte oficial.

## Contents
- Paleta de cores (hex / CMYK / Pantone)
- Lógica PF vs PJ
- Tipografia
- Logo
- Grafismos e neon
- Personalidade e tom
- Mapeamento para slides
- Campanhas sazonais e com parceiro (co-branding)

## Paleta de cores

| Cor | Hex | CMYK | Pantone | Papel |
|-----|-----|------|---------|-------|
| Verde primária PJ | `#D3FF00` | C15 M0 Y80 K0 | 389 C | Dominante para **público PJ** (empresas/lojistas) |
| Azul primária PF | `#00C6CC` | C65 M0 Y30 K0 | 319 C | Dominante para **público PF** (pessoa física) |
| Vermelho (Warm Red) | `#E74742` | C0 M85 Y75 K0 | Warm Red C | Acento de destaque/alerta, uso pontual |
| Preto | `#000000` | C0 M0 Y0 K100 | Black C | Fundos escuros — **assinatura da marca** |
| Branco | `#FFFFFF` | C0 M0 Y0 K0 | White | Fundos claros, texto sobre escuro |

CMYK/Pantone para impressão; hex/RGB para telas (slides usam hex).

## Lógica PF vs PJ

A marca usa duas cores principais por audiência, **em proporção similar na comunicação
institucional** (atende ambos os públicos):

- **PF (pessoa física)** → dominante **azul `#00C6CC`**, verde como apoio.
- **PJ (lojista/empresa)** → dominante **verde `#D3FF00`**, azul como apoio.
- **Institucional** → azul + verde equilibrados; vermelho só como acento.

Regra prática: a cor dominante ocupa 60-70% do peso visual de cor; a outra apoia.

## Tipografia

| Uso | Fonte oficial | Fallback de sistema |
|-----|--------------|---------------------|
| Títulos e chamadas | **Lembra** (Fabio Haag) | **Calibri** |
| Texto corrido | Lembra | Calibri |

- Títulos e chamadas em **caixa-baixa** — reforça personalidade e proximidade.
- **A Lembra só pode ser instalada mediante autorização do marketing.** Como ela
  raramente está instalada na máquina de quem abre o deck, **use Calibri como a fonte
  real gravada no `.pptx`** (a Lembra pode ser citada como ideal, mas não deve ser a
  única, senão o arquivo quebra). Nunca usar Arial.

Hierarquia sugerida (slide 16:9):

| Elemento | Tamanho |
|----------|---------|
| Título de capa | 40-54pt, caixa-baixa |
| Título de slide | 32-40pt, caixa-baixa |
| Sub-título / seção | 20-24pt |
| Corpo | 14-16pt |
| Stat callout (número grande) | 60-96pt |
| Legenda / fonte | 10-12pt |

## Logo

- Arquivo: `assets/afinz_logo.png` — "afinz" em preto com o **"z" em verde neon**.
- Nunca distorcer, recolorir, girar ou alterar proporção.
- Assinatura "juntos fazemos mais" pode acompanhar.
- Em fundo escuro, garantir contraste (logo tem partes pretas → sobre preto use a versão
  apropriada ou caixa de respiro; preferir logo sobre fundo claro, ou neon-only no escuro).

## Grafismos e efeito neon

- Grafismos derivam da letra **"Z"** da marca, baseados em símbolos matemáticos.
- **Nunca** esticar, deformar, inverter, alterar ou manipular — manter estrutura e proporção.
- **Efeito neon** é assinatura, mas deve ser **equilibrado** (não exagerar). Aplicado em
  azul (PF) ou verde (PJ) sobre **fundo escuro**.
- O look institucional clássico: foto com pessoa olhando para a câmera + fundo escuro +
  elementos gráficos com efeito neon + ícone neon que direciona a comunicação.

## Personalidade e tom (universo verbal)

- Atributos: realizadora, simples, humana, inovadora.
- Valores: simplicidade aproxima; criatividade leva mais longe; agilidade com qualidade;
  construir juntos.
- Propósito: **"Conectar o comprar, vender e cuidar."**
- Assinatura: **"juntos fazemos mais"**.
- Tom: parceira de verdade, próxima, sem jargão de banco. Títulos em caixa-baixa.

## Mapeamento para slides

| Tipo de slide | Fundo | Cor dominante | Observações |
|---------------|-------|---------------|-------------|
| Capa | Preto | Neon (azul PF / verde PJ) | Logo + título caixa-baixa + grafismo Z |
| Divisória de seção | Preto | Neon | Pouco texto, número da seção grande |
| Conteúdo | Branco/claro | Texto preto, acentos neon | Acentos em ícones, números, barras |
| Stat / KPI (growth) | Preto | Número em neon | CAC, safra, cartões gerados — número 60-96pt |
| Gráfico | Claro | Séries em verde/azul/vermelho | Evitar cores default do Office |
| Fechamento | Preto | Neon | Logo + "juntos fazemos mais" |


## Campanhas sazonais e com parceiro (co-branding)

Achado ao analisar um deck real de campanha (parceria com Visa, tema Copa do Mundo,
ago/2026): **o parceiro/bandeira não entra com cor de marca própria** — a Visa aparece
só como logo, a linguagem visual do deck inteiro continua 100% Afinz (azul/verde/preto
padrão). Trate isso como regra: em co-branding, o parceiro empresta o nome/logo, não a
paleta.

O que o parceiro/tema **pode** trazer é **um acento sazonal a mais**, por cima da
paleta padrão — nunca no lugar dela. No deck da Copa do Mundo, esse acento é um
**dourado** (`#C8A94A`, `#FFC107`, tom mais escuro `#7A5C00`), associado a troféu/prêmio,
usado com moderação em destaques pontuais (não em fundos ou textos longos).

Regra prática para generalizar a outras campanhas sazonais (Black Friday, Dia das
Mães, Natal etc.): escolha **um único** acento temático que remeta à data, aplique-o do
mesmo jeito que se aplicaria vermelho/verde de acento — pontual, em números, ícones ou
blocos de destaque — e documente o hex escolhido para reuso. Ao rodar
`scripts/apply_afinz_brand.py`, sempre passe esse hex em `--extra-accent`, ou o script
vai remapeá-lo para o azul/verde dominante e apagar a identidade sazonal do deck.

Layout de referência para capa temática: `capa copa` (ver
`references/campanha_layouts.md`) — capa própria da marca + um elemento gráfico do
tema. Use como modelo para criar a capa de qualquer outra campanha sazonal.

**Confirmado visualmente (renderizei 2 slides reais do deck):** o tema entra
principalmente pela **fotografia**, não pelo hex de shape — fotos de torcedores, cores
da bandeira do Brasil (verde/amarelo/azul), confete com gradiente que inclui o dourado
documentado acima. A paleta de marca (ciano `#00C6CC` / verde-neon `#D3FF00`) continua
dona do fundo, texto, cartão e blocos de destaque. Ou seja: **para ativar um tema
sazonal, troque o banco de imagens (fotografia alinhada ao tema) antes de mexer em
qualquer cor** — é o que mais entrega a sensação de "campanha de Copa" sem sair da
identidade Afinz.
