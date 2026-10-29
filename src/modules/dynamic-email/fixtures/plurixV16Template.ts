import {PLURIX_V15_TEMPLATE} from './plurixV15Template';
import {opaqueEmailBackgrounds} from '../domain/opaqueEmailBackgrounds';
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
export const PLURIX_V16_TEMPLATE=source.slice(0,boundary)+html;
