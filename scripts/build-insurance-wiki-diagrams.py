"""Deterministic, standalone SVGs for the insurance strategy Wiki note."""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'wiki-diagrams'
OUT.mkdir(parents=True, exist_ok=True)


def start(height, title, description):
    return [f'<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="{height}" viewBox="0 0 1120 {height}" style="max-width:100%;height:auto" role="img" aria-labelledby="title desc">',
            f'<title id="title">{escape(title)}</title><desc id="desc">{escape(description)}</desc>',
            '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#526579"/></marker></defs>',
            f'<rect width="1120" height="{height}" rx="24" fill="#f7fafc"/>']


def text(s, x, y, lines, size=22, color='#18364a', weight=400, anchor='start'):
    if isinstance(lines, str):
        lines = [lines]
    for i, line in enumerate(lines):
        s.append(f'<text x="{x}" y="{y+i*(size+9)}" font-family="Arial, sans-serif" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" fill="{color}">{escape(line)}</text>')


def box(s, x, y, w, h, title, lines=(), fill='#ffffff', stroke='#d8e3eb', color='#18364a'):
    s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="{fill}" stroke="{stroke}"/>')
    text(s, x+22, y+35, title, 23, color, 700)
    text(s, x+22, y+68, lines, 19, color)


def arrow(s, d, dashed=False):
    dash = ' stroke-dasharray="7 6"' if dashed else ''
    s.append(f'<path d="{d}" fill="none" stroke="#526579" stroke-width="2"{dash} marker-end="url(#arrow)"/>')


s = start(1325, 'Seguros: mensal e trigger', 'Uma base de elegibilidade alimenta a mensal por semanas e triggers MCC em D+1. Mensal ativa descarta trigger do mesmo seguro. A espera entre produtos dura 15 dias e permite triggers. Formulário suspende a oferta durante o processamento e posse confirmada encerra a aquisição do produto.')
text(s, 40, 48, 'Duas portas de entrada. Uma elegibilidade.', 30, weight=700)
text(s, 40, 83, 'Desenho da estratégia • implantação e fontes em validação', 19, '#526579')
box(s, 180, 112, 760, 107, 'Quem pode receber?', ['Cadastro + posse + formulários + compras por categoria', 'SEGUROS_ELEGIBILIDADE_CPF'], '#e7f8f8', '#73cdce')
arrow(s, 'M560 219V246H305V277')
arrow(s, 'M560 246H815V277')
s.append('<rect x="70" y="277" width="470" height="857" rx="20" fill="#edf9f8" stroke="#b9e4e2"/>')
s.append('<rect x="580" y="277" width="470" height="857" rx="20" fill="#eef3ff" stroke="#cdd9f7"/>')
text(s, 96, 320, 'MENSAL', 24, '#007f83', 700)
text(s, 606, 320, 'TRIGGER MCC', 24, '#3b5c9a', 700)
box(s, 90, 342, 430, 110, 'Escolher o próximo seguro', ['Produto elegível da sequência', 'Respeitar a data de liberação'])
arrow(s, 'M305 452V477')
box(s, 90, 477, 430, 104, 'Público mensal', ['SEG_APTOS_[SEGURO]_MENSAL'])
arrow(s, 'M305 581V606')
box(s, 90, 606, 430, 110, 'Percorrer as semanas', ['SEM1 → SEM2 → SEM3 → …', 'A jornada registra cada mudança'])
arrow(s, 'M305 716V741')
box(s, 90, 741, 430, 110, 'Concluir a última semana', ['AGUARDANDO_PROXIMO_PRODUTO', 'Registrar conclusão e liberação'])
arrow(s, 'M305 851V876')
box(s, 90, 876, 430, 108, 'Esperar 15 dias', ['Intervalo configurável', 'Triggers continuam permitidos'])
arrow(s, 'M305 984V1009')
box(s, 90, 1009, 430, 100, 'Voltar ao próximo elegível', ['Fim da sequência? Retorna ao primeiro.'])
arrow(s, 'M90 1059H48V397H90', True)
box(s, 600, 342, 430, 110, 'Compra na categoria', ['Mulher: Saúde e Beleza', 'Residencial: Eletrodomésticos'])
text(s, 622, 478, 'Celular: Eletrônicos • entrada em D+1', 19)
arrow(s, 'M815 495V523')
box(s, 600, 523, 430, 104, 'Está na mensal desse seguro?', ['Verificar antes de autorizar a entrada'], '#f4f6ff', '#a8bce8')
arrow(s, 'M700 627V662')
arrow(s, 'M933 627V662')
text(s, 712, 651, 'SIM', 16, '#526579', 700)
text(s, 945, 651, 'NÃO', 16, '#526579', 700)
box(s, 600, 662, 200, 136, 'Descartar', ['Registrar decisão', 'Não reaproveitar', 'essa compra'], '#fff6e8', '#ecd3a0')
box(s, 820, 662, 210, 136, 'Autorizar', ['Aplicar os demais', 'critérios do', 'produto'])
arrow(s, 'M925 798V825')
box(s, 600, 825, 430, 104, 'Público de trigger', ['SEG_APTOS_[SEGURO]_TRIGGER'])
arrow(s, 'M815 929V954')
box(s, 600, 954, 430, 100, 'Executar a jornada', ['Trigger ativo permite entrada na mensal.'])
text(s, 604, 1095, 'Mensal → trigger: bloqueia o mesmo seguro.', 17, '#3b5c9a')
box(s, 70, 1155, 980, 75, 'Sem avanço de semana por mais de 15 dias?', ['Encerrar o ciclo e liberar o próximo produto mensal, sem nova espera.'], '#fff6e8', '#ecd3a0')
box(s, 70, 1240, 980, 69, 'Formulário: suspende a oferta durante o processamento.', [], '#e7f8f8', '#73cdce')
text(s, 92, 1293, 'Posse confirmada: encerra a aquisição daquele seguro nas duas frentes.', 19)
s.append('</svg>')
(OUT / 'seguros-percurso-v2.svg').write_text('\n'.join(s)+'\n', encoding='utf-8')

