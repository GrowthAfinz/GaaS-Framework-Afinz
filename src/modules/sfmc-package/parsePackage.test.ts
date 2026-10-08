import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseEntities, parsePackage, parseLink, normalizeJourney, safeHttps, parseJourneyGraphs } from './parsePackage';
import { strToU8, zipSync } from 'fflate';
describe('paridade com a skill sfmc-jornadas-pacote', () => {
  for (const [fixture, count, optouts, banners] of [['carrinho',18,4,14],['b2c',93,21,20],['plurix',2,0,0]] as const) {
    it(fixture, async () => {
      const raw = readFileSync(new URL('./fixtures/'+fixture+'.zip',import.meta.url));
      const parsed = await parsePackage(Uint8Array.from(raw).buffer, fixture+'.zip');
      const expected = JSON.parse(readFileSync(new URL('./fixtures/'+fixture+'.expected.json',import.meta.url),'utf8'));
      expect(parsed.messages).toHaveLength(count);
      expect(parsed.messages.filter(m=>m.is_optout)).toHaveLength(optouts);
      expect(parsed.messages.filter(m=>m.content.banner_url)).toHaveLength(banners);
      for (const row of expected) {
        const message=parsed.messages.find(m=>m.activity_name===row.activity_name&&m.journey_name===row.jornada&&m.journey_version===row.jornada_versao&&m.journey_origin_id===String(row.jornada_id_origem));
        expect(message, row.activity_name).toBeDefined();
        expect(message!.content.body_text).toBe(row.texto);
        expect(message!.content.body_params).toEqual(row.parametros);
        expect(message!.content.meta_template_name).toBe(row.template_meta);
        expect(message!.content.footer).toBe(row.rodape);
        expect(message!.content.banner_url).toBe(row.banner_url);
        expect(message!.link_url).toBe(row.link);
        expect(message!.content.sms_from).toBe(row.sms_remetente);
        expect(message!.utm.af_sub3).toBe(row.af_sub3);
        expect(message!.journey_version).toBe(row.jornada_versao);
        expect(message!.entry_de).toBe(row.de_entrada);
      }
      expect(new Set(parsed.messages.map(m=>m.occurrence_key)).size).toBe(count);
    });
  }
  it('preserva caixa e decodifica URL',()=>{
    expect(parseLink('https://exemplo.test/?af_sub3=B2c_Test_D1&c=Cart%C3%A3o').af_sub3).toBe('B2c_Test_D1');
    expect(parseLink('https://exemplo.test/?c=Cart%C3%A3o').c).toBe('Cartão');
    expect(normalizeJourney(' JOR_AQUISICAO_X ')).toBe('JOR_AQS_X');
    expect(safeHttps('javascript:alert(1)')).toBeNull();
  });
  it('recusa ZIP arbitrário e caminhos inseguros',async()=>{
    await expect(parsePackage(zipSync({'../info.json':strToU8('{}')}).buffer as ArrayBuffer,'bad.zip')).rejects.toThrow('Caminho inválido');
    await expect(parsePackage(zipSync({'test.json':strToU8('{}')}).buffer as ArrayBuffer,'bad.zip')).rejects.toThrow('Package Manager');
  });
  it('preserva caminhos convergentes sem duplicar o nó',()=>{
    const obj=(data:unknown)=>strToU8(JSON.stringify({data}));
    const entries={'info.json':strToU8('{}'),'entities/journeys/1.json':obj({name:'J',activities:[
      {key:'split',type:'RANDOMSPLIT',outcomes:[{key:'a',next:'sms',arguments:{percentage:50}},{key:'b',next:'wait',arguments:{percentage:50}}]},
      {key:'wait',type:'WAIT',configurationArguments:{waitDuration:1,waitUnit:'DAYS'},outcomes:[{next:'sms'}]},
      {key:'sms',type:'SMSSYNC',name:'x_sms_y',metaData:{store:{selectedContentBuilderMessage:'Texto'}},outcomes:[]},
    ]})};
    const rows=parseEntities(entries,'graph.zip').messages;
    expect(rows).toHaveLength(1);expect(rows[0].paths).toHaveLength(2);
    expect(rows[0].paths[1].waits).toEqual(['1 DAYS']);
    const [graph]=parseJourneyGraphs(entries);
    expect(graph.nodes).toHaveLength(3);
    expect(graph.joins).toEqual(['sms']);
    expect(graph.roots).toEqual(['split']);
    expect(graph.nodes[0].outcomes.map((o: {next: string})=>o.next)).toEqual(['sms','wait']);
  });
  it('conserva referência de engajamento e janela Einstein sem convertê-la em espera fixa',()=>{
    const obj=(data:unknown)=>strToU8(JSON.stringify({data}));
    const entries={'info.json':strToU8('{}'),'entities/journeys/1.json':obj({name:'J',version:2,activities:[
      {key:'open',name:'Abrir e-mail 1',type:'ENGAGEMENTDECISION',configurationArguments:{refActivityCustomerKey:'email1'},outcomes:[{key:'yes',metaData:{label:'Sim'},next:'sto'},{key:'no',metaData:{label:'Não'},next:null}]},
      {key:'sto',type:'STOWAIT',configurationArguments:{params:{slidingWindowHours:12}},outcomes:[{next:'sms'}]},
      {key:'sms',type:'SMSSYNC',name:'sms',metaData:{store:{selectedContentBuilderMessage:'Texto'}},outcomes:[]},
    ]})};
    const [message]=parseEntities(entries,'engagement.zip').messages;
    expect(message.paths[0]).toEqual({labels:['Abrir e-mail 1: Sim'],waits:[]});
    const [graph]=parseJourneyGraphs(entries);
    expect(graph.version).toBe(2);
    expect(graph.nodes[0].configuration.refActivityCustomerKey).toBe('email1');
    expect(graph.nodes[1].configuration.params.slidingWindowHours).toBe(12);
  });
});

