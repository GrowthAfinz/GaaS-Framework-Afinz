// Shared boundary for deployed Edge Functions. Never trust a decoded JWT alone.
type GaasHandler = (request: Request, info: Deno.ServeHandlerInfo) => Response | Promise<Response>;
export interface GaasGuardOptions {
  serviceKeys: string[];
  url: string;
  publicKey: string;
  worker?: boolean;
  dispatchKey?: string;
  dispatchVerifier?: string;
  fetcher?: typeof fetch;
}
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info,x-report-worker-token",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Content-Type": "application/json",
};
export function createGaasGuardHandler(handler: GaasHandler, options: GaasGuardOptions): GaasHandler {
  return async (request, info) => {
    if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
    const deny = (status: number) => Response.json({ error: status === 503 ? "Access verification unavailable" : "Approved GaaS access required" }, { status, headers: cors });
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const serviceKeys = options.serviceKeys.filter(Boolean);
    if (token && serviceKeys.includes(token)) return handler(request, info);
    if (token && options.dispatchKey && token === options.dispatchKey) return handler(request, info);
    const fetcher = options.fetcher ?? fetch;
    try {
      const worker = request.headers.get("x-report-worker-token") ?? token;
      if (options.worker && /^[a-f0-9]{64}$/i.test(worker) && serviceKeys[0]) {
        const checked = await fetcher(options.url + "/rest/v1/rpc/report_live_verify_worker", {
          method: "POST",
          headers: { apikey: serviceKeys[0], Authorization: "Bearer " + serviceKeys[0], "Content-Type": "application/json" },
          body: JSON.stringify({ p_token: worker }),
        });
        if (checked.ok && await checked.json() === true) return handler(request, info);
      }
      if (options.dispatchVerifier && /^[a-f0-9]{64}$/i.test(token) && serviceKeys[0]) {
        const checked = await fetcher(options.url + "/rest/v1/rpc/" + options.dispatchVerifier, {
          method: "POST",
          headers: { apikey: serviceKeys[0], Authorization: "Bearer " + serviceKeys[0], "Content-Type": "application/json" },
          body: JSON.stringify({ p_token: token }),
        });
        if (checked.ok && await checked.json() === true) return handler(request, info);
      }
      if (!token) return deny(401);
      if (!options.url || !options.publicKey) return deny(503);
      const checked = await fetcher(options.url + "/rest/v1/rpc/gaas_access_status", {
        method: "POST",
        headers: { apikey: options.publicKey, Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: "{}",
      });
      if (checked.status >= 500) return deny(503);
      if (!checked.ok || await checked.json() !== true) return deny(403);
      return handler(request, info);
    } catch { return deny(503); }
  };
}
export function gaasSecureServe(handler: GaasHandler, extra: Pick<GaasGuardOptions, "worker" | "dispatchKey" | "dispatchVerifier"> = {}) {
  let modernKeys: string[] = [];
  try { modernKeys = Object.values(JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}")).filter((v): v is string => typeof v === "string"); } catch { /* no optional modern keys */ }
  return Deno.serve(createGaasGuardHandler(handler, {
    serviceKeys: [Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", ...modernKeys],
    url: Deno.env.get("SUPABASE_URL") ?? "",
    publicKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    worker: extra.worker,
    dispatchKey: extra.dispatchKey,
    dispatchVerifier: extra.dispatchVerifier,
  }));
}