s = start(1010, 'Seguros: execução no SFMC', 'As fontes passam pela processos_seguros: validar, atualizar elegibilidade, conciliar participações, selecionar públicos e entregar às jornadas. Marcadores retornam ao controle. Decisões de trigger são registradas no lake ou em DE, local ainda a definir.')
text(s, 40, 48, 'Como a estratégia vira execução no SFMC', 30, weight=700)
text(s, 40, 82, 'Integração proposta à processos_seguros • etapas sequenciais', 19, '#526579')
box(s, 70, 110, 980, 110, 'Fontes da operação', ['CLIENTES ATIVOS • MAPA_SEGUROS • MAPA_MCC • formulários', 'Fluxo de arquivos: formulários → S3/Athena → retorno da MAPA'])
arrow(s, 'M560 220V250')
box(s, 70, 250, 630, 90, '1. Validar volume e atualidade', ['Uma carga incompleta não deve redefinir os públicos.'])
box(s, 740, 250, 310, 90, 'Parâmetros', [], '#fff6e8', '#ecd3a0')
text(s, 762, 318, 'SEGUROS_CONFIG_ESTRATEGIA', 16)
arrow(s, 'M385 340V370')
box(s, 70, 370, 630, 90, '2. Atualizar elegibilidade', ['SEGUROS_ELEGIBILIDADE_CPF'], '#e7f8f8', '#73cdce')
arrow(s, 'M385 460V490')
box(s, 70, 490, 630, 110, '3. Conciliar participações', ['SEGUROS_CONTROLE_CPF + histórico de ciclos', 'Semanas, processamento, posse e inatividade'])
box(s, 740, 490, 310, 110, 'Decisões de trigger', ['Lake ou DE de controle', 'Armazenamento a definir'], '#eef3ff', '#cdd9f7')
arrow(s, 'M385 600V630')
box(s, 70, 630, 980, 110, '4. Selecionar os seis públicos de entrada', ['SEG_APTOS_[MULHER / RESIDENCIAL / CELULAR]_MENSAL', 'SEG_APTOS_[MULHER / RESIDENCIAL / CELULAR]_TRIGGER'], '#e7f8f8', '#73cdce')
arrow(s, 'M560 740V770')
box(s, 70, 770, 980, 110, '5. Executar jornadas e devolver marcadores', ['Pablo configura os marcadores de entrada, semana e encerramento.', 'Identificar o ciclo em cada atualização; respeitar supressões antes dos contatos.'])
arrow(s, 'M70 825H32V545H70', True)
text(s, 70, 930, 'Ao liberar o próximo ciclo, invalidar o anterior.', 23, weight=700)
text(s, 70, 965, 'Mudar a DE de controle, sozinho, não interrompe uma jornada antiga.', 21, '#526579')
s.append('</svg>')
(OUT / 'seguros-sfmc-v2.svg').write_text('\n'.join(s)+'\n', encoding='utf-8')
print('Generated 2 insurance Wiki SVGs.')
