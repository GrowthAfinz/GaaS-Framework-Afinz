# Motor proposto e janela de aprovação

## Entidades
1. Peça/template governado (ID externo preservado, identidade interna estável).
2. Versão de conteúdo (texto, parâmetros, oferta, CTAs, mídia).
3. Uso em jornada/versão/ramo/nó, com posição e tracking próprios.
4. Execução (activities.id, data, canal, BU, público registrado).
5. Decisão (proposta, evidência, autor, fingerprint e escopo).

Reuso é relação entre peça e usos, não obrigação de criar novo ID. Se governança exigir ID contextual, propor explicitamente alias/novo ID/vínculo; jamais renomear af_sub3 já enviado por heurística.

## Resolução por dimensão
Não escolher uma fonte universalmente superior.
- Identidade configurada: af_sub3 → cadastro exato; título/asset → candidatos, não aprovação.
- Conteúdo: payload do nó/asset e parâmetros; imagem e XLSX para confronto de versão.
- Público alvo: critérios do ramo + Activity Name + dimensão registrada + declaração da governança. Concordância sustenta; divergência permanece explícita.
- Família/subgrupo: estrutura da jornada e regra de ID validada. Exemplo Carrinho é campanha/jornada, Abandonados é segmento, 21D é subgrupo/recência.
- Ordem: precedência do grafo dentro de ramo, WAIT/decisões e posição governada. Branches/splits paralelos não recebem uma ordem global inventada.
- Data: execução específica e vigência confirmada; data no nome ou no celular é sinal.
- af_sub2: momento de tracking, guardado separado de ordinal do toque.

Candidatos por af_sub3, planilha (nome/Activity + contexto), versão de conteúdo, histórico equivalente e título. Comparação semântica/imagem pode recuperar candidatos, mas não contornar conflitos duros.
Vetar aplicação em lote quando canal/público/família/versão/período divergem ou faltam provas essenciais. Não substituir um veto por score alto.
Não declarar percentuais de confiança sem calibração. Mostrar “ID exato”, “conteúdo equivalente”, “contexto compatível” e os campos ausentes.

## Autonomia delimitada
Automaticamente: extrair → reunir todas as evidências → classificar → encontrar candidatos → reconstruir ordem possível → detectar repetição → preparar simulação e grupos revisáveis.
Humano: escolher entre conflitos, declarar vigência, confirmar reuso intencional, escolher versão atual e aprovar alterações.
Início recomendado determinístico e explicável. IA generativa opcional para leitura semântica/imagens retorna propostas estruturadas; nunca SQL livre ou atualização direta. Contratos do banco continuam garantindo escopo, concorrência e integridade.
A skill não instala embeddings ou chama API/modelo externo. A tecnologia futura pode ser decidida no projeto específico.

## Repetição com contexto
Buscar por parceiro/segmento/subgrupo/canal e comparar versões antes de agregar produção. Mostrar últimas datas comprovadas, jornada, posição e variação de conteúdo.
Repetição no mesmo ramo é distinta de reaproveitamento entre públicos. Mesmo ID com body diferente é mudança de conteúdo; IDs diferentes com body igual podem ser reuso/duplicação de cadastro.
Executar paginadamente com cobertura: total consultado, com texto, com vínculo e com período conhecido. Ausência não vira “inédito”.

## Proposta de UI
Uma Central de reconciliação de comunicações, substituindo a entrada por cards grandes. Abas/filtros operacionais: A revisar, Conflitos, Vinculados e Biblioteca.
Tabela com uma linha por uso configurado no escopo, agrupada por jornada/ramo/período:
seleção; parceiro; segmento/subgrupo; posição; data; origem; template observado; candidato; reuso; pendência; ação.
Não colapsar variantes de conteúdo ou versões conflitantes para economizar espaço.
Drawer lateral: texto/print, peça configurada vs candidata, diferenças, evidências por dimensão, sequência do ramo e históricos com datas. Thumbnail pequeno no grid; preview grande só ao selecionar.
Aprovação em lote de grupos homogêneos somente com mesma regra e sem veto; simulação mostra contagens e IDs únicos, preservando pendentes fora do lote.
Itens coletados de XLSX, packs e catálogo convivem na mesma tela com origem explícita e etapa “observado”, “proposto”, “aprovado” ou “aplicado”.
Deixar visível o limite da leitura histórica e a distinção entre biblioteca e execução. Wiki segue fora do escopo atual.

## Caso de aceite
Activity carrinho21dserasa do print:
contexto 21D/Serasa, peça real observada carsab/inst, candidato da família car21/srsa com conteúdo a comparar, ordinal desconhecido até comprovação.
Resultado: conflito/contexto em revisão; sem autoaprovação, sem alteração de peça real e sem troca automática para DispD1.
Outros aceites: DIA bsp→CRM contextual; inst≠Instabilidade fora de contexto; D2 e af_sub2=d1 coexistem; e-mail com ID repetido preserva assuntos/usos; image #VALUE não é descartada.

## Fluxo principal de Cadastro e Templates V2 (Pablo, 07/10/2026)
O usuário não sobe o pack no GaaS como tarefa principal. A IA analisa antes e publica mensagens + propostas estruturadas no staging; o operador abre o GaaS e vê a fila para revisar/aprovar em massa. Não centrar a proposta numa toolbar de upload.
Persistir o resultado da análise antes da aprovação: ator, fontes/versões, contexto resolvido, template observado/proposto, conteúdo, alternativas, razões, conflitos, IDs históricos, evidência temporal e revisão. Estado local do navegador não é proposta compartilhada.
Fila pendente abrange análises e comunicações ainda não aprovadas; não depende de communication_template_contents nem apenas dos templates já cadastrados. Data da análise, data do disparo e janela de vigência são campos/filtros distintos. Outro operador autorizado pode revisar, preservando quem analisou e quem aprovou.
Preservar três áreas úteis: Propostas, Biblioteca e Histórico. Reaproveitar prévias, anexos, versões e simulação/aplicação; retirar os cards grandes como modo principal. Opt-outs são consultáveis no acervo técnico, separados dos lotes de campanha.
