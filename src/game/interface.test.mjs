import test from "node:test";
import assert from "node:assert/strict";
import {
  pushScreen,
  popScreen,
  readPreferences,
  serializePreferences,
  researchDaysRemaining,
  countryMapState,
  mapLegend,
  directionalCountry,
} from "./interface.mjs";
test("navigation retains a single history and returns through previous panels", () => {
  let h = pushScreen(["map"], "research");
  h = pushScreen(h, "countries");
  assert.deepEqual(popScreen(h), ["map", "research"]);
  assert.deepEqual(pushScreen(h, "research"), ["map", "research"]);
  assert.deepEqual(pushScreen(h, "map"), ["map"]);
  assert.deepEqual(popScreen(["map"]), ["map"]);
  assert.equal(pushScreen(h, "invalid"), h);
});
test("preferences survive serialization and reject invalid or incompatible settings", () => {
  const prefs = { textScale: 200, reducedMotion: true, pauseOnExpiry: true };
  assert.deepEqual(readPreferences(serializePreferences(prefs)), prefs);
  assert.deepEqual(readPreferences("broken", true), {
    textScale: 100,
    reducedMotion: true,
    pauseOnExpiry: false,
  });
  assert.deepEqual(
    readPreferences('{"version":1,"textScale":999,"reducedMotion":"no"}'),
    { textScale: 100, reducedMotion: false, pauseOnExpiry: false },
  );
  assert.deepEqual(readPreferences('{"version":2,"textScale":200}'), {
    textScale: 100,
    reducedMotion: false,
    pauseOnExpiry: false,
  });
});
test("intervention symbols and legend share semantics without infection leakage", () => {
  const c = { population: 100, infected: 90, teamUntil: 0, quarantineUntil: 0 };
  assert.equal(countryMapState(c, "response").id, "none");
  for (const [team, quarantine, id] of [
    [5, 0, "team"],
    [0, 5, "quarantine"],
    [5, 5, "combined"],
  ]) {
    const state = countryMapState(
      { ...c, teamUntil: team, quarantineUntil: quarantine },
      "response",
    );
    assert.equal(state.id, id);
    assert.ok(mapLegend("response").includes(state));
  }
  assert.equal(countryMapState(c, "infection").id, "critical");
  assert.equal(
    countryMapState({ ...c, infected: 1 }, "infection").id,
    "outbreak",
  );
  assert.equal(
    countryMapState({ ...c, infected: 0 }, "infection").id,
    "stable",
  );
});
test("map arrows select spatial neighbors and stay at boundaries", () => {
  const f = [
    { id: "a", center: [0, 0] },
    { id: "b", center: [10, 0] },
    { id: "c", center: [1, 10] },
  ];
  assert.equal(directionalCountry(f, "a", "ArrowRight"), "b");
  assert.equal(directionalCountry(f, "a", "ArrowDown"), "c");
  assert.equal(directionalCountry(f, "a", "ArrowLeft"), "a");
  assert.equal(directionalCountry(f, "b", "ArrowLeft"), "a");
});
test("research estimates round up without floating point extra days", () => {
  assert.equal(researchDaysRemaining(0, 0), null);
  assert.equal(researchDaysRemaining(100, 0), 0);
  assert.equal(researchDaysRemaining(99, 0.8), 2);
  assert.equal(researchDaysRemaining(98.4, 0.8), 2);
});
