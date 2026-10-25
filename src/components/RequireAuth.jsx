import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { observeSession } from "../auth/session.mjs";

async function loadAuth() {
  const [{ auth }, { onAuthStateChanged }] = await Promise.all([
    import("../firebase"),
    import("firebase/auth"),
  ]);
  return { auth, onAuthStateChanged };
}

export default function RequireAuth() {
  const [session, setSession] = useState({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const location = useLocation();
  useEffect(() => observeSession(loadAuth, setSession), [attempt]);

  if (session.status === "anonymous") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search + location.hash }}
      />
    );
  }
  if (session.status === "authenticated") return <Outlet />;
  return (
    <main id="main-content" className="auth-page" tabIndex={-1}>
      <section className="auth-card">
        <h1>
          {session.status === "error"
            ? "Session indisponible."
            : "Vérification de votre session…"}
        </h1>
        <p className="auth-intro" role="status">
          {session.status === "error"
            ? "Impossible de vérifier votre connexion. Réessayez pour accéder au jeu."
            : "Veuillez patienter pendant la restauration de votre connexion."}
        </p>
        {session.status === "error" && (
          <>
            <button
              className="button primary"
              onClick={() => {
                setSession({ status: "loading" });
                setAttempt((value) => value + 1);
              }}
            >
              Réessayer
            </button>
            <Link className="button subtle" to="/login">
              Se connecter
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
