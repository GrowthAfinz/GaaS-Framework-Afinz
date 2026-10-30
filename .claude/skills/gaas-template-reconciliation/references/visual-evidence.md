# Evidências visuais e limites
Análise em 07/10/2026: 75 imagens/hash únicos percorridos em 7 páginas de contato; aprofundamento das peças carrinho/21D/sábado. Não é transcrição integral certificada de cada imagem.

## Observações ancoradas
- VIBE S109 (image60): carrinho Serasa, texto inclui “Já sou cliente”/retomada de pedido. Nome e horário são exemplos de tela.
- VIBE S125 (image72), H125=b2c_car21_vibe_srsa_Dispd2: “Faz um tempo que você começou a pedir...” com retomada no app, “Já sou cliente” e recuperação de senha.
- VIBE S126 (image73), H126=b2c_carsab_vibe_inst_Dispd1: sorteio/limite até R$6.000, CTA Pedir Cartão, sem o bloco de retomada Serasa.
- VIBE S127 (image74), H127=b2c_carsab_vibe_srsa_Dispd1: texto e CTA distintos da institucional, incluindo “Já sou cliente” e senha.
- Print do importador fornecido pelo usuário: Activity Name carrinho21dserasa, ramo Serasa API-Ecred; título Meta carrinho_b2c_sabado_sorteio; body/CTA se alinham à peça institucional S126. A peça real observada deve permanecer identificada; o contexto desejado é 21D/Serasa e merece proposta separada, não troca automática de ID.
- VIBE S82 (image33): ID Plurix, mas texto visível apresenta Cartão Bem Mais. Sinal de revisão de marca/proveniência; não chamar automaticamente de bug nem inventar correção.
- VIBE S92 (image43): três botões visíveis, incluindo “Falar com atendente”. Modelar lista de componentes, sem limitar todas as mensagens a dois CTAs.
- Há SMS com placeholders e links quebrados visualmente em partes do balão. Não atribuir trecho isolado a outra mensagem sem revisar a imagem.
- A sequência visual alterna canais e ofertas. Mesmo banner não significa mesma copy; texto semelhante não certifica mesma oferta/público.

## Normalização de comparação
Guardar texto literal e versão normalizada separadamente.
Normalização segura: Unicode NFC, quebras/whitespace de apresentação e máscaras comprovadas de variáveis (${1}, {{1}}, %%FIRST_NAME%% com mapa de parâmetros).
Não apagar números/condições da oferta, percentuais, datas de validade, instruções de retomada ou CTA para forçar match.
Nome/limite renderizados em print só viram campos se sua origem estiver comprovada no corpo/parâmetros. OCR de nome/limite é evidência incerta, não um dado pessoal a persistir em catálogo.

Comparar níveis independentes: corpo; parâmetros e bindings; oferta/claim; rodapé; CTA e quantidade/tipo de botões; imagem/banner; rastreamento e destino.
Hashes exatos não resolvem semelhança visual. Uma IA pode sugerir variante por texto/imagem, mas mantém diferenças e provas e não reescreve o passado.

## Repetição
Classificar: mesmo arquivo, mesma copy literal, mesma estrutura parametrizada, variante de oferta/CTA e semelhança temática.
Separar “observado em pacote”, “declarado na planilha” e “registrado em disparo”. Não afirmar frequência por pessoa com activities agregadas.
A aprovação deve permitir “reuso intencional”, com motivo e escopo; não impor que repetição é proibida.

