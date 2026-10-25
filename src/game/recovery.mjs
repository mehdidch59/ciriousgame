import { importMission, exportMission } from "./transfer.mjs";
export const RECOVERY_KEY = "cirious.before-import.v1";
export function preserveBeforeImport(storage, state, raw, countries) {
  const next = importMission(raw, countries);
  storage.setItem(RECOVERY_KEY, exportMission(state));
  return next;
}
