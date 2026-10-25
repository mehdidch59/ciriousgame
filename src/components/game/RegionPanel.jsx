import { Check, HeartPulse, LockKeyhole, Play } from "lucide-react";
import { DIFFICULTY_LEVELS } from "../../game/engine.mjs";
import { formatNumber } from "../../game/format.mjs";
import { researchDaysRemaining } from "../../game/interface.mjs";
import { regionalRisk } from "../../game/presentation.mjs";
import RegionalTrend from "./RegionalTrend";
import { useState } from "react";
import { SCENARIOS, scenarioObjective } from "../../game/scenarios.mjs";
export default function RegionPanel({
  state,
  selected,
  actions,
  difficulty,
  setDifficulty,
  onResearch,
  onGuide,
}) {
  const [scenarioId, setScenarioId] = useState("containment");
  const scenario = SCENARIOS[scenarioId];
  const s = state.globalStats,
    ready = state.status === "READY",
    available = ["RUNNING", "PAUSED"].includes(state.status);
  const income = Math.max(
    1,
    Math.floor(
      DIFFICULTY_LEVELS[ready ? difficulty : state.difficulty].income *
        state.modifiers.pointGeneration *
        (s.trust > 30 ? 1 : 0.6),
    ),
  );
  const researchDays = researchDaysRemaining(
    s.research,
    state.modifiers.researchRate,
  );
  const risk = regionalRisk(selected);
  return (
    <div className={`region-content ${ready ? "region-ready" : ""}`}>
      <header className="region-heading">
        <h2>{selected.name}</h2>
        <span>{selected.id}</span>
      </header>
      {!ready && (
        <p className="scenario-status">{SCENARIOS[state.scenario || "containment"].name} · {scenarioObjective(state).label}. {scenarioObjective(state).done ? "Atteint à ce jour." : "En cours."} La victoire exige toujours d’éliminer tous les cas.</p>
      )}
      {!ready && (
        <section
          className={`regional-risk risk-${risk.level}`}
          aria-label="Situation du pays"
        >
          <strong>{risk.label}</strong>
          <p>{risk.detail}</p>
          <span>{formatNumber(selected.infected)} cas actifs</span>
        </section>
      )}
      {ready && (
        <p className="region-population">
          Population <strong>{formatNumber(selected.population)}</strong>
        </p>
      )}

      {ready ? (
        <section className="mission-setup">
          <h3>Nouvelle mission</h3>
          <label className="scenario-choice">Situation initiale
            <select value={scenarioId} onChange={event => setScenarioId(event.target.value)}>
              {Object.entries(SCENARIOS).map(([id, item]) => <option key={id} value={id}>{item.name}</option>)}
            </select>
          </label>
          <p>{scenario.description}</p>
          {onGuide && (
            <button className="button subtle" onClick={onGuide}>
              Découvrir les commandes · guide facultatif
            </button>
          )}
          <fieldset className="difficulty-choice">
            <legend>Difficulté</legend>
            {Object.entries(DIFFICULTY_LEVELS).map(([id, level]) => (
              <label key={id}>
                <input
                  type="radio"
                  name="difficulty"
                  value={id}
                  checked={difficulty === id}
                  onChange={() => setDifficulty(id)}
                />
                <span>{id === "HARD" ? "Crise" : level.name}</span>
              </label>
            ))}
          </fieldset>
          <p>
            {DIFFICULTY_LEVELS[difficulty].description} Vous disposez de {scenario.points} PC
            et gagnez {income} PC par jour.
          </p>
          <p>
            Le foyer principal sera détecté en <strong>{selected.name}</strong>.
            Éliminez tous les cas actifs avant le jour 365.
          </p>
          <button
            className="button primary launch-mission"
            onClick={() => actions.startGame(selected.id, difficulty, scenarioId)}
          >
            <Play size={17} aria-hidden="true" />
            Lancer la mission
          </button>
        </section>
      ) : (
        <section className="local-response">
          <h3>Réponse locale</h3>
          <details className="intervention-comparison">
            <summary>Comparer les interventions</summary>
            <p>Les effets se cumulent. Les soins et décès sont calculés chaque jour : aucun nombre de cas évités n’est garanti.</p>
            <dl>
              <dt>Équipe médicale · 30 PC · 10 jours</dt>
              <dd>Soins : +13 points de pourcentage des cas actifs par jour. Mortalité locale divisée par deux. Confiance inchangée.</dd>
              <dt>Quarantaine · 20 PC · 14 jours</dt>
              <dd>Transmission locale −70 %. Coût immédiat : −3 de confiance. Ne bloque pas à elle seule les foyers internationaux.</dd>
            </dl>
            <p>Actuellement : {selected.teamUntil > s.day ? `équipe jusqu’au jour ${selected.teamUntil}` : "aucune équipe"} ; {selected.quarantineUntil > s.day ? `quarantaine jusqu’au jour ${selected.quarantineUntil}` : "aucune quarantaine"}.</p>
          </details>
          {[
            [
              "team",
              "Équipe médicale",
              "Soins renforcés pendant 10 jours",
              30,
              selected.teamUntil,
              HeartPulse,
            ],
            [
              "quarantine",
              "Quarantaine ciblée",
              "Transmission −70 % pendant 14 jours. Confiance −3.",
              20,
              selected.quarantineUntil,
              LockKeyhole,
            ],
          ].map(([kind, name, description, cost, until, Icon]) => {
            const active = until > s.day,
              reason = !available
                ? "Mission terminée"
                : !selected.infected
                  ? "Aucun cas actif"
                  : s.points < cost
                    ? `Il manque ${cost - s.points} PC`
                    : null;
            return (
              <div className="local-order" key={kind}>
                <div className="order-heading">
                  <Icon size={21} aria-hidden="true" />
                  <h4>{name}</h4>
                </div>
                <p>{description}</p>
                <button
                  className="button order-button"
                  disabled={
                    !available ||
                    active ||
                    !selected.infected ||
                    s.points < cost
                  }
                  onClick={() => actions.intervene(selected.id, kind)}
                >
                  {active ? (
                    <>
                      <Check size={16} aria-hidden="true" />
                      Actif · {until - s.day} j restants
                    </>
                  ) : (
                    reason || (
                      <>
                        <span>Déployer</span>
                        <strong>{cost} PC</strong>
                      </>
                    )
                  )}
                </button>
              </div>
            );
          })}
          <p className="regional-note">
            Budget quotidien : +{income} PC.
            {s.trust <= 30 ? " Le financement baisse avec la confiance." : ""}
          </p>
        </section>
      )}
      {!ready && <RegionalTrend country={selected} day={s.day} />}
      <section className="vaccine-status">
        <div>
          <button onClick={onResearch}>Recherche vaccinale</button>
          <strong>{Math.floor(s.research)} %</strong>
        </div>
        <progress
          aria-label="Recherche vaccinale"
          value={s.research}
          max="100"
        />
        <p>
          {s.research === 100
            ? "Vaccin validé."
            : state.unlockedReforms.includes("vaccine_research")
              ? "Développement en cours."
              : "Programme à financer."}
        </p>
        {researchDays > 0 && (
          <p>Estimation : {researchDays} jours au rythme actuel.</p>
        )}
      </section>
      <details className="regional-details">
        <summary>Détails du pays</summary>
        <dl className="region-stats">
          <div>
            <dt>Population</dt>
            <dd>{formatNumber(selected.population)}</dd>
          </div>
          <div>
            <dt>Cas actifs</dt>
            <dd className={selected.infected ? "infection" : ""}>
              {formatNumber(selected.infected)}
            </dd>
          </div>
          <div>
            <dt>Immunisés</dt>
            <dd>{formatNumber(selected.immune)}</dd>
          </div>
          <div>
            <dt>Décès</dt>
            <dd>{formatNumber(selected.dead)}</dd>
          </div>
        </dl>
      </details>
    </div>
  );
}
