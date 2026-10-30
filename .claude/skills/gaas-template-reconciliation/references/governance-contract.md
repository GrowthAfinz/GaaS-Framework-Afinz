# Contrato observado do XLSX
Fonte: GOVERNANÇA_LINKS_E_TEMPLATES (5).xlsx, lido em 07/10/2026.
SHA-256: b466200d0cb215f74e9b32a947a5eeb08f66aa7a3a29757b6975852053207c51.
Snapshot auditável, não norma imutável nem comprovação da configuração viva no AppsFlyer.

## Abas e campos
- Base_Links_CRM_VIBE: 126 linhas com ID, 126 IDs distintos; 60 com Activity Name. H=ID, I=nome Meta, J=Activity Name, K=segmento, L=URL final, M=OneLink do canal, P/Q/R=códigos auxiliares, S=imagem/preview.
- Base_Links_CRM_COPA: 120 linhas com valor na coluna ID, incluindo 5 linhas estruturalmente inválidas (66:70, valores repetidos “afinz”). Não chamar as 120 de templates válidos. Restam 115 ocorrências e 99 IDs distintos; repetições de IDs em e-mails preservam usos, não devem ser eliminadas como erro. I=ID, J=nome, K=Activity, L=segmento, M=URL, N=base, Q/R/S=códigos. Cabeçalhos e fórmulas vencem coordenadas anotadas antigas.
- Base_Links_CRM_VIBE (2): hidden, 6 linhas com ID e copy textual em G. Usar como evidência histórica/proposta, sem assumir vigência.
- Config: seleção de OneLink pela chave app|canal e semântica dos parâmetros.
- Lista: vocabulários separados de BU, segmento, canal, parceiro e app. Linhas lado a lado não são relações entre essas listas.
- ID_Dicionario: tabelas independentes de códigos de canal, campanha e segmento. Não contém toda a gramática dos IDs reais.
- Base_Templates_Meta: mídia paga, af_adset/af_ad/af_ad_id. Não equivale ao cadastro de templates WhatsApp aprovados pela Meta. Não misturar suas chaves com af_sub3 CRM.

## Formação de URL
VIBE L2:
`M2 + "?c=" + lower(substitute(trim(F2)," ","_")) + "&af_sub1=" + lower(substitute(trim(K2)," ","_")) + "&af_sub2=" + lower(substitute(trim(G2)," ","_")) + "&af_sub3=" + trim(H2)`.
O IF externo deixa vazio se ID/segmento/momento/campanha estiverem vazios ou a base não começar por http.

M2 busca `lower(trim(A2)) + "|" + lower(trim(E2))` em Config_Links (Config E4:F23).
- c: campanha/jornada declarada;
- af_sub1: segmento/base/público;
- af_sub2: semana/momento declarado;
- af_sub3: ID interno da peça/variação, mesma caixa.

Config A9:C10 declara pid/af_channel pré-configurados nos links curtos. Isso é declaração da planilha, não validação da plataforma. Não inventar pid ou afirmar af_channel verificado sem inspeção do destino/configuração.
Em implementação futura, serializar com URL/URLSearchParams e detectar query já existente, parâmetros duplicados e caracteres especiais; registrar diferenças em relação ao cache Excel. Não gerar nova URL operacional sem escopo autorizado.
Marcas “LINK AJUSTADO?”/“TEMPLATE SALVO?” e base válida não certificam publicação/teste/envio.

## Códigos e colisões
ID_Dicionario: whatsapp→wpp; email→email; sms→sms; push→push; Negados→ngd; CRM→crm; Base_Proprietaria→bsp; Abandonados→abn; ANC→anc; Aprovados→apr; Instabilidade→inst.
IDs reais também usam car, car21, carsab, srsa, plx/plurix, DispD0 e SxDy sem canal explícito. Ler por famílias e relacionamentos, não por um único split posicional.

Casos específicos:
- VIBE H2=dia_email_vibe_bsp_S1D01, K2=CRM, J2 usa crm. Não derivar Base Proprietária contra o segmento declarado.
- VIBE H124/H125 terminam DispD2, G124/G125=d1; não confundir momento de tracking com índice do template.
- VIBE H122:H125=car21, H126:H127=carsab. H125 usa srsa; I125 usa sersa no título. Alias de comparação com origem explícita.
- COPA I3 e I5 repetem o mesmo ID com títulos distintos. Reuso pode ser variação de assunto, mas isso exige confronto com asset/HTML.

## Leitura técnica das imagens
Há 75 arquivos de mídia/hash únicos: 74 recursos richData e 1 recurso flutuante usado em 3 desenhos. O manifesto registra 79 ocorrências, não 79 criativos distintos.
In-cell images usam c@vm → valueMetadata → futureMetadata XLRICHVALUE → rdrichvalue → richValueRel → relacionamento de mídia. Cache #VALUE! nesses casos representa a imagem, não necessariamente fórmula quebrada.
Imagens flutuantes têm âncora espacial; sua posição não garante ligação ao ID da mesma linha.
Config_Canais e Lista_BU são nomes definidos #REF! no arquivo; não confundir com imagens nem assumir que bloqueiam todas as fórmulas. Fórmulas efetivas usam Config_Links e listas existentes.

## Qualidade
13 linhas com ID nas duas abas principais não têm URL final HTTPS válida; 5 são linhas repetidas inválidas e as outras devem ser examinadas por célula. Nenhum af_sub3 divergente do ID foi encontrado nas URLs HTTPS cacheadas deste snapshot.
Campos de parceiro/subgrupo/data não são explícitos nas tabelas CRM. A planilha fornece identidade e rastreamento, não resolve sozinha execução ou exposição de pessoas.


## Cruzamento com o catálogo em 07/10/2026
241 ocorrências estruturadas após excluir da sugestão as cinco linhas repetidas; 225 IDs distintos; 216 ocorrências casam por ID exato com o catálogo, e 25 IDs distintos não casam. Isso não autoriza criar todos os ausentes: investigar planejamento, aliases, variação de assunto e reuso governado.
