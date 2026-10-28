import test from 'node:test';
import assert from 'node:assert/strict';
import {contractCases} from './fixtures/growth-trigger-contract.ts';
for (const c of contractCases) test(c.name,()=>assert.equal(c.check(),true));
