import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGame, gameReducer } from "./engine.mjs";
import { serializeGame, restoreGame } from "./storage.mjs";
import {
  guideStep,
  regionalTrend,
  restoreRegionalObservation,
} from "./learning.mjs";
const countries = JSON.parse(
  readFileSync(new URL("../data/pays.json", import.meta.url)),
);
const start = () =>
  gameReducer(createGame(countries), {
    type: "START",
    countryId: "FR",
    difficulty: "MEDIUM",
  });
test("optional guide advances only on actual accepted game actions", () => {
  const ready = createGame(countries);
  assert.equal(guideStep(ready, false), "select");
  assert.equal(guideStep(ready, true), "launch");
  let s = start();
  assert.equal(guideStep(s, true), "intervene");
  const rejected = gameReducer(
    { ...s, globalStats: { ...s.globalStats, points: 0 } },
    { type: "LOCAL", countryId: "FR", kind: "team" },
  );
  assert.equal(guideStep(rejected, true), "intervene");
  s = gameReducer(s, { type: "LOCAL", countryId: "FR", kind: "team" });
  assert.equal(guideStep(s, true), "finance");
  s = gameReducer(s, { type: "PURCHASE", id: "masks" });
  assert.equal(guideStep(s, true), "complete");
  assert.equal(guideStep({ ...s, status: "DEFEAT" }, true), "ended");
});
test("daily observations reconcile with actual population changes", () => {
  const before = start(),
    after = gameReducer(before, { type: "TICK" });
  for (const c of after.countries) {
    const old = before.countries.find((p) => p.id === c.id),
      d = c.lastDay;
    assert.equal(
      c.infected - old.infected,
      d.newCases - d.recovered - d.deaths,
    );
    assert.equal(c.immune - old.immune, d.recovered + d.vaccinated);
    assert.equal(c.dead - old.dead, d.deaths);
    assert.equal(old.cured - c.cured, d.newCases + d.vaccinated);
  }
  const c = after.countries.find((c) => c.id === "FR");
  assert.equal(regionalTrend(c).days, 1);
  assert.equal(
    regionalTrend(c).delta,
    c.infected - before.countries.find((c) => c.id === "FR").infected,
  );
});
test("trends retain seven days and survive a validated save reload", () => {
  let s = start();
  for (let i = 0; i < 12; i++) s = gameReducer(s, { type: "TICK" });
  assert.equal(s.countries[0].recentCases.length, 8);
  assert.equal(regionalTrend(s.countries[0]).days, 7);
  const restored = restoreGame(serializeGame(s), countries);
  assert.equal(restored.status, "PAUSED");
  assert.deepEqual(
    restored.countries.map((c) => c.lastDay),
    s.countries.map((c) => c.lastDay),
  );
  assert.deepEqual(
    restored.countries.map((c) => c.recentCases),
    s.countries.map((c) => c.recentCases),
  );
});
test("legacy or corrupt derived observations do not erase the mission", () => {
  assert.deepEqual(restoreRegionalObservation({ infected: 10 }, 3, 100), {
    recentCases: [],
    lastDay: null,
  });
  let s = gameReducer(start(), { type: "TICK" });
  const raw = JSON.parse(serializeGame(s));
  raw.countries[0].recentCases = [{ day: 1, infected: 999999999999 }];
  raw.countries[0].lastDay = { day: 1, newCases: -5 };
  const restored = restoreGame(JSON.stringify(raw), countries);
  assert.equal(restored.globalStats.day, 1);
  assert.deepEqual(restored.countries[0].recentCases, []);
  assert.equal(restored.countries[0].lastDay, null);
  assert.equal(
    restored.countries.find((c) => c.id === "FR").infected,
    s.countries.find((c) => c.id === "FR").infected,
  );
});
test("observations identify the measures active during the elapsed day", () => {
  let s = gameReducer(start(), {
    type: "LOCAL",
    countryId: "FR",
    kind: "team",
  });
  for (let i = 0; i < 10; i++) s = gameReducer(s, { type: "TICK" });
  let c = s.countries.find((c) => c.id === "FR");
  assert.equal(c.teamUntil, s.globalStats.day);
  assert.equal(c.lastDay.team, true);
  s = gameReducer(s, { type: "TICK" });
  c = s.countries.find((c) => c.id === "FR");
  assert.equal(c.lastDay.team, false);
});
