// =====================================================================
// Imagens dos e-mails para o pacote "Prompt e IA" da Fábrica de E-mails.
//
// O sandbox do claude.ai/ChatGPT não acessa a internet, então o pacote exportado precisa levar
// as imagens dentro dele. Os servidores de imagem (SFMC e blob da Plurix) não liberam CORS, e
// o navegador do GaaS não consegue baixá-las direto: esta função busca e devolve em base64.
//
// Só lê (GET) de domínios conhecidos, só imagem, até 3 MB cada e 60 por chamada. JWT obrigatório
// (verify_jwt = true): roda com a sessão de quem está logado no GaaS.
// =====================================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_HOSTS = new Set([
  "image.relacionamento.afinz.com.br",
  "stoplxmkt.blob.core.windows.net",
]);
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_URLS = 60;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

async function fetchImage(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { return { error: "URL inválida" }; }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) return { error: "domínio não permitido" };
  const response = await fetch(url, { redirect: "error" });
  if (!response.ok) return { error: `HTTP ${response.status}` };
  const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!contentType.startsWith("image/")) return { error: "não é imagem" };
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) return { error: "imagem maior que 3 MB" };
  return { contentType, base64: toBase64(bytes) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);
  let urls: unknown;
  try { ({ urls } = await req.json()); } catch { return json({ error: "Corpo JSON inválido" }, 400); }
  if (!Array.isArray(urls) || urls.some((u) => typeof u !== "string")) return json({ error: "urls precisa ser uma lista de textos" }, 400);
  const unique = [...new Set(urls as string[])].slice(0, MAX_URLS);
  const entries = await Promise.all(unique.map(async (u) => {
    try { return [u, await fetchImage(u)] as const; } catch (error) { return [u, { error: String(error).slice(0, 120) }] as const; }
  }));
  return json({ images: Object.fromEntries(entries) });
});
