// Isolated build validation endpoint. It cannot reach a Google mutation route.
import { handleReportRequest } from "../report-sync/index.ts";
Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return new Response("Build candidate: POST only", { status: 405 });
  try {
    const body = await request.clone().json();
    if (!["build", "worker", "publish", "publication_worker", "rollback", "export_pdf", "inspect_publication", "inspect_recovery", "inspect_generation"].includes(body?.mode)) return Response.json({ error: "Candidate supports controlled Report Live build and generation publication only." }, { status: 400 });
    if (body.skip_llm === false) return Response.json({ error: "Candidate requires deterministic narrative." }, { status: 400 });
  } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  return handleReportRequest(request);
});
