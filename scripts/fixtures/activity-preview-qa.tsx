import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../../src/App.css';
import {ActivityCommunicationPreview} from '../../src/components/communications/previews/ActivityCommunicationPreview';
import {DailyDetailsModal} from '../../src/components/jornada/DailyDetailsModal';
import {DisparoDetailModal} from '../../src/components/explorer/disparo/DisparoDetailModal';
import {DetailPanel} from '../../src/components/framework/FrameworkDetailPanel';
import {RelatorioView} from '../../src/components/RelatorioView';
import {activityCommunicationContext,toActivityRow} from '../../src/utils/activityCommunicationContext';
import {AuthProvider} from '../../src/context/AuthContext';
import {UserRoleProvider} from '../../src/context/UserRoleContext';
import {BUProvider} from '../../src/contexts/BUContext';
import {PeriodProvider} from '../../src/contexts/PeriodContext';
import {useAppStore} from '../../src/store/useAppStore';
import type {Activity} from '../../src/types/framework';

const make=(n:number,templateId?:string,channel='SMS'):Activity=>({id:'afz_car_vis_aqs_sms_bsp_mesmo_nome',templateId,dataDisparo:new Date(`2026-10-0${n}T12:00:00`),canal:channel,bu:'B2C',segmento:'Carrinho Abandonado',parceiro:'Base Própria',jornada:'JOR_AQS_B2C_TESTE',oferta:'Vibe',status:'Realizado',kpis:{baseEnviada:1000,baseEntregue:950,aberturas:700,cliques:200,propostas:60,aprovados:30,cartoes:n*10,emissoes:n*10,custoTotal:64,cac:64/(n*10),taxaEntrega:.95,taxaAbertura:.7,taxaConversao:.02},raw:{id:`00000000-0000-4000-8000-00000000000${n}`,'Activity name / Taxonomia':'afz_car_vis_aqs_sms_bsp_mesmo_nome',template_id:templateId,'Data de Disparo':`2026-10-0${n}`,Canal:channel,BU:'B2C',Segmento:'Carrinho Abandonado',jornada:'JOR_AQS_B2C_TESTE','Cartões Gerados':n*10}} as Activity);
const rows=[make(5,'SMS_A'),make(6,'SMS_B'),make(7),make(8,'MISSING'),make(9,'EMAIL','E-mail'),make(4,'IMAGE','WhatsApp')];
function App(){
 const [screen,setScreen]=useState('preview'),[which,setWhich]=useState(0);
 const a=rows[which];
 (window as any).selectFixture=(index:number)=>setWhich(index);
 (window as any).previewStore=useAppStore;
 return <div className="min-h-screen bg-slate-100 p-4"><p className="mb-2 text-xs text-slate-500">Validação local — dados simulados</p><nav className="mb-4 flex flex-wrap gap-2">{['preview','daily','framework','explorer','report'].map(s=><button className="rounded bg-white px-3 py-2" onClick={()=>setScreen(s)} key={s}>{s}</button>)}</nav>
 {screen==='preview'&&<div className="max-w-lg"><ActivityCommunicationPreview context={activityCommunicationContext(a)}/></div>}
 {screen==='daily'&&<DailyDetailsModal date={new Date('2026-10-06T12:00:00')} activities={rows} onClose={()=>setScreen('preview')}/>}
 {screen==='framework'&&<div className="h-[800px] w-[360px] bg-white"><DetailPanel row={{...a.raw,...toActivityRow(a),_origIdx:which}} allColumns={Object.keys(a.raw)} onClose={()=>setScreen('preview')}/></div>}
 {screen==='explorer'&&<DisparoDetailModal activity={toActivityRow(a)} onClose={()=>setScreen('preview')}/>}
 {screen==='report'&&<RelatorioView data={{'2026-10-05':[rows[0]],'2026-10-06':[rows[1]]}} periodStart={new Date('2026-10-01T00:00:00')} periodEnd={new Date('2026-10-22T23:59:59')}/>}
 </div>;
}
useAppStore.persist.clearStorage();
useAppStore.setState(s=>({activities:rows,reportDeepLink:{mode:'daily'},viewSettings:{...s.viewSettings,abaAtual:'relatorio',frente:'aquisicao'}}));
createRoot(document.getElementById('root')!).render(<AuthProvider><UserRoleProvider><BUProvider><PeriodProvider><App/></PeriodProvider></BUProvider></UserRoleProvider></AuthProvider>);
