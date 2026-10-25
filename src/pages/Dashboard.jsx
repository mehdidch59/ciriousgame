import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Globe2,
  FlaskConical,
  Flag,
  ScrollText,
  CircleHelp,
  Settings2,
  Menu,
  Pause,
  Play,
  ArrowLeft,
  RotateCcw,
  Check,
  X,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import GameHud from "../components/game/GameHud";
import RegionPanel from "../components/game/RegionPanel";
import ResearchPanel from "../components/game/ResearchPanel";
import CountriesPanel from "../components/game/CountriesPanel";
import WorldMap from "../components/WorldMap";
import MissionDialog from "../components/MissionDialog";
import { formatNumber } from "../game/format.mjs";
import { DIFFICULTY_LEVELS } from "../game/engine.mjs";
import { popScreen, pushScreen } from "../game/interface.mjs";
import MapLegend from "../components/game/MapLegend";
import MissionDebrief from "../components/game/MissionDebrief";
import MissionProgress from "../components/game/MissionProgress";
import ActionFeedback from "../components/game/ActionFeedback";
import useMissionFeedback from "../hooks/useMissionFeedback";
import DiscoveryGuide from "../components/game/DiscoveryGuide";
import SessionControl from "../components/game/SessionControl";
import ExpiryAlerts from "../components/game/ExpiryAlerts";
import SaveTransfer from "../components/game/SaveTransfer";
import DecisionHistory from "../components/game/DecisionHistory";
import { eventCategory } from "../game/presentation.mjs";
const navigation = [
  ["map", "Carte", "M", Globe2],
  ["research", "Recherche", "R", FlaskConical],
  ["countries", "Pays", "P", Flag],
  ["journal", "Journal", "J", ScrollText],
];
const panelNames = {
  map: "Dossier régional",
  research: "Recherche",
  countries: "Pays surveillés",
  journal: "Journal de mission",
  help: "Comment jouer",
  settings: "Options",
};
export default function Dashboard() {
  const dossierRef = useRef(null);
  const guideRef = useRef(null);
  const returnFocusRef = useRef(null);
  const { state, actions, saveStatus, interfaceSettings, audio } = useOutletContext(),
    s = state.globalStats;
  const { feedback, newFoyers, dismiss } = useMissionFeedback(state);
  const [dossierExpanded, setDossierExpanded] = useState(false);
  const [objectiveCountries, setObjectiveCountries] = useState(false);
  const [guideEnabled, setGuideEnabled] = useState(false);
  const [guideSelected, setGuideSelected] = useState(false);
  const [selectedId, setSelectedId] = useState(
      () =>
        state.countries.reduce(
          (best, c) => (c.infected > best.infected ? c : best),
          state.countries.find((c) => c.id === "FR") || state.countries[0],
        ).id,
    ),
    [screens, setScreens] = useState(["map"]),
    [difficulty, setDifficulty] = useState("MEDIUM"),
    [layer, setLayer] = useState("infection");
  const {
    preferences: { textScale, reducedMotion, pauseOnExpiry },
    setTextScale,
    setReducedMotion,
    setPauseOnExpiry,
    saveStatus: preferencesSaveStatus,
  } = interfaceSettings;
  const screen = screens.at(-1),
    modal = ["pause", "restart"].includes(screen) ? screen : null,
    panel = [...screens].reverse().find((value) => panelNames[value]) || "map";
  const mobileView = panel === "map" ? "map" : "dossier";
  const ended = ["VICTORY", "DEFEAT"].includes(state.status),
    ready = state.status === "READY",
    available = ["RUNNING", "PAUSED"].includes(state.status),
    selected =
      state.countries.find((c) => c.id === selectedId) || state.countries[0],
    affected = state.countries.filter((c) => c.infected > 0).length;
  const mapCountries = useMemo(
    () =>
      state.countries.map((c) => ({
        ...c,
        teamUntil: c.teamUntil > s.day ? c.teamUntil : 0,
        quarantineUntil: c.quarantineUntil > s.day ? c.quarantineUntil : 0,
      })),
    [state.countries, s.day],
  );
  const openScreen = useCallback(
    (next) => {
      if (
        next !== "map" &&
        document.activeElement?.matches('button,a,[role="button"]')
      )
        returnFocusRef.current = document.activeElement;
      if (["pause", "restart", "help", "settings", "research"].includes(next))
        actions.pause();
      setScreens((previous) => pushScreen(previous, next));
    },
    [actions],
  );
  const back = useCallback(() => setScreens(popScreen), []);
  function selectCountry(id) {
    setGuideSelected(true);
    setSelectedId(id);
    openScreen("map");
    setDossierExpanded(true);
    if (window.matchMedia("(max-width: 700px)").matches)
      requestAnimationFrame(() => dossierRef.current?.focus());
  }
  function startGuide() {
    actions.pause();
    setGuideSelected(false);
    setGuideEnabled(true);
    openScreen("map");
    requestAnimationFrame(() => guideRef.current?.focus());
  }
  function guideAction(step) {
    if (step === "select") {
      setObjectiveCountries(false);
      openScreen("countries");
    } else if (step === "finance") openScreen("research");
    else {
      if (step === "intervene") {
        const foyer = state.countries
          .filter((c) => c.infected > 0)
          .sort((a, b) => b.infected - a.infected)[0];
        if (foyer) selectCountry(foyer.id);
      }
      openScreen("map");
      setDossierExpanded(true);
      requestAnimationFrame(() => dossierRef.current?.focus());
    }
  }
  useEffect(() => {
    dossierRef.current?.scrollTo({ top: 0, behavior: "instant" });
    if (panel !== "map") dossierRef.current?.focus();
    else if (returnFocusRef.current?.isConnected)
      returnFocusRef.current.focus();
    else if (returnFocusRef.current)
      document
        .querySelector(
          window.matchMedia("(max-width: 700px)").matches
            ? ".mobile-navigation button"
            : ".game-rail button",
        )
        ?.focus();
  }, [panel, selectedId]);
  useEffect(() => {
    function keydown(event) {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.target.closest(
          'input,textarea,select,[contenteditable="true"]',
        ) ||
        document.querySelector("dialog[open]")
      )
        return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (screens.length > 1) back();
        else if (available) {
          openScreen("pause");
        }
        return;
      }
      const key = event.key.toLowerCase();
      const next = { m: "map", r: "research", p: "countries", j: "journal" }[
        key
      ];
      if (next) {
        event.preventDefault();
        openScreen(next);
      }
      if (
        event.code === "Space" &&
        available &&
        !event.target.closest('button,a,[role="button"]')
      ) {
        event.preventDefault();
        actions.togglePause();
      }
      if (["1", "2", "4"].includes(key)) actions.setSpeed(Number(key));
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [actions, available, screens, openScreen, back]);
  const advice = ready
    ? "Choisissez le foyer initial sur la carte."
    : !state.unlockedReforms.includes("vaccine_research")
      ? "La recherche demande du temps. Financez le programme vaccinal."
      : s.research < 100
        ? "Contenez les foyers pendant la recherche du vaccin."
        : !state.unlockedReforms.includes("vaccine_deploy")
          ? "Vaccin validé. Préparez sa distribution mondiale."
          : "Contenez les derniers foyers.";
  return (
    <div
      className={`game-shell mobile-${mobileView} ${dossierExpanded ? "dossier-expanded" : ""} ${reducedMotion ? "reduced-motion" : ""} ${textScale > 100 ? "large-text" : ""}`}
      style={{ "--ui-scale": textScale / 100 }}
    >
      <GameHud stats={s} />
      <p className="sr-only" role="status">
        {newFoyers.length
          ? `${newFoyers.length} nouveaux foyers détectés : ${state.countries
              .filter((country) => newFoyers.includes(country.id))
              .map((country) => country.name)
              .join(", ")}.`
          : ""}
      </p>
      <ActionFeedback feedback={feedback} onDismiss={dismiss} />
      <div className="status-alerts">
        {!ended && (
          <ExpiryAlerts
            state={state}
            onSelect={selectCountry}
            onDismiss={actions.dismissExpiryAlerts}
          />
        )}
        {guideEnabled && (
          <DiscoveryGuide
            guideRef={guideRef}
            state={state}
            selected={guideSelected}
            onAction={guideAction}
            onClose={() => setGuideEnabled(false)}
          />
        )}
        {saveStatus === "unavailable" && (
          <p className="save-alert" role="alert">
            <TriangleAlert size={18} aria-hidden="true" />
            <span>
              La partie ne peut pas être sauvegardée. Gardez cet onglet ouvert
              et vérifiez que le stockage de ce site est autorisé.
            </span>
          </p>
        )}
        {s.trust <= 30 && !ended && (
          <p className="trust-alert" role="status">
            <TriangleAlert size={18} aria-hidden="true" />
            <span>
              Confiance faible : le financement quotidien est réduit de 40 %. Le
              fonds de solidarité peut renforcer la confiance.
            </span>
          </p>
        )}
      </div>
      <nav className="mobile-navigation" aria-label="Navigation mobile">
        <button
          aria-pressed={mobileView === "map"}
          onClick={() => {
            openScreen("map");
            setDossierExpanded(false);
          }}
        >
          <Globe2 size={19} aria-hidden="true" />
          Carte
        </button>
        <button
          aria-pressed={panel === "countries" && mobileView === "dossier"}
          onClick={() => openScreen("countries")}
        >
          <Flag size={19} aria-hidden="true" />
          Pays
        </button>
        <button
          aria-pressed={panel === "research" && mobileView === "dossier"}
          onClick={() => openScreen("research")}
        >
          <FlaskConical size={19} aria-hidden="true" />
          Recherche
        </button>
        <button aria-label="Ouvrir le menu" onClick={() => openScreen("pause")}>
          <Menu size={19} aria-hidden="true" />
          Menu
        </button>
      </nav>
      <div className="game-stage">
        <nav className="game-rail" aria-label="Commandes du jeu">
          {navigation.map(([id, label, key, Icon]) => (
            <button
              key={id}
              className={panel === id ? "selected" : ""}
              aria-current={panel === id ? "page" : undefined}
              onClick={() => openScreen(id)}
            >
              <Icon size={23} aria-hidden="true" />
              <span>{label}</span>
              <kbd>{key}</kbd>
            </button>
          ))}
          <div className="rail-spacer" />
          <button
            aria-label="Comment jouer"
            onClick={() => openScreen("help")}
            className={panel === "help" ? "selected" : ""}
          >
            <CircleHelp size={23} aria-hidden="true" />
            <span>Aide</span>
          </button>
          <button
            aria-label="Options"
            onClick={() => openScreen("settings")}
            className={panel === "settings" ? "selected" : ""}
          >
            <Settings2 size={23} aria-hidden="true" />
            <span>Options</span>
          </button>
          <button
            aria-label="Menu de pause"
            onClick={() => openScreen("pause")}
          >
            <Menu size={23} aria-hidden="true" />
            <span>Menu</span>
          </button>
        </nav>
        <section className="game-map-area" aria-label="Espace de jeu">
          <MissionProgress
            state={state}
            onNavigate={(target) => {
              setObjectiveCountries(target === "countries");
              openScreen(target);
            }}
          />
          <div className="map-heading">
            <div>
              <h1>Situation mondiale</h1>
              <p>
                {ready
                  ? "Sélectionnez un pays pour préparer la réponse."
                  : `${affected} pays touchés. ${advice}`}
              </p>
            </div>
            <div className="map-status">
              {ready
                ? "Préparation"
                : state.status === "RUNNING"
                  ? "Simulation active"
                  : ended
                    ? "Mission terminée"
                    : "En pause"}
            </div>
          </div>
          <WorldMap
            countries={mapCountries}
            onCountrySelect={(country) => selectCountry(country.id)}
            selectedCountryId={selected.id}
            onBrowse={() => {
              setObjectiveCountries(false);
              openScreen("countries");
            }}
            layer={layer}
            onDossier={() => {
              setDossierExpanded(true);
              requestAnimationFrame(() => dossierRef.current?.focus());
            }}
            newFoyers={newFoyers}
            feedback={feedback}
          />
          <div className="map-tools">
            <div className="map-layers" aria-label="Affichage de la carte">
              <button
                aria-pressed={layer === "infection"}
                onClick={() => setLayer("infection")}
              >
                Propagation
              </button>
              <button
                aria-pressed={layer === "response"}
                onClick={() => setLayer("response")}
              >
                Interventions
              </button>
            </div>
            <MapLegend layer={layer} />
          </div>
        </section>
        <aside
          key={`${panel}-${panel === "map" ? selectedId : ""}`}
          ref={dossierRef}
          id="region-dossier"
          tabIndex={-1}
          className="game-dossier"
          aria-label={panelNames[panel]}
        >
          {panel === "map" && (
            <button
              className="dossier-toggle"
              aria-expanded={dossierExpanded}
              onClick={() => setDossierExpanded((v) => !v)}
            >
              {selected.name} ·{" "}
              {dossierExpanded ? "Réduire le dossier" : "Ouvrir le dossier"}
            </button>
          )}
          {panel !== "map" && (
            <div className="drawer-back">
              <button onClick={back}>
                <ArrowLeft size={16} aria-hidden="true" />
                Retour
              </button>
              <button
                className="icon-button"
                aria-label="Fermer le panneau"
                onClick={() => openScreen("map")}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          )}
          {panel === "map" && (
            <RegionPanel
              state={state}
              selected={selected}
              actions={actions}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              onResearch={() => openScreen("research")}
              onGuide={guideEnabled ? undefined : startGuide}
            />
          )}
          {panel === "research" && (
            <ResearchPanel state={state} actions={actions} />
          )}
          {panel === "countries" && (
            <CountriesPanel
              key={String(objectiveCountries)}
              initialAffectedOnly={objectiveCountries}
              countries={state.countries}
              selectedId={selectedId}
              onSelect={selectCountry}
            />
          )}
          {panel === "journal" && <Journal state={state} />}
          {panel === "help" && (
            <div className="guide-content">
              <h2>Comment jouer</h2>
              <ol>
                <li>
                  <h3>Localiser le foyer</h3>
                  <p>
                    Choisissez un pays, une difficulté, puis lancez la mission.
                  </p>
                </li>
                <li>
                  <h3>Contenir et soigner</h3>
                  <p>
                    Déployez des équipes et des quarantaines dans les pays
                    touchés. Les quarantaines coûtent de la confiance.
                  </p>
                </li>
                <li>
                  <h3>Financer le vaccin</h3>
                  <p>
                    Activez le programme vaccinal, puis les laboratoires. À 100
                    %, distribuez le vaccin.
                  </p>
                </li>
              </ol>
              <h3>Gagner la mission</h3>
              <button className="button subtle" onClick={startGuide}>
                {guideEnabled
                  ? "Recommencer le guide"
                  : "Découvrir les commandes · guide facultatif"}
              </button>
              <p>
                Éliminez tous les cas actifs avant le jour 365. Une confiance
                épuisée ou 10 % de décès provoque une défaite.
              </p>
              <h3>Raccourcis</h3>
              <dl className="shortcut-list">
                <div>
                  <dt>Pause / reprise</dt>
                  <dd>
                    <kbd>Espace</kbd>
                  </dd>
                </div>
                <div>
                  <dt>Vitesse</dt>
                  <dd>
                    <kbd>1</kbd> <kbd>2</kbd> <kbd>4</kbd>
                  </dd>
                </div>
                <div>
                  <dt>Retour / menu</dt>
                  <dd>
                    <kbd>Échap</kbd>
                  </dd>
                </div>
              </dl>
              <p className="regional-note">
                La partie se sauvegarde dans ce navigateur et se met en pause
                quand vous quittez l’onglet.
              </p>
            </div>
          )}
          {panel === "settings" && (
            <div className="settings-content">
              <h2>Options</h2>
              <label htmlFor="text-scale">Taille des textes</label>
              <select
                id="text-scale"
                value={textScale}
                onChange={(event) => setTextScale(Number(event.target.value))}
              >
                <option value={100}>Standard</option>
                <option value={125}>Grande · 125 %</option>
                <option value={150}>Très grande · 150 %</option>
                <option value={200}>Maximale · 200 %</option>
              </select>
              <label className="setting-check">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(event) => setReducedMotion(event.target.checked)}
                />
                Réduire les mouvements
              </label>
              <p>
                Les chiffres et les commandes restent immédiats. Cette option
                retire les transitions de déplacement.
              </p>
              <p role="status">
                {preferencesSaveStatus === "unavailable"
                  ? "Ces options ne peuvent pas être enregistrées dans ce navigateur."
                  : "Ces options sont mémorisées sur cet appareil."}
              </p>
              <label className="setting-check">
                <input
                  type="checkbox"
                  checked={pauseOnExpiry}
                  onChange={(event) => setPauseOnExpiry(event.target.checked)}
                />
                Pause automatique à la fin d’une intervention
              </label>
              <p>
                La simulation se met en pause lorsqu’une équipe ou une
                quarantaine arrive à échéance dans un pays encore touché.
              </p>
              {audio && <section aria-label="Retours sonores">
                <h3>Retours sonores</h3>
                <label className="audio-volume">Volume · {audio.volume === 0 ? "Muet" : `${audio.volume} %`}
                  <input type="range" min="0" max="100" step="5" value={audio.volume} onChange={event => audio.setVolume(Number(event.target.value))} />
                </label>
                <button className="button subtle" onClick={() => audio.setVolume(audio.volume ? 0 : 35)}>{audio.volume ? "Couper le son" : "Activer le son"}</button>
                <p>Ordres acceptés, nouveaux foyers, vaccin et fin de mission. Tous les événements restent visibles. Le son démarre à la prochaine interaction et se coupe en arrière-plan.</p>
                {audio.unavailable && <p role="status">Le navigateur ne permet pas d’activer le son. Les indications visuelles restent disponibles.</p>}
              </section>}
              <h3>Sauvegarde</h3>
              <p>
                {saveStatus === "unavailable"
                  ? "Le stockage est indisponible. Ne fermez pas cet onglet."
                  : "La progression est conservée automatiquement sur cet appareil. Elle reprend en pause."}
              </p>
              <SaveTransfer
                state={state}
                onRecovery={actions.recoverySave}
                onRestore={(raw) => {
                  const next = actions.importSave(raw);
                  setSelectedId(
                    next.countries.reduce(
                      (a, b) => (b.infected > a.infected ? b : a),
                      next.countries[0],
                    ).id,
                  );
                  setScreens(["map"]);
                  setGuideEnabled(false);
                  setDossierExpanded(false);
                }}
              />
              <button
                className="button subtle"
                onClick={() => openScreen("restart")}
              >
                <RotateCcw size={16} aria-hidden="true" />
                Recommencer la mission
              </button>
            </div>
          )}
        </aside>
      </div>
      <footer className="game-timebar">
        <div className="time-day">
          <strong>
            Jour {String(s.day).padStart(3, "0")}
            <small> / 365</small>
          </strong>
          <span>
            {ready
              ? "En attente du lancement"
              : DIFFICULTY_LEVELS[state.difficulty].name}
          </span>
        </div>
        {ready && (
          <button
            className="button primary mobile-launch"
            onClick={() => actions.startGame(selected.id, difficulty)}
          >
            Lancer la mission
          </button>
        )}
        <div className={`time-controls ${ready ? "preparing" : ""}`}>
          <button
            className="time-play"
            disabled={!available}
            aria-label={
              state.status === "RUNNING" ? "Mettre en pause" : "Reprendre"
            }
            title="Pause ou reprise · Espace"
            onClick={actions.togglePause}
          >
            {state.status === "RUNNING" ? (
              <Pause size={23} aria-hidden="true" />
            ) : (
              <Play size={23} aria-hidden="true" />
            )}
          </button>
          <div className="speed-controls">
            {[1, 2, 4].map((speed) => (
              <button
                key={speed}
                aria-pressed={state.speed === speed}
                onClick={() => actions.setSpeed(speed)}
              >
                {speed}×
              </button>
            ))}
          </div>
        </div>
        <div className="latest-event">
          <span>Dernier événement</span>
          <p role="status">{state.events[0]?.text || advice}</p>
        </div>
        <div
          className={`save-indicator ${saveStatus === "unavailable" ? "save-error" : ""}`}
        >
          <Check size={19} aria-hidden="true" />
          <span>
            {saveStatus === "unavailable"
              ? "Sauvegarde indisponible"
              : saveStatus === "pending"
                ? "Sauvegarde…"
                : "Partie sauvegardée"}
            <small>
              {state.status === "RUNNING"
                ? "Simulation active"
                : ready
                  ? "Prête à démarrer"
                  : "Simulation en pause"}
            </small>
          </span>
        </div>
      </footer>
      {(modal || ended) && (
        <MissionDialog
          key={ended ? "result" : modal}
          onCancel={ended ? undefined : back}
        >
          <div className="menu-emblem">
            <ShieldCheck size={30} aria-hidden="true" />
          </div>
          <h2
            id="result-title"
            tabIndex={-1}
            data-dialog-initial={ended ? "" : undefined}
          >
            {ended
              ? state.status === "VICTORY"
                ? "Épidémie maîtrisée"
                : "Mission échouée"
              : modal === "restart"
                ? "Recommencer ?"
                : "Mission en pause"}
          </h2>
          {ended ? (
            <>
              <MissionDebrief state={state} />
              <button
                className="button primary"
                onClick={() => {
                  actions.restart();
                  setScreens(["map"]);
                }}
              >
                Nouvelle mission
              </button>
              <Link className="button subtle" to="/">
                Retour au menu principal
              </Link>
            </>
          ) : modal === "restart" ? (
            <>
              <p>
                La progression de cette mission sera effacée. Votre compte est
                conservé.
              </p>
              <button
                data-dialog-cancel
                className="button primary"
                onClick={back}
              >
                Continuer la partie
              </button>
              <button
                className="button danger"
                onClick={() => {
                  actions.restart();
                  setScreens(["map"]);
                }}
              >
                Recommencer la mission
              </button>
            </>
          ) : (
            <>
              <p>
                {ready
                  ? "Votre mission attend son lancement."
                  : `Jour ${s.day}. La progression est sauvegardée sur cet appareil.`}
              </p>
              <button
                data-dialog-cancel
                className="button primary"
                onClick={() => {
                  setScreens((previous) => previous.slice(0, -1));
                  if (state.status === "PAUSED") actions.togglePause();
                }}
              >
                {ready ? "Retour au briefing" : "Reprendre la partie"}
              </button>
              <button
                className="button subtle"
                onClick={() => openScreen("restart")}
              >
                Recommencer
              </button>
              <button
                className="button subtle"
                onClick={() => openScreen("journal")}
              >
                Journal de mission
              </button>
              <button
                className="button subtle"
                onClick={() => openScreen("settings")}
              >
                Options
              </button>
              <button
                className="button subtle"
                onClick={() => openScreen("help")}
              >
                Comment jouer
              </button>
              <Link className="button subtle" to="/">
                Retour au menu principal
              </Link>
              <SessionControl onPause={actions.pause} />
            </>
          )}
        </MissionDialog>
      )}
    </div>
  );
}
function Journal({ state }) {
  const [importantOnly, setImportantOnly] = useState(false);
  const s = state.globalStats,
    max = Math.max(1, ...state.history.map((h) => h.infected));
  return (
    <div className="journal-content">
      <h2>Journal de mission</h2>
      <label className="journal-filter">
        <input
          type="checkbox"
          checked={importantOnly}
          onChange={(event) => setImportantOnly(event.target.checked)}
        />
        Historique des décisions
      </label>
      <dl className="journal-totals">
        <div>
          <dt>Population en vie</dt>
          <dd>{formatNumber(s.totalPopulation - s.totalDead)}</dd>
        </div>
        <div>
          <dt>Décès dans le monde</dt>
          <dd>{formatNumber(s.totalDead)}</dd>
        </div>
      </dl>
      <h3>Cas actifs</h3>
      {state.history.length > 1 ? (
        <svg
          className="infection-chart"
          viewBox="0 0 300 90"
          role="img"
          aria-label={`Évolution des infections du jour ${state.history[0].day} au jour ${s.day}`}
        >
          <path d="M0 89H300" stroke="currentColor" opacity=".3" />
          <polyline
            fill="none"
            stroke="var(--infection)"
            strokeWidth="2"
            points={state.history
              .map(
                (h, i) =>
                  `${(i / (state.history.length - 1)) * 300},${85 - (h.infected / max) * 80}`,
              )
              .join(" ")}
          />
        </svg>
      ) : (
        <p className="empty-state">
          La courbe apparaîtra après les premiers jours de simulation.
        </p>
      )}
      {importantOnly ? (
        <DecisionHistory state={state} />
      ) : (
        <ol className="mission-log">
          {state.events
            .filter(
              (event) =>
                !importantOnly || eventCategory(event.text) !== "Rapport",
            )
            .map((event, index) => (
              <li
                className={`event-${eventCategory(event.text).toLowerCase()}`}
                key={`${event.day}-${index}`}
              >
                <time>Jour {String(event.day).padStart(3, "0")}</time>
                <span className="event-category">
                  {eventCategory(event.text)}
                </span>
                <p>{event.text}</p>
              </li>
            ))}
          {importantOnly &&
            !state.events.some(
              (event) => eventCategory(event.text) !== "Rapport",
            ) && (
              <li>Aucune décision récente dans les événements conservés.</li>
            )}
        </ol>
      )}
    </div>
  );
}
