"""Localized update of the Pool Visa source (09/11/2026, revision 2).

1. Conditions: one summary line per displayed brand, then the shared legal notice ONCE.
2. Coupon: the code stays live text, becomes one-tap/one-click selectable (CSS) and gets an honest hint.

Reads the current fixture, patches it with strict anchors (fails loudly if the source drifted) and
writes the fixture plus the SFMC deliverables. It never connects to a database.
"""
from pathlib import Path
import argparse, json, re

root = Path(__file__).resolve().parents[2]
fixture = root / 'src/modules/dynamic-email/fixtures/vaiDeVisaPoolTemplate.ts'
parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, help='Directory for HTML/TXT/pre-header deliverables')
args = parser.parse_args()

text = fixture.read_text(encoding='utf-8')
m = re.search(r'VDV_POOL_TEMPLATE = (".*")', text, re.S)
source = json.loads(m.group(1))

# ---- 1. Conditions -------------------------------------------------------------------------
per_brand = '%%[ IF NOT Empty(@AvisoLegal) THEN ]%%<div style="margin-top:8px;margin-bottom:12px;">%%=v(@AvisoLegal)=%%</div>%%[ ENDIF ]%%'
assert source.count(per_brand) == 3, source.count(per_brand)
source = source.replace(per_brand, '')
legal_once = (
    '%%[ IF NOT Empty(@AvisoLegal) THEN ]%%'
    '<div class="vdv-legal" style="margin-top:10px;margin-bottom:8px;">%%=v(@AvisoLegal)=%%</div>'
    '%%[ ENDIF ]%%\n'
)
anchor = '%%[ IF NOT Empty(@RodCond) THEN ]%%'
assert source.count(anchor) == 1
source = source.replace(anchor, legal_once + anchor)

# ---- 2. Coupon -----------------------------------------------------------------------------
for slot in (1, 2, 3):
    old = (
        '<div class="afz-coupon" style="font-size:18px; line-height:24px; font-weight:bold; color:#007d81; '
        f'overflow-wrap:anywhere; word-break:break-word;">%%=v(@S{slot}Cupom)=%%</div>\n'
    )
    new = (
        '<div class="afz-coupon" style="font-size:18px; line-height:24px; font-weight:bold; color:#007d81; '
        'overflow-wrap:anywhere; word-break:break-word; -webkit-user-select:all; user-select:all;">'
        f'%%=v(@S{slot}Cupom)=%%</div>\n'
        '<div class="afz-coupon-hint" style="font-size:12px; line-height:16px; color:#555555; margin-top:3px;">'
        'Selecione o código para copiar</div>\n'
    )
    n = source.count(old)
    assert n >= 1, f'slot {slot} coupon anchor missing'
    source = source.replace(old, new)

# ---- sanity --------------------------------------------------------------------------------
assert source.count('vdv-legal') == 1
assert source.count('VDV_VER_MAIS_OFERTAS') == 1
assert source.count('%%[') == source.count(']%%')
stack = []
for block in re.findall(r'%%\[([\s\S]*?)\]%%', source):
    block = re.sub(r'/\*[\s\S]*?\*/', '', block)
    block = re.sub(r'"[^"]*"|\x27[^\x27]*\x27', 'STRING', block)
    for token in re.findall(r'\b(?:IF|ENDIF|FOR|NEXT)\b', block, re.I):
        token = token.upper()
        if token in ('IF', 'FOR'):
            stack.append(token)
        else:
            assert stack and stack.pop() == ('IF' if token == 'ENDIF' else 'FOR')
assert not stack

fixture.write_text(
    '// Fonte única SFMC: rodada + tema, desktop 2+1, CTA do tema, condições em linha única + aviso legal uma vez, cupom selecionável.\n'
    'export const VDV_POOL_TEMPLATE = ' + json.dumps(source, ensure_ascii=False) + ';\n',
    encoding='utf-8',
)
if args.output:
    out = args.output
    out.mkdir(parents=True, exist_ok=True)
    for ext in ('html', 'txt'):
        (out / f'VDV_POOL_HTML_COMPLETO.{ext}').write_text(source, encoding='utf-8', newline='\n')
    (out / 'VDV_POOL_PRE_CABECALHO.txt').write_text(source[:source.index(']%%') + 3] + '\n%%=v(@PreHeader)=%%', encoding='utf-8', newline='\n')
print(json.dumps({'chars': len(source), 'bytes': len(source.encode()), 'coupon_hints': source.count('afz-coupon-hint')}))
