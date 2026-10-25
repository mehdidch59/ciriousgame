import test from "node:test";
import assert from "node:assert/strict";
import { authErrorMessage } from "./errors.mjs";
test("Google referrer denials explain site configuration instead of blaming the network", () => {
  for (const code of [
    "auth/requests-from-referer-http://192.168.1.14:4174/-are-blocked.",
    "auth/api-key-http-referrer-blocked",
  ]) {
    const message = authErrorMessage({ code });
    assert.match(message, /adresse de site.*bloquée/);
    assert.doesNotMatch(message, /192\.168|connexion.*réessayez/i);
  }
});
test("backend policy failures differ from bad passwords and network failures", () => {
  assert.match(
    authErrorMessage({ code: "auth/operation-not-allowed" }),
    /désactivée/,
  );
  assert.match(
    authErrorMessage({ code: "auth/network-request-failed" }),
    /Vérifiez votre réseau/,
  );
  assert.match(
    authErrorMessage({ code: "auth/invalid-credential" }),
    /Identifiant ou mot de passe incorrect/,
  );
  assert.match(
    authErrorMessage({ code: "auth/invalid-api-key" }),
    /configuration.*invalide/,
  );
});
test("unknown SDK errors never echo raw error content", () => {
  const message = authErrorMessage({
    code: "auth/unknown-secret",
    message: "password=secret&key=secret",
    customData: { token: "secret" },
  });
  assert.doesNotMatch(message, /secret|token|password|key=/);
  assert.match(message, /administrateur/);
  assert.doesNotThrow(() => authErrorMessage(null));
});
