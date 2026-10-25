import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGame, gameReducer } from "./engine.mjs";
import { restoreGame, serializeGame } from "./storage.mjs";
const countries = JSON.parse(
  readFileSync(new URL("../data/pays.json", import.meta.url)),
);
const start = () =>
  gameReducer(createGame(countries), {
    type: "START",
    countryId: "FR",
    difficulty: "MEDIUM",
  });
test("running mission restores paused with identical population, budget and protocol effects", () => {
  let s = start();
  s = gameReducer(s, { type: "PURCHASE", id: "masks" });
  s = gameReducer(s, { type: "LOCAL", countryId: "FR", kind: "team" });
  s = gameReducer(s, { type: "TICK" });
  const restored = restoreGame(serializeGame(s), countries);
  assert.equal(restored.status, "PAUSED");
  assert.equal(restored.restored, true);
  assert.deepEqual(restored.countries, s.countries);
  assert.deepEqual(restored.globalStats, s.globalStats);
  assert.deepEqual(restored.modifiers, s.modifiers);
});
test("missing, malformed and older-version saves start a fresh mission", () => {
  for (const raw of [null, "{broken", "{}", '{"version":0}'])
    assert.equal(restoreGame(raw, countries).status, "READY");
});
test("corrupted population, negative resources and invalid protocols are rejected", () => {
  for (const mutate of [
    (s) => (s.countries[0].infected = -1),
    (s) => s.countries[0].cured++,
    (s) => (s.globalStats.points = -1),
    (s) => (s.unlockedReforms = ["laboratories"]),
    (s) => (s.countries[1].id = s.countries[0].id),
  ]) {
    const saved = JSON.parse(serializeGame(start()));
    mutate(saved);
    assert.equal(restoreGame(JSON.stringify(saved), countries).status, "READY");
  }
});
test("restore derives totals from countries and never trusts arbitrary effects", () => {
  const saved = JSON.parse(serializeGame(start()));
  saved.globalStats.totalInfected = 999;
  saved.modifiers = { infectionRate: 99 };
  const s = restoreGame(JSON.stringify(saved), countries);
  assert.equal(s.globalStats.totalInfected, 12000);
  assert.equal(s.modifiers.infectionRate, 1);
});
test("fresh mission and terminal result remain stable when restored", () => {
  assert.equal(
    restoreGame(serializeGame(createGame(countries)), countries).status,
    "READY",
  );
  const s = { ...start(), status: "DEFEAT" };
  assert.equal(restoreGame(serializeGame(s), countries).status, "DEFEAT");
});
test("visibility pause only pauses a running game and never resumes it", () => {
  const s = start();
  const paused = gameReducer(s, { type: "PAUSE_IF_RUNNING" });
  assert.equal(paused.status, "PAUSED");
  assert.equal(gameReducer(paused, { type: "PAUSE_IF_RUNNING" }), paused);
});
test("a quarantine exhausting trust causes immediate defeat, including while paused", () => {
  const s = { ...start(), status: "PAUSED" };
  s.globalStats = { ...s.globalStats, trust: 2 };
  const result = gameReducer(s, {
    type: "LOCAL",
    countryId: "FR",
    kind: "quarantine",
  });
  assert.equal(result.status, "DEFEAT");
  assert.equal(result.globalStats.trust, 0);
});
test("vaccine distribution has no treatment or vaccination effect before research completes", () => {
  let s = start();
  s.globalStats = { ...s.globalStats, points: 1000 };
  for (const id of ["vaccine_research", "laboratories"])
    s = gameReducer(s, { type: "PURCHASE", id });
  const funded = gameReducer(s, { type: "PURCHASE", id: "vaccine_deploy" });
  assert.equal(funded.modifiers.cureSpeed, s.modifiers.cureSpeed);
  const a = gameReducer(s, { type: "TICK" }),
    b = gameReducer(funded, { type: "TICK" });
  assert.deepEqual(a.countries, b.countries);
});
test("saved missions retain more than 90 days of available history", () => {
  let game = start();
  game = {
    ...game,
    globalStats: { ...game.globalStats, day: 120 },
    history: Array.from({ length: 120 }, (_, i) => ({
      day: i + 1,
      infected: game.globalStats.totalInfected,
    })),
  };
  const restored = restoreGame(serializeGame(game), countries);
  assert.equal(restored.history.length, 120);
  assert.equal(restored.history[0].day, 1);
});
