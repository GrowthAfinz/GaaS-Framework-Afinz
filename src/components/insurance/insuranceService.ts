import { supabase } from "../../services/supabaseClient";
import { InsurancePacket, validatePacket } from "./insuranceCore";
export interface SnapshotRow {
  id: string;
  status: string;
  period_start: string;
  period_end: string;
  snapshot_hash: string;
  created_at: string;
  manifest?: InsurancePacket;
  artifacts?: {
    id: string;
    artifact_kind: string;
    storage_path: string;
    qa_status: string;
  }[];
}
async function rpc<T>(name: string, args = {}): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    const messages: Record<string, string> = {
      ACCESS_DENIED: "Sua conta não tem permissão para esta operação.",
      UNRESOLVED_SOURCE_ISSUE:
        "Registre a decisão e a evidência de cada revisão necessária.",
      SOURCE_ORIGINAL_NOT_STORED:
        "Guarde os arquivos originais antes de salvar a carga.",
      SNAPSHOT_VERSION_CONFLICT:
        "A versão mudou. Reabra os dados antes de continuar.",
      FORMULA_CACHE_MISSING:
        "Recalcule as fórmulas na planilha de origem e envie outra versão.",
      METRIC_NOT_ELIGIBLE:
        "Faltam cadastros ou contratações necessários para certificar este acompanhamento.",
      ARTIFACT_VERSION_CONFLICT:
        "Já existe um arquivo diferente para esta versão. Preserve o anterior e gere um novo snapshot.",
    };
    const key = Object.keys(messages).find((k) => error.message.includes(k));
    throw new Error(
      error.code === "PGRST202"
        ? "A estrutura de Seguros ainda não foi instalada neste ambiente."
        : key
          ? messages[key]
          : error.message,
    );
  }
  return data as T;
}
export const listInsuranceSnapshots = () =>
  rpc<SnapshotRow[]>("insurance_list_snapshots");
export const readInsuranceSnapshot = (id: string) =>
  rpc<SnapshotRow>("insurance_read_snapshot", { p_id: id });
export const readInsuranceNoteSnapshot = (id: string) =>
  rpc<SnapshotRow | null>("insurance_note_snapshot", { p_note_id: id });
export const bindInsuranceNote = (id: string) =>
  rpc<string>("insurance_bind_note", { p_note_id: id });
