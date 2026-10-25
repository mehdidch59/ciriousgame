import { restoreGame, serializeGame } from "./storage.mjs";
import { createGame, gameReducer } from "./engine.mjs";
export const MAX_SAVE_BYTES = 2 * 1024 * 1024;
export function importMission(raw, countries) {
  if (
    typeof raw !== "string" ||
    new TextEncoder().encode(raw).byteLength > MAX_SAVE_BYTES
  )
    throw Error("save-too-large");
  return restoreGame(raw, countries, { strict: true });
}
export function exportMission(state) {
  const raw = serializeGame(state);
  if (new TextEncoder().encode(raw).byteLength > MAX_SAVE_BYTES)
    throw Error("save-too-large");
  return raw;
}
export function missionReducer(state, action, countries) {
  if (action.type === "RESET")
    return {
      ...createGame(countries),
      missionRevision: (state.missionRevision || 0) + 1,
    };
  if (action.type === "IMPORT")
    return {
      ...importMission(action.raw, countries),
      imported: true,
      missionRevision: (state.missionRevision || 0) + 1,
    };
  return gameReducer(state, action);
}
