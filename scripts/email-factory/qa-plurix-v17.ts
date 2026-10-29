import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {PLURIX_V16_TEMPLATE} from '../../src/modules/dynamic-email/fixtures/plurixV16Template';
import {PLURIX_V17_TEMPLATE} from '../../src/modules/dynamic-email/fixtures/plurixV17Template';
import {renderDynamicEmail} from '../../src/modules/dynamic-email/ampscript/renderer';
import {emptyBriefingRow} from '../../src/modules/dynamic-email/domain/briefing';
const out=resolve(process.argv[2]);const rows=JSON.parse(readFileSync(join(out,'v3-before.json'),'utf8'));const report=[];
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1000,height:900},deviceScaleFactor:2});
for(const b of rows)for(const limit of ['', '3000']){
 const row=Object.assign(emptyBriefingRow(b.id),b.briefing_data);const sample={CPF:'00000000000',PRI_NOME:'MARIA',LIMITE:limit,PRODUTO:row.NM_PRODUTO_INTERNO,SEQUENCIA:row.SEQUENCIA,TP_CAMPANHA:'CRM'};
 const old=renderDynamicEmail(PLURIX_V16_TEMPLATE,row,sample,{pendingAssets:'hidden'});const next=renderDynamicEmail(PLURIX_V17_TEMPLATE,row,sample,{pendingAssets:'hidden'});
 if(next.diagnostics.length||old.html!==next.html)throw Error(JSON.stringify({id:b.id,diagnostics:next.diagnostics}));
 if(row.NM_PRODUTO_INTERNO==='AMIGAO'&&limit){await page.setContent(next.html,{waitUntil:'networkidle'});await page.evaluate(async()=>Promise.all([...document.images].map(im=>im.decode().catch(()=>{}))));if(await page.evaluate(()=>[...document.images].some(im=>!im.naturalWidth)))throw Error('Broken asset');await page.locator('.email-shell').screenshot({path:join(out,row.SEQUENCIA.replace('E-mail ','email-')+'-desktop.png')});}
 report.push({id:b.id,product:row.NM_PRODUTO_INTERNO,sequence:row.SEQUENCIA,limit:!!limit,renderedHtmlIdentical:true});
}
await browser.close();writeFileSync(join(out,'qa-v17.json'),JSON.stringify({comparisons:report.length,report,sfmcCertified:false},null,2));console.log(JSON.stringify({comparisons:report.length,passed:true}));
