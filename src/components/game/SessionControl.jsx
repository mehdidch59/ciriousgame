import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
export default function SessionControl({ onPause }) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  async function disconnect() {
    if (pending) return;
    onPause();
    setPending(true);
    setError("");
    try {
      const [{ auth }, { signOut }] = await Promise.all([
        import("../../firebase"),
        import("firebase/auth"),
      ]);
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch {
      setError("Impossible de confirmer la déconnexion. Réessayez.");
      setPending(false);
    }
  }
  return (
    <div className="session-control">
      <button className="button subtle" disabled={pending} onClick={disconnect}>
        <LogOut size={16} aria-hidden="true" />
        {pending ? "Déconnexion…" : "Se déconnecter"}
      </button>
      {error && <p role="alert">{error}</p>}
      <p>
        Votre partie reste sur cet appareil. La connexion sera nécessaire pour
        la retrouver.
      </p>
    </div>
  );
}
