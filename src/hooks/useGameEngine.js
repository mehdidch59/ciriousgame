import { useReducer, useEffect, useMemo, useState } from "react";
import countries from "../data/pays.json";
import { createGame } from "../game/engine.mjs";
import { missionReducer, importMission } from "../game/transfer.mjs";
import { restoreGame, serializeGame, SAVE_KEY } from "../game/storage.mjs";
import { preserveBeforeImport, RECOVERY_KEY } from "../game/recovery.mjs";
function initialize() {
  try {
    return restoreGame(localStorage.getItem(SAVE_KEY), countries);
  } catch {
    return createGame(countries);
  }
}
export const useGameEngine = ({ pauseOnExpiry = false } = {}) => {
  const [state, dispatch] = useReducer(
    (s, a) => missionReducer(s, a, countries),
    undefined,
    initialize,
  );
  const [saveStatus, setSaveStatus] = useState("pending");
  useEffect(() => {
    let result = "saved";
    try {
      localStorage.setItem(SAVE_KEY, serializeGame(state));
    } catch {
      result = "unavailable";
    }
    let active = true;
    queueMicrotask(() => {
      if (active) setSaveStatus(result);
    });
    return () => {
      active = false;
    };
  }, [state]);
  useEffect(() => {
    if (state.status !== "RUNNING") return;
    const timer = setInterval(
      () => dispatch({ type: "TICK", pauseOnExpiry }),
      1000 / state.speed,
    );
    return () => clearInterval(timer);
  }, [state.status, state.speed, pauseOnExpiry]);
  useEffect(() => {
    function pauseWhenHidden() {
      if (document.hidden) dispatch({ type: "PAUSE_IF_RUNNING" });
    }
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () =>
      document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);
  const actions = useMemo(
    () => ({
      startGame: (countryId, difficulty, scenario) =>
        dispatch({ type: "START", countryId, difficulty, scenario }),
      purchaseReform: (id) => dispatch({ type: "PURCHASE", id }),
      togglePause: () => dispatch({ type: "PAUSE" }),
      setSpeed: (speed) => dispatch({ type: "SPEED", speed }),
      intervene: (countryId, kind) =>
        dispatch({ type: "LOCAL", countryId, kind }),
      restart: () => dispatch({ type: "RESET" }),
      pause: () => dispatch({ type: "PAUSE_IF_RUNNING" }),
      dismissExpiryAlerts: () => dispatch({ type: "ACK_EXPIRY_ALERTS" }),
      importSave: (raw) => {
        const next = preserveBeforeImport(localStorage, state, raw, countries);
        dispatch({ type: "IMPORT", raw });
        return next;
      },
      recoverySave: () => {
        const raw = localStorage.getItem(RECOVERY_KEY);
        if (!raw) throw Error("no-recovery");
        importMission(raw, countries);
        return raw;
      },
    }),
    [state],
  );
  return { state, actions, saveStatus };
};
