import { useEffect, useRef, useState } from "react";
import { actionFeedback } from "../game/presentation.mjs";
export default function useMissionFeedback(state) {
  const previous = useRef(state);
  const [feedback, setFeedback] = useState(null);
  const [newFoyers, setNewFoyers] = useState([]);
  useEffect(() => {
    const old = previous.current;
    previous.current = state;
    if ((state.missionRevision || 0) !== (old.missionRevision || 0)) {
      queueMicrotask(() => {
        setFeedback(
          state.imported
            ? {
                kind: "import",
                status: state.status,
                key: `import-${state.missionRevision}`,
              }
            : null,
        );
        setNewFoyers([]);
      });
      return;
    }
    const next = actionFeedback(old, state);
    const foyers =
      state.globalStats.day > old.globalStats.day
        ? state.countries
            .filter(
              (c) =>
                c.infected > 0 &&
                old.countries.some((p) => p.id === c.id && !p.infected),
            )
            .map((c) => c.id)
        : [];
    queueMicrotask(() => {
      if (
        state.status === "READY" ||
        state.globalStats.day < old.globalStats.day
      ) {
        setFeedback(null);
        setNewFoyers([]);
        return;
      }
      if (next)
        setFeedback({
          ...next,
          key: `${state.globalStats.day}-${state.globalStats.points}-${next.kind}`,
        });
      if (foyers.length) setNewFoyers(foyers);
    });
  }, [state]);
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 7000);
    return () => clearTimeout(timer);
  }, [feedback]);
  useEffect(() => {
    if (!newFoyers.length) return;
    const timer = setTimeout(() => setNewFoyers([]), 9000);
    return () => clearTimeout(timer);
  }, [newFoyers]);
  return { feedback, newFoyers, dismiss: () => setFeedback(null) };
}
