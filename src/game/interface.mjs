export const UI_PREFERENCES_KEY = "cirious.interface.v1";
export const TEXT_SCALES = [100, 125, 150, 200];
const screens = new Set([
  "map",
  "research",
  "countries",
  "journal",
  "help",
  "settings",
  "pause",
  "restart",
]);
export function pushScreen(history, next) {
  if (!screens.has(next)) return history;
  if (next === "map") return ["map"];
  const index = history.indexOf(next);
  return index < 0 ? [...history, next] : history.slice(0, index + 1);
}
export function popScreen(history) {
  return history.length > 1 ? history.slice(0, -1) : history;
}
export function readPreferences(raw, reducedMotion = false) {
  const defaults = { textScale: 100, reducedMotion, pauseOnExpiry: false };
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1) return defaults;
    return {
      textScale: TEXT_SCALES.includes(value.textScale) ? value.textScale : 100,
      pauseOnExpiry: value.pauseOnExpiry === true,
      reducedMotion:
        typeof value.reducedMotion === "boolean"
          ? value.reducedMotion
          : reducedMotion,
    };
  } catch {
    return defaults;
  }
}
export const serializePreferences = (preferences) =>
  JSON.stringify({ version: 1, ...preferences });
export function researchDaysRemaining(progress, rate) {
  if (progress >= 100) return 0;
  return rate > 0 ? Math.ceil((100 - progress - 1e-9) / rate) : null;
}
export const MAP_STATES = {
  stable: {
    id: "stable",
    label: "Stable",
    color: "var(--map-stable)",
    fill: "var(--map-stable-fill)",
    symbol: "dot",
  },
  outbreak: {
    id: "outbreak",
    label: "Foyer actif",
    color: "var(--map-outbreak)",
    fill: "var(--map-outbreak-fill)",
    symbol: "dot",
  },
  critical: {
    id: "critical",
    label: "Critique",
    color: "var(--map-critical)",
    fill: "var(--map-critical-fill)",
    symbol: "circle",
  },
  none: {
    id: "none",
    label: "Sans intervention",
    color: "var(--map-stable)",
    fill: "var(--map-stable-fill)",
    symbol: "dot",
  },
  team: {
    id: "team",
    label: "Équipe médicale",
    color: "var(--map-team)",
    fill: "var(--map-team-fill)",
    symbol: "cross",
  },
  quarantine: {
    id: "quarantine",
    label: "Quarantaine",
    color: "var(--map-quarantine)",
    fill: "var(--map-quarantine-fill)",
    symbol: "diamond",
  },
  combined: {
    id: "combined",
    label: "Équipe + quarantaine",
    color: "var(--map-combined)",
    fill: "var(--map-combined-fill)",
    symbol: "combined",
  },
};
export function countryMapState(country, layer) {
  if (layer === "response") {
    const team = country?.teamUntil > 0,
      quarantine = country?.quarantineUntil > 0;
    return MAP_STATES[
      team && quarantine
        ? "combined"
        : team
          ? "team"
          : quarantine
            ? "quarantine"
            : "none"
    ];
  }
  return MAP_STATES[
    !country?.infected
      ? "stable"
      : country.infected / country.population > 0.01
        ? "critical"
        : "outbreak"
  ];
}
export const mapLegend = (layer) =>
  (layer === "response"
    ? ["none", "team", "quarantine", "combined"]
    : ["stable", "outbreak", "critical"]
  ).map((id) => MAP_STATES[id]);
export function directionalCountry(features, currentId, key) {
  const current = features.find((feature) => feature.id === currentId);
  if (!current?.center) return features[0]?.id;
  const direction = {
    ArrowRight: [1, 0],
    ArrowLeft: [-1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  }[key];
  if (!direction) return currentId;
  let best = currentId,
    bestScore = Infinity;
  for (const feature of features) {
    if (feature.id === currentId || !feature.center) continue;
    const dx = feature.center[0] - current.center[0],
      dy = feature.center[1] - current.center[1];
    const forward = dx * direction[0] + dy * direction[1],
      sideways = Math.abs(dx * direction[1] - dy * direction[0]);
    if (forward <= 0) continue;
    const score = Math.hypot(dx, dy) + sideways * 2;
    if (score < bestScore) {
      best = feature.id;
      bestScore = score;
    }
  }
  return best;
}
