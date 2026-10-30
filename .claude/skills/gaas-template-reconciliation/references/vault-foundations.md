# Fundamentos completos do Vault para reconciliação

Leitura integral em 07/10/2026 das notas que mencionam template_id/af_sub3 e das notas relacionadas de conceitos, taxonomia, operação, autoria, vigência e aprendizagem. O inventário de leitura registra caminhos, datas, status e hashes. Não equivale a ler todas as notas de assuntos não relacionados do Vault.

## O que já estava definido
- Template é conteúdo desacoplado da instância de envio (01-Conceitos/Template.md e Disparo.md). Reuso de D1 em D11 já era problema explícito da ontologia v2.
- Campanha pertence a jornada/safra; a chave de recorte envolve BU, segmento, parceiro, subgrupo, etapa e safra (Campanha.md). Activity Name ajuda a identificar, mas na base atual não substitui activities.id + data.
- A posição governada é communication_slots; catálogo retrospectivo e briefing pré-envio têm papéis distintos.
- A Galeria previa extração de texto/oferta/promocional/CTA/tom e comparação estruturada, não só prints. Há decisão anterior de identidade estrutural preceder score.
- A BAU tem 41 combinações planejadas, todas “à validar”; não é execução comprovada.
- Motor-de-Briefing-Automatico esclarece que BAU conta toques POR CANAL. Repescagem 4 WPP + 4 SMS pode resultar em oito toques intercalados. O número global não é derivado somando cegamente cabeçalhos.
- D1…D8 representa ordem em várias réguas, não intervalo universal. Topo B2C SMS recebeu regra posterior de quatro SMS, um por semana; o snapshot BAU antigo com oito SMS não prevalece automaticamente.
- Oferta e Promocional formam par composto de intenção. Comparação por Oferta isolada mistura variantes.
- Upgrade menor reutiliza a linha de Repescagem por desenho operacional. Repetição aqui é intenção possível; a atribuição af_sub1=Negados precisa ser conferida separadamente.
- A diferença editorial entre toques deve considerar argumento, objeção, benefício e ação esperada, não somente caracteres iguais.

## Fontes adicionais obrigatórias
O acervo Templates-Vibe-Revisao-2026 já possui 61 registros de leitura visual, 106 ocorrências de imagem e 27 imagens reutilizadas; 6 registros têm indício de QA. As Amostras-Comunicacoes-Reais possuem 73 registros; 53 têm indício de QA e seis canais divergem da pasta.
Não descartar esses acervos por serem anteriores ao XLSX atual. Indexar com proveniência e namespace de origem; não importar a condição “real” de um título como certificação.
Campo nome_template_salesforce pode conter Activity Name, título Meta ou nome de asset. Identificar seu papel por evidência antes de formar uma chave.
Arquivos JSON/cópias CSV vivem junto às notas. Leitura de toda a base requer lê-los, não só a projeção Markdown do GaaS.
Imagens antigas com variáveis renderizadas precisam ser comparadas ao mapa de parâmetros; testes não viram linhas de resultado.

## Correções e regras que não devem voltar
| Afirmação histórica | Tratamento atual |
|---|---|
| Template é apenas atributo e não há catálogo | Conceito continua válido; estrutura física evoluiu. Consultar schema vivo |
| PK obrigatoriamente UPPER; join lower() ou metadata sempre | Revogado pela caixa preservada de 07/10 e constraint viva. Match exato; alias só com crosswalk explícito |
| af_ad_id é ID de template CRM | Revogado em AppsFlyer-Tracking-CRM (28/07): af_sub3 é template; af_ad/af_ad_id pertence à mídia |
| Tabelas propostas ainda não criadas | Verificar banco; status antigo não prova ausência atual |
| Parceiro canônico só existe no build | Nota de setembro é snapshot; hoje há colunas. Conferir algoritmo e versão antes de materializar outra regra |
| Jornada tem parceiro sempre numa posição fixa | Armadilha documentada: em Serasa a posição pode ser CARRINHO/21D/SAB; _NA_ não prova Institucional |
| Regra da Fábrica (Plurix/N/A) equivale ao parceiro do Report Live | São contratos distintos. Não reutilizar fallback entre módulos sem declarar a semântica |
| Toda variável %%TAG%% num export WPP é copy inválida | A autoria Meta usa {{n}}, mas o pacote pode representar ${n} e bindings %%TAG%%. Distinguir placeholder de corpo e parâmetro da atividade |
| Mesmo HTML/asset de e-mail equivale à mesma copy | E-mail dinâmico resolve briefing por produto+tipo+sequência+vigência; sem linha histórica de briefing, versão enviada é desconhecida |
| Print/cadastro/publicação local prova envio | Não. Test Send e logs/jornada têm funções próprias; estado editorial não é certificação |
| Matching >=80% permite concluir sem prova | Limiar documental antigo não é probabilidade calibrada nem autorização. Expor âncoras e conflitos |

## Tipos que a nova especificação deve conservar
- business_front, stage, audience_segment, campaign_family, subgroup/recency, partner, lead_origin/variant, product e retail_signature.
- touch_ordinal; tracking_moment; elapsed_wait; editorial_week; cohort; business_date.
- material/asset_id; sfmc_meta_name; external_template_id; content_version_id; journey_origin/version; activity_key; activity_name; execution_id.
- editorial_status; evidence_status; certification_status; approval_status.
Mesma palavra pode ocupar campos diferentes nas fontes. Exemplo “Instabilidade” como segmento usa inst; “Institucional” como variante de carrinho também usa inst. Não colapsar o vocabulário.

## Repetição e autonomia
Separar reuso de peça, repetição de argumento, adaptação por parceiro, variação A/B e exposição repetida da pessoa. Esta última depende de tracking individual/ledger que a nota Anti-Overlap declara ausente do agregado.
A inteligência pode preparar decisões e grupos autonomamente, consultando 100% do universo elegível com paginação e cobertura. Sua conclusão continua limitada ao que tem texto/vínculo/versão/data comprovados.
Regras determinísticas validam identidade/escopo; análise semântica e visual propõe argumentos e variantes; revisão humana resolve divergência e aplica no escopo autorizado.
Reusar aprendizados apenas se específicos e vigentes. Conhecimento curado do Vault não equivale a outcome validado. Não atribuir resultado causal à peça porque está vinculada.
Benefício de uma imagem histórica é referência, não autorização para próxima campanha: conferir vigência, produto, condições e permissão nas notas Beneficios-e-Vigencia/Pode-Dizer-Nao-Pode-Dizer e nas fontes vigentes do escopo.

## Arquitetura a espelhar
Uma Central de reconciliação deve comparar planejado × configurado × registrado:
governança/BAU/briefing → pacote/jornada/conteúdo → activities/datado.
Ela pode reaproveitar princípios já documentados na Fábrica: lista compacta por toque, painel de detalhe, versões, valor anterior/sugestão/evidência, estados independentes e controle otimista.
Isso é uma proposta para Comunicações, não declaração de que os mesmos relacionamentos já existem nesse módulo.

