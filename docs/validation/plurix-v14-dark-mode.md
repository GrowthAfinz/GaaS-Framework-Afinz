# PLURIX V14: candidata para teste
Data: 27/10/2026. Status: needs_review.

Publicada no Supabase de produção e selecionável na Fábrica. O aceite integral de contraste ainda não foi atingido no corpo. A publicação como candidata segue a exceção expressa da especificação.

## Mudanças e preservação
| Bloco | V14 e motivo |
| --- | --- |
| Preparo AMPscript | Idêntico à V13 persistida, salvo comentário inicial e guarda V14. Mesmas DEs, chave, RaiseError, faixa, pool e colunas. |
| Logo do topo | Logo branco existente, 554 × 146 px, exibido a 190 px, sobre azul fixo. Evita desaparecimento. Registrado na Biblioteca; nenhum asset depende de upload. |
| Header HTML | Azul #4A5BA6 fixado com gradiente. Título amarelo e subtítulo creme passam a branco com blend. O ensaio de cores confirmou que amarelo e creme não preservam a cor. Textos continuam dinâmicos. Cartão e HEADER_LOGO do briefing preservados. |
| Faixa de limite | Ímpares #2C3490, pares #343B61, texto branco protegido. Mantém alternância sem o par amarelo e azul ilegível. |
| CTAs | Gradiente azul e blend no texto, mesmos links e tracking. |
| Mobile | Uma regra por classe do header. Tabelas fluidas com layout fixo e quebra de palavras inline; remove mínimo de 280 px dos CTAs. |
| Corpo, cards e legal | Conteúdo e cores governadas preservados. Continuam sujeitos à inversão e às pendências abaixo. |

Diferenças visuais no claro: faixa superior azul com logo branco, textos brancos do header e faixas de limite escuras. São as trocas de paleta usadas na proteção. A largura máxima continua 600 px. Sem style, o header permanece em duas colunas e os cards ficam estreitos a 320 px, com todo o conteúdo disponível.

A fixture V13 e o source de produção eram exatamente iguais: MD5 d93d83a35b7e45d7c8cb0a976351cba2. O envelope já reconhece V14 genericamente; o renderer passou nas detecções existentes, sem alteração de código.

## Contraste e matriz
24 briefings reais, 6 redes × E-mail 1 a 4, 720/390/320 px, V13/V14, cinco modos. Total: 720 renders, 72 painéis, 720 arquivos contrast.json individuais com sufixo por render.

| Modo | Pior V13 | Pior V14 | Reprovações V13 | Reprovações V14 |
| --- | ---: | ---: | ---: | ---: |
| Claro | 3,024 | 4,834 | 0 | 0 |
| Apple escuro | 3,024 | 4,834 | 0 | 0 |
| Parcial simulada | 1,213 | 1,228 | 252 | 216 |
| Total simulada | 1,971 | 1,971 | 1152 | 810 |
| Sem style | 3,024 | 4,049 | 0 | 6 |

Limiares por nó: 4,5:1 normal, 3:1 grande. O menor valor agregado pode ser de texto grande aprovado. Cada nó tem seu limiar, cor final e fundo no JSON. Medição pelos pixels finais de screenshots com e sem tinta para contemplar blend e gradientes. Antialias pode gerar alerta conservador em pontuação pequena.

V14: 1.800 nós de marca avaliados, zero reprovações, mínimo 4,698:1. Zero imagens quebradas e zero overflow nos 360 renders V14. O logo do topo foi revisto nos painéis Amigão E1 e E2 e permanece visível nos cinco modos. Header empilhado em 390 e 320 px; ensaiado também o título real mais longo, com 39 caracteres, superior à recomendação de 34.

Pendências concretas: ícones de check dos cards chegam a 1,228:1 na parcial; textos azuis do corpo e de preferências ficam abaixo de 4,5:1 na total. E1 a 320 px sem style tem um ponto final a 4,049:1 nas seis redes. Exemplo: amigao-e1-320-v14-sem-style.png. Veja contrast-summary.json para todos os casos por texto e PNG. Essas falhas impedem promoção a principal.

