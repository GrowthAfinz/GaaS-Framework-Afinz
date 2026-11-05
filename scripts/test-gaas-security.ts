import { createGaasGuardHandler } from "../supabase/functions/_shared/gaas-security.ts";
const info = {} as Deno.ServeHandlerInfo;
const assert = (v: unknown) => { if (!v) throw new Error("assertion failed"); };
const base = { serviceKeys: ["server-secret"], url: "https://example.invalid", publicKey: "public-key" };
for (const [name,token,response,status] of [
 ["missing credential","",true,401],
 ["approved member","signed-member",true,200],
 ["unapproved user","signed-stranger",false,403],
 ["deleted account","old-signed-jwt",false,403],
 ["anonymous key","public-key",false,403],
] as const) Deno.test(name,async()=>{
 let called=false;
 const wrapped=createGaasGuardHandler(()=>{called=true;return new Response("ok");},{...base,fetcher:async()=>Response.json(response)});
 const req=new Request("https://edge.invalid",{headers:token?{Authorization:"Bearer "+token}:{}});
 assert((await wrapped(req,info)).status===status); assert(called===(status===200));
});
Deno.test("service bypass is exact and does not call external verifier",async()=>{
 const wrapped=createGaasGuardHandler(()=>new Response("ok"),{...base,fetcher:()=>{throw Error("must not fetch");}});
 assert((await wrapped(new Request("https://edge.invalid",{headers:{Authorization:"Bearer server-secret"}}),info)).status===200);
 assert((await wrapped(new Request("https://edge.invalid",{headers:{Authorization:"Bearer server-secret-forged"}}),info)).status===503);
});
Deno.test("verification outage fails closed",async()=>{
 let called=false;
 const wrapped=createGaasGuardHandler(()=>{called=true;return new Response("ok");},{...base,fetcher:async()=>new Response("",{status:500})});
 assert((await wrapped(new Request("https://edge.invalid",{headers:{Authorization:"Bearer jwt"}}),info)).status===503);assert(!called);
});
Deno.test("CORS preflight does not invoke handler",async()=>{
 let called=false;const wrapped=createGaasGuardHandler(()=>{called=true;return new Response("bad");},base);
 assert((await wrapped(new Request("https://edge.invalid",{method:"OPTIONS"}),info)).status===200);assert(!called);
});
Deno.test("worker requires successful server-side verification",async()=>{
 let called=false;const token="a".repeat(64);
 const wrapped=createGaasGuardHandler(()=>{called=true;return new Response("ok");},{...base,worker:true,fetcher:async()=>Response.json(false)});
 assert((await wrapped(new Request("https://edge.invalid",{headers:{"x-report-worker-token":token}}),info)).status===401);assert(!called);
});
Deno.test("valid worker preserves internal dispatch",async()=>{
 const wrapped=createGaasGuardHandler(()=>new Response("ok"),{...base,worker:true,fetcher:async()=>Response.json(true)});
 assert((await wrapped(new Request("https://edge.invalid",{headers:{"x-report-worker-token":"a".repeat(64)}}),info)).status===200);
});
Deno.test("custom dispatch credential scoped to configured collector",async()=>{
 const wrapped=createGaasGuardHandler(()=>new Response("ok"),{...base,dispatchKey:"collector-secret"});
 assert((await wrapped(new Request("https://edge.invalid",{headers:{Authorization:"Bearer collector-secret"}}),info)).status===200);
});
Deno.test("scheduled dispatch checks the private server verifier",async()=>{
 const wrapped=createGaasGuardHandler(()=>new Response("ok"),{...base,dispatchVerifier:"gaas_verify_meta_dispatch",fetcher:async(input)=>Response.json(String(input).endsWith("/gaas_verify_meta_dispatch"))});
 assert((await wrapped(new Request("https://edge.invalid",{headers:{Authorization:"Bearer "+"a".repeat(64)}}),info)).status===200);
});
Deno.test("fake scheduled dispatch credential fails closed",async()=>{
 let called=false;
 const wrapped=createGaasGuardHandler(()=>{called=true;return new Response("bad");},{...base,dispatchVerifier:"gaas_verify_meta_dispatch",fetcher:async()=>Response.json(false)});
 assert((await wrapped(new Request("https://edge.invalid",{headers:{Authorization:"Bearer "+"0".repeat(64)}}),info)).status===403);assert(!called);
});
