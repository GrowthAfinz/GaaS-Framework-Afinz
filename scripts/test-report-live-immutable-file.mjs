import test from 'node:test';
import assert from 'node:assert/strict';
import { getOrCreateImmutableFile } from '../supabase/functions/report-sync/report-live-immutable-file.ts';

test('retry after a lost upload response reuses persisted bytes without regenerating', async () => {
  let stored = null, exports = 0;
  const ports = { read: async () => stored, create: async () => { exports++; return new Uint8Array([1, 2]); },
    write: async bytes => { stored = bytes; throw new Error('response lost'); } };
  assert.deepEqual(await getOrCreateImmutableFile(ports), new Uint8Array([1, 2]));
  assert.deepEqual(await getOrCreateImmutableFile(ports), new Uint8Array([1, 2]));
  assert.equal(exports, 1);
});

test('a storage read failure cannot be interpreted as permission to regenerate', async () => {
  let generated = false;
  await assert.rejects(getOrCreateImmutableFile({ read: async () => { throw new Error('unauthorized'); },
    create: async () => { generated = true; return new Uint8Array([1]); }, write: async () => {} }), /unauthorized/);
  assert.equal(generated, false);
});

test('upload success without matching read-back cannot certify an artifact', async () => {
  for (const actual of [null, new Uint8Array([9])]) {
    let reads = 0;
    await assert.rejects(getOrCreateImmutableFile({ read: async () => ++reads === 1 ? null : actual,
      create: async () => new Uint8Array([1]), write: async () => {} }), /não confirmado|diverge/);
  }
});
