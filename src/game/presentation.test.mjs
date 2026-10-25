import test from "node:test";
import assert from "node:assert/strict";
import { actionFeedback, regionalRisk } from "./presentation.mjs";
const base = {
  status: "PAUSED",
  globalStats: { day: 5, points: 100, research: 0 },
  unlockedReforms: [],
  countries: [
    {
      id: "FR",
      name: "France",
      infected: 100,
      population: 10000,
      teamUntil: 0,
      quarantineUntil: 0,
    },
  ],
};
test("feedback follows accepted orders and never rejected or passive ticks", () => {
  assert.equal(actionFeedback(base, base), null);
  assert.equal(
    actionFeedback(base, {
      ...base,
      globalStats: { ...base.globalStats, day: 6, points: 107 },
    }),
    null,
  );
  const next = {
    ...base,
    globalStats: { ...base.globalStats, points: 70 },
    countries: [{ ...base.countries[0], teamUntil: 15 }],
  };
  assert.deepEqual(actionFeedback(base, next), {
    kind: "team",
    countryId: "FR",
    name: "France",
    spent: 30,
    days: 10,
  });
  assert.equal(actionFeedback({ ...base, status: "READY" }, next), null);
});
test("protocol purchase and vaccine validation report distinct milestones", () => {
  assert.deepEqual(
    actionFeedback(base, {
      ...base,
      globalStats: { ...base.globalStats, points: 0 },
      unlockedReforms: ["vaccine_research"],
    }),
    { kind: "protocol", reform: "vaccine_research", spent: 100 },
  );
  assert.deepEqual(
    actionFeedback(base, {
      ...base,
      globalStats: { ...base.globalStats, research: 100 },
    }),
    { kind: "vaccine" },
  );
});
test("country risk uses population proportion and handles zero cases", () => {
  assert.equal(regionalRisk(base.countries[0]).level, "outbreak");
  assert.equal(
    regionalRisk({ ...base.countries[0], infected: 101 }).level,
    "critical",
  );
  assert.equal(
    regionalRisk({ ...base.countries[0], infected: 0 }).level,
    "stable",
  );
});
import {
  missionMilestones,
  missionObjective,
  missionDebrief,
} from "./presentation.mjs";
test("milestones verify facts independently, including victory without vaccine", () => {
  const victory = {
    ...base,
    status: "VICTORY",
    globalStats: { ...base.globalStats, totalInfected: 0 },
  };
  assert.deepEqual(
    missionMilestones(victory).map((m) => m.done),
    [false, false, false, true],
  );
  const prepaid = {
    ...base,
    unlockedReforms: ["vaccine_research", "laboratories", "vaccine_deploy"],
    globalStats: { ...base.globalStats, research: 99, totalInfected: 20 },
  };
  assert.deepEqual(
    missionMilestones(prepaid).map((m) => m.done),
    [true, false, false, false],
  );
});
test("objectives lead to active countries or missing research as appropriate", () => {
  assert.equal(missionObjective(base).target, "research");
  const funded = { ...base, unlockedReforms: ["vaccine_research"] };
  assert.equal(missionObjective(funded).target, "countries");
  const validated = {
    ...funded,
    globalStats: { ...funded.globalStats, research: 100 },
  };
  assert.equal(missionObjective(validated).target, "research");
  assert.equal(
    missionObjective({
      ...validated,
      unlockedReforms: ["vaccine_research", "laboratories", "vaccine_deploy"],
    }).target,
    "countries",
  );
  assert.equal(missionObjective({ ...base, status: "DEFEAT" }).target, null);
});
test("debrief reports the recorded peak and honest historical coverage", () => {
  const state = {
    ...base,
    status: "DEFEAT",
    globalStats: {
      ...base.globalStats,
      day: 365,
      totalInfected: 50,
      totalPopulation: 10000,
      totalDead: 20,
      trust: 60,
    },
    history: [
      { day: 276, infected: 1000 },
      { day: 300, infected: 1500 },
      { day: 365, infected: 50 },
    ],
    events: [
      { day: 364, text: "Rapport : 1 pays touché." },
      { day: 320, text: "Vaccin validé." },
    ],
  };
  const report = missionDebrief(state);
  assert.deepEqual(report.peak, { day: 300, infected: 1500 });
  assert.equal(report.firstDay, 276);
  assert.equal(report.events.length, 1);
  assert.match(report.reason, /365/);
  assert.equal(report.affected, 1);
  assert.match(
    missionDebrief({
      ...state,
      globalStats: { ...state.globalStats, trust: 0 },
    }).reason,
    /confiance/,
  );
});
