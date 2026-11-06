from pathlib import Path
import sys
from pypdf import PdfReader
page=PdfReader(sys.argv[1]).pages[4].extract_text()
sql=page[page.index('SELECT'):page.index('FROM MAPA_MCC_ENTRADA r')+len('FROM MAPA_MCC_ENTRADA r')]
sql='\n'.join(line.rstrip() for line in sql.splitlines())
Path('src/modules/dynamic-email/fixtures/visaMapaQuery.sql').write_text('-- Fonte: VDV_Automacao_Preparacao.pdf, página 5, 03/11/2026.\n-- Referência documental, não executada pelo GaaS.\n'+sql+'\n',encoding='utf-8')
