import { regionalTrend } from "../../game/learning.mjs";
import { formatNumber } from "../../game/format.mjs";
export default function RegionalTrend({ country, day }) {
  const trend = regionalTrend(country),
    observation = country.lastDay;
  if (!trend || !observation || observation.day !== day)
    return (
      <p className="trend-empty">
        Les tendances apparaîtront après le prochain jour simulé.
      </p>
    );
  const max = Math.max(1, ...trend.history.map((h) => h.infected));
  return (
    <section className="regional-trend" aria-label="Évolution observée du pays">
      <div>
        <h3>Évolution observée</h3>
        <strong className={trend.delta > 0 ? "infection" : ""}>
          {trend.delta > 0 ? "+" : ""}
          {formatNumber(trend.delta)} cas actifs
        </strong>
        <p>
          Sur {trend.days} {trend.days === 1 ? "jour" : "jours"} · jours{" "}
          {trend.fromDay} à {trend.toDay}
        </p>
      </div>
      <svg
        viewBox="0 0 300 60"
        role="img"
        aria-label={`Cas actifs : ${formatNumber(trend.history[0].infected)} au jour ${trend.fromDay}, ${formatNumber(trend.history.at(-1).infected)} au jour ${trend.toDay}.`}
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={trend.history
            .map(
              (h) =>
                `${((h.day - trend.fromDay) / trend.days) * 300},${55 - (h.infected / max) * 50}`,
            )
            .join(" ")}
        />
      </svg>
      <details>
        <summary>Comprendre le dernier jour</summary>
        <p>
          Jour {observation.day - 1} → {observation.day}
        </p>
        <dl>
          <div>
            <dt>Nouvelles contaminations</dt>
            <dd>{formatNumber(observation.newCases)}</dd>
          </div>
          <div>
            <dt>Guérisons</dt>
            <dd>{formatNumber(observation.recovered)}</dd>
          </div>
          <div>
            <dt>Décès</dt>
            <dd>{formatNumber(observation.deaths)}</dd>
          </div>
          <div>
            <dt>Vaccinations</dt>
            <dd>{formatNumber(observation.vaccinated)}</dd>
          </div>
        </dl>
        <p>
          Mesures actives pendant ce jour :{" "}
          {[
            observation.team ? "équipe médicale" : null,
            observation.quarantine ? "quarantaine" : null,
          ]
            .filter(Boolean)
            .join(", ") || "aucune intervention locale"}
          .
        </p>
        <p>
          Une variation de cas ne permet pas d’isoler l’effet d’une mesure. Les
          guérisons et les décès font tous deux baisser les cas actifs.
        </p>
      </details>
    </section>
  );
}
