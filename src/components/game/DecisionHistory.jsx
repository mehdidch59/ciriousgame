import { useState } from "react";
import { eventCategory } from "../../game/presentation.mjs";
export default function DecisionHistory({ state, initialCount = 50 }) {
  const [count, setCount] = useState(initialCount);
  const decisions =
    state.decisions ||
    (state.events || []).filter((e) => eventCategory(e.text) !== "Rapport");
  return (
    <section className="decision-history" aria-label="Registre des décisions">
      <p className="history-coverage">
        {state.decisionHistoryComplete
          ? "Décisions et échéances conservées depuis le début de cette mission."
          : "Ancienne sauvegarde : les décisions encore disponibles ont été récupérées; les plus anciennes peuvent manquer."}
      </p>
      <p>
        {Math.min(count, decisions.length)} sur {decisions.length} entrées · de
        la plus récente à la plus ancienne.
      </p>
      <ol className="mission-log">
        {decisions.slice(0, count).map((entry, i) => (
          <li
            key={`${entry.day}-${i}`}
            className={`event-${eventCategory(entry.text).toLowerCase()}`}
          >
            <time>Jour {String(entry.day).padStart(3, "0")}</time>
            <span className="event-category">{eventCategory(entry.text)}</span>
            <p>{entry.text}</p>
          </li>
        ))}
      </ol>
      {!decisions.length && <p>Aucune décision enregistrée.</p>}
      {count < decisions.length && (
        <button
          className="button subtle"
          onClick={() => setCount((n) => n + 50)}
        >
          Afficher les décisions plus anciennes
        </button>
      )}
    </section>
  );
}
