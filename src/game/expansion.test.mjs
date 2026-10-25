import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGame, gameReducer } from "./engine.mjs";
import { SCENARIOS, scenarioObjective } from "./scenarios.mjs";
import { serializeGame, restoreGame } from "./storage.mjs";
import { preserveBeforeImport, RECOVERY_KEY } from "./recovery.mjs";
import { audioCue, readVolume } from "./audio.mjs";
const countries = JSON.parse(readFileSync(new URL("../data/pays.json", import.meta.url)));
function start(scenario) { return gameReducer(createGame(countries), { type: "START", countryId: "FR", difficulty: "MEDIUM", scenario }); }
test("scenarios preserve populations and define distinct resources and fronts", () => {
  for (const [id, config] of Object.entries(SCENARIOS)) {
    const state = start(id);
    assert.equal(state.globalStats.points, config.points);
    assert.equal(state.globalStats.trust, config.trust);
    assert.equal(state.countries.filter(c => c.infected > 0).length, config.fronts);
    for (const c of state.countries) assert.equal(c.infected + c.cured + c.dead + c.immune, c.population);
    const restored = restoreGame(serializeGame(state), countries, { strict: true });
    assert.equal(restored.scenario, id);
    assert.equal(restored.status, "PAUSED");
  }
  assert.equal(start().scenario, "containment");
  assert.equal(start("__proto__").status, "READY");
});
test("secondary objectives reflect the current situation without claiming victory", () => {
  const state = start("recovery");
  assert.equal(scenarioObjective(state).done, false);
  assert.equal(scenarioObjective({ ...state, globalStats: { ...state.globalStats, trust: 70 } }).done, true);
  assert.equal(scenarioObjective(start("crossroads")).done, false);
});
test("import preserves the actual current mission and validates before touching backup", () => {
  const values = new Map(), storage = { setItem: (k,v) => values.set(k,v) };
  const before = start("recovery"), imported = start("crossroads");
  const next = preserveBeforeImport(storage, before, serializeGame(imported), countries);
  assert.equal(next.scenario, "crossroads");
  assert.equal(restoreGame(values.get(RECOVERY_KEY), countries).scenario, "recovery");
  const oldBackup = values.get(RECOVERY_KEY);
  assert.throws(() => preserveBeforeImport(storage, before, "broken", countries));
  assert.equal(values.get(RECOVERY_KEY), oldBackup);
  assert.throws(() => preserveBeforeImport({ setItem() { throw Error("quota"); } }, before, serializeGame(imported), countries));
});
test("legacy scenario migration and unknown scenarios are validated", () => {
  const raw = JSON.parse(serializeGame(start())); delete raw.scenario;
  assert.equal(restoreGame(JSON.stringify(raw), countries, { strict: true }).scenario, "containment");
  raw.scenario = "__proto__";
  assert.throws(() => restoreGame(JSON.stringify(raw), countries, { strict: true }));
});
test("audio prioritizes terminal/research cues, suppresses restores and ignores ordinary days", () => {
  const previous = start(), next = gameReducer(previous, { type: "PURCHASE", id: "masks" });
  assert.equal(audioCue(previous, next), "order");
  assert.equal(audioCue(previous, { ...next, missionRevision: 1 }), null);
  assert.equal(audioCue(previous, { ...previous, status: "VICTORY" }), "ending");
  assert.equal(audioCue(previous, { ...previous, globalStats: { ...previous.globalStats, research: 100 } }), "research");
  assert.equal(audioCue(previous, previous), null);
  for (const raw of [null, "bad", "-1", "101"]) assert.equal(readVolume(raw), 0);
  assert.equal(readVolume("35"), 35);
});