export async function insuranceNoteChoices() {
  const { data, error } = await supabase
    .from("gaas_vault_notes")
    .select("id,title,relative_path")
    .is("deleted_at", null)
    .order("title")
    .limit(1000);
  if (error) throw error;
  return data || [];
}
export async function saveInsuranceSnapshot(
  packet: InsurancePacket,
  files: File[],
) {
  validatePacket(packet);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ACCESS_DENIED");
  const staged = structuredClone(packet);
  const { sha256 } = await import("./insuranceParser");
  for (const source of staged.sources) {
    const file = files.find((f) => f.name === source.name);
    if (!file || (await sha256(await file.arrayBuffer())) !== source.sha256)
      throw new Error("SOURCE_HASH_MISMATCH");
    const path = `sources/${user.id}/${source.sha256}.xlsx`;
    const { error } = await supabase.storage
      .from("insurance-reports")
      .upload(path, file, {
        upsert: false,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    if (error && !/already exists|duplicate/i.test(error.message)) throw error;
    source.storage_path = path;
  }
  return rpc<{ id: string; reused: boolean }>("insurance_save_snapshot", {
    p_packet: staged,
  });
}
export async function restoreInsuranceSources(
  packet: InsurancePacket,
): Promise<File[]> {
  const { sha256 } = await import("./insuranceParser");
  return Promise.all(
    packet.sources.map(async (source) => {
      if (!source.storage_path)
        throw new Error(
          "Selecione os arquivos originais para esta versão local.",
        );
      const { data, error } = await supabase.storage
        .from("insurance-reports")
        .download(source.storage_path);
      if (error) throw error;
      if ((await sha256(await data.arrayBuffer())) !== source.sha256)
        throw new Error("SOURCE_HASH_MISMATCH");
      return new File([data], source.name, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    }),
  );
}
export const certifyInsuranceSnapshot = (
  snapshot: SnapshotRow,
  resolutions: Record<string, string>,
) =>
  rpc("insurance_certify_snapshot", {
    p_id: snapshot.id,
    p_hash: snapshot.snapshot_hash,
    p_resolutions: resolutions,
  });
export const rejectInsuranceSnapshot = (
  snapshot: SnapshotRow,
  reason: string,
) =>
  rpc("insurance_reject_snapshot", {
    p_id: snapshot.id,
    p_hash: snapshot.snapshot_hash,
    p_reason: reason,
  });
export async function insuranceRole() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "none";
  const { data, error } = await supabase
    .from("report_live_memberships")
    .select("role,active")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data?.active ? (data.role as string) : "none";
}
export async function prepareInsuranceNote(
  packet: InsurancePacket,
  snapshotId?: string,
) {
  const { data, error } = await supabase
    .from("gaas_vault_notes")
    .select("id,relative_path,content_hash,content_markdown")
    .eq("relative_path", "10-Resultados/Mecanicas/Seguros.md")
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  const lines = [
    "",
    `## Acompanhamento de Seguros — ${packet.periodStart} a ${packet.periodEnd}`,
    "",
    `Fonte: snapshot ${snapshotId || "local em revisão"}. Valores associados às fontes; não comprovam incrementalidade.`,
    "",
    "| Produto | Indicador | Valor |",
    "|---|---|---|",
  ];
  for (const m of packet.metrics.filter(
    (m) =>
      m.period === "window_total" &&
      [
        "contracts_digital",
        "registrations_digital",
        "cost_per_contract",
      ].includes(m.code),
  ))
    lines.push(
      `| ${m.product} | ${m.code} | ${m.value === null ? "—" : m.value.toLocaleString("pt-BR")} |`,
    );
  lines.push(
    "",
    "Limites de leitura:",
    ...packet.issues.map((i) => `- ${i.message}`),
  );
  const markdown = data.content_markdown + "\n" + lines.join("\n");
  const { sha256 } = await import("./insuranceParser");
  return {
    schema: "gaas-knowledge-contribution/1",
    status: "draft",
    snapshot_id: snapshotId || null,
    changes: [
      {
        path: data.relative_path,
        base_hash: data.content_hash,
        expected_hash: await sha256(new TextEncoder().encode(markdown)),
        markdown,
      },
    ],
    rationale:
      "Atualização do acompanhamento de Seguros; requer pacote de contexto e revisão pelo fluxo vigente.",
  };
}
export async function submitInsuranceNote(snapshot: SnapshotRow) {
  if (snapshot.status !== "certified" || !snapshot.manifest)
    throw new Error("SNAPSHOT_NOT_CERTIFIED");
  const [
    { fetchKnowledgeSnapshot, registerKnowledgePack, submitContribution },
    { buildKnowledgeArchive },
  ] = await Promise.all([
    import("../vault/knowledge/knowledgeService"),
    import("../vault/knowledge/knowledgePack"),
  ]);
  const baseline = await fetchKnowledgeSnapshot();
  const proposal = await prepareInsuranceNote(snapshot.manifest, snapshot.id);
  const note = baseline.notes.find(
    (n) => n.relative_path === proposal.changes[0].path,
  );
  if (!note || note.content_hash !== proposal.changes[0].base_hash)
    throw new Error("NOTE_BASE_HASH_CONFLICT");
  const { manifest, archive } = await buildKnowledgeArchive(
    baseline,
    `Acompanhamento de Seguros — snapshot ${snapshot.id}`,
  );
  await registerKnowledgePack(manifest, archive);
  const contributionId = await submitContribution(
    manifest.id,
    "Atualizar acompanhamento de Seguros",
    proposal.rationale,
    proposal.changes,
  );
  return { contributionId, packId: manifest.id };
}
export async function archiveInsurancePackage(
  snapshot: SnapshotRow,
  blob: Blob,
) {
  const { default: JSZip } = await import("jszip");
  const { sha256 } = await import("./insuranceParser");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ACCESS_DENIED");
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  for (const [name, entry] of Object.entries(zip.files)) {
    const kind = name.endsWith(".xlsx")
      ? "xlsx"
      : name.endsWith(".pptx")
        ? "pptx"
        : name === "manifest.json"
          ? "manifest"
          : null;
    if (entry.dir || !kind) continue;
    const bytes = await entry.async("uint8array"),
      hash = await sha256(bytes),
      path = `artifacts/${user.id}/${hash}.${kind === "manifest" ? "json" : kind}`;
    const contentType =
      kind === "xlsx"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : kind === "pptx"
          ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
          : "application/json";
    const { error } = await supabase.storage
      .from("insurance-reports")
      .upload(path, bytes, { upsert: false, contentType });
    if (error && !/already exists|duplicate/i.test(error.message)) throw error;
    await rpc("insurance_register_artifact", {
      p_id: snapshot.id,
      p_path: path,
      p_hash: hash,
      p_kind: kind,
      p_template: name,
    });
  }
}
export async function insuranceArtifactUrl(path: string) {
  const { data, error } = await supabase.storage
    .from("insurance-reports")
    .createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}
