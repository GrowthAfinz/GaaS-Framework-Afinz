"""Deterministic editorial SVGs. Business rules come from the Seguros strategy note."""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'wiki-diagrams'
INK, MUTED, TEAL, LINE = '#18212a', '#60717b', '#007c80', '#d7dfe2'


def text(s, x, y, lines, size=18, color=INK, weight=400):
    if isinstance(lines, str):
        lines = [lines]
    for i, line in enumerate(lines):
        s.append(f'<text x="{x}" y="{y+i*(size+8)}" font-family="Segoe UI,Arial,sans-serif" font-size="{size}" font-weight="{weight}" fill="{color}">{escape(line)}</text>')


def line(s, x1, y1, x2, y2, color=LINE):
    s.append(f'<path d="M{x1} {y1}H{x2}" stroke="{color}"/>' if y1 == y2 else f'<path d="M{x1} {y1}L{x2} {y2}" stroke="{color}"/>')


def rect(s, x, y, w, h, fill='#fff', stroke=LINE):
    s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}"/>')


def arrow(s, d, dashed=False):
    dash = ' stroke-dasharray="5 5"' if dashed else ''
    s.append(f'<path d="{d}" fill="none" stroke="{TEAL}" stroke-width="1.6"{dash} marker-end="url(#arrow)"/>')


def box(s, x, y, w, h, title, lines=(), accent=False, number=None):
    rect(s, x, y, w, h, '#eff7f6' if accent else '#fff')
    left = x+18
    if number:
        text(s, left, y+29, number, 14, TEAL, 600)
        left += 35
    text(s, left, y+30, title, 20, INK, 600)
    text(s, left, y+57, lines, 16, MUTED)


def start(h, title, subtitle, description, label):
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="{h}" viewBox="0 0 1280 {h}" role="img" aria-labelledby="title desc">',
         f'<title id="title">{escape(title)}</title><desc id="desc">{escape(description)}</desc>',
         f'<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="{TEAL}"/></marker></defs>',
         f'<rect width="1280" height="{h}" fill="#fff"/>']
    text(s, 40, 32, label, 13, TEAL, 600)
    text(s, 40, 76, title, 30, weight=700)
    text(s, 40, 106, subtitle, 17, MUTED)
    line(s, 40, 127, 1240, 127)
    return s


s = start(1154, 'Duas entradas. Um percurso de aquisição.',
          'Mensal e trigger compartilham elegibilidade; cada frente tem seu momento de entrada.',
          'Desenho proposto de Seguros. Mensal por semanas e trigger por compra em categoria MCC em D+1, sujeito à validação da fonte. Mensal ativa ou autorizada descarta trigger do mesmo produto, sem fila. Trigger ativo permite mensal. Conclusão da última semana inicia espera de 15 dias; mais de 15 dias sem avanço encerra por inatividade, sem nova espera. Formulário suspende ofertas e posse confirmada encerra aquisição do produto.',
          'ESTRATÉGIAS / SEGUROS · 01 · PERCURSO DO CLIENTE')
box(s, 40, 148, 1200, 90, 'Elegibilidade compartilhada',
    ['Conta apta + canal permitido + critérios do seguro; sem solicitação em processamento nem posse confirmada.'], True)
arrow(s, 'M640 238V258H330V282')
arrow(s, 'M640 258H950V282')
text(s, 56, 307, 'MENSAL', 16, TEAL, 700)
text(s, 676, 307, 'TRIGGER POR COMPRA', 16, TEAL, 700)
text(s, 56, 335, 'Um produto por vez, na sequência definida.', 16, MUTED)
text(s, 676, 335, 'Uma oportunidade contextual, com entrada em D+1.*', 16, MUTED)
line(s, 56, 351, 604, 351)
line(s, 676, 351, 1224, 351)
box(s, 56, 371, 548, 88, 'Selecionar o próximo seguro', ['Produto elegível + data de liberação respeitada.'], number='01')
arrow(s, 'M330 459V480')
box(s, 56, 481, 548, 88, 'Entrar e avançar nas semanas', ['SEM1 → SEM2 → SEM3 → …; registrar cada mudança.'], number='02')
arrow(s, 'M330 569V590')
box(s, 56, 591, 548, 88, 'Concluir a última semana', ['Só a conclusão inicia a contagem entre produtos.'], number='03')
arrow(s, 'M330 679V700')
box(s, 56, 701, 548, 88, 'Aguardar 15 dias e selecionar novamente', ['Intervalo configurável; triggers continuam abertos.'], True, number='04')
arrow(s, 'M56 745H28V414H56', True)
text(s, 56, 819, 'Fim da sequência: voltar ao primeiro seguro elegível.', 15, MUTED)

box(s, 676, 371, 548, 113, 'Identificar a compra na categoria',
    ['Mulher · Saúde e Beleza  |  Residencial · Eletrodomésticos', 'Celular · Eletrônicos; não exige valor mínimo da compra.'], number='01')
arrow(s, 'M950 484V505')
box(s, 676, 506, 548, 88, 'Mensal ativa ou autorizada para o mesmo seguro?', ['Conferir também a seleção mensal desta execução.'], True)
arrow(s, 'M810 594V623')
arrow(s, 'M1087 594V623')
text(s, 820, 615, 'SIM', 13, TEAL, 600)
text(s, 1097, 615, 'NÃO', 13, TEAL, 600)
box(s, 676, 624, 264, 96, 'Descartar o evento', ['Registrar a decisão.', 'Não guardar para depois.'])
box(s, 960, 624, 264, 96, 'Autorizar a entrada', ['Aplicar os demais critérios', 'e executar o trigger.'])
text(s, 676, 758, 'Trigger ativo permite entrada na mensal.', 17, TEAL, 600)
text(s, 676, 788, '*D+1 depende da atualização e da identidade do evento.', 15, MUTED)

