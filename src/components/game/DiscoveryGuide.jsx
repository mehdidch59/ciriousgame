import { ChevronRight, X, Check } from "lucide-react";
import { guideStep } from "../../game/learning.mjs";
const steps = {
  select: {
    number: 1,
    title: "Choisir le foyer initial",
    text: "Sélectionnez un pays sur la carte ou dans la liste. Ce sera le point de départ de la mission.",
    action: "Choisir un pays",
  },
  launch: {
    number: 1,
    title: "Lancer la mission",
    text: "Le pays est choisi. Vérifiez la difficulté dans son dossier, puis lancez la mission. Le temps se contrôle avec Pause et les vitesses 1×, 2× et 4×.",
    action: "Ouvrir le briefing",
  },
  intervene: {
    number: 2,
    title: "Intervenir dans un foyer",
    text: "Déployez une équipe médicale ou une quarantaine dans un pays touché. Le coût et la durée sont indiqués avant de confirmer.",
    action: "Voir un foyer actif",
  },
  finance: {
    number: 3,
    title: "Financer un protocole",
    text: "Ouvrez la recherche et choisissez un protocole abordable. Son effet est permanent; votre budget augmente chaque jour simulé.",
    action: "Ouvrir la recherche",
  },
  complete: {
    number: 3,
    title: "Vous connaissez les commandes",
    text: "Surveillez les tendances des pays, développez le vaccin et utilisez Pause pour préparer vos décisions.",
  },
  ended: {
    number: 3,
    title: "La mission est terminée",
    text: "Le bilan présente les résultats observés. Vous pourrez relancer ce guide depuis l’aide lors d’une nouvelle mission.",
  },
};
export default function DiscoveryGuide({
  state,
  selected,
  onAction,
  onClose,
  guideRef,
}) {
  const step = guideStep(state, selected),
    info = steps[step];
  return (
    <section
      ref={guideRef}
      tabIndex={-1}
      className="discovery-guide"
      aria-label="Guide de découverte"
    >
      <div
        className="guide-copy"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span>
          {step === "complete"
            ? "Guide terminé"
            : `Découverte · ${info.number}/3`}
        </span>
        <h2>{info.title}</h2>
        <p>{info.text}</p>
      </div>
      {info.action ? (
        <button className="button guide-action" onClick={() => onAction(step)}>
          {info.action}
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      ) : (
        <button className="button guide-action" onClick={onClose}>
          <Check size={16} aria-hidden="true" />
          Terminer le guide
        </button>
      )}
      <button
        className="icon-button"
        onClick={onClose}
        aria-label="Quitter le guide"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </section>
  );
}
