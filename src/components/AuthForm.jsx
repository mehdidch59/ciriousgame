import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import GameBrand from "./game/GameBrand";
import { authErrorMessage } from "../auth/errors.mjs";
export default function AuthForm({ mode }) {
  const register = mode === "register",
    navigate = useNavigate();
  const location = useLocation();
  const destination =
    typeof location.state?.from === "string" &&
    /^\/game(?:[/?#]|$)/.test(location.state.from)
      ? location.state.from
      : "/game";
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [visible, setVisible] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState(null);
  const usernameRef = useRef(null),
    passwordRef = useRef(null),
    confirmationRef = useRef(null),
    errorRef = useRef(null),
    requestRef = useRef(false);
  const fail = (message, field) => {
    setError({ message, field });
    (field === "username"
      ? usernameRef
      : field === "confirmation"
        ? confirmationRef
        : field === "password"
          ? passwordRef
          : errorRef
    ).current?.focus();
  };
  async function submit(event) {
    event.preventDefault();
    if (requestRef.current) return;
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username.trim())) {
      fail(
        "Utilisez 3 à 30 lettres, chiffres, tirets ou tirets bas.",
        "username",
      );
      return;
    }
    if (register && password !== confirmation) {
      fail(
        "Les mots de passe ne correspondent pas. Confirmez à nouveau votre mot de passe.",
        "confirmation",
      );
      return;
    }
    requestRef.current = true;
    setPending(true);
    setError(null);
    try {
      const [
        { auth },
        { createUserWithEmailAndPassword, signInWithEmailAndPassword },
      ] = await Promise.all([import("../firebase"), import("firebase/auth")]);
      const email = `${username.trim()}@cirious.game`;
      await (
        register ? createUserWithEmailAndPassword : signInWithEmailAndPassword
      )(auth, email, password);
      navigate(destination, { replace: true });
    } catch (err) {
      fail(authErrorMessage(err), null);
    } finally {
      requestRef.current = false;
      setPending(false);
    }
  }
  return (
    <div className="auth-page">
      <Link to="/" className="auth-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Retour au menu
      </Link>
      <main id="main-content" tabIndex={-1} className="auth-card">
        <GameBrand />
        <h1>{register ? "Créer un compte" : "Connexion"}</h1>
        <p className="auth-intro">
          {register
            ? "Créez votre identifiant de commandement."
            : "Connectez-vous avec votre identifiant de commandement."}{" "}
          Une connexion est nécessaire pour accéder au jeu.
        </p>
        <form onSubmit={submit} aria-busy={pending}>
          <fieldset disabled={pending}>
            <legend className="sr-only">
              {register ? "Créer un compte" : "Connexion"}
            </legend>
            <div className="form-field">
              <label htmlFor="username">Identifiant</label>
              <input
                ref={usernameRef}
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                minLength={3}
                maxLength={30}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex. commandant_01…"
                aria-invalid={error?.field === "username" || undefined}
                aria-describedby={
                  error?.field === "username"
                    ? "auth-error username-hint"
                    : "username-hint"
                }
              />
              <p id="username-hint" className="field-hint">
                3 à 30 lettres, chiffres, tirets ou tirets bas.
              </p>
            </div>
            <div className="form-field">
              <label htmlFor="password">Mot de passe</label>
              <div className="password-input">
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete={register ? "new-password" : "current-password"}
                  required
                  minLength={register ? 6 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={error?.field === "password" || undefined}
                  aria-describedby={register ? "password-hint" : undefined}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={
                    visible
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              {register && (
                <p id="password-hint" className="field-hint">
                  6 caractères minimum. Utilisez un mot de passe unique.
                </p>
              )}
            </div>
            {register && (
              <div className="form-field">
                <label htmlFor="confirmation">Confirmer le mot de passe</label>
                <input
                  ref={confirmationRef}
                  id="confirmation"
                  name="confirmation"
                  type={visible ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  aria-invalid={error?.field === "confirmation" || undefined}
                  aria-describedby={
                    error?.field === "confirmation" ? "auth-error" : undefined
                  }
                />
              </div>
            )}
          </fieldset>
          <div
            ref={errorRef}
            tabIndex={-1}
            id="auth-error"
            role="alert"
            className={error ? "form-error" : "sr-only"}
          >
            {error?.message}
          </div>
          <button
            type="submit"
            className="button primary auth-submit"
            disabled={pending}
          >
            {pending
              ? "Connexion au centre…"
              : register
                ? "Créer mon compte"
                : "Me connecter"}
          </button>
        </form>
        <p className="auth-switch">
          {register ? "Déjà un compte ?" : "Première mission ?"}{" "}
          <Link to={register ? "/login" : "/register"} state={location.state}>
            {register ? "Se connecter" : "Créer un compte"}
          </Link>
        </p>
        <p className="field-hint auth-storage-note">
          La partie est sauvegardée dans ce navigateur, sans synchronisation
          entre appareils.
        </p>
      </main>
    </div>
  );
}
