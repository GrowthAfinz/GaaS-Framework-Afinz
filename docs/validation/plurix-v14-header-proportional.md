# PLURIX V14 revisão 3: header proporcional e faixa branca

27/10/2026. Mesmo slot builtin-plurix-v14, versão 3. Fonte publicada: 54.805 caracteres, MD5 901c8fee15b2bab5b984293ee25aaa9a. Migration aplicada: 20261027190509_dynamic_email_plurix_v14_header_proportional.sql.

## Resultado
- Faixa superior branca, com o PNG transparente azul do +amigo. A cor do fundo vem do HTML e está protegida por gradiente branco.
- Header dinâmico mantém texto à esquerda e cartão à direita. Nenhuma classe de empilhamento no header.
- Fontes, paddings, margens e logos usam a mesma escala do desenho de 600 px. Base: min(28px, calc(4.6666666667vw - 0.9333333333px)), considerando os 20 px externos do e-mail.
- Desktop conserva a composição anterior. No mobile, escala de 370/600 a 390 px e 300/600 a 320 px. Não se usa transform nem se converte texto dinâmico em imagem.
- As regras mobile do corpo permanecem. A proteção de tema claro da revisão 2 foi preservada.

O logo superior azul mede naturalmente 192 × 50 px e é exibido com até 190 px de largura, preservando sua proporção. O logo branco menor dentro do header azul permanece. Nenhum briefing ou asset do cartão foi alterado.

## Verificação
- 24 combinações reais, 6 redes × E-mail 1 a 4.
- 720, 390 e 320 px, claro, preferência escura com inversão RGB simulada, sem style e inversão sem style: 288 renders.
- Zero mudança das quebras de título/subtítulo contra o desktop, zero empilhamento, zero imagem quebrada e zero overflow.
- Dimensões dos blocos mantidas proporcionalmente, tolerância de rasterização de 1,5 px.
- Desktop comparado à fonte persistida da revisão 2 nas 24 combinações. Zero divergência acima de 1 px. A troca de PNG na faixa superior foi solicitada e sua altura natural varia menos de 1 px.
- Os 269 testes do módulo passaram. Teste final V14 passou; build e typecheck:release passaram; auditoria HTML sem bloqueante.
- Preparo AMPscript, colunas consumidas, links, personalização e condições preservados por teste de paridade.
- V13 intacta: d93d83a35b7e45d7c8cb0a976351cba2. Principal continua builtin-plurix-v9.
- Fingerprints de briefings e réguas iguais antes/depois: 4891a043dd96e500227fd493d5946f4b e 0e3088138aa9048893116ccc69b4725b.

O suporte de min/calc varia por cliente. Existe fallback em pixels para quem rejeita a função; a igualdade proporcional nesses clientes exige Test Send. Referência de compatibilidade: [Can I Email, funções CSS](https://www.caniemail.com/news/2021-05-07-css-clamp-min-max/). Os renders são Chromium e a inversão é simulada, sem certificação de apps reais. Status: candidata para Test Send.

## Prévia
- [Header Amigão E1, 390 px](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14-header-proportional/amigao-e1-390-claro-header.png)
- [E-mail completo, 390 px](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14-header-proportional/amigao-e1-390-claro.png)
- [Header Amigão E2, 320 px escuro simulado](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14-header-proportional/amigao-e2-320-escuro-header.png)
- [Geometria dos 288 renders](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14-header-proportional/header-geometry.json)
- [Paridade desktop com revisão 2](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14-header-proportional/desktop-parity.json)

## Reproduzir
```powershell
node node_modules/vite-node/vite-node.mjs scripts/email-factory/check-plurix-v14-header.ts <saida>
node node_modules/vite-node/vite-node.mjs scripts/email-factory/check-plurix-v14-header.ts <saida> --desktop-only
node node_modules/vite-node/vite-node.mjs scripts/email-factory/build-plurix-v14-migration.ts --check
```

Atualize a Fábrica para carregar a revisão 3 do mesmo template V14. Teste numa cópia da régua e confirme a aparência por Test Send. Salvar briefing continua persistindo a seleção nas seis assinaturas do e-mail.
