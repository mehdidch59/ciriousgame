import { useReducer, useEffect, useCallback, useMemo } from 'react';
import initialCountries from '../data/pays.json';

const initialState = {
    countries: initialCountries,
    globalStats: {
        totalPopulation: initialCountries.reduce((acc, c) => acc + c.population, 0),
        totalInfected: 0,
        totalCured: initialCountries.reduce((acc, c) => acc + c.population, 0),
        totalDead: 0,
        day: 0,
        points: 50, // Start with 50 points
    },
    modifiers: {
        infectionRate: 1.0,
        cureSpeed: 1.0,
        mortalityRate: 1.0,
        pointGeneration: 1.0
    },
    unlockedReforms: [],
    status: 'SIMULATION PAUSED'
};

// Reforms Database with Export
export const REFORMS = {
    masks: {
        id: 'masks',
        name: 'Mandat de Masques',
        cost: 50,
        description: 'Ralentit la propagation de 20%.',
        effect: { infectionRate: 0.8 }
    },
    lockdown: {
        id: 'lockdown',
        name: 'Confinement National',
        cost: 150,
        description: 'Ralentit fortement la propagation (-60%) mais réduit les points.',
        effect: { infectionRate: 0.4, pointGeneration: 0.5 }
    },
    vaccine_research: {
        id: 'vaccine_research',
        name: 'Recherche Vaccinale I',
        cost: 200,
        description: 'Augmente la vitesse de guérison de +50%.',
        effect: { cureSpeed: 1.5 }
    },
    vaccine_deploy: {
        id: 'vaccine_deploy',
        name: 'Déploiement Massif',
        cost: 500,
        description: 'Vitesse de guérison +200%.',
        effect: { cureSpeed: 3.0 }
    },
    borders_closed: {
        id: 'borders_closed',
        name: 'Fermeture des Frontières',
        cost: 300,
        description: 'Stoppe presque toute propagation entre pays.',
        effect: { infectionRate: 0.1 }
    }
};

const SPREAD_RATE = 0.05;
const CURE_RATE = 0.01;
const MORTALITY_RATE = 0.001;
const POINTS_PER_TICK = 5;

const DENSITY_MODIFIERS = { LOW: 0.8, MEDIUM: 1.0, HIGH: 1.2, "VERY HIGH": 1.5 };
const CLIMATE_MODIFIERS = { TEMPERATE: 1.0, TROPICAL: 1.2, ARID: 0.9, COLD: 0.7, VARIOUS: 1.0 };

// Difficulty Presets
export const DIFFICULTY_LEVELS = {
    EASY: {
        name: 'Containment Protocols',
        modifiers: { infectionRate: 0.8, cureSpeed: 1.5, mortalityRate: 0.5, pointGeneration: 1.5 }
    },
    MEDIUM: {
        name: 'Real World',
        modifiers: { infectionRate: 1.0, cureSpeed: 1.0, mortalityRate: 1.0, pointGeneration: 1.0 }
    },
    HARD: {
        name: 'Biological Warfare',
        modifiers: { infectionRate: 1.5, cureSpeed: 0.8, mortalityRate: 1.5, pointGeneration: 0.8 }
    }
};

