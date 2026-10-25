import { expiredInterventions, mergeExpiryAlerts } from "./strategy.mjs";
import { SCENARIOS, scenarioCountries } from "./scenarios.mjs";
export const REFORMS = {
  masks: {
    name: "Prévention collective",
    cost: 35,
    description: "Masques et dépistage : transmission −25 %.",
    effect: { infectionRate: 0.75 },
    category: "Prévention",
  },
  hospitals: {
    name: "Hôpitaux de campagne",
    cost: 65,
    description: "Mortalité −50 %, soins +40 %.",
    effect: { mortalityRate: 0.5, cureSpeed: 1.4 },
    category: "Soins",
  },
  borders_closed: {
    name: "Contrôle des frontières",
    cost: 90,
    description: "Propagation internationale −80 %.",
    effect: { travelRate: 0.2 },
    category: "Prévention",
  },
  vaccine_research: {
    name: "Programme vaccinal",
    cost: 100,
    description: "Lance la recherche du vaccin : +0,8 % par jour.",
    effect: { researchRate: 0.8 },
    category: "Recherche",
  },
  laboratories: {
    name: "Réseau de laboratoires",
    cost: 130,
    requires: "vaccine_research",
    description: "Accélère la recherche : +1,2 % par jour.",
    effect: { researchRate: 1.2 },
    category: "Recherche",
  },
  vaccine_deploy: {
    name: "Distribution mondiale",
    cost: 180,
    requires: "laboratories",
    description:
      "À 100 % de recherche : immunise 2 % des personnes vulnérables par jour et accélère les soins.",
    effect: { vaccinationRate: 0.02 },
    category: "Logistique",
  },
  support: {
    name: "Fonds de solidarité",
    cost: 80,
    description: "Confiance +15 et financement quotidien +30 %.",
    effect: { pointGeneration: 1.3 },
    category: "Économie",
  },
};
export const DIFFICULTY_LEVELS = {
  EASY: {
    name: "Découverte",
    description: "Des moyens renforcés pour apprendre.",
    infectionRate: 0.8,
    mortalityRate: 0.7,
    income: 9,
  },
  MEDIUM: {
    name: "Standard",
    description: "Chaque décision compte.",
    infectionRate: 1,
    mortalityRate: 1,
    income: 7,
  },
  HARD: {
    name: "Crise mondiale",
    description: "Une propagation rapide, un budget serré.",
    infectionRate: 1.35,
    mortalityRate: 1.5,
    income: 5,
  },
};
const sum = (countries) => ({
  totalPopulation: countries.reduce((s, c) => s + c.population, 0),
  totalInfected: countries.reduce((s, c) => s + c.infected, 0),
  totalCured: countries.reduce((s, c) => s + c.cured, 0),
  totalDead: countries.reduce((s, c) => s + c.dead, 0),
  totalImmune: countries.reduce((s, c) => s + c.immune, 0),
});
const countryNames = new Intl.DisplayNames(["fr"], { type: "region" });
export function createGame(countries) {
  const clean = countries.map((c) => ({
    ...c,
    name: countryNames.of(c.id) || c.name,
    infected: 0,
    cured: c.population,
    dead: 0,
    immune: 0,
    quarantineUntil: 0,
    teamUntil: 0,
    recentCases: [],
    lastDay: null,
  }));
  return {
    countries: clean,
    globalStats: {
      ...sum(clean),
      day: 0,
      points: 100,
      trust: 85,
      research: 0,
      delta: 0,
    },
    modifiers: {
      infectionRate: 1,
      cureSpeed: 1,
      mortalityRate: 1,
      travelRate: 1,
      pointGeneration: 1,
      researchRate: 0,
      vaccinationRate: 0,
    },
    unlockedReforms: [],
    status: "READY",
    speed: 1,
    difficulty: "MEDIUM",
    history: [],
    decisions: [],
    decisionHistoryComplete: true,
    expiryAlerts: [],
    missionRevision: 0,
    events: [
      {
        day: 0,
        text: "Centre de commandement prêt. Sélectionnez le foyer initial.",
      },
    ],
  };
}
const log = (state, text) =>
  [{ day: state.globalStats.day, text }, ...state.events].slice(0, 30);
