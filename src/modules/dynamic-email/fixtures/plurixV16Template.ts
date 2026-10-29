import {PLURIX_V15_TEMPLATE} from './plurixV15Template';
import {opaqueEmailBackgrounds} from '../domain/opaqueEmailBackgrounds';
import {sfmcTableButton, upgradePlurixV16Buttons} from '../domain/sfmcTableButton';
export const PLURIX_V16_TEMPLATE_ID='builtin-plurix-v16';
export const PLURIX_V16_TEMPLATE_NAME='PLURIX V16 CRM · fundos preenchidos';
const source=PLURIX_V15_TEMPLATE.split('@PLXV15Inicializado').join('@PLXV16Inicializado').replace('/* PLURIX V15 CRM:','/* PLURIX V16 CRM:');
const boundary=source.indexOf('<!DOCTYPE html>');
let html=opaqueEmailBackgrounds(source.slice(boundary));
// A foreground selector must not also match background-color or text-fill-color.
// Expanding the selector list keeps simple attribute-selector support in email clients.
html=html.replace(/<style>([\s\S]*?)<\/style>/g,(_,css:string)=>'<style>'+css.replace(/([^{}]+)\{([^{}]*)\}/g,(rule,selectors:string,body:string)=>{
 if(!/(?:^|;)\s*color:/.test(body))return rule;
 const expanded=selectors.split(',').flatMap(selector=>{
  const match=selector.match(/\[style\*="color:(#[\da-f]+);"\]/i);if(!match)return [selector];
  return [`[style^="color:${match[1]};"]`,`[style*=";color:${match[1]};"]`,`[style*="; color:${match[1]};"]`].map(attr=>selector.replace(match[0],attr));
 });
 return expanded.join(',')+'{'+body+'}';
})+'</style>');
export const PLURIX_V16_BASE_TEMPLATE=source.slice(0,boundary)+html;
const preferences = '<a href="%%profile_center_url%%" alias="Central de Preferências" target="_blank" style="color:#2C3490; -webkit-text-fill-color:#2C3490; text-decoration:underline;">Gerenciar preferências</a>';
if (!html.includes(preferences)) throw new Error('Plurix preferences footer not found');
html=upgradePlurixV16Buttons(html).replace(preferences, preferences+'<br><br>'+sfmcTableButton('%%unsub_center_url%%', 'Cancelar inscrição', false, true));
const setup=source.slice(0,boundary)
 .replace('/* V15 R3: nome de exibicao da investida; PRODUTO segue como chave tecnica. */','/* V16: assinatura Amigao para redes adquiridas. */')
 .replace('SET @NomeInvestida = "Compre Mais"','SET @NomeInvestida = "Amigão"')
 .replace('SET @NomeInvestida = "Superpão"','SET @NomeInvestida = "Amigão"');
export const PLURIX_V16_R2_TEMPLATE=setup+html;
export const PLURIX_V16_TEMPLATE=PLURIX_V16_R2_TEMPLATE.replace(
 '<br><br>'+sfmcTableButton('%%unsub_center_url%%', 'Cancelar inscrição', false, true),
 '<br>'+preferences.replace('%%profile_center_url%%','%%unsub_center_url%%').replace('Central de Preferências','Cancelar inscrição').replace('Gerenciar preferências','Cancelar inscrição'),
);
