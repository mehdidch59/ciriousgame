export const SCENARIOS = {
  containment: { name: "Premier foyer", description: "Un foyer de 12 000 cas dans le pays choisi. 100 PC, confiance 85.", cases: 12000, points: 100, trust: 85, fronts: 1 },
  crossroads: { name: "Frontières sous pression", description: "Trois foyers : le pays choisi et jusqu’à deux voisins. 160 PC, confiance 85. Priorisez les frontières et les soins.", cases: 9000, points: 160, trust: 85, fronts: 3 },
  recovery: { name: "Confiance fragile", description: "Un foyer de 24 000 cas, 70 PC et confiance 40. Rétablissez le financement sans perdre le contrôle sanitaire.", cases: 24000, points: 70, trust: 40, fronts: 1 },
};
export function scenarioObjective(state) {
  if (state.scenario === "recovery") return { label: "Objectif secondaire : rétablir la confiance à 70 %", done: state.globalStats.trust >= 70 };
  if (state.scenario === "crossroads") return { label: "Objectif secondaire : ramener les foyers à un seul pays", done: state.countries.filter(c => c.infected > 0).length <= 1 };
  return { label: "Objectif secondaire : valider le vaccin", done: state.globalStats.research >= 100 };
}
export function scenarioCountries(countries, countryId, scenario) {
  const first = countries.find(c => c.id === countryId);
  return [countryId, ...(first?.neighbors || []).filter(id => countries.some(c => c.id === id))].slice(0, scenario.fronts);
}