const recordDecision = (state, text) => ({
  events: log(state, text),
  decisions: [{ day: state.globalStats.day, text }, ...(state.decisions || [])],
});
export function gameReducer(state, action) {
  const stats = state.globalStats;
  switch (action.type) {
    case "START": {
      const scenarioId = action.scenario || "containment";
      if (
        state.status !== "READY" ||
        !state.countries.some((c) => c.id === action.countryId) ||
        !Object.hasOwn(DIFFICULTY_LEVELS, action.difficulty) ||
        !Object.hasOwn(SCENARIOS, scenarioId)
      )
        return state;
      const scenario = SCENARIOS[scenarioId];
      const fronts = scenarioCountries(state.countries, action.countryId, scenario);
      const countries = state.countries.map((c) =>
        fronts.includes(c.id)
          ? {
              ...c,
              infected: Math.min(scenario.cases, c.population),
              cured: Math.max(0, c.population - scenario.cases),
            }
          : c,
      );
      return {
        ...state,
        countries,
        difficulty: action.difficulty,
        scenario: scenarioId,
        status: "RUNNING",
        globalStats: { ...stats, points: scenario.points, trust: scenario.trust, ...sum(countries) },
        ...recordDecision(
          state,
          `Foyer détecté : ${countries.find((c) => c.id === action.countryId).name}. Mobilisez la réponse.`,
        ),
      };
    }
    case "SPEED":
      return [1, 2, 4].includes(action.speed)
        ? { ...state, speed: action.speed }
        : state;
    case "PAUSE_IF_RUNNING":
      return state.status === "RUNNING"
        ? { ...state, status: "PAUSED" }
        : state;
    case "PAUSE":
      return ["RUNNING", "PAUSED"].includes(state.status)
        ? {
            ...state,
            status: state.status === "RUNNING" ? "PAUSED" : "RUNNING",
          }
        : state;
    case "PURCHASE": {
      const r = REFORMS[action.id];
      if (
        !["RUNNING", "PAUSED"].includes(state.status) ||
        !Object.hasOwn(REFORMS, action.id) ||
        stats.points < r.cost ||
        state.unlockedReforms.includes(action.id) ||
        (r.requires && !state.unlockedReforms.includes(r.requires))
      )
        return state;
      const modifiers = { ...state.modifiers };
      Object.entries(r.effect).forEach(
        ([k, v]) =>
          (modifiers[k] =
            k === "researchRate"
              ? modifiers[k] + v
              : k === "vaccinationRate"
                ? v
                : modifiers[k] * v),
      );
      return {
        ...state,
        modifiers,
        unlockedReforms: [...state.unlockedReforms, action.id],
        globalStats: {
          ...stats,
          points: stats.points - r.cost,
          trust: Math.min(
            100,
            stats.trust + (action.id === "support" ? 15 : 0),
          ),
        },
        ...recordDecision(state, `${r.name} : protocole activé.`),
      };
    }
    case "LOCAL": {
      const country = state.countries.find((c) => c.id === action.countryId),
        isTeam = action.kind === "team",
        cost = isTeam ? 30 : 20,
        key = isTeam ? "teamUntil" : "quarantineUntil";
      if (
        !["RUNNING", "PAUSED"].includes(state.status) ||
        !["team", "quarantine"].includes(action.kind) ||
        !country ||
        !country.infected ||
        country[key] > stats.day ||
        stats.points < cost
      )
        return state;
      return {
        ...state,
        status: stats.trust - (isTeam ? 0 : 3) <= 0 ? "DEFEAT" : state.status,
        expiryAlerts: (state.expiryAlerts || []).filter(
          (item) =>
            !(item.countryId === country.id && item.kind === action.kind),
        ),
        countries: state.countries.map((c) =>
          c.id === country.id
            ? { ...c, [key]: stats.day + (isTeam ? 10 : 14) }
            : c,
        ),
        globalStats: {
          ...stats,
          points: stats.points - cost,
          trust: Math.max(0, stats.trust - (isTeam ? 0 : 3)),
        },
        ...recordDecision(
          state,
          `${country.name} : ${isTeam ? "équipe médicale déployée pour 10 jours" : "quarantaine activée pour 14 jours"}.`,
        ),
      };
    }
    case "ACK_EXPIRY_ALERTS":
      return { ...state, expiryAlerts: [] };
    case "TICK": {
      if (state.status !== "RUNNING") return state;
      const day = stats.day + 1,
        m = state.modifiers,
        d = DIFFICULTY_LEVELS[state.difficulty];
      const research = Math.min(100, stats.research + m.researchRate);
      const sources = state.countries.filter(
        (c) => c.infected > 500 && c.quarantineUntil <= stats.day,
      );
      const countries = state.countries.map((c) => {
        let { infected, cured, dead, immune } = c;
        const quarantine = c.quarantineUntil > stats.day,
          team = c.teamUntil > stats.day;
        const exposure = sources.some(
          (s) => s.id !== c.id && s.neighbors?.includes(c.id),
        );
        const imported =
          exposure && !quarantine
            ? Math.min(cured, Math.ceil(14 * m.travelRate))
            : 0;
        const density =
          { LOW: 0.8, MEDIUM: 1, HIGH: 1.2, "VERY HIGH": 1.4 }[c.density] || 1;
        const climate = { TROPICAL: 1.15, COLD: 0.85 }[c.climate] || 1;
        const spread = Math.min(
          cured,
          Math.floor(
            (infected *
              0.16 *
              d.infectionRate *
              m.infectionRate *
              density *
              climate *
              (quarantine ? 0.3 : 1) *
              cured) /
              c.population,
          ) + imported,
        );
        infected += spread;
        cured -= spread;
        const recovered = Math.min(
          infected,
          Math.ceil(
            infected *
              (0.035 * m.cureSpeed +
                (team ? 0.13 : 0) +
                (research === 100
                  ? 0.12 + (m.vaccinationRate > 0 ? 0.035 * m.cureSpeed : 0)
                  : 0)),
          ),
        );
        infected -= recovered;
        immune += recovered;
        const deaths = Math.min(
          infected,
          Math.floor(
            infected *
              0.002 *
              d.mortalityRate *
              m.mortalityRate *
              (team ? 0.5 : 1),
          ),
        );
        infected -= deaths;
        dead += deaths;
        const vaccinated =
          research === 100
            ? Math.min(cured, Math.ceil(cured * m.vaccinationRate))
            : 0;
        cured -= vaccinated;
        immune += vaccinated;
        return {
          ...c,
          infected,
          cured,
          dead,
          immune,
          recentCases: [
            ...(c.recentCases?.length
              ? c.recentCases
              : [{ day: stats.day, infected: c.infected }]),
            { day, infected },
          ].slice(-8),
          lastDay: {
            day,
            newCases: spread,
            imported,
            recovered,
            deaths,
            vaccinated,
            team,
            quarantine,
          },
        };
      });
      const totals = sum(countries),
        quarantines = countries.filter(
          (c) => c.quarantineUntil > stats.day,
        ).length;
      const trust = Math.max(
        0,
        Math.min(
          100,
          stats.trust +
            0.04 -
            quarantines * 0.025 -
            (totals.totalInfected / totals.totalPopulation) * 1.8 -
            ((totals.totalDead - stats.totalDead) / totals.totalPopulation) *
              180,
        ),
      );
      const nextStats = {
        ...stats,
        ...totals,
        day,
        research,
        trust,
        points:
          stats.points +
          Math.max(
            1,
            Math.floor(d.income * m.pointGeneration * (trust > 30 ? 1 : 0.6)),
          ),
        delta: totals.totalInfected - stats.totalInfected,
      };
      let events = state.events;
      let decisions = state.decisions || [];
      if (day % 15 === 0)
        events = [
          {
            day,
            text: `Rapport : ${countries.filter((c) => c.infected > 0).length} pays touchés. Recherche à ${Math.floor(research)} %.`,
          },
          ...events,
        ];
      if (stats.research < 100 && research === 100) {
        const milestone = {
          day,
          text: "Vaccin validé. Les traitements accélèrent; activez la distribution mondiale.",
        };
        decisions = [milestone, ...decisions];
        events = [
          {
            day,
            text: "Vaccin validé. Les traitements accélèrent; activez la distribution mondiale.",
          },
          ...events,
        ];
      }
      const expired = expiredInterventions(countries, day);
      for (const item of expired) {
        const country = countries.find((c) => c.id === item.countryId);
        const entry = {
          day,
          text: `${country.name} : ${item.kind === "team" ? "équipe médicale arrivée à échéance" : "quarantaine arrivée à échéance"}.`,
        };
        events = [entry, ...events];
        decisions = [entry, ...decisions];
      }
      const attention = expired.filter(
        (item) => countries.find((c) => c.id === item.countryId).infected > 0,
      );
      const status =
        trust <= 0 || totals.totalDead >= totals.totalPopulation * 0.1
          ? "DEFEAT"
          : totals.totalInfected === 0
            ? "VICTORY"
            : day >= 365
              ? "DEFEAT"
              : "RUNNING";
      if (status === "VICTORY" || status === "DEFEAT") {
        const result = {
          day,
          text:
            status === "VICTORY"
              ? "Mission terminée : tous les foyers sont éliminés."
              : trust <= 0
                ? "Mission terminée : confiance publique épuisée."
                : totals.totalDead >= totals.totalPopulation * 0.1
                  ? "Mission terminée : seuil de décès atteint."
                  : "Mission terminée : échéance de 365 jours atteinte.",
        };
        events = [result, ...events];
        decisions = [result, ...decisions];
      }
      return {
        ...state,
        countries,
        globalStats: nextStats,
        status:
          status === "RUNNING" &&
          action.pauseOnExpiry === true &&
          attention.length
            ? "PAUSED"
            : status,
        expiryAlerts: attention.length
          ? mergeExpiryAlerts(
              state.expiryAlerts || [],
              attention.map((item) => ({
                ...item,
                autoPaused:
                  status === "RUNNING" && action.pauseOnExpiry === true,
              })),
            )
          : state.expiryAlerts || [],
        decisions,
        events: events.slice(0, 30),
        history: [
          ...state.history,
          { day, infected: totals.totalInfected },
        ].slice(-366),
      };
    }
    default:
      return state;
  }
}
