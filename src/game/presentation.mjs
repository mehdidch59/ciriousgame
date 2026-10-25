export const VACCINE_PATH = [
  "vaccine_research",
  "laboratories",
  "vaccine_deploy",
];
export function eventCategory(text) {
  if (text.startsWith("Rapport :")) return "Rapport";
  if (/déployée|quarantaine activée|arrivée à échéance/.test(text))
    return "Intervention";
  if (/protocole activé|Vaccin validé/.test(text)) return "Recherche";
  return "Mission";
}
export function missionMilestones(state) {
  return [
    {
      label: "Programme financé",
      done: state.unlockedReforms.includes("vaccine_research"),
    },
    { label: "Vaccin validé", done: state.globalStats.research >= 100 },
    {
      label: "Distribution active",
      done:
        state.globalStats.research >= 100 &&
        state.unlockedReforms.includes("vaccine_deploy"),
    },
    {
      label: "Foyers éliminés",
      done: state.status !== "READY" && state.globalStats.totalInfected === 0,
    },
  ];
}
export function missionObjective(state) {
  if (state.status === "READY")
    return { text: "Choisissez le foyer initial.", target: null };
  if (state.status === "VICTORY")
    return { text: "Tous les foyers sont éliminés.", target: null };
  if (state.status === "DEFEAT")
    return { text: "Consultez le bilan de mission.", target: null };
  if (!state.unlockedReforms.includes("vaccine_research"))
    return { text: "Financez le programme vaccinal.", target: "research" };
  if (state.globalStats.research < 100)
    return {
      text: "Contenez les foyers pendant la recherche.",
      target: "countries",
    };
  if (
    !state.unlockedReforms.includes("laboratories") ||
    !state.unlockedReforms.includes("vaccine_deploy")
  )
    return { text: "Préparez la distribution mondiale.", target: "research" };
  return { text: "Éliminez les derniers cas actifs.", target: "countries" };
}
export function missionDebrief(state) {
  const s = state.globalStats;
  const history = state.history || [];
  const peak = history.reduce(
    (best, h) => (h.infected > best.infected ? h : best),
    { day: s.day, infected: s.totalInfected },
  );
  return {
    reason:
      state.status === "VICTORY"
        ? "Tous les cas actifs ont été éliminés avant l’échéance."
        : s.trust <= 0
          ? "La confiance publique est épuisée."
          : s.totalDead >= s.totalPopulation * 0.1
            ? "Les décès ont atteint 10 % de la population."
            : "Le délai de 365 jours est écoulé.",
    peak,
    firstDay: history[0]?.day ?? s.day,
    events: (state.decisions || state.events || [])
      .filter((e) => eventCategory(e.text) !== "Rapport")
      .slice(0, 8)
      .reverse(),
    affected: state.countries.filter((c) => c.infected > 0).length,
  };
}
export function regionalRisk(country) {
  if (!country.infected)
    return {
      label: "Aucun foyer actif",
      detail: "Surveillez les pays voisins.",
      level: "stable",
    };
  const percent = (country.infected / country.population) * 100;
  return {
    label: percent > 1 ? "Foyer critique" : "Foyer actif",
    detail: `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(percent)} % de la population touchée.`,
    level: percent > 1 ? "critical" : "outbreak",
  };
}
// Compare accepted reducer states: rejected orders never produce a success message.
export function actionFeedback(previous, next) {
  if (
    previous.status === "READY" ||
    next.globalStats.day < previous.globalStats.day
  )
    return null;
  const spent = previous.globalStats.points - next.globalStats.points;
  const reform = next.unlockedReforms.find(
    (id) => !previous.unlockedReforms.includes(id),
  );
  if (reform) return { kind: "protocol", reform, spent };
  for (const c of next.countries) {
    const old = previous.countries.find((p) => p.id === c.id);
    if (!old) continue;
    if (c.teamUntil > old.teamUntil)
      return {
        kind: "team",
        countryId: c.id,
        name: c.name,
        spent,
        days: c.teamUntil - next.globalStats.day,
      };
    if (c.quarantineUntil > old.quarantineUntil)
      return {
        kind: "quarantine",
        countryId: c.id,
        name: c.name,
        spent,
        days: c.quarantineUntil - next.globalStats.day,
      };
  }
  if (previous.globalStats.research < 100 && next.globalStats.research >= 100)
    return { kind: "vaccine" };
  if (
    previous.status !== next.status &&
    ["VICTORY", "DEFEAT"].includes(next.status)
  )
    return { kind: next.status.toLowerCase() };
  return null;
}
