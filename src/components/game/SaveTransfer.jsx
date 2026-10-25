import { useRef, useState } from "react";
import countries from "../../data/pays.json";
import {
  importMission,
  exportMission,
  MAX_SAVE_BYTES,
} from "../../game/transfer.mjs";
import { DIFFICULTY_LEVELS } from "../../game/engine.mjs";
export default function SaveTransfer({ state, onRestore, onRecovery }) {
  const input = useRef(),
    request = useRef(0);
  const [candidate, setCandidate] = useState(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  function download() {
    setError("");
    try {
      const raw = exportMission(state),
        blob = new Blob([raw], { type: "application/json" }),
        url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = `cirious-jour-${String(state.globalStats.day).padStart(3, "0")}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage(
        "Fichier préparé. Vérifiez les téléchargements ou l’application Fichiers.",
      );
    } catch {
      setError(
        "Impossible de préparer le fichier de sauvegarde. Votre partie reste ouverte.",
      );
    }
  }
  async function choose(event) {
    const file = event.target.files?.[0],
      id = ++request.current;
    setCandidate(null);
    setError("");
    setMessage("");
    setPending(Boolean(file));
    if (!file) return;
    try {
      if (file.size > MAX_SAVE_BYTES) throw Error("save-too-large");
      const raw = await file.text();
      const mission = importMission(raw, countries);
      if (id === request.current)
        setCandidate({ raw, mission, name: file.name });
    } catch (cause) {
      if (id === request.current)
        setError(
          cause.message === "save-too-large"
            ? "Fichier trop volumineux : maximum 2 Mo."
            : "Ce fichier n’est pas une sauvegarde Cirious valide. La partie actuelle est conservée.",
        );
    } finally {
      if (id === request.current) setPending(false);
    }
  }
  function confirm() {
    if (!candidate) return;
    try {
      onRestore(candidate.raw);
    } catch {
      setError("Import impossible : la copie de récupération n’a pas pu être enregistrée ou le fichier est invalide. La partie actuelle est conservée.");
    }
  }
  return (
    <section className="save-transfer" aria-labelledby="transfer-title">
      <h3 id="transfer-title">Emporter votre partie</h3>
      <p>
        Exportez un fichier pour le conserver ou le transférer vers un autre
        appareil. Aucun compte ni mot de passe n’est inclus.
      </p>
      <button className="button subtle" onClick={download}>
        Exporter la sauvegarde
      </button>
        {onRecovery && <button type="button" className="button subtle" onClick={(event) => {
          event.preventDefault();
          try {
            const raw = onRecovery();
            setCandidate({ raw, mission: importMission(raw, countries), name: "Copie avant le dernier import" });
            setError("");
          } catch { setError("Aucune copie de récupération valide n’est disponible dans ce navigateur."); }
        }}>Récupérer la partie précédente</button>}
      <label className="save-file">
        Importer un fichier JSON
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          onChange={choose}
        />
      </label>
      <p>Chaque remplacement conserve d’abord une copie de la mission ouverte sur cet appareil. Si la copie échoue, l’import est annulé.</p>
      {pending && <p role="status">Vérification du fichier…</p>}
      {error && (
        <p role="alert" className="transfer-error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {candidate && (
        <div className="import-preview">
          <h4>Vérifiez avant de remplacer</h4>
          <p className="import-filename">{candidate.name}</p>
          <dl>
            <div>
              <dt>Jour</dt>
              <dd>{candidate.mission.globalStats.day}</dd>
            </div>
            <div>
              <dt>Difficulté</dt>
              <dd>{DIFFICULTY_LEVELS[candidate.mission.difficulty].name}</dd>
            </div>
            <div>
              <dt>Décisions disponibles</dt>
              <dd>{candidate.mission.decisions.length}</dd>
            </div>
          </dl>
          <p>
            Cette opération remplacera la mission ouverte au jour{" "}
            {state.globalStats.day}. Une mission en cours reprendra en pause.
          </p>
          {!candidate.mission.decisionHistoryComplete && (
            <p>L’historique de cette ancienne sauvegarde est partiel.</p>
          )}
          <button className="button primary" onClick={confirm}>
            Importer et remplacer cette partie
          </button>
          <button
            className="button subtle"
            onClick={() => {
              request.current++;
              setCandidate(null);
              if (input.current) input.current.value = "";
            }}
          >
            Annuler l’import
          </button>
        </div>
      )}
    </section>
  );
}
