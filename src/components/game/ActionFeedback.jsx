import { Check, X } from "lucide-react";
import { REFORMS } from "../../game/engine.mjs";
function feedbackText(feedback) {
  if (!feedback) return "";
  if (feedback.kind === "import")
    return feedback.status === "READY"
      ? "Partie importée, prête à démarrer."
      : ["VICTORY", "DEFEAT"].includes(feedback.status)
        ? "Bilan de mission importé."
        : "Partie importée. La simulation est en pause.";
  if (feedback.kind === "protocol")
    return `${REFORMS[feedback.reform].name} financé · −${feedback.spent} PC`;
  if (feedback.kind === "vaccine")
    return "Vaccin validé. La distribution peut commencer.";
  if (feedback.kind === "victory") return "Tous les foyers sont éliminés.";
  if (feedback.kind === "defeat")
    return "Mission terminée. Consultez le bilan.";
  return `${feedback.name} : ${feedback.kind === "team" ? "équipe déployée" : "quarantaine activée"} · −${feedback.spent} PC · ${feedback.days} jours`;
}
export default function ActionFeedback({ feedback, onDismiss }) {
  return (
    <div
      className="action-feedback"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {feedback && (
        <div key={feedback.key}>
          <Check size={18} aria-hidden="true" />
          <p>{feedbackText(feedback)}</p>
          <button
            className="icon-button"
            aria-label="Fermer la confirmation"
            onClick={onDismiss}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