function gameReducer(state, action) {
    switch (action.type) {
        case 'START_INFECTION': {
            const { countryId, difficulty } = action.payload;
            const difficultyMods = DIFFICULTY_LEVELS[difficulty]?.modifiers || DIFFICULTY_LEVELS.MEDIUM.modifiers;

            return {
                ...state,
                status: 'RUNNING',
                modifiers: difficultyMods, // Set global modifiers
                countries: state.countries.map(c => {
                    if (c.id === countryId) {
                        return { ...c, infected: 1000, cured: c.population - 1000 };
                    }
                    return c;
                })
            };
        }
        case 'PURCHASE_REFORM': {
            const reformId = action.payload;
            const reform = REFORMS[reformId];
            if (!reform || state.globalStats.points < reform.cost || state.unlockedReforms.includes(reformId)) {
                return state;
            }

            // Apply modifiers multiplicatively
            const newModifiers = { ...state.modifiers };
            if (reform.effect?.infectionRate) newModifiers.infectionRate *= reform.effect.infectionRate;
            if (reform.effect?.cureSpeed) newModifiers.cureSpeed *= reform.effect.cureSpeed;
            if (reform.effect?.pointGeneration) newModifiers.pointGeneration *= reform.effect.pointGeneration;

            return {
                ...state,
                globalStats: {
                    ...state.globalStats,
                    points: state.globalStats.points - reform.cost
                },
                modifiers: newModifiers,
                unlockedReforms: [...state.unlockedReforms, reformId]
            };
        }
        case 'TICK': {
            let newTotalInfected = 0;
            let newTotalCured = 0;
            let newTotalDead = 0;
            let activeInfectionValues = 0;

            const nextCountries = state.countries.map(country => {
                let { population, infected, cured, dead = 0, density, climate } = country;

                if (infected > 0) {
                    activeInfectionValues++;

                    // 1. Spread with Modifiers
                    const densityMod = DENSITY_MODIFIERS[density] || 1;
                    const climateMod = CLIMATE_MODIFIERS[climate] || 1;
                    const modifiers = state.modifiers || { infectionRate: 1, cureSpeed: 1, mortalityRate: 1 };

                    // New Calculation: Risk based spread
                    const spreadAmount = Math.floor(
                        infected * SPREAD_RATE * densityMod * climateMod * modifiers.infectionRate * (cured / population)
                    );
                    const actualSpread = Math.min(spreadAmount, cured);

                    infected += actualSpread;
                    cured -= actualSpread;

                    // 2. Cure / Vaccine Logic
                    if (modifiers.cureSpeed > 1.0) {
                        const baseCure = Math.max(10, infected * 0.01);
                        const cureAmount = Math.floor(baseCure * modifiers.cureSpeed);
                        const actualCure = Math.min(cureAmount, infected);

                        infected -= actualCure;
                        cured += actualCure;
                    }

                    // 3. Mortality
                    const deathAmount = Math.floor(infected * MORTALITY_RATE * modifiers.mortalityRate);
                    const actualDeath = Math.min(deathAmount, infected);
                    infected -= actualDeath;
                    dead += actualDeath;
                }

                return { ...country, infected, cured, dead };
            });

            // Neighbor Spread
            nextCountries.forEach(source => {
                if (source.infected > 500) {
                    const modifiers = state.modifiers || { infectionRate: 1 };
                    source.neighbors?.forEach(nid => {
                        const neighbor = nextCountries.find(n => n.id === nid);
                        const spreadChance = 0.05 * modifiers.infectionRate;

                        if (neighbor && neighbor.infected === 0 && Math.random() < spreadChance) {
                            neighbor.infected = 50;
                            neighbor.cured -= 50;
                        }
                    });
                }
            });

            // Recalculate Totals
            nextCountries.forEach(c => {
                newTotalInfected += c.infected;
                newTotalCured += c.cured;
                newTotalDead += c.dead;
            });

            // Points Generation
            const pointsGained = activeInfectionValues > 0 ? Math.floor(POINTS_PER_TICK * (state.modifiers?.pointGeneration || 1)) : 0;

            const newStats = {
                ...state.globalStats,
                totalInfected: newTotalInfected,
                totalCured: newTotalCured,
                totalDead: newTotalDead,
                points: (state.globalStats.points || 0) + pointsGained,
                day: state.globalStats.day + 1
            };

            // Win/Loss Conditions
            let newStatus = state.status;
            if (state.status === 'RUNNING') {
                const totalPop = state.globalStats.totalPopulation; // Initial total
                if (newTotalInfected === 0 && newTotalDead < totalPop * 0.5) {
                    newStatus = 'VICTORY';
                } else if (newTotalDead >= totalPop * 0.9) {
                    newStatus = 'DEFEAT'; // Everyone dead
                } else if (newTotalInfected >= totalPop * 0.95) {
                    newStatus = 'DEFEAT'; // Everyone infected, cure failed
                }
            }

            return {
                ...state,
                countries: nextCountries,
                globalStats: newStats,
                status: newStatus
            };
        }
        default:
            return state;
    }
}

export const useGameEngine = () => {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    useEffect(() => {
        if (state.status !== 'RUNNING') return;
        const interval = setInterval(() => {
            dispatch({ type: 'TICK' });
        }, 1000);
        return () => clearInterval(interval);
    }, [state.status]);

    const startGame = useCallback((countryId, difficulty = 'MEDIUM') => {
        dispatch({ type: 'START_INFECTION', payload: { countryId, difficulty } });
    }, []);

    const purchaseReform = useCallback((reformId) => {
        dispatch({ type: 'PURCHASE_REFORM', payload: reformId });
    }, []);

    return {
        state,
        actions: { startGame, purchaseReform }
    };
};
