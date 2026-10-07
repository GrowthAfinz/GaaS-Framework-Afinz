import { parsePackage } from './parsePackage';
self.onmessage = async (event: MessageEvent<{ bytes: ArrayBuffer; name: string }>) => {
  try { self.postMessage({ result: await parsePackage(event.data.bytes, event.data.name) }); }
  catch (e) { self.postMessage({ error: e instanceof Error ? e.message : 'Não foi possível ler o pacote.' }); }
};

