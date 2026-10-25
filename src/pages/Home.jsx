import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, BookOpen, UserRound, LogIn, X } from "lucide-react";
import GameBrand from "../components/game/GameBrand";
import WorldMap from "../components/WorldMap";
import MissionDialog from "../components/MissionDialog";
import useHomeSession from "../hooks/useHomeSession";
const TitleGlobe = lazy(() => import("../components/game/TitleGlobe"));
const previewCountries = [{ id: "FR", name: "France", infected: 0 }];
export default function Home() {
  const [help, setHelp] = useState(false);
  const [showGlobe, setShowGlobe] = useState(
    () => window.matchMedia("(min-width: 900px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(min-width: 900px)");
    const change = () => setShowGlobe(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const { session, resumable, finished, metadataReady } = useHomeSession();
  const authenticated = session.status === "authenticated";
  const checking =
    session.status === "loading" || (authenticated && !metadataReady);
  return (
    <main id="main-content" tabIndex={-1} className="title-screen">
      <div className="title-atlas" aria-hidden="true">
        <WorldMap
          countries={previewCountries}
          selectedCountryId="FR"
          interactive={false}
        />
      </div>
      {showGlobe && (
        <Suspense fallback={null}>
          <TitleGlobe />
        </Suspense>
      )}
      <header className="title-header">
        <span>Un jeu de stratégie et de gestion de crise</span>
        <Link to={authenticated ? "/game" : "/login"}>
          <LogIn size={16} aria-hidden="true" />
          {checking
            ? "Vérification de la session…"
            : authenticated
              ? "Accéder au commandement"
              : "Connexion"}
        </Link>
      </header>
      <section className="title-menu">
        <GameBrand large />
        <h1 className="title-subtitle">Global Defense</h1>
        <p className="title-premise">
          Une épidémie se propage.
          <br />
          Organisez la réponse mondiale.
        </p>
        <nav
          aria-label="Menu principal"
          className="main-menu"
          aria-busy={checking}
        >
          <Link className="main-menu-play" to="/game">
            <Play size={22} aria-hidden="true" />
            {checking
              ? "Vérification de la session…"
              : authenticated
                ? resumable
                  ? "Reprendre la mission"
                  : finished
                    ? "Consulter le bilan"
                    : "Nouvelle mission"
                : "Se connecter pour jouer"}
            <span>
              {checking
                ? "La mission sera disponible après vérification"
                : authenticated
                  ? resumable
                    ? "Votre progression est conservée"
                    : finished
                      ? "Revoir la mission et recommencer"
                      : "Préparer la réponse mondiale"
                  : resumable
                    ? "Une mission vous attend sur cet appareil"
                    : "Accéder au commandement"}
            </span>
          </Link>
          <button onClick={() => setHelp(true)}>
            <BookOpen size={20} aria-hidden="true" />
            Comment jouer
          </button>
          {session.status === "anonymous" && (
            <Link to="/register">
              <UserRound size={20} aria-hidden="true" />
              Créer un compte
            </Link>
          )}
        </nav>
        <p className="title-game-info">
          Solo / 3 difficultés / Parties sauvegardées
        </p>
      </section>
      <footer className="title-footer">
        <span>Cirious</span>
        <p>Simulation fictive. Aucune donnée médicale en temps réel.</p>
        <span>Global Defense Initiative</span>
      </footer>
      {help && (
        <MissionDialog onCancel={() => setHelp(false)}>
          <button
            className="dialog-close icon-button"
            aria-label="Fermer les règles"
            onClick={() => setHelp(false)}
          >
            <X size={20} aria-hidden="true" />
          </button>
          <h2 id="result-title">Votre mission</h2>
          <p>
            Choisissez un foyer et contenez la propagation. Déployez des équipes
            médicales, financez les protocoles et développez un vaccin.
          </p>
          <p>
            Vous gagnez lorsque tous les cas actifs sont éliminés avant le jour
            365. Vous perdez si la confiance tombe à zéro ou si les décès
            atteignent 10 % de la population.
          </p>
          <p>
            Le temps peut être mis en pause pour préparer vos décisions. La
            progression est sauvegardée dans ce navigateur.
          </p>
          <button
            className="button primary"
            data-dialog-cancel
            onClick={() => setHelp(false)}
          >
            Retour au menu
          </button>
        </MissionDialog>
      )}
    </main>
  );
}
