# Skill: Afinz Brand Style — GaaS UI

> Use este skill sempre que for criar ou refatorar um componente/aba no GaaS que precise seguir a identidade visual da Afinz.

---

## BRAND IDENTITY ANALYSIS (extraido do manual de marca)

### Logo
- Nome em **caixa-baixa**: `afinz`
- Fonte: **Lembra Black** (weight 900) para o logotipo
- Destaque: letra **"z"** possui traço horizontal em `#00c6cc` (teal)
- Versao vertical: tagline centralizada abaixo
- Versao horizontal: tagline alinhada a esquerda, ao lado direito
- Tagline: **"juntos fazemos mais"** em Lembra Regular, tamanho 1x da altura da tagline

### Area de Arejamento (clearspace)
- Padding minimo = **2x** a altura do simbolo (ponto do "i")
- Nunca compactar o logo abaixo de 45px digital / 1cm impresso
- Nenhum elemento pode invadir o clearspace

---

## DESIGN TOKENS — TAILWIND CLASSES

### Cores
```
afinz-teal:     #00c6cc   → bg-[#00c6cc]  text-[#00c6cc]  border-[#00c6cc]
afinz-teal-dark:#007c80   → hover states
afinz-orange:   #f8a538   → accent secundario
afinz-black:    #1a1a1a   → headings no positivo
afinz-white:    #ffffff   → texto no negativo (dark mode GaaS)
```

### Tipografia
O projeto usa fontes do sistema (Tailwind default). Aproximacoes para a fonte Lembra:
```
Heading principal  → font-black tracking-tight      (simula Lembra Black)
Heading secundario → font-bold                       (simula Lembra Bold)
Corpo              → font-normal text-slate-300      (simula Lembra Regular)
Detalhe/caption    → font-light text-slate-400       (simula Lembra Light)
```

Para usar a fonte real Lembra (se disponivel no projeto):
```css
font-family: 'Lembra', 'Arial', sans-serif;
```

### Hierarquia Tipografica
```
H1 (page title):   text-4xl font-black tracking-tight text-white
H2 (section):      text-2xl font-bold text-white
H3 (subsection):   text-lg font-bold text-white
Body:              text-sm font-normal text-slate-300
Caption/label:     text-xs font-light text-slate-400
Accent number:     text-2xl font-black text-[#00c6cc]
```

---

## ESTRUTURA DE UMA ABA NO ESTILO AFINZ

### Layout padrao
```tsx
// Estrutura base de uma aba GaaS com identidade Afinz
<div className="min-h-screen bg-slate-950 text-slate-100">

  {/* Hero header com sotaque teal */}
  <div className="border-b border-slate-800 px-6 py-5">
    <div className="flex items-center gap-3">
      <div className="h-8 w-1 rounded-full bg-[#00c6cc]" /> {/* acento vertical */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          TITULO DA ABA
        </h1>
        <p className="text-xs font-light text-slate-400">
          descricao / tagline
        </p>
      </div>
    </div>
  </div>

  {/* KPI strip */}
  <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-slate-800">
    {/* KPICard — ver padrao abaixo */}
  </div>

  {/* Conteudo principal */}
  <div className="p-6 space-y-6">
    {/* secoes */}
  </div>
</div>
```

### KPI Card (padrao Afinz)
```tsx
<div className="bg-slate-900 rounded-xl p-4 border border-slate-800
                hover:border-[#00c6cc]/40 transition-colors">
  <p className="text-xs font-light text-slate-400 uppercase tracking-wide mb-1">
    {label}
  </p>
  <p className="text-2xl font-black text-white">
    {value}
  </p>
  <p className="text-xs text-[#00c6cc] mt-1">
    {delta} vs periodo anterior
  </p>
</div>
```

### Section Header (padrao Afinz)
```tsx
<div className="flex items-center gap-2 mb-4">
  <div className="w-0.5 h-4 bg-[#00c6cc] rounded-full" />
  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
    {sectionTitle}
  </h2>
</div>
```

### Botao CTA Primario
```tsx
<button className="bg-[#00c6cc] hover:bg-[#007c80] text-slate-950
                   font-bold px-4 py-2 rounded-lg transition-colors text-sm">
  {label}
</button>
```

### Botao Secundario
```tsx
<button className="border border-[#00c6cc]/40 hover:border-[#00c6cc]
                   text-[#00c6cc] hover:bg-[#00c6cc]/10
                   font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
  {label}
</button>
```

### Badge / Pill
```tsx
<span className="bg-[#00c6cc]/10 text-[#00c6cc] text-xs font-semibold
                 px-2 py-0.5 rounded-full border border-[#00c6cc]/20">
  {tag}
</span>
```

### Card de secao
```tsx
<div className="bg-slate-900 rounded-xl border border-slate-800 p-5
                hover:border-slate-700 transition-colors">
  {/* Section header */}
  <div className="flex items-center gap-2 mb-4">
    <div className="w-0.5 h-4 bg-[#00c6cc] rounded-full" />
    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
      {title}
    </h3>
  </div>
  {/* conteudo */}
</div>
```

### Logo Afinz inline (SVG simplificado)
```tsx
// Logo textual aproximado com o acento "z" em teal
// Para uso em headers internos
<div className="flex items-baseline gap-0">
  <span className="font-black text-white text-xl tracking-tight">afin</span>
  <span className="relative font-black text-white text-xl">
    z
    <span className="absolute bottom-[0.15em] left-0 right-0 h-[0.1em] bg-[#00c6cc]" />
  </span>
</div>
```

---

## REGRAS DE USO (Brand Guidelines adaptadas para dark mode)

| Regra | Aplicacao GaaS |
|-------|----------------|
| Cor primaria so para 1 elemento por secao | Usar `#00c6cc` apenas no CTA principal ou valor principal |
| Laranja como acento, nao como primario | `#f8a538` para warnings, destaques secundarios |
| Nunca usar vermelho sem contexto de erro | `#e74742` so para valores negativos / alertas criticos |
| Arejamento generoso | Padding minimo `p-4` em cards, `gap-4` entre elementos |
| Hierarquia de peso tipografico | Black > Bold > Regular > Light — nunca pular mais de 2 niveis |
| Contraste: texto claro em fundo escuro | Manter razao minima 4.5:1 (WCAG AA) |

---

## QUANDO USAR ESTE SKILL

Acionar `/afinz-style` ou consultar este documento ao:
1. Criar uma nova aba no GaaS
2. Refatorar um componente existente para seguir o brand
3. Adicionar novos cards de KPI ou secoes de dashboard
4. Implementar CTAs e botoes de acao
5. Definir hierarquia tipografica em qualquer view

---

## CHECKLIST ANTES DE COMMITAR

- [ ] Cor `#00c6cc` usada como acento (nao como background dominante)
- [ ] Tipografia segue hierarquia Black > Bold > Regular > Light
- [ ] Padding minimo `p-4` em todos os cards
- [ ] Hover states implementados nos elementos interativos
- [ ] Borda sutil `border-slate-800` nos cards (nao shadow excessivo)
- [ ] Acento vertical `w-0.5 bg-[#00c6cc]` nos section headers
- [ ] Nenhum elemento usa `text-white` puro no body (usar `text-slate-300`)
