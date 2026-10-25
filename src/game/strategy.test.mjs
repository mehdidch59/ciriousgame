import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGame, gameReducer } from "./engine.mjs";
import {
  importMission,
  exportMission,
  missionReducer,
  MAX_SAVE_BYTES,
} from "./transfer.mjs";
import { compareCountries } from "./strategy.mjs";
import { restoreGame } from "./storage.mjs";
const countries = JSON.parse(
  readFileSync(new URL("../data/pays.json", import.meta.url)),
);
const start = () =>
  gameReducer(createGame(countries), {
    type: "START",
    countryId: "FR",
    difficulty: "MEDIUM",
  });
const ticks = (s, n, options = {}) => {
  for (let i = 0; i < n; i++) s = gameReducer(s, { type: "TICK", ...options });
  return s;
};
test("country triage distinguishes case count, prevalence and seven-day growth", () => {
  const a = {
      name: "Alpha",
      population: 1000,
      infected: 100,
      recentCases: [
        { day: 0, infected: 20 },
        { day: 7, infected: 100 },
      ],
    },
    b = {
      name: "Beta",
      population: 100000,
      infected: 1000,
      recentCases: [
        { day: 0, infected: 990 },
        { day: 7, infected: 1000 },
      ],
    };
  assert.deepEqual(
    [a, b].sort((x, y) => compareCountries(x, y, "cases")),
    [b, a],
  );
  assert.deepEqual(
    [a, b].sort((x, y) => compareCountries(x, y, "prevalence")),
    [a, b],
  );
  assert.deepEqual(
    [a, b].sort((x, y) => compareCountries(x, y, "growth")),
    [a, b],
  );
  const unknown = { ...b, recentCases: [] };
  assert.ok(compareCountries(unknown, a, "growth") > 0);
});
test("expiry pauses once only when enabled and a country still has cases", () => {
  const deployed = gameReducer(start(), {
    type: "LOCAL",
    countryId: "FR",
    kind: "team",
  });
  const stopped = ticks(deployed, 10, { pauseOnExpiry: true });
  assert.equal(stopped.status, "PAUSED");
  assert.equal(stopped.globalStats.day, 10);
  assert.equal(stopped.expiryAlerts.length, 1);
  assert.equal(stopped.expiryAlerts[0].kind, "team");
  assert.equal(stopped.expiryAlerts[0].autoPaused, true);
  assert.equal(
    gameReducer(stopped, { type: "TICK", pauseOnExpiry: true }),
    stopped,
  );
  const resumed = gameReducer(stopped, { type: "PAUSE" });
  assert.equal(ticks(resumed, 1, { pauseOnExpiry: true }).globalStats.day, 11);
  assert.equal(ticks(deployed, 10).status, "RUNNING");
  assert.equal(ticks(deployed, 10).expiryAlerts[0].autoPaused, false);
});
test("renewing a measure clears its alert and dismissal never spends resources", () => {
  let s = ticks(
    gameReducer(start(), { type: "LOCAL", countryId: "FR", kind: "team" }),
    10,
    { pauseOnExpiry: true },
  );
  const before = s.globalStats.points;
  s = gameReducer(s, { type: "LOCAL", countryId: "FR", kind: "team" });
  assert.equal(s.expiryAlerts.length, 0);
  assert.equal(s.globalStats.points, before - 30);
  const acknowledged = gameReducer(s, { type: "ACK_EXPIRY_ALERTS" });
  assert.deepEqual(acknowledged.globalStats, s.globalStats);
});
test("transfer validates before replacement and restores active games paused", () => {
  const s = ticks(start(), 4);
  const raw = exportMission(s);
  const imported = importMission(raw, countries);
  assert.equal(imported.status, "PAUSED");
  assert.deepEqual(imported.globalStats, s.globalStats);
  assert.equal(
    imported.countries.find((c) => c.id === "FR").infected,
    s.countries.find((c) => c.id === "FR").infected,
  );
  const changed = missionReducer(s, { type: "IMPORT", raw }, countries);
  assert.equal(changed.missionRevision, 1);
  assert.equal(changed.imported, true);
  assert.throws(() =>
    missionReducer(s, { type: "IMPORT", raw: '{"version":1}' }, countries),
  );
  assert.equal(s.globalStats.day, 4);
});
test("invalid, oversized and prototype-based save values are rejected", () => {
  assert.throws(() => importMission("not-json", countries));
  assert.throws(
    () => importMission(" ".repeat(MAX_SAVE_BYTES + 1), countries),
    /save-too-large/,
  );
  for (const field of ["difficulty", "unlockedReforms"]) {
    const data = JSON.parse(exportMission(start()));
    data[field] = field === "difficulty" ? "constructor" : ["constructor"];
    assert.throws(() => importMission(JSON.stringify(data), countries));
  }
  const corrupt = JSON.parse(exportMission(start()));
  corrupt.countries[0].infected = -1;
  assert.throws(() => importMission(JSON.stringify(corrupt), countries));
});
test("decision registry outlives recent events and survives export/import", () => {
  let s = start();
  s = {
    ...s,
    decisions: Array.from({ length: 50 }, (_, i) => ({
      day: 0,
      text: `Décision ${i}`,
    })),
  };
  s = gameReducer(s, { type: "PURCHASE", id: "masks" });
  s = ticks(s, 20);
  assert.ok(s.decisions.length > 50);
  assert.equal(s.decisions.at(-1).text, "Décision 49");
  assert.ok(s.events.length <= 30);
  const restored = importMission(exportMission(s), countries);
  assert.deepEqual(restored.decisions, s.decisions);
  assert.equal(restored.decisionHistoryComplete, true);
});
test("legacy saves recover surviving decisions without claiming a full history", () => {
  const data = JSON.parse(exportMission(ticks(start(), 3)));
  delete data.decisions;
  delete data.decisionHistoryComplete;
  const restored = importMission(JSON.stringify(data), countries);
  assert.equal(restored.decisionHistoryComplete, false);
  assert.ok(restored.decisions.some((e) => e.text.includes("Foyer détecté")));
  const invalid = JSON.parse(exportMission(start()));
  invalid.decisions = [{ day: 999, text: "future" }];
  assert.throws(() => importMission(JSON.stringify(invalid), countries));
  assert.equal(
    restoreGame(JSON.stringify(invalid), countries).status,
    "PAUSED",
  );
});
test("expired measures in resolved countries never pause and terminal outcomes take priority", () => {
  let s = gameReducer(start(), {
    type: "LOCAL",
    countryId: "FR",
    kind: "team",
  });
  s = ticks(s, 9);
  const resolved = {
    ...s,
    countries: s.countries.map((c) =>
      c.id === "FR" ? { ...c, immune: c.immune + c.infected, infected: 0 } : c,
    ),
  };
  const next = gameReducer(resolved, { type: "TICK", pauseOnExpiry: true });
  assert.notEqual(next.status, "PAUSED");
  assert.equal(next.expiryAlerts.length, 0);
  const terminal = gameReducer(
    {
      ...s,
      globalStats: { ...s.globalStats, day: 364 },
      countries: s.countries.map((c) =>
        c.id === "FR" ? { ...c, teamUntil: 365 } : c,
      ),
    },
    { type: "TICK", pauseOnExpiry: true },
  );
  assert.equal(terminal.status, "DEFEAT");
  assert.ok(terminal.decisions[0].text.includes("Mission terminée"));
});
test("import rejects impossible terminal status and malformed registry", () => {
  const data = JSON.parse(exportMission(start()));
  data.status = "DEFEAT";
  assert.throws(() => importMission(JSON.stringify(data), countries));
  data.status = "RUNNING";
  data.decisions = [
    { day: 0, text: "old" },
    { day: 1, text: "future" },
  ];
  assert.throws(() => importMission(JSON.stringify(data), countries));
});
test("portable saves exclude unrelated account metadata and unknown imported stats", () => {
  let s = start();
  s = {
    ...s,
    auth: { token: "never-export" },
    globalStats: { ...s.globalStats, accountPassword: "never-export" },
  };
  const raw = exportMission(s);
  assert.ok(!raw.includes("never-export"));
  const supplied = JSON.parse(raw);
  supplied.globalStats.extraPrivateField = "drop-me";
  const restored = importMission(JSON.stringify(supplied), countries);
  assert.equal(restored.globalStats.extraPrivateField, undefined);
});
