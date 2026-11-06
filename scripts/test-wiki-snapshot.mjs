import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
test('complete Wiki snapshot preserves every published note and its exact hash',()=>{
 const manifest=JSON.parse(readFileSync('docs/wiki-sync/manifest.json','utf8'));
 const receipt=JSON.parse(readFileSync('docs/wiki-sync/publication-2026-11-03.json','utf8'));
 const files=(dir)=>readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(path.join(dir,d.name)):[path.join(dir,d.name)]);
 const names=files('docs/wiki-vault').filter(f=>f.endsWith('.md')).map(f=>path.relative('docs/wiki-vault',f).replaceAll('\\','/'));
 // The historical receipt is a baseline; later additive publications increase the snapshot.
 assert.ok(manifest.note_count >= receipt.note_count);assert.equal(names.length,manifest.note_count);
 assert.deepEqual(names.sort(),manifest.notes.map(n=>n.relative_path).sort());
 for(const n of manifest.notes){assert.equal(createHash('sha256').update(readFileSync(path.join('docs/wiki-vault',n.relative_path))).digest('hex'),n.content_hash,n.relative_path);}
});
