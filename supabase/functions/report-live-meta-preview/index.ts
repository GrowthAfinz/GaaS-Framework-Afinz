// Read-only platform evidence before a governed backfill. No business-table writes.
import { createClient } from "npm:@supabase/supabase-js@2";
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const token = Deno.env.get("META_ACCESS_TOKEN") ?? "";
const account = Deno.env.get("META_AD_ACCOUNT_ID") ?? "";
const allowed = new Set((Deno.env.get("META_GOVERNED_CAMPAIGN_IDS") ?? Deno.env.get("META_GOVERNED_CAMPAIGN_ID") ?? "").split(",").map(x=>x.trim()));
const redact = (message: string) => token ? message.replaceAll(token,"[REDACTED]") : message;
async function insights(campaign: string, day: string, metric: "actions" | "results") {
  const rows: Record<string, unknown>[] = [];
  let after: string | undefined;
  for (let page=0; page<100; page++) {
    const params = new URLSearchParams({ level:"ad", fields:`campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,date_start,date_stop,spend,impressions,inline_link_clicks,objective,${metric}`,
      time_range:JSON.stringify({since:day,until:day}),time_increment:"1",limit:"500",
      filtering:JSON.stringify([{field:"campaign.id",operator:"IN",value:[campaign]}]) });
    if (metric === "actions") params.set("action_attribution_windows","1d_view,1d_click,7d_click,28d_click");
    if (after) params.set("after",after);
    const response=await fetch(`https://graph.facebook.com/v25.0/${account}/insights?${params}`,{headers:{Authorization:`Bearer ${token}`}});
    const payload=await response.json();
    if (!response.ok || payload.error) throw new Error(`Meta ${response.status}: ${redact(String(payload.error?.message ?? "Falha de leitura"))}`);
    rows.push(...(payload.data ?? []));
    if (!payload.paging?.next) return rows;
    after=payload.paging?.cursors?.after;
    if (!after) throw new Error("Paginação sem cursor: evidência incompleta.");
  }
  throw new Error("Limite de páginas: evidência incompleta.");
}
Deno.serve(async request => {
  if (request.method !== "POST") return new Response("POST only",{status:405});
  const provided=request.headers.get("x-report-worker-token") ?? "";
  const auth=await admin.rpc("report_live_verify_worker",{p_token:provided});
  if (auth.error || auth.data !== true) return Response.json({error:"Unauthorized"},{status:401});
  try {
    const body=await request.json(); const campaign=String(body.campaign_id ?? ""),day=String(body.day ?? "");
    const closedLimit=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    if (!allowed.has(campaign) || !/^\d{4}-\d{2}-\d{2}$/.test(day) || new Date(`${day}T00:00:00Z`).toISOString().slice(0,10)!==day || day>=closedLimit) return Response.json({error:"Campanha/período inválido."},{status:400});
    if (!token || !account) throw new Error("Credenciais da origem indisponíveis.");
    const actions=await insights(campaign,day,"actions"), results=await insights(campaign,day,"results");
    const evidence={source:"Meta Graph API v25.0",account,campaign,day,level:"ad",captured_at:new Date().toISOString(),actions,results};
    const path=`audits/media/${day}/${campaign}/${crypto.randomUUID()}.json`;
    const saved=await admin.storage.from("report-live").upload(path,JSON.stringify(evidence),{contentType:"application/json",upsert:false});
    if (saved.error) throw new Error(`Evidência não persistida: ${saved.error.message}`);
    return Response.json({ok:true,path,day,campaign,action_rows:actions.length,result_rows:results.length,
      spend:actions.reduce((sum,row)=>sum+Number(row.spend ?? 0),0),business_rows_written:0,evidence});
  } catch (error) { return Response.json({error:redact(String((error as Error).message)).slice(0,800)},{status:500}); }
});
