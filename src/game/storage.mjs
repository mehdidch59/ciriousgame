import {
  createGame,
  gameReducer,
  REFORMS,
  DIFFICULTY_LEVELS,
} from "./engine.mjs";
import { restoreRegionalObservation } from "./learning.mjs";
import { SCENARIOS } from "./scenarios.mjs";
export const SAVE_KEY = "cirious.mission.v1";
const STAT_FIELDS = [
  "day",
  "points",
  "trust",
  "research",
  "delta",
  "totalPopulation",
  "totalInfected",
  "totalCured",
  "totalImmune",
  "totalDead",
];
export function serializeGame(state) {
  return JSON.stringify({
    version: 1,
    status: state.status,
    difficulty: state.difficulty,
    scenario: state.scenario || "containment",
    speed: state.speed,
    globalStats: Object.fromEntries(
      STAT_FIELDS.map((key) => [key, state.globalStats[key]]),
    ),
    unlockedReforms: state.unlockedReforms,
    countries: state.countries.map(
      ({
        id,
        infected,
        cured,
        immune,
        dead,
        quarantineUntil,
        teamUntil,
        recentCases,
        lastDay,
      }) => ({
        id,
        infected,
        cured,
        immune,
        dead,
        quarantineUntil,
        teamUntil,
        recentCases,
        lastDay,
      }),
    ),
    decisions: state.decisions,
    decisionHistoryComplete: state.decisionHistoryComplete,
    expiryAlerts: state.expiryAlerts,
    history: state.history,
    events: state.events,
  });
}
const integer = (n, max = Number.MAX_SAFE_INTEGER) =>
  Number.isSafeInteger(n) && n >= 0 && n <= max;