As inversões são simuladas a partir de regras públicas. Os algoritmos reais dos clientes são fechados. Apple escuro aqui significa preferência escura no Chromium com trava light, sem certificação de Apple Mail. A validação final é o Test Send do Pablo. O pool foi coberto com e sem oferta nos testes unitários; a matriz visual usa o estado sem oferta do renderer de base.

## Painéis principais
V13 em cima, V14 embaixo; modos lado a lado.
- [Amigão E1 desktop](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14/amigao-e1-720-painel.png)
- [Amigão E1 390 px](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14/amigao-e1-390-painel.png)
- [Amigão E2 desktop](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14/amigao-e2-720-painel.png)
- [Amigão E2 390 px](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14/amigao-e2-390-painel.png)
- [Resumo de contraste](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14/contrast-summary.json)
- [Ensaio de blend](C:/Users/Pablo Prado/OneDrive/Área de Trabalho/PROJETOS IA/ACALENDARIO APP/artifacts/dynamic-email-dark-mode/2026-10-27_v14/blend-probe-results.json)

## Publicação e verificação
Migration aplicada: 20261027155015_dynamic_email_plurix_v14_dark_mode.sql.
Slot builtin-plurix-v14: active, versão 1, is_principal false, 37.358 caracteres, MD5 be4c15d7e76d6befe55507d4271556f2.
V13 segue active, versão 4, 34.887 caracteres e mesmo MD5. Principal segue builtin-plurix-v9.
Fingerprints de todos os briefings e réguas permaneceram iguais antes/depois:
briefings 4891a043dd96e500227fd493d5946f4b; réguas 0e3088138aa9048893116ccc69b4725b.

SQL de conferência:
```sql
select id, status, version, is_principal, length(source), md5(source)
from public.dynamic_email_template_slots
where id in ('builtin-plurix-v13', 'builtin-plurix-v14');
select id from public.dynamic_email_template_slots where is_principal;
```

Validações locais: módulo dynamic-email inteiro passou, teste V14 final com quatro casos passou, npm run build passou, typecheck:release sem erros novos, auditoria HTML sem bloqueante. A auditoria registra revisão de TreatAsContent, já presente na V13; origem governada preservada. Commit e resultado do deploy são informados na entrega junto deste relatório.

## Como testar na Fábrica
1. Abra o app publicado, menu Comunicações > Fábrica de E-mails. Em janela estreita, use Tela cheia para exibir o menu.
2. Expanda PLURIX. No menu de configuração de V2 TOPO DE FUNIL DINÂMICO, escolha Duplicar régua e dê um nome de teste. As cópias são rascunhos.
3. Abra E-mail 1 ou 2 da cópia e selecione Amigão. Na prévia, abra Controles, caso estejam recolhidos.
4. Em Template deste briefing, escolha PLURIX V14 · topo dinâmico blindado para tema escuro (candidata). A prévia acompanha a seleção. Isso foi verificado na aplicação publicada.
5. ATENÇÃO: o seletor altera o vínculo em edição das seis assinaturas do e-mail. Salvar briefing persiste esse vínculo. Faça isso somente na cópia, mantendo o status de rascunho.
6. Revise a fonte/envelope e prepare o Test Send no SFMC em Gmail iOS, Gmail Android, Outlook e Apple Mail, claro/escuro. Não foi publicado nada no SFMC nesta execução.

A inspeção pública selecionou V14 apenas localmente e restaurou V13, sem salvar. A V2 original não foi reapontada. O marcador de estrutura do header aparece como sem conteúdo também na V13, embora o header renderize; é uma limitação anterior do editor.

af_sub3 continua plx_email_topo_v10_..., preservado como solicitado e pendente de confirmação de negócio.

## Reprodução
```powershell
node node_modules/vite-node/vite-node.mjs scripts/email-factory/build-plurix-v14-migration.ts --check
node node_modules/vite-node/vite-node.mjs scripts/email-factory/render-plurix-v14.ts scripts/plurix-v14-qa-data.json <pasta-de-saida>
python scripts/email-factory/check-plurix-v14-contrast.py <pasta-de-saida>
node node_modules/vite-node/vite-node.mjs scripts/email-factory/render-plurix-v14.ts scripts/plurix-v14-qa-data.json <pasta-de-saida> --probe-only
python scripts/email-factory/check-plurix-blend-probe.py <pasta-de-saida>
```
