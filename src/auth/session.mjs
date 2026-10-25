// The Firebase observer, rather than local storage or an initial currentUser,
// decides access after persisted credentials have been restored.
export function observeSession(loadAuth, onState) {
  let active = true;
  let unsubscribe;
  Promise.resolve()
    .then(loadAuth)
    .then(({ auth, onAuthStateChanged }) => {
      if (!active) return;
      unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (active) onState({ status: user ? "authenticated" : "anonymous" });
        },
        () => {
          if (active) onState({ status: "error" });
        },
      );
    })
    .catch(() => {
      if (active) onState({ status: "error" });
    });
  return () => {
    active = false;
    unsubscribe?.();
  };
}
