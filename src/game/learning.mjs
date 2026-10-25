export function guideStep(state, selected) {
  if (["VICTORY", "DEFEAT"].includes(state.status)) return "ended";
  if (state.status === "READY") return selected ? "launch" : "select";
  if (!state.countries.some((c) => c.teamUntil > 0 || c.quarantineUntil > 0))
    return "intervene";
  return state.unlockedReforms.length ? "complete" : "finance";
}
export function regionalTrend(country) {
  const history = country.recentCases || [];
  if (history.length < 2) return null;
  const first = history[0],
    last = history.at(-1);
  if (last.day <= first.day) return null;
  return {
    delta: last.infected - first.infected,
    days: last.day - first.day,
    fromDay: first.day,
    toDay: last.day,
    history,
  };
}
export function restoreRegionalObservation(row, day, population) {
  const integer = (n) => Number.isSafeInteger(n) && n >= 0 && n <= population;
  const history = row.recentCases;
  const valid =
    Array.isArray(history) &&
    history.length <= 8 &&
    history.length > 0 &&
    history.every(
      (h, i) =>
        h &&
        Number.isInteger(h.day) &&
        h.day >= 0 &&
        h.day <= day &&
        integer(h.infected) &&
        (i === 0 || h.day === history[i - 1].day + 1),
    ) &&
    history.at(-1).day === day &&
    history.at(-1).infected === row.infected;
  const observation = row.lastDay;
  const lastDay =
    valid &&
    history.length > 1 &&
    observation &&
    observation.day === day &&
    day > 0 &&
    ["newCases", "imported", "recovered", "deaths", "vaccinated"].every((k) =>
      integer(observation[k]),
    ) &&
    observation.imported <= observation.newCases &&
    row.infected - history.at(-2).infected ===
      observation.newCases - observation.recovered - observation.deaths &&
    typeof observation.team === "boolean" &&
    typeof observation.quarantine === "boolean"
      ? observation
      : null;
  return { recentCases: valid ? history : [], lastDay };
}
