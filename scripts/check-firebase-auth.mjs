import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";

async function main() {
  const target = new URL(process.argv[2] || "http://127.0.0.1:4173");
  if (
    !["http:", "https:"].includes(target.protocol) ||
    target.username ||
    target.password ||
    target.search ||
    target.hash ||
    target.pathname !== "/"
  ) {
    throw Error("invalid-origin");
  }
  const root = fileURLToPath(new URL("..", import.meta.url));
  const env = loadEnv("production", root, "VITE_");
  if (!env.VITE_API_KEY) {
    console.error("Configuration Firebase absente : VITE_API_KEY.");
    process.exitCode = 1;
    return;
  }
  // This request intentionally has NO email or password. It can never create
  // an account or authenticate a user. MISSING_EMAIL proves the origin passed
  // key restrictions; it does not validate sign-up provider configuration.
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(env.VITE_API_KEY)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        referer: `${target.origin}/`,
      },
      body: JSON.stringify({ returnSecureToken: true }),
      signal: AbortSignal.timeout(15000),
    },
  );
  const data = await response.json();
  console.log(`Origine vérifiée : ${target.origin}`);
  if (response.status === 400 && data.error?.message === "MISSING_EMAIL") {
    console.log(
      "La clé accepte cette origine. Aucune connexion ni création de compte effectuée.",
    );
    return;
  }
  const denied =
    data.error?.details?.some(
      (detail) => detail.reason === "API_KEY_HTTP_REFERRER_BLOCKED",
    ) ||
    /^Requests from referer .* are blocked\.$/.test(data.error?.message || "");
  if (denied)
    console.error(
      "BLOQUÉ : API_KEY_HTTP_REFERRER_BLOCKED. Autorisez cette origine dans les restrictions Sites Web de la clé Google Cloud.",
    );
  else
    console.error(
      `Configuration ou service à vérifier (HTTP ${response.status}). Aucun compte créé.`,
    );
  process.exitCode = 1;
}
main().catch(() => {
  console.error(
    "Diagnostic impossible. Vérifiez l’origine http(s), la configuration locale et le réseau.",
  );
  process.exitCode = 1;
});