rect(s, 40, 850, 1200, 76, '#f8fafb')
text(s, 58, 878, 'EXCEÇÃO NA MENSAL · mais de 15 dias sem avanço na mesma semana', 17, weight=600)
text(s, 58, 905, 'Encerrar por inatividade, invalidar o ciclo anterior e liberar o próximo produto, sem outra espera.', 16, MUTED)
text(s, 40, 970, 'EM QUALQUER FRENTE · O QUE MUDA DEPOIS DA OFERTA', 13, TEAL, 600)
for x, title, body in [(40, 'Oferta', 'Mensal ou trigger'), (350, 'Formulário válido', 'Suspende ofertas do produto'), (660, 'Em processamento', 'Ausência na MAPA não libera'), (970, 'Posse confirmada', 'Encerra aquisição do produto')]:
    box(s, x, 990, 270, 78, title, [body], x in (350, 970))
for x in (310, 620, 930):
    arrow(s, f'M{x} 1029H{x+40}')
line(s, 40, 1094, 1240, 1094)
text(s, 40, 1122, 'DESENHO PROPOSTO · ordem dos produtos, cadência, fontes e demais pendências continuam em validação.', 15, MUTED)
s.append('</svg>')
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'seguros-percurso-v2.svg').write_text('\n'.join(s)+'\n', encoding='utf-8')

s = start(1220, 'Da fonte à jornada, com retorno de estado.',
          'Integração proposta à processos_seguros · etapas em sequência; nomes de funções, sem implantação comprovada.',
          'Fluxo técnico proposto: validar fontes, atualizar elegibilidade, conciliar participações, selecionar mensal, selecionar trigger considerando a mensal autorizada e executar jornadas. Parâmetros de intervalo e inatividade são independentes. As jornadas devolvem marcadores por ciclo; decisões de trigger têm armazenamento a definir no lake ou DE. Falha de carga não pode simular perda de posse.',
          'ESTRATÉGIAS / SEGUROS · 02 · EXECUÇÃO NO SFMC')
box(s, 40, 148, 1200, 96, 'Fontes e troca de arquivos',
    ['CLIENTES ATIVOS · MAPA_SEGUROS · MAPA_MCC · formulários', 'processos_seguros: preparar / exportar formulários → S3 / Athena → importar retorno da MAPA.'])
arrow(s, 'M460 244V270')
steps = [
    (270, 'Validar volume e atualidade', ['Carga incompleta não pode redefinir posse ou gerar públicos.'], False),
    (390, 'Atualizar a elegibilidade por CPF', ['SEGUROS_ELEGIBILIDADE_CPF · aptidão por produto e impedimentos.'], True),
    (510, 'Conciliar participações e ciclos', ['SEGUROS_CONTROLE_CPF + histórico · semanas, solicitações, posse e inatividade.'], False),
    (630, 'Selecionar as três entradas mensais', ['SEG_APTOS_[MULHER / RESIDENCIAL / CELULAR]_MENSAL'], True),
    (750, 'Selecionar as três entradas de trigger', ['SEG_APTOS_[MULHER / RESIDENCIAL / CELULAR]_TRIGGER', 'Considerar a mensal ativa e a autorizada nesta execução; registrar descarte.'], True),
    (894, 'Executar jornadas e devolver marcadores', ['Entrada, semana e encerramento identificados por CPF, produto, régua e ciclo.', 'Pablo configura os marcadores; conferir supressões antes dos contatos.'], False),
]
for i, (y, title, body, accent) in enumerate(steps):
    h = 118 if len(body)>1 else 94
    box(s, 70, y, 850, h, title, body, accent, f'{i+1:02}')
    if i+1<len(steps):
        arrow(s, f'M495 {y+h}V{steps[i+1][0]}')
arrow(s, 'M70 953H40V557H70', True)

box(s, 960, 390, 280, 212, 'Parâmetros separados',
    ['SEGUROS_CONFIG_ESTRATEGIA', 'Entre produtos · 15 dias', 'Sem avanço · 15 dias', 'Uma regra não substitui a outra.'])
arrow(s, 'M960 548H920', True)
arrow(s, 'M1100 602V676H920', True)
box(s, 960, 750, 280, 262, 'Decisões de trigger',
    ['Evento identificado:', 'liberado, descartado', 'ou entrada confirmada.', '', 'Lake ou DE de controle.', 'Local ainda a definir.'])
arrow(s, 'M920 808H960', True)

rect(s, 40, 1048, 1200, 76, '#f8fafb')
text(s, 58, 1077, 'RETORNO DE ESTADO · encerrar um ciclo antes de liberar o seguinte', 17, weight=600)
text(s, 58, 1104, 'Alterar a DE de controle, sozinho, não interrompe a jornada anterior. Identificar e invalidar o ciclo.', 16, MUTED)
line(s, 40, 1150, 1240, 1150)
text(s, 40, 1178, 'A VALIDAR · campos de posse, D+1 / identidade do evento, BU, chaves, reentrada e fonte oficial de solicitações.', 15, MUTED)
text(s, 40, 1203, 'Formulário suspende a oferta; contratação depende de confirmação. Estes diagramas não executam automações.', 14, MUTED)
s.append('</svg>')
(OUT / 'seguros-sfmc-v2.svg').write_text('\n'.join(s)+'\n', encoding='utf-8')
print('Generated 2 editorial insurance Wiki SVGs.')
