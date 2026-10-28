import {describe,it,expect} from 'vitest';
import {PLURIX_V15_TEMPLATE} from './plurixV15Template';
import {renderDynamicEmail} from '../ampscript/renderer';
import {emptyBriefingRow} from '../domain/briefing';
import {plurixEnvelope} from '../domain/sfmcEnvelope';

describe('V15 CRM com header rasterizado',()=>{
 it('mostra a arte inteira mesmo com titulo editorial preenchido e preserva a personalizacao',()=>{
  for(let sequence=1;sequence<=8;sequence++)for(const limit of ['', '3500'])for(const logo of ['', 'https://example.com/avenida.png']){
   const row=Object.assign(emptyBriefingRow(),{SEQUENCIA:`E-mail ${sequence}`,HEADER:'https://example.com/hero.png',HEADER_TITULO:'Titulo da arte',HEADER_SUBTITULO:'Subtitulo da arte',HEADER_IMAGEM_CARTAO:'https://example.com/old-card.png',HEADER_LOGO:logo,MENSAGEM_LIMITE:'Ola, {{nome}}: R$ {{limite}}.',TITULO_COPY_1_AZUL:'Oi, %%=v(@FirstName)=%%',TITULO_CTA_1:'Pedir',LINK_CTA_1:'https://example.com/cta'});
   const r=renderDynamicEmail(PLURIX_V15_TEMPLATE,row,{CPF:'00000000000',PRI_NOME:'MARIA',LIMITE:limit,PRODUTO:'AMIGAO',SEQUENCIA:row.SEQUENCIA,TP_CAMPANHA:'CRM'});
   expect(r.diagnostics).toEqual([]);expect(r.html).toContain('src="https://example.com/hero.png"');
   expect(r.html).not.toContain('src="https://example.com/old-card.png"');expect(r.html).not.toContain('class="hdr-copy"');
   expect(r.html).toContain('Oi, Maria');expect(r.html).toContain('href="https://example.com/cta"');
   expect(r.html.includes('3.500,00')).toBe(Boolean(limit));expect(r.html.includes('src="https://example.com/avenida.png"')).toBe(Boolean(logo));
  }
 });
 it('exporta o preparo CRM uma vez pelo envelope e nao consulta pool nem escreve DE',()=>{
  expect(plurixEnvelope(PLURIX_V15_TEMPLATE)?.version).toBe('V15');
  expect(PLURIX_V15_TEMPLATE).toContain('SET @TpCampanha = "CRM"');
  expect(PLURIX_V15_TEMPLATE).toContain('SET @DE_ESTADO = "ESTADO_SEQUENCIA_CRM"');
  expect(PLURIX_V15_TEMPLATE).toContain('PLX_HEADER_MISSING');
  expect(PLURIX_V15_TEMPLATE).not.toMatch(/DE_POOL|InsertDE\(|UpdateDE\(|UpsertDE\(/);
 });
});
