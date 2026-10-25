import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { REFORMS, DIFFICULTY_LEVELS } from '../hooks/useGameEngine';
import WorldMap from '../components/WorldMap';
import { ShieldCheck, Skull, Activity, Globe, Lock, Zap, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
    // Consume Global State from GameLayout
    const context = useOutletContext();
    const { state, actions, activeView, setActiveView } = context || {};

    // Fallback if context is missing (should not happen if wrapped correctly)
    if (!state || !actions) {
        return <div className="text-white p-10">Error: Game State not found.</div>;
    }

    // UI Local State
    const [selectedCountryId, setSelectedCountryId] = useState(null);
    const [showDifficultySelect, setShowDifficultySelect] = useState(false);
    const [pendingPatientZero, setPendingPatientZero] = useState(null);
    const [difficulty, setDifficulty] = useState('MEDIUM');

    // Real-time derivation of selected country stats
    const selectedCountry = state.countries.find(c => c.id === selectedCountryId);

    const handleCountrySelect = (country) => {
        if (state.status === 'SIMULATION PAUSED') {
            // Pending start - Open Difficulty Modal first
            setPendingPatientZero(country.id);
            setShowDifficultySelect(true);
        } else {
            setSelectedCountryId(country.id);
            // If we are in Map mode, clicking auto-opens Intel?
            if (activeView === 'MAP') {
                if (setActiveView) setActiveView('INTEL');
            }
        }
    };

    const confirmStartGame = () => {
        if (pendingPatientZero) {
            actions.startGame(pendingPatientZero, difficulty);
            setSelectedCountryId(pendingPatientZero);
            setShowDifficultySelect(false);
        }
    };

    const stats = state.globalStats || { totalPopulation: 0, totalInfected: 0, totalCured: 0, totalDead: 0, day: 0, points: 0 };

    return (
        <div className="h-full flex flex-col p-4 gap-4 text-gray-200 font-sans relative overflow-hidden bg-[#050505]">
            {/* Dashboard Stats Grid - Now with Cured & Dead */}
            <div className="grid grid-cols-6 gap-4 bg-gray-900/80 p-3 rounded border border-gray-800 z-10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <Globe className="text-blue-500" />
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase">Population</p>
                        <p className="font-mono text-sm">{Math.floor(stats.totalPopulation).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Activity className="text-red-500" />
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase">Infected</p>
                        <p className="font-mono text-sm text-red-500">{Math.floor(stats.totalInfected).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ShieldCheck className="text-green-500" />
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase">Cured</p>
                        <p className="font-mono text-sm text-green-500">{Math.floor(stats.totalCured).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Skull className="text-gray-500" />
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase">Dead</p>
                        <p className="font-mono text-sm text-gray-400">{Math.floor(stats.totalDead).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Zap className="text-yellow-500" />
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase">Research Pts</p>
                        <p className="font-mono text-sm text-yellow-500">{stats.points || 0}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                    <div className="px-3 py-1 bg-gray-800 rounded font-mono text-yellow-500 text-sm">Day {stats.day}</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 relative z-10">
                {/* Map Area - Expands if Side Panel is closed (MAP view) */}
                <motion.div
                    layout
                    className={`${activeView === 'MAP' ? 'col-span-12' : 'col-span-9'} relative flex flex-col border border-gray-800 bg-black/60 rounded overflow-hidden shadow-2xl transition-all duration-300`}
                >
                    <WorldMap
                        countries={state.countries}
                        onCountrySelect={handleCountrySelect}
                    />

                    {state.status === 'SIMULATION PAUSED' && !showDifficultySelect && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-black/90 p-6 border-2 border-red-500 rounded-lg shadow-[0_0_50px_rgba(239,68,68,0.4)] text-center"
                            >
                                <Activity className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
                                <h2 className="text-xl font-bold text-white mb-2">PANDEMIC SIMULATION READY</h2>
                                <p className="text-gray-400 text-sm mb-4">Select a country to initiate outbreak.</p>
                            </motion.div>
                        </div>
                    )}
                </motion.div>

                {/* Side Panel (Research OR Intel) */}
                <AnimatePresence mode="wait">
                    {activeView !== 'MAP' && (
                        <motion.div
                            key="side-panel"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="col-span-3 flex flex-col gap-4"
                        >
                            {/* RESEARCH VIEW */}
                            {activeView === 'RESEARCH' && (
                                <motion.div
                                    key="research-panel"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-gray-900/80 border border-gray-800 p-4 rounded overflow-hidden flex flex-col flex-1 backdrop-blur-md"
                                >
                                    <h2 className="text-xs font-bold text-yellow-500 mb-4 uppercase tracking-widest border-b border-gray-700 pb-2 flex items-center gap-2">
                                        <Lock size={12} /> Countermeasures
                                    </h2>

                                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {Object.values(REFORMS).map(reform => {
                                            const isUnlocked = state.unlockedReforms.includes(reform.id);
                                            const canAfford = stats.points >= reform.cost;

                                            return (
                                                <button
                                                    key={reform.id}
                                                    onClick={() => actions.purchaseReform(reform.id)}
                                                    disabled={isUnlocked}
                                                    className={`w-full text-left p-3 rounded border transition-all relative overflow-hidden group
                                                        ${isUnlocked
                                                            ? 'bg-green-900/20 border-green-500/50'
                                                            : canAfford
                                                                ? 'bg-blue-900/10 border-blue-500/30 hover:bg-blue-800/20 hover:border-blue-400'
                                                                : 'bg-gray-900/40 border-gray-800 opacity-50 cursor-not-allowed'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`text-xs font-bold ${isUnlocked ? 'text-green-400' : 'text-gray-200'}`}>{reform.name}</span>
                                                        <span className="text-[10px] font-mono text-yellow-500">{isUnlocked ? 'ACTIVE' : `${reform.cost} PTS`}</span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 leading-tight">{reform.description}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {/* INTEL VIEW */}
                            {activeView === 'INTEL' && (
                                <motion.div
                                    key="intel-panel"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-gray-900/80 border border-gray-800 p-4 rounded h-full overflow-y-auto backdrop-blur-md"
                                >
                                    <h2 className="text-xs font-bold text-blue-400 mb-4 uppercase tracking-widest border-b border-gray-700 pb-2">Surveillance Feed</h2>
                                    {selectedCountry ? (
                                        <div className="space-y-6">
                                            <div>
                                                <h1 className="text-2xl font-bold text-white leading-none mb-1">{selectedCountry.name}</h1>
                                                <span className="text-[10px] bg-blue-900/30 px-2 py-0.5 rounded text-blue-300 font-mono">{selectedCountry.population.toLocaleString()} POP</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-2 bg-gray-800/40 rounded border border-gray-700/50 text-center">
                                                    <span className="text-[10px] text-gray-500 block uppercase">Density</span>
                                                    <p className="font-mono text-xs text-gray-200">{selectedCountry.density}</p>
                                                </div>
                                                <div className="p-2 bg-gray-800/40 rounded border border-gray-700/50 text-center">
                                                    <span className="text-[10px] text-gray-500 block uppercase">Climate</span>
                                                    <p className="font-mono text-xs text-gray-200">{selectedCountry.climate}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 bg-black/20 p-3 rounded border border-gray-800">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-xs text-gray-400">Infection Rate</span>
                                                    <span className="text-lg font-bold text-red-500 font-mono">
                                                        {selectedCountry.population > 0
                                                            ? ((selectedCountry.infected / selectedCountry.population) * 100).toFixed(1)
                                                            : 0}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-red-500"
                                                        animate={{ width: `${(selectedCountry.infected / selectedCountry.population) * 100}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1 text-xs">
                                                <div className="flex justify-between p-2 bg-green-900/10 rounded">
                                                    <span className="text-green-500/80">Healthy</span>
                                                    <span className="font-mono text-green-400">{Math.floor(selectedCountry.cured).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between p-2 bg-red-900/10 rounded">
                                                    <span className="text-red-500/80">Infected</span>
                                                    <span className="font-mono text-red-400">{Math.floor(selectedCountry.infected).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between p-2 bg-gray-800/20 rounded">
                                                    <span className="text-gray-500">Deceased</span>
                                                    <span className="font-mono text-gray-400">{Math.floor(selectedCountry.dead || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-600 text-xs text-center opacity-50">
                                            <Globe size={32} className="mb-2 text-gray-700" strokeWidth={1} />
                                            <p>NO REGION SELECTED</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Difficulty Selection Modal */}
            <AnimatePresence>
                {showDifficultySelect && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-md"
                    >
                        <Gauge size={64} className="text-plague-accent mb-6" />
                        <h2 className="text-3xl font-bold text-white mb-2">Simulation Parameters</h2>
                        <p className="text-gray-400 mb-8">Select difficulty level for the outbreak scenario.</p>

                        <div className="grid grid-cols-3 gap-6 mb-8 w-full max-w-2xl px-8">
                            {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => (
                                <button
                                    key={key}
                                    onClick={() => setDifficulty(key)}
                                    className={`p-6 rounded border-2 flex flex-col items-center gap-4 transition-all
                                        ${difficulty === key
                                            ? 'bg-plague-panel border-plague-accent text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                            : 'bg-gray-900/50 border-gray-800 text-gray-500 hover:border-gray-600'}
                                     `}
                                >
                                    <span className="text-lg font-bold tracking-widest">{level.name}</span>
                                    <div className="text-xs space-y-1 text-center font-mono opacity-80">
                                        <p>Spread: x{level.modifiers.infectionRate}</p>
                                        <p>Cure: x{level.modifiers.cureSpeed}</p>
                                        <p>Pts: x{level.modifiers.pointGeneration}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={confirmStartGame}
                            className="px-12 py-4 bg-plague-accent text-black font-bold text-xl rounded uppercase tracking-widest hover:bg-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
                        >
                            Start Simulation
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* End Game Overlays */}
            <AnimatePresence>
                {state.status === 'VICTORY' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-50 bg-green-900/90 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm"
                    >
                        <ShieldCheck size={80} className="text-white mb-6" />
                        <h1 className="text-5xl font-bold text-white mb-4 tracking-tighter">VIRUS ELIMINATED</h1>
                        <p className="text-xl text-green-100 max-w-2xl mb-8">
                            Global Defense Initiative successful. The pathogen has been eradicated with minimal casualties.
                        </p>
                        <div className="flex gap-8 text-left bg-black/30 p-6 rounded-lg mb-8 border border-green-500/30">
                            <div>
                                <span className="text-xs text-green-400 uppercase">Survivors</span>
                                <p className="text-2xl font-mono text-white text-shadow">{Math.floor(stats.totalPopulation - stats.totalDead).toLocaleString()}</p>
                            </div>
                            <div>
                                <span className="text-xs text-green-400 uppercase">Casualties</span>
                                <p className="text-2xl font-mono text-white text-shadow">{Math.floor(stats.totalDead).toLocaleString()}</p>
                            </div>
                            <div>
                                <span className="text-xs text-green-400 uppercase">Duration</span>
                                <p className="text-2xl font-mono text-white text-shadow">{stats.day} Days</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-white text-green-900 font-bold rounded hover:bg-green-100 transition-colors"
                        >
                            INITIATE NEW SIMULATION
                        </button>
                    </motion.div>
                )}

                {state.status === 'DEFEAT' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-50 bg-red-900/90 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm"
                    >
                        <Skull size={80} className="text-white mb-6" />
                        <h1 className="text-5xl font-bold text-white mb-4 tracking-tighter">CRITICAL FAILURE</h1>
                        <p className="text-xl text-red-100 max-w-2xl mb-8">
                            Containment protocols failed. The pathogen has decimated the global population.
                        </p>
                        <div className="flex gap-8 text-left bg-black/30 p-6 rounded-lg mb-8 border border-red-500/30">
                            <div>
                                <span className="text-xs text-red-400 uppercase">Infected</span>
                                <p className="text-2xl font-mono text-white">{Math.floor(stats.totalInfected).toLocaleString()}</p>
                            </div>
                            <div>
                                <span className="text-xs text-red-400 uppercase">Casualties</span>
                                <p className="text-2xl font-mono text-white">{Math.floor(stats.totalDead).toLocaleString()}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-white text-red-900 font-bold rounded hover:bg-red-100 transition-colors"
                        >
                            RESTART SYSTEM
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
