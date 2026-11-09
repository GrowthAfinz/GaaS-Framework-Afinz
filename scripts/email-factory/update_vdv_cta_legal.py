"""Localized update of the approved Pool source and existing briefing contract."""
from pathlib import Path
import json, re, argparse

root = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--baseline', type=Path, required=True, help='Snapshot of briefing and template slot before this revision')
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
baseline = json.loads(args.baseline.read_text(encoding='utf-8'))
out = args.output
out.mkdir(exist_ok=True)
legal = 'As ofertas, descontos, benefícios, condições comerciais, disponibilidade de estoque e respectivos prazos de validade são definidos e geridos pela Visa e/ou pelos parceiros participantes. Consulte as condições específicas de cada oferta diretamente no site do parceiro responsável.'
url = 'https://www.visa.com.br/promotions/visa-best-november.html'
rows = baseline['briefing']
changed = []
for row in rows:
    before = dict(row)
    if row['id'] == 'TEMA_BF26_V1':
        row['link'] = url
        row['condicoes'] = legal
        row['assunto'] = 'Black Afinz: confira as ofertas do seu {CARTAO} 💳💙'
        row['preheader'] = 'Ofertas selecionadas para você e mais benefícios no site da Visa. Confira!'
        # Empty V2 overrides continue inheriting the shared envelope.
    if row != before:
        changed.append({**row, 'expected_version':before['version'], 'source':'gaas'})

source = baseline['slot']['source'].replace('\r\n','\n')
anchor = 'SET @TitCond'
offset = source.index(anchor)
source = source[:offset]+'SET @LinkMaisOfertas = Trim(Field(@T, "LINK"))\nSET @AvisoLegal = Field(@T, "CONDICOES")\n'+source[offset:]
anchor = '<!-- CONDIÇÕES -->'
assert source.count(anchor)==1
cta = '''<!-- MAIS OFERTAS: LINK do registro TEMA; não altera links das marcas -->
%%[ IF NOT Empty(@LinkMaisOfertas) THEN ]%%
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:%%=v(@CorFundo)=%%;width:100%;"><tr><td align="center" style="padding:28px 24px 12px;font-family:Tahoma,Arial,sans-serif;color:%%=v(@CorTexto)=%%;font-size:18px;line-height:26px;font-weight:bold;">Confira outras ofertas exclusivas no site:</td></tr>
<tr><td align="center" style="padding:12px 24px 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#00C6CC" style="border-radius:5px;background-color:#00C6CC;"><a href="%%=RedirectTo(TreatAsContent(@LinkMaisOfertas))=%%" alias="VDV_VER_MAIS_OFERTAS" target="_blank" style="display:block;padding:15px 22px;font-family:Tahoma,Arial,sans-serif;font-size:16px;line-height:22px;color:#000000;text-decoration:none;border-radius:5px;">Ver mais ofertas</a></td></tr></table></td></tr></table>
%%[ ENDIF ]%%
'''
source = source.replace(anchor,cta+anchor)
for slot in (1,2,3):
    needle = f'%%=v(@S{slot}Nota)=%%<br>%%[ ENDIF ]%%%%[ ENDIF ]%%'
    replacement = f'%%=v(@S{slot}Nota)=%%<br>%%[ ENDIF ]%%%%[ IF NOT Empty(@AvisoLegal) THEN ]%%<div style="margin-top:8px;margin-bottom:12px;">%%=v(@AvisoLegal)=%%</div>%%[ ENDIF ]%%%%[ ENDIF ]%%'
    assert source.count(needle)==1
    source=source.replace(needle,replacement)
assert source.count('VDV_VER_MAIS_OFERTAS')==1
assert source.count('%%[')==source.count(']%%')
stack=[]
for block in re.findall(r'%%\[([\s\S]*?)\]%%',source):
    block=re.sub(r'/\*[\s\S]*?\*/','',block)
    block=re.sub(r'"[^"]*"|\x27[^\x27]*\x27','STRING',block)
    for token in re.findall(r'\b(?:IF|ENDIF|FOR|NEXT)\b',block,re.I):
        token=token.upper()
        if token in ('IF','FOR'): stack.append(token)
        else: assert stack and stack.pop()==('IF' if token=='ENDIF' else 'FOR')
assert not stack
(root/'src/modules/dynamic-email/fixtures/vaiDeVisaPoolTemplate.ts').write_text('// Fonte única SFMC: rodada + tema, desktop 2+1, CTA do tema.\nexport const VDV_POOL_TEMPLATE = '+json.dumps(source,ensure_ascii=False)+';\n',encoding='utf-8')
for ext in ('html','txt'):
    (out/f'VDV_POOL_HTML_COMPLETO.{ext}').write_text(source,encoding='utf-8',newline='\n')
(out/'VDV_POOL_PRE_CABECALHO.txt').write_text(source[:source.index(']%%')+3]+'\n%%=v(@PreHeader)=%%',encoding='utf-8')
(out/'briefing-atualizado.json').write_text(json.dumps(rows,ensure_ascii=False),encoding='utf-8')
(root/'.local-qa/vdv-publish.json').write_text(json.dumps({'items':changed,'slot_version':baseline['slot']['version'],'source':source},ensure_ascii=False),encoding='utf-8')
print(json.dumps({'changed_briefing_rows':len(changed),'offers':len([r for r in changed if r['tipo']=='OFERTA']),'html_bytes':len(source.encode()),'output':str(out)},ensure_ascii=False))
