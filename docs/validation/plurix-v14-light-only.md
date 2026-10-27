# PLURIX V14 revisão 2: tema claro preservado
Atualização: [revisão 3 com header proporcional e faixa superior branca](plurix-v14-header-proportional.md). Este documento registra a revisão 2.

Atualização de 27/10/2026. Substitui o objetivo anterior de apenas proteger blocos de marca. Agora o corpo, os cards, a nota legal e o fundo externo também devem conservar a aparência clara.

## Resultado
Slot atualizado: builtin-plurix-v14, versão 2, ativo e não principal. Nome: PLURIX V14 · tema claro preservado (candidata).
Fonte: 54.989 caracteres, MD5 e84a2baf599ed6584c09abeb592f4dbe.
Migration aplicada: 20261027184742_dynamic_email_plurix_v14_light_only.sql.

V13 preservada: MD5 d93d83a35b7e45d7c8cb0a976351cba2. Principal preservado: builtin-plurix-v9. Fingerprints de todos os briefings e réguas iguais antes/depois: 4891a043dd96e500227fd493d5946f4b e 0e3088138aa9048893116ccc69b4725b.

## Alterações
- Meta color-scheme com light only e fundos fixos também nas superfícies neutras.
- Texto com preenchimento explícito e seletores de restauração de cores para Outlook.
- Cards dentro dos campos HTML recebem gradientes e preenchimento de texto na saída. As linhas de briefing não são editadas.
- Retirada do blend anterior de texto branco, que pressupunha a inversão da tinta e conflitaria com o preenchimento agora protegido.
- O preview interpreta a mesma composição restrita de Replace e TreatAsContent usada pelo SFMC, sem eval. Expressão malformada retorna diagnóstico.
- Preparo AMPscript, DEs, chave composta, condições, personalização, links e conteúdo preservados. O teste compara o preparo com a V13.

O tratamento de fragmentos cobre a paleta do HTML governado atual. A documentação oficial do [Replace da Salesforce](https://developer.salesforce.com/docs/marketing/marketing-cloud-ampscript/references/mc-ampscript-string/mc-ampscript-reference-string-replace.html) fundamenta as substituições. [CSS suportado pelo Gmail](https://developers.google.com/workspace/gmail/design/css) continua sendo um subconjunto; a simulação não certifica o suporte de cada cliente real.

## QA
6 redes × E-mail 1 a 4 × 720/390/320 px × 7 modos × revisão anterior/atual.
Total: 1.008 renders e 72 painéis. A revisão atual corresponde a 504 renders, todos com assinatura de HTML conferida.

| Modo | Superfícies que mudaram de cor na revisão atual | Reprovações de contraste |
| --- | ---: | ---: |
| Claro | 0 | 0 |
| Preferência escura | 0 | 0 |
| Inversão parcial simulada | 0 | 0 |
| Inversão total simulada | 0 | 0 |
| Sem style | 0 | 6 |
| Parcial sem style | 0 | 6 |
| Total sem style | 0 | 6 |

Zero imagens quebradas e zero overflow nos 504 renders atuais. Com style, o pior contraste medido foi 4,834:1. Nos três modos sem style, o checker marca um ponto final no E1 a 320 px de cada rede, a 4,049:1. É alerta conservador por rasterização de pontuação pequena, mantido visível em vez de descartado. Sem style, os cards de números ficam estreitos a 320 px, como na revisão anterior.

A simulação mantém gradientes e propriedades separadas de preenchimento e força background-color/color. Não foi desativada a inversão por causa da meta light only, para testar também o fallback. As regras reais dos apps são fechadas. Status: needs_review até Test Send. O pool foi exercitado com e sem oferta nos testes, e a matriz visual usa o estado sem oferta do renderer.

Testes locais: módulo dynamic-email completo passou; teste final V14 com seis casos passou; build passou; typecheck:release sem erros novos; auditoria HTML sem bloqueante. A origem governada de TreatAsContent continua necessária.

## Conferência visual
- [Amigão E1, 390 px, inversão total](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14-light-only/amigao-e1-390-v14-total.png)
- [Amigão E2, desktop, inversão total](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14-light-only/amigao-e2-720-v14-total.png)
- [Amigão E2, 320 px, total sem style](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14-light-only/amigao-e2-320-v14-total-sem-style.png)
- [Painel E1 mobile, anterior em cima e atual embaixo](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14-light-only/amigao-e1-390-painel.png)
- [Resumo de contraste](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14-light-only/contrast-summary.json)

## Como testar
Atualize a Fábrica publicada e selecione PLURIX V14 · tema claro preservado (candidata) em Template deste briefing, numa régua duplicada. Salvar briefing persiste a troca nas seis assinaturas do e-mail, por isso preserve a V2 original. Faça Test Send em Gmail iOS/Android, Outlook e Apple Mail, claro/escuro. Copy, links e af_sub3 continuam iguais.

## Reproduzir
```powershell
node node_modules/vite-node/vite-node.mjs scripts/email-factory/build-plurix-v14-migration.ts --check
node node_modules/vite-node/vite-node.mjs scripts/email-factory/render-plurix-v14.ts scripts/plurix-v14-qa-data.json <saida> --previous-v14
python scripts/email-factory/check-plurix-v14-contrast.py <saida>
```
