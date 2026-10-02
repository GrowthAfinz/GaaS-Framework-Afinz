import { expect, it, vi } from 'vitest';
vi.mock('../store/useAppStore',()=>({useAppStore:vi.fn()}));
vi.mock('../contexts/PeriodContext',()=>({usePeriod:vi.fn()}));
vi.mock('../contexts/BUContext',()=>({useBU:vi.fn()}));
vi.mock('./useAdvancedFilters',()=>({useAdvancedFilters:vi.fn()}));
import { createDailyRows } from './useOriginacaoDashboard';
it('does not count a separately recorded CRM population twice in total B2C',()=>{
 const date=new Date(2026,4,1);
 const make=(tipo:string,cards:number)=>({data:'2026-05-01',tipo,propostas_b2c_total:cards*2,emissoes_b2c_total:cards,percentual_conversao_b2c:50});
 const [day]=createDailyRows(date,date,{},[make('total',100),make('serasa_api',70),make('crm',30)],0,date,21);
 expect(day.totalCards).toBe(100);expect(day.totalProposals).toBe(200);expect(day.serasaCards).toBe(70);expect(day.serasaSharePct).toBe(70);expect(day.cumulativeTotalCards).toBe(100);
});
