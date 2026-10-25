import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGame, gameReducer, REFORMS } from "./engine.mjs";
const countries = JSON.parse(
  readFileSync(new URL("../data/pays.json", import.meta.url)),
);
const start = (difficulty = "MEDIUM") =>
  gameReducer(createGame(countries), {
    type: "START",
    countryId: "FR",
    difficulty,
  });
const tick = (s) => gameReducer(s, { type: "TICK" });
const purchase = (s, id) => gameReducer(s, { type: "PURCHASE", id });
function conservation(state) {
  for (const c of state.countries) {
    for (const k of ["infected", "cured", "dead", "immune"])
      assert.ok(Number.isInteger(c[k]) && c[k] >= 0, `${c.id}: ${k}`);
    assert.equal(c.infected + c.cured + c.dead + c.immune, c.population);
  }
  assert.equal(
    state.globalStats.totalInfected,
    state.countries.reduce((s, c) => s + c.infected, 0),
  );
}
test("start validates inputs and synchronizes all totals immediately", () => {
  const state = start();
  assert.equal(state.globalStats.totalInfected, 12000);
  assert.equal(state.status, "RUNNING");
  assert.equal(
    gameReducer(state, { type: "START", countryId: "US", difficulty: "HARD" }),
    state,
  );
  const fresh = createGame(countries);
  assert.equal(
    gameReducer(fresh, {
      type: "START",
      countryId: "BAD",
      difficulty: "MEDIUM",
    }),
    fresh,
  );
  conservation(state);
});
test("pause and terminal states cannot tick or spend", () => {
  let state = gameReducer(start(), { type: "PAUSE" });
  assert.equal(tick(state), state);
  state = purchase(state, "masks");
  assert.ok(state.unlockedReforms.includes("masks"));
  assert.equal(tick(state), state);
  state = { ...state, status: "VICTORY" };
  assert.equal(purchase(state, "hospitals"), state);
  assert.equal(tick(state), state);
});
test("budget, prerequisites and duplicate purchase are enforced", () => {
  let s = start();
  assert.equal(purchase(s, "laboratories"), s);
  s = purchase(s, "vaccine_research");
  assert.equal(s.globalStats.points, 0);
  assert.equal(purchase(s, "masks"), s);
  assert.equal(purchase(s, "vaccine_research"), s);
});
test("local response costs resources, expires and cannot stack", () => {
  let s = start();
  s = gameReducer(s, { type: "LOCAL", countryId: "FR", kind: "quarantine" });
  assert.equal(s.globalStats.points, 80);
  assert.equal(s.globalStats.trust, 82);
  assert.equal(
    gameReducer(s, { type: "LOCAL", countryId: "FR", kind: "quarantine" }),
    s,
  );
  for (let i = 0; i < 14; i++) s = tick(s);
  assert.equal(s.globalStats.day, 14);
  assert.ok(s.countries.find((c) => c.id === "FR").quarantineUntil <= 14);
  conservation(s);
});
test("conservation and difficulty across extended uncontrolled outbreaks", () => {
  for (const difficulty of ["EASY", "MEDIUM", "HARD"]) {
    let s = start(difficulty);
    for (let day = 0; day < 700; day++) {
      s = tick(s);
      conservation(s);
    }
    assert.ok(["VICTORY", "DEFEAT"].includes(s.status));
  }
});
test("funded response can finish vaccine, distribute it and win", () => {
  let s = start("HARD");
  s = { ...s, globalStats: { ...s.globalStats, points: 2000 } };
  for (const id of Object.keys(REFORMS)) s = purchase(s, id);
  for (let i = 0; i < 700 && s.status === "RUNNING"; i++) {
    s = tick(s);
    conservation(s);
  }
  assert.equal(s.globalStats.research, 100);
  assert.equal(s.status, "VICTORY");
  assert.equal(s.globalStats.totalInfected, 0);
  assert.ok(s.globalStats.totalImmune > 0);
});
test("a zero-trust or high-mortality crisis ends in defeat", () => {
  let s = start();
  s = tick({
    ...s,
    globalStats: { ...s.globalStats, trust: 0 },
    countries: s.countries.map((c) => ({ ...c, quarantineUntil: 50 })),
  });
  assert.equal(s.status, "DEFEAT");
});
test("deadline ends an unresolved mission on day 365", () => {
  const s = start();
  const result = tick({ ...s, globalStats: { ...s.globalStats, day: 364 } });
  assert.equal(result.globalStats.day, 365);
  assert.equal(result.status, "DEFEAT");
});