export function restoreGame(raw, countries, { strict = false } = {}) {
  const fresh = createGame(countries);
  const invalid = () => {
    if (strict) throw Error("invalid-save");
    return fresh;
  };
  try {
    const saved = JSON.parse(raw);
    if (
      saved?.version !== 1 ||
      !["READY", "RUNNING", "PAUSED", "VICTORY", "DEFEAT"].includes(
        saved.status,
      ) ||
      !Object.hasOwn(DIFFICULTY_LEVELS, saved.difficulty) ||
      (saved.scenario !== undefined && !Object.hasOwn(SCENARIOS, saved.scenario)) ||
      ![1, 2, 4].includes(saved.speed)
    )
      return invalid();
    const s = saved.globalStats;
    if (
      !s ||
      !integer(s.day, 365) ||
      !integer(s.points, 1000000) ||
      !Number.isFinite(s.trust) ||
      s.trust < 0 ||
      s.trust > 100 ||
      !Number.isFinite(s.research) ||
      s.research < 0 ||
      s.research > 100 ||
      !Number.isSafeInteger(s.delta)
    )
      return invalid();
    if (
      !Array.isArray(saved.unlockedReforms) ||
      new Set(saved.unlockedReforms).size !== saved.unlockedReforms.length ||
      saved.unlockedReforms.some(
        (id) =>
          !Object.hasOwn(REFORMS, id) ||
          (REFORMS[id].requires &&
            !saved.unlockedReforms.includes(REFORMS[id].requires)),
      )
    )
      return invalid();
    if (
      !Array.isArray(saved.countries) ||
      saved.countries.length !== countries.length ||
      new Set(saved.countries.map((c) => c.id)).size !== countries.length
    )
      return invalid();
    const index = new Map(saved.countries.map((c) => [c.id, c]));
    const restoredCountries = fresh.countries.map((c) => {
      const row = index.get(c.id);
      if (
        !row ||
        ["infected", "cured", "immune", "dead"].some(
          (key) => !integer(row[key], c.population),
        ) ||
        row.infected + row.cured + row.immune + row.dead !== c.population ||
        !integer(row.teamUntil, 379) ||
        !integer(row.quarantineUntil, 379)
      )
        throw Error("Invalid population");
      return {
        ...c,
        ...restoreRegionalObservation(row, s.day, c.population),
        infected: row.infected,
        cured: row.cured,
        immune: row.immune,
        dead: row.dead,
        teamUntil: row.teamUntil,
        quarantineUntil: row.quarantineUntil,
      };
    });
    // Reconstruct effects from known protocols; ignore saved multipliers.
    let effects = {
      ...fresh,
      status: "PAUSED",
      globalStats: { ...fresh.globalStats, points: 1000000 },
    };
    const pending = new Set(saved.unlockedReforms);
    for (let i = 0; i < Object.keys(REFORMS).length; i++)
      for (const id of pending) {
        if (
          !REFORMS[id].requires ||
          effects.unlockedReforms.includes(REFORMS[id].requires)
        ) {
          effects = gameReducer(effects, { type: "PURCHASE", id });
          pending.delete(id);
        }
      }
    const totals = {
      totalPopulation: fresh.globalStats.totalPopulation,
      totalInfected: 0,
      totalCured: 0,
      totalImmune: 0,
      totalDead: 0,
    };
    for (const c of restoredCountries) {
      totals.totalInfected += c.infected;
      totals.totalCured += c.cured;
      totals.totalImmune += c.immune;
      totals.totalDead += c.dead;
    }
    if (
      saved.status === "READY" &&
      (s.day !== 0 ||
        totals.totalInfected ||
        totals.totalDead ||
        totals.totalImmune ||
        saved.unlockedReforms.length)
    )
      return invalid();
    if (saved.status === "VICTORY" && totals.totalInfected !== 0)
      return invalid();
    if (
      strict &&
      saved.status === "DEFEAT" &&
      s.trust > 0 &&
      totals.totalDead < totals.totalPopulation * 0.1 &&
      s.day < 365
    )
      return invalid();
    if (
      ["RUNNING", "PAUSED"].includes(saved.status) &&
      (totals.totalInfected === 0 ||
        s.trust <= 0 ||
        s.day >= 365 ||
        totals.totalDead >= totals.totalPopulation * 0.1)
    )
      return invalid();
    const history = Array.isArray(saved.history)
      ? saved.history
          .filter(
            (h) =>
              integer(h.day, s.day) &&
              integer(h.infected, totals.totalPopulation),
          )
          .slice(-366)
      : [];
    const events = Array.isArray(saved.events)
      ? saved.events
          .filter(
            (e) =>
              integer(e.day, s.day) &&
              typeof e.text === "string" &&
              e.text.length <= 500,
          )
          .slice(0, 30)
      : fresh.events;
    const legacyDecisions = events.filter(
      (e) => !e.text.startsWith("Rapport :"),
    );
    let decisions = legacyDecisions;
    let decisionHistoryComplete = saved.status === "READY";
    if (saved.decisions !== undefined) {
      const valid =
        Array.isArray(saved.decisions) &&
        saved.decisions.length <= 10000 &&
        saved.decisions.every(
          (e, i) =>
            e &&
            integer(e.day, s.day) &&
            typeof e.text === "string" &&
            e.text.length > 0 &&
            e.text.length <= 500 &&
            (i === 0 || e.day <= saved.decisions[i - 1].day),
        );
      if (!valid && strict) return invalid();
      if (valid) {
        decisions = saved.decisions.map(({ day, text }) => ({ day, text }));
        decisionHistoryComplete = saved.decisionHistoryComplete === true;
      }
    }
    const expiryAlerts = Array.isArray(saved.expiryAlerts)
      ? saved.expiryAlerts
          .slice(0, countries.length * 2)
          .filter((item) => {
            const c =
              item && restoredCountries.find((c) => c.id === item.countryId);
            return (
              c &&
              ["team", "quarantine"].includes(item.kind) &&
              integer(item.day, s.day) &&
              item.day > 0 &&
              c[item.kind === "team" ? "teamUntil" : "quarantineUntil"] ===
                item.day
            );
          })
          .map(({ day, countryId, kind, autoPaused }) => ({
            day,
            countryId,
            kind,
            autoPaused: autoPaused === true,
          }))
          .filter(
            (item, i, list) =>
              list.findIndex(
                (other) =>
                  other.countryId === item.countryId &&
                  other.kind === item.kind,
              ) === i,
          )
      : [];
    return {
      ...fresh,
      countries: restoredCountries,
      globalStats: {
        ...totals,
        day: s.day,
        points: s.points,
        trust: s.trust,
        research: s.research,
        delta: s.delta,
      },
      modifiers: effects.modifiers,
      unlockedReforms: effects.unlockedReforms,
      status: saved.status === "RUNNING" ? "PAUSED" : saved.status,
      speed: saved.speed,
      difficulty: saved.difficulty,
      scenario: saved.scenario || "containment",
      history,
      events,
      decisions,
      decisionHistoryComplete,
      expiryAlerts,
      restored: saved.status !== "READY",
    };
  } catch {
    return invalid();
  }
}
