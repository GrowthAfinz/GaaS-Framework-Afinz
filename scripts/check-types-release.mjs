import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// This is an explicit debt gate, not a replacement for `npm run typecheck`.
// The reference was reproduced from clean main 2b4d488 with the same npm lock.
const reference = readFileSync(new URL('../docs/validation/typescript-main-2b4d488.txt', import.meta.url), 'utf8');
const result = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--pretty', 'false'], { encoding: 'utf8' });
if (result.error || result.signal || ![0, 2].includes(result.status)) {
  console.error(result.error ?? result.stderr ?? 'TypeScript did not complete');
  process.exit(1);
}
function diagnostics(output) {
  return output.replaceAll('\r', '').replace(/^\.\.\/report-live-main-baseline\//gm, '')
    .split(/\n(?=\S.*\(\d+,\d+\): error TS)/)
    .map(item => item.trim()).filter(Boolean)
    .map(item => item.replace(/\(\d+,\d+\): error TS/, ': error TS'));
}
const debt = diagnostics(reference);
const remaining = [...debt];
const added = diagnostics(result.stdout).filter(item => {
  const index = remaining.indexOf(item);
  if (index === -1) return true;
  remaining.splice(index, 1);
  return false;
});
if (added.length) {
  console.error('New TypeScript diagnostics:\n' + added.join('\n'));
  process.exit(1);
}
console.log(`No new TypeScript errors. Recorded main debt: ${debt.length}; resolved: ${remaining.length}.`);
