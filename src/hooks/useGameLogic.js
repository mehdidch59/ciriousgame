import { useState, useEffect, useCallback } from 'react';
import initialCountries from '../data/pays.json';

// Game Constants
const TICK_RATE = 1000;
const POINTS_PER_TICK = 5;
const CLICK_MULTIPLIER = 500;
const WIN_THRESHOLD = 0.99; // 99% Cured to win
const LOSE_THRESHOLD = 0.90; // 90% Global Infection to lose (if we tracked that explicitly)

// Available Reforms / Shop Items
export const REFORMS = {
    masks: {
        id: 'masks',
        name: 'Mandat de Masques',
        cost: 50,
        description: 'Ralentit la propagation de l\'infection de 15%.',
        effect: (stats) => ({ ...stats, infectionRateMod: stats.infectionRateMod * 0.85 })
    },
    lockdown: {
        id: 'lockdown',
        name: 'Confinement National',
        cost: 150,
        description: 'Réduit drastiquement la propagation. Génération de points réduite.',
        effect: (stats) => ({ ...stats, infectionRateMod: stats.infectionRateMod * 0.4, pointGenMod: 0.5 })
    },
    vaccine_research: {
        id: 'vaccine_research',
        name: 'Recherche Vaccinale',
        cost: 200,
        description: 'Augmente la vitesse de guérison passive de 50%.',
        effect: (stats) => ({ ...stats, passiveCureMod: stats.passiveCureMod * 1.5 })
    },
    field_hospitals: {
        id: 'field_hospitals',
        name: 'Hôpitaux de Campagne',
        cost: 100,
        description: 'Augmente l\'efficacité de vos clics (+1000).',
        effect: (stats) => ({ ...stats, clickPower: stats.clickPower + 1000 })
    },
    drones: {
        id: 'drones',
        name: 'Drones de Soin',
        cost: 300,
        description: 'Automatise la guérison dans les zones critiques.',
        effect: (stats) => ({ ...stats, passiveCureMod: stats.passiveCureMod * 2.0 })
    }
};

export const useGameLogic = () => {
    // Game State
    const [stats, setStats] = useState({
        totalCured: 0,
        totalPopulation: 0,
        totalInfected: 0,
        points: 0,
        // Modifiers
        infectionRateMod: 1.0,
        passiveCureMod: 1.0,
        pointGenMod: 1.0,
        clickPower: CLICK_MULTIPLIER,
        // Meta
        gameState: 'PLAYING', // PLAYING, VICTORY, DEFEAT
        unlockedReforms: []
    });

    const [countries, setCountries] = useState(initialCountries.map(c => ({
        ...c,
        cured: 0,
        // Force infection start if not in JSON
        infected: c.infected || c.population
    })));

    const [status, setStatus] = useState('SYSTEM ACTIVE // AWAITING INPUT');

    // Init Logic
    useEffect(() => {
        const totalPop = initialCountries.reduce((acc, c) => acc + c.population, 0);
        setStats(s => ({ ...s, totalPopulation: totalPop, totalInfected: totalPop }));
    }, []);

    // Main Loop
    useEffect(() => {
        if (stats.gameState !== 'PLAYING') return;

        const timer = setInterval(() => {
            setCountries(currentCountries => {
                let newTotalCured = 0;
                let newTotalInfected = 0;
                let activeInfection = false;

                const updatedCountries = currentCountries.map(country => {
                    let { cured, population, infected } = country;

                    // 1. Passive Cure Calculation
                    if (infected > 0) {
                        activeInfection = true;
                        // Base cure per tick, modified by upgrades
                        const cureAmount = Math.floor(100 * stats.passiveCureMod * (Math.random() * 0.5 + 0.8));

                        // Apply Cure
                        cured = Math.min(population, cured + cureAmount);
                        infected = Math.max(0, population - cured);
                    }

                    // 2. Infection Pushback (The Challenge)
                    // If infection is high, it fights back against the cure slightly? 
                    // Simplifying for "Savior Mode": You just race against time/limited resources unless simulation is complex.
                    // Let's make Infection grow if Cure is low?
                    // For now, let's keep it simple: Pure Cure Race.

                    newTotalCured += cured;
                    newTotalInfected += infected;

                    return { ...country, cured, infected };
                });

                // Update Stats
                setStats(prevStats => {
                    // Points Generation
                    const pointGain = activeInfection ? Math.floor(POINTS_PER_TICK * prevStats.pointGenMod) : 0;

                    // Win Condition
                    const curePercent = newTotalCured / prevStats.totalPopulation;
                    if (curePercent >= WIN_THRESHOLD) {
                        setStatus('MISSION ACCOMPLISHED // PATHOGEN ELIMINATED');
                        return { ...prevStats, totalCured: newTotalCured, totalInfected: newTotalInfected, gameState: 'VICTORY' };
                    }

                    return {
                        ...prevStats,
                        totalCured: newTotalCured,
                        totalInfected: newTotalInfected,
                        points: prevStats.points + pointGain
                    };
                });

                return updatedCountries;
            });
        }, TICK_RATE);

        return () => clearInterval(timer);
    }, [stats.passiveCureMod, stats.pointGenMod, stats.gameState]);

    // Actions
    const clickCountry = useCallback((id) => {
        if (stats.gameState !== 'PLAYING') return;

        setCountries(prev => prev.map(c => {
            if (c.id === id && c.infected > 0) {
                const boost = stats.clickPower;
                const newCured = Math.min(c.population, c.cured + boost);
                const newInfected = Math.max(0, c.population - newCured);
                return { ...c, cured: newCured, infected: newInfected };
            }
            return c;
        }));
        setStats(s => ({ ...s, points: s.points + 1 })); // Small click bonus
    }, [stats.clickPower, stats.gameState]);

    const purchaseReform = useCallback((reformId) => {
        const reform = REFORMS[reformId];
        if (!reform) return;

        setStats(current => {
            if (current.unlockedReforms.includes(reformId)) return current; // Already bought
            if (current.points < reform.cost) {
                setStatus(`INSUFFICIENT FUNDS // NEED ${reform.cost} PTS`);
                return current;
            }

            // Apply Effect
            let newStats = {
                ...current,
                points: current.points - reform.cost,
                unlockedReforms: [...current.unlockedReforms, reformId]
            };

            // Execute the reform's specific stat modifier function
            newStats = reform.effect(newStats);

            setStatus(`REFORM ENACTED: ${reform.name.toUpperCase()}`);
            return newStats;
        });
    }, []);

    const restartGame = useCallback(() => {
        window.location.reload(); // Simple restart for now
    }, []);

    return {
        countries,
        stats,
        status,
        actions: {
            clickCountry,
            purchaseReform,
            restartGame
        }
    };
};
