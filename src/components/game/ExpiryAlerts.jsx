import { useState } from "react";
import { X, TriangleAlert } from "lucide-react";
export default function ExpiryAlerts({ state, onSelect, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  const alerts = (state.expiryAlerts || []).filter((item) => {
    const c = state.countries.find((c) => c.id === item.countryId);
    return (
      c?.infected > 0 &&
      c[item.kind === "team" ? "teamUntil" : "quarantineUntil"] <=
        state.globalStats.day
    );
  });
  if (!alerts.length) return null;
  const shown = expanded ? alerts : alerts.slice(0, 3);
  return (
    <section
      className="expiry-alerts"
      aria-label="Interventions arrivées à échéance"
    >
      <div className="expiry-heading">
        <p role="status">
          <TriangleAlert size={18} aria-hidden="true" />
          {alerts.length}{" "}
          {alerts.length === 1
            ? "intervention terminée"
            : "interventions terminées"}{" "}
          dans des pays encore touchés.
        </p>
        <button
          className="icon-button"
          aria-label="Masquer les alertes d’échéance"
          onClick={onDismiss}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      {alerts.some((a) => a.autoPaused) && (
        <p className="expiry-pause">
          Une pause automatique a été déclenchée au jour{" "}
          {Math.max(...alerts.filter((a) => a.autoPaused).map((a) => a.day))}.
          {state.status === "PAUSED"
            ? " Reprenez quand vos décisions sont prêtes."
            : ""}
        </p>
      )}
      <ul>
        {shown.map((item) => {
          const c = state.countries.find((c) => c.id === item.countryId);
          return (
            <li key={`${item.countryId}-${item.kind}`}>
              <button onClick={() => onSelect(c.id)}>
                <strong>{c.name}</strong>
                <span>
                  {item.kind === "team" ? "Équipe médicale" : "Quarantaine"} ·
                  fin au jour {item.day}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {alerts.length > 3 && (
        <button
          className="button subtle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded
            ? "Réduire la liste"
            : `Voir les ${alerts.length} échéances`}
        </button>
      )}
    </section>
  );
}
