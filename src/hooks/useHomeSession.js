import { useEffect, useState } from "react";
import { observeSession } from "../auth/session.mjs";
export default function useHomeSession() {
  const [session, setSession] = useState({ status: "loading" });
  const [resumable, setResumable] = useState(false);
  const [finished, setFinished] = useState(false);
  const [metadataReady, setMetadataReady] = useState(false);
  useEffect(
    () =>
      observeSession(async () => {
        const [{ auth }, { onAuthStateChanged }] = await Promise.all([
          import("../firebase"),
          import("firebase/auth"),
        ]);
        return { auth, onAuthStateChanged };
      }, setSession),
    [],
  );
  useEffect(() => {
    let active = true;
    Promise.all([import("../game/storage.mjs"), import("../data/pays.json")])
      .then(([{ restoreGame, SAVE_KEY }, data]) => {
        try {
          const game = restoreGame(
            localStorage.getItem(SAVE_KEY),
            data.default,
          );
          if (active) {
            setResumable(["RUNNING", "PAUSED"].includes(game.status));
            setFinished(["VICTORY", "DEFEAT"].includes(game.status));
          }
        } catch {
          /* Unavailable storage means a new mission. */
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setMetadataReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return { session, resumable, finished, metadataReady };
}
