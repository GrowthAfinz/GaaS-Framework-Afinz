import {describe, it, expect} from 'vitest';
import {contractCases} from '../../../scripts/fixtures/growth-trigger-contract';
describe('Release 8 synthetic trigger contract',()=>{
  for (const c of contractCases) it(c.name,()=>expect(c.check()).toBe(true));
});
