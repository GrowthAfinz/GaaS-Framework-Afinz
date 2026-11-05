import { chromium } from 'playwright';
import { createServer } from 'vite';
import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
writeFileSync('.vdv-inbox-qa.html','<html><head><meta charset="utf-8"/></head><body><div id="root"></div><script type="module" src="/.vdv-inbox-qa.tsx"></script></body></html>');
writeFileSync('.vdv-inbox-qa.tsx',`import React from 'react';import {createRoot} from 'react-dom/client';import {DynamicEmailWorkspace} from './src/modules/dynamic-email/components/DynamicEmailWorkspace';import './src/App.css';createRoot(document.getElementById('root')!).render(<DynamicEmailWorkspace/>);`);
const server=await createServer({server:{port:3197,strictPort:true,open:false}});await server.listen();const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://*.supabase.co/**',r=>r.abort());await page.goto('http://localhost:3197/.vdv-inbox-qa.html');
 const section=page.getByRole('region',{name:'E-mails Vai de Visa'});await section.getByRole('button',{name:'E-mail 1 · persona (V1)',exact:true}).waitFor();await section.getByRole('button',{name:'E-mail 2 · cartão (V2)',exact:true}).waitFor();
 mkdirSync('artifacts/vai-de-visa/screenshots',{recursive:true});await page.screenshot({path:'artifacts/vai-de-visa/screenshots/inbox-visa-visible.png',fullPage:true});
 await section.getByRole('button',{name:'E-mail 2 · cartão (V2)',exact:true}).click();await page.getByRole('heading',{name:'Pool Vai de Visa · V2',exact:true}).waitFor();await page.getByRole('button',{name:'Exportar HTML V2',exact:true}).waitFor();await page.getByRole('button',{name:'Voltar aos e-mails',exact:false}).click();await section.getByRole('button',{name:'E-mail 1 · persona (V1)',exact:true}).click();await page.getByRole('heading',{name:'Pool Vai de Visa · V1',exact:true}).waitFor();await page.getByRole('button',{name:'Voltar aos e-mails',exact:false}).click();
 await page.getByRole('tab',{name:'Por jornada',exact:true}).click();await section.getByRole('button',{name:'E-mail 1 · persona (V1)',exact:true}).waitFor();await page.screenshot({path:'artifacts/vai-de-visa/screenshots/inbox-visa-journey.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('Caixa real: V1/V2 visíveis por parceiro e jornada, abrem o toque correto e retornam à caixa; Supabase bloqueado.');
}finally{await browser.close();await server.close();unlinkSync('.vdv-inbox-qa.html');unlinkSync('.vdv-inbox-qa.tsx');}
