import {
  Check,
  ChevronRight,
  Crosshair,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
export default function MissionObjectives({ state, onResearch, onRegion }) {
  const s = state.globalStats,
    ready = state.status === "READY",
    researchStarted = state.unlockedReforms.includes("vaccine_research");
  const threat = state.countries.reduce(
    (best, c) => (c.infected > (best?.infected || 0) ? c : best),
    null,
  );
  const steps = [
    { title: "Identifier le foyer", done: !ready, icon: Crosshair },
    {
      title: "Financer la recherche",
      done: researchStarted,
      icon: FlaskConical,
    },
    {
      title: "Éliminer les cas actifs",
      done: state.status === "VICTORY",
      icon: ShieldCheck,
    },
  ];
  const message = ready
    ? "Choisissez un pays et lancez la mission dans le panneau Opérations."
    : !researchStarted
      ? "Lancez le programme vaccinal. La recherche demande du temps : investissez tôt."
      : s.research < 100
        ? `Recherche en cours : ${Math.floor(s.research)} %. Protégez les foyers en attendant le vaccin.`
        : !state.unlockedReforms.includes("vaccine_deploy")
          ? "Vaccin validé. Financez la distribution mondiale pour accélérer la réponse."
          : "Distribution active. Contenez les derniers foyers pour terminer la mission.";
  return (
    <section className="mission-objectives" aria-label="Objectifs de mission">
      <ol>
        {steps.map(({ title, done, icon: Icon }, i) => (
          <li key={title} className={done ? "complete" : ""}>
            <span className="objective-icon">
              {done ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <Icon size={15} aria-hidden="true" />
              )}
            </span>
            <span>
              <small>OBJECTIF {i + 1}</small>
              <strong>{title}</strong>
            </span>
          </li>
        ))}
      </ol>
      <div className="mission-advice">
        <p>{message}</p>
        {!ready && !researchStarted && (
          <button className="advice-action" onClick={onResearch}>
            Ouvrir la recherche
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        )}
        {!ready && researchStarted && threat && (
          <button className="advice-action" onClick={() => onRegion(threat.id)}>
            Priorité : {threat.name}
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
