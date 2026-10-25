import { regionalTrend } from "./learning.mjs";
export const COUNTRY_SORTS = {
  cases: "Cas actifs",
  prevalence: "Population touchée (%)",
  growth: "Progression sur 7 jours",
};
export function compareCountries(a, b, sort = "cases") {
  let difference;
  if (sort === "prevalence")
    difference = b.infected / b.population - a.infected / a.population;
  else if (sort === "growth") {
    const ta = regionalTrend(a),
      tb = regionalTrend(b);
    const knownA = ta?.days === 7,
      knownB = tb?.days === 7;
    if (knownA !== knownB) return knownA ? -1 : 1;
    difference = knownA ? tb.delta - ta.delta : b.infected - a.infected;
  } else difference = b.infected - a.infected;
  return difference || a.name.localeCompare(b.name, "fr");
}
export function expiredInterventions(countries, day) {
  return countries.flatMap((c) =>
    ["team", "quarantine"]
      .filter(
        (kind) => c[kind === "team" ? "teamUntil" : "quarantineUntil"] === day,
      )
      .map((kind) => ({ day, countryId: c.id, kind })),
  );
}
export function mergeExpiryAlerts(previous, incoming) {
  const map = new Map();
  for (const item of [...incoming, ...previous]) {
    const key = `${item.countryId}-${item.kind}`;
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}
