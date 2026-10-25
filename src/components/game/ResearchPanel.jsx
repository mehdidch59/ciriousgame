import {
  Check,
  LockKeyhole,
  FlaskConical,
  Shield,
  HeartPulse,
  Truck,
  Coins,
} from "lucide-react";
import { REFORMS } from "../../game/engine.mjs";
import { VACCINE_PATH } from "../../game/presentation.mjs";
import { researchDaysRemaining } from "../../game/interface.mjs";
const icons = {
  Prévention: Shield,
  Soins: HeartPulse,
  Recherche: FlaskConical,
  Logistique: Truck,
  Économie: Coins,
};
export default function ResearchPanel({ state, actions }) {
  const available = ["RUNNING", "PAUSED"].includes(state.status);
  const days = researchDaysRemaining(
    state.globalStats.research,
    state.modifiers.researchRate,
  );
  function protocol(id, index, path) {
    const r = REFORMS[id],
      owned = state.unlockedReforms.includes(id),
      locked = r.requires && !state.unlockedReforms.includes(r.requires),
      affordable = state.globalStats.points >= r.cost,
      Icon = icons[r.category];
    const reason = owned
      ? id === "vaccine_deploy" && state.globalStats.research < 100
        ? "Financé · en attente du vaccin à 100 %"
        : "Protocole actif"
      : locked
        ? `Requis : ${REFORMS[r.requires].name}`
        : !available
          ? "Lancez une mission pour financer ce protocole."
          : !affordable
            ? `Il manque ${r.cost - state.globalStats.points} PC`
            : null;
    return (
      <li
        key={id}
        className={`${owned ? "protocol-owned" : ""} ${locked ? "protocol-locked" : ""}`}
      >
        <div className="protocol-node">
          {owned ? (
            <Check size={17} aria-hidden="true" />
          ) : path ? (
            <span>{index + 1}</span>
          ) : (
            <Icon size={17} aria-hidden="true" />
          )}
        </div>
        <div className="protocol-body">
          <h3>{r.name}</h3>
          <p>{r.description}</p>
          {reason && (
            <p className="protocol-reason">
              {locked && <LockKeyhole size={12} aria-hidden="true" />}
              {reason}
            </p>
          )}
          <button
            className="button protocol-purchase"
            disabled={owned || locked || !available || !affordable}
            onClick={() => actions.purchaseReform(id)}
          >
            {owned ? (
              "Financé"
            ) : (
              <>
                <span>Financer</span>
                <strong>{r.cost} PC</strong>
              </>
            )}
          </button>
        </div>
      </li>
    );
  }
  return (
    <div className="research-content">
      <header className="drawer-heading">
        <FlaskConical size={22} aria-hidden="true" />
        <h2>Recherche & réponse</h2>
      </header>
      <p className="drawer-intro">
        Les protocoles restent actifs jusqu’à la fin de la mission.
      </p>
      <section className="vaccine-path" aria-labelledby="vaccine-path-title">
        <h3 id="vaccine-path-title">Vers le vaccin</h3>
        <div className="research-meter">
          <strong>{Math.floor(state.globalStats.research)} %</strong>
          <progress
            value={state.globalStats.research}
            max="100"
            aria-label="Recherche du vaccin"
          />
          <p>
            {days === 0
              ? "Vaccin validé."
              : days
                ? `${days} jours estimés au rythme actuel.`
                : "Financez le programme pour commencer."}
          </p>
        </div>
        <ol className="protocol-tree vaccine-chain">
          {VACCINE_PATH.map((id, index) => protocol(id, index, true))}
        </ol>
      </section>
      <section
        className="response-protocols"
        aria-labelledby="response-protocols-title"
      >
        <h3 id="response-protocols-title">Contenir & soutenir</h3>
        <p>
          Ces mesures indépendantes peuvent être financées dans l’ordre de votre
          choix.
        </p>
        <ul className="protocol-tree">
          {Object.keys(REFORMS)
            .filter((id) => !VACCINE_PATH.includes(id))
            .map((id, index) => protocol(id, index, false))}
        </ul>
      </section>
    </div>
  );
}
