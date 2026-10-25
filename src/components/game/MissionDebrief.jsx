import { missionDebrief, missionMilestones } from "../../game/presentation.mjs";
import { formatNumber } from "../../game/format.mjs";
import DecisionHistory from "./DecisionHistory";
import { scenarioObjective } from "../../game/scenarios.mjs";
export default function MissionDebrief({ state }) {
  const summary = missionDebrief(state),
    s = state.globalStats,
    history = state.history || [],
    maximum = Math.max(1, summary.peak.infected);
  return (
    <section className="mission-debrief" aria-label="Bilan de mission">
      <p className="debrief-reason">{summary.reason}</p>
      <p>{scenarioObjective(state).label} · {scenarioObjective(state).done ? "Atteint au bilan" : "Non atteint au bilan"}.</p>
      <dl className="result-stats">
        <div>
          <dt>Durée</dt>
          <dd>{s.day} jours</dd>
        </div>
        <div>
          <dt>Cas encore actifs</dt>
          <dd>{formatNumber(s.totalInfected)}</dd>
        </div>
        <div>
          <dt>Pays avec un foyer actif</dt>
          <dd>{summary.affected}</dd>
        </div>
        <div>
          <dt>Décès</dt>
          <dd>{formatNumber(s.totalDead)}</dd>
        </div>
        <div>
          <dt>Confiance</dt>
          <dd>{Math.floor(s.trust)} %</dd>
        </div>
      </dl>
      <h3>Évolution des cas</h3>
      <p className="debrief-period">
        Historique disponible : jours {summary.firstDay} à {s.day}.
      </p>
      {history.length > 1 ? (
        <svg
          className="debrief-chart"
          viewBox="0 0 400 110"
          role="img"
          aria-label={`Évolution des cas actifs entre les jours ${summary.firstDay} et ${s.day}. Maximum observé : ${formatNumber(summary.peak.infected)} au jour ${summary.peak.day}.`}
        >
          <path d="M0 100H400" stroke="currentColor" opacity=".3" />
          <polyline
            fill="none"
            stroke="var(--infection)"
            strokeWidth="2"
            points={history
              .map(
                (h, i) =>
                  `${(i / (history.length - 1)) * 400},${100 - (h.infected / maximum) * 90}`,
              )
              .join(" ")}
          />
        </svg>
      ) : (
        <p>Pas assez de jours enregistrés pour tracer une courbe.</p>
      )}
      <p>
        Maximum observé : <strong>{formatNumber(summary.peak.infected)}</strong>{" "}
        cas au jour {summary.peak.day}.
      </p>
      <h3>État des jalons</h3>
      <ul className="debrief-milestones">
        {missionMilestones(state).map((m) => (
          <li key={m.label} className={m.done ? "achieved" : ""}>
            <span aria-hidden="true">{m.done ? "✓" : "—"}</span>
            {m.label}
            <small>{m.done ? "Atteint" : "Non atteint"}</small>
          </li>
        ))}
      </ul>
      <details>
        <summary>Historique des décisions</summary>
        <DecisionHistory state={state} initialCount={8} />
      </details>
    </section>
  );
}
