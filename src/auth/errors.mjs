const messages = {
  "auth/invalid-credential":
    "Identifiant ou mot de passe incorrect. Vérifiez vos informations.",
  "auth/user-not-found":
    "Identifiant ou mot de passe incorrect. Vérifiez vos informations.",
  "auth/wrong-password":
    "Identifiant ou mot de passe incorrect. Vérifiez vos informations.",
  "auth/email-already-in-use":
    "Cet identifiant est déjà utilisé. Connectez-vous ou choisissez-en un autre.",
  "auth/weak-password": "Choisissez un mot de passe d’au moins 6 caractères.",
  "auth/too-many-requests":
    "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
  "auth/network-request-failed":
    "Connexion indisponible. Vérifiez votre réseau puis réessayez.",
  "auth/operation-not-allowed":
    "La création de comptes est désactivée dans la configuration du service. Contactez l’administrateur.",
  "auth/user-disabled": "Ce compte est désactivé. Contactez l’administrateur.",
  "auth/invalid-api-key":
    "La configuration du service de comptes est invalide. Contactez l’administrateur.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    "La configuration du service de comptes est invalide. Contactez l’administrateur.",
  "auth/unauthorized-domain":
    "Cette adresse n’est pas autorisée à utiliser le service de comptes. Contactez l’administrateur.",
};
export function authErrorMessage(error) {
  const code = typeof error?.code === "string" ? error.code : "";
  // Firebase turns the raw Google API error into a dynamic auth code.
  // Never expose that raw code/message: it can contain a URL or other data.
  if (
    /^auth\/requests-from-refer(?:er|rer)-.*-are-blocked\.?$/i.test(code) ||
    code === "auth/api-key-http-referrer-blocked"
  ) {
    return "Cette adresse de site est bloquée par la configuration du service de comptes. L’administrateur doit l’autoriser avant toute connexion ou inscription.";
  }
  if (code === "auth/api-key-service-blocked")
    return "Le service de comptes est bloqué par la configuration de sa clé d’accès. Contactez l’administrateur.";
  return (
    messages[code] ||
    "Le service de comptes est indisponible. Réessayez plus tard. Si le problème persiste, contactez l’administrateur."
  );
}
