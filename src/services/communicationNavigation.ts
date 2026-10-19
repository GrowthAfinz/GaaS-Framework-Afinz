import { activityIdentity } from "../utils/activityPerformance";
import { useAppStore } from "../store/useAppStore";
import type { FrameworkActivity } from "../utils/communicationOrchestrator";

export function openActivityRegistration(rows: FrameworkActivity[]) {
  const row = rows[0];
  if (!row) return;
  const same = rows.filter(
    (r) => activityIdentity(r) === activityIdentity(row),
  );
  useAppStore
    .getState()
    .setCommunicationLinkTarget({
      journey: row.jornada,
      activity: row["Activity name / Taxonomia"],
      channel: row.Canal,
      ids: same.filter((r) => !r.template_id).map((r) => r.id),
    });
  useAppStore.getState().setTab("comunicacoes-cadastro");
}
