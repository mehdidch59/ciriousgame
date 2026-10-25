import { useEffect, useState } from "react";
import {
  readPreferences,
  serializePreferences,
  UI_PREFERENCES_KEY,
} from "../game/interface.mjs";
function initialize() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    return readPreferences(localStorage.getItem(UI_PREFERENCES_KEY), reduce);
  } catch {
    return readPreferences(null, reduce);
  }
}
export default function useInterfacePreferences() {
  const [preferences, setPreferences] = useState(initialize),
    [saveStatus, setSaveStatus] = useState("pending");
  useEffect(() => {
    let status = "saved";
    try {
      localStorage.setItem(
        UI_PREFERENCES_KEY,
        serializePreferences(preferences),
      );
    } catch {
      status = "unavailable";
    }
    let active = true;
    queueMicrotask(() => {
      if (active) setSaveStatus(status);
    });
    return () => {
      active = false;
    };
  }, [preferences]);
  return {
    preferences,
    setTextScale: (value) =>
      setPreferences((previous) => ({ ...previous, textScale: value })),
    setReducedMotion: (value) =>
      setPreferences((previous) => ({ ...previous, reducedMotion: value })),
    setPauseOnExpiry: (value) =>
      setPreferences((previous) => ({ ...previous, pauseOnExpiry: value })),
    saveStatus,
  };
}
